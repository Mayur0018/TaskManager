import mongoose from "mongoose";

const subtaskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const taskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            default: ""
        },
        status: {
            type: String,
            enum: ["pending", "completed"],
            default: "pending"
        },
        priority: {
            type: String,
            enum: ["low", "medium", "high", "critical"],
            default: "medium"
        },
        column: {
            type: String,
            enum: ["todo", "inprogress", "inreview", "completed"],
            default: "todo"
        },
        startDate: {
            type: Date,
            default: null
        },
        dueDate: {
            type: Date,
            default: null
        },
        category: {
            type: String,
            default: "General",
            trim: true
        },
        tags: {
            type: [String],
            default: []
        },
        order: {
            type: Number,
            default: 0
        },
        subtasks: {
            type: [subtaskSchema],
            default: []
        },
        dependencies: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Task"
            }
        ],
        recurrence: {
            type: {
                type: String,
                enum: ["none", "daily", "weekly", "monthly"],
                default: "none"
            },
            nextRun: {
                type: Date,
                default: null
            }
        },
        timeSpent: {
            type: Number,
            default: 0 // in seconds
        },
        isArchived: {
            type: Boolean,
            default: false
        },
        isDeleted: {
            type: Boolean,
            default: false // Soft delete
        },
        team: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Team",
            default: null
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    { timestamps: true }
);

// Indexes for high performance queries
taskSchema.index({ user: 1, column: 1, order: 1 });
taskSchema.index({ user: 1, isDeleted: 1, isArchived: 1 });
taskSchema.index({ team: 1, isDeleted: 1 });
taskSchema.index({ dueDate: 1 });

const Task = mongoose.model("Task", taskSchema);

export default Task;
