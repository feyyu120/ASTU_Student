import express from "express";
import Item from "../models/item.js";
import Protect from "../middleware/auth.js"; 
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "cloudinary";
import "dotenv/config";

cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


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
  limits: { fileSize: 5 * 1024 * 1024 }, 
});

const itemsRouter = express.Router();

itemsRouter.post("/report", Protect(), upload.single("image"), async (req, res) => {
  try {
    const { type, description, category, location } = req.body;

   
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

itemsRouter.patch("/:id", Protect(), upload.single("image"), async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    if (item.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only edit your own items" });
    }

    if (req.body.description) item.description = req.body.description;
    if (req.body.category) item.category = req.body.category;
    if (req.body.location) item.location = req.body.location;

    if (req.file) {
    
      if (item.imageUrl) {
        const publicId = item.imageUrl.split("/").slice(-2).join("/").split(".")[0];
        await cloudinary.v2.uploader.destroy(publicId);
      }
      item.imageUrl = req.file.path; 
    }

    item.updatedAt = Date.now();
    await item.save();

    res.json({ message: "Item updated successfully", item });
  } catch (error) {
    console.error("Edit error:", error);
    res.status(500).json({ message: "Server error while updating item" });
  }
});



itemsRouter.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    let query = {};

    if (q?.trim()) {
      const words = q.trim().split(/\s+/);
      const regex = new RegExp(words.join("|"), "i");
      query.$or = [
        { category: { $regex: regex } },
        { location: { $regex: regex } },
        { description: { $regex: regex } },
      ];
    }

    const items = await Item.find(query)
      .populate({
        path: 'ownerId',
        select: 'name profilePicture'   
      })
      .sort({ date: -1 })
      .limit(50);

    res.status(200).json(items);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Server error during search" });
  }
});

itemsRouter.get("/my-items", Protect(), async (req, res) => {
  try {
    const userId = req.user.id; 

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


itemsRouter.delete("/:id", Protect(), async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    if (item.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only delete your own items" });
    }

    if (item.imageUrl) {
      const parts = item.imageUrl.split("/");
      const publicIdWithExt = parts.slice(-2).join("/"); 
      const publicId = publicIdWithExt.split(".")[0]; 

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

itemsRouter.get("/", Protect(["admin"]), async (req, res) => {
  try {
    const items = await Item.find().sort({ date: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default itemsRouter;