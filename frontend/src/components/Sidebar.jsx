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
    FiX,
    FiSettings,
    FiGrid,
} from "react-icons/fi";
import { useNotifications } from "../context/NotificationContext";
import { useTheme } from "../context/ThemeContext";

const NAV_ITEMS = [
    { label: "Dashboard", path: "/dashboard", icon: FiBarChart2 },
    { label: "Kanban Board", path: "/kanban", icon: FiColumns },
    { label: "Teams", path: "/teams", icon: FiUsers },
    { label: "My Team Tasks", path: "/team-tasks", icon: FiCheckCircle },
    { label: "Team Analytics", path: "/team-analytics", icon: FiTrendingUp },
    { label: "Team Calendar", path: "/team-calendar", icon: FiCalendar },
    { label: "Team Chat", path: "/team-chat", icon: FiMessageSquare },
    { label: "Documents", path: "/team-documents", icon: FiFolder },
    { label: "Notifications", path: "/notifications", icon: FiBell, badge: true },
];

function Sidebar({ isOpen = false, onClose = () => { } }) {
    const navigate = useNavigate();
    const { unreadCount } = useNotifications();
    const { toggleTheme, resolvedTheme } = useTheme();
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    const handleNavClick = () => {
        if (window.innerWidth < 1024) {
            onClose();
        }
    };

    return (
        <aside
            className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] lg:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 min-h-screen lg:static lg:translate-x-0 transition-transform duration-300 ease-in-out shadow-xl lg:shadow-none ${isOpen ? "translate-x-0" : "-translate-x-full"
                }`}
        >
            {/* App Brand Header */}
            <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                        <FiGrid className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <span className="font-bold text-slate-800 dark:text-slate-50 text-sm tracking-tight block">TaskManager</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">Enterprise Suite</span>
                    </div>
                </div>
                <button type="button" onClick={onClose} className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition" title="Close navigation">
                    <FiX className="w-5 h-5" />
                </button>
            </div>

            {/* Workspace Switcher */}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg p-2 transition-colors" onClick={() => { }}>
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">A</div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">Acme Corp</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">12 members</p>
                    </div>
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Navigation
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
                                    ? "bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400 shadow-sm border border-primary-100 dark:border-primary-500/20"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-50"
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

            {/* Settings & Divider */}
            <div className="px-3 py-2 space-y-1 border-t border-slate-200 dark:border-slate-800">
                <NavLink
                    to="/profile"
                    onClick={handleNavClick}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-50 transition-colors"
                >
                    <FiSettings className="w-4 h-4 shrink-0" />
                    <span>Profile</span>
                </NavLink>
            </div>

            {/* User Profile + Logout Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-lg">
                        {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 truncate">{user.name || "User"}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email || ""}</p>
                    </div>
                </div>
                <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-danger-500 hover:bg-danger-50 border border-transparent hover:border-danger-100 dark:hover:border-danger-500/20 rounded-xl transition-colors">
                    <FiLogOut className="w-4 h-4" /> Logout
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;
