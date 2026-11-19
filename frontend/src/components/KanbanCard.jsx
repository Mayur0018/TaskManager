import {
    FiCalendar,
    FiCheckSquare,
    FiEdit2,
    FiTrash2,
    FiAlertOctagon,
    FiArrowUp,
    FiMinus,
    FiArrowDown
} from "react-icons/fi";

function KanbanCard({ task, onEdit, onDelete, onDragStart, onCardClick }) {
    const isCompleted = task.column === "completed" || task.status === "completed";

    // Priority badges
    const priorityStyles = {
        critical: "bg-red-50 text-red-700 border-red-200 font-bold",
        high: "bg-orange-50 text-orange-700 border-orange-200",
        medium: "bg-amber-50 text-amber-700 border-amber-200",
        low: "bg-emerald-50 text-emerald-700 border-emerald-200"
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

    // Format due date & check overdue
    let isOverdue = false;
    let formattedDate = null;
    if (task.dueDate) {
        const due = new Date(task.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        isOverdue = due < today && !isCompleted;
        formattedDate = due.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric"
        });
    }

    // Subtask count
    const subtasks = task.subtasks || [];
    const completedSubtasks = subtasks.filter((s) => s.isCompleted).length;

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, task)}
            onClick={() => onCardClick && onCardClick(task)}
            className="bg-white rounded-lg p-3.5 border border-slate-200 shadow-2xs hover:shadow-md hover:border-slate-300 transition cursor-pointer group select-none"
        >
            {/* Header: Priority + Category / Due Date */}
            <div className="flex items-center justify-between gap-1.5 mb-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border uppercase tracking-wider font-semibold ${priorityStyles[task.priority] || priorityStyles.medium
                            }`}
                    >
                        {renderPriorityIcon(task.priority)}
                        <span>{task.priority || "medium"}</span>
                    </span>

                    {task.category && task.category !== "General" && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200">
                            {task.category}
                        </span>
                    )}
                </div>

                {formattedDate && (
                    <span
                        className={`text-[11px] inline-flex items-center gap-1 font-medium shrink-0 ${isOverdue
                                ? "text-red-600 bg-red-50 px-1.5 py-0.5 rounded font-bold"
                                : "text-slate-500"
                            }`}
                        title={isOverdue ? "Overdue deadline" : "Due date"}
                    >
                        <FiCalendar className="w-3 h-3 shrink-0" />
                        <span>{formattedDate}</span>
                    </span>
                )}
            </div>

            {/* Title */}
            <h4
                className={`font-semibold text-sm mb-1.5 line-clamp-2 ${isCompleted ? "line-through text-slate-400" : "text-slate-800"
                    }`}
            >
                {task.title}
            </h4>

            {/* Description Preview */}
            {task.description && (
                <p className="text-xs text-slate-500 line-clamp-2 mb-2.5">
                    {task.description}
                </p>
            )}

            {/* Tags & Subtasks Pill Row */}
            <div className="flex items-center justify-between gap-2 mb-2 text-xs">
                {/* Subtask checklist progress */}
                {subtasks.length > 0 ? (
                    <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium ${completedSubtasks === subtasks.length
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-slate-100 text-slate-600"
                            }`}
                    >
                        <FiCheckSquare className="w-3 h-3 text-slate-500" />
                        <span>{completedSubtasks}/{subtasks.length}</span>
                    </span>
                ) : (
                    <span />
                )}

                {/* Tags */}
                {task.tags && task.tags.length > 0 && (
                    <div className="flex items-center gap-1 overflow-hidden">
                        {task.tags.slice(0, 2).map((tag, idx) => (
                            <span
                                key={idx}
                                className="text-[10px] text-blue-600 bg-blue-50 px-1 py-0.5 rounded font-medium"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer with Edit & Delete actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-400">
                <div className="flex items-center gap-1.5 min-w-0">
                    {task.assignedTo && (
                        <div
                            className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-2xs"
                            title={`Assigned to ${task.assignedTo.name || task.assignedTo.email || "Member"}`}
                        >
                            {(task.assignedTo.name || "U").charAt(0).toUpperCase()}
                        </div>
                    )}
                    <span className="text-[11px] text-slate-400">
                        {new Date(task.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric"
                        })}
                    </span>
                </div>

                <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(task);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition cursor-pointer text-xs"
                        title="Edit task"
                    >
                        <FiEdit2 className="w-3 h-3" />
                        <span>Edit</span>
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(task._id);
                        }}
                        className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                        title="Delete task"
                    >
                        <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default KanbanCard;
