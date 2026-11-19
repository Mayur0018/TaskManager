import Task from "../models/Task.js";
import Team from "../models/Team.js";
import { getMemberRole } from "../middleware/teamMiddleware.js";

const getId = (entity) => {
    if (!entity) return "";
    return entity._id ? entity._id.toString() : entity.toString();
};

// GET /api/analytics/overview
export const getAnalyticsOverview = async (req, res) => {
    try {
        const userId = req.user._id;

        // Find all teams the user belongs to
        const userTeams = await Team.find({
            isDeleted: false,
            $or: [
                { owner: userId },
                { "members.user": userId }
            ]
        }).populate("owner", "name email").populate("members.user", "name email");

        const teamIds = userTeams.map((t) => t._id);

        // All tasks in user's teams or created by user
        const tasks = await Task.find({
            isDeleted: false,
            $or: [
                { team: { $in: teamIds } },
                { user: userId }
            ]
        }).populate("assignedTo", "name email");

        const now = new Date();

        let completedTasks = 0;
        let pendingTasks = 0;
        let inProgressTasks = 0;
        let overdueTasks = 0;

        const priorityDist = { low: 0, medium: 0, high: 0, critical: 0 };
        const memberStatsMap = {};

        // Aggregate unique members across teams
        const uniqueMembers = new Map();
        userTeams.forEach((team) => {
            if (team.owner) uniqueMembers.set(getId(team.owner), team.owner);
            if (team.members) {
                team.members.forEach((m) => {
                    if (m.user) uniqueMembers.set(getId(m.user), m.user);
                });
            }
        });

        uniqueMembers.forEach((user, uid) => {
            memberStatsMap[uid] = {
                user: { id: uid, name: user.name, email: user.email },
                assignedCount: 0,
                completedCount: 0,
                overdueCount: 0,
                inProgressCount: 0
            };
        });

        tasks.forEach((task) => {
            const isCompleted = task.status === "completed" || task.column === "completed";
            const isInProgress = task.column === "inprogress";
            const isOverdue = task.dueDate && new Date(task.dueDate) < now && !isCompleted;

            if (isCompleted) completedTasks++;
            else pendingTasks++;

            if (isInProgress) inProgressTasks++;
            if (isOverdue) overdueTasks++;

            if (task.priority && priorityDist[task.priority] !== undefined) {
                priorityDist[task.priority]++;
            }

            if (task.assignedTo) {
                const aId = getId(task.assignedTo);
                if (!memberStatsMap[aId]) {
                    memberStatsMap[aId] = {
                        user: { id: aId, name: task.assignedTo.name, email: task.assignedTo.email },
                        assignedCount: 0,
                        completedCount: 0,
                        overdueCount: 0,
                        inProgressCount: 0
                    };
                }
                memberStatsMap[aId].assignedCount++;
                if (isCompleted) memberStatsMap[aId].completedCount++;
                if (isInProgress) memberStatsMap[aId].inProgressCount++;
                if (isOverdue) memberStatsMap[aId].overdueCount++;
            }
        });

        const memberProductivity = Object.values(memberStatsMap).map((m) => {
            const rate = m.assignedCount > 0 ? Math.round((m.completedCount / m.assignedCount) * 100) : 0;
            return { ...m, completionRate: rate };
        });

        // Weekly performance (last 7 days)
        const weeklyPerformance = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            d.setHours(0, 0, 0, 0);

            const nextD = new Date(d);
            nextD.setDate(nextD.getDate() + 1);

            const label = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });
            const created = tasks.filter((t) => t.createdAt >= d && t.createdAt < nextD).length;
            const completed = tasks.filter((t) => {
                const isComp = t.status === "completed" || t.column === "completed";
                return isComp && t.updatedAt >= d && t.updatedAt < nextD;
            }).length;

            weeklyPerformance.push({ label, created, completed });
        }

        // Monthly performance (last 6 months)
        const monthlyPerformance = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i, 1);
            d.setHours(0, 0, 0, 0);

            const nextM = new Date(d.getFullYear(), d.getMonth() + 1, 1);
            const label = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });

            const created = tasks.filter((t) => t.createdAt >= d && t.createdAt < nextM).length;
            const completed = tasks.filter((t) => {
                const isComp = t.status === "completed" || t.column === "completed";
                return isComp && t.updatedAt >= d && t.updatedAt < nextM;
            }).length;

            monthlyPerformance.push({ label, created, completed });
        }

        const totalTasks = tasks.length;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        res.json({
            totalTeams: userTeams.length,
            totalMembers: uniqueMembers.size,
            totalTasks,
            completedTasks,
            pendingTasks,
            inProgressTasks,
            overdueTasks,
            completionRate,
            priorityDist,
            memberProductivity,
            weeklyPerformance,
            monthlyPerformance
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/analytics/team/:teamId
export const getTeamAnalytics = async (req, res) => {
    try {
        const team = await Team.findOne({ _id: req.params.teamId, isDeleted: false })
            .populate("owner", "name email")
            .populate("members.user", "name email");

        if (!team) return res.status(404).json({ message: "Team not found" });

        const role = getMemberRole(team, req.user._id);
        if (!role) return res.status(403).json({ message: "Access denied" });

        const tasks = await Task.find({
            team: team._id,
            isDeleted: false
        }).populate("assignedTo", "name email");

        const now = new Date();
        let completedTasks = 0;
        let pendingTasks = 0;
        let inProgressTasks = 0;
        let overdueTasks = 0;
        const priorityDist = { low: 0, medium: 0, high: 0, critical: 0 };

        const memberMap = {};
        if (team.owner) {
            memberMap[getId(team.owner)] = {
                user: team.owner,
                assignedCount: 0,
                completedCount: 0,
                overdueCount: 0
            };
        }
        team.members.forEach((m) => {
            if (m.user) {
                memberMap[getId(m.user)] = {
                    user: m.user,
                    role: m.role,
                    assignedCount: 0,
                    completedCount: 0,
                    overdueCount: 0
                };
            }
        });

        tasks.forEach((t) => {
            const isCompleted = t.status === "completed" || t.column === "completed";
            const isInProgress = t.column === "inprogress";
            const isOverdue = t.dueDate && new Date(t.dueDate) < now && !isCompleted;

            if (isCompleted) completedTasks++;
            else pendingTasks++;

            if (isInProgress) inProgressTasks++;
            if (isOverdue) overdueTasks++;

            if (t.priority && priorityDist[t.priority] !== undefined) {
                priorityDist[t.priority]++;
            }

            if (t.assignedTo) {
                const aId = getId(t.assignedTo);
                if (memberMap[aId]) {
                    memberMap[aId].assignedCount++;
                    if (isCompleted) memberMap[aId].completedCount++;
                    if (isOverdue) memberMap[aId].overdueCount++;
                }
            }
        });

        const memberProductivity = Object.values(memberMap).map((m) => {
            const rate = m.assignedCount > 0 ? Math.round((m.completedCount / m.assignedCount) * 100) : 0;
            return { ...m, completionRate: rate };
        });

        const totalTasks = tasks.length;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        res.json({
            team: { _id: team._id, name: team.name, avatar: team.avatar, color: team.color },
            totalTasks,
            completedTasks,
            pendingTasks,
            inProgressTasks,
            overdueTasks,
            completionRate,
            priorityDist,
            memberProductivity
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

