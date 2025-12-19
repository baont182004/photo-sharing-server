import express from "express";
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";
import helmet from "helmet";

import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import photoRoutes from "./routes/photoRoutes.js";

const app = express();
app.set("trust proxy", 1);

const allowedOrigins = (process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN || "http://localhost:3000,http://localhost:5173")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
};

app.use(
    helmet({
        crossOriginResourcePolicy: false,
    })
);

app.use(cors(corsOptions));

app.use(cookieParser());
app.use(express.json());

app.use("/images", express.static(path.join(process.cwd(), "images")));

app.use("/admin", adminRoutes);
app.use("/user", userRoutes);
app.use("/", photoRoutes);

export default app;
