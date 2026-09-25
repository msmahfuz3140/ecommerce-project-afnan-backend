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

// Enable CORS for frontend
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:3000",
  "http://localhost:3000",
  "http://localhost:3002",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3002",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin or matching allowedOrigins
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Health Check
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "AuraMart E-Commerce Backend",
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
  console.log(`🚀 AuraMart Backend Server running on http://localhost:${PORT}`);
  const adminEmail = (process.env.ADMIN_EMAIL || "afnan@gmail.com").toLowerCase().trim();
  console.log(`🔐 Admin Login configured for: ${adminEmail}`);

  // Connect to DB and seed admin
  connectDB().then(async () => {
    try {
      const adminPassword = process.env.ADMIN_PASSWORD || "afnan31403140";
      const existingAdmin = await Admin.findOne({ email: adminEmail });

      if (!existingAdmin) {
        const newAdmin = new Admin({
          name: "Afnan Johad",
          email: adminEmail,
          password: adminPassword,
          role: "admin",
        });
        await newAdmin.save();
        console.log(`👤 Initial Admin account seeded automatically (${adminEmail})`);
      }
    } catch (e) {
      // Ignored if DB offline
    }
  });
});
