import { useState, useEffect, useCallback } from "react";
import {
    FiUsers, FiPlus, FiSearch, FiSettings, FiLogOut,
    FiUserPlus, FiEdit2, FiTrash2, FiX, FiCheck,
    FiMail, FiClock, FiShield, FiBriefcase, FiUser,
    FiAward, FiCheckCircle, FiAlertCircle, FiActivity,
    FiList, FiRefreshCw, FiMoreVertical, FiLock, FiGlobe,
    FiChevronRight, FiGrid, FiFlag, FiCalendar, FiEye,
    FiSend, FiArrowLeft, FiCopy
} from "react-icons/fi";
import api from "../api";
import Layout from "../components/Layout";
import TaskDetailModal from "../components/TaskDetailModal";

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_CONFIG = {
    owner:   { bg:"bg-purple-100", text:"text-purple-800", border:"border-purple-200", icon: FiAward,     label:"Owner"   },
    admin:   { bg:"bg-red-100",    text:"text-red-800",    border:"border-red-200",    icon: FiShield,    label:"Admin"   },
    manager: { bg:"bg-amber-100",  text:"text-amber-800",  border:"border-amber-200",  icon: FiBriefcase, label:"Manager" },
    member:  { bg:"bg-blue-100",   text:"text-blue-800",   border:"border-blue-200",   icon: FiUser,      label:"Member"  }
};

const PRIORITY_CONFIG = {
    critical: { bg:"bg-red-50",     text:"text-red-700",    border:"border-red-200",    dot:"bg-red-500"    },
    high:     { bg:"bg-orange-50",  text:"text-orange-700", border:"border-orange-200", dot:"bg-orange-500" },
    medium:   { bg:"bg-amber-50",   text:"text-amber-700",  border:"border-amber-200",  dot:"bg-amber-500"  },
    low:      { bg:"bg-emerald-50", text:"text-emerald-700",border:"border-emerald-200",dot:"bg-emerald-500"}
};

const COLUMN_CONFIG = {
    todo:       { label:"To Do",       bg:"bg-slate-100",   text:"text-slate-700"   },
    inprogress: { label:"In Progress", bg:"bg-blue-100",    text:"text-blue-800"    },
    inreview:   { label:"In Review",   bg:"bg-amber-100",   text:"text-amber-800"   },
    completed:  { label:"Completed",   bg:"bg-emerald-100", text:"text-emerald-800" }
};

const TEAM_COLORS = ["#3B82F6","#8B5CF6","#EC4899","#F59E0B","#10B981","#EF4444","#06B6D4","#84CC16"];
const TEAM_AVATARS = ["👥","🚀","⚡","🎯","💡","🔥","🌟","🎨","🛠️","🏆","🌈","💎"];

