import { betterAuth } from "better-auth";
import { MongoClient } from "mongodb";

const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/auramart";
const client = new MongoClient(mongoUri);

export const auth = betterAuth({
  database: client.db("auramart"),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  secret: process.env.JWT_SECRET || "auramart_secret_key_afnan_3140_ecommerce_secure_key",
});
