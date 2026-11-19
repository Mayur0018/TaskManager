// middleware/teamMiddleware.js
// Reusable middleware to load team and check membership / roles

import Team from "../models/Team.js";

const getId = (entity) => {
    if (!entity) return "";
    return entity._id ? entity._id.toString() : entity.toString();
};

export const getMemberRole = (team, userId) => {
    const uid = getId(userId);
    if (getId(team.owner) === uid) return "owner";
    const member = team.members.find((m) => getId(m.user) === uid);
    return member ? member.role : null;
};

// Attach team and userRole to req — returns 403/404 if not a member
export const requireTeamMember = async (req, res, next) => {
    try {
        const team = await Team.findOne({ _id: req.params.id, isDeleted: false })
            .populate("owner", "name email")
            .populate("members.user", "name email")
            .populate("invitations.invitedBy", "name email");

        if (!team) return res.status(404).json({ message: "Team not found" });

        const role = getMemberRole(team, req.user._id);
        if (!role) return res.status(403).json({ message: "Access denied: you are not a team member" });

        req.team     = team;
        req.teamRole = role;
        next();
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// Require owner or admin
export const requireAdmin = (req, res, next) => {
    if (req.teamRole === "owner" || req.teamRole === "admin") return next();
    return res.status(403).json({ message: "Only team admins can perform this action" });
};

// Require owner only
export const requireOwner = (req, res, next) => {
    if (req.teamRole === "owner") return next();
    return res.status(403).json({ message: "Only the team owner can perform this action" });
};

// Require owner, admin, or manager
export const requireManager = (req, res, next) => {
    const allowed = ["owner", "admin", "manager"];
    if (allowed.includes(req.teamRole)) return next();
    return res.status(403).json({ message: "Only managers and above can perform this action" });
};

