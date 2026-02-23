import express from "express";
import Claim from "../models/claim.js";
import Item from "../models/item.js";
import User from "../models/user.js";
import Protect from "../middleware/auth.js";
import { sendNotification } from "../utils/notifications.js";

const claimsRouter = express.Router();

// Submit claim (student)
claimsRouter.post("/:itemId", Protect(['student']), async (req, res) => {
  try {
    const claim = new Claim({
      itemId: req.params.itemId,
      claimantId: req.user.id
    });
    await claim.save();
    await Item.findByIdAndUpdate(req.params.itemId, { status: 'claimed' });
    res.status(201).json({ message: "Claim submitted" });
  } catch (error) {
    res.status(500).json({ error });
  }
});

// Approve/reject claim (admin)
claimsRouter.put("/:claimId", Protect(['admin']), async (req, res) => {
  try {
    const { status } = req.body;  // 'approved' or 'rejected'
    const claim = await Claim.findByIdAndUpdate(req.params.claimId, { status }, { new: true });
    if (!claim) return res.status(404).json({ message: "Claim not found" });

    const item = await Item.findById(claim.itemId);
    item.status = status === 'approved' ? 'resolved' : 'pending';
    await item.save();

    // Notify claimant
    const claimant = await User.findById(claim.claimantId);
    const title = `Claim ${status}`;
    const body = `Your claim for ${item.description} has been ${status}.`;
    await sendNotification(claimant.deviceToken, title, body);

    res.json({ message: `Claim ${status}` });
  } catch (error) {
    res.status(500).json({ error });
  }
});

export default claimsRouter;