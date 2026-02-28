import "dotenv/config";
import express from "express";
import User from "../models/user.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import Protect from "../middleware/auth.js";

const authRouter = express.Router();

// JWT Token Generator
const generateToken = (userid, role) => {
  return jwt.sign({ id: userid, role }, process.env.JWT_SEC, { expiresIn: "3d" });
};

// Nodemailer Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 1. Register
authRouter.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existUser = await User.findOne({ name });
    if (existUser) return res.status(400).json({ message: "Username already exists" });

    const existEmail = await User.findOne({ email });
    if (existEmail) return res.status(400).json({ message: "Email already exists" });

    if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });

    const user = new User({
      name,
      email,
      password,           // pre-save hook hashes it
      role: role || "student",
    });

    await user.save();

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      message: "Successfully registered",
      token,
      user: { id: user._id, name, email, role: user.role },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// 2. Login
authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ message: "All fields are required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email, role: user.role },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// 3. Forgot Password – Send OTP
authRouter.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "No account found with this email" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000;

    user.resetOTP = otp;
    user.resetOTPExpires = otpExpires;
    await user.save();

    const mailOptions = {
      from: `"ASTU-STEM " <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Code",
      text: `Your 6-digit code is: ${otp}\nValid for 10 minutes.`,
      html: `<h2>Password Reset</h2><p>Your code: <strong>${otp}</strong></p><p>Valid for 10 minutes.</p>`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "A 6-digit code has been sent to your email" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Failed to send reset code" });
  }
});

// 4. Verify OTP
authRouter.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp || otp.length !== 6) return res.status(400).json({ message: "Email and 6-digit OTP required" });

    const user = await User.findOne({ email });
    if (!user || !user.resetOTP || user.resetOTP !== otp) return res.status(400).json({ message: "Invalid OTP" });

    if (!user.resetOTPExpires || user.resetOTPExpires < Date.now()) return res.status(400).json({ message: "OTP has expired" });

    res.status(200).json({
      message: "OTP verified successfully",
      userId: user._id.toString(),
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// 5. Reset Password – auto-login after success
authRouter.post("/reset-password", async (req, res) => {
  try {
    const { userId, newPassword } = req.body;

    if (!userId || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "User ID and new password (min 6 characters) required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Set new password – pre-save hook will hash it
    user.password = newPassword;
    user.markModified("password");  // Force hook to run

    user.resetOTP = undefined;
    user.resetOTPExpires = undefined;

    await user.save();

    // Auto-login
    const token = generateToken(user._id, user.role);

    res.status(200).json({
      message: "Password reset successful. You are now logged in.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// 6. Update device token
authRouter.post("/update-device-token", Protect(), async (req, res) => {
  try {
    const { deviceToken } = req.body;
    if (!deviceToken) return res.status(400).json({ message: "Device token required" });

    await User.findByIdAndUpdate(req.user.id, { deviceToken });

    res.status(200).json({ message: "Device token updated" });
  } catch (error) {
    console.error("Update device token error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default authRouter;