import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
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

