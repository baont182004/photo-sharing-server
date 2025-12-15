// src/pages/users/UserPhotos.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
    Typography,
    Paper,
    List,
    ListItem,
    ListItemText,
    Divider,
    CardMedia,
    TextField,
    Button,
    Box,
} from "@mui/material";
import { api, getUser, imageUrl } from "../../config/api";

function fmt(dt) {
    if (!dt) return "";
    try {
        return new Date(dt).toLocaleString();
    } catch {
        return String(dt);
    }
}

export default function UserPhotos() {
    const { userId } = useParams();
    const me = getUser();

    const [photos, setPhotos] = useState(null);
    const [draft, setDraft] = useState({});
    const [submitting, setSubmitting] = useState({});
    useEffect(() => {
        let alive = true;

        (async () => {
            const data = await api.get(`/photosOfUser/${userId}`);
            if (alive) setPhotos(data);
        })();

        return () => {
            alive = false;
        };
    }, [userId]);

    const onChangeDraft = (photoId) => (e) =>
        setDraft((p) => ({ ...p, [photoId]: e.target.value }));

    const submitComment = async (photoId) => {
        const text = (draft[photoId] || "").trim();
        if (!text) return;

        setSubmitting((p) => ({ ...p, [photoId]: true }));
        try {
            const updatedPhoto = await api.post(`/commentsOfPhoto/${photoId}`, {
                comment: text,
            });

            setPhotos((prev) =>
                (prev || []).map((p) => (p._id === photoId ? updatedPhoto : p))
            );

            setDraft((p) => ({ ...p, [photoId]: "" }));
        } catch (e) {
            alert(e.message);
        } finally {
            setSubmitting((p) => ({ ...p, [photoId]: false }));
        }
    };

    if (!photos) return <div>Loading...</div>;

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {photos.map((photo) => (
                <Paper key={photo._id} sx={{ p: 2, maxWidth: 720, mx: "auto" }}>
                    <CardMedia
                        component="img"
                        image={imageUrl(photo.file_name)}
                        alt={photo.file_name}
                        sx={{
                            width: "100%",
                            height: { xs: 240, sm: 360, md: 480 },
                            objectFit: "contain",
                            borderRadius: 2,
                            bgcolor: "grey.100",
                        }}
                    />

                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        {fmt(photo.date_time)}
                    </Typography>

                    {/* Comments */}
                    {photo.comments && photo.comments.length > 0 && (
                        <List sx={{ mt: 1 }}>
                            {photo.comments.map((comment) => {
                                const u = comment.user || comment.user_id; // tương thích cả 2 dạng
                                return (
                                    <React.Fragment key={comment._id}>
                                        <ListItem alignItems="flex-start">
                                            <ListItemText
                                                primary={
                                                    u?._id ? (
                                                        <Link to={`/users/${u._id}`}>
                                                            {u.first_name} {u.last_name}
                                                        </Link>
                                                    ) : (
                                                        "Unknown user"
                                                    )
                                                }
                                                secondary={
                                                    <>
                                                        <Typography variant="caption" display="block">
                                                            {fmt(comment.date_time)}
                                                        </Typography>
                                                        {comment.comment}
                                                    </>
                                                }
                                            />
                                        </ListItem>
                                        <Divider component="li" />
                                    </React.Fragment>
                                );
                            })}
                        </List>
                    )}

                    {/* Add comment */}
                    {me && (
                        <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Write a comment..."
                                value={draft[photo._id] || ""}
                                onChange={onChangeDraft(photo._id)}
                            />
                            <Button
                                variant="contained"
                                onClick={() => submitComment(photo._id)}
                                disabled={!!submitting[photo._id]}
                            >
                                Post
                            </Button>
                        </Box>
                    )}
                </Paper>
            ))}
        </Box>
    );
}
