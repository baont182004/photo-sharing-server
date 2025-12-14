// src/pages/public/Login.jsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert, Button, Paper, TextField, Typography } from "@mui/material";
import { api, setAuth } from "../../config/api";

export default function Login() {
    const [login_name, setLoginName] = useState("");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);

    const nav = useNavigate();
    const loc = useLocation();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErr("");
        setLoading(true);

        try {
            // adminRoutes: POST /admin/login
            const data = await api.post("/admin/login", { login_name, password });
            // backend trả: { token, user }
            setAuth({ token: data.token, user: data.user });

            const goBack = loc.state?.from;
            nav(goBack || "/users");
        } catch (e2) {
            setErr(e2.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Paper sx={{ p: 3, maxWidth: 480, mx: "auto" }}>
            <Typography variant="h5" gutterBottom>
                Login
            </Typography>

            {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

            <form onSubmit={handleSubmit}>
                <TextField
                    label="login_name"
                    value={login_name}
                    onChange={(e) => setLoginName(e.target.value)}
                    fullWidth
                    margin="normal"
                />
                <TextField
                    label="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    fullWidth
                    margin="normal"
                />

                <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    sx={{ mt: 2 }}
                    disabled={loading}
                >
                    {loading ? "Signing in..." : "Sign in"}
                </Button>
            </form>
        </Paper>
    );
}
