import { Router } from "express";
import { uploadMedia, uploadMultipleMedia } from "../controllers/uploadController";
import { upload } from "../middleware/uploadMiddleware";
import { requireAdmin } from "../middleware/authMiddleware";

const router = Router();

// Upload single media file (Admin only)
router.post("/single", requireAdmin, upload.single("file"), uploadMedia);

// Upload multiple media files (Admin only)
router.post("/multiple", requireAdmin, upload.array("files", 10), uploadMultipleMedia);

export default router;
