import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { Admin } from "./models/Admin";
import { Product } from "./models/Product";
import { Offer } from "./models/Offer";
import { Order } from "./models/Order";
import { mockProducts, mockOffers, mockOrders } from "./data/mockData";

const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/gaxinmart";

export const seedDatabase = async () => {
  try {
    console.log("Connecting to MongoDB for seeding GAXIN MART data...");
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB.");

    // 1. Seed or update Admin
    const adminEmail = (process.env.ADMIN_EMAIL || "admin@gaxinmart.com").toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || "gaxinmart3140";

    let admin = await Admin.findOne({ email: adminEmail });
    if (!admin) {
      admin = new Admin({
        name: "GAXIN MART Admin",
        email: adminEmail,
        password: adminPassword,
        role: "admin",
      });
      await admin.save();
      console.log(`✅ Admin created: ${adminEmail}`);
    } else {
      admin.password = adminPassword;
      await admin.save();
      console.log(`✅ Admin updated: ${adminEmail}`);
    }

    // 2. Clear and seed Products
    await Product.deleteMany({});
    const productsToInsert = mockProducts.map((p) => {
      const { _id, ...rest } = p;
      return rest;
    });
    const insertedProducts = await Product.insertMany(productsToInsert);
    console.log(`✅ Successfully seeded ${insertedProducts.length} GAXIN MART products across 6 categories!`);

    // 3. Clear and seed Offers
    await Offer.deleteMany({});
    const offersToInsert = mockOffers.map((o) => {
      const { _id, ...rest } = o;
      return rest;
    });
    await Offer.insertMany(offersToInsert);
    console.log(`✅ Seeded promotional banners and special notice ticker.`);

    // 4. Seed initial realistic Orders
    await Order.deleteMany({});
    const sampleOrders = mockOrders.map((ord, idx) => {
      const { _id, ...rest } = ord;
      // Map product references to newly inserted product IDs if available
      const mappedItems = rest.items.map((item, itemIdx) => {
        const matchingProd = insertedProducts[(idx * 2 + itemIdx) % insertedProducts.length];
        return {
          ...item,
          product: matchingProd?._id,
        };
      });
      return {
        ...rest,
        items: mappedItems,
      };
    });

    await Order.insertMany(sampleOrders);
    console.log(`✅ Seeded sample customer orders for profit/loss analytics & order management.`);
    console.log(`🎉 GAXIN MART Database seeding completed successfully!`);
  } catch (error) {
    console.error("❌ Seeding error:", error);
  }
};

// If run directly via tsx src/seed.ts
if (require.main === module) {
  seedDatabase().then(() => {
    mongoose.connection.close();
    process.exit(0);
  });
}
