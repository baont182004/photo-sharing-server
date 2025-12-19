import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import RefreshToken from "../models/RefreshToken.js";

const ACCESS_TOKEN_TTL = process.env.JWT_ACCESS_TTL || process.env.JWT_EXPIRES_IN || "15m";
const parsedRefreshDays = Number(process.env.JWT_REFRESH_TTL_DAYS || process.env.JWT_REFRESH_TTL);
const REFRESH_TOKEN_TTL_DAYS = Number.isFinite(parsedRefreshDays) && parsedRefreshDays > 0 ? parsedRefreshDays : 7;
const REFRESH_TOKEN_TTL_MS = REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;
const REFRESH_COOKIE_NAME = "refresh_token";
const JWT_ISSUER = process.env.JWT_ISSUER || "photo-sharing-server";
const parsedSaltRounds = parseInt(process.env.PASSWORD_SALT_ROUNDS || "12", 10);
const SALT_ROUNDS = Number.isFinite(parsedSaltRounds) && parsedSaltRounds > 0 ? parsedSaltRounds : 12;
const refreshCookieOptions = {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true" || process.env.NODE_ENV === "production",
    sameSite: (process.env.COOKIE_SAMESITE || "lax"),
    maxAge: REFRESH_TOKEN_TTL_MS,
    path: "/",
};

const buildUserResponse = (user) => ({
    _id: user._id,
    login_name: user.login_name,
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.role || "user",
    location: user.location || "",
    description: user.description || "",
    occupation: user.occupation || "",
});

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const signAccessToken = (user) =>
    jwt.sign(
        {
            sub: user._id.toString(),
            role: user.role || "user",
        },
        process.env.JWT_SECRET,
        {
            expiresIn: ACCESS_TOKEN_TTL,
            issuer: JWT_ISSUER,
            jwtid: crypto.randomBytes(12).toString("hex"),
        }
    );

const setRefreshCookie = (res, token) => {
    res.cookie(REFRESH_COOKIE_NAME, token, refreshCookieOptions);
};

const clearRefreshCookie = (res) => {
    res.clearCookie(REFRESH_COOKIE_NAME, { ...refreshCookieOptions, maxAge: 0 });
};

const revokeTokenDoc = async (doc, replacedByTokenHash = null) => {
    if (!doc) return;
    doc.revoked = true;
    if (replacedByTokenHash) {
        doc.replacedByToken = replacedByTokenHash;
    }
    await doc.save();
};

const persistRefreshToken = async ({ user, token, userAgent, ip }) => {
    const tokenHash = hashToken(token);
    await RefreshToken.create({
        user: user._id,
        tokenHash,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
        userAgent: userAgent?.slice(0, 256) || "",
        ip: ip || "",
    });
    return tokenHash;
};

export async function login(req, res) {
    try {
        const { login_name, password } = req.body || {};
        const normalizedLogin = typeof login_name === "string" ? login_name.trim() : "";
        const plainPassword = typeof password === "string" ? password : "";

        if (!normalizedLogin || !plainPassword) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const user = await User.findOne({ login_name: normalizedLogin }).select("+password");
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        let passwordValid = false;
        const isHashed = user.password?.startsWith("$2");

        if (isHashed) {
            passwordValid = await bcrypt.compare(plainPassword, user.password);
        } else {
            passwordValid = plainPassword === user.password;
            if (passwordValid) {
                user.password = await bcrypt.hash(plainPassword, SALT_ROUNDS);
                await user.save();
            }
        }

        if (!passwordValid) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        await RefreshToken.deleteMany({ user: user._id });

        const accessToken = signAccessToken(user);

        const refreshTokenValue = crypto.randomBytes(64).toString("hex");
        await persistRefreshToken({
            user,
            token: refreshTokenValue,
            userAgent: req.headers["user-agent"],
            ip: req.ip,
        });

        setRefreshCookie(res, refreshTokenValue);

        return res.status(200).json({
            accessToken,
            user: buildUserResponse(user),
        });
    } catch (err) {
        console.error("login error:", err);
        return res.status(500).json({ message: "Server error" });
    }
}

export async function refresh(req, res) {
    try {
        const tokenFromCookie = req.cookies?.[REFRESH_COOKIE_NAME];
        if (!tokenFromCookie) {
            return res.status(401).json({ message: "Not authenticated" });
        }

        const tokenHash = hashToken(tokenFromCookie);
        const existing = await RefreshToken.findOne({ tokenHash });

            if (!existing || existing.revoked || existing.expiresAt < new Date()) {
                if (existing) await revokeTokenDoc(existing);
                clearRefreshCookie(res);
                return res.status(401).json({ message: "Session expired" });
            }

        const user = await User.findById(existing.user);
        if (!user) {
            await revokeTokenDoc(existing);
            clearRefreshCookie(res);
            return res.status(401).json({ message: "Not authenticated" });
        }

        const newRefreshToken = crypto.randomBytes(64).toString("hex");
        const newRefreshHash = hashToken(newRefreshToken);

        await revokeTokenDoc(existing, newRefreshHash);

        await persistRefreshToken({
            user,
            token: newRefreshToken,
            userAgent: req.headers["user-agent"],
            ip: req.ip,
        });

        const accessToken = signAccessToken(user);
        setRefreshCookie(res, newRefreshToken);

        return res.status(200).json({
            accessToken,
            user: buildUserResponse(user),
        });
    } catch (err) {
        console.error("refresh error:", err);
        return res.status(500).json({ message: "Server error" });
    }
}

export async function logout(req, res) {
    try {
        const tokenFromCookie = req.cookies?.[REFRESH_COOKIE_NAME];
        if (tokenFromCookie) {
            const tokenHash = hashToken(tokenFromCookie);
            await RefreshToken.updateOne({ tokenHash }, { $set: { revoked: true } });
        }

        clearRefreshCookie(res);
        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("logout error:", err);
        return res.status(500).json({ message: "Server error" });
    }
}

export async function me(req, res) {
    try {
        const userId = req.user?._id || req.user?.id;
        if (!userId) return res.status(401).json({ message: "Authentication required" });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        return res.status(200).json(buildUserResponse(user));
    } catch (err) {
        console.error("me error:", err);
        return res.status(500).json({ message: "Server error" });
    }
}
