// src/components/Layout.jsx
import { useState } from "react";
import { FiMenu, FiCheckSquare } from "react-icons/fi";
import Sidebar from "./Sidebar";
import NotificationBell from "./NotificationBell";

function Layout({ children, title }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-slate-50 text-slate-800 antialiased overflow-x-hidden">
            {/* Sidebar (Desktop static + Mobile slide-over drawer) */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Mobile Backdrop Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden transition-opacity"
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 w-full overflow-x-hidden">
                {/* Responsive Top bar */}
                <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-3 sm:px-6 shrink-0 sticky top-0 z-30 shadow-2xs">
                    {/* Left: Mobile Hamburger & Page Title */}
                    <div className="flex items-center gap-2.5 min-w-0">
                        <button
                            type="button"
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                            title="Open navigation menu"
                            aria-label="Open navigation menu"
                        >
                            <FiMenu className="w-5 h-5" />
                        </button>

                        {/* Mobile Brand Icon if no title */}
                        <div className="flex items-center gap-2 lg:hidden">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0">
                                <FiCheckSquare className="w-4 h-4" />
                            </div>
                        </div>

                        <h2 className="text-sm font-bold text-slate-800 truncate">
                            {title || "Dashboard"}
                        </h2>
                    </div>

                    {/* Right: Actions / Notification Bell */}
                    <div className="flex items-center gap-2 shrink-0">
                        <NotificationBell />
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 min-w-0 w-full">
                    {children}
                </main>
            </div>
        </div>
    );
}

export default Layout;
