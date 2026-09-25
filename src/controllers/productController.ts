import { Request, Response } from "express";
import { Product } from "../models/Product";

// Helper function to generate unique slug
const createSlug = (name: string): string => {
  return (
    name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .trim() +
    "-" +
    Math.random().toString(36).substring(2, 7)
  );
};

// GET /api/products (Public)
export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, search, isOffer, isFeatured, sort, page = 1, limit = 50 } = req.query;

    const filter: any = {};

    if (category && category !== "all") {
      filter.category = category;
    }

    if (isOffer === "true") {
      filter.isOffer = true;
    }

    if (isFeatured === "true") {
      filter.isFeatured = true;
    }

    if (search) {
      const searchRegex = new RegExp(String(search), "i");
      filter.$or = [{ name: searchRegex }, { description: searchRegex }, { subCategory: searchRegex }];
    }

    let sortOption: any = { createdAt: -1 };
    if (sort === "price_asc") sortOption = { sellPrice: 1 };
    if (sort === "price_desc") sortOption = { sellPrice: -1 };
    if (sort === "oldest") sortOption = { createdAt: 1 };

    const pageNumber = Math.max(1, Number(page));
    const pageSize = Math.max(1, Number(limit));
    const skip = (pageNumber - 1) * pageSize;

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sortOption).skip(skip).limit(pageSize),
      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      products,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error: any) {
    console.error("Error fetching products:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to fetch products" });
  }
};

// GET /api/products/:identifier (Public - by slug or ID)
export const getProductByIdOrSlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const identifier = String(req.params.identifier);

    const isObjectId = identifier.match(/^[0-9a-fA-F]{24}$/);
    let product;

    if (isObjectId) {
      product = await Product.findById(identifier);
    } else {
      product = await Product.findOne({ slug: identifier });
    }

    if (!product) {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }

    res.json({ success: true, product });
  } catch (error: any) {
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

    const product = new Product({
      name,
      slug,
      description: description || name,
      category,
      subCategory: subCategory || "",
      buyPrice: Number(buyPrice) || 0,
      sellPrice: Number(sellPrice),
      originalPrice: Number(originalPrice) || Number(sellPrice),
      stock: Number(stock) || 50,
      images: Array.isArray(images) && images.length > 0 ? images : ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80"],
      isOffer: Boolean(isOffer),
      offerBadge: offerBadge || "",
      isFeatured: Boolean(isFeatured),
      specifications: specifications || {},
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
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
    const updates = req.body;

    if (updates.name && !updates.slug) {
      updates.slug = createSlug(updates.name);
    }

    if (updates.stock !== undefined) {
      updates.inStock = Number(updates.stock) > 0;
    }

    const product = await Product.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }

    res.json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to update product" });
  }
};

// DELETE /api/products/:id (Admin Only)
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }

    res.json({ success: true, message: "Product deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to delete product" });
  }
};
