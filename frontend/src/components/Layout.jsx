// src/components/Layout.jsx
import { useState } from "react";
import { FiMenu, FiSearch, FiBell, FiSun, FiMoon, FiGrid } from "react-icons/fi";
import Sidebar from "./Sidebar";
import { useTheme } from "../context/ThemeContext";
import { useNotifications } from "../context/NotificationContext";

function Layout({ children, title }) {
    const { toggleTheme, resolvedTheme } = useTheme();
    const { unreadCount } = useNotifications();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 antialiased overflow-x-hidden selection:bg-primary-200 dark:selection:bg-primary-800/50">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
            )}
            <div className="flex-1 flex flex-col min-w-0 w-full overflow-x-hidden">
                <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-3 sm:px-6 shrink-0 sticky top-0 z-30 shadow-sm">
                    {/* Left: Mobile hamburger & Brand/Title */}
                    <div className="flex items-center gap-3 min-w-0">
                        <button type="button" onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition" title="Open navigation menu" aria-label="Open navigation menu">
                            <FiMenu className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-2 flex-shrink-0 hidden lg:flex">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                                <FiGrid className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <span className="font-bold text-slate-800 dark:text-slate-50 text-sm tracking-tight">TaskManager</span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider block">Enterprise Suite</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 lg:hidden">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shrink-0">
                                <FiGrid className="w-4 h-4 text-white" />
                            </div>
                            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-50 truncate">{title || "Dashboard"}</h2>
                        </div>
                        <div className="hidden lg:flex items-center flex-1 max-w-md ml-4">
                            <div className="relative w-full">
                                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input type="text" placeholder="Search tasks, teams, documents..." className="w-full px-4 py-2 pl-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200" />
                            </div>
                        </div>
                    </div>

                    {/* Right side controls */}
                    <div className="flex items-center gap-2 shrink-0">
                        <button type="button" onClick={toggleTheme} className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" aria-label={resolvedTheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
                            {resolvedTheme === 'light' ? <FiMoon className="w-5 h-5" /> : <FiSun className="w-5 h-5" />}
                        </button>
                        <div className="relative">
                            <button type="button" className="relative p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" aria-label="Notifications">
                                <FiBell className="w-5 h-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-danger-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                                )}
                            </button>
                        </div>
                        <div className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-800">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                                {(() => { try { const u = JSON.parse(localStorage.getItem("user") || "{}"); return u.name ? u.name.charAt(0).toUpperCase() : "U"; } catch { return "U"; } })()}
                            </div>
                            <div className="hidden md:flex flex-col items-end text-right">
                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{(() => { try { const u = JSON.parse(localStorage.getItem("user") || "{}"); return u.name || "User"; } catch { return "User"; } })()}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{(() => { try { const u = JSON.parse(localStorage.getItem("user") || "{}"); return u.email || ""; } catch { return ""; } })()}</p>
                            </div>
                        </div>
                    </div>
                </header>
                <main className="flex-1 min-w-0 w-full overflow-x-hidden">
                    <div className="p-4 sm:p-6 lg:p-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

export default Layout;
