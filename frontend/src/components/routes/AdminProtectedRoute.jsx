import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { bootstrapAuth, getAccessToken, getUser } from "../../config/api";

export default function AdminProtectedRoute() {
    const [checking, setChecking] = useState(!getAccessToken());
    const [authed, setAuthed] = useState(!!getAccessToken());
    const [user, setUser] = useState(getUser());

    useEffect(() => {
        const onAuth = () => {
            setAuthed(!!getAccessToken());
            setUser(getUser());
        };
        window.addEventListener("authchange", onAuth);
        return () => window.removeEventListener("authchange", onAuth);
    }, []);

    useEffect(() => {
        let alive = true;
        if (getAccessToken()) {
            setChecking(false);
            return;
        }

        (async () => {
            try {
                const refreshed = await bootstrapAuth();
                if (!alive) return;
                setAuthed(!!refreshed?.accessToken);
                setUser(refreshed?.user || getUser());
            } catch {
                if (alive) setAuthed(false);
            } finally {
                if (alive) setChecking(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, []);

    if (checking) return null;
    if (!authed) return <Navigate to="/loginregister" replace />;
    if (!user || user.role !== "admin") return <Navigate to="/" replace />;

    return <Outlet />;
}
