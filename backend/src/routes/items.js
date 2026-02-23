import express from "express";
import Item from "../models/item.js";
import Protect from "../middleware/auth.js"; // Your auth middleware
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "cloudinary";
import "dotenv/config"; 

// Configure Cloudinary (use your real credentials)
cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// Multer + Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: {
    folder: "astu-lostfound/items", // Folder name in Cloudinary
    allowed_formats: ["jpg", "png", "jpeg"],
    transformation: [{ width: 800, height: 800, crop: "limit" }], // Optional: resize
  },
});

const upload = multer({ storage });

const itemsRouter = express.Router();

// Report lost or found item (protected route)
itemsRouter.post("/report", Protect(), upload.single("image"), async (req, res) => {
  try {
    const { type, description, category, location } = req.body;

    // Validate required fields
    if (!type || !description || !category || !location) {
      return res.status(400).json({ message: "All text fields are required" });
    }

    // Get Cloudinary secure URL if image was uploaded
    const imageUrl = req.file ? req.file.path : null; // Cloudinary gives secure URL in .path

    const item = new Item({
      type,
      description,
      category,
      location,
      imageUrl, // Now points to https://res.cloudinary.com/... (secure URL)
      ownerId: req.user.id,
    });

    await item.save();

    res.status(201).json({
      message: "Item reported successfully",
      item,
    });
  } catch (error) {
    console.error("Report error:", error);
    res.status(500).json({
      message: "Server error while reporting item",
      error: error.message,
    });
  }
});

// Search items (public or auth)
itemsRouter.get("/search", async (req, res) => {
  try {
    const { category, date, location, type } = req.query;
    let query = {};

    if (category) query.category = category;
    if (type) query.type = type;
    if (location) query.location = { $regex: location, $options: "i" };
    if (date) query.date = { $gte: new Date(date) };

    const items = await Item.find(query).sort({ date: -1 }); // Newest first
    res.status(200).json(items);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Server error during search" });
  }
});

// Get all items (for admin or debugging)
itemsRouter.get("/", async (req, res) => {
  try {
    const items = await Item.find().sort({ date: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default itemsRouter;