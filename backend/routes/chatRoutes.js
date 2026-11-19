import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
    getTeamMessages,
    sendTeamMessage,
    getDirectMessages,
    sendDirectMessage,
    getConversations
} from "../controllers/chatController.js";

const router = express.Router();

router.use(protect);

router.get("/conversations", getConversations);
router.get("/teams/:teamId/messages", getTeamMessages);
router.post("/teams/:teamId/messages", sendTeamMessage);
router.get("/direct/:recipientId/messages", getDirectMessages);
router.post("/direct/:recipientId/messages", sendDirectMessage);

export default router;

