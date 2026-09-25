import mongoose, { Document, Schema } from "mongoose";

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  category: "electronics" | "cosmetics" | "fashion";
  subCategory?: string;
  buyPrice: number; // Cost / Purchase price (koto diye kena)
  sellPrice: number; // Selling price (koto diye bikri)
  originalPrice: number; // Crossed out original price for discounts
  stock: number;
  inStock: boolean;
  images: string[]; // Cloudinary URLs
  isOffer: boolean; // Is part of promotional deal
  offerBadge?: string; // e.g. "20% OFF", "Flash Sale", "Hot Deal"
  isFeatured: boolean;
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
      type: String,
      required: true,
      enum: ["electronics", "cosmetics", "fashion"],
      index: true,
    },
    subCategory: {
      type: String,
      default: "",
    },
    buyPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    sellPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    originalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 100,
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    images: {
      type: [String],
      required: true,
      default: [],
    },
    isOffer: {
      type: Boolean,
      default: false,
      index: true,
    },
    offerBadge: {
      type: String,
      default: "",
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    specifications: {
      type: Map,
      of: String,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Auto calculate inStock before saving
ProductSchema.pre("save", function () {
  this.inStock = this.stock > 0;
});

export const Product = mongoose.model<IProduct>("Product", ProductSchema);
