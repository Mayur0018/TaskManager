import { useState, useEffect, useCallback } from "react";
import {
    FiCalendar,
    FiChevronLeft,
    FiChevronRight,
    FiClock,
    FiFilter,
    FiFolder,
    FiCheckSquare,
    FiAlertCircle
} from "react-icons/fi";
import api from "../api";
import Layout from "../components/Layout";
import TaskDetailModal from "../components/TaskDetailModal";

const VIEW_MODES = [
    { key: "month", label: "Month" },
    { key: "week", label: "Week" },
    { key: "day", label: "Day" }
];

export default function TeamCalendarPage() {
    const [tasks, setTasks] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState("month");
    const [selectedTask, setSelectedTask] = useState(null);
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterPriority, setFilterPriority] = useState("all");
    const [loading, setLoading] = useState(true);

    const fetchTasks = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get("/tasks", { params: { isArchived: "false" } });
            setTasks(res.data);
        } catch (err) {
            console.error("Failed to load tasks for calendar:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    // Navigation
    const handlePrev = () => {
        const d = new Date(currentDate);
        if (viewMode === "month") d.setMonth(d.getMonth() - 1);
        else if (viewMode === "week") d.setDate(d.getDate() - 7);
        else d.setDate(d.getDate() - 1);
        setCurrentDate(d);
    };

    const handleNext = () => {
        const d = new Date(currentDate);
        if (viewMode === "month") d.setMonth(d.getMonth() + 1);
        else if (viewMode === "week") d.setDate(d.getDate() + 7);
        else d.setDate(d.getDate() + 1);
        setCurrentDate(d);
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    // Filter tasks
    const filteredTasks = tasks.filter((t) => {
        if (filterStatus !== "all" && t.status !== filterStatus) return false;
        if (filterPriority !== "all" && t.priority !== filterPriority) return false;
        return true;
    });

    // Calendar Grid Calculation for Month View
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const calendarCells = [];
    // Blank leading days
    for (let i = 0; i < firstDayIndex; i++) {
        calendarCells.push(null);
    }
    // Month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
        calendarCells.push(new Date(year, month, d));
    }

    const isSameDay = (d1, d2) => {
        if (!d1 || !d2) return false;
        const a = new Date(d1);
        const b = new Date(d2);
        return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    };

    const isToday = (d) => isSameDay(d, new Date());

    return (
        <Layout title="Team Calendar">
            <div className="p-3 sm:p-6 max-w-7xl mx-auto w-full space-y-4 sm:space-y-5">
                {/* Header Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5 bg-slate-50">
                            <button
                                onClick={handlePrev}
                                className="p-1.5 hover:bg-white rounded-md text-slate-600 transition"
                            >
                                <FiChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleToday}
                                className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-white rounded-md transition"
                            >
                                Today
                            </button>
                            <button
                                onClick={handleNext}
                                className="p-1.5 hover:bg-white rounded-md text-slate-600 transition"
                            >
                                <FiChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        <h2 className="text-base font-bold text-slate-800">
                            {currentDate.toLocaleDateString("en-IN", {
                                month: "long",
                                year: "numeric",
                                ...(viewMode === "day" ? { day: "numeric" } : {})
                            })}
                        </h2>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Filters */}
                        <div className="flex items-center gap-2">
                            <FiFilter className="w-3.5 h-3.5 text-slate-400" />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none"
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                            </select>
                            <select
                                value={filterPriority}
                                onChange={(e) => setFilterPriority(e.target.value)}
                                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none"
                            >
                                <option value="all">All Priority</option>
                                <option value="critical">Critical</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                        </div>

                        {/* View Switcher */}
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            {VIEW_MODES.map((vm) => (
                                <button
                                    key={vm.key}
                                    onClick={() => setViewMode(vm.key)}
                                    className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                                        viewMode === vm.key
                                            ? "bg-white text-blue-600 shadow-2xs"
                                            : "text-slate-500 hover:text-slate-800"
                                    }`}
                                >
                                    {vm.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Calendar View Area */}
                {loading ? (
                    <div className="py-24 flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : viewMode === "month" ? (
                    /* Month Grid */
                    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-x-auto">
                        <div className="min-w-[620px] lg:min-w-0">
                            {/* Days of week header */}
                            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                                    <div key={day}>{day}</div>
                                ))}
                            </div>

                            {/* Month Grid Cells */}
                            <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
                                {calendarCells.map((date, idx) => {
                                    if (!date) {
                                        return <div key={`empty-${idx}`} className="min-h-20 sm:min-h-28 bg-slate-50/40 p-1.5 sm:p-2" />;
                                    }

                                    const dayTasks = filteredTasks.filter((t) =>
                                        (t.dueDate && isSameDay(t.dueDate, date)) ||
                                        (t.startDate && isSameDay(t.startDate, date))
                                    );

                                    const today = isToday(date);

                                    return (
                                        <div
                                            key={idx}
                                            className={`min-h-20 sm:min-h-28 p-1.5 sm:p-2 flex flex-col justify-between hover:bg-slate-50/50 transition ${
                                                today ? "bg-blue-50/30" : ""
                                            }`}
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <span
                                                    className={`text-[10px] sm:text-xs font-bold w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center ${
                                                        today ? "bg-blue-600 text-white" : "text-slate-700"
                                                    }`}
                                                >
                                                    {date.getDate()}
                                                </span>
                                                {dayTasks.length > 0 && (
                                                    <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium">
                                                        {dayTasks.length}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Task Event Tags in Cell */}
                                            <div className="space-y-1 overflow-y-auto max-h-16 sm:max-h-20">
                                                {dayTasks.slice(0, 3).map((task) => {
                                                    const isDone = task.status === "completed";
                                                    const isDue = task.dueDate && isSameDay(task.dueDate, date);
                                                    return (
                                                        <div
                                                            key={task._id}
                                                            onClick={() => setSelectedTask(task)}
                                                            className={`text-[9px] sm:text-[10px] px-1 py-0.5 rounded font-medium truncate cursor-pointer transition flex items-center gap-1 ${
                                                                isDone
                                                                    ? "bg-slate-100 text-slate-500 line-through"
                                                                    : task.priority === "critical"
                                                                    ? "bg-red-50 text-red-700 border border-red-200"
                                                                    : task.priority === "high"
                                                                    ? "bg-orange-50 text-orange-700 border border-orange-200"
                                                                    : "bg-blue-50 text-blue-700 border border-blue-200"
                                                            }`}
                                                        >
                                                            {isDue ? <FiClock className="w-2.5 h-2.5 shrink-0" /> : <FiCalendar className="w-2.5 h-2.5 shrink-0" />}
                                                            <span className="truncate">{task.title}</span>
                                                        </div>
                                                    );
                                                })}
                                                {dayTasks.length > 3 && (
                                                    <span className="text-[9px] text-blue-600 font-medium pl-1">
                                                        +{dayTasks.length - 3} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ) : viewMode === "week" ? (
                    /* Week View */
                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
                        <div className="grid grid-cols-7 gap-3">
                            {[0, 1, 2, 3, 4, 5, 6].map((dayOffset) => {
                                const d = new Date(currentDate);
                                d.setDate(d.getDate() - d.getDay() + dayOffset);
                                const dayTasks = filteredTasks.filter((t) =>
                                    (t.dueDate && isSameDay(t.dueDate, d)) ||
                                    (t.startDate && isSameDay(t.startDate, d))
                                );
                                const today = isToday(d);
                                return (
                                    <div key={dayOffset} className={`border rounded-xl p-3 min-h-64 ${today ? "border-blue-400 bg-blue-50/20" : "border-slate-200"}`}>
                                        <div className="text-center pb-2 border-b border-slate-100 mb-2">
                                            <p className="text-[11px] font-bold uppercase text-slate-400">
                                                {d.toLocaleDateString("en-IN", { weekday: "short" })}
                                            </p>
                                            <p className={`text-base font-bold ${today ? "text-blue-600" : "text-slate-800"}`}>
                                                {d.getDate()}
                                            </p>
                                        </div>
                                        <div className="space-y-1.5">
                                            {dayTasks.map((t) => (
                                                <div
                                                    key={t._id}
                                                    onClick={() => setSelectedTask(t)}
                                                    className="p-2 rounded-lg bg-white border border-slate-200 text-xs shadow-2xs cursor-pointer hover:border-blue-400 transition"
                                                >
                                                    <p className="font-semibold text-slate-800 truncate">{t.title}</p>
                                                    <span className="text-[10px] text-slate-400 capitalize">{t.priority}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    /* Day View */
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs max-w-2xl mx-auto">
                        <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
                            <FiCalendar className="w-5 h-5 text-blue-600" />
                            Tasks Scheduled for {currentDate.toLocaleDateString("en-IN", { dateStyle: "full" })}
                        </h3>
                        {(() => {
                            const dayTasks = filteredTasks.filter((t) =>
                                (t.dueDate && isSameDay(t.dueDate, currentDate)) ||
                                (t.startDate && isSameDay(t.startDate, currentDate))
                            );
                            if (dayTasks.length === 0) {
                                return (
                                    <p className="text-sm text-slate-400 italic py-8 text-center">
                                        No tasks scheduled for this day.
                                    </p>
                                );
                            }
                            return (
                                <div className="space-y-3">
                                    {dayTasks.map((task) => (
                                        <div
                                            key={task._id}
                                            onClick={() => setSelectedTask(task)}
                                            className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-400 cursor-pointer shadow-2xs transition flex items-center justify-between"
                                        >
                                            <div>
                                                <h4 className="font-bold text-sm text-slate-800">{task.title}</h4>
                                                <p className="text-xs text-slate-500 mt-0.5">{task.category || "General"}</p>
                                            </div>
                                            <span className="text-xs px-2.5 py-1 rounded-full uppercase font-semibold border bg-blue-50 text-blue-700 border-blue-200">
                                                {task.priority}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                    </div>
                )}

                {/* Task Details Modal */}
                {selectedTask && (
                    <TaskDetailModal
                        task={selectedTask}
                        onClose={() => setSelectedTask(null)}
                        onTaskUpdated={() => {
                            setSelectedTask(null);
                            fetchTasks();
                        }}
                    />
                )}
            </div>
        </Layout>
    );
}

