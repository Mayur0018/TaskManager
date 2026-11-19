import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        action: {
            type: String,
            required: true,
            enum: [
                // Task events
                "TASK_CREATED",
                "TASK_UPDATED",
                "TASK_DELETED",
                "TASK_COMPLETED",
                "TASK_REOPENED",
                "TASK_RESTORED",
                "TASK_ARCHIVED",
                "STATUS_CHANGED",
                "COLUMN_CHANGED",
                "PRIORITY_CHANGED",
                "DUE_DATE_CHANGED",
                "TASK_ASSIGNED",
                "TASK_REASSIGNED",
                "COMMENT_ADDED",
                "COMMENT_EDITED",
                "COMMENT_DELETED",
                "SUBTASK_ADDED",
                "SUBTASK_TOGGLED",
                // Team events
                "TEAM_CREATED",
                "TEAM_UPDATED",
                "TEAM_DELETED",
                // Member events
                "MEMBER_INVITED",
                "INVITATION_ACCEPTED",
                "INVITATION_REJECTED",
                "INVITATION_CANCELLED",
                "INVITATION_RESENT",
                "MEMBER_ADDED",
                "MEMBER_REMOVED",
                "MEMBER_LEFT",
                "ROLE_CHANGED"
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
        details: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    { timestamps: true }
);

activitySchema.index({ task: 1, createdAt: -1 });
activitySchema.index({ team: 1, createdAt: -1 });
activitySchema.index({ user: 1, createdAt: -1 });

const Activity = mongoose.model("Activity", activitySchema);

export default Activity;
