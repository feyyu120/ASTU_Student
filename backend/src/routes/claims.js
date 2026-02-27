import express from "express";
import Claim from "../models/claim.js";
import Item from "../models/item.js";
import User from "../models/user.js";
import Protect from "../middleware/auth.js";
import sendNotification from "../utils/notifications.js";

const claimsRouter = express.Router();

claimsRouter.post("/:itemId", Protect(['student']), async (req, res) => {
  try {
    const item = await Item.findById(req.params.itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });
    if (item.status !== 'pending') {
      return res.status(400).json({ message: "This item is no longer available for claiming" });
    }

   
    const existing = await Claim.findOne({
      itemId: req.params.itemId,
      claimantId: req.user.id,
      status: 'pending'
    });
    if (existing) {
      return res.status(400).json({ message: "You already have a pending claim for this item" });
    }

    const claim = new Claim({
      itemId: req.params.itemId,
      claimantId: req.user.id,
      status: 'pending',
      date: new Date(),
    });

    await claim.save();

    await Item.findByIdAndUpdate(req.params.itemId, { status: 'claimed' });

    res.status(201).json({ 
      message: "Claim submitted successfully",
      claimId: claim._id 
    });
  } catch (error) {
    console.error("Claim submit error:", error);
    res.status(500).json({ message: "Server error while submitting claim" });
  }
});

claimsRouter.get("/pending", Protect(['admin']), async (req, res) => {
  try {
    const claims = await Claim.find({ status: 'pending' })
      .populate('itemId', 'description category location imageUrl type')
      .populate('claimantId', 'name email')
      .sort({ date: -1 })
      .lean();

    res.json(claims);
  } catch (error) {
    console.error("Fetch pending claims error:", error);
    res.status(500).json({ message: "Server error fetching pending claims" });
  }
});



claimsRouter.put("/:claimId", Protect(['admin']), async (req, res) => {
  try {
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: "Invalid status. Must be 'approved' or 'rejected'" });
    }

    const claim = await Claim.findById(req.params.claimId);
    if (!claim) return res.status(404).json({ message: "Claim not found" });

    if (claim.status !== 'pending') {
      return res.status(400).json({ message: `Claim already ${claim.status}` });
    }

    claim.status = status;
    claim.processedAt = new Date();
    await claim.save();

    const item = await Item.findById(claim.itemId);
    if (item) {
      item.status = status === 'approved' ? 'resolved' : 'pending';
      await item.save();
    }

    const claimant = await User.findById(claim.claimantId);
    if (claimant) {
      console.log(`Sending notification to user: ${claimant._id}`); 

      await sendNotification(
        claimant.deviceToken,
        `Your claim has been ${status}`,
        `Claim for "${item?.description || 'item'}" was ${status}.`,
        claimant._id,
        item?._id
      );
    } else {
      console.log('No claimant found for claim:', claim._id);
    }

    res.json({ 
      message: `Claim ${status} successfully`,
      claim 
    });
  } catch (error) {
    console.error("Claim update error:", error);
    res.status(500).json({ message: "Server error while processing claim" });
  }
});

export default claimsRouter;