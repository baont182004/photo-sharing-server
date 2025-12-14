// src/pages/public/Register.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Paper, TextField, Typography } from "@mui/material";
import { api } from "../../config/api";

export default function Register() {
    const nav = useNavigate();
    const [form, setForm] = useState({
        first_name: "",
        last_name: "",
        login_name: "",
        password: "",
        location: "",
        occupation: "",
        description: "",
    });
    const [err, setErr] = useState("");
    const [ok, setOk] = useState("");
    const [loading, setLoading] = useState(false);

    const onChange = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

    const onSubmit = async (e) => {
        e.preventDefault();
        setErr("");
        setOk("");
        setLoading(true);

        try {
            // userRoutes: POST /user (register)
            await api.post("/user", form);
            setOk("Đăng ký thành công. Mời bạn đăng nhập.");
            setTimeout(() => nav("/login"), 600);
        } catch (e2) {
            setErr(e2.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Paper sx={{ p: 3, maxWidth: 680, mx: "auto" }}>
            <Typography variant="h5" gutterBottom>
                Register
            </Typography>

            {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
            {ok && <Alert severity="success" sx={{ mb: 2 }}>{ok}</Alert>}

            <form onSubmit={onSubmit}>
                <TextField label="first_name" value={form.first_name} onChange={onChange("first_name")} fullWidth margin="normal" />
                <TextField label="last_name" value={form.last_name} onChange={onChange("last_name")} fullWidth margin="normal" />
                <TextField label="login_name" value={form.login_name} onChange={onChange("login_name")} fullWidth margin="normal" />
                <TextField label="password" type="password" value={form.password} onChange={onChange("password")} fullWidth margin="normal" />

                <TextField label="location" value={form.location} onChange={onChange("location")} fullWidth margin="normal" />
                <TextField label="occupation" value={form.occupation} onChange={onChange("occupation")} fullWidth margin="normal" />
                <TextField label="description" value={form.description} onChange={onChange("description")} fullWidth margin="normal" multiline minRows={3} />

                <Button type="submit" variant="contained" sx={{ mt: 2 }} disabled={loading}>
                    {loading ? "Creating..." : "Create account"}
                </Button>
            </form>
        </Paper>
    );
}
