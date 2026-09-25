import mongoose from "mongoose";

// Disable command buffering so operations don't hang if MongoDB is offline
mongoose.set("bufferCommands", false);

export const isDBConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};

export const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/auramart";
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`✅ MongoDB connected successfully to: ${mongoUri.split("@").pop()?.split("?")[0] || "localhost"}`);
  } catch (error: any) {
    console.warn("⚠️ MongoDB offline. In-Memory Store active with full demo products, orders & admin support.");
  }
};