function timeAgo(date) {
    const diff  = Date.now() - new Date(date).getTime();
    const mins  = Math.floor(diff/60000);
    const hours = Math.floor(diff/3600000);
    const days  = Math.floor(diff/86400000);
    if (mins  <  1) return "just now";
    if (mins  < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

function Avatar({ name, size="md" }) {
    const sizes = { sm:"w-7 h-7 text-xs", md:"w-9 h-9 text-sm", lg:"w-11 h-11 text-base" };
    return (
        <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold shrink-0`}>
            {name ? name.charAt(0).toUpperCase() : "?"}
        </div>
    );
}

function RoleBadge({ role }) {
    const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.member;
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
            <Icon className="w-3 h-3" /> {cfg.label}
        </span>
    );
}

function Toast({ msg, type }) {
    if (!msg) return null;
    const styles = {
        success: "bg-emerald-500",
        error:   "bg-red-500",
        info:    "bg-blue-500"
    };
    return (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl text-white text-sm font-medium shadow-lg flex items-center gap-2 ${styles[type]||styles.info} animate-pulse`}>
            {type==="success" ? <FiCheck className="w-4 h-4"/> : <FiAlertCircle className="w-4 h-4"/>}
            {msg}
        </div>
    );
}

// ─── Team Card ─────────────────────────────────────────────────────────────────

function TeamCard({ team, isSelected, onSelect }) {
    const completePct = team.taskCount > 0 ? Math.round((team.completedCount / team.taskCount) * 100) : 0;
    return (
        <div
            onClick={() => onSelect(team)}
            className={`cursor-pointer p-4 rounded-xl border transition-all ${
                isSelected
                    ? "border-blue-400 bg-blue-50 shadow-md"
                    : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm"
            }`}
        >
            <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-sm" style={{ background: team.color+"22", border:`2px solid ${team.color}44` }}>
                    {team.avatar}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-800 text-sm truncate">{team.name}</h3>
                        {team.privacy === "public"
                            ? <FiGlobe className="w-3 h-3 text-slate-400 shrink-0" title="Public"/>
                            : <FiLock  className="w-3 h-3 text-slate-400 shrink-0" title="Private"/>
                        }
                    </div>
                    <p className="text-xs text-slate-500 truncate">{team.description || "No description"}</p>
                </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-500 mb-2">
                <span className="flex items-center gap-1"><FiUsers className="w-3 h-3"/> {team.memberCount}</span>
                <span className="flex items-center gap-1"><FiCheckCircle className="w-3 h-3"/> {team.taskCount} tasks</span>
                <RoleBadge role={team.myRole || "member"} />
            </div>

            {team.taskCount > 0 && (
                <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Progress</span><span>{completePct}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all" style={{ width:`${completePct}%` }} />
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function TeamsPage() {
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

    // Data
    const [teams,       setTeams]       = useState([]);
    const [selectedTeam,setSelectedTeam]= useState(null);
    const [teamDetail,  setTeamDetail]  = useState(null);
    const [teamTasks,   setTeamTasks]   = useState([]);
    const [activity,    setActivity]    = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [myInvites,   setMyInvites]   = useState([]);

    // UI
    const [loading,       setLoading]       = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [activeTab,     setActiveTab]     = useState("tasks");
    const [search,        setSearch]        = useState("");
    const [taskSearch,    setTaskSearch]    = useState("");
    const [taskPriority,  setTaskPriority]  = useState("all");
    const [taskStatus,    setTaskStatus]    = useState("all");
    const [taskMember,    setTaskMember]    = useState("all");
    const [toast,         setToast]         = useState({ msg:"", type:"" });

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal,   setShowEditModal]   = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showTaskModal,   setShowTaskModal]   = useState(false);
    const [showDeleteConfirm,setShowDeleteConfirm]=useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [activeTaskDetail, setActiveTaskDetail] = useState(null);
    const [memberMenuId, setMemberMenuId] = useState(null);

    // Forms
    const [form, setForm] = useState({ name:"", description:"", avatar:"👥", color:"#3B82F6", privacy:"private" });
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole,  setInviteRole]  = useState("member");
    const [taskForm, setTaskForm] = useState({
        title:"", description:"", priority:"medium", column:"todo",
        assignedTo:"", dueDate:"", startDate:"", category:"General", tags:""
    });
    const [submitting, setSubmitting] = useState(false);

    const showToast = (msg, type="success") => {
        setToast({ msg, type });
        setTimeout(() => setToast({ msg:"", type:"" }), 3500);
    };

    // ── Data Fetching ──────────────────────────────────────────────────────

    const fetchTeams = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get("/teams", { params: { search: search || undefined } });
            setTeams(res.data);
        } catch { showToast("Failed to load teams","error"); }
        finally { setLoading(false); }
    }, [search]);

    const fetchMyInvitations = useCallback(async () => {
        try {
            const res = await api.get("/teams/my-invitations");
            setMyInvites(res.data);
        } catch { /* silent */ }
    }, []);

    useEffect(() => { fetchTeams(); fetchMyInvitations(); }, [fetchTeams, fetchMyInvitations]);

    const fetchTeamDetail = useCallback(async (teamId) => {
        try {
            setDetailLoading(true);
            const [detRes, taskRes, actRes] = await Promise.all([
                api.get(`/teams/${teamId}`),
                api.get(`/teams/${teamId}/tasks`, {
                    params: {
                        search:    taskSearch || undefined,
                        priority:  taskPriority !== "all" ? taskPriority : undefined,
                        column:    taskStatus  !== "all" ? taskStatus  : undefined,
                        assignedTo:taskMember  !== "all" ? taskMember  : undefined
                    }
                }),
                api.get(`/teams/${teamId}/activity`, { params: { limit: 15 } })
            ]);
            setTeamDetail(detRes.data);
            setTeamTasks(taskRes.data);
            setActivity(actRes.data.activities || []);

            // Load invitations if admin+
            if (["owner","admin"].includes(detRes.data.myRole)) {
                try {
                    const invRes = await api.get(`/teams/${teamId}/invitations`, { params: { status:"pending" } });
                    setInvitations(invRes.data);
                } catch { setInvitations([]); }
            }
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to load team details","error");
        } finally { setDetailLoading(false); }
    }, [taskSearch, taskPriority, taskStatus, taskMember]);

    useEffect(() => {
        if (selectedTeam) fetchTeamDetail(selectedTeam._id);
    }, [selectedTeam, fetchTeamDetail]);

    // ── Team CRUD ──────────────────────────────────────────────────────────

    const handleCreateTeam = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) return showToast("Team name is required","error");
        try {
            setSubmitting(true);
            const res = await api.post("/teams", form);
            setTeams((prev) => [res.data, ...prev]);
            setShowCreateModal(false);
            setForm({ name:"", description:"", avatar:"👥", color:"#3B82F6", privacy:"private" });
            showToast("Team created successfully!");
        } catch (err) { showToast(err.response?.data?.message || "Failed to create team","error"); }
        finally { setSubmitting(false); }
    };

    const handleUpdateTeam = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const res = await api.put(`/teams/${selectedTeam._id}`, form);
            setTeams((prev) => prev.map((t) => t._id === selectedTeam._id ? { ...t, ...res.data } : t));
            setTeamDetail((prev) => ({ ...prev, ...res.data }));
            setShowEditModal(false);
            showToast("Team updated!");
        } catch (err) { showToast(err.response?.data?.message || "Failed to update team","error"); }
        finally { setSubmitting(false); }
    };

    const handleDeleteTeam = async () => {
        try {
            await api.delete(`/teams/${selectedTeam._id}`);
            setTeams((prev) => prev.filter((t) => t._id !== selectedTeam._id));
            setSelectedTeam(null);
            setTeamDetail(null);
            setShowDeleteConfirm(false);
            showToast("Team deleted");
        } catch (err) { showToast(err.response?.data?.message || "Failed to delete","error"); }
    };

    const handleLeaveTeam = async () => {
        try {
            await api.delete(`/teams/${selectedTeam._id}/leave`);
            setTeams((prev) => prev.filter((t) => t._id !== selectedTeam._id));
            setSelectedTeam(null);
            setTeamDetail(null);
            setShowLeaveConfirm(false);
            showToast("You left the team");
        } catch (err) { showToast(err.response?.data?.message || "Failed to leave","error"); }
    };

    // ── Invitation Actions ─────────────────────────────────────────────────

    const handleInvite = async (e) => {
        e.preventDefault();
        if (!inviteEmail.trim()) return showToast("Email is required","error");
        try {
            setSubmitting(true);
            const res = await api.post(`/teams/${selectedTeam._id}/invite`, { email: inviteEmail, role: inviteRole });
            showToast(res.data.message || "Invitation sent!");
            setInviteEmail("");
            setInviteRole("member");
            fetchTeamDetail(selectedTeam._id);
        } catch (err) { showToast(err.response?.data?.message || "Failed to send invitation","error"); }
        finally { setSubmitting(false); }
    };

    const handleCancelInvitation = async (invId) => {
        try {
            await api.delete(`/teams/${selectedTeam._id}/invitations/${invId}`);
            setInvitations((prev) => prev.filter((inv) => inv._id !== invId));
            showToast("Invitation cancelled");
        } catch (err) { showToast(err.response?.data?.message || "Failed","error"); }
    };

    const handleResendInvitation = async (invId) => {
        try {
            await api.patch(`/teams/${selectedTeam._id}/invitations/${invId}/resend`);
            showToast("Invitation resent!");
        } catch (err) { showToast(err.response?.data?.message || "Failed","error"); }
    };

    // Accept / reject my invitations
    const handleAcceptMyInvite = async (token) => {
        try {
            await api.post("/teams/accept-invite", { token });
            showToast("You joined the team!");
            fetchTeams();
            fetchMyInvitations();
        } catch (err) { showToast(err.response?.data?.message || "Failed","error"); }
    };

    const handleRejectMyInvite = async (token) => {
        try {
            await api.post("/teams/reject-invite", { token });
            setMyInvites((prev) => prev.filter((inv) => inv.token !== token));
            showToast("Invitation rejected");
        } catch (err) { showToast(err.response?.data?.message || "Failed","error"); }
    };

    // ── Member Actions ─────────────────────────────────────────────────────

    const handleChangeRole = async (memberId, role) => {
        try {
            await api.patch(`/teams/${selectedTeam._id}/members/${memberId}/role`, { role });
            fetchTeamDetail(selectedTeam._id);
            setMemberMenuId(null);
            showToast("Role updated!");
        } catch (err) { showToast(err.response?.data?.message || "Failed","error"); }
    };

    const handleRemoveMember = async (memberId) => {
        if (!window.confirm("Remove this member from the team?")) return;
        try {
            await api.delete(`/teams/${selectedTeam._id}/members/${memberId}`);
            fetchTeamDetail(selectedTeam._id);
            fetchTeams();
            showToast("Member removed");
        } catch (err) { showToast(err.response?.data?.message || "Failed","error"); }
    };

    // ── Task Actions ───────────────────────────────────────────────────────

    const handleCreateTask = async (e) => {
        e.preventDefault();
        if (!taskForm.title.trim()) return showToast("Title required","error");
        try {
            setSubmitting(true);
            await api.post(`/teams/${selectedTeam._id}/tasks`, {
                ...taskForm,
                assignedTo: taskForm.assignedTo || undefined,
                tags: taskForm.tags ? taskForm.tags.split(",").map((t) => t.trim()).filter(Boolean) : []
            });
            setShowTaskModal(false);
            setTaskForm({ title:"",description:"",priority:"medium",column:"todo",assignedTo:"",dueDate:"",startDate:"",category:"General",tags:"" });
            fetchTeamDetail(selectedTeam._id);
            showToast("Task created!");
        } catch (err) { showToast(err.response?.data?.message || "Failed","error"); }
        finally { setSubmitting(false); }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm("Delete this task?")) return;
        try {
            await api.delete(`/teams/${selectedTeam._id}/tasks/${taskId}`);
            setTeamTasks((prev) => prev.filter((t) => t._id !== taskId));
            showToast("Task deleted");
        } catch (err) { showToast(err.response?.data?.message || "Failed","error"); }
    };

    const handleUpdateTaskColumn = async (taskId, column) => {
        try {
            await api.patch(`/teams/${selectedTeam._id}/tasks/${taskId}`, { column });
            setTeamTasks((prev) => prev.map((t) => t._id === taskId ? { ...t, column } : t));
        } catch (err) { showToast(err.response?.data?.message || "Failed","error"); }
    };

    // ── Helpers ────────────────────────────────────────────────────────────

    const allMembers = teamDetail ? [
        { _id: teamDetail._id+"_owner", user: teamDetail.owner, role: "owner", joinedAt: teamDetail.createdAt },
        ...(teamDetail.members || [])
    ] : [];

    const myRole = teamDetail?.myRole;
    const isAdmin = ["owner","admin"].includes(myRole);
    const isManager = ["owner","admin","manager"].includes(myRole);
    const isOwner = myRole === "owner";

    // ── ACTIVITY ICONS ─────────────────────────────────────────────────────

    const ACTIVITY_ICONS = {
        TASK_CREATED:         { icon:"✅", color:"text-emerald-600" },
        TASK_UPDATED:         { icon:"✏️", color:"text-blue-600"    },
        TASK_DELETED:         { icon:"🗑️", color:"text-red-600"     },
        TASK_COMPLETED:       { icon:"🏆", color:"text-emerald-600" },
        TASK_ASSIGNED:        { icon:"👤", color:"text-blue-600"    },
        TEAM_CREATED:         { icon:"🎉", color:"text-purple-600"  },
        TEAM_UPDATED:         { icon:"⚙️", color:"text-slate-600"   },
        MEMBER_INVITED:       { icon:"📧", color:"text-blue-600"    },
        INVITATION_ACCEPTED:  { icon:"✅", color:"text-emerald-600" },
        INVITATION_REJECTED:  { icon:"❌", color:"text-red-600"     },
        INVITATION_CANCELLED: { icon:"🚫", color:"text-slate-600"   },
        MEMBER_ADDED:         { icon:"➕", color:"text-emerald-600" },
        MEMBER_REMOVED:       { icon:"➖", color:"text-red-600"     },
        MEMBER_LEFT:          { icon:"🚶", color:"text-slate-600"   },
        ROLE_CHANGED:         { icon:"🔄", color:"text-amber-600"   },
        COMMENT_ADDED:        { icon:"💬", color:"text-purple-600"  }
    };

    const getActivityText = (act) => {
        const name = act.user?.name || "Someone";
        const task = act.task?.title ? `"${act.task.title}"` : "a task";
        switch(act.action) {
            case "TASK_CREATED":         return `${name} created ${task}`;
            case "TASK_UPDATED":         return `${name} updated ${task}`;
            case "TASK_DELETED":         return `${name} deleted ${task}`;
            case "TASK_COMPLETED":       return `${name} completed ${task}`;
            case "TASK_ASSIGNED":        return `${name} assigned ${task}`;
            case "TEAM_CREATED":         return `${name} created this team`;
            case "TEAM_UPDATED":         return `${name} updated team settings`;
            case "MEMBER_INVITED":       return `${name} invited ${act.details?.email || "someone"}`;
            case "INVITATION_ACCEPTED":  return `${name} joined the team`;
            case "INVITATION_REJECTED":  return `${name} rejected the invitation`;
            case "INVITATION_CANCELLED": return `${name} cancelled an invitation to ${act.details?.email||"someone"}`;
            case "MEMBER_ADDED":         return `${name} added ${act.details?.name || "a member"}`;
            case "MEMBER_REMOVED":       return `${name} removed a member`;
            case "MEMBER_LEFT":          return `${name} left the team`;
            case "ROLE_CHANGED":         return `${name} changed a member's role to ${act.details?.newRole || ""}`;
            case "COMMENT_ADDED":        return `${name} commented on ${task}`;
            default: return `${name} performed an action`;
        }
    };

    // ── RENDER ─────────────────────────────────────────────────────────────

    return (
        <Layout title="Teams">
            <Toast msg={toast.msg} type={toast.type} />

            <div className="flex h-[calc(100vh-56px)] overflow-hidden">

                {/* ── LEFT: Teams List Panel ─────────────────────────── */}
                <div className={`w-full lg:w-80 border-r border-slate-200 bg-white flex flex-col shrink-0 ${selectedTeam ? "hidden lg:flex" : "flex"}`}>
                    {/* Header */}
                    <div className="p-4 border-b border-slate-100">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="font-bold text-slate-800 text-base">My Teams</h2>
                            <button
                                onClick={() => { setForm({ name:"",description:"",avatar:"👥",color:"#3B82F6",privacy:"private" }); setShowCreateModal(true); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition"
                            >
                                <FiPlus className="w-3.5 h-3.5"/> New Team
                            </button>
                        </div>
                        <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key==="Enter" && fetchTeams()}
                                placeholder="Search teams..."
                                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                            />
                        </div>
                    </div>

                    {/* Pending Invites Banner */}
                    {myInvites.length > 0 && (
                        <div className="mx-3 mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1.5">
                                <FiMail className="w-3.5 h-3.5"/> {myInvites.length} Pending Invitation{myInvites.length>1?"s":""}
                            </p>
                            {myInvites.map((inv) => (
                                <div key={inv._id} className="mb-2 last:mb-0">
                                    <p className="text-xs text-slate-700 font-medium">{inv.team?.name}</p>
                                    <p className="text-xs text-slate-500 mb-1.5">
                                        from {inv.invitedBy?.name} · as {inv.role}
                                    </p>
                                    <div className="flex gap-1.5">
                                        <button onClick={() => handleAcceptMyInvite(inv.token)} className="flex-1 py-1 text-xs bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">Accept</button>
                                        <button onClick={() => handleRejectMyInvite(inv.token)} className="flex-1 py-1 text-xs bg-white border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50 transition">Decline</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Teams List */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {loading ? (
                            [1,2,3].map((i) => (
                                <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse"/>
                            ))
                        ) : teams.length === 0 ? (
                            <div className="text-center py-12 text-slate-400">
                                <FiUsers className="w-10 h-10 mx-auto mb-2 opacity-30"/>
                                <p className="text-sm font-medium">No teams yet</p>
                                <p className="text-xs mt-1">Create your first team</p>
                            </div>
                        ) : (
                            teams.map((team) => (
                                <TeamCard
                                    key={team._id}
                                    team={team}
                                    isSelected={selectedTeam?._id === team._id}
                                    onSelect={setSelectedTeam}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* ── RIGHT: Team Detail Panel ───────────────────────── */}
                {!selectedTeam ? (
                    <div className="hidden lg:flex flex-1 items-center justify-center bg-slate-50">
                        <div className="text-center text-slate-400">
                            <FiUsers className="w-14 h-14 mx-auto mb-3 opacity-20"/>
                            <p className="font-medium">Select a team to view details</p>
                        </div>
                    </div>
                ) : detailLoading && !teamDetail ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/>
                    </div>
                ) : teamDetail ? (
                    <div className={`flex-1 flex flex-col overflow-hidden ${!selectedTeam ? "hidden lg:flex" : "flex"}`}>

                        {/* Team Header */}
                        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedTeam(null)}
                                        className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                                        title="Back to Teams List"
                                    >
                                        <FiArrowLeft className="w-5 h-5"/>
                                    </button>
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xl sm:text-2xl shadow-sm shrink-0" style={{ background: teamDetail.color+"22", border:`2px solid ${teamDetail.color}44` }}>
                                        {teamDetail.avatar}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h1 className="text-base sm:text-lg font-bold text-slate-800 truncate">{teamDetail.name}</h1>
                                            <RoleBadge role={teamDetail.myRole}/>
                                            {teamDetail.privacy === "public"
                                                ? <span className="flex items-center gap-1 text-[11px] text-slate-400"><FiGlobe className="w-3 h-3"/> Public</span>
                                                : <span className="flex items-center gap-1 text-[11px] text-slate-400"><FiLock  className="w-3 h-3"/> Private</span>
                                            }
                                        </div>
                                        <p className="text-xs sm:text-sm text-slate-500 truncate">{teamDetail.description || "No description"}</p>
                                    </div>
                                </div>

                                {/* Action buttons */}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    {isAdmin && (
                                        <button onClick={() => { setShowInviteModal(true); }} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition">
                                            <FiUserPlus className="w-4 h-4"/> Invite
                                        </button>
                                    )}
                                    {isManager && (
                                        <button onClick={() => { setShowTaskModal(true); }} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                                            <FiPlus className="w-4 h-4"/> Add Task
                                        </button>
                                    )}
                                    {isAdmin && (
                                        <button onClick={() => { setForm({ name:teamDetail.name, description:teamDetail.description, avatar:teamDetail.avatar, color:teamDetail.color, privacy:teamDetail.privacy }); setShowEditModal(true); }} className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition">
                                            <FiEdit2 className="w-4 h-4"/>
                                        </button>
                                    )}
                                    {isOwner && (
                                        <button onClick={() => setShowDeleteConfirm(true)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                                            <FiTrash2 className="w-4 h-4"/>
                                        </button>
                                    )}
                                    {!isOwner && (
                                        <button onClick={() => setShowLeaveConfirm(true)} className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-lg transition">
                                            <FiLogOut className="w-4 h-4"/> Leave
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Stats strip */}
                            <div className="flex items-center gap-4 sm:gap-6 mt-3 text-xs sm:text-sm text-slate-500 flex-wrap">
                                <span className="flex items-center gap-1.5"><FiUsers className="w-4 h-4 text-slate-400"/> {teamDetail.memberCount} members</span>
                                <span className="flex items-center gap-1.5"><FiCheckCircle className="w-4 h-4 text-slate-400"/> {teamDetail.taskStats?.total || 0} tasks</span>
                                <span className="flex items-center gap-1.5 text-emerald-600"><FiCheck className="w-4 h-4"/> {teamDetail.taskStats?.completed || 0} done</span>
                                {(teamDetail.taskStats?.overdue || 0) > 0 && (
                                    <span className="flex items-center gap-1.5 text-red-500"><FiAlertCircle className="w-4 h-4"/> {teamDetail.taskStats.overdue} overdue</span>
                                )}
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-1 mt-3 border-b border-slate-100 -mb-4 overflow-x-auto">
                                {[
                                    { key:"tasks",   label:"Tasks",    icon:FiList     },
                                    { key:"members", label:"Members",  icon:FiUsers    },
                                    { key:"activity",label:"Activity", icon:FiActivity },
                                    ...(isAdmin ? [{ key:"invitations", label:`Invites${invitations.length>0?" ("+invitations.length+")":""}`, icon:FiMail }] : [])
                                ].map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap shrink-0 transition ${
                                            activeTab===tab.key
                                                ? "border-blue-600 text-blue-600"
                                                : "border-transparent text-slate-500 hover:text-slate-700"
                                        }`}
                                    >
                                        <tab.icon className="w-4 h-4"/> {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6">

                            {/* ── TASKS TAB ── */}
                            {activeTab==="tasks" && (
                                <div>
                                    {/* Filters */}
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        <div className="relative flex-1 min-w-48">
                                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                                            <input value={taskSearch} onChange={(e)=>setTaskSearch(e.target.value)} onKeyDown={(e)=>e.key==="Enter"&&fetchTeamDetail(selectedTeam._id)} placeholder="Search tasks..." className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                                        </div>
                                        <select value={taskStatus} onChange={(e)=>{setTaskStatus(e.target.value);}} className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                                            <option value="all">All Status</option>
                                            <option value="todo">To Do</option>
                                            <option value="inprogress">In Progress</option>
                                            <option value="inreview">In Review</option>
                                            <option value="completed">Completed</option>
                                        </select>
                                        <select value={taskPriority} onChange={(e)=>setTaskPriority(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                                            <option value="all">All Priority</option>
                                            <option value="critical">Critical</option>
                                            <option value="high">High</option>
                                            <option value="medium">Medium</option>
                                            <option value="low">Low</option>
                                        </select>
                                        <select value={taskMember} onChange={(e)=>setTaskMember(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                                            <option value="all">All Members</option>
                                            <option value="unassigned">Unassigned</option>
                                            {allMembers.map((m) => <option key={m._id} value={m.user?._id||m.user}>{m.user?.name}</option>)}
                                        </select>
                                        <button onClick={()=>fetchTeamDetail(selectedTeam._id)} className="px-3 py-2 text-sm bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition"><FiRefreshCw className="w-4 h-4"/></button>
                                    </div>

                                    {/* Task list by column */}
                                    {teamTasks.length === 0 ? (
                                        <div className="text-center py-16 text-slate-400">
                                            <FiCheckCircle className="w-10 h-10 mx-auto mb-2 opacity-20"/>
                                            <p className="font-medium">No tasks found</p>
                                            {isManager && <p className="text-xs mt-1">Click "Add Task" to create one</p>}
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {teamTasks.map((task) => {
                                                const pCfg  = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
                                                const cCfg  = COLUMN_CONFIG[task.column]    || COLUMN_CONFIG.todo;
                                                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "completed";
                                                return (
                                                    <div key={task._id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-sm transition group">
                                                        <div className="flex items-start gap-3">
                                                            {/* Priority dot */}
                                                            <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${pCfg.dot}`}/>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                                    <h4 className="font-medium text-slate-800 text-sm">{task.title}</h4>
                                                                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${pCfg.bg} ${pCfg.text} ${pCfg.border}`}>{task.priority}</span>
                                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cCfg.bg} ${cCfg.text}`}>{cCfg.label}</span>
                                                                </div>
                                                                {task.description && <p className="text-xs text-slate-500 truncate mb-1">{task.description}</p>}
                                                                <div className="flex items-center gap-3 flex-wrap text-xs text-slate-400">
                                                                    {task.assignedTo && (
                                                                        <span className="flex items-center gap-1">
                                                                            <Avatar name={task.assignedTo.name} size="sm"/>
                                                                            {task.assignedTo.name}
                                                                        </span>
                                                                    )}
                                                                    {task.dueDate && (
                                                                        <span className={`flex items-center gap-1 ${isOverdue?"text-red-500 font-medium":""}`}>
                                                                            <FiCalendar className="w-3 h-3"/>
                                                                            {new Date(task.dueDate).toLocaleDateString("en-IN",{ day:"2-digit", month:"short" })}
                                                                            {isOverdue && " (overdue)"}
                                                                        </span>
                                                                    )}
                                                                    {task.subtasks?.length > 0 && (
                                                                        <span>{task.subtasks.filter(s=>s.isCompleted).length}/{task.subtasks.length} subtasks</span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Actions */}
                                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                                                                {isManager && (
                                                                    <select
                                                                        value={task.column}
                                                                        onChange={(e) => handleUpdateTaskColumn(task._id, e.target.value)}
                                                                        className="text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none bg-white"
                                                                    >
                                                                        <option value="todo">To Do</option>
                                                                        <option value="inprogress">In Progress</option>
                                                                        <option value="inreview">In Review</option>
                                                                        <option value="completed">Completed</option>
                                                                    </select>
                                                                )}
                                                                <button onClick={() => setActiveTaskDetail(task)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><FiEye className="w-4 h-4"/></button>
                                                                {isManager && <button onClick={() => handleDeleteTask(task._id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><FiTrash2 className="w-4 h-4"/></button>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── MEMBERS TAB ── */}
                            {activeTab==="members" && (
                                <div className="space-y-3">
                                    {allMembers.map((member) => {
                                        const rCfg = ROLE_CONFIG[member.role] || ROLE_CONFIG.member;
                                        const isSelf = (member.user?._id || member.user) === currentUser.id;
                                        const isThisOwner = member.role === "owner";
                                        return (
                                            <div key={member._id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 hover:shadow-sm transition">
                                                <Avatar name={member.user?.name} size="lg"/>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-slate-800 text-sm">{member.user?.name}</span>
                                                        {isSelf && <span className="text-xs text-slate-400">(you)</span>}
                                                        <RoleBadge role={member.role}/>
                                                    </div>
                                                    <p className="text-xs text-slate-500">{member.user?.email}</p>
                                                    <p className="text-xs text-slate-400 mt-0.5">Joined {new Date(member.joinedAt).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</p>
                                                </div>

                                                {/* Role/Remove actions */}
                                                {isAdmin && !isSelf && !isThisOwner && (
                                                    <div className="relative">
                                                        <button
                                                            onClick={() => setMemberMenuId(memberMenuId===member._id ? null : member._id)}
                                                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                                                        >
                                                            <FiMoreVertical className="w-4 h-4"/>
                                                        </button>
                                                        {memberMenuId===member._id && (
                                                            <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden">
                                                                <p className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">Change Role</p>
                                                                {["admin","manager","member"].map((r) => (
                                                                    <button
                                                                        key={r}
                                                                        onClick={() => handleChangeRole(member._id, r)}
                                                                        disabled={r==="admin" && !isOwner}
                                                                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition ${member.role===r?"bg-blue-50 text-blue-700 font-medium":"hover:bg-slate-50 text-slate-700"} disabled:opacity-40 disabled:cursor-not-allowed`}
                                                                    >
                                                                        {r===member.role && <FiCheck className="w-3 h-3"/>}
                                                                        {r.charAt(0).toUpperCase()+r.slice(1)}
                                                                    </button>
                                                                ))}
                                                                <div className="border-t border-slate-100 mt-1">
                                                                    <button
                                                                        onClick={() => handleRemoveMember(member._id)}
                                                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                                                                    >
                                                                        <FiTrash2 className="w-3 h-3"/> Remove
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* ── ACTIVITY TAB ── */}
                            {activeTab==="activity" && (
                                <div>
                                    {activity.length === 0 ? (
                                        <div className="text-center py-16 text-slate-400">
                                            <FiActivity className="w-10 h-10 mx-auto mb-2 opacity-20"/>
                                            <p className="font-medium">No activity yet</p>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-100"/>
                                            <div className="space-y-1">
                                                {activity.map((act, idx) => {
                                                    const cfg = ACTIVITY_ICONS[act.action] || { icon:"📌", color:"text-slate-600" };
                                                    return (
                                                        <div key={act._id || idx} className="relative flex gap-4 pb-4">
                                                            <div className="relative z-10 w-10 h-10 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center text-base shrink-0">
                                                                {cfg.icon}
                                                            </div>
                                                            <div className="flex-1 bg-white border border-slate-100 rounded-xl p-3 mt-0.5">
                                                                <p className="text-sm text-slate-700">{getActivityText(act)}</p>
                                                                <p className="text-xs text-slate-400 mt-0.5">{timeAgo(act.createdAt)}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── INVITATIONS TAB ── */}
                            {activeTab==="invitations" && isAdmin && (
                                <div>
                                    {/* Send new invite form */}
                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
                                        <h3 className="font-semibold text-slate-800 text-sm mb-3 flex items-center gap-2">
                                            <FiSend className="w-4 h-4 text-blue-600"/> Send Invitation
                                        </h3>
                                        <form onSubmit={handleInvite} className="flex gap-2 flex-wrap">
                                            <input
                                                value={inviteEmail}
                                                onChange={(e) => setInviteEmail(e.target.value)}
                                                placeholder="Email address"
                                                type="email"
                                                className="flex-1 min-w-48 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                            />
                                            <select value={inviteRole} onChange={(e)=>setInviteRole(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                                                <option value="member">Member</option>
                                                <option value="manager">Manager</option>
                                                {isOwner && <option value="admin">Admin</option>}
                                            </select>
                                            <button type="submit" disabled={submitting} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 transition">
                                                {submitting ? "Sending..." : "Send Invite"}
                                            </button>
                                        </form>
                                    </div>

                                    {/* Pending invitations list */}
                                    <h3 className="font-semibold text-slate-700 text-sm mb-3">Pending Invitations ({invitations.length})</h3>
                                    {invitations.length === 0 ? (
                                        <div className="text-center py-10 text-slate-400">
                                            <FiMail className="w-8 h-8 mx-auto mb-2 opacity-30"/>
                                            <p className="text-sm">No pending invitations</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {invitations.map((inv) => (
                                                <div key={inv._id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4">
                                                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                        <FiMail className="w-4 h-4"/>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-slate-800 truncate">{inv.email}</p>
                                                        <p className="text-xs text-slate-500">
                                                            Invited as {inv.role} · by {inv.invitedBy?.name} · {timeAgo(inv.sentAt)}
                                                        </p>
                                                    </div>
                                                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">Pending</span>
                                                    <div className="flex gap-1">
                                                        <button onClick={()=>handleResendInvitation(inv._id)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition" title="Resend">
                                                            <FiRefreshCw className="w-4 h-4"/>
                                                        </button>
                                                        <button onClick={()=>handleCancelInvitation(inv._id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition" title="Cancel">
                                                            <FiX className="w-4 h-4"/>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ) : null}
            </div>

            {/* ── MODALS ─────────────────────────────────────────────── */}

            {/* Create Team Modal */}
            {showCreateModal && (
                <Modal title="Create New Team" onClose={()=>setShowCreateModal(false)}>
                    <form onSubmit={handleCreateTeam} className="space-y-4">
                        {/* Avatar + Color row */}
                        <div className="flex gap-4">
                            <div>
                                <label className="text-xs font-medium text-slate-600 block mb-1.5">Avatar</label>
                                <div className="grid grid-cols-6 gap-1.5">
                                    {TEAM_AVATARS.map((emoji) => (
                                        <button type="button" key={emoji} onClick={()=>setForm(f=>({...f,avatar:emoji}))}
                                            className={`w-9 h-9 text-xl rounded-lg flex items-center justify-center transition ${form.avatar===emoji?"ring-2 ring-blue-500 bg-blue-50":"hover:bg-slate-100"}`}>
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-600 block mb-1.5">Color</label>
                                <div className="grid grid-cols-4 gap-1.5">
                                    {TEAM_COLORS.map((c) => (
                                        <button type="button" key={c} onClick={()=>setForm(f=>({...f,color:c}))}
                                            className={`w-9 h-9 rounded-lg transition ${form.color===c?"ring-2 ring-offset-1 ring-slate-400 scale-110":""}`}
                                            style={{background:c}}/>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Team Name *</label>
                            <input value={form.name} onChange={(e)=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Product Team" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Description</label>
                            <textarea value={form.description} onChange={(e)=>setForm(f=>({...f,description:e.target.value}))} rows={2} placeholder="What is this team about?" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"/>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Privacy</label>
                            <div className="flex gap-3">
                                {["private","public"].map((p) => (
                                    <label key={p} className={`flex items-center gap-2 flex-1 p-3 border rounded-lg cursor-pointer transition ${form.privacy===p?"border-blue-400 bg-blue-50":"border-slate-200 hover:bg-slate-50"}`}>
                                        <input type="radio" name="privacy" value={p} checked={form.privacy===p} onChange={()=>setForm(f=>({...f,privacy:p}))} className="accent-blue-600"/>
                                        {p==="private" ? <FiLock className="w-4 h-4"/> : <FiGlobe className="w-4 h-4"/>}
                                        <span className="text-sm font-medium capitalize">{p}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button type="button" onClick={()=>setShowCreateModal(false)} className="flex-1 py-2 text-sm border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">Cancel</button>
                            <button type="submit" disabled={submitting} className="flex-1 py-2 text-sm bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">{submitting?"Creating...":"Create Team"}</button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Edit Team Modal */}
            {showEditModal && (
                <Modal title="Edit Team" onClose={()=>setShowEditModal(false)}>
                    <form onSubmit={handleUpdateTeam} className="space-y-4">
                        <div className="flex gap-4">
                            <div>
                                <label className="text-xs font-medium text-slate-600 block mb-1.5">Avatar</label>
                                <div className="grid grid-cols-6 gap-1.5">
                                    {TEAM_AVATARS.map((emoji) => (
                                        <button type="button" key={emoji} onClick={()=>setForm(f=>({...f,avatar:emoji}))}
                                            className={`w-9 h-9 text-xl rounded-lg flex items-center justify-center transition ${form.avatar===emoji?"ring-2 ring-blue-500 bg-blue-50":"hover:bg-slate-100"}`}>
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-600 block mb-1.5">Color</label>
                                <div className="grid grid-cols-4 gap-1.5">
                                    {TEAM_COLORS.map((c) => (
                                        <button type="button" key={c} onClick={()=>setForm(f=>({...f,color:c}))}
                                            className={`w-9 h-9 rounded-lg transition ${form.color===c?"ring-2 ring-offset-1 ring-slate-400 scale-110":""}`}
                                            style={{background:c}}/>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Team Name *</label>
                            <input value={form.name} onChange={(e)=>setForm(f=>({...f,name:e.target.value}))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Description</label>
                            <textarea value={form.description} onChange={(e)=>setForm(f=>({...f,description:e.target.value}))} rows={2} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"/>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Privacy</label>
                            <div className="flex gap-3">
                                {["private","public"].map((p) => (
                                    <label key={p} className={`flex items-center gap-2 flex-1 p-3 border rounded-lg cursor-pointer transition ${form.privacy===p?"border-blue-400 bg-blue-50":"border-slate-200 hover:bg-slate-50"}`}>
                                        <input type="radio" name="privacy" value={p} checked={form.privacy===p} onChange={()=>setForm(f=>({...f,privacy:p}))} className="accent-blue-600"/>
                                        {p==="private" ? <FiLock className="w-4 h-4"/> : <FiGlobe className="w-4 h-4"/>}
                                        <span className="text-sm font-medium capitalize">{p}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button type="button" onClick={()=>setShowEditModal(false)} className="flex-1 py-2 text-sm border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">Cancel</button>
                            <button type="submit" disabled={submitting} className="flex-1 py-2 text-sm bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">{submitting?"Saving...":"Save Changes"}</button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Add Task Modal */}
            {showTaskModal && (
                <Modal title="Create Team Task" onClose={()=>setShowTaskModal(false)}>
                    <form onSubmit={handleCreateTask} className="space-y-3">
                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Title *</label>
                            <input value={taskForm.title} onChange={(e)=>setTaskForm(f=>({...f,title:e.target.value}))} placeholder="Task title" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Description</label>
                            <textarea value={taskForm.description} onChange={(e)=>setTaskForm(f=>({...f,description:e.target.value}))} rows={2} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Task description..."/>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-medium text-slate-600 block mb-1">Priority</label>
                                <select value={taskForm.priority} onChange={(e)=>setTaskForm(f=>({...f,priority:e.target.value}))} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-600 block mb-1">Status</label>
                                <select value={taskForm.column} onChange={(e)=>setTaskForm(f=>({...f,column:e.target.value}))} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                                    <option value="todo">To Do</option>
                                    <option value="inprogress">In Progress</option>
                                    <option value="inreview">In Review</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Assign To</label>
                            <select value={taskForm.assignedTo} onChange={(e)=>setTaskForm(f=>({...f,assignedTo:e.target.value}))} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                                <option value="">Unassigned</option>
                                {allMembers.map((m) => <option key={m._id} value={m.user?._id||m.user}>{m.user?.name} ({m.role})</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-medium text-slate-600 block mb-1">Start Date</label>
                                <input type="date" value={taskForm.startDate} onChange={(e)=>setTaskForm(f=>({...f,startDate:e.target.value}))} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-600 block mb-1">Due Date</label>
                                <input type="date" value={taskForm.dueDate} onChange={(e)=>setTaskForm(f=>({...f,dueDate:e.target.value}))} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Category</label>
                            <input value={taskForm.category} onChange={(e)=>setTaskForm(f=>({...f,category:e.target.value}))} placeholder="e.g. Design, Development" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                        </div>
                        <div className="flex gap-2 pt-1">
                            <button type="button" onClick={()=>setShowTaskModal(false)} className="flex-1 py-2 text-sm border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">Cancel</button>
                            <button type="submit" disabled={submitting} className="flex-1 py-2 text-sm bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">{submitting?"Creating...":"Create Task"}</button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Delete Confirm */}
            {showDeleteConfirm && (
                <Modal title="Delete Team" onClose={()=>setShowDeleteConfirm(false)}>
                    <div className="text-center py-2">
                        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                            <FiTrash2 className="w-7 h-7 text-red-500"/>
                        </div>
                        <p className="text-slate-700 font-medium mb-1">Delete "{teamDetail?.name}"?</p>
                        <p className="text-sm text-slate-500 mb-6">This will permanently delete the team and all its tasks. This cannot be undone.</p>
                        <div className="flex gap-3">
                            <button onClick={()=>setShowDeleteConfirm(false)} className="flex-1 py-2 text-sm border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">Cancel</button>
                            <button onClick={handleDeleteTeam} className="flex-1 py-2 text-sm bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">Delete Team</button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Leave Confirm */}
            {showLeaveConfirm && (
                <Modal title="Leave Team" onClose={()=>setShowLeaveConfirm(false)}>
                    <div className="text-center py-2">
                        <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                            <FiLogOut className="w-7 h-7 text-amber-500"/>
                        </div>
                        <p className="text-slate-700 font-medium mb-1">Leave "{teamDetail?.name}"?</p>
                        <p className="text-sm text-slate-500 mb-6">You will lose access to this team and its tasks.</p>
                        <div className="flex gap-3">
                            <button onClick={()=>setShowLeaveConfirm(false)} className="flex-1 py-2 text-sm border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">Cancel</button>
                            <button onClick={handleLeaveTeam} className="flex-1 py-2 text-sm bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600">Leave Team</button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Task Detail Modal */}
            {activeTaskDetail && (
                <TaskDetailModal
                    task={activeTaskDetail}
                    onClose={() => setActiveTaskDetail(null)}
                    onUpdate={() => { setActiveTaskDetail(null); fetchTeamDetail(selectedTeam._id); }}
                />
            )}
        </Layout>
    );
}

// ─── Generic Modal Wrapper ───────────────────────────────────────────────────

function Modal({ title, onClose, children }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}/>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <h2 className="font-bold text-slate-800">{title}</h2>
                    <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition">
                        <FiX className="w-5 h-5"/>
                    </button>
                </div>
                <div className="px-6 py-5">{children}</div>
            </div>
        </div>
    );
}
