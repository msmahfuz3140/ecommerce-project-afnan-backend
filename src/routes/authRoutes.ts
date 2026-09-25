import { Router } from "express";
import { adminLogin, getAdminProfile } from "../controllers/authController";
import { requireAdmin } from "../middleware/authMiddleware";

const router = Router();

router.post("/login", adminLogin);
router.get("/me", requireAdmin, getAdminProfile);

export default router;
