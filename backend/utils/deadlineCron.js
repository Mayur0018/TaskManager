// utils/deadlineCron.js
// Runs every 15 minutes to check for tasks approaching deadline

import cron from "node-cron";
import Task from "../models/Task.js";
import { createNotification } from "./notificationHelper.js";

export const startDeadlineCron = () => {
    // Run every 15 minutes
    cron.schedule("*/15 * * * *", async () => {
        try {
            const now = new Date();

            // Window: tasks due in next 1 hour (but NOT yet reminded for 1h)
            const oneHourLater    = new Date(now.getTime() + 60 * 60 * 1000);
            // Window: tasks due in next 24 hours (but NOT yet reminded for 24h)
            const twentyFourLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);

            // 24-hour reminder — tasks due between 23h45m and 24h15m from now
            const tasks24 = await Task.find({
                isDeleted:  false,
                isArchived: false,
                dueDate: {
                    $gte: new Date(twentyFourLater.getTime() - 15 * 60 * 1000),
                    $lte: new Date(twentyFourLater.getTime() + 15 * 60 * 1000)
                }
            }).populate("user", "name email").populate("assignedTo", "name email");

            for (const task of tasks24) {
                // Notify owner
                if (task.user) {
                    await createNotification({
                        recipientId: task.user._id,
                        type:        "TASK_DEADLINE_APPROACHING",
                        message:     `⏰ Task "${task.title}" is due in 24 hours!`,
                        taskId:      task._id
                    });
                }
                // Notify assignee (if different from owner)
                if (task.assignedTo && task.assignedTo._id.toString() !== task.user._id.toString()) {
                    await createNotification({
                        recipientId: task.assignedTo._id,
                        type:        "TASK_DEADLINE_APPROACHING",
                        message:     `⏰ Task "${task.title}" assigned to you is due in 24 hours!`,
                        taskId:      task._id
                    });
                }
            }

            // 1-hour reminder — tasks due between 45m and 1h15m from now
            const tasks1h = await Task.find({
                isDeleted:  false,
                isArchived: false,
                dueDate: {
                    $gte: new Date(oneHourLater.getTime() - 15 * 60 * 1000),
                    $lte: new Date(oneHourLater.getTime() + 15 * 60 * 1000)
                }
            }).populate("user", "name email").populate("assignedTo", "name email");

            for (const task of tasks1h) {
                if (task.user) {
                    await createNotification({
                        recipientId: task.user._id,
                        type:        "TASK_DEADLINE_APPROACHING",
                        message:     `🚨 Task "${task.title}" is due in 1 hour!`,
                        taskId:      task._id
                    });
                }
                if (task.assignedTo && task.assignedTo._id.toString() !== task.user._id.toString()) {
                    await createNotification({
                        recipientId: task.assignedTo._id,
                        type:        "TASK_DEADLINE_APPROACHING",
                        message:     `🚨 Task "${task.title}" assigned to you is due in 1 hour!`,
                        taskId:      task._id
                    });
                }
            }

            console.log(`[Cron] Deadline check done. 24h: ${tasks24.length}, 1h: ${tasks1h.length}`);
        } catch (err) {
            console.error("[Cron] Deadline check error:", err.message);
        }
    });

    console.log("[Cron] Deadline reminder job started (every 15 min)");
};

