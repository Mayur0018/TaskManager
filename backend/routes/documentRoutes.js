import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
    getTeamDocuments,
    uploadTeamDocument,
    deleteTeamDocument,
    upload
} from "../controllers/documentController.js";

const router = express.Router();

router.use(protect);

router.get("/:teamId", getTeamDocuments);
router.post("/:teamId", upload.single("file"), uploadTeamDocument);
router.delete("/:teamId/:docId", deleteTeamDocument);

export default router;

