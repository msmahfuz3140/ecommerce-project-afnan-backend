import { Request, Response } from "express";
import { Offer } from "../models/Offer";
import { mockOffers, OfferRecord } from "../data/mockData";
import { isDBConnected } from "../config/db";
import { uploadStringToCloudinary } from "../config/cloudinary";

// GET /api/offers/active (Public)
export const getActiveOffers = async (req: Request, res: Response): Promise<void> => {
  try {
    if (isDBConnected()) {
      const [banners, notices] = await Promise.all([
        Offer.find({ active: true, isNoticeTicker: false }).sort({ createdAt: -1 }),
        Offer.find({ active: true, isNoticeTicker: true }).sort({ createdAt: -1 }),
      ]);

      if (banners.length > 0 || notices.length > 0) {
        res.json({ success: true, banners, notices });
        return;
      }
    }

    const banners = mockOffers.filter((o) => o.active && !o.isNoticeTicker);
    const notices = mockOffers.filter((o) => o.active && o.isNoticeTicker);
    res.json({ success: true, banners, notices });
  } catch (error: any) {
    const banners = mockOffers.filter((o) => o.active && !o.isNoticeTicker);
    const notices = mockOffers.filter((o) => o.active && o.isNoticeTicker);
    res.json({ success: true, banners, notices });
  }
};

// GET /api/offers (Admin Only)
export const getAllOffers = async (req: Request, res: Response): Promise<void> => {
  try {
    if (isDBConnected()) {
      const offers = await Offer.find().sort({ createdAt: -1 });
      if (offers.length > 0) {
        res.json({ success: true, offers });
        return;
      }
    }

    res.json({ success: true, offers: mockOffers });
  } catch (error: any) {
    res.json({ success: true, offers: mockOffers });
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
    } = req.body;

    if (!title && !noticeText) {
      res.status(400).json({ success: false, message: "Title or notice text is required" });
      return;
    }

    let finalBannerImage = bannerImage || "";
    if (finalBannerImage) {
      finalBannerImage = await uploadStringToCloudinary(finalBannerImage, "gaxinmart/offers");
    }

    if (isDBConnected()) {
      const offer = new Offer({
        title: title || "Special Offer",
        subtitle: subtitle || "",
        bannerImage: finalBannerImage,
        discountPercentage: Number(discountPercentage) || 0,
        badge: badge || "SPECIAL OFFER",
        link: link || "#",
        active: active !== undefined ? Boolean(active) : true,
        isNoticeTicker: Boolean(isNoticeTicker),
        noticeText: noticeText || "",
      });

      await offer.save();
      mockOffers.unshift({ ...offer.toObject(), _id: offer._id.toString() } as any);
      res.status(201).json({ success: true, message: "Offer created successfully in MongoDB", offer });
      return;
    }

    const newOffer: OfferRecord = {
      _id: `offer_${Date.now()}`,
      title: title || "Special Offer",
      subtitle: subtitle || "",
      bannerImage: finalBannerImage,
      discountPercentage: Number(discountPercentage) || 0,
      badge: badge || "SPECIAL OFFER",
      link: link || "#",
      active: active !== undefined ? Boolean(active) : true,
      isNoticeTicker: Boolean(isNoticeTicker),
      noticeText: noticeText || "",
      createdAt: new Date(),
    };
    mockOffers.unshift(newOffer);
    res.status(201).json({ success: true, message: "Offer created successfully (In-Memory)", offer: newOffer });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to create offer" });
  }
};

// PUT /api/offers/:id (Admin Only)
export const updateOffer = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const updates = { ...req.body };

    if (updates.bannerImage) {
      updates.bannerImage = await uploadStringToCloudinary(updates.bannerImage, "gaxinmart/offers");
    }

    let updatedMongoOffer = null;
    if (isDBConnected()) {
      updatedMongoOffer = await Offer.findByIdAndUpdate(id, updates, { new: true });
    }

    const idx = mockOffers.findIndex((o) => o._id === id);
    if (idx !== -1) {
      mockOffers[idx] = { ...mockOffers[idx], ...updates };
    }

    if (!updatedMongoOffer && idx === -1) {
      res.status(404).json({ success: false, message: "Offer not found" });
      return;
    }

    res.json({
      success: true,
      message: "Offer updated successfully",
      offer: updatedMongoOffer || (idx !== -1 ? mockOffers[idx] : null),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to update offer" });
  }
};

// DELETE /api/offers/:id (Admin Only)
export const deleteOffer = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);

    if (isDBConnected()) {
      await Offer.findByIdAndDelete(id);
    }

    const idx = mockOffers.findIndex((o) => o._id === id);
    if (idx !== -1) {
      mockOffers.splice(idx, 1);
    }

    res.json({ success: true, message: "Offer deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to delete offer" });
  }
};
