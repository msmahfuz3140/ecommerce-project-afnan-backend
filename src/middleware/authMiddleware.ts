import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Admin } from "../models/Admin";
import { isDBConnected } from "../config/db";

export interface AuthRequest extends Request {
  admin?: {
    id: string;
    email: string;
    role: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || "auramart_secret_key_afnan_3140_ecommerce_secure_key";

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
      return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };

    if (!decoded || !decoded.email) {
      res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
      return;
    }

    // Default admin verified directly
    if (decoded.email === "afnan@gmail.com") {
      req.admin = {
        id: decoded.id || "admin_afnan_1",
        email: decoded.email,
        role: decoded.role || "admin",
      };
      next();
      return;
    }

    // If DB is connected, verify user in DB
    if (isDBConnected()) {
      const admin = await Admin.findById(decoded.id).select("-password");
      if (!admin) {
        res.status(401).json({ success: false, message: "Unauthorized: Admin account not found" });
        return;
      }
      req.admin = {
        id: admin._id.toString(),
        email: admin.email,
        role: admin.role,
      };
      next();
      return;
    }

    req.admin = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Unauthorized: Invalid or expired token" });
  }
};
