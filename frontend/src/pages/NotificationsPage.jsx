// src/pages/NotificationsPage.jsx
import { useState } from "react";
import {
    FiBell,
    FiCheck,
    FiTrash2,
    FiCheckCircle,
    FiUser,
    FiClock,
    FiMessageSquare,
    FiUsers,
    FiAlertCircle,
    FiX,
    FiFilter
} from "react-icons/fi";
import Layout from "../components/Layout";
import { useNotifications } from "../context/NotificationContext";

// ── Config ────────────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
    TASK_ASSIGNED:              { icon: FiUser,         color: "text-blue-500",   bg: "bg-blue-100",   label: "Task Assigned"       },
    TASK_STATUS_CHANGED:        { icon: FiCheckCircle,  color: "text-green-500",  bg: "bg-green-100",  label: "Status Changed"      },
    TASK_DEADLINE_APPROACHING:  { icon: FiClock,        color: "text-orange-500", bg: "bg-orange-100", label: "Deadline Reminder"   },
    COMMENT_ADDED:              { icon: FiMessageSquare,color: "text-purple-500", bg: "bg-purple-100", label: "New Comment"         },
    MENTION:                    { icon: FiAlertCircle,  color: "text-pink-500",   bg: "bg-pink-100",   label: "Mention"             },
    TEAM_INVITATION:            { icon: FiUsers,        color: "text-indigo-500", bg: "bg-indigo-100", label: "Team Invitation"     }
};

function timeAgo(date) {
    const diff  = Date.now() - new Date(date).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins  <  1) return "just now";
    if (mins  < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

function formatDate(date) {
    return new Date(date).toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit"
    });
}

// ── Full Notification Row ─────────────────────────────────────────────────────

function NotifRow({ notif, onRead, onDelete }) {
    const cfg  = TYPE_CONFIG[notif.type] || TYPE_CONFIG.TASK_ASSIGNED;
    const Icon = cfg.icon;

    return (
        <div className={`flex items-start gap-4 p-4 rounded-xl border transition group ${
            !notif.read
                ? "bg-blue-50/60 border-blue-100 hover:bg-blue-50"
                : "bg-white border-slate-100 hover:bg-slate-50"
        }`}>
            {/* Icon */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${cfg.bg}`}>
                <Icon className={`w-5 h-5 ${cfg.color}`} />
            </div>

            {/* Body */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-1 ${cfg.bg} ${cfg.color}`}>
                            {cfg.label}
                        </span>
                        <p className={`text-sm leading-snug ${!notif.read ? "font-semibold text-slate-800" : "text-slate-600"}`}>
                            {notif.message}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-400">
                            {notif.sender?.name && (
                                <span className="flex items-center gap-1">
                                    <FiUser className="w-3 h-3" /> {notif.sender.name}
                                </span>
                            )}
                            {notif.task?.title && (
                                <span className="flex items-center gap-1 text-blue-500">
                                    📋 {notif.task.title}
                                </span>
                            )}
                            {notif.team?.name && (
                                <span className="flex items-center gap-1">
                                    <FiUsers className="w-3 h-3" /> {notif.team.name}
                                </span>
                            )}
                            <span title={formatDate(notif.createdAt)}>
                                <FiClock className="w-3 h-3 inline mr-0.5" />
                                {timeAgo(notif.createdAt)}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                        {!notif.read && (
                            <button
                                onClick={() => onRead(notif._id)}
                                className="p-1.5 text-blue-500 hover:bg-blue-100 rounded-lg transition"
                                title="Mark as read"
                            >
                                <FiCheck className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            onClick={() => onDelete(notif._id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                            title="Delete"
                        >
                            <FiTrash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Unread indicator */}
                {!notif.read && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-blue-500 font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Unread
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
    const {
        notifications,
        unreadCount,
        loading,
        filter,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAll,
        changeFilter
    } = useNotifications();

    const [typeFilter, setTypeFilter] = useState("all");

    const displayed = typeFilter === "all"
        ? notifications
        : notifications.filter((n) => n.type === typeFilter);

    const TAB_FILTERS = [
        { key: "all",    label: "All" },
        { key: "unread", label: "Unread" },
        { key: "read",   label: "Read" }
    ];

    const TYPE_FILTERS = [
        { key: "all",                       label: "All Types" },
        { key: "TASK_ASSIGNED",             label: "Assigned" },
        { key: "TASK_STATUS_CHANGED",       label: "Status" },
        { key: "TASK_DEADLINE_APPROACHING", label: "Deadline" },
        { key: "COMMENT_ADDED",             label: "Comments" },
        { key: "TEAM_INVITATION",           label: "Teams" }
    ];

    return (
        <Layout>
            <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
                {/* Page Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                            <FiBell className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800">Notifications</h1>
                            <p className="text-sm text-slate-500">
                                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition"
                            >
                                <FiCheckCircle className="w-4 h-4" /> Mark all read
                            </button>
                        )}
                        {notifications.length > 0 && (
                            <button
                                onClick={() => {
                                    if (window.confirm("Delete all visible notifications?")) deleteAll();
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 border border-red-200 rounded-lg transition"
                            >
                                <FiTrash2 className="w-4 h-4" /> Delete all
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 mb-5">
                    {/* Read/Unread tabs */}
                    <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
                        {TAB_FILTERS.map((t) => (
                            <button
                                key={t.key}
                                onClick={() => changeFilter(t.key)}
                                className={`px-3 py-1 text-sm font-medium rounded-md transition ${
                                    filter === t.key
                                        ? "bg-white text-blue-600 shadow-sm"
                                        : "text-slate-500 hover:text-slate-700"
                                }`}
                            >
                                {t.label}
                                {t.key === "unread" && unreadCount > 0 && (
                                    <span className="ml-1.5 bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Type filter */}
                    <div className="flex items-center gap-1.5">
                        <FiFilter className="w-3.5 h-3.5 text-slate-400" />
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="text-sm border border-slate-200 rounded-lg px-2 py-1 text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {TYPE_FILTERS.map((f) => (
                                <option key={f.key} value={f.key}>{f.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Count */}
                    <span className="text-sm text-slate-400 ml-auto">
                        {displayed.length} notification{displayed.length !== 1 ? "s" : ""}
                    </span>
                </div>

                {/* Notification List */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : displayed.length === 0 ? (
                    <div className="text-center py-20 text-slate-400">
                        <FiBell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="font-medium">No notifications found</p>
                        <p className="text-sm mt-1">We'll notify you when something happens</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {displayed.map((n) => (
                            <NotifRow
                                key={n._id}
                                notif={n}
                                onRead={markAsRead}
                                onDelete={deleteNotification}
                            />
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
}

