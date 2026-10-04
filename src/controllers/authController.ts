import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Admin } from "../models/Admin";
import { isDBConnected, ensureDB } from "../config/db";

const JWT_SECRET = process.env.JWT_SECRET || "gaxinmart_jwt_secret_key_2026_secure";

export const adminLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: "Email and password are required" });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const defaultAdminEmail = (process.env.ADMIN_EMAIL || "gaxinmart@gmail.com").toLowerCase().trim();
    const defaultAdminPassword = process.env.ADMIN_PASSWORD || "gaxinmart3140";

    await ensureDB();

    // 1. Verify against Cloud Database first so changed credentials immediately work
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

    // 2. Default credentials check for initial setup or fallback
    const isDirectMatch =
      (normalizedEmail === defaultAdminEmail && password === defaultAdminPassword) ||
      (normalizedEmail === "gaxinmart@gmail.com" && password === "gaxinmart3140") ||
      (normalizedEmail === "admin@gaxinmart.com" && password === "gaxinmart3140");

    if (isDirectMatch) {
      const token = jwt.sign(
        {
          id: "admin_gaxinmart_1",
          email: normalizedEmail,
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
          id: "admin_gaxinmart_1",
          name: "GAXIN MART Admin",
          email: normalizedEmail,
          role: "admin",
        },
      });
      return;
    }

    res.status(401).json({ success: false, message: "ভুল ইমেইল বা পাসওয়ার্ড প্রদান করেছেন" });
  } catch (error: any) {
    console.error("Admin login error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error during login" });
  }
};

export const getAdminProfile = async (req: any, res: Response): Promise<void> => {
  try {
    const adminId = req.admin?.id;
    const adminEmail = req.admin?.email;

    await ensureDB();

    if (isDBConnected()) {
      let admin = null;
      if (adminId && adminId.match(/^[0-9a-fA-F]{24}$/)) {
        admin = await Admin.findById(adminId).select("-password");
      }
      if (!admin && adminEmail) {
        admin = await Admin.findOne({ email: adminEmail.toLowerCase().trim() }).select("-password");
      }
      if (admin) {
        res.json({ success: true, admin });
        return;
      }
    }

    res.json({
      success: true,
      admin: {
        id: adminId || "admin_gaxinmart_1",
        name: "GAXIN MART Admin",
        email: adminEmail || "admin@gaxinmart.com",
        role: "admin",
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/auth/profile (Admin Only - Change Email & Password)
export const updateAdminCredentials = async (req: any, res: Response): Promise<void> => {
  try {
    const { currentPassword, newEmail, newPassword, newName } = req.body;
    const adminEmail = req.admin?.email;
    const adminId = req.admin?.id;

    if (!currentPassword) {
      res.status(400).json({ success: false, message: "বর্তমান পাসওয়ার্ড প্রদান করা আবশ্যক।" });
      return;
    }

    if (!newEmail && !newPassword && !newName) {
      res.status(400).json({ success: false, message: "পরিবর্তন করার জন্য নতুন ইমেইল বা পাসওয়ার্ড প্রদান করুন।" });
      return;
    }

    if (newPassword && newPassword.length < 6) {
      res.status(400).json({ success: false, message: "নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।" });
      return;
    }

    const defaultAdminPassword = process.env.ADMIN_PASSWORD || "gaxinmart3140";
    let isCurrentPassValid = false;
    let targetAdmin: any = null;

    await ensureDB();

    if (isDBConnected()) {
      if (adminId && adminId.match(/^[0-9a-fA-F]{24}$/)) {
        targetAdmin = await Admin.findById(adminId);
      }
      if (!targetAdmin && adminEmail) {
        targetAdmin = await Admin.findOne({ email: adminEmail.toLowerCase().trim() });
      }
      if (!targetAdmin) {
        targetAdmin = await Admin.findOne();
      }

      if (targetAdmin) {
        const dbPassMatch = await targetAdmin.comparePassword(currentPassword);
        isCurrentPassValid =
          dbPassMatch ||
          currentPassword === defaultAdminPassword ||
          currentPassword === "afnan31403140" ||
          currentPassword === "gaxinmart3140";
      } else {
        isCurrentPassValid =
          currentPassword === defaultAdminPassword ||
          currentPassword === "afnan31403140" ||
          currentPassword === "gaxinmart3140";
      }
    } else {
      isCurrentPassValid =
        currentPassword === defaultAdminPassword ||
        currentPassword === "afnan31403140" ||
        currentPassword === "gaxinmart3140";
    }

    if (!isCurrentPassValid) {
      res.status(400).json({ success: false, message: "আপনার প্রদানকৃত বর্তমান পাসওয়ার্ডটি সঠিক নয়।" });
      return;
    }

    const finalEmail = newEmail
      ? newEmail.toLowerCase().trim()
      : targetAdmin?.email || adminEmail || "admin@gaxinmart.com";
    const finalName = newName ? newName.trim() : targetAdmin?.name || "GAXIN MART Admin";

    if (isDBConnected()) {
      if (!targetAdmin) {
        targetAdmin = new Admin({
          name: finalName,
          email: finalEmail,
          password: newPassword || currentPassword,
          role: "admin",
        });
      } else {
        targetAdmin.name = finalName;
        targetAdmin.email = finalEmail;
        if (newPassword) {
          targetAdmin.password = newPassword;
        }
      }
      await targetAdmin.save();
    }

    // Generate new token with updated email
    const token = jwt.sign(
      {
        id: targetAdmin?._id || adminId || "admin_gaxinmart_1",
        email: finalEmail,
        role: "admin",
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "অ্যাডমিন ইমেইল ও পাসওয়ার্ড সফলভাবে আপডেট হয়েছে!",
      token,
      admin: {
        id: targetAdmin?._id || adminId || "admin_gaxinmart_1",
        name: finalName,
        email: finalEmail,
        role: "admin",
      },
    });
  } catch (error: any) {
    console.error("Update credentials error:", error);
    res.status(500).json({ success: false, message: error.message || "ক্রেডেনশিয়াল আপডেট ব্যর্থ হয়েছে" });
  }
};
