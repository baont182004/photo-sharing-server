import bcrypt from "bcryptjs";
import User from "../models/User.js";

const SALT_ROUNDS = parseInt(process.env.PASSWORD_SALT_ROUNDS || "12", 10);

// Get /user/list
export async function getUserList(req, res) {
    try {
        const users = await User.find({}, "_id first_name last_name").lean();
        return res.status(200).json(users);
    } catch (error) {
        console.error("Error fetching user list:", error);
        return res.status(500).json({ error: error.message });
    }
}

//Get /user/:id
export async function getUserById(req, res) {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId, "_id first_name last_name location description occupation login_name").lean();
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        return res.status(200).json(user);
    } catch (error) {
        console.error("Error fetching user by ID:", error);
        return res.status(500).json({ error: error.message });
    }
}

// POST /user  (register)
export async function register(req, res) {
    try {
        const {
            login_name,
            password,
            first_name,
            last_name,
            location = "",
            description = "",
            occupation = "",
        } = req.body || {};

        // Validate theo spec: login_name unique, password/first/last non-empty
        if (!login_name || typeof login_name !== "string" || login_name.trim() === "") {
            return res.status(400).json({ error: "login_name is required" });
        }
        if (!password || typeof password !== "string" || password.trim() === "") {
            return res.status(400).json({ error: "password is required" });
        }
        if (!first_name || typeof first_name !== "string" || first_name.trim() === "") {
            return res.status(400).json({ error: "first_name is required" });
        }
        if (!last_name || typeof last_name !== "string" || last_name.trim() === "") {
            return res.status(400).json({ error: "last_name is required" });
        }

        const existed = await User.findOne({ login_name: login_name.trim() }).lean();
        if (existed) {
            return res.status(400).json({ error: "login_name already exists" });
        }

        const passwordHash = await bcrypt.hash(password.trim(), SALT_ROUNDS);

        const user = await User.create({
            login_name: login_name.trim(),
            password: passwordHash,
            first_name: first_name.trim(),
            last_name: last_name.trim(),
            location,
            description,
            occupation,
        });

        return res.status(200).json({
            _id: user._id,
            login_name: user.login_name,
            first_name: user.first_name,
            last_name: user.last_name,
            location: user.location,
            description: user.description,
            occupation: user.occupation,
            role: user.role,
        });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(400).json({ error: "login_name already exists" });
        }
        console.error("Error register:", error);
        return res.status(500).json({ error: error.message });
    }
}
