import "dotenv/config";
import express from "express";
import User from "../models/user.js";  
import jwt from "jsonwebtoken";

const authRouter = express.Router();

const generateToken = (userid) => {
  return jwt.sign({ id: userid }, process.env.JWT_SEC, { expiresIn: "3d" });
};

authRouter.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;  
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existUser = await User.findOne({ name });
    if (existUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const existEmail = await User.findOne({ email });
    if (existEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = new User({
      name,
      email,
      password,
      role: role || 'student'  // Default to student
    });

    await user.save();
    const token = generateToken(user._id);
    res.status(201).json({
      message: "Successfully registered",
      token,
      user: { id: user._id, name, email, role: user.role }
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = generateToken(user._id);
    res.status(201).json({
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email, role: user.role }
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
});

// Update device token for notifications (called from mobile after login)
authRouter.post("/update-device-token", async (req, res) => {
  try {
    const { userId, deviceToken } = req.body;
    await User.findByIdAndUpdate(userId, { deviceToken });
    res.status(200).json({ message: "Device token updated" });
  } catch (error) {
    res.status(500).json({ message: "Error updating device token", error });
  }
});

export default authRouter;