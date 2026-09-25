import mongoose, { Document, Schema } from "mongoose";

export interface IOffer extends Document {
  title: string;
  subtitle: string;
  bannerImage: string;
  discountPercentage: number;
  badge: string;
  link: string;
  active: boolean;
  isNoticeTicker: boolean; // Special scrolling marquee notice
  noticeText?: string;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OfferSchema = new Schema<IOffer>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      default: "",
    },
    bannerImage: {
      type: String,
      default: "",
    },
    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    badge: {
      type: String,
      default: "SPECIAL OFFER",
    },
    link: {
      type: String,
      default: "#",
    },
    active: {
      type: Boolean,
      default: true,
    },
    isNoticeTicker: {
      type: Boolean,
      default: false,
    },
    noticeText: {
      type: String,
      default: "",
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const Offer = mongoose.model<IOffer>("Offer", OfferSchema);
