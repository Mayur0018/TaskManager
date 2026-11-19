import { useEffect, useState } from "react";
import {
    FiColumns,
    FiPlus,
    FiX,
    FiSearch,
    FiRefreshCw,
    FiList,
    FiClock,
    FiEye,
    FiCheckCircle
} from "react-icons/fi";
import api from "../api";
import Layout from "../components/Layout";
import KanbanColumn from "../components/KanbanColumn";
import TaskForm from "../components/TaskForm";
import TaskDetailModal from "../components/TaskDetailModal";

const COLUMNS = [
    { id: "todo", title: "To Do", icon: FiList },
    { id: "inprogress", title: "In Progress", icon: FiClock },
    { id: "inreview", title: "In Review", icon: FiEye },
    { id: "completed", title: "Completed", icon: FiCheckCircle }
];

function KanbanBoard() {
    const [tasks, setTasks] = useState([]);
    const [editingTask, setEditingTask] = useState(null);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [search, setSearch] = useState("");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState("");
    const [defaultColumn, setDefaultColumn] = useState("todo");

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const res = await api.get("/tasks");
            setTasks(res.data);
        } catch (err) {
            console.error("Failed to fetch tasks:", err);
            setFeedback("Error loading tasks");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const showMessage = (msg) => {
        setFeedback(msg);
        setTimeout(() => setFeedback(""), 3500);
    };

    // Drag and drop handler
    const handleDropTask = async (taskId, targetColumn) => {
        const task = tasks.find((t) => t._id === taskId);
        if (!task || task.column === targetColumn) return;

        // Optimistic UI update
        const prevTasks = [...tasks];
        setTasks((prev) =>
            prev.map((t) =>
                t._id === taskId
                    ? {
                        ...t,
                        column: targetColumn,
                        status: targetColumn === "completed" ? "completed" : "pending"
                    }
                    : t
            )
        );

        try {
            const res = await api.patch(`/tasks/${taskId}/column`, {
                column: targetColumn
            });
            showMessage(`Moved to ${res.data.column}`);
        } catch (err) {
            console.error("Status update failed:", err);
            setTasks(prevTasks);
            showMessage("Failed to update status. Please try again.");
        }
    };

    // Quick add button in column header
    const handleQuickAdd = (columnId) => {
        setEditingTask(null);
        setDefaultColumn(columnId);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Edit task clicked
    const handleEditTask = (task) => {
        setEditingTask(task);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Delete task
    const handleDeleteTask = async (taskId) => {
        if (!window.confirm("Are you sure you want to delete this task?")) return;

        const prevTasks = [...tasks];
        setTasks((prev) => prev.filter((t) => t._id !== taskId));

        try {
            await api.delete(`/tasks/${taskId}`);
            showMessage("Task deleted successfully");
        } catch (err) {
            console.error("Delete task failed:", err);
            setTasks(prevTasks);
            showMessage("Failed to delete task");
        }
    };

    // Submit task create / update
    const handleTaskSubmit = async (taskData) => {
        try {
            if (editingTask && editingTask._id) {
                const res = await api.put(`/tasks/${editingTask._id}`, taskData);
                setTasks((prev) =>
                    prev.map((t) => (t._id === editingTask._id ? res.data : t))
                );
                showMessage("Task updated successfully");
            } else {
                const res = await api.post("/tasks", {
                    ...taskData,
                    column: taskData.column || defaultColumn
                });
                setTasks((prev) => [res.data, ...prev]);
                showMessage("Task created successfully");
            }
            setShowForm(false);
            setEditingTask(null);
        } catch (err) {
            console.error("Task submission failed:", err);
            showMessage(err.response?.data?.message || "Failed to save task");
        }
    };

    // Filter tasks
    const filteredTasks = tasks.filter((task) => {
        const matchesSearch =
            !search ||
            task.title.toLowerCase().includes(search.toLowerCase()) ||
            (task.description &&
                task.description.toLowerCase().includes(search.toLowerCase())) ||
            (task.tags &&
                task.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())));

        const matchesPriority =
            priorityFilter === "all" || task.priority === priorityFilter;

        const matchesCategory =
            categoryFilter === "all" || (task.category || "General") === categoryFilter;

        return matchesSearch && matchesPriority && matchesCategory;
    });

    return (
        <Layout title="Kanban Board">
            <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <FiColumns className="w-6 h-6 text-blue-600" />
                            <span>Kanban Board</span>
                        </h1>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Drag and drop tasks between columns. Click any card to view subtasks and checklist.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            if (showForm) {
                                setShowForm(false);
                                setEditingTask(null);
                            } else {
                                setEditingTask(null);
                                setDefaultColumn("todo");
                                setShowForm(true);
                            }
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium rounded-lg shadow-sm transition flex items-center gap-2 cursor-pointer self-start md:self-auto"
                    >
                        {showForm ? (
                            <>
                                <FiX className="w-4 h-4" /> Close Form
                            </>
                        ) : (
                            <>
                                <FiPlus className="w-4 h-4" /> New Task
                            </>
                        )}
                    </button>
                </div>

                {/* Feedback Toast Banner */}
                {feedback && (
                    <div className="mb-4 px-4 py-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm flex items-center justify-between">
                        <span>{feedback}</span>
                        <button
                            onClick={() => setFeedback("")}
                            className="text-blue-500 hover:text-blue-700 font-bold ml-2 cursor-pointer"
                        >
                            <FiX className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Inline Task Form */}
                {showForm && (
                    <div className="mb-6">
                        <TaskForm
                            onSubmit={handleTaskSubmit}
                            editingTask={
                                editingTask || { column: defaultColumn, priority: "medium", category: "General" }
                            }
                            onCancel={() => {
                                setShowForm(false);
                                setEditingTask(null);
                            }}
                        />
                    </div>
                )}

                {/* Search & Filter Toolbar */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs mb-6 flex flex-col md:flex-row items-center justify-between gap-3">
                    <div className="relative w-full md:w-72">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search title, details, tags..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                        <span className="text-xs font-medium text-slate-500">Priority:</span>
                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white cursor-pointer"
                        >
                            <option value="all">All Priorities</option>
                            <option value="critical">Critical</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>

                        <span className="text-xs font-medium text-slate-500 ml-2">Category:</span>
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white cursor-pointer"
                        >
                            <option value="all">All Categories</option>
                            <option value="General">General</option>
                            <option value="Frontend">Frontend</option>
                            <option value="Backend">Backend</option>
                            <option value="Design">Design</option>
                            <option value="DevOps">DevOps</option>
                            <option value="QA / Testing">QA / Testing</option>
                            <option value="Marketing">Marketing</option>
                        </select>

                        <button
                            type="button"
                            onClick={fetchTasks}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-lg transition cursor-pointer ml-auto"
                            title="Refresh tasks"
                        >
                            <FiRefreshCw className="w-3.5 h-3.5" />
                            <span>Refresh</span>
                        </button>
                    </div>
                </div>

                {/* Kanban 4-Column Grid */}
                {loading ? (
                    <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
                        Loading Kanban board...
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                        {COLUMNS.map((col) => {
                            const columnTasks = filteredTasks.filter(
                                (t) => (t.column || "todo") === col.id
                            );
                            return (
                                <KanbanColumn
                                    key={col.id}
                                    column={col}
                                    tasks={columnTasks}
                                    onDropTask={handleDropTask}
                                    onEditTask={handleEditTask}
                                    onDeleteTask={handleDeleteTask}
                                    onQuickAdd={handleQuickAdd}
                                    onCardClick={(task) => setSelectedTask(task)}
                                />
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

export default KanbanBoard;
