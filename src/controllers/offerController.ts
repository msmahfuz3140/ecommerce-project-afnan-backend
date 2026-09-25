import { Request, Response } from "express";
import { Offer } from "../models/Offer";

// GET /api/offers/active (Public - for client storefront)
export const getActiveOffers = async (req: Request, res: Response): Promise<void> => {
  try {
    const [banners, notices] = await Promise.all([
      Offer.find({ active: true, isNoticeTicker: false }).sort({ createdAt: -1 }),
      Offer.find({ active: true, isNoticeTicker: true }).sort({ createdAt: -1 }),
    ]);

    res.json({
      success: true,
      banners,
      notices,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch offers" });
  }
};

// GET /api/offers (Admin Only - all offers)
export const getAllOffers = async (req: Request, res: Response): Promise<void> => {
  try {
    const offers = await Offer.find().sort({ createdAt: -1 });
    res.json({ success: true, offers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch offers" });
  }
};

// POST /api/offers (Admin Only)
export const createOffer = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title,
      subtitle,
      bannerImage,
      discountPercentage,
      badge,
      link,
      active,
      isNoticeTicker,
      noticeText,
      startDate,
      endDate,
    } = req.body;

    if (!title && !noticeText) {
      res.status(400).json({ success: false, message: "Title or notice text is required" });
      return;
    }

    const offer = new Offer({
      title: title || "Special Offer",
      subtitle: subtitle || "",
      bannerImage: bannerImage || "",
      discountPercentage: Number(discountPercentage) || 0,
      badge: badge || "SPECIAL OFFER",
      link: link || "#",
      active: active !== undefined ? Boolean(active) : true,
      isNoticeTicker: Boolean(isNoticeTicker),
      noticeText: noticeText || "",
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    await offer.save();

    res.status(201).json({
      success: true,
      message: "Offer created successfully",
      offer,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to create offer" });
  }
};

// PUT /api/offers/:id (Admin Only)
export const updateOffer = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const offer = await Offer.findByIdAndUpdate(id, req.body, { new: true });

    if (!offer) {
      res.status(404).json({ success: false, message: "Offer not found" });
      return;
    }

    res.json({
      success: true,
      message: "Offer updated successfully",
      offer,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to update offer" });
  }
};

// DELETE /api/offers/:id (Admin Only)
export const deleteOffer = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const offer = await Offer.findByIdAndDelete(id);

    if (!offer) {
      res.status(404).json({ success: false, message: "Offer not found" });
      return;
    }

    res.json({ success: true, message: "Offer deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to delete offer" });
  }
};
