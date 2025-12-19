// src/components/routes/ProtectedRoute.jsx
import React, { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { bootstrapAuth, getAccessToken } from "../../config/api";

export default function ProtectedRoute() {
    const location = useLocation();
    const [checking, setChecking] = useState(!getAccessToken());
    const [authed, setAuthed] = useState(!!getAccessToken());

    useEffect(() => {
        const onAuth = () => setAuthed(!!getAccessToken());
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
                if (alive) setAuthed(!!refreshed?.accessToken);
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
    if (!authed) return <Navigate to="/loginregister" replace state={{ from: location.pathname }} />;
    return <Outlet />;
}
