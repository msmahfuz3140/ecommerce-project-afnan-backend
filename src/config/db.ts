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

let isConnecting = false;

export const connectDB = async (): Promise<boolean> => {
  if (mongoose.connection.readyState === 1) return true;
  if (isConnecting) {
    for (let i = 0; i < 50; i++) {
      await new Promise((r) => setTimeout(r, 100));
      if ((mongoose.connection.readyState as number) === 1) return true;
    }
  }

  isConnecting = true;
  const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/gaxinmart";

  try {
    console.log(`📡 Connecting to MongoDB Atlas: ${mongoUri.split("@").pop()?.split("?")[0] || "database"}...`);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000,
      autoIndex: true,
    });
    console.log(`✅ MongoDB connected successfully to database: ${mongoose.connection.name}`);
    isConnecting = false;
    return true;
  } catch (error: any) {
    isConnecting = false;
    console.error(`❌ MongoDB connection attempt failed: ${error.message || error}`);
    return false;
  }
};

export const ensureDB = async (): Promise<boolean> => {
  if (mongoose.connection.readyState === 1) return true;
  return await connectDB();
};
