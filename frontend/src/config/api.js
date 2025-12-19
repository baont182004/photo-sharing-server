// src/config/api.js
const API_URL =
    (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_URL) ||
    process.env.REACT_APP_API_URL ||
    "http://localhost:3001";

const hasWindow = typeof window !== "undefined";
const tabId =
    hasWindow && typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
const broadcast =
    hasWindow && typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("auth") : null;

let accessToken = null;
let authUser = null;
let refreshPromise = null;

const dispatchAuthChange = () => window.dispatchEvent(new Event("authchange"));

const applyAuthState = ({ token, user, broadcastChange = true }) => {
    accessToken = token || null;
    authUser = user || null;
    dispatchAuthChange();
    if (broadcastChange && broadcast) {
        broadcast.postMessage({ type: "set", accessToken, user: authUser, from: tabId });
    }
};

if (broadcast) {
    broadcast.onmessage = (event) => {
        const msg = event?.data;
        if (!msg || typeof msg !== "object") return;
        if (msg.from && msg.from === tabId) return;

        if (msg.type === "set") {
            applyAuthState({ token: msg.accessToken, user: msg.user, broadcastChange: false });
        }
        if (msg.type === "clear") {
            applyAuthState({ token: null, user: null, broadcastChange: false });
        }
    };
}

// ===== Auth storage =====
export function getAccessToken() {
    return accessToken;
}

export function getUser() {
    return authUser;
}

export function setAuth({ accessToken: token, user }) {
    applyAuthState({ token, user, broadcastChange: true });
}

export function clearAuth() {
    applyAuthState({ token: null, user: null, broadcastChange: true });
    if (broadcast) {
        broadcast.postMessage({ type: "clear", from: tabId });
    }
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

const extractErrorCode = (data) =>
    data && typeof data === "object" && "code" in data ? data.code : undefined;

const extractErrorMessage = (data, fallback) =>
    (data && (data.message || data.error)) ||
    (typeof data === "string" && data) ||
    fallback;

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

    const errorCode = extractErrorCode(data);
    const shouldRefresh =
        res.status === 401 &&
        retry &&
        errorCode === "token_expired" &&
        !path.startsWith("/admin/refresh");

    if (shouldRefresh) {
        try {
            await refreshAccessToken();
            return request(path, { method, body, headers, retry: false });
        } catch (err) {
            clearAuth();
            throw err;
        }
    }

    if (!res.ok) {
        const msg = extractErrorMessage(data, "API error");
        const err = new Error(msg);
        err.status = res.status;
        err.code = errorCode;
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

    const errorCode = extractErrorCode(data);

    if (res.status === 401 && errorCode === "token_expired" && !retried) {
        try {
            await refreshAccessToken();
            return uploadPhoto(file, { retried: true });
        } catch (err) {
            clearAuth();
            throw err;
        }
    }

    if (!res.ok) {
        const msg = extractErrorMessage(data, "Upload failed");
        const err = new Error(msg);
        err.status = res.status;
        err.code = errorCode;
        throw err;
    }

    return data;
}

export { API_URL };
