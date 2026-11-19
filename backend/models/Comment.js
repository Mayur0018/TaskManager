import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
    {
        task: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Task",
            required: true
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        text: {
            type: String,
            required: true,
            trim: true
        },
        parentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment",
            default: null
        },
        mentions: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],
        isEdited: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

commentSchema.index({ task: 1, createdAt: 1 });
commentSchema.index({ parentId: 1 });

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;
