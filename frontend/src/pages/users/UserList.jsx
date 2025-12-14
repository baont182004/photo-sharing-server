// src/pages/users/UserList.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Typography,
    Paper,
    List,
    ListItem,
    ListItemText,
    Divider,
    Box,
} from "@mui/material";
import { api } from "../../config/api";

export default function UserList() {
    const [users, setUsers] = useState(null);
    const [allPhotos, setAllPhotos] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        let alive = true;

        (async () => {
            const data = await api.get("/user/list");
            if (!alive) return;
            setUsers(data);

            if (data && data.length > 0) {
                const arrays = await Promise.all(
                    data.map((u) => api.get(`/photosOfUser/${u._id}`).catch(() => []))
                );
                if (!alive) return;
                setAllPhotos(arrays.flat());
            }
        })();

        return () => {
            alive = false;
        };
    }, []);

    const getPhotoCount = (userId) => allPhotos.filter((p) => p.user_id === userId).length;

    const getCommentCount = (userId) => {
        let count = 0;
        allPhotos.forEach((p) => {
            const comments = p.comments || [];
            count += comments.filter((c) => (c.user?._id || c.user_id) === userId).length;
        });
        return count;
    };

    const handleCommentBubbleClick = (e, userId) => {
        e.preventDefault();
        e.stopPropagation();
        navigate(`/comments/${userId}`);
    };

    if (!users) return <div>Loading...</div>;

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5" gutterBottom>
                Users
            </Typography>

            <List>
                {users.map((user) => {
                    const photoCount = getPhotoCount(user._id);
                    const commentCount = getCommentCount(user._id);

                    return (
                        <React.Fragment key={user._id}>
                            <ListItem button component={Link} to={`/users/${user._id}`}>
                                <ListItemText
                                    primary={`${user.first_name} ${user.last_name}`}
                                    secondary={user.occupation}
                                />

                                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                                    <Box
                                        sx={{
                                            px: 1,
                                            py: 0.3,
                                            borderRadius: 2,
                                            bgcolor: "success.main",
                                            color: "white",
                                            fontSize: 12,
                                            minWidth: 28,
                                            textAlign: "center",
                                        }}
                                        title="Photo count"
                                    >
                                        {photoCount}
                                    </Box>

                                    <Box
                                        sx={{
                                            px: 1,
                                            py: 0.3,
                                            borderRadius: 2,
                                            bgcolor: "error.main",
                                            color: "white",
                                            fontSize: 12,
                                            minWidth: 28,
                                            textAlign: "center",
                                            cursor: "pointer",
                                        }}
                                        title="Comment count (click)"
                                        onClick={(e) => handleCommentBubbleClick(e, user._id)}
                                    >
                                        {commentCount}
                                    </Box>
                                </Box>
                            </ListItem>
                            <Divider component="li" />
                        </React.Fragment>
                    );
                })}
            </List>
        </Paper>
    );
}
