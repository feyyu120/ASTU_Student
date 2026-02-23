import express from "express";
import Item from "../models/item.js";
import Claim from "../models/claim.js";
import Protect from "../middleware/auth.js";

const adminRouter = express.Router();

adminRouter.get("/stats", Protect(['admin']), async (req, res) => {
  try {
    const totalLost = await Item.countDocuments({ type: 'lost' });
    const totalFound = await Item.countDocuments({ type: 'found' });
    const totalClaimed = await Item.countDocuments({ status: 'claimed' });
    const totalResolved = await Item.countDocuments({ status: 'resolved' });

    res.json({ totalLost, totalFound, totalClaimed, totalResolved });
  } catch (error) {
    res.status(500).json({ error });
  }
});

export default adminRouter;