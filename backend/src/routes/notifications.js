import express from 'express';
import Notification from "../models/notification.js";
import Protect from '../middleware/auth.js';

const notificationRouter = express.Router();

// 1. Create a new notification (can be called from backend utils or admin)
notificationRouter.post('/create', Protect(['admin']), async (req, res) => {
  try {
    const { userId, title, body, type = 'claim_update', relatedItemId } = req.body;

    if (!userId || !title || !body) {
      return res.status(400).json({ message: "Missing required fields (userId, title, body)" });
    }

    const notification = new Notification({
      userId,
      title,
      body,
      type,
      relatedItemId,
      read: false,
      createdAt: new Date(),
    });

    await notification.save();

    res.status(201).json({ 
      message: "Notification created successfully",
      notification 
    });
  } catch (err) {
    console.error("Create notification error:", err);
    res.status(500).json({ message: "Server error creating notification" });
  }
});

// 2. Get all notifications for logged-in user
notificationRouter.get('/', Protect(), async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 3. Get unread count for logged-in user
notificationRouter.get('/unread-count', Protect(), async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user.id,
      read: false
    });
    res.json({ unreadCount: count });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 4. Mark one as read
notificationRouter.put('/:id/read', Protect(), async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { read: true },
      { new: true }
    );

    if (!notification) return res.status(404).json({ message: 'Notification not found' });

    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default notificationRouter;