import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load auth backend's .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI not found in environment variables");
    }
    
    await mongoose.connect(mongoUri, {
      dbName: "aegis"
    });
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    console.warn("\n⚠️  FALLBACK MODE ENABLED:");
    console.warn("   Email: admin@aegis.local");
    console.warn("   Password: admin123\n");
    // Don't exit—allow fallback auth to work
  }
};

