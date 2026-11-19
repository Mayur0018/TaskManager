import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        type: {
            type: String,
            required: true,
            enum: [
                // Task notifications
                "TASK_ASSIGNED",
                "TASK_REASSIGNED",
                "TASK_STATUS_CHANGED",
                "TASK_DEADLINE_APPROACHING",
                "TASK_OVERDUE",
                "TASK_COMPLETED",
                // Comment notifications
                "COMMENT_ADDED",
                "COMMENT_REPLY",
                "MENTION",
                // Team notifications
                "TEAM_INVITATION",
                "INVITATION_ACCEPTED",
                "INVITATION_REJECTED",
                "MEMBER_REMOVED",
                "MEMBER_LEFT",
                "ROLE_CHANGED",
                "TEAM_UPDATED"
            ]
        },
        task: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Task",
            default: null
        },
        team: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Team",
            default: null
        },
        message: {
            type: String,
            required: true
        },
        read: {
            type: Boolean,
            default: false
        },
        // Extra metadata (e.g. invitation token for action links)
        meta: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    { timestamps: true }
);

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
