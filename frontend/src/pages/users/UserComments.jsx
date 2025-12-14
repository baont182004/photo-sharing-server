// src/pages/users/UserComments.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
    Typography,
    Paper,
    Card,
    CardContent,
    CardMedia,
    Box,
    Divider,
} from "@mui/material";
import { api, imageUrl } from "../../config/api";

function fmt(dt) {
    if (!dt) return "";
    try {
        return new Date(dt).toLocaleString();
    } catch {
        return String(dt);
    }
}

export default function UserComments() {
    const { userId } = useParams();
    const [user, setUser] = useState(null);
    const [allPhotos, setAllPhotos] = useState([]);
    const [userComments, setUserComments] = useState([]);

    useEffect(() => {
        let alive = true;

        (async () => {
            // 1) user detail
            const userData = await api.get(`/user/${userId}`);
            if (!alive) return;
            setUser(userData);

            // 2) list users
            const users = await api.get(`/user/list`);
            if (!alive) return;

            // 3) fetch photos of all users (đúng logic file bạn gửi)
            const arrays = await Promise.all(
                (users || []).map((u) => api.get(`/photosOfUser/${u._id}`).catch(() => []))
            );
            if (!alive) return;

            const flatPhotos = arrays.flat();
            setAllPhotos(flatPhotos);

            // 4) extract comments by this user
            const comments = [];
            flatPhotos.forEach((photo) => {
                (photo.comments || []).forEach((c) => {
                    const cid = c.user?._id || c.user_id;
                    if (cid === userId) {
                        comments.push({ ...c, photo });
                    }
                });
            });

            comments.sort((a, b) => new Date(b.date_time) - new Date(a.date_time));
            setUserComments(comments);
        })();

        return () => {
            alive = false;
        };
    }, [userId]);

    if (!user) return <div>Loading...</div>;

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h4" gutterBottom>
                Comments by {user.first_name} {user.last_name}
            </Typography>

            {userComments.length === 0 ? (
                <Typography variant="body1" color="text.secondary">
                    This user has not made any comments yet.
                </Typography>
            ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {userComments.map((comment) => (
                        <Card key={comment._id} sx={{ display: "flex" }}>
                            <Link to={`/photos/${comment.photo.user_id}`} style={{ display: "block" }}>
                                <CardMedia
                                    component="img"
                                    image={imageUrl(comment.photo.file_name)}
                                    alt={comment.photo.file_name}
                                    sx={{ width: 180, height: 120, objectFit: "cover" }}
                                />
                            </Link>

                            <CardContent sx={{ flexGrow: 1 }}>
                                <Link to={`/photos/${comment.photo.user_id}`} style={{ textDecoration: "none" }}>
                                    <Typography variant="body1" sx={{ color: "text.primary" }}>
                                        {comment.comment}
                                    </Typography>
                                </Link>

                                <Divider sx={{ my: 1 }} />

                                <Typography variant="caption" color="text.secondary" display="block">
                                    Commented on: {fmt(comment.date_time)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block">
                                    Photo taken: {fmt(comment.photo.date_time)}
                                </Typography>
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            )}
        </Paper>
    );
}
