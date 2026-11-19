import Notification from "../models/Notification.js";

// GET /api/notifications
export const getNotifications = async (req, res) => {
    try {
        const { filter = "all", page = 1, limit = 20 } = req.query;
        const query = { recipient: req.user._id };

        if (filter === "read") query.read = true;
        if (filter === "unread") query.read = false;

        const skip = (Number(page) - 1) * Number(limit);

        const [notifications, total, unreadCount] = await Promise.all([
            Notification.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .populate("sender", "name email")
                .populate("task", "title")
                .populate("team", "name"),
            Notification.countDocuments(query),
            Notification.countDocuments({ recipient: req.user._id, read: false })
        ]);

        res.json({ notifications, total, unreadCount, page: Number(page), limit: Number(limit) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/notifications/unread-count
export const getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            recipient: req.user._id,
            read: false
        });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PATCH /api/notifications/:id/read
export const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient: req.user._id },
            { $set: { read: true } },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        res.json(notification);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PATCH /api/notifications/mark-all-read
export const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user._id, read: false },
            { $set: { read: true } }
        );
        res.json({ message: "All notifications marked as read" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE /api/notifications/:id
export const deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            recipient: req.user._id
        });

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        res.json({ message: "Notification deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE /api/notifications/delete-all
export const deleteAllNotifications = async (req, res) => {
    try {
        const { filter = "all" } = req.query;
        const query = { recipient: req.user._id };
        if (filter === "read") query.read = true;
        if (filter === "unread") query.read = false;

        await Notification.deleteMany(query);
        res.json({ message: "Notifications deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

