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
        <div className="flex min-h-screen text-slate-900 antialiased overflow-x-hidden selection:bg-primary-200" style={{ background: '#FAF7FF' }}>
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 bg-violet-950/60 backdrop-blur-sm lg:hidden transition-opacity" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
            )}
            <div className="flex-1 flex flex-col min-w-0 w-full overflow-x-hidden">
                <header className="h-16 bg-white border-b flex items-center justify-between px-3 sm:px-6 shrink-0 sticky top-0 z-30" style={{ borderColor: '#E9DFF5', boxShadow: '0 1px 0 0 #E9DFF5' }}>
                    {/* Left: Mobile hamburger & Brand/Title */}
                    <div className="flex items-center gap-3 min-w-0">
                        <button type="button" onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-1 text-violet-600 hover:bg-violet-50 rounded-lg transition" title="Open navigation menu" aria-label="Open navigation menu">
                            <FiMenu className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-2 flex-shrink-0 hidden lg:flex">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center shadow-sm">
                                <FiGrid className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <span className="font-bold text-slate-800 text-sm tracking-tight">TaskManager</span>
                                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">Enterprise Suite</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 lg:hidden">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-400 to-purple-600 text-white flex items-center justify-center shrink-0">
                                <FiGrid className="w-4 h-4 text-white" />
                            </div>
                            <h2 className="text-sm font-bold text-slate-800 truncate">{title || "Dashboard"}</h2>
                        </div>
                        <div className="hidden lg:flex items-center flex-1 max-w-md ml-4">
                            <div className="relative w-full">
                                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input type="text" placeholder="Search tasks, teams, documents..." className="w-full px-4 py-2 pl-10 rounded-lg border border-[#E9DFF5] bg-white text-sm text-slate-900 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all duration-200" />
                            </div>
                        </div>
                    </div>

                    {/* Right side controls */}
                    <div className="flex items-center gap-2 shrink-0">
                        <button type="button" onClick={toggleTheme} className="p-2 rounded-lg text-violet-600 hover:bg-violet-50 transition-colors" aria-label={resolvedTheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
                            {resolvedTheme === 'light' ? <FiMoon className="w-5 h-5" /> : <FiSun className="w-5 h-5" />}
                        </button>
                        <div className="relative">
                            <button type="button" className="relative p-2 rounded-lg text-violet-600 hover:bg-violet-50 transition-colors" aria-label="Notifications">
                                <FiBell className="w-5 h-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-violet-600 rounded-full border-2 border-white"></span>
                                )}
                            </button>
                        </div>
                        <div className="flex items-center gap-3 pl-2 border-l border-[#E9DFF5]">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                                {(() => { try { const u = JSON.parse(localStorage.getItem("user") || "{}"); return u.name ? u.name.charAt(0).toUpperCase() : "U"; } catch { return "U"; } })()}
                            </div>
                            <div className="hidden md:flex flex-col items-end text-right">
                                <p className="text-sm font-semibold text-slate-900">{(() => { try { const u = JSON.parse(localStorage.getItem("user") || "{}"); return u.name || "User"; } catch { return "User"; } })()}</p>
                                <p className="text-xs text-slate-500">{(() => { try { const u = JSON.parse(localStorage.getItem("user") || "{}"); return u.email || ""; } catch { return ""; } })()}</p>
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
