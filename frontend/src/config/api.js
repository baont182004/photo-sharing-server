// src/config/api.js
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

// ===== Auth storage =====
export function getToken() {
    return localStorage.getItem("token");
}

export function getUser() {
    try {
        return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
        return null;
    }
}

export function setAuth({ token, user }) {
    if (token) localStorage.setItem("token", token);
    if (user) localStorage.setItem("user", JSON.stringify(user));
    window.dispatchEvent(new Event("authchange"));
}

export function clearAuth() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("authchange"));
}

// ===== Request helper =====
async function request(path, { method = "GET", body } = {}) {
    const token = getToken();

    const res = await fetch(`${API_URL}${path}`, {
        method,
        headers: {
            ...(body ? { "Content-Type": "application/json" } : {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    const contentType = res.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
        ? await res.json().catch(() => null)
        : await res.text().catch(() => "");

    if (!res.ok) {
        const msg =
            (data && data.message) ||
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
    get: (path) => request(path),
    post: (path, body) => request(path, { method: "POST", body }),
    put: (path, body) => request(path, { method: "PUT", body }),
    del: (path) => request(path, { method: "DELETE" }),
};

// ===== Utils =====
export function imageUrl(fileName) {
    return `${API_URL}/images/${fileName}`;
}

export { API_URL };
