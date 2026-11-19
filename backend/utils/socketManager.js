// utils/socketManager.js
// Central module to hold the Socket.IO instance and emit helpers

let _io = null;

export const setIO = (io) => { _io = io; };
export const getIO = () => _io;

/**
 * Emit a real-time notification to a specific user.
 * @param {string} userId  - MongoDB ObjectId as string
 * @param {object} payload - Notification document (plain object)
 */
export const emitNotification = (userId, payload) => {
    if (_io) {
        _io.to(`user:${userId}`).emit("notification", payload);
    }
};

/**
 * Emit updated unread count to a user.
 * @param {string} userId
 * @param {number} count
 */
export const emitUnreadCount = (userId, count) => {
    if (_io) {
        _io.to(`user:${userId}`).emit("unread_count", { count });
    }
};

