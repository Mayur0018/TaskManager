// utils/notificationHelper.js
// Reusable function to create a notification in DB and emit via Socket.IO

import Notification from "../models/Notification.js";
import { emitNotification, emitUnreadCount } from "./socketManager.js";

/**
 * Create a notification and push it to the recipient in real-time.
 *
 * @param {object} opts
 * @param {string}   opts.recipientId  - User._id of the receiver
 * @param {string}   [opts.senderId]   - User._id of the sender (optional)
 * @param {string}   opts.type         - Notification type enum value
 * @param {string}   opts.message      - Human-readable message
 * @param {string}   [opts.taskId]     - Task._id (optional)
 * @param {string}   [opts.teamId]     - Team._id (optional)
 * @returns {Promise<object>}          - Created Notification document
 */
export const createNotification = async ({
    recipientId,
    senderId = null,
    type,
    message,
    taskId = null,
    teamId = null
}) => {
    try {
        const notification = await Notification.create({
            recipient: recipientId,
            sender:    senderId,
            type,
            message,
            task:      taskId,
            team:      teamId
        });

        // Populate sender info for real-time payload
        await notification.populate("sender", "name email");
        await notification.populate("task",   "title");
        await notification.populate("team",   "name");

        // Emit to the recipient's socket room
        emitNotification(recipientId.toString(), notification.toObject());

        // Also send updated unread count
        const unreadCount = await Notification.countDocuments({
            recipient: recipientId,
            read: false
        });
        emitUnreadCount(recipientId.toString(), unreadCount);

        return notification;
    } catch (err) {
        console.error("Failed to create notification:", err.message);
    }
};

