// routes/notifications.js (or claimDetails.js)
import express from 'express';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from 'cloudinary';
import Protect from '../middleware/auth.js';
import ClaimDetail from '../models/claimDetail.js';
import Claim from '../models/claim.js';
import sendNotification from '../utils/notifications.js';
const claimsDetail = express.Router();

// Configure Cloudinary (already in your server probably)
cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: {
    folder: 'astu-lostfound/claim-details',
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});

const upload = multer({ storage });

// User sends details + ID photo
claimsDetail.post('/reply', Protect(['student']), upload.single('image'), async (req, res) => {
  try {
    const { content } = req.body;
    const imageUrl = req.file ? req.file.path : null;

    // Optional: You can link to latest claim or pass claimId from frontend
    const latestClaim = await Claim.findOne({
      claimantId: req.user.id,
      status: 'pending'
    }).sort({ date: -1 });

    if (!latestClaim) {
      return res.status(400).json({ message: "No active claim found" });
    }

    const detail = new ClaimDetail({
      claimId: latestClaim._id,
      userId: req.user.id,
      content,
      imageUrl,
    });

    await detail.save();

    // Optional: Notify admin
    await sendNotification(
      null, // admin token or skip push
      'New Claim Details Received',
      `User sent ID/details for claim on ${latestClaim.itemId}`,
      'ADMIN_USER_ID', // replace with admin ID
      latestClaim.itemId
    );

    res.status(201).json({ message: 'Details sent successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get claim details for a specific claim
claimsDetail.get('/claim/:claimId/details', Protect(['admin']), async (req, res) => {
  try {
    const details = await ClaimDetail.find({ claimId: req.params.claimId })
      .populate('userId', 'name email profilePicture')
      .sort({ createdAt: -1 });

    res.json(details);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default claimsDetail;