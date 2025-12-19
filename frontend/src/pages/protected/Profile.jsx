// src/pages/protected/Profile.jsx
import React, { useEffect, useState } from "react";
import { Paper, Typography } from "@mui/material";
import { api, getUser } from "../../config/api";

export default function Profile() {
    const [authUser, setAuthUser] = useState(getUser());
    const [detail, setDetail] = useState(null);

    useEffect(() => {
        const onAuthChange = () => setAuthUser(getUser());
        window.addEventListener("authchange", onAuthChange);
        return () => window.removeEventListener("authchange", onAuthChange);
    }, []);

    useEffect(() => {
        let alive = true;
        if (!authUser?._id) return;

        (async () => {
            try {
                const u = await api.get(`/user/${authUser._id}`);
                if (alive) setDetail(u);
            } catch {
                if (alive) setDetail(null);
            }
        })();

        return () => { alive = false; };
    }, [authUser?._id]);

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
                Profile
            </Typography>

            <Typography>
                Logged in as: <b>{authUser?.first_name} {authUser?.last_name}</b> ({authUser?.role || "user"})
            </Typography>

            {detail && (
                <>
                    <Typography sx={{ mt: 2 }}>Location: {detail.location}</Typography>
                    <Typography>Occupation: {detail.occupation}</Typography>
                    <Typography>Description: {detail.description}</Typography>
                    <Typography>login_name: {detail.login_name}</Typography>
                </>
            )}
        </Paper>
    );
}
