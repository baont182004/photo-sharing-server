// src/pages/public/Home.jsx
import React from "react";
import { Paper, Typography } from "@mui/material";
import { getUser } from "../../config/api";

export default function Home() {
    const user = getUser();

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Photo Sharing
            </Typography>

            {!user ? (
                <Typography>
                    Bạn chưa đăng nhập
                </Typography>
            ) : (
                <Typography>
                    Xin chào <b>{user.first_name} {user.last_name}</b> ({user.role || "user"}).
                    Dùng menu phía trên để xem Users, Photos, Comments.
                </Typography>
            )}
        </Paper>
    );
}
