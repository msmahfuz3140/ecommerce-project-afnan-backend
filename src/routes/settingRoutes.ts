import { Router } from "express";
import { getDeliverySettings, updateDeliverySettings } from "../controllers/settingController";
import { requireAdmin } from "../middleware/authMiddleware";

const router = Router();

// Public: Fetch delivery settings for checkout / modal
router.get("/delivery", getDeliverySettings);

// Admin: Update delivery settings from admin settings panel
router.put("/delivery", requireAdmin, updateDeliverySettings);

export default router;
