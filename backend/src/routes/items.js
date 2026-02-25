import express from "express";
import Item from "../models/item.js";
import Protect from "../middleware/auth.js"; // Your JWT auth middleware
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "cloudinary";
import "dotenv/config";

// Configure Cloudinary from .env
cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer + Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: {
    folder: "astu-lostfound/items",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    transformation: [{ width: 800, height: 800, crop: "limit" }],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

const itemsRouter = express.Router();

// ───────────────────────────────────────────────
// 1. Report lost or found item (protected)
itemsRouter.post("/report", Protect(), upload.single("image"), async (req, res) => {
  try {
    const { type, description, category, location } = req.body;

    // Validate
    if (!type || !description || !category || !location) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (!["lost", "found"].includes(type)) {
      return res.status(400).json({ message: "Type must be 'lost' or 'found'" });
    }

    const imageUrl = req.file ? req.file.path : null;

    const item = new Item({
      type,
      description,
      category,
      location,
      imageUrl,
      ownerId: req.user.id,
      status: "pending",
    });

    await item.save();

    res.status(201).json({
      message: "Item reported successfully",
      item,
    });
  } catch (error) {
    console.error("Report error:", error);
    res.status(500).json({ message: "Server error while reporting item", error: error.message });
  }
});

// ───────────────────────────────────────────────
// 2. Search items (public - case-insensitive partial match)
// 2. Search items (public - more forgiving)
// 2. Search items (public - smarter & more forgiving)
itemsRouter.get("/search", async (req, res) => {
  try {
    const { q } = req.query; // Use single ?q= parameter for simplicity (category/location/description)

    let query = {};

    if (q?.trim()) {
      const words = q.trim().split(/\s+/); // split by space
      const regex = new RegExp(words.join("|"), "i"); // case-insensitive OR match any word

      query.$or = [
        { category: { $regex: regex } },
        { location: { $regex: regex } },
        { description: { $regex: regex } }, // search in description too
      ];
    }

    const items = await Item.find(query)
      .sort({ date: -1 })
      .limit(50);

    console.log(`Search → query: ${q || "(empty)"}, found: ${items.length} items`);

    res.status(200).json(items);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Server error during search" });
  }
});

// ───────────────────────────────────────────────
// 3. Get my posted items (protected)
itemsRouter.get("/my-items", Protect(), async (req, res) => {
  try {
    const userId = req.user.id; // string from JWT

    const items = await Item.find({ ownerId: userId })
      .sort({ date: -1 })
      .lean();

    console.log(`My-items for user ${userId}: ${items.length} items found`);

    res.json(items);
  } catch (error) {
    console.error("My-items error:", error);
    res.status(500).json({ message: "Server error loading your items" });
  }
});

// ───────────────────────────────────────────────
// 4. Delete my item (protected - owner only)
itemsRouter.delete("/:id", Protect(), async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    if (item.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only delete your own items" });
    }

    // Delete from Cloudinary if image exists
    if (item.imageUrl) {
      const parts = item.imageUrl.split("/");
      const publicIdWithExt = parts.slice(-2).join("/"); // folder/filename.ext
      const publicId = publicIdWithExt.split(".")[0]; // remove extension

      await cloudinary.v2.uploader.destroy(publicId);
      console.log(`Deleted Cloudinary: ${publicId}`);
    }

    await Item.deleteOne({ _id: req.params.id });

    res.json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: "Server error while deleting item" });
  }
});

// ───────────────────────────────────────────────
// 5. Get all items (admin only)
itemsRouter.get("/", Protect(["admin"]), async (req, res) => {
  try {
    const items = await Item.find().sort({ date: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default itemsRouter;