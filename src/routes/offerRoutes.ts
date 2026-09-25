import { Router } from "express";
import {
  getActiveOffers,
  getAllOffers,
  createOffer,
  updateOffer,
  deleteOffer,
} from "../controllers/offerController";
import { requireAdmin } from "../middleware/authMiddleware";

const router = Router();

// Public route for storefront
router.get("/active", getActiveOffers);

// Admin-only routes
router.get("/", requireAdmin, getAllOffers);
router.post("/", requireAdmin, createOffer);
router.put("/:id", requireAdmin, updateOffer);
router.delete("/:id", requireAdmin, deleteOffer);

export default router;
