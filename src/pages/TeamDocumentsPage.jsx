import { useState, useEffect, useCallback } from "react";
import {
    FiFolder,
    FiUploadCloud,
    FiFileText,
    FiDownload,
    FiTrash2,
    FiUsers,
    FiCheck,
    FiAlertCircle,
    FiEye,
    FiRefreshCw
} from "react-icons/fi";
import api from "../api";
import Layout from "../components/Layout";

export default function TeamDocumentsPage() {
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    const [teams, setTeams] = useState([]);
    const [selectedTeamId, setSelectedTeamId] = useState("");
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [customName, setCustomName] = useState("");
    const [file, setFile] = useState(null);
    const [feedback, setFeedback] = useState({ text: "", type: "" });

    const showMsg = (text, type = "success") => {
        setFeedback({ text, type });
        setTimeout(() => setFeedback({ text: "", type: "" }), 3500);
    };

    // Load user's teams
    const fetchTeams = useCallback(async () => {
        try {
            const res = await api.get("/teams");
            setTeams(res.data);
            if (res.data.length > 0 && !selectedTeamId) {
                setSelectedTeamId(res.data[0]._id);
            }
        } catch (err) {
            console.error("Failed to load teams:", err);
        }
    }, [selectedTeamId]);

    useEffect(() => {
        fetchTeams();
    }, [fetchTeams]);

    // Load documents for selected team
    const fetchDocuments = useCallback(async () => {
        if (!selectedTeamId) return;
        try {
            setLoading(true);
            const res = await api.get(`/documents/${selectedTeamId}`);
            setDocuments(res.data);
        } catch (err) {
            console.error("Failed to load documents:", err);
            showMsg("Failed to load team documents", "error");
        } finally {
            setLoading(false);
        }
    }, [selectedTeamId]);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return showMsg("Please select a file to upload", "error");
        if (!selectedTeamId) return showMsg("Please select a team", "error");

        const formData = new FormData();
        formData.append("file", file);
        if (customName.trim()) {
            formData.append("name", customName.trim());
        }

        try {
            setUploading(true);
            const res = await api.post(`/documents/${selectedTeamId}`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            setDocuments((prev) => [res.data, ...prev]);
            setFile(null);
            setCustomName("");
            showMsg("Document uploaded successfully!");
        } catch (err) {
            showMsg(err.response?.data?.message || "Upload failed", "error");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (docId) => {
        if (!window.confirm("Are you sure you want to delete this document?")) return;
        try {
            await api.delete(`/documents/${selectedTeamId}/${docId}`);
            setDocuments((prev) => prev.filter((d) => d._id !== docId));
            showMsg("Document deleted");
        } catch (err) {
            showMsg(err.response?.data?.message || "Failed to delete document", "error");
        }
    };

    const formatSize = (bytes) => {
        if (!bytes) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    };

    const baseURL = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

    return (
        <Layout title="Shared Documents">
            <div className="p-4 sm:p-6 max-w-6xl mx-auto w-full space-y-4 sm:space-y-6">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <FiFolder className="w-6 h-6 text-blue-600" />
                            Shared Team Documents & Assets
                        </h1>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Centralized repository for project files, specifications, and assets
                        </p>
                    </div>

                    {/* Team Selector */}
                    <div className="flex items-center gap-2">
                        <FiUsers className="w-4 h-4 text-slate-400" />
                        <select
                            value={selectedTeamId}
                            onChange={(e) => setSelectedTeamId(e.target.value)}
                            className="text-xs font-semibold border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {teams.map((t) => (
                                <option key={t._id} value={t._id}>
                                    {t.avatar} {t.name}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={fetchDocuments}
                            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
                            title="Refresh documents"
                        >
                            <FiRefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Feedback Toast */}
                {feedback.text && (
                    <div
                        className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                            feedback.type === "error"
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                    >
                        {feedback.type === "error" ? <FiAlertCircle className="w-4 h-4" /> : <FiCheck className="w-4 h-4" />}
                        {feedback.text}
                    </div>
                )}

                {/* Upload Form Box */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                    <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <FiUploadCloud className="w-4 h-4 text-blue-600" />
                        Upload New File
                    </h3>
                    <form onSubmit={handleUpload} className="flex flex-wrap items-center gap-3">
                        <input
                            type="text"
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                            placeholder="Document label (optional)..."
                            className="text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white flex-1 min-w-44"
                        />
                        <input
                            type="file"
                            onChange={(e) => setFile(e.target.files[0])}
                            className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 text-slate-500 cursor-pointer"
                        />
                        <button
                            type="submit"
                            disabled={uploading || !file}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition shadow-2xs flex items-center gap-1.5"
                        >
                            <FiUploadCloud className="w-3.5 h-3.5" />
                            <span>{uploading ? "Uploading..." : "Upload File"}</span>
                        </button>
                    </form>
                    <p className="text-[10px] text-slate-400 mt-2">
                        Supported: PDF, Word, Excel, Images, Text, ZIP (Max 15MB)
                    </p>
                </div>

                {/* Document Table / List */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Files in Team ({documents.length})
                        </span>
                    </div>

                    {loading ? (
                        <div className="py-20 flex items-center justify-center">
                            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : documents.length === 0 ? (
                        <div className="py-20 text-center text-slate-400">
                            <FiFileText className="w-10 h-10 mx-auto mb-2 opacity-20" />
                            <p className="text-sm font-medium">No files uploaded yet</p>
                            <p className="text-xs mt-0.5">Use the upload box above to share files with your team</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-slate-600">
                                <thead className="bg-slate-50 text-slate-400 uppercase font-semibold border-b border-slate-100">
                                    <tr>
                                        <th className="py-3 px-4">Name</th>
                                        <th className="py-3 px-4">Size</th>
                                        <th className="py-3 px-4">Uploaded By</th>
                                        <th className="py-3 px-4">Date</th>
                                        <th className="py-3 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {documents.map((doc) => {
                                        const downloadUrl = `${baseURL}${doc.fileUrl}`;
                                        const isAuthor = (doc.uploader?._id || doc.uploader) === currentUser.id;
                                        return (
                                            <tr key={doc._id} className="hover:bg-slate-50 transition">
                                                <td className="py-3 px-4 flex items-center gap-2.5 font-semibold text-slate-800">
                                                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                                        <FiFileText className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="truncate max-w-xs">{doc.name}</p>
                                                        <p className="text-[10px] text-slate-400 truncate max-w-xs">{doc.originalName}</p>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-slate-500">{formatSize(doc.size)}</td>
                                                <td className="py-3 px-4">
                                                    <span className="font-medium text-slate-700">{doc.uploader?.name || "User"}</span>
                                                </td>
                                                <td className="py-3 px-4 text-slate-400">
                                                    {new Date(doc.createdAt).toLocaleDateString("en-IN", {
                                                        day: "2-digit",
                                                        month: "short",
                                                        year: "numeric"
                                                    })}
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <a
                                                            href={downloadUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            download
                                                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                            title="Download file"
                                                        >
                                                            <FiDownload className="w-4 h-4" />
                                                        </a>
                                                        <button
                                                            onClick={() => handleDelete(doc._id)}
                                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                            title="Delete file"
                                                        >
                                                            <FiTrash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}

