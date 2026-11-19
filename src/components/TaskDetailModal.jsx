import { useState } from "react";
import {
    FiX,
    FiFolder,
    FiArchive,
    FiCalendar,
    FiTag,
    FiCheckSquare,
    FiTrash2,
    FiPlus,
    FiCheck,
    FiRotateCcw,
    FiEdit2,
    FiAlertOctagon,
    FiArrowUp,
    FiMinus,
    FiArrowDown
} from "react-icons/fi";
import api from "../api";
import CommentThread from "./CommentThread";

function TaskDetailModal({ task, onClose, onTaskUpdated, onTaskDeleted, onEditClick }) {
    const [currentTask, setCurrentTask] = useState(task);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
    const [loadingSubtask, setLoadingSubtask] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [feedback, setFeedback] = useState("");

    if (!currentTask) return null;

    const showMsg = (msg) => {
        setFeedback(msg);
        setTimeout(() => setFeedback(""), 3000);
    };

    // Subtask count & progress calculation
    const subtasks = currentTask.subtasks || [];
    const completedSubtasks = subtasks.filter((s) => s.isCompleted).length;
    const progressPercent = subtasks.length > 0
        ? Math.round((completedSubtasks / subtasks.length) * 100)
        : 0;

    const isCompleted = currentTask.column === "completed" || currentTask.status === "completed";

    // Toggle subtask completion
    const handleToggleSubtask = async (subtaskId, currentStatus) => {
        try {
            const res = await api.patch(
                `/tasks/${currentTask._id}/subtasks/${subtaskId}`,
                { isCompleted: !currentStatus }
            );
            setCurrentTask(res.data);
            if (onTaskUpdated) onTaskUpdated(res.data);
        } catch (err) {
            console.error("Failed to toggle subtask:", err);
            showMsg("Failed to update checklist item");
        }
    };

    // Add new subtask
    const handleAddSubtask = async (e) => {
        e.preventDefault();
        if (!newSubtaskTitle.trim()) return;

        setLoadingSubtask(true);
        try {
            const res = await api.post(`/tasks/${currentTask._id}/subtasks`, {
                title: newSubtaskTitle.trim()
            });
            setCurrentTask(res.data);
            setNewSubtaskTitle("");
            if (onTaskUpdated) onTaskUpdated(res.data);
            showMsg("Checklist item added");
        } catch (err) {
            console.error("Failed to add subtask:", err);
            showMsg("Failed to add subtask");
        } finally {
            setLoadingSubtask(false);
        }
    };

    // Delete subtask
    const handleDeleteSubtask = async (subtaskId) => {
        try {
            const res = await api.delete(`/tasks/${currentTask._id}/subtasks/${subtaskId}`);
            setCurrentTask(res.data);
            if (onTaskUpdated) onTaskUpdated(res.data);
            showMsg("Checklist item removed");
        } catch (err) {
            console.error("Failed to delete subtask:", err);
            showMsg("Failed to delete subtask");
        }
    };

    // Toggle Task Complete Status
    const handleToggleStatus = async () => {
        setActionLoading(true);
        try {
            const newStatus = isCompleted ? "pending" : "completed";
            const newColumn = isCompleted ? "todo" : "completed";

            const res = await api.put(`/tasks/${currentTask._id}`, {
                status: newStatus,
                column: newColumn
            });
            setCurrentTask(res.data);
            if (onTaskUpdated) onTaskUpdated(res.data);
            showMsg(isCompleted ? "Task reopened" : "Task marked complete!");
        } catch (err) {
            console.error("Failed to update task status:", err);
            showMsg("Failed to update status");
        } finally {
            setActionLoading(false);
        }
    };

    // Toggle Archive
    const handleToggleArchive = async () => {
        setActionLoading(true);
        try {
            const res = await api.patch(`/tasks/${currentTask._id}/archive`);
            setCurrentTask(res.data);
            if (onTaskUpdated) onTaskUpdated(res.data);
            showMsg(res.data.isArchived ? "Task archived" : "Task restored from archive");
        } catch (err) {
            console.error("Failed to archive task:", err);
            showMsg("Failed to archive task");
        } finally {
            setActionLoading(false);
        }
    };

    // Priority badges
    const priorityBadge = (p) => {
        const styles = {
            critical: "bg-red-50 text-red-700 border-red-200 font-bold",
            high: "bg-orange-50 text-orange-700 border-orange-200 font-semibold",
            medium: "bg-amber-50 text-amber-700 border-amber-200 font-semibold",
            low: "bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold"
        };
        const icons = {
            critical: <FiAlertOctagon className="w-3.5 h-3.5 text-red-600" />,
            high: <FiArrowUp className="w-3.5 h-3.5 text-orange-600" />,
            medium: <FiMinus className="w-3.5 h-3.5 text-amber-600" />,
            low: <FiArrowDown className="w-3.5 h-3.5 text-emerald-600" />
        };
        return (
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs border uppercase tracking-wider ${styles[p] || styles.medium}`}>
                {icons[p] || icons.medium}
                <span>{p || "medium"}</span>
            </span>
        );
    };

    // Check overdue
    let isOverdue = false;
    let formattedDue = null;
    if (currentTask.dueDate) {
        const due = new Date(currentTask.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        isOverdue = due < today && !isCompleted;
        formattedDue = due.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <div
                className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="p-6 border-b border-slate-200 flex items-start justify-between gap-4 bg-slate-50/50">
                    <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            {priorityBadge(currentTask.priority)}
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-slate-200/80 text-slate-700">
                                <FiFolder className="w-3.5 h-3.5" />
                                <span>{currentTask.category || "General"}</span>
                            </span>
                            <span className="px-2.5 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 uppercase tracking-wide">
                                {currentTask.column || "todo"}
                            </span>
                            {currentTask.isArchived && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                    <FiArchive className="w-3.5 h-3.5" />
                                    <span>Archived</span>
                                </span>
                            )}
                        </div>
                        <h2 className={`text-xl font-bold ${isCompleted ? "line-through text-slate-400" : "text-slate-900"}`}>
                            {currentTask.title}
                        </h2>
                    </div>

                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 p-2 rounded-lg transition cursor-pointer"
                        title="Close modal"
                    >
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                {/* Feedback Toast */}
                {feedback && (
                    <div className="px-6 py-2 bg-blue-50 border-b border-blue-100 text-blue-700 text-xs font-medium">
                        {feedback}
                    </div>
                )}

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Description */}
                    <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                            Description
                        </h4>
                        <p className="text-sm text-slate-700 whitespace-pre-line bg-slate-50 p-3.5 rounded-lg border border-slate-100 min-h-[60px]">
                            {currentTask.description || <span className="text-slate-400 italic">No description provided.</span>}
                        </p>
                    </div>

                    {/* Assigned User Info */}
                    {currentTask.assignedTo && (
                        <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-100 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-2xs">
                                {(currentTask.assignedTo.name || "U").charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
                                    Assigned Team Member
                                </span>
                                <p className="text-sm font-semibold text-slate-800 truncate">
                                    {currentTask.assignedTo.name}
                                </p>
                                <p className="text-xs text-slate-500 truncate">
                                    {currentTask.assignedTo.email}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Metadata Grid (Dates & Tags) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-start gap-2.5">
                            <FiCalendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                            <div>
                                <span className="font-semibold text-slate-500 block mb-0.5">Start Date</span>
                                <span className="text-slate-800">
                                    {currentTask.startDate ? new Date(currentTask.startDate).toLocaleDateString() : "Not set"}
                                </span>
                            </div>
                        </div>

                        <div className={`p-3 rounded-lg border flex items-start gap-2.5 ${isOverdue ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-100"}`}>
                            <FiCalendar className={`w-4 h-4 mt-0.5 shrink-0 ${isOverdue ? "text-red-500" : "text-slate-400"}`} />
                            <div>
                                <span className="font-semibold text-slate-500 block mb-0.5">Due Date</span>
                                <span className={isOverdue ? "text-red-700 font-bold" : "text-slate-800"}>
                                    {formattedDue ? `${formattedDue} ${isOverdue ? "(Overdue)" : ""}` : "Not set"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Tags */}
                    {currentTask.tags && currentTask.tags.length > 0 && (
                        <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                                Tags
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                                {currentTask.tags.map((tag, idx) => (
                                    <span
                                        key={idx}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium"
                                    >
                                        <FiTag className="w-3 h-3" />
                                        <span>{tag}</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Subtasks / Checklist Section */}
                    <div className="pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <FiCheckSquare className="w-4 h-4 text-blue-600" />
                                <span>Checklist & Subtasks</span>
                                <span className="text-xs font-normal text-slate-500">
                                    ({completedSubtasks} of {subtasks.length} completed)
                                </span>
                            </h4>
                            <span className="text-xs font-bold text-blue-600">{progressPercent}%</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-4">
                            <div
                                className={`h-full transition-all duration-300 ${
                                    progressPercent === 100 ? "bg-emerald-500" : "bg-blue-600"
                                }`}
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>

                        {/* Subtasks List */}
                        <div className="space-y-2 mb-4">
                            {subtasks.length === 0 ? (
                                <p className="text-xs text-slate-400 italic py-1">No checklist items yet.</p>
                            ) : (
                                subtasks.map((st) => (
                                    <div
                                        key={st._id}
                                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100/80 border border-slate-100 transition group"
                                    >
                                        <label className="flex items-center gap-3 cursor-pointer flex-1">
                                            <input
                                                type="checkbox"
                                                checked={st.isCompleted}
                                                onChange={() => handleToggleSubtask(st._id, st.isCompleted)}
                                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                            />
                                            <span className={`text-sm ${st.isCompleted ? "line-through text-slate-400" : "text-slate-800"}`}>
                                                {st.title}
                                            </span>
                                        </label>

                                        <button
                                            type="button"
                                            onClick={() => handleDeleteSubtask(st._id)}
                                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 p-1 rounded transition text-xs cursor-pointer"
                                            title="Delete item"
                                        >
                                            <FiTrash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Add Subtask Form */}
                        <form onSubmit={handleAddSubtask} className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Add a checklist item (e.g. Write unit tests)..."
                                value={newSubtaskTitle}
                                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                            <button
                                type="submit"
                                disabled={loadingSubtask || !newSubtaskTitle.trim()}
                                className="inline-flex items-center gap-1 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
                            >
                                <FiPlus className="w-3.5 h-3.5" />
                                <span>{loadingSubtask ? "Adding..." : "Add"}</span>
                            </button>
                        </form>
                    </div>

                    {/* Comments & Discussion */}
                    <CommentThread taskId={currentTask._id} />
                </div>

                {/* Modal Footer / Actions */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={actionLoading}
                            onClick={handleToggleStatus}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
                                isCompleted
                                    ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                            }`}
                        >
                            {isCompleted ? (
                                <>
                                    <FiRotateCcw className="w-3.5 h-3.5" /> Reopen Task
                                </>
                            ) : (
                                <>
                                    <FiCheck className="w-3.5 h-3.5" /> Mark Done
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            disabled={actionLoading}
                            onClick={handleToggleArchive}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg transition cursor-pointer"
                        >
                            <FiArchive className="w-3.5 h-3.5" />
                            <span>{currentTask.isArchived ? "Restore" : "Archive"}</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                onClose();
                                if (onEditClick) onEditClick(currentTask);
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition cursor-pointer"
                        >
                            <FiEdit2 className="w-3.5 h-3.5" />
                            <span>Edit Task</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                onClose();
                                if (onTaskDeleted) onTaskDeleted(currentTask._id);
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                        >
                            <FiTrash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TaskDetailModal;
