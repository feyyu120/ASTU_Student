import express from "express";
import User from "../models/user.js";     
import Item from "../models/item.js";
import Claim from "../models/claim.js";
import Protect from "../middleware/auth.js";

const adminRouter = express.Router();

adminRouter.get("/stats", Protect(['admin']), async (req, res) => {
  try {
    const totalUsers      = await User.countDocuments();
    const totalItems      = await Item.countDocuments();
    const pendingClaims   = await Claim.countDocuments({ status: 'pending' });
    const resolvedItems   = await Item.countDocuments({ status: 'resolved' });

    const totalLost       = await Item.countDocuments({ type: 'lost' });
    const totalFound      = await Item.countDocuments({ type: 'found' });
    const totalClaimed    = await Item.countDocuments({ status: 'claimed' });

    res.status(200).json({
      totalUsers,
      totalItems,
      pendingClaims,
      resolvedItems,

      totalLost,
      totalFound,
      totalClaimed
    });
  } catch (error) {
    console.error("Admin stats error:", error.message);
    res.status(500).json({ 
      message: "Server error while fetching admin stats",
      error: error.message 
    });
  }
});

export default adminRouter;