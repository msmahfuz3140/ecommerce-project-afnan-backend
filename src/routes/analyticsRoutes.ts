import { Router } from "express";
import { getProfitLossAnalytics } from "../controllers/analyticsController";
import { requireAdmin } from "../middleware/authMiddleware";

const router = Router();

// Admin-only route for Profit & Loss analytics
router.get("/profit-loss", requireAdmin, getProfitLossAnalytics);

export default router;
