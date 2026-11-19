import { useEffect, useState } from "react";
import {
    FiArchive,
    FiSearch,
    FiFolder,
    FiCheckSquare,
    FiCalendar,
    FiCheck,
    FiEdit2,
    FiTrash2,
    FiAlertOctagon,
    FiArrowUp,
    FiMinus,
    FiArrowDown,
    FiList,
    FiClock,
    FiEye,
    FiCheckCircle
} from "react-icons/fi";
import api from "../api";
import Layout from "../components/Layout";
import TaskForm from "../components/TaskForm";
import TaskDetailModal from "../components/TaskDetailModal";

function Dashboard() {
    const [tasks, setTasks] = useState([]);
    const [editingTask, setEditingTask] = useState(null);
    const [selectedTask, setSelectedTask] = useState(null);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [priority, setPriority] = useState("");
    const [category, setCategory] = useState("");
    const [showArchived, setShowArchived] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const fetchTasks = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/tasks", {
                params: {
                    search,
                    status: status || undefined,
                    priority: priority || undefined,
                    category: category || undefined,
                    isArchived: showArchived ? "true" : "false"
                }
            });

            setTasks(response.data);
        } catch (error) {
            setError(error.response?.data?.message || "Unable to load tasks");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, [search, status, priority, category, showArchived]);

    const handleSubmit = async (taskData) => {
        try {
            if (editingTask) {
                await api.put(`/tasks/${editingTask._id}`, taskData);
                setEditingTask(null);
            } else {
                await api.post("/tasks", taskData);
            }

            await fetchTasks();
        } catch (error) {
            setError(error.response?.data?.message || "Unable to save task");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this task?")) {
            return;
        }

        try {
            await api.delete(`/tasks/${id}`);
            if (selectedTask?._id === id) setSelectedTask(null);
            await fetchTasks();
        } catch (error) {
            setError(error.response?.data?.message || "Unable to delete task");
        }
    };

    const handleStatus = async (task) => {
        try {
            const newStatus =
                task.status === "completed" ? "pending" : "completed";
            const newColumn = newStatus === "completed" ? "completed" : "todo";

            await api.put(`/tasks/${task._id}`, {
                status: newStatus,
                column: newColumn
            });

            await fetchTasks();
        } catch (error) {
            setError(error.response?.data?.message || "Unable to update status");
        }
    };

    const priorityBadge = (p) => {
        if (p === "critical") {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                    <FiAlertOctagon className="w-3 h-3 text-red-600" />
                    <span>Critical</span>
                </span>
            );
        }
        if (p === "high") {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-700">
                    <FiArrowUp className="w-3 h-3 text-orange-600" />
                    <span>High</span>
                </span>
            );
        }
        if (p === "low") {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-700">
                    <FiArrowDown className="w-3 h-3 text-emerald-600" />
                    <span>Low</span>
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-700">
                <FiMinus className="w-3 h-3 text-amber-600" />
                <span>Medium</span>
            </span>
        );
    };

    const columnBadge = (col) => {
        const conf = {
            todo:       { label: "To Do",       icon: FiList },
            inprogress: { label: "In Progress", icon: FiClock },
            inreview:   { label: "In Review",   icon: FiEye },
            completed:  { label: "Completed",   icon: FiCheckCircle }
        };
        const current = conf[col] || conf.todo;
        const IconComponent = current.icon;
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                <IconComponent className="w-3 h-3 text-slate-500" />
                <span>{current.label}</span>
            </span>
        );
    };

    return (
        <Layout title="Personal Dashboard">
            <div className="p-4 sm:p-6 max-w-6xl mx-auto w-full">
                {/* Header Banner */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Task Overview</h1>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Welcome back, <span className="font-semibold text-slate-700">{user.name || "User"}</span>! Manage and track your tasks.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowArchived(!showArchived)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer self-start sm:self-auto ${
                            showArchived
                                ? "bg-purple-100 text-purple-800 border-purple-300"
                                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                        }`}
                    >
                        <FiArchive className="w-3.5 h-3.5" />
                        <span>{showArchived ? "Viewing Archived" : "View Archive"}</span>
                    </button>
                </div>

                {/* Inline Add / Edit Form */}
                <TaskForm
                    onSubmit={handleSubmit}
                    editingTask={editingTask}
                    onCancel={() => setEditingTask(null)}
                />

                {/* Filter and Search Bar */}
                <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <h2 className="text-xl font-semibold text-slate-800">
                            {showArchived ? "Archived Tasks" : "Your Tasks"} ({tasks.length})
                        </h2>

                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative w-full sm:w-48">
                                <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search tasks or tags..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-8 pr-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-full"
                                />
                            </div>

                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white cursor-pointer"
                            >
                                <option value="">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                            </select>

                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                                className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white cursor-pointer"
                            >
                                <option value="">All Priorities</option>
                                <option value="critical">Critical</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>

                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white cursor-pointer"
                            >
                                <option value="">All Categories</option>
                                <option value="General">General</option>
                                <option value="Frontend">Frontend</option>
                                <option value="Backend">Backend</option>
                                <option value="Design">Design</option>
                                <option value="DevOps">DevOps</option>
                                <option value="QA / Testing">QA / Testing</option>
                                <option value="Marketing">Marketing</option>
                            </select>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="py-12 text-center text-slate-500 text-sm">
                            Loading tasks...
                        </div>
                    ) : tasks.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 text-sm">
                            {showArchived
                                ? "No archived tasks."
                                : "No tasks found. Add your first task above!"}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {tasks.map((task) => {
                                const isCompleted = task.status === "completed";
                                const subtasks = task.subtasks || [];
                                const completedSubtasks = subtasks.filter((s) => s.isCompleted).length;

                                return (
                                    <article
                                        key={task._id}
                                        onClick={() => setSelectedTask(task)}
                                        className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border transition cursor-pointer ${
                                            isCompleted
                                                ? "bg-slate-50/60 border-slate-200 hover:border-slate-300"
                                                : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs"
                                        }`}
                                    >
                                        <div className="flex-1 pr-4 mb-3 sm:mb-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                                <h3
                                                    className={`text-base font-semibold ${
                                                        isCompleted
                                                            ? "line-through text-slate-400"
                                                            : "text-slate-800"
                                                    }`}
                                                >
                                                    {task.title}
                                                </h3>
                                                {priorityBadge(task.priority)}
                                                {columnBadge(task.column)}
                                                {task.category && task.category !== "General" && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                                                        <FiFolder className="w-3 h-3" />
                                                        <span>{task.category}</span>
                                                    </span>
                                                )}
                                                {subtasks.length > 0 && (
                                                    <span
                                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
                                                            completedSubtasks === subtasks.length
                                                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                                : "bg-slate-100 text-slate-600 border border-slate-200"
                                                        }`}
                                                    >
                                                        <FiCheckSquare className="w-3 h-3" />
                                                        <span>{completedSubtasks}/{subtasks.length}</span>
                                                    </span>
                                                )}
                                                {task.dueDate && (
                                                    <span className="text-xs text-slate-500 inline-flex items-center gap-1 font-medium bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                                                        <FiCalendar className="w-3 h-3 text-slate-400" />
                                                        <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                                                    </span>
                                                )}
                                            </div>

                                            <p
                                                className={`text-sm mb-2 ${
                                                    isCompleted
                                                        ? "text-slate-400"
                                                        : "text-slate-600"
                                                }`}
                                            >
                                                {task.description || "No description"}
                                            </p>

                                            {/* Tags */}
                                            {task.tags && task.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                    {task.tags.map((t, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="text-[11px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded"
                                                        >
                                                            #{t}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div
                                            className="flex items-center gap-2 self-end sm:self-center"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button
                                                onClick={() => handleStatus(task)}
                                                className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition cursor-pointer ${
                                                    isCompleted
                                                        ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                                                        : "bg-emerald-600 text-white hover:bg-emerald-700"
                                                }`}
                                            >
                                                <FiCheck className="w-3 h-3" />
                                                <span>{isCompleted ? "Mark Pending" : "Complete"}</span>
                                            </button>

                                            <button
                                                onClick={() => {
                                                    setEditingTask(task);
                                                    window.scrollTo({ top: 0, behavior: "smooth" });
                                                }}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition cursor-pointer"
                                            >
                                                <FiEdit2 className="w-3 h-3" />
                                                <span>Edit</span>
                                            </button>

                                            <button
                                                onClick={() => handleDelete(task._id)}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition cursor-pointer"
                                            >
                                                <FiTrash2 className="w-3 h-3" />
                                                <span>Delete</span>
                                            </button>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Task Detail Modal */}
                {selectedTask && (
                    <TaskDetailModal
                        task={selectedTask}
                        onClose={() => setSelectedTask(null)}
                        onTaskUpdated={(updated) => {
                            setTasks((prev) =>
                                prev.map((t) => (t._id === updated._id ? updated : t))
                            );
                            setSelectedTask(updated);
                        }}
                        onTaskDeleted={(id) => {
                            setTasks((prev) => prev.filter((t) => t._id !== id));
                            setSelectedTask(null);
                        }}
                        onEditClick={(taskToEdit) => {
                            setEditingTask(taskToEdit);
                            setShowForm(true);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                    />
                )}
            </div>
        </Layout>
    );
}

export default Dashboard;
