import mongoose from "mongoose";

// Enable Mongoose command buffering so queries waiting on connection don't immediately reject
mongoose.set("bufferCommands", true);

export const isDBConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};

// Event listeners for connection monitoring
mongoose.connection.on("connected", () => {
  console.log("✅ MongoDB Connection Established Successfully");
});

mongoose.connection.on("error", (err: any) => {
  console.error("❌ MongoDB Connection Error:", err.message || err);
});

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ MongoDB Disconnected. Awaiting reconnection...");
});

export const connectDB = async (): Promise<boolean> => {
  const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/gaxinmart";

  try {
    console.log(`📡 Connecting to MongoDB: ${mongoUri.split("@").pop()?.split("?")[0] || "localhost"}...`);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000, // Generous 15s timeout for Atlas & cloud instances
      autoIndex: true,
    });
    console.log(`✅ MongoDB connected successfully to: ${mongoose.connection.name || "gaxinmart"}`);
    return true;
  } catch (error: any) {
    console.warn(`⚠️ MongoDB connection attempt failed: ${error.message || error}`);
    console.warn("ℹ️ Running in fallback mode. When MONGODB_URI is provided in .env, data will be stored directly in MongoDB.");
    return false;
  }
};
