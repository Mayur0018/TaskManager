import Comment from "../models/Comment.js";
import Task from "../models/Task.js";
import Team from "../models/Team.js";
import Activity from "../models/Activity.js";
import { createNotification } from "../utils/notificationHelper.js";
import { getMemberRole } from "../middleware/teamMiddleware.js";

const getId = (entity) => {
    if (!entity) return "";
    return entity._id ? entity._id.toString() : entity.toString();
};

// Helper to verify user has access to task (owner, assignee, or team member)
const verifyTaskAccess = async (taskId, userId) => {
    const task = await Task.findOne({ _id: taskId, isDeleted: false });
    if (!task) return null;

    const uid = getId(userId);
    if (getId(task.user) === uid || getId(task.assignedTo) === uid) {
        return { task, canManage: true };
    }

    if (task.team) {
        const team = await Team.findOne({ _id: task.team, isDeleted: false });
        if (team) {
            const role = getMemberRole(team, userId);
            if (role) {
                return { task, team, role, canManage: ["owner", "admin", "manager"].includes(role) };
            }
        }
    }

    return null;
};

// GET /api/tasks/:taskId/comments
export const getTaskComments = async (req, res) => {
    try {
        const access = await verifyTaskAccess(req.params.taskId, req.user._id);
        if (!access) return res.status(403).json({ message: "Access denied to task comments" });

        const comments = await Comment.find({ task: req.params.taskId })
            .populate("user", "name email")
            .populate("mentions", "name email")
            .sort({ createdAt: 1 });

        res.json(comments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// POST /api/tasks/:taskId/comments
export const addComment = async (req, res) => {
    try {
        const { text, mentions = [], parentId = null } = req.body;
        if (!text?.trim()) return res.status(400).json({ message: "Comment text is required" });

        const access = await verifyTaskAccess(req.params.taskId, req.user._id);
        if (!access) return res.status(403).json({ message: "Access denied to task" });

        const { task, team } = access;

        const comment = await Comment.create({
            task: task._id,
            user: req.user._id,
            text: text.trim(),
            mentions: Array.isArray(mentions) ? mentions : [],
            parentId: parentId || null
        });

        await comment.populate("user", "name email");
        await comment.populate("mentions", "name email");

        // Log activity
        await Activity.create({
            user: req.user._id,
            action: "COMMENT_ADDED",
            task: task._id,
            team: team ? team._id : null,
            details: { commentId: comment._id, isReply: Boolean(parentId) }
        });

        // Notify task assignee if someone else commented
        if (task.assignedTo && getId(task.assignedTo) !== getId(req.user._id)) {
            await createNotification({
                recipientId: task.assignedTo,
                senderId: req.user._id,
                type: "COMMENT_ADDED",
                message: `${req.user.name} commented on "${task.title}"`,
                taskId: task._id,
                teamId: team ? team._id : null
            });
        }

        // Notify task creator if different from commenter and assignee
        if (task.user && getId(task.user) !== getId(req.user._id) && getId(task.user) !== getId(task.assignedTo)) {
            await createNotification({
                recipientId: task.user,
                senderId: req.user._id,
                type: "COMMENT_ADDED",
                message: `${req.user.name} commented on "${task.title}"`,
                taskId: task._id,
                teamId: team ? team._id : null
            });
        }

        // Notify mentioned users
        if (Array.isArray(mentions) && mentions.length > 0) {
            for (const mentionId of mentions) {
                if (getId(mentionId) !== getId(req.user._id)) {
                    await createNotification({
                        recipientId: mentionId,
                        senderId: req.user._id,
                        type: "MENTION",
                        message: `${req.user.name} mentioned you in a comment on "${task.title}"`,
                        taskId: task._id,
                        teamId: team ? team._id : null
                    });
                }
            }
        }

        res.status(201).json(comment);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// PUT /api/tasks/:taskId/comments/:commentId
export const updateComment = async (req, res) => {
    try {
        const { text, mentions } = req.body;
        if (!text?.trim()) return res.status(400).json({ message: "Comment text cannot be empty" });

        const comment = await Comment.findOne({
            _id: req.params.commentId,
            task: req.params.taskId
        });
        if (!comment) return res.status(404).json({ message: "Comment not found" });

        if (getId(comment.user) !== getId(req.user._id)) {
            return res.status(403).json({ message: "You can only edit your own comments" });
        }

        comment.text = text.trim();
        if (Array.isArray(mentions)) comment.mentions = mentions;
        comment.isEdited = true;
        await comment.save();

        await comment.populate("user", "name email");
        await comment.populate("mentions", "name email");

        res.json(comment);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// DELETE /api/tasks/:taskId/comments/:commentId
export const deleteComment = async (req, res) => {
    try {
        const comment = await Comment.findOne({
            _id: req.params.commentId,
            task: req.params.taskId
        });
        if (!comment) return res.status(404).json({ message: "Comment not found" });

        const access = await verifyTaskAccess(req.params.taskId, req.user._id);
        const isAuthor = getId(comment.user) === getId(req.user._id);
        const canManage = access && access.canManage;

        if (!isAuthor && !canManage) {
            return res.status(403).json({ message: "Not authorized to delete this comment" });
        }

        // Delete comment and its replies
        await Comment.deleteMany({
            $or: [
                { _id: comment._id },
                { parentId: comment._id }
            ]
        });

        res.json({ message: "Comment deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

