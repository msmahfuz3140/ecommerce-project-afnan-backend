import { Router } from "express";
import { adminLogin, getAdminProfile, updateAdminCredentials } from "../controllers/authController";
import { requireAdmin } from "../middleware/authMiddleware";

const router = Router();

router.post("/login", adminLogin);
router.get("/me", requireAdmin, getAdminProfile);
router.put("/profile", requireAdmin, updateAdminCredentials);

export default router;
