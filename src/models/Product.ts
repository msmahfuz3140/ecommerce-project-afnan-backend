import mongoose, { Document, Schema } from "mongoose";

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  category: any;
  subCategory?: string;
  buyPrice: number; // Cost / Purchase price (koto diye kena)
  sellPrice: number; // Selling price (koto diye bikri)
  originalPrice: number; // Crossed out original price for discounts
  basePrice?: number;
  costPrice?: number;
  oldPrice?: number;
  stock: number;
  inStock: boolean;
  images: string[]; // Cloudinary URLs
  mainImage?: string;
  galleryImages?: string[];
  isOffer: boolean; // Is part of promotional deal
  isHotDeal?: boolean;
  offerBadge?: string; // e.g. "20% OFF", "Flash Sale", "Hot Deal"
  offerEndTime?: Date; // Expiry timestamp for the offer
  isFeatured: boolean;
  isActive?: boolean;
  specifications: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: Schema.Types.Mixed,
      required: true,
      index: true,
    },
    subCategory: {
      type: String,
      default: "",
    },
    buyPrice: {
      type: Number,
      default: 0,
    },
    costPrice: {
      type: Number,
      default: 0,
    },
    sellPrice: {
      type: Number,
      default: 0,
    },
    basePrice: {
      type: Number,
      default: 0,
    },
    originalPrice: {
      type: Number,
      default: 0,
    },
    oldPrice: {
      type: Number,
      default: 0,
    },
    stock: {
      type: Number,
      default: 50,
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    images: {
      type: [String],
      default: [],
    },
    mainImage: {
      type: String,
      default: "",
    },
    galleryImages: {
      type: [String],
      default: [],
    },
    isOffer: {
      type: Boolean,
      default: false,
      index: true,
    },
    isHotDeal: {
      type: Boolean,
      default: false,
    },
    offerBadge: {
      type: String,
      default: "",
    },
    offerEndTime: {
      type: Date,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    specifications: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

// Auto calculate inStock before saving
ProductSchema.pre("save", function (this: any) {
  this.inStock = (this.stock || 0) > 0;
});

// Indexes for fast querying and memory-safe sorting
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ category: 1, createdAt: -1 });
ProductSchema.index({ sellPrice: 1 });
ProductSchema.index({ isFeatured: 1 });
ProductSchema.index({ isOffer: 1 });

export const Product = mongoose.model<IProduct>("Product", ProductSchema);
