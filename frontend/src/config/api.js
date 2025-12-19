// src/config/api.js
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

let accessToken = null;
let authUser = null;
let refreshPromise = null;

const dispatchAuthChange = () => window.dispatchEvent(new Event("authchange"));

// ===== Auth storage =====
export function getAccessToken() {
    return accessToken;
}

export function getUser() {
    return authUser;
}

export function setAuth({ accessToken: token, user }) {
    accessToken = token || null;
    authUser = user || null;
    dispatchAuthChange();
}

export function clearAuth() {
    accessToken = null;
    authUser = null;
    dispatchAuthChange();
}

export async function bootstrapAuth() {
    if (accessToken) {
        return { accessToken, user: authUser };
    }
    try {
        return await refreshAccessToken();
    } catch {
        clearAuth();
        return null;
    }
}

async function refreshAccessToken() {
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
        const res = await fetch(`${API_URL}/admin/refresh`, {
            method: "POST",
            credentials: "include",
        });

        const contentType = res.headers.get("content-type") || "";
        const data = contentType.includes("application/json")
            ? await res.json().catch(() => null)
            : await res.text().catch(() => "");

        if (!res.ok) {
            const msg =
                (data && (data.message || data.error)) ||
                (typeof data === "string" && data) ||
                "Session expired";
            const err = new Error(msg);
            err.status = res.status;
            throw err;
        }

        setAuth({ accessToken: data.accessToken, user: data.user });
        return data;
    })();

    try {
        return await refreshPromise;
    } finally {
        refreshPromise = null;
    }
}

// ===== Request helper =====
async function request(path, { method = "GET", body, headers, retry = true } = {}) {
    const res = await fetch(`${API_URL}${path}`, {
        method,
        credentials: "include",
        headers: {
            ...(body ? { "Content-Type": "application/json" } : {}),
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            ...(headers || {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    const contentType = res.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
        ? await res.json().catch(() => null)
        : await res.text().catch(() => "");

    if (res.status === 401 && retry && !path.startsWith("/admin/refresh")) {
        try {
            await refreshAccessToken();
            return request(path, { method, body, headers, retry: false });
        } catch (err) {
            clearAuth();
            throw err;
        }
    }

    if (!res.ok) {
        const msg =
            (data && (data.message || data.error)) ||
            (typeof data === "string" && data) ||
            "API error";
        const err = new Error(msg);
        err.status = res.status;
        throw err;
    }

    return data;
}

// ===== Public API =====
export const api = {
    get: (path, options) => request(path, { ...(options || {}), method: "GET" }),
    post: (path, body, options) => request(path, { ...(options || {}), method: "POST", body }),
    put: (path, body, options) => request(path, { ...(options || {}), method: "PUT", body }),
    del: (path, options) => request(path, { ...(options || {}), method: "DELETE" }),
};

// ===== Utils =====
export function imageUrl(fileName) {
    return `${API_URL}/images/${fileName}`;
}

// ===== Uploads =====
export async function uploadPhoto(file, { retried } = {}) {
    const form = new FormData();
    form.append("uploadedphoto", file);

    const res = await fetch(`${API_URL}/photos/new`, {
        method: "POST",
        credentials: "include",
        headers: {
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: form,
    });

    const contentType = res.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
        ? await res.json().catch(() => null)
        : await res.text().catch(() => "");

    if (res.status === 401 && !retried) {
        try {
            await refreshAccessToken();
            return uploadPhoto(file, { retried: true });
        } catch (err) {
            clearAuth();
            throw err;
        }
    }

    if (!res.ok) {
        const msg =
            (data && (data.message || data.error)) ||
            (typeof data === "string" && data) ||
            "Upload failed";
        const err = new Error(msg);
        err.status = res.status;
        throw err;
    }

    return data;
}

export { API_URL };
