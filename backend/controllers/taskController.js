import Task from "../models/Task.js";
import Activity from "../models/Activity.js";
import { createNotification } from "../utils/notificationHelper.js";

const VALID_COLUMNS    = ["todo", "inprogress", "inreview", "completed"];
const VALID_PRIORITIES = ["low", "medium", "high", "critical"];
const VALID_STATUSES   = ["pending", "completed"];

// Helper to safely record activity log
const logActivity = async (userId, action, taskId, teamId = null, details = {}) => {
    try {
        await Activity.create({
            user: userId,
            action,
            task: taskId,
            team: teamId,
            details
        });
    } catch (err) {
        console.error("Failed to log activity:", err.message);
    }
};

// GET /api/tasks
export const getTasks = async (req, res) => {
    try {
        const {
            status,
            search,
            priority,
            column,
            category,
            tag,
            startDate,
            endDate,
            isArchived,
            sortBy
        } = req.query;

        const filter = {
            user: req.user._id,
            isDeleted: false
        };

        if (isArchived !== undefined) {
            filter.isArchived = isArchived === "true";
        } else {
            filter.isArchived = false;
        }

        if (status   && VALID_STATUSES.includes(status))     filter.status   = status;
        if (priority && VALID_PRIORITIES.includes(priority)) filter.priority = priority;
        if (column   && VALID_COLUMNS.includes(column))      filter.column   = column;
        if (category && category.trim())                     filter.category = category.trim();
        if (tag      && tag.trim())                          filter.tags     = tag.trim();

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
                { tags: { $in: [new RegExp(search, "i")] } }
            ];
        }

        if (startDate || endDate) {
            filter.dueDate = {};
            if (startDate) filter.dueDate.$gte = new Date(startDate);
            if (endDate)   filter.dueDate.$lte = new Date(endDate);
        }

        let sortOption = { order: 1, createdAt: -1 };
        if (sortBy === "dueDate")   sortOption = { dueDate: 1, createdAt: -1 };
        if (sortBy === "priority")  sortOption = { priority: 1, createdAt: -1 };
        if (sortBy === "title")     sortOption = { title: 1 };
        if (sortBy === "createdAt") sortOption = { createdAt: -1 };

        const tasks = await Task.find(filter)
            .sort(sortOption)
            .populate("assignedTo", "name email");

        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/tasks/:id
