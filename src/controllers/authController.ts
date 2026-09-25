import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Admin } from "../models/Admin";
import { isDBConnected } from "../config/db";

const JWT_SECRET = process.env.JWT_SECRET || "auramart_secret_key_afnan_3140_ecommerce_secure_key";

export const adminLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: "Email and password are required" });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const defaultAdminEmail = (process.env.ADMIN_EMAIL || "afnan@gmail.com").toLowerCase().trim();
    const defaultAdminPassword = process.env.ADMIN_PASSWORD || "afnan31403140";

    // Immediate credential check for guaranteed reliability
    if (normalizedEmail === defaultAdminEmail && password === defaultAdminPassword) {
      const token = jwt.sign(
        {
          id: "admin_afnan_1",
          email: defaultAdminEmail,
          role: "admin",
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        success: true,
        message: "Admin login successful",
        token,
        admin: {
          id: "admin_afnan_1",
          name: "Afnan Johad",
          email: defaultAdminEmail,
          role: "admin",
        },
      });
      return;
    }

    // If DB is connected, verify against DB
    if (isDBConnected()) {
      const admin = await Admin.findOne({ email: normalizedEmail });
      if (admin && (await admin.comparePassword(password))) {
        const token = jwt.sign(
          {
            id: admin._id,
            email: admin.email,
            role: admin.role,
          },
          JWT_SECRET,
          { expiresIn: "7d" }
        );

        res.json({
          success: true,
          message: "Admin login successful",
          token,
          admin: {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
          },
        });
        return;
      }
    }

    res.status(401).json({ success: false, message: "ভুল ইমেইল বা পাসওয়ার্ড প্রদান করেছেন" });
  } catch (error: any) {
    console.error("Admin login error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error during login" });
  }
};

export const getAdminProfile = async (req: any, res: Response): Promise<void> => {
  try {
    if (req.admin?.email === "afnan@gmail.com") {
      res.json({
        success: true,
        admin: {
          id: req.admin.id,
          name: "Afnan Johad",
          email: req.admin.email,
          role: req.admin.role,
        },
      });
      return;
    }

    if (isDBConnected()) {
      const admin = await Admin.findById(req.admin.id).select("-password");
      if (admin) {
        res.json({ success: true, admin });
        return;
      }
    }

    res.status(404).json({ success: false, message: "Admin not found" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
