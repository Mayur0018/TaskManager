import { useState, useEffect, useCallback } from "react";
import {
    FiBarChart2,
    FiUsers,
    FiCheckCircle,
    FiClock,
    FiAlertCircle,
    FiTrendingUp,
    FiActivity,
    FiPieChart,
    FiCalendar,
    FiRefreshCw
} from "react-icons/fi";
import api from "../api";
import Layout from "../components/Layout";

export default function TeamDashboardPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchAnalytics = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get("/analytics/overview");
            setData(res.data);
        } catch (err) {
            console.error("Failed to load analytics:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    const statCards = data ? [
        { label: "Total Teams", value: data.totalTeams, icon: FiUsers, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
        { label: "Total Members", value: data.totalMembers, icon: FiActivity, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
        { label: "Total Tasks", value: data.totalTasks, icon: FiCheckCircle, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
        { label: "Completed", value: data.completedTasks, icon: FiCheckCircle, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
        { label: "In Progress", value: data.inProgressTasks, icon: FiClock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
        { label: "Overdue Tasks", value: data.overdueTasks, icon: FiAlertCircle, color: "text-red-600", bg: "bg-red-50", border: "border-red-100" }
    ] : [];

    return (
        <Layout title="Team Analytics">
            <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-5 sm:space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <FiTrendingUp className="w-6 h-6 text-blue-600" />
                            Team Analytics & Performance
                        </h1>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Real-time statistics across all your teams and members
                        </p>
                    </div>
                    <button
                        onClick={fetchAnalytics}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition shadow-2xs"
                    >
                        <FiRefreshCw className="w-4 h-4" /> Refresh
                    </button>
                </div>

                {loading ? (
                    <div className="py-24 flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : data ? (
                    <>
                        {/* Summary Metric Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {statCards.map((card, idx) => (
                                <div
                                    key={idx}
                                    className={`p-4 rounded-xl border bg-white ${card.border} shadow-2xs`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.bg}`}>
                                            <card.icon className={`w-4 h-4 ${card.color}`} />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-bold text-slate-800">{card.value}</p>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">{card.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Middle Row: Completion Rate + Priority Distribution */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Completion Percentage Card */}
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                                    <FiPieChart className="w-4 h-4 text-blue-600" />
                                    Completion Percentage
                                </h3>
                                <div className="text-center py-4">
                                    <div className="text-5xl font-extrabold text-blue-600 mb-2">
                                        {data.completionRate}%
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium">
                                        {data.completedTasks} of {data.totalTasks} total tasks finished
                                    </p>
                                </div>
                                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden mt-4">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                                        style={{ width: `${data.completionRate}%` }}
                                    />
                                </div>
                            </div>

                            {/* Priority Breakdown */}
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs md:col-span-2">
                                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                                    <FiBarChart2 className="w-4 h-4 text-blue-600" />
                                    Tasks by Priority
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {[
                                        { label: "Critical", count: data.priorityDist?.critical || 0, color: "text-red-700 bg-red-50 border-red-200" },
                                        { label: "High", count: data.priorityDist?.high || 0, color: "text-orange-700 bg-orange-50 border-orange-200" },
                                        { label: "Medium", count: data.priorityDist?.medium || 0, color: "text-amber-700 bg-amber-50 border-amber-200" },
                                        { label: "Low", count: data.priorityDist?.low || 0, color: "text-emerald-700 bg-emerald-50 border-emerald-200" }
                                    ].map((p, i) => (
                                        <div key={i} className={`p-4 rounded-xl border ${p.color}`}>
                                            <p className="text-xs font-semibold uppercase">{p.label}</p>
                                            <p className="text-2xl font-bold mt-1">{p.count}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Weekly & Monthly Performance Bars */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Weekly Activity */}
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                                    <FiCalendar className="w-4 h-4 text-blue-600" />
                                    Weekly Task Activity (Past 7 Days)
                                </h3>
                                <div className="space-y-3">
                                    {data.weeklyPerformance?.map((wp, i) => (
                                        <div key={i} className="flex items-center gap-3 text-xs">
                                            <span className="w-16 font-medium text-slate-500">{wp.label}</span>
                                            <div className="flex-1 flex gap-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-emerald-500 rounded-full"
                                                    style={{ width: `${Math.min(100, wp.completed * 20)}%` }}
                                                    title={`${wp.completed} completed`}
                                                />
                                                <div
                                                    className="bg-blue-400 rounded-full"
                                                    style={{ width: `${Math.min(100, wp.created * 20)}%` }}
                                                    title={`${wp.created} created`}
                                                />
                                            </div>
                                            <span className="text-[11px] font-semibold text-slate-600 w-16 text-right">
                                                {wp.completed} done / {wp.created} new
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Monthly Trends */}
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                                    <FiActivity className="w-4 h-4 text-blue-600" />
                                    Monthly Task Trends (Past 6 Months)
                                </h3>
                                <div className="space-y-3">
                                    {data.monthlyPerformance?.map((mp, i) => (
                                        <div key={i} className="flex items-center gap-3 text-xs">
                                            <span className="w-16 font-medium text-slate-500">{mp.label}</span>
                                            <div className="flex-1 flex gap-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-emerald-500 rounded-full"
                                                    style={{ width: `${Math.min(100, mp.completed * 10)}%` }}
                                                    title={`${mp.completed} completed`}
                                                />
                                                <div
                                                    className="bg-indigo-400 rounded-full"
                                                    style={{ width: `${Math.min(100, mp.created * 10)}%` }}
                                                    title={`${mp.created} created`}
                                                />
                                            </div>
                                            <span className="text-[11px] font-semibold text-slate-600 w-16 text-right">
                                                {mp.completed} done / {mp.created} new
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Member Productivity Table */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                            <div className="p-5 border-b border-slate-100">
                                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <FiUsers className="w-4 h-4 text-blue-600" />
                                    Member Workload & Productivity
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs text-slate-600">
                                    <thead className="bg-slate-50 text-slate-400 uppercase font-semibold border-b border-slate-100">
                                        <tr>
                                            <th className="py-3 px-4">Member</th>
                                            <th className="py-3 px-4">Assigned Tasks</th>
                                            <th className="py-3 px-4">Completed</th>
                                            <th className="py-3 px-4">In Progress</th>
                                            <th className="py-3 px-4">Overdue</th>
                                            <th className="py-3 px-4">Completion Rate</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {data.memberProductivity?.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                                                    No member task assignments recorded yet.
                                                </td>
                                            </tr>
                                        ) : (
                                            data.memberProductivity?.map((m, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50/70 transition">
                                                    <td className="py-3 px-4 flex items-center gap-2.5">
                                                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                                                            {(m.user?.name || "U").charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-slate-800">{m.user?.name || "User"}</p>
                                                            <p className="text-[10px] text-slate-400">{m.user?.email}</p>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 font-bold text-slate-700">{m.assignedCount}</td>
                                                    <td className="py-3 px-4 font-semibold text-emerald-600">{m.completedCount}</td>
                                                    <td className="py-3 px-4 font-semibold text-amber-600">{m.inProgressCount || 0}</td>
                                                    <td className="py-3 px-4 font-semibold text-red-600">{m.overdueCount}</td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 w-20 bg-slate-100 h-2 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-emerald-500 rounded-full"
                                                                    style={{ width: `${m.completionRate}%` }}
                                                                />
                                                            </div>
                                                            <span className="font-bold text-slate-700">{m.completionRate}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                ) : null}
            </div>
        </Layout>
    );
}