export const getTaskById = async (req, res) => {
    try {
        const task = await Task.findOne({
            _id: req.params.id,
            user: req.user._id,
            isDeleted: false
        }).populate("assignedTo", "name email");

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        res.json(task);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST /api/tasks
export const createTask = async (req, res) => {
    try {
        const {
            title,
            description,
            priority,
            startDate,
            dueDate,
            column,
            category,
            tags,
            subtasks,
            order,
            assignedTo,
            team
        } = req.body;

        if (!title?.trim()) {
            return res.status(400).json({ message: "Task title is required" });
        }

        const taskPriority = VALID_PRIORITIES.includes(priority) ? priority : "medium";
        const taskColumn   = VALID_COLUMNS.includes(column) ? column : "todo";

        const cleanSubtasks = Array.isArray(subtasks)
            ? subtasks
                  .filter((s) => s.title && s.title.trim())
                  .map((s) => ({ title: s.title.trim(), isCompleted: Boolean(s.isCompleted) }))
            : [];

        const cleanTags = Array.isArray(tags)
            ? tags.map((t) => String(t).trim()).filter(Boolean)
            : typeof tags === "string"
            ? tags.split(",").map((t) => t.trim()).filter(Boolean)
            : [];

        const task = await Task.create({
            title:       title.trim(),
            description: description || "",
            priority:    taskPriority,
            column:      taskColumn,
            status:      taskColumn === "completed" ? "completed" : "pending",
            startDate:   startDate ? new Date(startDate) : null,
            dueDate:     dueDate   ? new Date(dueDate)   : null,
            category:    category  ? category.trim()    : "General",
            tags:        cleanTags,
            subtasks:    cleanSubtasks,
            order:       typeof order === "number" ? order : 0,
            assignedTo:  assignedTo || null,
            team:        team || null,
            user:        req.user._id
        });

        await task.populate("assignedTo", "name email");

        await logActivity(req.user._id, "TASK_CREATED", task._id, null, {
            title: task.title,
            priority: task.priority,
            column: task.column
        });

        // Notify assignee if someone else was assigned
        if (assignedTo && assignedTo.toString() !== req.user._id.toString()) {
            await createNotification({
                recipientId: assignedTo,
                senderId:    req.user._id,
                type:        "TASK_ASSIGNED",
                message:     `${req.user.name} assigned you a task: "${task.title}"`,
                taskId:      task._id,
                teamId:      team || null
            });
        }

        res.status(201).json(task);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/tasks/:id
export const updateTask = async (req, res) => {
    try {
        const task = await Task.findOne({
            _id: req.params.id,
            user: req.user._id,
            isDeleted: false
        });

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const {
            title,
            description,
            status,
            priority,
            startDate,
            dueDate,
            column,
            category,
            tags,
            subtasks,
            order,
            isArchived,
            assignedTo,
            team
        } = req.body;

        const changes = {};

        if (title !== undefined) {
            task.title = title.trim();
        }
        if (description !== undefined) {
            task.description = description;
        }
        if (startDate !== undefined) {
            task.startDate = startDate ? new Date(startDate) : null;
        }
        if (dueDate !== undefined) {
            task.dueDate = dueDate ? new Date(dueDate) : null;
        }
        if (category !== undefined) {
            task.category = category.trim();
        }
        if (tags !== undefined) {
            task.tags = Array.isArray(tags)
                ? tags.map((t) => String(t).trim()).filter(Boolean)
                : typeof tags === "string"
                ? tags.split(",").map((t) => t.trim()).filter(Boolean)
                : [];
        }
        if (subtasks !== undefined && Array.isArray(subtasks)) {
            task.subtasks = subtasks;
        }
        if (order !== undefined && typeof order === "number") {
            task.order = order;
        }
        if (isArchived !== undefined) {
            task.isArchived = Boolean(isArchived);
        }
        if (assignedTo !== undefined) {
            const prevAssignedTo = task.assignedTo ? task.assignedTo.toString() : null;
            const newAssignedTo  = assignedTo || null;
            if (newAssignedTo && newAssignedTo.toString() !== prevAssignedTo) {
                changes.newAssignedTo = newAssignedTo;
            }
            task.assignedTo = newAssignedTo;
        }
        if (team !== undefined) {
            task.team = team || null;
        }

        if (priority !== undefined) {
            if (!VALID_PRIORITIES.includes(priority)) {
                return res.status(400).json({ message: "Invalid priority value" });
            }
            if (task.priority !== priority) {
                changes.oldPriority = task.priority;
                changes.newPriority = priority;
                task.priority = priority;
            }
        }

        if (column !== undefined) {
            if (!VALID_COLUMNS.includes(column)) {
                return res.status(400).json({ message: "Invalid column value" });
            }
            if (task.column !== column) {
                changes.oldColumn = task.column;
                changes.newColumn = column;
                task.column = column;
                task.status = column === "completed" ? "completed" : "pending";
            }
        }

        if (status !== undefined) {
            if (!VALID_STATUSES.includes(status)) {
                return res.status(400).json({ message: "Invalid task status" });
            }
            if (task.status !== status) {
                changes.oldStatus = task.status;
                changes.newStatus = status;
                task.status = status;
                if (status === "completed" && task.column !== "completed") {
                    task.column = "completed";
                }
            }
        }

        await task.save();
        await task.populate("assignedTo", "name email");

        if (Object.keys(changes).length > 0) {
            await logActivity(req.user._id, "TASK_UPDATED", task._id, null, changes);
        }

        // Notify assignee about status change
        if (changes.newStatus === "completed" && task.assignedTo &&
            task.assignedTo._id.toString() !== req.user._id.toString()) {
            await createNotification({
                recipientId: task.assignedTo._id,
                senderId:    req.user._id,
                type:        "TASK_STATUS_CHANGED",
                message:     `Task "${task.title}" has been marked as completed`,
                taskId:      task._id
            });
        }

        // Notify new assignee if assignedTo changed
        if (changes.newAssignedTo && changes.newAssignedTo.toString() !== req.user._id.toString()) {
            await createNotification({
                recipientId: changes.newAssignedTo,
                senderId:    req.user._id,
                type:        "TASK_ASSIGNED",
                message:     `${req.user.name} assigned you a task: "${task.title}"`,
                taskId:      task._id
            });
        }

        res.json(task);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PATCH /api/tasks/:id/column (For drag and drop between columns)
export const updateTaskColumn = async (req, res) => {
    try {
        const { column, order } = req.body;

        if (!column || !VALID_COLUMNS.includes(column)) {
            return res.status(400).json({ message: "Invalid column value" });
        }

        const task = await Task.findOne({
            _id: req.params.id,
            user: req.user._id,
            isDeleted: false
        });

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const oldColumn = task.column;
        task.column = column;
        task.status = column === "completed" ? "completed" : "pending";
        if (typeof order === "number") {
            task.order = order;
        }

        await task.save();

        await logActivity(req.user._id, "COLUMN_CHANGED", task._id, null, {
            from: oldColumn,
            to: column
        });

        res.json(task);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PATCH /api/tasks/reorder (Bulk update orders within columns)
export const reorderTasks = async (req, res) => {
    try {
        const { tasks } = req.body;

        if (!Array.isArray(tasks) || tasks.length === 0) {
            return res.status(400).json({ message: "Tasks array is required for reordering" });
        }

        const bulkOps = tasks.map((t) => ({
            updateOne: {
                filter: { _id: t.id, user: req.user._id },
                update: {
                    $set: {
                        column: t.column,
                        order: typeof t.order === "number" ? t.order : 0,
                        status: t.column === "completed" ? "completed" : "pending"
                    }
                }
            }
        }));

        await Task.bulkWrite(bulkOps);

        res.json({ message: "Tasks reordered successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST /api/tasks/:id/subtasks
export const addSubtask = async (req, res) => {
    try {
        const { title } = req.body;
        if (!title?.trim()) {
            return res.status(400).json({ message: "Subtask title is required" });
        }

        const task = await Task.findOne({
            _id: req.params.id,
            user: req.user._id,
            isDeleted: false
        });

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        task.subtasks.push({
            title: title.trim(),
            isCompleted: false
        });

        await task.save();

        await logActivity(req.user._id, "SUBTASK_ADDED", task._id, null, {
            subtaskTitle: title.trim()
        });

        res.status(201).json(task);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PATCH /api/tasks/:id/subtasks/:subtaskId
export const toggleSubtask = async (req, res) => {
    try {
        const task = await Task.findOne({
            _id: req.params.id,
            user: req.user._id,
            isDeleted: false
        });

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const subtask = task.subtasks.id(req.params.subtaskId);
        if (!subtask) {
            return res.status(404).json({ message: "Subtask not found" });
        }

        if (req.body.isCompleted !== undefined) {
            subtask.isCompleted = Boolean(req.body.isCompleted);
        } else {
            subtask.isCompleted = !subtask.isCompleted;
        }

        if (req.body.title && req.body.title.trim()) {
            subtask.title = req.body.title.trim();
        }

        await task.save();

        await logActivity(req.user._id, "SUBTASK_TOGGLED", task._id, null, {
            subtaskId: subtask._id,
            isCompleted: subtask.isCompleted
        });

        res.json(task);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE /api/tasks/:id/subtasks/:subtaskId
export const deleteSubtask = async (req, res) => {
    try {
        const task = await Task.findOne({
            _id: req.params.id,
            user: req.user._id,
            isDeleted: false
        });

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        task.subtasks.pull({ _id: req.params.subtaskId });
        await task.save();

        res.json(task);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PATCH /api/tasks/:id/archive
export const toggleArchiveTask = async (req, res) => {
    try {
        const task = await Task.findOne({
            _id: req.params.id,
            user: req.user._id,
            isDeleted: false
        });

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        task.isArchived = !task.isArchived;
        await task.save();

        await logActivity(
            req.user._id,
            task.isArchived ? "TASK_ARCHIVED" : "TASK_RESTORED",
            task._id
        );

        res.json(task);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE /api/tasks/:id
export const deleteTask = async (req, res) => {
    try {
        const { permanent } = req.query;

        let task;
        if (permanent === "true") {
            task = await Task.findOneAndDelete({
                _id: req.params.id,
                user: req.user._id
            });
        } else {
            task = await Task.findOneAndUpdate(
                { _id: req.params.id, user: req.user._id },
                { $set: { isDeleted: true } },
                { new: true }
            );
        }

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        await logActivity(req.user._id, "TASK_DELETED", task._id, null, {
            title: task.title,
            permanent: permanent === "true"
        });

        res.json({ message: "Task deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
