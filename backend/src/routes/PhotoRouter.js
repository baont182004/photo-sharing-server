import express from "express";
import cors from "cors";
import models from "../modelData/models.js";
const app = express();
app.use(cors());
app.use(express.json());

app.get("/photosOfUser/:id", async (req, res) => {
    const userId = req.params.id;
    const photos = models.photoOfUserModel(userId);
    res.status(200).json(photos);
});

export default app;

