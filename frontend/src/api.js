const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export async function apiRequest(path, { method = "GET", body, token } = {}) {
  let authToken = token;
  if (!authToken) {
    authToken = sessionStorage.getItem("carbontrack_token") || localStorage.getItem("carbontrack_token");
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch (err) {
    throw new Error(
      "Cannot connect to the backend server. Please verify Spring Boot is running on port 8080.",
      { cause: err }
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

  if (response.status === 401) {
    // Session expired or unauthorized
    sessionStorage.removeItem("carbontrack_token");
    localStorage.removeItem("carbontrack_token");
    const msg = (typeof data === "object" && data?.error) ? data.error : "Your session has expired. Please sign in again.";
    throw new Error(msg);
  }

  if (!response.ok) {
    const message =
      typeof data === "string"
        ? data
        : data?.message || data?.error || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
}

export const api = {
  get: (path, options = {}) => apiRequest(path, { ...options, method: "GET" }),
  post: (path, body, options = {}) => apiRequest(path, { ...options, method: "POST", body }),
  put: (path, body, options = {}) => apiRequest(path, { ...options, method: "PUT", body }),
  delete: (path, options = {}) => apiRequest(path, { ...options, method: "DELETE" }),
};
