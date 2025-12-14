import Photo from "../models/Photo.js";

// GET /photosOfUser/:id
export async function getPhotosOfUser(req, res) {
    try {
        const photos = await Photo.find({ user_id: req.params.id })
            .sort({ date_time: -1 })
            .populate("comments.user_id", "_id first_name last_name login_name")
            .lean();

        const shaped = photos.map((p) => ({
            ...p,
            comments: (p.comments || []).map((c) => ({
                _id: c._id,
                comment: c.comment,
                date_time: c.date_time,
                user: c.user_id,
            })),
        }));

        return res.status(200).json(shaped);
    } catch (err) {
        console.error("photosOfUser error:", err);
        return res.status(500).send("Server error");
    }
}

// POST /commentsOfPhoto/:photo_id
export async function addComment(req, res) {
    try {
        const { comment } = req.body || {};
        if (!comment || typeof comment !== "string" || comment.trim() === "") {
            return res.status(400).send("Empty comment");
        }

        const photo = await Photo.findById(req.params.photo_id);
        if (!photo) return res.status(400).send("Photo not found");

        const userId = req.user?._id;
        if (!userId) return res.sendStatus(401);

        photo.comments.push({
            comment: comment.trim(),
            date_time: new Date(),
            user_id: userId,
        });

        await photo.save();

        const updated = await Photo.findById(req.params.photo_id)
            .populate("comments.user_id", "_id first_name last_name login_name")
            .lean();

        const shaped = {
            ...updated,
            comments: (updated.comments || []).map((c) => ({
                _id: c._id,
                comment: c.comment,
                date_time: c.date_time,
                user: c.user_id,
            })),
        };

        return res.status(200).json(shaped);
    } catch (err) {
        console.error("addComment error:", err);
        return res.status(500).send("Server error");
    }
}
