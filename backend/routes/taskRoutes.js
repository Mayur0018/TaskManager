import express from "express";
import protect from "../middleware/authMiddleware.js";

import {
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    updateTaskColumn,
    reorderTasks,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    toggleArchiveTask,
    deleteTask
} from "../controllers/taskController.js";
import commentRoutes from "./commentRoutes.js";

const router = express.Router();

router.use("/:taskId/comments", commentRoutes);

router.get("/", protect, getTasks);
router.post("/", protect, createTask);

// Reorder must come before /:id parameterized routes
router.patch("/reorder", protect, reorderTasks);

router.get("/:id", protect, getTaskById);
router.put("/:id", protect, updateTask);
router.patch("/:id/column", protect, updateTaskColumn);
router.patch("/:id/archive", protect, toggleArchiveTask);

// Subtask routes
router.post("/:id/subtasks", protect, addSubtask);
router.patch("/:id/subtasks/:subtaskId", protect, toggleSubtask);
router.delete("/:id/subtasks/:subtaskId", protect, deleteSubtask);

router.delete("/:id", protect, deleteTask);

export default router;
