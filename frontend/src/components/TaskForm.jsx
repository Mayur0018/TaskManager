import { useEffect, useState } from "react";

function TaskForm({ onSubmit, editingTask, onCancel }) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("medium");
    const [category, setCategory] = useState("General");
    const [tags, setTags] = useState("");
    const [startDate, setStartDate] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [column, setColumn] = useState("todo");

    useEffect(() => {
        if (editingTask) {
            setTitle(editingTask.title || "");
            setDescription(editingTask.description || "");
            setPriority(editingTask.priority || "medium");
            setCategory(editingTask.category || "General");
            setTags(
                Array.isArray(editingTask.tags)
                    ? editingTask.tags.join(", ")
                    : editingTask.tags || ""
            );
            setColumn(editingTask.column || "todo");
            setStartDate(
                editingTask.startDate
                    ? new Date(editingTask.startDate).toISOString().split("T")[0]
                    : ""
            );
            setDueDate(
                editingTask.dueDate
                    ? new Date(editingTask.dueDate).toISOString().split("T")[0]
                    : ""
            );
        } else {
            setTitle("");
            setDescription("");
            setPriority("medium");
            setCategory("General");
            setTags("");
            setColumn("todo");
            setStartDate("");
            setDueDate("");
        }
    }, [editingTask]);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!title.trim()) return;

        // Parse comma-separated tags
        const parsedTags = tags
            .split(",")
            .map((t) => t.trim().replace(/^#/, ""))
            .filter(Boolean);

        onSubmit({
            title: title.trim(),
            description,
            priority,
            category: category.trim() || "General",
            tags: parsedTags,
            startDate: startDate || null,
            dueDate: dueDate || null,
            column
        });

        if (!editingTask) {
            setTitle("");
            setDescription("");
            setPriority("medium");
            setCategory("General");
            setTags("");
            setColumn("todo");
            setStartDate("");
            setDueDate("");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">
                {editingTask ? "Update Task" : "Add New Task"}
            </h2>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Task Title *</label>
                    <input
                        type="text"
                        placeholder="e.g. Implement user permission checks"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 text-sm transition"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <textarea
                        placeholder="Optional details, acceptance criteria, or notes..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows="3"
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 text-sm transition resize-none"
                    />
                </div>

                {/* Priority, Stage & Category Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                        <select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 text-sm bg-white cursor-pointer"
                        >
                            <option value="critical">Critical</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Stage / Column</label>
                        <select
                            value={column}
                            onChange={(e) => setColumn(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 text-sm bg-white cursor-pointer"
                        >
                            <option value="todo">To Do</option>
                            <option value="inprogress">In Progress</option>
                            <option value="inreview">In Review</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 text-sm bg-white cursor-pointer"
                        >
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

                {/* Dates & Tags Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 text-sm bg-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 text-sm bg-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tags (comma separated)</label>
                        <input
                            type="text"
                            placeholder="e.g. bug, auth, v2"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 text-sm bg-white"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                    <button
                        type="submit"
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium rounded-lg shadow-sm transition cursor-pointer"
                    >
                        {editingTask ? "Update Task" : "Add Task"}
                    </button>

                    {editingTask && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition cursor-pointer"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </div>
        </form>
    );
}

export default TaskForm;
