import { useState } from "react";
import { FiPlus } from "react-icons/fi";
import KanbanCard from "./KanbanCard";

function KanbanColumn({
    column,
    tasks,
    onDropTask,
    onEditTask,
    onDeleteTask,
    onQuickAdd,
    onCardClick
}) {
    const [isOver, setIsOver] = useState(false);

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (!isOver) setIsOver(true);
    };

    const handleDragLeave = () => {
        setIsOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsOver(false);
        const taskId = e.dataTransfer.getData("text/plain");
        if (taskId) {
            onDropTask(taskId, column.id);
        }
    };

    const handleCardDragStart = (e, task) => {
        e.dataTransfer.setData("text/plain", task._id);
        e.dataTransfer.effectAllowed = "move";
    };

    const IconComp = typeof column.icon === "function" ? column.icon : null;

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex flex-col bg-slate-100/80 rounded-xl p-3 border transition-all duration-150 min-h-[500px] ${
                isOver
                    ? "border-blue-500 bg-blue-50/50 ring-2 ring-blue-300"
                    : "border-slate-200"
            }`}
        >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/80">
                <div className="flex items-center gap-2">
                    {IconComp ? (
                        <IconComp className="w-4 h-4 text-slate-600" />
                    ) : (
                        <span className="text-base">{column.icon}</span>
                    )}
                    <h3 className="font-semibold text-slate-800 text-sm">{column.title}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
                        {tasks.length}
                    </span>
                </div>

                <button
                    type="button"
                    onClick={() => onQuickAdd(column.id)}
                    className="w-6 h-6 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition cursor-pointer"
                    title={`Add task to ${column.title}`}
                >
                    <FiPlus className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Column Task Cards */}
            <div className="flex-1 space-y-3 overflow-y-auto pr-0.5">
                {tasks.length === 0 ? (
                    <div className="h-32 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-xs text-slate-400">
                        Drop tasks here
                    </div>
                ) : (
                    tasks.map((task) => (
                        <KanbanCard
                            key={task._id}
                            task={task}
                            onEdit={onEditTask}
                            onDelete={onDeleteTask}
                            onDragStart={handleCardDragStart}
                            onCardClick={onCardClick}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

export default KanbanColumn;
