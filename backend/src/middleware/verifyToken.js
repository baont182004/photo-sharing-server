import jwt from "jsonwebtoken";

const unauthorized = (res, message = "Authentication required", code = "unauthorized") =>
    res.status(401).json({ message, code });

export const verifyToken = (req, res, next) => {
    const raw = req.headers["authorization"] || req.headers["Authorization"];
    if (!raw || typeof raw !== "string") {
        return unauthorized(res);
    }

    const [scheme, token] = raw.split(" ");
    if (!token || scheme?.toLowerCase() !== "bearer") {
        return unauthorized(res);
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
            issuer: process.env.JWT_ISSUER || "photo-sharing-server",
        });

        const userId = decoded.sub || decoded._id || decoded.id;
        req.user = {
            _id: userId,
            id: userId,
            role: decoded.role || "user",
            login_name: decoded.login_name,
            tokenId: decoded.jti,
        };

        next();
    } catch (err) {
        console.error("verifyToken error:", err);
        if (err?.name === "TokenExpiredError") {
            return unauthorized(res, "Token expired", "token_expired");
        }
        return unauthorized(res, "Invalid token", "invalid_token");
    }
};

export const verifyAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user?.role === "admin") next();
        else res.status(403).json({ message: "Admin privilege required", code: "forbidden" });
    });
};
