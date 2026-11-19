import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
    getTaskComments,
    addComment,
    updateComment,
    deleteComment
} from "../controllers/commentController.js";

const router = express.Router({ mergeParams: true });

router.use(protect);

router.get("/", getTaskComments);
router.post("/", addComment);
router.put("/:commentId", updateComment);
router.delete("/:commentId", deleteComment);

export default router;

