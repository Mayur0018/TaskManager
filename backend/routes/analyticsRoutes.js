import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
    getAnalyticsOverview,
    getTeamAnalytics
} from "../controllers/analyticsController.js";

const router = express.Router();

router.use(protect);

router.get("/overview", getAnalyticsOverview);
router.get("/team/:teamId", getTeamAnalytics);

export default router;

