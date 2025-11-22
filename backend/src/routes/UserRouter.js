import express from "express";
import models from "../modelData/models.js";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/list", async (req, res) => {
    const users = models.userListModel();
    res.status(200).json(users);
});

app.get("/:id", async (req, res) => {
    const userId = req.params.id;
    const user = models.userModel(userId);
    res.status(200).json(user);
});

export default app;