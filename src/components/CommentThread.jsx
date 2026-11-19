import { useState, useEffect, useCallback } from "react";
import {
    FiMessageSquare,
    FiSend,
    FiEdit2,
    FiTrash2,
    FiCornerDownRight,
    FiX,
    FiCheck
} from "react-icons/fi";
import api from "../api";

function timeAgo(date) {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

function CommentItem({ comment, currentUser, onReply, onEdit, onDelete, teamMembers = [] }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(comment.text);
    const isOwner = (comment.user?._id || comment.user) === currentUser.id;

    const handleSaveEdit = () => {
        if (!editText.trim()) return;
        onEdit(comment._id, editText.trim());
        setIsEditing(false);
    };

    return (
        <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                {(comment.user?.name || "U").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">
                            {comment.user?.name || "User"}
                        </span>
                        <span className="text-[10px] text-slate-400">
                            {timeAgo(comment.createdAt)}
                        </span>
                        {comment.isEdited && (
                            <span className="text-[10px] text-slate-400 italic">(edited)</span>
                        )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                            type="button"
                            onClick={() => onReply(comment)}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded transition"
                            title="Reply"
                        >
                            <FiCornerDownRight className="w-3.5 h-3.5" />
                        </button>
                        {isOwner && (
                            <button
                                type="button"
                                onClick={() => setIsEditing(!isEditing)}
                                className="p-1 text-slate-400 hover:text-amber-600 rounded transition"
                                title="Edit"
                            >
                                <FiEdit2 className="w-3.5 h-3.5" />
                            </button>
                        )}
                        {(isOwner || currentUser.role === "admin" || currentUser.role === "owner") && (
                            <button
                                type="button"
                                onClick={() => onDelete(comment._id)}
                                className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                                title="Delete"
                            >
                                <FiTrash2 className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {isEditing ? (
                    <div className="mt-2 space-y-2">
                        <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            rows={2}
                            className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
                        />
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleSaveEdit}
                                className="px-2.5 py-1 text-xs bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 flex items-center gap-1"
                            >
                                <FiCheck className="w-3 h-3" /> Save
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="px-2.5 py-1 text-xs bg-slate-200 text-slate-700 rounded-md font-medium hover:bg-slate-300 flex items-center gap-1"
                            >
                                <FiX className="w-3 h-3" /> Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <p className="text-xs text-slate-700 mt-1 whitespace-pre-wrap leading-relaxed">
                        {comment.text}
                    </p>
                )}
            </div>
        </div>
    );
}

export default function CommentThread({ taskId, teamMembers = [] }) {
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [replyTo, setReplyTo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const fetchComments = useCallback(async () => {
        if (!taskId) return;
        try {
            setLoading(true);
            const res = await api.get(`/tasks/${taskId}/comments`);
            setComments(res.data);
        } catch (err) {
            console.error("Failed to load comments:", err);
        } finally {
            setLoading(false);
        }
    }, [taskId]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || submitting) return;

        // Extract mentions: e.g., @Name from text
        const mentionedUserIds = [];
        if (teamMembers && teamMembers.length > 0) {
            teamMembers.forEach((m) => {
                const u = m.user || m;
                if (u && u.name && newComment.toLowerCase().includes(`@${u.name.toLowerCase()}`)) {
                    mentionedUserIds.push(u._id || u.id);
                }
            });
        }

        try {
            setSubmitting(true);
            const res = await api.post(`/tasks/${taskId}/comments`, {
                text: newComment.trim(),
                mentions: mentionedUserIds,
                parentId: replyTo ? replyTo._id : null
            });
            setComments((prev) => [...prev, res.data]);
            setNewComment("");
            setReplyTo(null);
        } catch (err) {
            console.error("Failed to add comment:", err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditComment = async (commentId, text) => {
        try {
            const res = await api.put(`/tasks/${taskId}/comments/${commentId}`, { text });
            setComments((prev) => prev.map((c) => (c._id === commentId ? res.data : c)));
        } catch (err) {
            console.error("Failed to edit comment:", err);
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            await api.delete(`/tasks/${taskId}/comments/${commentId}`);
            setComments((prev) => prev.filter((c) => c._id !== commentId && c.parentId !== commentId));
        } catch (err) {
            console.error("Failed to delete comment:", err);
        }
    };

    return (
        <div className="pt-4 border-t border-slate-100">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
                <FiMessageSquare className="w-4 h-4 text-blue-600" />
                <span>Comments & Discussion</span>
                <span className="text-xs font-normal text-slate-500">
                    ({comments.length})
                </span>
            </h4>

            {/* Comments List */}
            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                {loading ? (
                    <div className="py-4 text-center text-xs text-slate-400">Loading comments...</div>
                ) : comments.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">No comments yet. Start the conversation!</p>
                ) : (
                    comments.map((c) => (
                        <div key={c._id} className={c.parentId ? "ml-6" : ""}>
                            <CommentItem
                                comment={c}
                                currentUser={currentUser}
                                onReply={(comment) => setReplyTo(comment)}
                                onEdit={handleEditComment}
                                onDelete={handleDeleteComment}
                                teamMembers={teamMembers}
                            />
                        </div>
                    ))
                )}
            </div>

            {/* Replying indicator */}
            {replyTo && (
                <div className="flex items-center justify-between text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg mb-2">
                    <span className="truncate">
                        Replying to <strong>{replyTo.user?.name || "user"}</strong>: "{replyTo.text.slice(0, 30)}..."
                    </span>
                    <button
                        type="button"
                        onClick={() => setReplyTo(null)}
                        className="text-blue-500 hover:text-blue-700"
                    >
                        <FiX className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            {/* New Comment Input */}
            <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={replyTo ? "Write a reply..." : "Write a comment (use @name to mention)..."}
                    className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                />
                <button
                    type="submit"
                    disabled={submitting || !newComment.trim()}
                    className="inline-flex items-center gap-1 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition"
                >
                    <FiSend className="w-3.5 h-3.5" />
                    <span>{submitting ? "Sending..." : "Post"}</span>
                </button>
            </form>
        </div>
    );
}

