import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/user", (await import("./routes/UserRouter.js")).default);
app.use("/", (await import("./routes/PhotoRouter.js")).default);

export default app;