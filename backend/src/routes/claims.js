import express from "express";
import Claim from "../models/claim.js";
import Item from "../models/item.js";
import User from "../models/user.js";
import Protect from "../middleware/auth.js";
import sendNotification from "../utils/notifications.js";

const claimsRouter = express.Router();

// 1. User: Submit a claim for an item
claimsRouter.post("/:itemId", Protect(['student']), async (req, res) => {
  try {
    const itemId = req.params.itemId;
    const claimantId = req.user.id;

    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });

    if (item.status !== 'pending') {
      return res.status(400).json({ message: "This item is no longer available for claiming" });
    }

    // Prevent duplicate pending claims
    const existing = await Claim.findOne({
      itemId,
      claimantId,
      status: 'pending'
    });
    if (existing) {
      return res.status(400).json({ message: "You already have a pending claim for this item" });
    }

    const claim = new Claim({
      itemId,
      claimantId,
      status: 'pending',
      date: new Date(),
    });

    await claim.save();

    // Update item status to claimed (or keep pending – your choice)
    await Item.findByIdAndUpdate(itemId, { status: 'claimed' });

    // Notify the claimant (confirmation)
    const claimant = await User.findById(claimantId);
    if (claimant?.deviceToken) {
      await sendNotification(
        claimant.deviceToken,
        "Claim Submitted – Action Required",
        "Your claim has been submitted. Please check notifications to provide your details and ID photo.",
        claimant._id,
        'claim_submitted',
        itemId
      );
      console.log(`Confirmation push sent to claimant ${claimantId}`);
    }

    // Notify all admins
    const admins = await User.find({ role: 'admin' });
    const adminTokens = admins
      .map(admin => admin.deviceToken)
      .filter(Boolean);

    if (adminTokens.length > 0) {
      await sendNotification(
        adminTokens, // array of tokens – sendNotification should handle multicast
        "New Claim Request",
        `${req.user.name} has claimed item: ${item.description.slice(0, 60)}...`,
        null, // no specific userId (admins group)
        'claim_request',
        itemId
      );
      console.log(`New claim alert sent to ${adminTokens.length} admins`);
    }

    res.status(201).json({ 
      message: "Claim submitted successfully. Check notifications to upload your ID photo.",
      claimId: claim._id 
    });
  } catch (error) {
    console.error("Claim submit error:", error);
    res.status(500).json({ message: "Server error while submitting claim" });
  }
});

// 2. Admin: Get all pending claims
claimsRouter.get("/pending", Protect(['admin']), async (req, res) => {
  try {
    const claims = await Claim.find({ status: 'pending' })
      .populate('itemId', 'description category location imageUrl type')
      .populate('claimantId', 'name email profilePicture')
      .sort({ date: -1 })
      .lean();

    res.json(claims);
  } catch (error) {
    console.error("Fetch pending claims error:", error);
    res.status(500).json({ message: "Server error fetching pending claims" });
  }
});

// 3. Admin: Approve or Reject a claim
claimsRouter.put("/:claimId", Protect(['admin']), async (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'

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
    claim.processedBy = req.user.id; // optional: track who processed it
    await claim.save();

    const item = await Item.findById(claim.itemId);
    if (item) {
      if (status === 'approved') {
        item.status = 'resolved';
        // Optional: delete item after approval (uncomment if needed)
        // await Item.deleteOne({ _id: item._id });
        // console.log(`Item ${item._id} deleted after approval`);
      } else {
        item.status = 'pending'; // back to available if rejected
      }
      await item.save();
    }

    // Notify the claimant about the decision
    const claimant = await User.findById(claim.claimantId);
    if (claimant?.deviceToken) {
      await sendNotification(
        claimant.deviceToken,
        `Claim ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        `Your claim for "${item?.description || 'the item'}" was ${status} by admin.`,
        claimant._id,
        status === 'approved' ? 'claim_approved you can collect it at B-302 in front of special dorm' : 'claim_rejected',
        claim.itemId
      );
      console.log(`Decision push sent to claimant ${claim.claimantId} – ${status}`);
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