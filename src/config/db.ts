import mongoose from "mongoose";

// Robust MongoDB Atlas connection string fallback
const FALLBACK_MONGODB_URI =
  "mongodb+srv://gaxinmart:gaxinmart3140@cluster0.bxwan4t.mongodb.net/gaxinmart?retryWrites=true&w=majority&appName=Cluster0";

export const getMongoUri = (): string => {
  const envUri = process.env.MONGODB_URI?.trim();
  if (envUri && envUri !== "mongodb://localhost:27017/gaxinmart") {
    return envUri;
  }
  // When running on Vercel, in production, or if no URI provided, use the Atlas cluster
  if (process.env.VERCEL || process.env.NODE_ENV === "production" || !envUri) {
    return FALLBACK_MONGODB_URI;
  }
  return envUri || FALLBACK_MONGODB_URI;
};

// Global cache for connection in serverless / hot-reload environments
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<boolean> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };
if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

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
  if (mongoose.connection.readyState === 1) {
    cached.conn = mongoose;
    return true;
  }

  if (cached.promise) {
    return await cached.promise;
  }

  const mongoUri = getMongoUri();

  cached.promise = (async () => {
    try {
      console.log(`📡 Connecting to MongoDB Atlas: ${mongoUri.split("@").pop()?.split("?")[0] || "database"}...`);
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        autoIndex: false,
      });
      cached.conn = mongoose;
      console.log(`✅ MongoDB connected successfully to database: ${mongoose.connection.name}`);
      try {
        await mongoose.connection.db?.collection("products").createIndex({ createdAt: -1 });
        await mongoose.connection.db?.collection("products").createIndex({ category: 1, createdAt: -1 });
        await mongoose.connection.db?.collection("products").createIndex({ sellPrice: 1 });
      } catch (e) {
        // index creation check
      }
      return true;
    } catch (error: any) {
      cached.promise = null;
      console.error(`❌ MongoDB connection attempt failed: ${error.message || error}`);
      return false;
    }
  })();

  return await cached.promise;
};

export const ensureDB = async (): Promise<boolean> => {
  if (mongoose.connection.readyState === 1) return true;
  return await connectDB();
};

