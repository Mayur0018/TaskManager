import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications
} from "../controllers/notificationController.js";

const router = express.Router();

router.get("/",                     protect, getNotifications);
router.get("/unread-count",         protect, getUnreadCount);
router.patch("/mark-all-read",      protect, markAllAsRead);
router.delete("/delete-all",        protect, deleteAllNotifications);
router.patch("/:id/read",           protect, markAsRead);
router.delete("/:id",               protect, deleteNotification);

export default router;

