
const API_BASE_URL = "http://localhost:8080";

export async function apiRequest(path, { method = "GET", body, token } = {}) {
    let response;

    try {
        response = await fetch(`${API_BASE_URL}${path}`, {
            method,
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        });
    } catch {
        throw new Error(
            "Cannot connect to the backend. Make sure Spring Boot is running on port 8080."
        );
    }

    const text = await response.text();
    let data = null;

    if (text) {
        try {
            data = JSON.parse(text);
        } catch {
            data = text;
        }
    }

    if (!response.ok) {
        const message =
            typeof data === "string"
                ? data
                : data?.message || data?.error || `Request failed (${response.status})`;

        throw new Error(message);
    }

    return data;
}
