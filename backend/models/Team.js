import mongoose from "mongoose";

// ── Invitation subdocument ───────────────────────────────────────────────────
const invitationSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    role: {
        type: String,
        enum: ["admin", "manager", "member"],
        default: "member"
    },
    token: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected", "cancelled"],
        default: "pending"
    },
    invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    sentAt: {
        type: Date,
        default: Date.now
    },
    respondedAt: {
        type: Date,
        default: null
    }
});

// ── Member subdocument ───────────────────────────────────────────────────────
const teamMemberSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    role: {
        type: String,
        enum: ["admin", "manager", "member"],
        default: "member"
    },
    joinedAt: {
        type: Date,
        default: Date.now
    }
});

// ── Team schema ──────────────────────────────────────────────────────────────
const teamSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },
        description: {
            type: String,
            default: "",
            maxlength: 500
        },
        avatar: {
            type: String,         // emoji character used as team avatar
            default: "👥"
        },
        color: {
            type: String,         // hex color for team card accent
            default: "#3B82F6"
        },
        privacy: {
            type: String,
            enum: ["public", "private"],
            default: "private"
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        members: {
            type: [teamMemberSchema],
            default: []
        },
        invitations: {
            type: [invitationSchema],
            default: []
        },
        // Soft delete flag
        isDeleted: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
teamSchema.index({ owner: 1 });
teamSchema.index({ "members.user": 1 });
teamSchema.index({ "invitations.email": 1 });
teamSchema.index({ "invitations.token": 1 });
teamSchema.index({ name: "text", description: "text" });

const Team = mongoose.model("Team", teamSchema);

export default Team;
