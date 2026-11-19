import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        team: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Team",
            default: null
        },
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        text: {
            type: String,
            required: true,
            trim: true
        },
        readBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ]
    },
    { timestamps: true }
);

messageSchema.index({ team: 1, createdAt: 1 });
messageSchema.index({ sender: 1, recipient: 1, createdAt: 1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;

