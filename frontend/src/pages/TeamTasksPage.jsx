import { useState, useEffect } from "react";
import {
    FiTarget,
    FiRefreshCw,
    FiSearch,
    FiUsers,
    FiCalendar,
    FiCheckSquare,
    FiCheckCircle,
    FiAlertOctagon,
    FiArrowUp,
    FiMinus,
    FiArrowDown
} from "react-icons/fi";
import api from "../api";
import Layout from "../components/Layout";
import TaskDetailModal from "../components/TaskDetailModal";

const STAGES = [
    { id: "todo",       label: "To Do",       color: "bg-slate-100 text-slate-700" },
    { id: "inprogress", label: "In Progress", color: "bg-blue-100 text-blue-800" },
    { id: "inreview",   label: "In Review",   color: "bg-amber-100 text-amber-800" },
    { id: "completed",  label: "Completed",   color: "bg-emerald-100 text-emerald-800" }
];

const PRIORITIES = {
    critical: "bg-red-50 text-red-700 border-red-200",
    high:     "bg-orange-50 text-orange-700 border-orange-200",
    medium:   "bg-amber-50 text-amber-700 border-amber-200",
    low:      "bg-emerald-50 text-emerald-700 border-emerald-200"
};

function TeamTasksPage() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterPriority, setFilterPriority] = useState("all");
    const [filterStage, setFilterStage] = useState("all");
    const [filterTeam, setFilterTeam] = useState("all");
    const [selectedTask, setSelectedTask] = useState(null);
    const [feedback, setFeedback] = useState("");

    const showMsg = (msg) => {
        setFeedback(msg);
        setTimeout(() => setFeedback(""), 3000);
    };

    const fetchMyTasks = async () => {
        try {
            setLoading(true);
            const res = await api.get("/teams/user/my-tasks");
            setTasks(res.data);
        } catch (err) {
            console.error("Failed to load assigned tasks:", err);
            showMsg("Failed to load your assigned team tasks");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyTasks();
    }, []);

    const handleColumnChange = async (task, newColumn) => {
        try {
            const teamId = task.team?._id || task.team;
            const res = await api.patch(`/teams/${teamId}/tasks/${task._id}`, {
                column: newColumn
            });
            setTasks(tasks.map((t) => (t._id === task._id ? res.data : t)));
            showMsg(`Task status updated to ${newColumn}`);
        } catch (err) {
            console.error(err);
            showMsg("Failed to update task status");
        }
    };

    const renderPriorityIcon = (p) => {
        switch (p) {
            case "critical":
                return <FiAlertOctagon className="w-3 h-3 text-red-600" />;
            case "high":
                return <FiArrowUp className="w-3 h-3 text-orange-600" />;
            case "low":
                return <FiArrowDown className="w-3 h-3 text-emerald-600" />;
            default:
                return <FiMinus className="w-3 h-3 text-amber-600" />;
        }
    };

    // Extract unique teams
    const uniqueTeams = Array.from(
        new Set(
            tasks
                .map((t) => (t.team ? { id: t.team._id || t.team, name: t.team.name || "Team" } : null))
                .filter(Boolean)
                .map((t) => JSON.stringify(t))
        )
    ).map((s) => JSON.parse(s));

    // Filter tasks
    const filteredTasks = tasks.filter((task) => {
        const matchesSearch =
            task.title.toLowerCase().includes(search.toLowerCase()) ||
            (task.description && task.description.toLowerCase().includes(search.toLowerCase()));

        const matchesPriority =
            filterPriority === "all" || task.priority === filterPriority;

        const matchesStage =
            filterStage === "all" || task.column === filterStage;

        const matchesTeam =
            filterTeam === "all" ||
            (task.team && (task.team._id || task.team) === filterTeam);

        return matchesSearch && matchesPriority && matchesStage && matchesTeam;
    });

    // Counts
    const completedCount = tasks.filter((t) => t.column === "completed" || t.status === "completed").length;
    const pendingCount = tasks.length - completedCount;
    const overdueCount = tasks.filter((t) => {
        if (!t.dueDate) return false;
        const due = new Date(t.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return due < today && t.column !== "completed";
    }).length;

    return (
        <Layout title="My Team Tasks">
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
                            <FiTarget className="w-6 h-6 text-blue-600" />
                            <span>My Team Tasks</span>
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            All tasks assigned to you across your collaborative teams.
                        </p>
                    </div>

                    <button
                        onClick={fetchMyTasks}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer self-start sm:self-auto"
                    >
                        <FiRefreshCw className="w-3.5 h-3.5" />
                        <span>Refresh</span>
                    </button>
                </div>

                {/* Feedback Toast */}
                {feedback && (
                    <div className="p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg mb-6 text-xs font-medium">
                        {feedback}
                    </div>
                )}

                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-xs font-semibold text-slate-400 block mb-1">Total Assigned</span>
                        <span className="text-2xl font-bold text-slate-800">{tasks.length}</span>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-xs font-semibold text-slate-400 block mb-1">In Progress / Todo</span>
                        <span className="text-2xl font-bold text-blue-600">{pendingCount}</span>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-xs font-semibold text-slate-400 block mb-1">Completed</span>
                        <span className="text-2xl font-bold text-emerald-600">{completedCount}</span>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-xs font-semibold text-slate-400 block mb-1">Overdue</span>
                        <span className="text-2xl font-bold text-red-600">{overdueCount}</span>
                    </div>
                </div>

                {/* Filters Toolbar */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    {/* Search */}
                    <div className="relative w-full md:w-80">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search assigned tasks..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    {/* Filter Dropdowns */}
                    <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
                        {/* Team Filter */}
                        {uniqueTeams.length > 1 && (
                            <select
                                value={filterTeam}
                                onChange={(e) => setFilterTeam(e.target.value)}
                                className="px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 cursor-pointer"
                            >
                                <option value="all">All Teams</option>
                                {uniqueTeams.map((team) => (
                                    <option key={team.id} value={team.id}>{team.name}</option>
                                ))}
                            </select>
                        )}

                        {/* Stage Filter */}
                        <select
                            value={filterStage}
                            onChange={(e) => setFilterStage(e.target.value)}
                            className="px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 cursor-pointer"
                        >
                            <option value="all">All Stages</option>
                            <option value="todo">To Do</option>
                            <option value="inprogress">In Progress</option>
                            <option value="inreview">In Review</option>
                            <option value="completed">Completed</option>
                        </select>

                        {/* Priority Filter */}
                        <select
                            value={filterPriority}
                            onChange={(e) => setFilterPriority(e.target.value)}
                            className="px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 cursor-pointer"
                        >
                            <option value="all">All Priorities</option>
                            <option value="critical">Critical</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                    </div>
                </div>

                {/* Tasks List */}
                {loading ? (
                    <div className="py-16 text-center text-slate-400 text-sm">Loading your team tasks...</div>
                ) : filteredTasks.length === 0 ? (
                    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                        <FiCheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-base font-bold text-slate-800 mb-1">No Assigned Tasks Found</h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                            {tasks.length === 0
                                ? "You don't have any tasks assigned to you across teams yet."
                                : "No tasks match your current search and filter criteria."}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredTasks.map((task) => {
                            const isDone = task.column === "completed" || task.status === "completed";
                            const isOverdue =
                                task.dueDate &&
                                new Date(task.dueDate) < new Date() &&
                                !isDone;

                            const subtasks = task.subtasks || [];
                            const doneSubtasks = subtasks.filter((s) => s.isCompleted).length;

                            return (
                                <div
                                    key={task._id}
                                    onClick={() => setSelectedTask(task)}
                                    className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs hover:shadow-md transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                            {/* Team Name Badge */}
                                            {task.team && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold">
                                                    <FiUsers className="w-3 h-3 text-indigo-600" />
                                                    <span>{task.team.name || "Team Task"}</span>
                                                </span>
                                            )}

                                            {/* Priority */}
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${PRIORITIES[task.priority] || PRIORITIES.medium}`}>
                                                {renderPriorityIcon(task.priority)}
                                                <span>{task.priority}</span>
                                            </span>

                                            {/* Category */}
                                            <span className="text-[11px] text-slate-500 font-medium">
                                                {task.category || "General"}
                                            </span>

                                            {/* Due date */}
                                            {task.dueDate && (
                                                <span className={`text-[11px] font-medium inline-flex items-center gap-1 ${isOverdue ? "text-red-600 font-bold" : "text-slate-400"}`}>
                                                    <FiCalendar className="w-3 h-3" />
                                                    <span>Due {new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                                                    {isOverdue && " (Overdue!)"}
                                                </span>
                                            )}
                                        </div>

                                        <h3 className={`text-base font-semibold ${isDone ? "line-through text-slate-400" : "text-slate-800"}`}>
                                            {task.title}
                                        </h3>

                                        {task.description && (
                                            <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                                                {task.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Actions & Status Dropdown */}
                                    <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                                        {/* Subtask indicator */}
                                        {subtasks.length > 0 && (
                                            <span className="inline-flex items-center gap-1 text-xs text-slate-600 font-medium bg-slate-100 px-2 py-1 rounded-md">
                                                <FiCheckSquare className="w-3 h-3 text-slate-500" />
                                                <span>{doneSubtasks}/{subtasks.length}</span>
                                            </span>
                                        )}

                                        {/* Stage selector */}
                                        <select
                                            value={task.column || "todo"}
                                            onChange={(e) => handleColumnChange(task, e.target.value)}
                                            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold bg-white text-slate-800 cursor-pointer shadow-2xs focus:ring-2 focus:ring-blue-500 outline-none"
                                        >
                                            {STAGES.map((s) => (
                                                <option key={s.id} value={s.id}>{s.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Task Detail Modal */}
                {selectedTask && (
                    <TaskDetailModal
                        task={selectedTask}
                        onClose={() => setSelectedTask(null)}
                        onTaskUpdated={(updated) => {
                            setTasks(tasks.map((t) => (t._id === updated._id ? updated : t)));
                            setSelectedTask(updated);
                        }}
                        onTaskDeleted={(deletedId) => {
                            setTasks(tasks.filter((t) => t._id !== deletedId));
                            setSelectedTask(null);
                        }}
                    />
                )}
            </div>
        </Layout>
    );
}

export default TeamTasksPage;
