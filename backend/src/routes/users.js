// routes/users.js
import express from "express";
import Protect from "../middleware/auth.js";
import User from "../models/user.js";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "cloudinary";
import "dotenv/config";

const  profileRouter= express.Router();

const storage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: {
    folder: "astu-lostfound/avatars",          
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    transformation: [{ width: 400, height: 400, crop: "fill" }], 
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 }, 
});

// ─── Update profile picture ───
 profileRouter.patch("/profile-picture", Protect(), upload.single("avatar"), async (req, res) => {
  try {
    // No file uploaded
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Delete old picture if exists
    if (user.profilePicture) {
      try {
        const publicId = user.profilePicture.split("/").slice(-2).join("/").split(".")[0];
        await cloudinary.v2.uploader.destroy(publicId);
        console.log(`Deleted old avatar: ${publicId}`);
      } catch (err) {
        console.warn("Failed to delete old avatar:", err);
        // continue anyway — don't fail the whole request
      }
    }

    // Save new URL
    user.profilePicture = req.file.path;
    await user.save();

    // Return updated user (without password)
    const updatedUser = await User.findById(req.user.id).select("-password");

    res.json({
      message: "Profile picture updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Profile picture update error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Optional: Get current user profile (useful for home screen refresh)
 profileRouter.get("/me", Protect(), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default profileRouter;