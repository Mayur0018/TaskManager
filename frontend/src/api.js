import axios from "axios";

const getBaseURL = () => {
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }
    // In production without an explicit VITE_API_URL, use relative /api
    // so it works on the same domain or behind reverse proxies
    return import.meta.env.PROD ? "/api" : "http://localhost:5000/api";
};

const api = axios.create({
    baseURL: getBaseURL()
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            const url = error.config?.url || "";
            const isAuthRequest = url.includes("/auth/login") || url.includes("/auth/register");
            if (!isAuthRequest) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                if (window.location.pathname !== "/login") {
                    window.location.href = "/login";
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
