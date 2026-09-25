import { Router } from "express";
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  trackOrder,
} from "../controllers/orderController";
import { requireAdmin } from "../middleware/authMiddleware";

const router = Router();

// Public routes (Customers)
router.post("/", createOrder);
router.get("/track/:query", trackOrder);

// Admin-only routes
router.get("/", requireAdmin, getOrders);
router.get("/:id", requireAdmin, getOrderById);
router.patch("/:id/status", requireAdmin, updateOrderStatus);

export default router;
