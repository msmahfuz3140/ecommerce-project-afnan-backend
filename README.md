# AuraMart - Modern E-Commerce Backend (Express + MongoDB + Better-Auth + Cloudinary)

A full-featured Node.js & Express.js e-commerce backend built with TypeScript, Mongoose, Better Auth, and Cloudinary media upload.

---

## 🌟 Key Features

1. **MongoDB Database Architecture**:
   - `Product`: Category (`electronics`, `cosmetics`, `fashion`), `buyPrice` (Cost/ক্রয়মূল্য), `sellPrice` (বিক্রয়মূল্য), `originalPrice`, stock, Cloudinary images, offer tags.
   - `Order`: Customer details (Name, Phone, Address, City, Note), items list with buyPrice and sellPrice snapshot, Cash on Delivery status (`pending` -> `in_progress` -> `in_courier` -> `delivered` -> `cancelled`), status audit log.
   - `Offer`: Promotional hero banners and running special announcement ticker bar (`isNoticeTicker`).
   - `Admin`: Secure authentication for admin panel.

2. **Admin Credentials Pre-configured**:
   - **Email**: `afnan@gmail.com`
   - **Password**: `afnan31403140`
   - Automatically seeded on first startup or via seed command!

3. **Profit & Loss Engine (লাভ-ক্ষতির হিসাব)**:
   - Tracks wholesale / purchase cost (`buyPrice`) and customer sell price (`sellPrice`).
   - Real-time Net Profit: `Revenue - Product Buy Cost`.
   - Date range filtering: **Last 7 Days**, **Last 30 Days**, **All Time**, or Custom.
   - Category performance analytics (Electronics vs Cosmetics vs Fashion profit).

4. **Cash on Delivery (COD) Flow**:
   - 100% Cash on Delivery supported.
   - Auto-generates readable Order IDs (e.g. `#AUR-829101`).
   - Deducts product inventory upon ordering, restores inventory if cancelled.
   - Direct Order Tracking API (`/api/orders/track/:query`).

5. **Cloudinary Integration**:
   - Upload single or multiple images/PDFs directly to Cloudinary.
   - Built-in graceful fallback for development if keys are not yet configured.

---

## 🚀 Setup & Execution

### 1. Environment Setup
Configure `.env` (or copy from `.env.example`):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/auramart
JWT_SECRET=auramart_secret_key_afnan_3140_ecommerce_secure_key
ADMIN_EMAIL=afnan@gmail.com
ADMIN_PASSWORD=afnan31403140
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLIENT_URL=http://localhost:3000
```

### 2. Seed Initial Database (Products, Offers & Admin)
```bash
npm run seed
```

### 3. Run Development Server
```bash
npm run dev
```
Backend runs on `http://localhost:5000`.
