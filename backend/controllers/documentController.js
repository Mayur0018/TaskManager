import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import multer from "multer";
import Document from "../models/Document.js";
import Team from "../models/Team.js";
import Activity from "../models/Activity.js";
import { getMemberRole } from "../middleware/teamMiddleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
    }
});

// File filter (Max 15MB, documents/images/archives)
export const upload = multer({
    storage,
    limits: { fileSize: 15 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedExtensions = /pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|png|jpg|jpeg|gif|zip|rar/;
        const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
        if (allowedExtensions.test(ext)) {
            cb(null, true);
        } else {
            cb(new Error("File type not supported. Allowed: PDF, Word, Excel, Images, Text, ZIP"));
        }
    }
});

const getId = (entity) => {
    if (!entity) return "";
    return entity._id ? entity._id.toString() : entity.toString();
};

// GET /api/teams/:teamId/documents
export const getTeamDocuments = async (req, res) => {
    try {
        const team = await Team.findOne({ _id: req.params.teamId, isDeleted: false });
        if (!team) return res.status(404).json({ message: "Team not found" });

        const role = getMemberRole(team, req.user._id);
        if (!role) return res.status(403).json({ message: "Access denied" });

        const docs = await Document.find({ team: team._id })
            .populate("uploader", "name email")
            .sort({ createdAt: -1 });

        res.json(docs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// POST /api/teams/:teamId/documents
export const uploadTeamDocument = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No file uploaded" });

        const team = await Team.findOne({ _id: req.params.teamId, isDeleted: false });
        if (!team) return res.status(404).json({ message: "Team not found" });

        const role = getMemberRole(team, req.user._id);
        if (!role) return res.status(403).json({ message: "Access denied" });

        const fileUrl = `/uploads/${req.file.filename}`;

        const doc = await Document.create({
            team: team._id,
            uploader: req.user._id,
            name: req.body.name?.trim() || req.file.originalname,
            originalName: req.file.originalname,
            size: req.file.size,
            mimeType: req.file.mimetype,
            fileUrl
        });

        await doc.populate("uploader", "name email");

        // Log activity
        await Activity.create({
            user: req.user._id,
            action: "TEAM_UPDATED",
            team: team._id,
            details: { action: "DOCUMENT_UPLOADED", documentName: doc.name }
        });

        res.status(201).json(doc);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message || "Server error" });
    }
};

// DELETE /api/teams/:teamId/documents/:docId
export const deleteTeamDocument = async (req, res) => {
    try {
        const team = await Team.findOne({ _id: req.params.teamId, isDeleted: false });
        if (!team) return res.status(404).json({ message: "Team not found" });

        const role = getMemberRole(team, req.user._id);
        if (!role) return res.status(403).json({ message: "Access denied" });

        const doc = await Document.findOne({ _id: req.params.docId, team: team._id });
        if (!doc) return res.status(404).json({ message: "Document not found" });

        const isUploader = getId(doc.uploader) === getId(req.user._id);
        const isAdmin = role === "owner" || role === "admin";

        if (!isUploader && !isAdmin) {
            return res.status(403).json({ message: "Only the uploader or team admin can delete this document" });
        }

        // Delete physical file
        const filePath = path.join(uploadDir, path.basename(doc.fileUrl));
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await Document.findByIdAndDelete(doc._id);

        res.json({ message: "Document deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

