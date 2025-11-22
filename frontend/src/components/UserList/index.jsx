import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Box
} from "@mui/material";
import "./styles.css";
import fetchModel from "../../lib/fetchModelData";

function UserList() {
  const [users, setUsers] = useState(null);
  const [allPhotos, setAllPhotos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchModel("/user/list", (data) => {
      setUsers(data);

      // Fetch all photos for all users to calculate counts
      if (data && data.length > 0) {
        const photoPromises = data.map(user => {
          return new Promise((resolve) => {
            fetchModel(`/photosOfUser/${user._id}`, (photos) => {
              resolve(photos || []);
            });
          });
        });

        Promise.all(photoPromises).then(photosArrays => {
          const flatPhotos = photosArrays.flat();
          setAllPhotos(flatPhotos);
        });
      }
    });
  }, []);

  const getPhotoCount = (userId) => {
    return allPhotos.filter(photo => photo.user_id === userId).length;
  };

  const getCommentCount = (userId) => {
    let count = 0;
    allPhotos.forEach(photo => {
      if (photo.comments) {
        count += photo.comments.filter(comment => comment.user._id === userId).length;
      }
    });
    return count;
  };

  const handleCommentBubbleClick = (e, userId) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/comments/${userId}`);
  };

  if (!users) {
    return <div>Loading...</div>;
  }

  return (
    <Paper className="user-list-root">
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
                <Box className="count-bubbles-container">
                  <span className="count-bubble count-bubble-green">
                    {photoCount}
                  </span>
                  <span
                    className="count-bubble count-bubble-red"
                    onClick={(e) => handleCommentBubbleClick(e, user._id)}
                  >
                    {commentCount}
                  </span>
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

export default UserList;
