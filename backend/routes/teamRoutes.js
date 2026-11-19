import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
    requireTeamMember,
    requireAdmin,
    requireOwner,
    requireManager
} from "../middleware/teamMiddleware.js";

import {
    // Team CRUD
    getMyTeams,
    getTeamById,
    createTeam,
    updateTeam,
    deleteTeam,
    // Invitations
    inviteMember,
    getInvitations,
    acceptInvitation,
    rejectInvitation,
    resendInvitation,
    cancelInvitation,
    getMyInvitations,
    // Members
    addMember,
    updateMemberRole,
    removeMember,
    leaveTeam,
    transferOwnership,
    // Activity
    getTeamActivity,
    // Tasks
    getTeamTasks,
    createTeamTask,
    updateTeamTask,
    deleteTeamTask,
    getMyTeamTasks,
    getAllMyTeamTasks
} from "../controllers/teamController.js";

const router = express.Router();

// All routes require JWT auth
router.use(protect);

// ─── My Teams & Global ───────────────────────────────────────────────────────
router.get("/",                 getMyTeams);           // GET  /api/teams
router.post("/",                createTeam);           // POST /api/teams
router.get("/my-invitations",   getMyInvitations);     // GET  /api/teams/my-invitations

// Accept / reject by token (no team ID needed in URL)
router.post("/accept-invite",   acceptInvitation);     // POST /api/teams/accept-invite
router.post("/reject-invite",   rejectInvitation);     // POST /api/teams/reject-invite

// MUST come before /:id parameterized routes
router.get("/user/my-tasks",    getAllMyTeamTasks);    // GET  /api/teams/user/my-tasks

// ─── Single Team ─────────────────────────────────────────────────────────────
router.get("/:id",   requireTeamMember,              getTeamById);  // GET    /api/teams/:id
router.put("/:id",   requireTeamMember, requireAdmin, updateTeam);  // PUT    /api/teams/:id
router.delete("/:id",requireTeamMember, requireOwner, deleteTeam);  // DELETE /api/teams/:id

// ─── Invitations ─────────────────────────────────────────────────────────────
router.get("/:id/invitations",                      requireTeamMember, requireAdmin, getInvitations);    // GET    /api/teams/:id/invitations
router.post("/:id/invite",                          requireTeamMember, requireAdmin, inviteMember);      // POST   /api/teams/:id/invite
router.patch("/:id/invitations/:invId/resend",      requireTeamMember, requireAdmin, resendInvitation);  // PATCH  /api/teams/:id/invitations/:invId/resend
router.delete("/:id/invitations/:invId",            requireTeamMember, requireAdmin, cancelInvitation);  // DELETE /api/teams/:id/invitations/:invId

// ─── Members ─────────────────────────────────────────────────────────────────
router.post("/:id/members",                         requireTeamMember, requireAdmin, addMember);         // POST   /api/teams/:id/members
router.patch("/:id/members/:memberId/role",         requireTeamMember, requireAdmin, updateMemberRole);  // PATCH  /api/teams/:id/members/:memberId/role
router.delete("/:id/members/:memberId",             requireTeamMember, requireAdmin, removeMember);      // DELETE /api/teams/:id/members/:memberId
router.delete("/:id/leave",                         requireTeamMember,              leaveTeam);          // DELETE /api/teams/:id/leave
router.patch("/:id/transfer-ownership",             requireTeamMember, requireOwner, transferOwnership); // PATCH  /api/teams/:id/transfer-ownership

// ─── Activity ────────────────────────────────────────────────────────────────
router.get("/:id/activity",                         requireTeamMember,              getTeamActivity);    // GET    /api/teams/:id/activity

// ─── Team Tasks ──────────────────────────────────────────────────────────────
router.get("/:id/tasks",             requireTeamMember,               getTeamTasks);    // GET    /api/teams/:id/tasks
router.post("/:id/tasks",            requireTeamMember, requireManager, createTeamTask); // POST   /api/teams/:id/tasks
router.patch("/:id/tasks/:taskId",   requireTeamMember,               updateTeamTask);  // PATCH  /api/teams/:id/tasks/:taskId
router.delete("/:id/tasks/:taskId",  requireTeamMember, requireManager, deleteTeamTask); // DELETE /api/teams/:id/tasks/:taskId
router.get("/:id/my-tasks",          requireTeamMember,               getMyTeamTasks);  // GET    /api/teams/:id/my-tasks

export default router;
