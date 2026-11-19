import Message from "../models/Message.js";
import Team from "../models/Team.js";
import User from "../models/User.js";
import { getMemberRole } from "../middleware/teamMiddleware.js";
import { getIO } from "../utils/socketManager.js";

const getId = (entity) => {
    if (!entity) return "";
    return entity._id ? entity._id.toString() : entity.toString();
};

// GET /api/chat/teams/:teamId/messages
export const getTeamMessages = async (req, res) => {
    try {
        const team = await Team.findOne({ _id: req.params.teamId, isDeleted: false });
        if (!team) return res.status(404).json({ message: "Team not found" });

        const role = getMemberRole(team, req.user._id);
        if (!role) return res.status(403).json({ message: "Not a team member" });

        const messages = await Message.find({ team: team._id })
            .populate("sender", "name email")
            .sort({ createdAt: 1 })
            .limit(100);

        // Mark messages as read by current user
        await Message.updateMany(
            { team: team._id, readBy: { $ne: req.user._id } },
            { $addToSet: { readBy: req.user._id } }
        );

        res.json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// POST /api/chat/teams/:teamId/messages
export const sendTeamMessage = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text?.trim()) return res.status(400).json({ message: "Message cannot be empty" });

        const team = await Team.findOne({ _id: req.params.teamId, isDeleted: false });
        if (!team) return res.status(404).json({ message: "Team not found" });

        const role = getMemberRole(team, req.user._id);
        if (!role) return res.status(403).json({ message: "Not a team member" });

        const message = await Message.create({
            sender: req.user._id,
            team: team._id,
            text: text.trim(),
            readBy: [req.user._id]
        });

        await message.populate("sender", "name email");

        // Broadcast to team room via Socket.IO
        const io = getIO();
        if (io) {
            io.to(`team:${team._id}`).emit("new_team_message", message);
        }

        res.status(201).json(message);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/chat/direct/:recipientId/messages
export const getDirectMessages = async (req, res) => {
    try {
        const uId = req.user._id;
        const rId = req.params.recipientId;

        const messages = await Message.find({
            $or: [
                { sender: uId, recipient: rId },
                { sender: rId, recipient: uId }
            ]
        })
            .populate("sender", "name email")
            .populate("recipient", "name email")
            .sort({ createdAt: 1 })
            .limit(100);

        // Mark as read
        await Message.updateMany(
            { sender: rId, recipient: uId, readBy: { $ne: uId } },
            { $addToSet: { readBy: uId } }
        );

        res.json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// POST /api/chat/direct/:recipientId/messages
export const sendDirectMessage = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text?.trim()) return res.status(400).json({ message: "Message cannot be empty" });

        const recipient = await User.findById(req.params.recipientId);
        if (!recipient) return res.status(404).json({ message: "Recipient user not found" });

        const message = await Message.create({
            sender: req.user._id,
            recipient: recipient._id,
            text: text.trim(),
            readBy: [req.user._id]
        });

        await message.populate("sender", "name email");
        await message.populate("recipient", "name email");

        const io = getIO();
        if (io) {
            io.to(`user:${recipient._id}`).emit("new_direct_message", message);
            io.to(`user:${req.user._id}`).emit("new_direct_message", message);
        }

        res.status(201).json(message);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/chat/conversations
export const getConversations = async (req, res) => {
    try {
        const userId = req.user._id;

        // User's teams
        const teams = await Team.find({
            isDeleted: false,
            $or: [{ owner: userId }, { "members.user": userId }]
        }).populate("members.user", "name email");

        // Unique contacts from teams
        const contactMap = new Map();
        teams.forEach((t) => {
            if (t.owner && getId(t.owner) !== getId(userId)) {
                contactMap.set(getId(t.owner), t.owner);
            }
            t.members.forEach((m) => {
                if (m.user && getId(m.user) !== getId(userId)) {
                    contactMap.set(getId(m.user), m.user);
                }
            });
        });

        res.json({
            teams: teams.map((t) => ({ _id: t._id, name: t.name, avatar: t.avatar, color: t.color })),
            contacts: Array.from(contactMap.values())
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

