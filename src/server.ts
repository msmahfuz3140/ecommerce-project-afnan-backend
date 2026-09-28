import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import cors from "cors";
import { connectDB } from "./config/db";
import { Admin } from "./models/Admin";

// Import routes
import authRoutes from "./routes/authRoutes";
import productRoutes from "./routes/productRoutes";
import orderRoutes from "./routes/orderRoutes";
import offerRoutes from "./routes/offerRoutes";
import analyticsRoutes from "./routes/analyticsRoutes";
import uploadRoutes from "./routes/uploadRoutes";

const app = express();
const PORT = process.env.PORT || 5000;

// Allowed origins for CORS (Live Domain, Vercel Previews, Localhost)
const allowedOrigins = [
  "https://www.gaxinmart.shop",
  "https://gaxinmart.shop",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
];

// Enable CORS for all frontends (Vercel, custom domain, and localhost)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app") ||
        origin.includes("gaxinmart.shop")
      ) {
        return callback(null, true);
      }

      // Default allow for maximum flexibility
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  })
);

// Handle preflight across all routes
app.options("*", cors() as any);

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Health Check
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "GAXIN MART E-Commerce Backend",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/upload", uploadRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Error Handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// Start Server immediately and connect DB in background
app.listen(PORT, () => {
  console.log(`🚀 GAXIN MART Backend Server running on http://localhost:${PORT}`);
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@gaxinmart.com").toLowerCase().trim();
  console.log(`🔐 Admin Login configured for: ${adminEmail}`);

  // Connect to DB and seed admin & demo data
  connectDB().then(async () => {
    try {
      const adminPassword = process.env.ADMIN_PASSWORD || "gaxinmart3140";
      const existingAdmin = await Admin.findOne({ email: adminEmail });

      if (!existingAdmin) {
        const newAdmin = new Admin({
          name: "GAXIN MART Admin",
          email: adminEmail,
          password: adminPassword,
          role: "admin",
        });
        await newAdmin.save();
        console.log(`👤 Initial Admin account seeded automatically (${adminEmail})`);
      }

      // Check if products collection is empty in MongoDB; if so, auto-seed products & offers!
      const { Product } = await import("./models/Product");
      const prodCount = await Product.countDocuments();
      if (prodCount === 0) {
        console.log("🌱 Products collection is empty. Auto-seeding GAXIN MART demo products and offers...");
        const { seedDatabase } = await import("./seed");
        await seedDatabase();
      }
    } catch (e) {
      // Ignored if DB offline
    }
  });
});
