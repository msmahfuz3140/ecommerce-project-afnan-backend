import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Product } from "../models/Product";
import { mockProducts, ProductItem } from "../data/mockData";
import { isDBConnected, ensureDB } from "../config/db";
import { uploadStringToCloudinary } from "../config/cloudinary";

const JWT_SECRET = process.env.JWT_SECRET || "gaxinmart_jwt_secret_key_2026_secure";

// Helper function to check if request is from an authenticated admin
const isAdminRequest = (req: Request): boolean => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) return false;
    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    return Boolean(decoded && (decoded.role === "admin" || decoded.email));
  } catch {
    return false;
  }
};

// Helper function to sanitize product for customers and normalize Atlas schema fields
const sanitizeProduct = (prod: any, isAdmin: boolean) => {
  const p = prod && prod.toObject ? prod.toObject() : { ...prod };

  // Normalize sellPrice from basePrice if needed
  if (p.sellPrice === undefined || p.sellPrice === null || p.sellPrice === 0) {
    p.sellPrice = p.basePrice || 0;
  }
  // Normalize originalPrice from oldPrice if needed
  if (!p.originalPrice) {
    p.originalPrice = p.oldPrice || p.sellPrice || 0;
  }
  // Normalize buyPrice from costPrice if needed
  if (p.buyPrice === undefined || p.buyPrice === null) {
    p.buyPrice = p.costPrice || 0;
  }
  // Normalize images from mainImage/galleryImages if needed
  if (!Array.isArray(p.images) || p.images.length === 0) {
    p.images = [];
    if (p.mainImage) p.images.push(p.mainImage);
    if (Array.isArray(p.galleryImages)) {
      p.galleryImages.forEach((img: string) => {
        if (!p.images.includes(img)) p.images.push(img);
      });
    }
    if (p.images.length === 0) {
      p.images = ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80"];
    }
  }
  // Normalize isOffer from isHotDeal
  if (p.isOffer === undefined) {
    p.isOffer = Boolean(p.isHotDeal);
  }
  // Normalize inStock
  p.inStock = (p.stock || 0) > 0;

  if (!isAdmin) {
    delete p.buyPrice;
    delete p.costPrice;
  }
  return p;
};

// Helper function to generate unique slug, safe for Bengali and English characters
const createSlug = (name: string): string => {
  const clean = name
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  return `${clean || "product"}-${Math.random().toString(36).substring(2, 7)}`;
};

// GET /api/products (Public / Admin)
export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, search, isOffer, isFeatured, sort, page = 1, limit = 50 } = req.query;
    const isAdmin = isAdminRequest(req);

    await ensureDB();

    if (isDBConnected()) {
      const filter: any = {};
      if (category && category !== "all") {
        filter.$or = [
          { category: category },
          { category: new RegExp(String(category), "i") },
        ];
      }
      if (isOffer === "true") {
        filter.$or = [{ isOffer: true }, { isHotDeal: true }];
      }
      if (isFeatured === "true") filter.isFeatured = true;

      if (search) {
        const searchRegex = new RegExp(String(search), "i");
        filter.$or = [{ name: searchRegex }, { description: searchRegex }, { subCategory: searchRegex }];
      }

      let sortOption: any = { createdAt: -1 };
      if (sort === "price_asc") sortOption = { sellPrice: 1, basePrice: 1 };
      if (sort === "price_desc") sortOption = { sellPrice: -1, basePrice: -1 };
      if (sort === "oldest") sortOption = { createdAt: 1 };

      const pageNumber = Math.max(1, Number(page));
      const pageSize = Math.max(1, Number(limit));
      const skip = (pageNumber - 1) * pageSize;

      const [products, total] = await Promise.all([
        Product.find(filter).sort(sortOption).skip(skip).limit(pageSize),
        Product.countDocuments(filter),
      ]);

      const sanitized = products.map((p) => sanitizeProduct(p, isAdmin));

      res.json({
        success: true,
        products: sanitized,
        pagination: {
          page: pageNumber,
          limit: pageSize,
          total,
          totalPages: Math.ceil(total / pageSize) || 1,
        },
      });
      return;
    }

    // In-memory Fallback
    let filtered = [...mockProducts];

    if (category && category !== "all") {
      filtered = filtered.filter((p) => p.category === category);
    }

    if (isOffer === "true") {
      filtered = filtered.filter((p) => p.isOffer);
    }

    if (isFeatured === "true") {
      filtered = filtered.filter((p) => p.isFeatured);
    }

    if (search) {
      const q = String(search).toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.subCategory && p.subCategory.toLowerCase().includes(q))
      );
    }

    if (sort === "price_asc") filtered.sort((a, b) => a.sellPrice - b.sellPrice);
    if (sort === "price_desc") filtered.sort((a, b) => b.sellPrice - a.sellPrice);
    if (sort === "latest") filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const sanitized = filtered.map((p) => sanitizeProduct(p, isAdmin));

    res.json({
      success: true,
      products: sanitized,
      pagination: {
        page: 1,
        limit: Number(limit),
        total: sanitized.length,
        totalPages: 1,
      },
    });
  } catch (error: any) {
    console.error("Error fetching products:", error);
    const isAdmin = isAdminRequest(req);
    const sanitized = mockProducts.map((p) => sanitizeProduct(p, isAdmin));
    res.json({
      success: true,
      products: sanitized,
      pagination: { page: 1, limit: 50, total: mockProducts.length, totalPages: 1 },
    });
  }
};

