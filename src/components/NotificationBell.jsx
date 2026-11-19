// src/components/NotificationBell.jsx
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    FiBell,
    FiCheck,
    FiCheckCircle,
    FiTrash2,
    FiX,
    FiUser,
    FiAlertCircle,
    FiClock,
    FiMessageSquare,
    FiUsers,
    FiExternalLink
} from "react-icons/fi";
import { useNotifications } from "../context/NotificationContext";

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
    TASK_ASSIGNED: { icon: FiUser, color: "text-blue-500", bg: "bg-blue-50" },
    TASK_STATUS_CHANGED: { icon: FiCheckCircle, color: "text-green-500", bg: "bg-green-50" },
    TASK_DEADLINE_APPROACHING: { icon: FiClock, color: "text-orange-500", bg: "bg-orange-50" },
    COMMENT_ADDED: { icon: FiMessageSquare, color: "text-purple-500", bg: "bg-purple-50" },
    MENTION: { icon: FiAlertCircle, color: "text-pink-500", bg: "bg-pink-50" },
    TEAM_INVITATION: { icon: FiUsers, color: "text-indigo-500", bg: "bg-indigo-50" }
};

function timeAgo(date) {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

// ── Single Notification Item ──────────────────────────────────────────────────

function NotifItem({ notif, onRead, onDelete }) {
    const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.TASK_ASSIGNED;
    const Icon = cfg.icon;

    return (
        <div
            className={`flex items-start gap-3 px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition group cursor-pointer ${!notif.read ? "bg-blue-50/40" : ""}`}
            onClick={() => !notif.read && onRead(notif._id)}
        >
            {/* Type icon */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${cfg.bg}`}>
                <Icon className={`w-4 h-4 ${cfg.color}`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug ${!notif.read ? "font-semibold text-slate-800" : "text-slate-600"}`}>
                    {notif.message}
                </p>
                <div className="flex items-center gap-2 mt-1">
                    {notif.sender?.name && (
                        <span className="text-xs text-slate-400">from {notif.sender.name}</span>
                    )}
                    <span className="text-xs text-slate-400">{timeAgo(notif.createdAt)}</span>
                </div>
                {notif.task?.title && (
                    <span className="text-xs text-blue-500 truncate block mt-0.5">
                        📋 {notif.task.title}
                    </span>
                )}
            </div>

            {/* Unread dot + delete */}
            <div className="flex flex-col items-center gap-1 shrink-0">
                {!notif.read && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1" />
                )}
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(notif._id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition"
                    title="Delete"
                >
                    <FiX className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
}

// ── Main Bell Component ───────────────────────────────────────────────────────

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState("all");
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        changeFilter
    } = useNotifications();

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleTabChange = (newTab) => {
        setTab(newTab);
        changeFilter(newTab);
    };

    const displayed = notifications.slice(0, 8); // show latest 8 in dropdown

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setOpen((o) => !o)}
                className="relative w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                title="Notifications"
            >
                <FiBell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="fixed sm:absolute right-2 sm:right-0 top-16 sm:top-full mt-1 w-[calc(100vw-1rem)] sm:w-96 max-w-sm bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <FiBell className="w-4 h-4 text-slate-600" />
                            <h3 className="font-semibold text-slate-800 text-sm">Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition"
                                    title="Mark all as read"
                                >
                                    <FiCheck className="w-3 h-3" /> All read
                                </button>
                            )}
                            <button
                                onClick={() => { setOpen(false); navigate("/notifications"); }}
                                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded hover:bg-slate-100 transition"
                            >
                                <FiExternalLink className="w-3 h-3" /> View all
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-slate-100">
                        {["all", "unread", "read"].map((t) => (
                            <button
                                key={t}
                                onClick={() => handleTabChange(t)}
                                className={`flex-1 py-2 text-xs font-medium capitalize transition ${tab === t
                                        ? "text-blue-600 border-b-2 border-blue-600"
                                        : "text-slate-500 hover:text-slate-700"
                                    }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>

                    {/* List */}
                    <div className="max-h-80 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : displayed.length === 0 ? (
                            <div className="text-center py-10 text-slate-400">
                                <FiBell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">No notifications</p>
                            </div>
                        ) : (
                            displayed.map((n) => (
                                <NotifItem
                                    key={n._id}
                                    notif={n}
                                    onRead={markAsRead}
                                    onDelete={deleteNotification}
                                />
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-2 border-t border-slate-100 flex justify-between items-center">
                            <span className="text-xs text-slate-400">
                                {notifications.length} notification{notifications.length !== 1 ? "s" : ""}
                            </span>
                            <button
                                onClick={() => { setOpen(false); navigate("/notifications"); }}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium transition"
                            >
                                See all →
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

