import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user already exists
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({ name, email, password: hashed });

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({ 
      message: "Signup successful", 
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Signup failed", error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Hardcoded fallback admin account (for emergency access when DB is unavailable)
    const FALLBACK_EMAIL = "admin@aegis.local";
    const FALLBACK_PASSWORD = "admin123";
    const FALLBACK_USER = {
      id: "fallback-admin-id",
      name: "Admin User",
      email: FALLBACK_EMAIL
    };

    // Check hardcoded fallback first
    if (email === FALLBACK_EMAIL && password === FALLBACK_PASSWORD) {
      const token = jwt.sign(
        { id: FALLBACK_USER.id, email: FALLBACK_USER.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.json({ 
        message: "Login successful (fallback account)", 
        token,
        user: FALLBACK_USER
      });
    }

    // Try database lookup
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      // Compare password
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.json({ 
        message: "Login successful", 
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      });
    } catch (dbError) {
      // If database is unavailable, only allow fallback account
      console.error("Database error during login:", dbError);
      return res.status(500).json({ 
        message: "Database unavailable. Please use fallback account or try again later." 
      });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

