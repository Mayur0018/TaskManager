import crypto from "crypto";
import Team    from "../models/Team.js";
import Task    from "../models/Task.js";
import User    from "../models/User.js";
import Activity from "../models/Activity.js";
import { createNotification } from "../utils/notificationHelper.js";
import { getMemberRole }      from "../middleware/teamMiddleware.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getId = (entity) => {
    if (!entity) return "";
    return entity._id ? entity._id.toString() : entity.toString();
};

const canManageTeam  = (team, userId) => ["owner","admin"].includes(getMemberRole(team, userId));
const canManageTasks = (team, userId) => ["owner","admin","manager"].includes(getMemberRole(team, userId));

const logActivity = async (userId, action, taskId = null, teamId = null, details = {}) => {
    try { await Activity.create({ user: userId, action, task: taskId, team: teamId, details }); }
    catch (err) { console.error("Activity log failed:", err.message); }
};

// ═══════════════════════════════════════════════════════════════════════════
// TEAM CRUD
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/teams  — Get all teams where I am owner or member
export const getMyTeams = async (req, res) => {
    try {
        const { search } = req.query;

        const filter = {
            isDeleted: false,
            $or: [
                { owner: req.user._id },
                { "members.user": req.user._id }
            ]
        };

        if (search?.trim()) {
            filter.$and = [
                { $or: filter.$or },
                { $or: [
                    { name:        { $regex: search.trim(), $options: "i" } },
                    { description: { $regex: search.trim(), $options: "i" } }
                ]}
            ];
            delete filter.$or;
        }

        const teams = await Team.find(filter)
            .populate("owner", "name email")
            .populate("members.user", "name email")
            .sort({ createdAt: -1 });

        // Attach task counts
        const teamIds = teams.map((t) => t._id);
        const taskCounts = await Task.aggregate([
            { $match: { team: { $in: teamIds }, isDeleted: false } },
            { $group: { _id: "$team", count: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ["$status","completed"] }, 1, 0] } } } }
        ]);
        const countMap = {};
        taskCounts.forEach((tc) => { countMap[tc._id.toString()] = tc; });

        const result = teams.map((t) => {
            const tc = countMap[t._id.toString()] || { count: 0, completed: 0 };
            return {
                ...t.toObject(),
                taskCount:      tc.count,
                completedCount: tc.completed,
                memberCount:    t.members.length + 1 // +1 for owner
            };
        });

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/teams/:id  — Get single team details (via teamMiddleware)
export const getTeamById = async (req, res) => {
    try {
        const team = req.team;

        const taskStats = await Task.aggregate([
            { $match: { team: team._id, isDeleted: false } },
            { $group: {
                _id: null,
                total:      { $sum: 1 },
                completed:  { $sum: { $cond: [{ $eq: ["$status","completed"] }, 1, 0] } },
                pending:    { $sum: { $cond: [{ $eq: ["$status","pending"] }, 1, 0] } },
                overdue:    { $sum: { $cond: [{ $and: [
                    { $lt: ["$dueDate", new Date()] },
                    { $ne: ["$status","completed"] },
                    { $ne: ["$dueDate", null] }
                ]}, 1, 0] } }
            }}
        ]);

        const stats = taskStats[0] || { total:0, completed:0, pending:0, overdue:0 };

        res.json({
            ...team.toObject(),
            myRole:      req.teamRole,
            memberCount: team.members.length + 1,
            taskStats:   stats
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// POST /api/teams  — Create team
export const createTeam = async (req, res) => {
    try {
        const { name, description, avatar, color, privacy } = req.body;
        if (!name?.trim()) return res.status(400).json({ message: "Team name is required" });

        const team = await Team.create({
            name:        name.trim(),
            description: description?.trim() || "",
            avatar:      avatar  || "👥",
            color:       color   || "#3B82F6",
            privacy:     ["public","private"].includes(privacy) ? privacy : "private",
            owner:       req.user._id,
            members:     [],
            invitations: []
        });

        await team.populate("owner", "name email");
        await logActivity(req.user._id, "TEAM_CREATED", null, team._id, { name: team.name });

        res.status(201).json({ ...team.toObject(), myRole: "owner", memberCount: 1, taskCount: 0 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// PUT /api/teams/:id  — Update team (admin/owner via teamMiddleware)
export const updateTeam = async (req, res) => {
    try {
        const team = req.team;
        const { name, description, avatar, color, privacy } = req.body;

        if (name?.trim())                                      team.name        = name.trim();
        if (description !== undefined)                         team.description = description?.trim() || "";
        if (avatar)                                            team.avatar      = avatar;
        if (color)                                             team.color       = color;
        if (["public","private"].includes(privacy))            team.privacy     = privacy;

        await team.save();
        await logActivity(req.user._id, "TEAM_UPDATED", null, team._id, { name: team.name });

        res.json({ ...team.toObject(), myRole: req.teamRole });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// DELETE /api/teams/:id  — Delete team (owner only)
export const deleteTeam = async (req, res) => {
    try {
        const team = req.team;

        // Soft delete team and all its tasks
        team.isDeleted = true;
        await team.save();
        await Task.updateMany({ team: team._id }, { $set: { isDeleted: true } });

        await logActivity(req.user._id, "TEAM_DELETED", null, team._id, { name: team.name });

        res.json({ message: "Team deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// INVITATION SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/teams/:id/invite  — Invite by email (admin/owner)
export const inviteMember = async (req, res) => {
    try {
        const team  = req.team;
        const { email, role = "member" } = req.body;

        if (!email?.trim()) return res.status(400).json({ message: "Email is required" });

        const normalizedEmail = email.trim().toLowerCase();
        const validRoles = ["admin","manager","member"];
        if (!validRoles.includes(role)) return res.status(400).json({ message: "Invalid role" });

        // Cannot invite the owner
        if (getId(team.owner) && normalizedEmail === (await User.findById(team.owner).select("email"))?.email) {
            return res.status(400).json({ message: "Cannot invite the team owner" });
        }

        // Check if already a member
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            const alreadyMember =
                getId(team.owner) === getId(existingUser._id) ||
                team.members.some((m) => getId(m.user) === getId(existingUser._id));
            if (alreadyMember) return res.status(400).json({ message: "User is already a team member" });
        }

        // Check if pending invitation exists
        const existingInvite = team.invitations.find(
            (inv) => inv.email === normalizedEmail && inv.status === "pending"
        );
        if (existingInvite) return res.status(400).json({ message: "Invitation already sent to this email" });

        // Create invitation token
        const token = crypto.randomBytes(32).toString("hex");

        team.invitations.push({
            email:     normalizedEmail,
            role,
            token,
            status:    "pending",
            invitedBy: req.user._id,
            sentAt:    new Date()
        });

        await team.save();
        await logActivity(req.user._id, "MEMBER_INVITED", null, team._id, { email: normalizedEmail, role });

        // Notify user if they already have an account
        if (existingUser) {
            await createNotification({
                recipientId: existingUser._id,
                senderId:    req.user._id,
                type:        "TEAM_INVITATION",
                message:     `${req.user.name} invited you to join team "${team.name}" as ${role}`,
                teamId:      team._id,
                meta:        { token, teamId: team._id, role }
            });
        }

        await team.populate("invitations.invitedBy", "name email");

        res.status(201).json({
            message:    `Invitation sent to ${normalizedEmail}`,
            invitation: team.invitations[team.invitations.length - 1],
            // In a real app, you'd email this token; for now we return it
            token
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/teams/:id/invitations  — Get all invitations (admin/owner)
export const getInvitations = async (req, res) => {
    try {
        const team = req.team;
        await team.populate("invitations.invitedBy", "name email");

        const { status } = req.query;
        let invitations = team.invitations;
        if (status) invitations = invitations.filter((inv) => inv.status === status);

        res.json(invitations.sort((a,b) => new Date(b.sentAt) - new Date(a.sentAt)));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// POST /api/teams/accept-invite  — Accept invitation using token
export const acceptInvitation = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ message: "Invitation token is required" });

        const team = await Team.findOne({
            isDeleted: false,
            "invitations.token": token,
            "invitations.status": "pending"
        }).populate("owner", "name email").populate("members.user", "name email");

        if (!team) return res.status(404).json({ message: "Invalid or expired invitation" });

        const invitation = team.invitations.find((inv) => inv.token === token && inv.status === "pending");
        if (!invitation) return res.status(404).json({ message: "Invitation not found" });

        // Ensure the logged-in user's email matches
        if (req.user.email !== invitation.email) {
            return res.status(403).json({ message: "This invitation was sent to a different email address" });
        }

        // Check already a member
        const alreadyMember =
            getId(team.owner) === getId(req.user._id) ||
            team.members.some((m) => getId(m.user) === getId(req.user._id));
        if (alreadyMember) {
            invitation.status = "accepted";
            await team.save();
            return res.status(400).json({ message: "You are already a member of this team" });
        }

        // Add to members
        team.members.push({ user: req.user._id, role: invitation.role, joinedAt: new Date() });
        invitation.status      = "accepted";
        invitation.respondedAt = new Date();
        await team.save();

        await logActivity(req.user._id, "INVITATION_ACCEPTED", null, team._id, { teamName: team.name });

        // Notify the inviter
        await createNotification({
            recipientId: invitation.invitedBy,
            senderId:    req.user._id,
            type:        "INVITATION_ACCEPTED",
            message:     `${req.user.name} accepted your invitation to join "${team.name}"`,
            teamId:      team._id
        });

        res.json({ message: `You have joined "${team.name}"`, team: { _id: team._id, name: team.name } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// POST /api/teams/reject-invite  — Reject invitation using token
export const rejectInvitation = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ message: "Invitation token is required" });

        const team = await Team.findOne({
            isDeleted: false,
            "invitations.token": token,
            "invitations.status": "pending"
        });

        if (!team) return res.status(404).json({ message: "Invalid or expired invitation" });

        const invitation = team.invitations.find((inv) => inv.token === token && inv.status === "pending");
        if (!invitation) return res.status(404).json({ message: "Invitation not found" });

        if (req.user.email !== invitation.email) {
            return res.status(403).json({ message: "This invitation was sent to a different email address" });
        }

        invitation.status      = "rejected";
        invitation.respondedAt = new Date();
        await team.save();

        await logActivity(req.user._id, "INVITATION_REJECTED", null, team._id, { teamName: team.name });

        res.json({ message: "Invitation rejected" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// PATCH /api/teams/:id/invitations/:invId/resend  — Resend invitation (admin/owner)
export const resendInvitation = async (req, res) => {
    try {
        const team       = req.team;
        const invitation = team.invitations.id(req.params.invId);

        if (!invitation) return res.status(404).json({ message: "Invitation not found" });
        if (invitation.status !== "pending" && invitation.status !== "rejected") {
            return res.status(400).json({ message: "Can only resend pending or rejected invitations" });
        }

        // Generate new token and reset
        invitation.token       = crypto.randomBytes(32).toString("hex");
        invitation.status      = "pending";
        invitation.sentAt      = new Date();
        invitation.respondedAt = null;

        await team.save();
        await logActivity(req.user._id, "INVITATION_RESENT", null, team._id, { email: invitation.email });

        // Notify user if they have an account
        const existingUser = await User.findOne({ email: invitation.email });
        if (existingUser) {
            await createNotification({
                recipientId: existingUser._id,
                senderId:    req.user._id,
                type:        "TEAM_INVITATION",
                message:     `${req.user.name} re-invited you to join team "${team.name}"`,
                teamId:      team._id,
                meta:        { token: invitation.token }
            });
        }

        res.json({ message: "Invitation resent", token: invitation.token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// DELETE /api/teams/:id/invitations/:invId  — Cancel invitation (admin/owner)
export const cancelInvitation = async (req, res) => {
    try {
        const team       = req.team;
        const invitation = team.invitations.id(req.params.invId);

        if (!invitation) return res.status(404).json({ message: "Invitation not found" });
        if (invitation.status !== "pending") return res.status(400).json({ message: "Can only cancel pending invitations" });

        invitation.status      = "cancelled";
        invitation.respondedAt = new Date();
        await team.save();

        await logActivity(req.user._id, "INVITATION_CANCELLED", null, team._id, { email: invitation.email });

        res.json({ message: "Invitation cancelled" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/teams/my-invitations  — Get all pending invitations for logged-in user
export const getMyInvitations = async (req, res) => {
    try {
        const teams = await Team.find({
            isDeleted: false,
            "invitations.email":  req.user.email,
            "invitations.status": "pending"
        })
            .populate("owner", "name email")
            .populate("invitations.invitedBy", "name email");

        const invitations = [];
        teams.forEach((team) => {
            team.invitations
                .filter((inv) => inv.email === req.user.email && inv.status === "pending")
                .forEach((inv) => {
                    invitations.push({
                        ...inv.toObject(),
                        team: { _id: team._id, name: team.name, avatar: team.avatar, color: team.color, description: team.description }
                    });
                });
        });

        res.json(invitations);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// MEMBER MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/teams/:id/members  — Add member directly by email (admin/owner)
export const addMember = async (req, res) => {
    try {
        const team  = req.team;
        const { email, role = "member" } = req.body;
        if (!email?.trim()) return res.status(400).json({ message: "Email is required" });

        const user = await User.findOne({ email: email.trim().toLowerCase() });
        if (!user) return res.status(404).json({ message: "No user found with this email" });

        const alreadyMember =
            getId(team.owner) === getId(user._id) ||
            team.members.some((m) => getId(m.user) === getId(user._id));
        if (alreadyMember) return res.status(400).json({ message: "User is already a team member" });

        const validRoles = ["admin","manager","member"];
        const memberRole = validRoles.includes(role) ? role : "member";

        team.members.push({ user: user._id, role: memberRole, joinedAt: new Date() });
        await team.save();
        await team.populate("members.user", "name email");

        await logActivity(req.user._id, "MEMBER_ADDED", null, team._id, { name: user.name, role: memberRole });

        await createNotification({
            recipientId: user._id,
            senderId:    req.user._id,
            type:        "TEAM_INVITATION",
            message:     `${req.user.name} added you to team "${team.name}" as ${memberRole}`,
            teamId:      team._id
        });

        res.status(201).json(team.members[team.members.length - 1]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// PATCH /api/teams/:id/members/:memberId/role  — Change role (admin/owner)
export const updateMemberRole = async (req, res) => {
    try {
        const team   = req.team;
        const { role } = req.body;
        const validRoles = ["admin","manager","member"];
        if (!validRoles.includes(role)) return res.status(400).json({ message: "Invalid role" });

        // Find member
        const memberEntry = team.members.id(req.params.memberId);
        if (!memberEntry) return res.status(404).json({ message: "Member not found" });

        // Cannot change owner role via this endpoint
        if (getId(memberEntry.user) === getId(team.owner)) {
            return res.status(400).json({ message: "Cannot change the owner's role" });
        }

        // Admin cannot promote to admin if not owner
        if (role === "admin" && req.teamRole !== "owner") {
            return res.status(403).json({ message: "Only the owner can assign admin role" });
        }

        const oldRole        = memberEntry.role;
        memberEntry.role     = role;
        await team.save();

        await logActivity(req.user._id, "ROLE_CHANGED", null, team._id, {
            userId: memberEntry.user, oldRole, newRole: role
        });

        await createNotification({
            recipientId: memberEntry.user,
            senderId:    req.user._id,
            type:        "ROLE_CHANGED",
            message:     `Your role in "${team.name}" has been changed from ${oldRole} to ${role}`,
            teamId:      team._id
        });

        res.json({ message: "Role updated", member: memberEntry });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// DELETE /api/teams/:id/members/:memberId  — Remove member (admin/owner)
export const removeMember = async (req, res) => {
    try {
        const team = req.team;

        const memberEntry = team.members.id(req.params.memberId);
        if (!memberEntry) return res.status(404).json({ message: "Member not found" });

        // Cannot remove the owner
        if (getId(memberEntry.user) === getId(team.owner)) {
            return res.status(400).json({ message: "Cannot remove the team owner" });
        }

        const removedUserId = getId(memberEntry.user);
        team.members.pull({ _id: req.params.memberId });
        await team.save();

        await logActivity(req.user._id, "MEMBER_REMOVED", null, team._id, { userId: removedUserId });

        await createNotification({
            recipientId: removedUserId,
            senderId:    req.user._id,
            type:        "MEMBER_REMOVED",
            message:     `You have been removed from team "${team.name}"`,
            teamId:      team._id
        });

        res.json({ message: "Member removed" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// DELETE /api/teams/:id/leave  — Leave team (any member except sole owner)
export const leaveTeam = async (req, res) => {
    try {
        const team = req.team;

        if (req.teamRole === "owner") {
            return res.status(400).json({ message: "Team owner cannot leave. Transfer ownership or delete the team." });
        }

        team.members.pull({ user: req.user._id });
        await team.save();

        await logActivity(req.user._id, "MEMBER_LEFT", null, team._id, { name: req.user.name });

        // Notify owner
        await createNotification({
            recipientId: team.owner,
            senderId:    req.user._id,
            type:        "MEMBER_LEFT",
            message:     `${req.user.name} left team "${team.name}"`,
            teamId:      team._id
        });

        res.json({ message: `You left "${team.name}"` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// PATCH /api/teams/:id/transfer-ownership  — Transfer ownership (owner only)
export const transferOwnership = async (req, res) => {
    try {
        const team   = req.team;
        const { newOwnerId } = req.body;
        if (!newOwnerId) return res.status(400).json({ message: "New owner ID is required" });

        const memberEntry = team.members.find((m) => getId(m.user) === newOwnerId);
        if (!memberEntry) return res.status(404).json({ message: "New owner must be an existing team member" });

        // Move current owner to members as admin
        team.members.push({ user: team.owner, role: "admin", joinedAt: new Date() });

        // Remove new owner from members list
        team.members.pull({ _id: memberEntry._id });

        // Set new owner
        team.owner = newOwnerId;
        await team.save();

        await logActivity(req.user._id, "ROLE_CHANGED", null, team._id, {
            action: "OWNERSHIP_TRANSFERRED", newOwner: newOwnerId
        });

        res.json({ message: "Ownership transferred successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// TEAM ACTIVITY
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/teams/:id/activity  — Paginated activity feed
export const getTeamActivity = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const [activities, total] = await Promise.all([
            Activity.find({ team: req.team._id })
                .populate("user", "name email")
                .populate("task", "title")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            Activity.countDocuments({ team: req.team._id })
        ]);

        res.json({ activities, total, page: Number(page), limit: Number(limit) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// TEAM TASK MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/teams/:id/tasks  — Get all tasks for a team
export const getTeamTasks = async (req, res) => {
    try {
        const { status, priority, column, assignedTo, search, sortBy } = req.query;

        const filter = { team: req.team._id, isDeleted: false };

        const VALID_COLUMNS    = ["todo","inprogress","inreview","completed"];
        const VALID_PRIORITIES = ["low","medium","high","critical"];
        const VALID_STATUSES   = ["pending","completed"];

        if (status    && VALID_STATUSES.includes(status))     filter.status    = status;
        if (priority  && VALID_PRIORITIES.includes(priority)) filter.priority  = priority;
        if (column    && VALID_COLUMNS.includes(column))      filter.column    = column;
        if (assignedTo === "unassigned")                       filter.assignedTo = null;
        else if (assignedTo && assignedTo !== "all")           filter.assignedTo = assignedTo;

        if (search?.trim()) {
            filter.$or = [
                { title:       { $regex: search.trim(), $options: "i" } },
                { description: { $regex: search.trim(), $options: "i" } }
            ];
        }

        let sort = { createdAt: -1 };
        if (sortBy === "priority")  sort = { priority: 1, createdAt: -1 };
        if (sortBy === "dueDate")   sort = { dueDate: 1 };
        if (sortBy === "title")     sort = { title: 1 };

        const tasks = await Task.find(filter)
            .sort(sort)
            .populate("assignedTo", "name email")
            .populate("user", "name email");

        res.json(tasks);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// POST /api/teams/:id/tasks  — Create team task (manager+)
export const createTeamTask = async (req, res) => {
    try {
        const team = req.team;
        const {
            title, description, priority, column, dueDate, startDate,
            assignedTo, category, tags, subtasks
        } = req.body;

        if (!title?.trim()) return res.status(400).json({ message: "Task title is required" });

        const VALID_COLUMNS    = ["todo","inprogress","inreview","completed"];
        const VALID_PRIORITIES = ["low","medium","high","critical"];

        const taskPriority = VALID_PRIORITIES.includes(priority) ? priority : "medium";
        const taskColumn   = VALID_COLUMNS.includes(column) ? column : "todo";

        // Validate assignee is a team member
        if (assignedTo) {
            const isTeamMember =
                getId(team.owner) === assignedTo ||
                team.members.some((m) => getId(m.user) === assignedTo);
            if (!isTeamMember) return res.status(400).json({ message: "Assigned user must be a team member" });
        }

        const cleanSubtasks = Array.isArray(subtasks)
            ? subtasks.filter((s) => s.title?.trim()).map((s) => ({ title: s.title.trim(), isCompleted: false }))
            : [];

        const cleanTags = Array.isArray(tags)
            ? tags.map((t) => String(t).trim()).filter(Boolean)
            : typeof tags === "string" ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [];

        const task = await Task.create({
            title:       title.trim(),
            description: description || "",
            priority:    taskPriority,
            column:      taskColumn,
            status:      taskColumn === "completed" ? "completed" : "pending",
            startDate:   startDate ? new Date(startDate) : null,
            dueDate:     dueDate   ? new Date(dueDate)   : null,
            category:    category?.trim() || "General",
            tags:        cleanTags,
            subtasks:    cleanSubtasks,
            assignedTo:  assignedTo || null,
            team:        team._id,
            user:        req.user._id
        });

        await task.populate("assignedTo", "name email");
        await task.populate("user", "name email");

        await logActivity(req.user._id, "TASK_CREATED", task._id, team._id, { title: task.title });

        if (assignedTo && assignedTo !== getId(req.user._id)) {
            await createNotification({
                recipientId: assignedTo,
                senderId:    req.user._id,
                type:        "TASK_ASSIGNED",
                message:     `${req.user.name} assigned you "${task.title}" in team "${team.name}"`,
                taskId:      task._id,
                teamId:      team._id
            });
        }

        res.status(201).json(task);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// PATCH /api/teams/:id/tasks/:taskId  — Update team task
export const updateTeamTask = async (req, res) => {
    try {
        const team = req.team;
        const task = await Task.findOne({ _id: req.params.taskId, team: team._id, isDeleted: false });
        if (!task) return res.status(404).json({ message: "Task not found in this team" });

        const VALID_COLUMNS    = ["todo","inprogress","inreview","completed"];
        const VALID_PRIORITIES = ["low","medium","high","critical"];

        const isAssignee = getId(task.assignedTo) === getId(req.user._id);
        const canManage  = canManageTasks(team, req.user._id);

        if (!canManage && !isAssignee) {
            return res.status(403).json({ message: "Access denied" });
        }

        const { title, description, priority, column, dueDate, startDate, assignedTo, category, tags, subtasks } = req.body;

        if (canManage) {
            if (title?.trim())                                           task.title       = title.trim();
            if (description !== undefined)                               task.description = description;
            if (priority && VALID_PRIORITIES.includes(priority))        task.priority    = priority;
            if (dueDate !== undefined)                                   task.dueDate     = dueDate ? new Date(dueDate) : null;
            if (startDate !== undefined)                                 task.startDate   = startDate ? new Date(startDate) : null;
            if (category?.trim())                                        task.category    = category.trim();
            if (Array.isArray(tags))                                     task.tags        = tags;
            if (Array.isArray(subtasks))                                 task.subtasks    = subtasks;

            if (assignedTo !== undefined) {
                if (assignedTo) {
                    const isTeamMember =
                        getId(team.owner) === assignedTo ||
                        team.members.some((m) => getId(m.user) === assignedTo);
                    if (!isTeamMember) return res.status(400).json({ message: "Assignee must be a team member" });

                    const prevAssignee = task.assignedTo ? getId(task.assignedTo) : null;
                    if (assignedTo !== prevAssignee) {
                        task.assignedTo = assignedTo;
                        await createNotification({
                            recipientId: assignedTo,
                            senderId:    req.user._id,
                            type:        "TASK_ASSIGNED",
                            message:     `${req.user.name} assigned you "${task.title}" in team "${team.name}"`,
                            taskId:      task._id, teamId: team._id
                        });
                    }
                } else {
                    task.assignedTo = null;
                }
            }
        }

        // Members can update column/status of their assigned tasks
        if (column && VALID_COLUMNS.includes(column)) {
            task.column = column;
            task.status = column === "completed" ? "completed" : "pending";
        }

        await task.save();
        await task.populate("assignedTo", "name email");
        await task.populate("user", "name email");

        await logActivity(req.user._id, "TASK_UPDATED", task._id, team._id, { title: task.title });

        res.json(task);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// DELETE /api/teams/:id/tasks/:taskId  — Delete team task (manager+)
export const deleteTeamTask = async (req, res) => {
    try {
        const team = req.team;
        const task = await Task.findOne({ _id: req.params.taskId, team: team._id, isDeleted: false });
        if (!task) return res.status(404).json({ message: "Task not found in this team" });

        task.isDeleted = true;
        await task.save();

        await logActivity(req.user._id, "TASK_DELETED", task._id, team._id, { title: task.title });

        res.json({ message: "Task deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/teams/:id/my-tasks  — My tasks in a specific team
export const getMyTeamTasks = async (req, res) => {
    try {
        const tasks = await Task.find({
            team:       req.team._id,
            assignedTo: req.user._id,
            isDeleted:  false
        })
            .populate("assignedTo", "name email")
            .populate("user", "name email")
            .sort({ dueDate: 1, createdAt: -1 });

        res.json(tasks);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/teams/user/my-tasks  — All my tasks across all teams
export const getAllMyTeamTasks = async (req, res) => {
    try {
        const teams = await Team.find({
            isDeleted: false,
            $or: [{ owner: req.user._id }, { "members.user": req.user._id }]
        }).select("_id");

        const teamIds = teams.map((t) => t._id);

        const tasks = await Task.find({
            team:       { $in: teamIds },
            assignedTo: req.user._id,
            isDeleted:  false
        })
            .populate("team",       "name avatar color")
            .populate("assignedTo", "name email")
            .populate("user",       "name email")
            .sort({ dueDate: 1, createdAt: -1 });

        res.json(tasks);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};
