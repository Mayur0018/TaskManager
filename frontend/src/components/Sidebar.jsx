import { NavLink, useNavigate } from "react-router-dom";
import {
    FiBarChart2,
    FiColumns,
    FiUsers,
    FiCheckSquare,
    FiLogOut,
    FiCheckCircle,
    FiBell,
    FiTrendingUp,
    FiCalendar,
    FiMessageSquare,
    FiFolder,
    FiX
} from "react-icons/fi";
import { useNotifications } from "../context/NotificationContext";

const NAV_ITEMS = [
    { label: "Dashboard",       path: "/dashboard",       icon: FiBarChart2 },
    { label: "Kanban Board",    path: "/kanban",          icon: FiColumns },
    { label: "Teams",           path: "/teams",           icon: FiUsers },
    { label: "My Team Tasks",   path: "/team-tasks",      icon: FiCheckCircle },
    { label: "Team Analytics",  path: "/team-analytics",  icon: FiTrendingUp },
    { label: "Team Calendar",   path: "/team-calendar",   icon: FiCalendar },
    { label: "Team Chat",       path: "/team-chat",       icon: FiMessageSquare },
    { label: "Documents",       path: "/team-documents",  icon: FiFolder },
    { label: "Notifications",   path: "/notifications",   icon: FiBell, badge: true },
];

function Sidebar({ isOpen = false, onClose = () => {} }) {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const { unreadCount } = useNotifications();

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    const handleNavClick = () => {
        // Auto-close sidebar on mobile when navigating
        if (window.innerWidth < 1024) {
            onClose();
        }
    };

    return (
        <aside
            className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] lg:w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-screen lg:static lg:translate-x-0 transition-transform duration-300 ease-in-out shadow-xl lg:shadow-none ${
                isOpen ? "translate-x-0" : "-translate-x-full"
            }`}
        >
            {/* App Brand Header */}
            <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200 bg-white">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                        <FiCheckSquare className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <span className="font-bold text-slate-800 text-base leading-tight block">TaskManager</span>
                        <span className="text-xs text-slate-400 font-medium">Enterprise Suite</span>
                    </div>
                </div>

                {/* Close Button on Mobile */}
                <button
                    type="button"
                    onClick={onClose}
                    className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                    title="Close navigation"
                >
                    <FiX className="w-5 h-5" />
                </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Workspaces
                </p>
                {NAV_ITEMS.map((item) => {
                    const IconComponent = item.icon;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={handleNavClick}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition ${isActive
                                    ? "bg-blue-50 text-blue-700 font-bold shadow-2xs"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                }`
                            }
                        >
                            <IconComponent className="w-4 h-4 shrink-0" />
                            <span className="truncate">{item.label}</span>
                            {item.badge && unreadCount > 0 && (
                                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                                    {unreadCount > 99 ? "99+" : unreadCount}
                                </span>
                            )}
                        </NavLink>
                    );
                })}
            </nav>

            {/* User Profile + Logout Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800 truncate">{user.name || "User"}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email || ""}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-lg transition cursor-pointer"
                >
                    <FiLogOut className="w-3.5 h-3.5" /> Logout
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;
