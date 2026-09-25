import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Admin } from "../models/Admin";

const JWT_SECRET = process.env.JWT_SECRET || "auramart_secret_key_afnan_3140_ecommerce_secure_key";

export const adminLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: "Email and password are required" });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if admin exists
    let admin = await Admin.findOne({ email: normalizedEmail });

    // Auto-seed required admin if not present yet
    const defaultAdminEmail = (process.env.ADMIN_EMAIL || "afnan@gmail.com").toLowerCase().trim();
    const defaultAdminPassword = process.env.ADMIN_PASSWORD || "afnan31403140";

    if (!admin && normalizedEmail === defaultAdminEmail && password === defaultAdminPassword) {
      admin = new Admin({
        name: "Afnan Johad",
        email: defaultAdminEmail,
        password: defaultAdminPassword,
        role: "admin",
      });
      await admin.save();
    }

    if (!admin) {
      res.status(401).json({ success: false, message: "Invalid email or password" });
      return;
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: "Invalid email or password" });
      return;
    }

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
  } catch (error: any) {
    console.error("Admin login error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error during login" });
  }
};

export const getAdminProfile = async (req: any, res: Response): Promise<void> => {
  try {
    const admin = await Admin.findById(req.admin.id).select("-password");
    if (!admin) {
      res.status(404).json({ success: false, message: "Admin not found" });
      return;
    }
    res.json({ success: true, admin });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
