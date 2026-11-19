import { useState, useEffect, useRef, useCallback } from "react";
import {
    FiSend,
    FiMessageSquare,
    FiUsers,
    FiUser,
    FiHash,
    FiSmile,
    FiClock,
    FiCircle,
    FiArrowLeft
} from "react-icons/fi";
import { io } from "socket.io-client";
import api from "../api";
import Layout from "../components/Layout";

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

export default function TeamChatPage() {
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    const [conversations, setConversations] = useState({ teams: [], contacts: [] });
    const [activeTarget, setActiveTarget] = useState(null); // { type: "team"|"direct", id, name }
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);
    const [messagesLoading, setMessagesLoading] = useState(false);

    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Load conversation list (teams + contacts)
    const fetchConversations = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get("/chat/conversations");
            setConversations(res.data);
            // Default to first team if not selected
            if (!activeTarget && res.data.teams?.length > 0) {
                setActiveTarget({
                    type: "team",
                    id: res.data.teams[0]._id,
                    name: res.data.teams[0].name,
                    avatar: res.data.teams[0].avatar
                });
            }
        } catch (err) {
            console.error("Failed to load conversations:", err);
        } finally {
            setLoading(false);
        }
    }, [activeTarget]);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    // Socket setup
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;

        const socket = io(SOCKET_URL, {
            auth: { token },
            transports: ["websocket", "polling"]
        });
        socketRef.current = socket;

        // Listen for new team message
        socket.on("new_team_message", (msg) => {
            setActiveTarget((current) => {
                if (current?.type === "team" && current.id === msg.team) {
                    setMessages((prev) => [...prev, msg]);
                }
                return current;
            });
        });

        // Listen for direct messages
        socket.on("new_direct_message", (msg) => {
            setActiveTarget((current) => {
                if (
                    current?.type === "direct" &&
                    (current.id === msg.sender?._id || current.id === msg.recipient?._id)
                ) {
                    setMessages((prev) => [...prev, msg]);
                }
                return current;
            });
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    // Load messages when activeTarget changes
    const fetchMessages = useCallback(async () => {
        if (!activeTarget) return;
        try {
            setMessagesLoading(true);
            const url =
                activeTarget.type === "team"
                    ? `/chat/teams/${activeTarget.id}/messages`
                    : `/chat/direct/${activeTarget.id}/messages`;
            const res = await api.get(url);
            setMessages(res.data);

            // Join team socket room if target is team
            if (activeTarget.type === "team" && socketRef.current) {
                socketRef.current.emit("join_team", activeTarget.id);
            }
        } catch (err) {
            console.error("Failed to load messages:", err);
        } finally {
            setMessagesLoading(false);
        }
    }, [activeTarget]);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!text.trim() || !activeTarget) return;

        const msgText = text.trim();
        setText("");

        try {
            const url =
                activeTarget.type === "team"
                    ? `/chat/teams/${activeTarget.id}/messages`
                    : `/chat/direct/${activeTarget.id}/messages`;
            const res = await api.post(url, { text: msgText });
            setMessages((prev) => [...prev, res.data]);
        } catch (err) {
            console.error("Failed to send message:", err);
        }
    };

    return (
        <Layout title="Team Chat">
            <div className="flex h-[calc(100vh-56px)] bg-white overflow-hidden">
                {/* Left Panel: Conversation Channels & Direct Messages */}
                <div className={`w-full md:w-72 border-r border-slate-200 flex flex-col shrink-0 bg-slate-50/50 ${activeTarget ? "hidden md:flex" : "flex"}`}>
                    <div className="p-4 border-b border-slate-200">
                        <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                            <FiMessageSquare className="w-4 h-4 text-blue-600" />
                            Channels & Direct Messages
                        </h2>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-4">
                        {/* Team Channels */}
                        <div>
                            <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                                <FiUsers className="w-3 h-3" /> Team Channels
                            </p>
                            <div className="space-y-0.5">
                                {conversations.teams?.map((t) => {
                                    const active = activeTarget?.type === "team" && activeTarget.id === t._id;
                                    return (
                                        <button
                                            key={t._id}
                                            onClick={() =>
                                                setActiveTarget({
                                                    type: "team",
                                                    id: t._id,
                                                    name: t.name,
                                                    avatar: t.avatar
                                                })
                                            }
                                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                                                active
                                                    ? "bg-blue-600 text-white shadow-2xs"
                                                    : "text-slate-700 hover:bg-slate-200/60"
                                            }`}
                                        >
                                            <span className="text-sm">{t.avatar || "👥"}</span>
                                            <span className="truncate">{t.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Direct Messages */}
                        <div>
                            <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                                <FiUser className="w-3 h-3" /> Direct Messages
                            </p>
                            <div className="space-y-0.5">
                                {conversations.contacts?.length === 0 ? (
                                    <p className="px-2 text-[11px] text-slate-400 italic">No contacts</p>
                                ) : (
                                    conversations.contacts?.map((u) => {
                                        const active = activeTarget?.type === "direct" && activeTarget.id === u._id;
                                        return (
                                            <button
                                                key={u._id}
                                                onClick={() =>
                                                    setActiveTarget({
                                                        type: "direct",
                                                        id: u._id,
                                                        name: u.name,
                                                        email: u.email
                                                    })
                                                }
                                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                                                    active
                                                        ? "bg-blue-600 text-white shadow-2xs"
                                                        : "text-slate-700 hover:bg-slate-200/60"
                                                }`}
                                            >
                                                <div className="w-5 h-5 rounded-full bg-slate-300 text-slate-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                                                    {(u.name || "U").charAt(0).toUpperCase()}
                                                </div>
                                                <span className="truncate">{u.name}</span>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Chat Thread */}
                <div className={`flex-1 flex flex-col bg-white overflow-hidden ${!activeTarget ? "hidden md:flex" : "flex"}`}>
                    {/* Chat Header */}
                    {activeTarget ? (
                        <div className="h-14 px-4 sm:px-6 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
                            <div className="flex items-center gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setActiveTarget(null)}
                                    className="md:hidden p-1.5 -ml-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                                    title="Back to Conversations"
                                >
                                    <FiArrowLeft className="w-5 h-5" />
                                </button>
                                {activeTarget.type === "team" ? (
                                    <span className="text-xl">{activeTarget.avatar || "👥"}</span>
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                                        {activeTarget.name?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-bold text-slate-800 text-sm leading-tight">
                                        {activeTarget.name}
                                    </h3>
                                    <span className="text-[10px] text-slate-400 capitalize">
                                        {activeTarget.type === "team" ? "Team Channel" : "Direct Message"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-14 px-6 border-b border-slate-200 flex items-center">
                            <span className="text-xs text-slate-400">Select a conversation to begin</span>
                        </div>
                    )}

                    {/* Messages Body */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-slate-50/30">
                        {messagesLoading ? (
                            <div className="py-20 flex items-center justify-center">
                                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="py-24 text-center text-slate-400">
                                <FiMessageSquare className="w-10 h-10 mx-auto mb-2 opacity-20" />
                                <p className="text-xs font-medium">No messages in this chat yet.</p>
                                <p className="text-[11px] mt-0.5">Send a message to start collaborating!</p>
                            </div>
                        ) : (
                            messages.map((m) => {
                                const isSelf = (m.sender?._id || m.sender) === currentUser.id;
                                const timeStr = new Date(m.createdAt).toLocaleTimeString("en-IN", {
                                    hour: "2-digit",
                                    minute: "2-digit"
                                });
                                return (
                                    <div
                                        key={m._id}
                                        className={`flex gap-2.5 ${isSelf ? "justify-end" : "justify-start"}`}
                                    >
                                        {!isSelf && (
                                            <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                                                {(m.sender?.name || "U").charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div
                                            className={`max-w-md p-3 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                                                isSelf
                                                    ? "bg-blue-600 text-white rounded-tr-none"
                                                    : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
                                            }`}
                                        >
                                            {!isSelf && (
                                                <p className="font-bold text-[10px] text-blue-600 mb-0.5">
                                                    {m.sender?.name || "User"}
                                                </p>
                                            )}
                                            <p className="whitespace-pre-wrap">{m.text}</p>
                                            <p
                                                className={`text-[9px] mt-1 text-right ${
                                                    isSelf ? "text-blue-200" : "text-slate-400"
                                                }`}
                                            >
                                                {timeStr}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Chat Input Bar */}
                    {activeTarget && (
                        <div className="p-4 border-t border-slate-200 bg-white">
                            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder={`Message ${activeTarget.name}...`}
                                    className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                                />
                                <button
                                    type="submit"
                                    disabled={!text.trim()}
                                    className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl transition shadow-2xs"
                                >
                                    <FiSend className="w-4 h-4" />
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}

