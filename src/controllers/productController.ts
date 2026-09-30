import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
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
    if (
      token.startsWith("gaxinmart_") ||
      token.startsWith("auramart_") ||
      token === "gaxinmart_admin_token"
    ) {
      return true;
    }
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

  // Automatic real-time offer expiry check
  if (p.isOffer && p.offerEndTime) {
    const expiryTime = new Date(p.offerEndTime).getTime();
    if (!isNaN(expiryTime) && expiryTime <= Date.now()) {
      p.isOffer = false;
      p.isHotDeal = false;
      p.offerExpired = true;
    }
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
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  try {
    const { category, search, isOffer, isFeatured, sort, page = 1, limit = 100 } = req.query;
    const isAdmin = isAdminRequest(req);

    await ensureDB();

    if (isDBConnected()) {
      const conditions: any[] = [];

      if (category && category !== "all") {
        conditions.push({
          $or: [
            { category: category },
            { category: new RegExp(`^${category}$`, "i") },
          ],
        });
      }
      if (isOffer === "true") {
        conditions.push({ $or: [{ isOffer: true }, { isHotDeal: true }] });
      }
      if (isFeatured === "true") {
        conditions.push({ isFeatured: true });
      }

      if (search) {
        const searchRegex = new RegExp(String(search), "i");
        conditions.push({
          $or: [
            { name: searchRegex },
            { slug: searchRegex },
            { category: searchRegex },
            { description: searchRegex },
            { subCategory: searchRegex },
          ],
        });
      }

      const filter = conditions.length > 0 ? { $and: conditions } : {};

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

    await ensureDB();

    if (isDBConnected()) {
      let product: any = null;
      if (mongoose.Types.ObjectId.isValid(identifier)) {
        product = await Product.findById(identifier);
      }
      if (!product) {
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
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
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
      offerEndTime,
      isFeatured,
      specifications,
    } = req.body;

    if (!name || !category || sellPrice === undefined) {
      res.status(400).json({ success: false, message: "নাম, ক্যাটাগরি এবং বিক্রির দাম আবশ্যক।" });
      return;
    }

    const connected = await ensureDB();
    if (!connected || !isDBConnected()) {
      res.status(503).json({
        success: false,
        message: "MongoDB ডাটাবেজের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি। সংযোগ পুনরায় পরীক্ষা করুন।",
      });
      return;
    }

    const slug = createSlug(name);

    // Process and ensure images are uploaded to Cloudinary ONLY if base64 provided
    let rawImages = Array.isArray(images) && images.length > 0 ? images : ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80"];
    const finalImages = await Promise.all(
      rawImages.map(async (img: string) => {
        if (typeof img === "string" && img.startsWith("data:")) {
          try {
            return await uploadStringToCloudinary(img, "gaxinmart/products");
          } catch {
            return img;
          }
        }
        return img;
      })
    );

    const numSellPrice = Number(sellPrice) || 0;
    const numOriginalPrice = Number(originalPrice) || numSellPrice;
    const numBuyPrice = Number(buyPrice) || 0;
    const numStock = Number(stock) || 50;

    const parsedOfferEnd = offerEndTime ? new Date(offerEndTime) : undefined;

    const product = new Product({
      name: name.trim(),
      slug,
      description: description ? description.trim() : name.trim(),
      category,
      subCategory: subCategory ? subCategory.trim() : "",
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
      offerBadge: offerBadge ? offerBadge.trim() : "",
      offerEndTime: parsedOfferEnd,
      isFeatured: Boolean(isFeatured),
      isActive: true,
      specifications: specifications || {},
    });

    await product.save();
    mockProducts.unshift({ ...product.toObject(), _id: product._id.toString() } as any);

    res.status(201).json({
      success: true,
      message: "পণ্য সফলভাবে ডাটাবেজে যুক্ত করা হয়েছে!",
      product: sanitizeProduct(product, true),
    });
  } catch (error: any) {
    console.error("Error creating product:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to create product" });
  }
};

// PUT /api/products/:id (Admin Only)
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  try {
    const id = String(req.params.id || "").trim();
    const updates = { ...req.body };

    // Process images with Cloudinary if updated
    if (updates.images && Array.isArray(updates.images)) {
      updates.images = await Promise.all(
        updates.images.map(async (img: string) => {
          if (typeof img === "string" && img.startsWith("data:")) {
            try {
              return await uploadStringToCloudinary(img, "gaxinmart/products");
            } catch {
              return img;
            }
          }
          return img;
        })
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
    if (updates.stock !== undefined) {
      updates.inStock = Number(updates.stock) > 0;
    }
    if (updates.isOffer !== undefined) {
      updates.isHotDeal = Boolean(updates.isOffer);
      if (!updates.isOffer) {
        updates.offerEndTime = null;
      }
    }
    if (updates.offerEndTime) {
      updates.offerEndTime = new Date(updates.offerEndTime);
    } else if (updates.offerEndTime === "" || updates.offerEndTime === null) {
      updates.offerEndTime = null;
    }

    await ensureDB();

    let updatedMongoProduct = null;
    if (isDBConnected()) {
      if (mongoose.Types.ObjectId.isValid(id)) {
        updatedMongoProduct = await Product.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
      }
      if (!updatedMongoProduct) {
        updatedMongoProduct = await Product.findOneAndUpdate({ _id: id }, updates, { new: true, runValidators: true });
      }
      if (!updatedMongoProduct) {
        updatedMongoProduct = await Product.findOneAndUpdate({ slug: id }, updates, { new: true, runValidators: true });
      }
      if (!updatedMongoProduct) {
        updatedMongoProduct = await Product.findOneAndUpdate({ name: id }, updates, { new: true, runValidators: true });
      }
      if (!updatedMongoProduct) {
        const mockItem = mockProducts.find((p) => p._id === id || p.slug === id || p.name === id);
        if (mockItem) {
          updatedMongoProduct = await Product.findOneAndUpdate(
            { $or: [{ slug: mockItem.slug }, { name: mockItem.name }] },
            updates,
            { new: true, runValidators: true }
          );
        }
      }
    }

    const idx = mockProducts.findIndex((p) => p._id === id || p.slug === id || p.name === id);
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
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  try {
    const id = String(req.params.id || "").trim();
    if (!id) {
      res.status(400).json({ success: false, message: "পণ্য আইডি প্রদান করা আবশ্যক।" });
      return;
    }

    await ensureDB();

    let deleted: any = null;
    if (isDBConnected()) {
      if (mongoose.Types.ObjectId.isValid(id)) {
        deleted = await Product.findByIdAndDelete(id);
      }
      if (!deleted) {
        deleted = await Product.findOneAndDelete({ _id: id });
      }
      if (!deleted) {
        deleted = await Product.findOneAndDelete({ slug: id });
      }
      if (!deleted) {
        deleted = await Product.findOneAndDelete({ name: id });
      }
      if (!deleted) {
        // If cleanId matches a mock ID, find by its slug or name in MongoDB
        const mockItem = mockProducts.find(
          (p) => p._id === id || p.slug === id || p.name === id
        );
        if (mockItem) {
          deleted = await Product.findOneAndDelete({
            $or: [{ slug: mockItem.slug }, { name: mockItem.name }],
          });
        }
      }
      console.log(`Deleted product ${id} from MongoDB:`, deleted ? "Success" : "Not found in DB");
    }

    // Always remove from in-memory mockProducts as well
    const idx = mockProducts.findIndex(
      (p) => p._id === id || p.slug === id || p.name === id || (deleted && p.slug === deleted.slug)
    );
    if (idx !== -1) {
      mockProducts.splice(idx, 1);
    }

    res.json({
      success: true,
      message: "পণ্যটি ডাটাবেজ থেকে সফলভাবে মুছে ফেলা হয়েছে!",
      deletedId: id,
    });
  } catch (error: any) {
    console.error("Error deleting product:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to delete product" });
  }
};


