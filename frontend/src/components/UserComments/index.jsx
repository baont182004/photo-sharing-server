import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
    Typography,
    Paper,
    Card,
    CardContent,
    CardMedia,
    Box,
    Divider
} from "@mui/material";
import "./styles.css";
import fetchModel from "../../lib/fetchModelData";

function UserComments() {
    const { userId } = useParams();
    const [user, setUser] = useState(null);
    const [allPhotos, setAllPhotos] = useState([]);
    const [userComments, setUserComments] = useState([]);

    useEffect(() => {

        fetchModel(`/user/${userId}`, (userData) => {
            setUser(userData);
        });

        fetchModel(`/user/list`, (users) => {
            if (users && users.length > 0) {
                const photoPromises = users.map(u => {
                    return new Promise((resolve) => {
                        fetchModel(`/photosOfUser/${u._id}`, (photos) => {
                            resolve(photos || []);
                        });
                    });
                });

                Promise.all(photoPromises).then(photosArrays => {
                    const flatPhotos = photosArrays.flat();
                    setAllPhotos(flatPhotos);

                    // Extract comments by this user
                    const comments = [];
                    flatPhotos.forEach(photo => {
                        if (photo.comments) {
                            photo.comments.forEach(comment => {
                                if (comment.user._id === userId) {
                                    comments.push({
                                        ...comment,
                                        photo: photo
                                    });
                                }
                            });
                        }
                    });

                    // Sort by date_time (newest first)
                    comments.sort((a, b) => new Date(b.date_time) - new Date(a.date_time));
                    setUserComments(comments);
                });
            }
        });
    }, [userId]);

    if (!user || allPhotos.length === 0) {
        return <div>Loading...</div>;
    }

    return (
        <Paper className="user-comments-root">
            <Typography variant="h4" gutterBottom>
                Comments by {user.first_name} {user.last_name}
            </Typography>

            {userComments.length === 0 ? (
                <Typography variant="body1" color="textSecondary">
                    This user has not made any comments yet.
                </Typography>
            ) : (
                <Box className="comments-list">
                    {userComments.map((comment, index) => (
                        <Card key={comment._id} className="comment-card">
                            <Link
                                to={`/photos/${comment.photo.user_id}`}
                                className="comment-photo-link"
                            >
                                <CardMedia
                                    component="img"
                                    image={`/images/${comment.photo.file_name}`}
                                    alt={comment.photo.file_name}
                                    className="comment-photo-thumbnail"
                                />
                            </Link>
                            <CardContent className="comment-content">
                                <Link
                                    to={`/photos/${comment.photo.user_id}`}
                                    className="comment-text-link"
                                >
                                    <Typography variant="body1" className="comment-text">
                                        {comment.comment}
                                    </Typography>
                                </Link>
                                <Divider sx={{ my: 1 }} />
                                <Typography variant="caption" color="textSecondary" display="block">
                                    Commented on: {comment.date_time}
                                </Typography>
                                <Typography variant="caption" color="textSecondary" display="block">
                                    Photo taken: {comment.photo.date_time}
                                </Typography>
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            )}
        </Paper>
    );
}

export default UserComments;
