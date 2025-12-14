import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { getPhotosOfUser, addComment } from "../controllers/photoController.js";

const router = express.Router();

router.use((req, res, next) => {
    if (req.path.startsWith("/images/")) return next();
    return verifyToken(req, res, next);
});
router.get("/photosOfUser/:id", getPhotosOfUser);
router.post("/commentsOfPhoto/:photo_id", addComment);

export default router;