// GET /api/products/:identifier (Public - by slug or ID)
export const getProductByIdOrSlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const identifier = String(req.params.identifier);
    const isAdmin = isAdminRequest(req);

    if (isDBConnected()) {
      let product: any = null;
      if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
        product = await Product.findById(identifier);
      } else {
        product = await Product.findOne({ slug: identifier });
      }

      if (product) {
        res.json({ success: true, product: sanitizeProduct(product, isAdmin) });
        return;
      }
    }

    const fallback = mockProducts.find((p) => p._id === identifier || p.slug === identifier);
    if (fallback) {
      res.json({ success: true, product: sanitizeProduct(fallback, isAdmin) });
      return;
    }

    res.status(404).json({ success: false, message: "Product not found" });
  } catch (error: any) {
    const isAdmin = isAdminRequest(req);
    const fallback = mockProducts.find((p) => p._id === req.params.identifier || p.slug === req.params.identifier);
    if (fallback) {
      res.json({ success: true, product: sanitizeProduct(fallback, isAdmin) });
      return;
    }
    res.status(500).json({ success: false, message: error.message || "Failed to fetch product" });
  }
};

// POST /api/products (Admin Only)
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      description,
      category,
      subCategory,
      buyPrice,
      sellPrice,
      originalPrice,
      stock,
      images,
      isOffer,
      offerBadge,
      isFeatured,
      specifications,
    } = req.body;

    if (!name || !category || sellPrice === undefined) {
      res.status(400).json({ success: false, message: "Name, category, and sell price are required" });
      return;
    }

    const slug = createSlug(name);

    // Process and ensure images are uploaded to Cloudinary if base64 provided
    let rawImages = Array.isArray(images) && images.length > 0 ? images : ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80"];
    const finalImages = await Promise.all(
      rawImages.map((img: string) => uploadStringToCloudinary(img, "gaxinmart/products"))
    );

    const connected = await ensureDB();
    if (!connected) {
      res.status(503).json({
        success: false,
        message: "MongoDB connection is offline. Please check MONGODB_URI in your .env or network connection to MongoDB Atlas.",
      });
      return;
    }

    const numSellPrice = Number(sellPrice) || 0;
    const numOriginalPrice = Number(originalPrice) || numSellPrice;
    const numBuyPrice = Number(buyPrice) || 0;
    const numStock = Number(stock) || 50;

    const product = new Product({
      name: name.trim(),
      slug,
      description: description || name,
      category,
      subCategory: subCategory || "",
      buyPrice: numBuyPrice,
      costPrice: numBuyPrice,
      sellPrice: numSellPrice,
      basePrice: numSellPrice,
      originalPrice: numOriginalPrice,
      oldPrice: numOriginalPrice,
      stock: numStock,
      inStock: numStock > 0,
      images: finalImages,
      mainImage: finalImages[0] || "",
      galleryImages: finalImages,
      isOffer: Boolean(isOffer),
      isHotDeal: Boolean(isOffer),
      offerBadge: offerBadge || "",
      isFeatured: Boolean(isFeatured),
      isActive: true,
      specifications: specifications || {},
    });

    await product.save();
    mockProducts.unshift({ ...product.toObject(), _id: product._id.toString() } as any);

    res.status(201).json({
      success: true,
      message: "Product created successfully in MongoDB",
      product: sanitizeProduct(product, true),
    });
  } catch (error: any) {
    console.error("Error creating product:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to create product" });
  }
};

// PUT /api/products/:id (Admin Only)
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const updates = { ...req.body };

    // Process images with Cloudinary if updated
    if (updates.images && Array.isArray(updates.images)) {
      updates.images = await Promise.all(
        updates.images.map((img: string) => uploadStringToCloudinary(img, "gaxinmart/products"))
      );
      updates.mainImage = updates.images[0] || "";
      updates.galleryImages = updates.images;
    }

    if (updates.sellPrice !== undefined) {
      updates.basePrice = Number(updates.sellPrice);
    }
    if (updates.originalPrice !== undefined) {
      updates.oldPrice = Number(updates.originalPrice);
    }
    if (updates.buyPrice !== undefined) {
      updates.costPrice = Number(updates.buyPrice);
    }
    if (updates.isOffer !== undefined) {
      updates.isHotDeal = Boolean(updates.isOffer);
    }

    await ensureDB();

    let updatedMongoProduct = null;
    if (isDBConnected()) {
      updatedMongoProduct = await Product.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    }

    const idx = mockProducts.findIndex((p) => p._id === id);
    if (idx !== -1) {
      mockProducts[idx] = { ...mockProducts[idx], ...updates, updatedAt: new Date() };
    }

    if (!updatedMongoProduct && idx === -1) {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }

    res.json({
      success: true,
      message: "Product updated successfully",
      product: sanitizeProduct(updatedMongoProduct || mockProducts[idx], true),
    });
  } catch (error: any) {
    console.error("Error updating product:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to update product" });
  }
};

// DELETE /api/products/:id (Admin Only)
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);

    await ensureDB();

    if (isDBConnected()) {
      await Product.findByIdAndDelete(id);
    }

    const idx = mockProducts.findIndex((p) => p._id === id);
    if (idx !== -1) {
      mockProducts.splice(idx, 1);
    }

    res.json({ success: true, message: "Product deleted successfully from MongoDB" });
  } catch (error: any) {
    console.error("Error deleting product:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to delete product" });
  }
};

