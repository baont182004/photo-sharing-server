// src/layouts/AppLayout.jsx
import React, { useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { Box, Button } from "@mui/material";
import TopBar from "../components/navigation/TopBar";
import { api, clearAuth, getUser } from "../config/api";

export default function AppLayout() {
    const navigate = useNavigate();
    const [user, setUser] = useState(getUser());

    useEffect(() => {
        const onAuthChange = () => setUser(getUser());
        window.addEventListener("authchange", onAuthChange);
        return () => window.removeEventListener("authchange", onAuthChange);
    }, []);

    const handleLogout = async () => {
        try {
            await api.post("/admin/logout", {});
        } catch {
        } finally {
            clearAuth();
            navigate("/login");
        }
    };

    return (
        <>
            <TopBar />

            <Box
                sx={{
                    px: 2,
                    py: 1,
                    display: "flex",
                    gap: 1,
                    alignItems: "center",
                    flexWrap: "wrap",
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                }}
            >
                <Button component={Link} to="/" variant="text">
                    Home
                </Button>

                {user && (
                    <Button component={Link} to="/users" variant="text">
                        Người dùng
                    </Button>
                )}

                {user && (
                    <Button component={Link} to="/profile" variant="text">
                        Hồ sơ
                    </Button>
                )}

                {user?.role === "admin" && (
                    <Button component={Link} to="/admin" variant="text">
                        Quản trị
                    </Button>
                )}

                <Box sx={{ flexGrow: 1 }} />

                {!user ? (
                    <Button component={Link} to="/loginregister" variant="contained">
                        Đăng nhập/Đăng ký
                    </Button>
                ) : (
                    <Button onClick={handleLogout} color="error" variant="contained">
                        Đăng xuất
                    </Button>
                )}
            </Box>

            <Box sx={{ p: 2 }}>
                <Outlet />
            </Box>
        </>
    );
}
