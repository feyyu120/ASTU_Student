
import admin from 'firebase-admin';
import Notification from '../models/notification.js';

const sendNotification = async (deviceToken, title, body, userId, relatedItemId = null) => {
  try {
    // Save to DB directly
    const notification = new Notification({
      userId,
      title,
      body,
      type: 'claim_update',
      relatedItemId,
      read: false,
      createdAt: new Date(),
    });
    await notification.save();

    console.log(`Notification saved for user ${userId}`);

    // Send push
    if (deviceToken) {
      const message = {
        token: deviceToken,
        notification: { title, body },
      };
      await admin.messaging().send(message);
      console.log(`Push sent`);
    }
  } catch (error) {
    console.error('Notification error:', error);
  }
};
   

export default sendNotification;