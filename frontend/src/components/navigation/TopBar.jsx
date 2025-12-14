// src/components/navigation/TopBar.jsx
import React, { useEffect, useState } from "react";
import { AppBar, Toolbar, Typography } from "@mui/material";
import { Link, useMatch } from "react-router-dom";
import { api } from "../../config/api";

export default function TopBar() {
    const yourName = "Nguyễn Thái Bảo - B22DCAT032";
    const [contextText, setContextText] = useState("Photo Sharing");

    const photoMatch = useMatch("/photos/:userId");
    const userMatch = useMatch("/users/:userId");

    useEffect(() => {
        let alive = true;

        const matchedUserId = photoMatch?.params.userId || userMatch?.params.userId;
        if (!matchedUserId) {
            setContextText("Photo Sharing");
            return;
        }

        (async () => {
            try {
                const user = await api.get(`/user/${matchedUserId}`);
                if (!alive || !user) return;

                if (photoMatch) setContextText(`Ảnh của ${user.first_name} ${user.last_name}`);
                else if (userMatch) setContextText(`Chi tiết của ${user.first_name} ${user.last_name}`);
                else setContextText("Photo Sharing");
            } catch {
                if (alive) setContextText("Photo Sharing");
            }
        })();

        return () => {
            alive = false;
        };
    }, [photoMatch, userMatch]);

    return (
        <AppBar position="static">
            <Toolbar>
                <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
                    <Typography variant="h6" component="div">
                        {yourName}
                    </Typography>
                </Link>

                <div style={{ flexGrow: 1 }} />

                <Typography variant="h6" component="div">
                    {contextText}
                </Typography>
            </Toolbar>
        </AppBar>
    );
}
