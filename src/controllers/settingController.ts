import { Request, Response } from "express";
import { Setting } from "../models/Setting";
import { isDBConnected, ensureDB } from "../config/db";

// In-memory fallback
let memoryDeliverySettings = {
  dhaka: 70,
  nearDhaka: 100,
  outsideDhaka: 130,
};

// GET /api/settings/delivery (Public)
export const getDeliverySettings = async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureDB();

    if (isDBConnected()) {
      let setting = await Setting.findOne({ key: "general_settings" });
      if (!setting) {
        setting = await Setting.create({
          key: "general_settings",
          deliverySettings: memoryDeliverySettings,
        });
      }

      if (setting && setting.deliverySettings) {
        res.json({
          success: true,
          deliverySettings: {
            dhaka: Number(setting.deliverySettings.dhaka) || 70,
            nearDhaka: Number(setting.deliverySettings.nearDhaka) || 100,
            outsideDhaka: Number(setting.deliverySettings.outsideDhaka) || 130,
          },
        });
        return;
      }
    }

    res.json({
      success: true,
      deliverySettings: memoryDeliverySettings,
    });
  } catch (error: any) {
    console.error("Error fetching delivery settings:", error);
    res.json({
      success: true,
      deliverySettings: memoryDeliverySettings,
    });
  }
};

// PUT /api/settings/delivery (Admin Only)
export const updateDeliverySettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dhaka, nearDhaka, outsideDhaka } = req.body;

    const parsedDhaka = Math.max(0, Number(dhaka) || 0);
    const parsedNearDhaka = Math.max(0, Number(nearDhaka) || 0);
    const parsedOutsideDhaka = Math.max(0, Number(outsideDhaka) || 0);

    memoryDeliverySettings = {
      dhaka: parsedDhaka,
      nearDhaka: parsedNearDhaka,
      outsideDhaka: parsedOutsideDhaka,
    };

    await ensureDB();

    if (isDBConnected()) {
      const updated = await Setting.findOneAndUpdate(
        { key: "general_settings" },
        {
          $set: {
            deliverySettings: memoryDeliverySettings,
          },
        },
        { upsert: true, new: true }
      );

      res.json({
        success: true,
        message: "ডেলিভারি চার্জ সফলভাবে আপডেট করা হয়েছে",
        deliverySettings: updated.deliverySettings,
      });
      return;
    }

    res.json({
      success: true,
      message: "ডেলিভারি চার্জ সফলভাবে আপডেট করা হয়েছে",
      deliverySettings: memoryDeliverySettings,
    });
  } catch (error: any) {
    console.error("Error updating delivery settings:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update delivery settings",
    });
  }
};
