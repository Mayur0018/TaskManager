import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
    {
        team: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Team",
            required: true
        },
        uploader: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        originalName: {
            type: String,
            required: true
        },
        size: {
            type: Number,
            required: true
        },
        mimeType: {
            type: String,
            required: true
        },
        fileUrl: {
            type: String,
            required: true
        }
    },
    { timestamps: true }
);

documentSchema.index({ team: 1, createdAt: -1 });

const Document = mongoose.model("Document", documentSchema);

export default Document;

