// src/context/NotificationContext.jsx
import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import api from "../api";

const NotificationContext = createContext(null);

const getSocketURL = () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl) {
        return apiUrl.replace(/\/api\/?$/, "");
    }
    // In production, connect to current host origin; in dev, default to localhost:5000
    if (import.meta.env.PROD) {
        return typeof window !== "undefined" ? window.location.origin : "";
    }
    return "http://localhost:5000";
};

const SOCKET_URL = getSocketURL();

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount]     = useState(0);
    const [loading, setLoading]             = useState(false);
    const [filter, setFilter]               = useState("all"); // all | read | unread
    const socketRef = useRef(null);

    // ── Fetch notifications from API ─────────────────────────────────────────
    const fetchNotifications = useCallback(async (activeFilter = filter) => {
        try {
            setLoading(true);
            const res = await api.get("/notifications", { params: { filter: activeFilter, limit: 50 } });
            setNotifications(res.data.notifications);
            setUnreadCount(res.data.unreadCount);
        } catch (err) {
            console.error("Failed to fetch notifications:", err.message);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    // ── Socket.IO real-time setup ─────────────────────────────────────────────
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;

        const socket = io(SOCKET_URL, {
            auth: { token },
            transports: ["websocket", "polling"]
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            console.log("Socket connected:", socket.id);
        });

        // New notification pushed by server
        socket.on("notification", (newNotif) => {
            setNotifications((prev) => [newNotif, ...prev]);
            setUnreadCount((prev) => prev + 1);
        });

        // Unread count update
        socket.on("unread_count", ({ count }) => {
            setUnreadCount(count);
        });

        socket.on("disconnect", () => {
            console.log("Socket disconnected");
        });

        // Initial fetch
        fetchNotifications("all");

        return () => {
            socket.disconnect();
        };
    }, []); // eslint-disable-line

    // ── Actions ───────────────────────────────────────────────────────────────

    const markAsRead = async (id) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications((prev) =>
                prev.map((n) => (n._id === id ? { ...n, read: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (err) {
            console.error(err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.patch("/notifications/mark-all-read");
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error(err);
        }
    };

    const deleteNotification = async (id) => {
        try {
            await api.delete(`/notifications/${id}`);
            const removed = notifications.find((n) => n._id === id);
            setNotifications((prev) => prev.filter((n) => n._id !== id));
            if (removed && !removed.read) {
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const deleteAll = async () => {
        try {
            await api.delete("/notifications/delete-all");
            setNotifications([]);
            setUnreadCount(0);
        } catch (err) {
            console.error(err);
        }
    };

    const changeFilter = (newFilter) => {
        setFilter(newFilter);
        fetchNotifications(newFilter);
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            loading,
            filter,
            fetchNotifications,
            markAsRead,
            markAllAsRead,
            deleteNotification,
            deleteAll,
            changeFilter
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export const useNotifications = () => {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
    return ctx;
};

