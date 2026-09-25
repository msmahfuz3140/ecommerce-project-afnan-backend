import mongoose from "mongoose";

export const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/auramart";
    await mongoose.connect(mongoUri);
    console.log(`✅ MongoDB connected successfully to: ${mongoUri.split("@").pop()?.split("?")[0] || "localhost"}`);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    // Do not terminate process immediately in dev so app can still handle requests with clear error
  }
};
