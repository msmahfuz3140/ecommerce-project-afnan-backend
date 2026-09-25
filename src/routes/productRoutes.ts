import { Router } from "express";
import {
  getProducts,
  getProductByIdOrSlug,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController";
import { requireAdmin } from "../middleware/authMiddleware";

const router = Router();

// Public routes
router.get("/", getProducts);
router.get("/:identifier", getProductByIdOrSlug);

// Admin-only routes
router.post("/", requireAdmin, createProduct);
router.put("/:id", requireAdmin, updateProduct);
router.delete("/:id", requireAdmin, deleteProduct);

export default router;
