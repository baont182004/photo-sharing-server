import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    Alert,
    Box,
    Button,
    Divider,
    Paper,
    TextField,
    Typography,
} from "@mui/material";
import { api, setAuth } from "../../config/api";

const emptyRegister = {
    first_name: "",
    last_name: "",
    login_name: "",
    password: "",
    location: "",
    occupation: "",
    description: "",
};

export default function LoginRegister() {
    const nav = useNavigate();
    const loc = useLocation();

    // ===== LOGIN STATE =====
    const [login_name, setLoginName] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [loginErr, setLoginErr] = useState("");
    const [loginLoading, setLoginLoading] = useState(false);

    // ===== REGISTER STATE =====
    const [reg, setReg] = useState(emptyRegister);
    const [regPassword2, setRegPassword2] = useState("");
    const [regErr, setRegErr] = useState("");
    const [regOk, setRegOk] = useState("");
    const [regLoading, setRegLoading] = useState(false);

    const passwordsMatch = useMemo(() => {
        if (!reg.password && !regPassword2) return true;
        return reg.password === regPassword2;
    }, [reg.password, regPassword2]);

    const onLogin = async (e) => {
        e.preventDefault();
        setLoginErr("");
        setLoginLoading(true);

        try {
            const data = await api.post("/admin/login", {
                login_name,
                password: loginPassword,
            });

            setAuth({ accessToken: data.accessToken, user: data.user });

            const goBack = loc.state?.from;
            nav(goBack || `/users/${data.user._id}`);
        } catch (err) {
            setLoginErr(err.message);
        } finally {
            setLoginLoading(false);
        }
    };

    const onRegChange = (k) => (e) =>
        setReg((p) => ({ ...p, [k]: e.target.value }));

    const onRegister = async (e) => {
        e.preventDefault();
        setRegErr("");
        setRegOk("");

        if (!passwordsMatch) {
            setRegErr("Hai mật khẩu không khớp. Vui lòng nhập lại.");
            return;
        }

        setRegLoading(true);
        try {
            await api.post("/user", {
                login_name: reg.login_name,
                password: reg.password,
                first_name: reg.first_name,
                last_name: reg.last_name,
                location: reg.location,
                description: reg.description,
                occupation: reg.occupation,
            });

            setRegOk('Đăng ký thành công. Bạn có thể đăng nhập ngay.');
            setReg(emptyRegister);
            setRegPassword2("");

            setLoginName(reg.login_name);
            setLoginPassword("");
        } catch (err) {
            setRegErr(err.message);
        } finally {
            setRegLoading(false);
        }
    };

    return (
        <Paper sx={{ p: 3, maxWidth: 760, mx: "auto" }}>

            {/* ===== LOGIN ===== */}
            <Box component="form" onSubmit={onLogin} sx={{ mt: 1 }}>
                <Typography variant="h6">Login</Typography>

                {loginErr && (
                    <Alert severity="error" sx={{ mt: 1 }}>
                        {loginErr}
                    </Alert>
                )}

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
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    fullWidth
                    margin="normal"
                />

                <Button
                    type="submit"
                    variant="contained"
                    sx={{ mt: 1 }}
                    disabled={loginLoading}
                >
                    {loginLoading ? "Signing in..." : "Sign in"}
                </Button>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* ===== REGISTER ===== */}
            <Box component="form" onSubmit={onRegister}>
                <Typography variant="h6">Register</Typography>

                {regErr && (
                    <Alert severity="error" sx={{ mt: 1 }}>
                        {regErr}
                    </Alert>
                )}
                {regOk && (
                    <Alert severity="success" sx={{ mt: 1 }}>
                        {regOk}
                    </Alert>
                )}

                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mt: 1 }}>
                    <TextField label="first_name" value={reg.first_name} onChange={onRegChange("first_name")} />
                    <TextField label="last_name" value={reg.last_name} onChange={onRegChange("last_name")} />
                    <TextField label="login_name" value={reg.login_name} onChange={onRegChange("login_name")} />
                    <TextField
                        label="password"
                        type="password"
                        value={reg.password}
                        onChange={onRegChange("password")}
                    />

                    <TextField
                        label="password (again)"
                        type="password"
                        value={regPassword2}
                        onChange={(e) => setRegPassword2(e.target.value)}
                        error={!passwordsMatch}
                        helperText={!passwordsMatch ? "Passwords must match" : " "}
                    />

                    <TextField label="location" value={reg.location} onChange={onRegChange("location")} />
                    <TextField label="occupation" value={reg.occupation} onChange={onRegChange("occupation")} />
                </Box>

                <TextField
                    label="description"
                    value={reg.description}
                    onChange={onRegChange("description")}
                    fullWidth
                    margin="normal"
                    multiline
                    minRows={3}
                />

                <Button
                    type="submit"
                    variant="contained"
                    sx={{ mt: 1 }}
                    disabled={regLoading || !passwordsMatch}
                >
                    {regLoading ? "Registering..." : "Register Me"}
                </Button>
            </Box>
        </Paper>
    );
}
