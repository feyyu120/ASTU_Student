// utils/notification.js
import admin from './firebaseAdmin.js';
import Notification from '../models/notification.js';
import User from '../models/user.js';

const sendNotification = async (
  deviceTokens, 
  title, 
  body, 
  userId = null, 
  type = 'claim_update', 
  relatedItemId = null
) => {
  try {
    // Normalize tokens to array
    let tokens = Array.isArray(deviceTokens) ? deviceTokens : [deviceTokens];
    tokens = tokens.filter(t => t && typeof t === 'string' && t.trim().length > 20);

    if (tokens.length === 0 && !userId) {
      console.log('No valid tokens and no userId – skipping notification');
      return { success: false, skipped: true };
    }

    // 1. Save to DB (always, even if push fails)
    let dbNotif = null;
    if (userId) {
      dbNotif = new Notification({
        userId,
        title,
        body,
        type,
        relatedItemId,
        read: false,
        createdAt: new Date(),
      });
      await dbNotif.save();
      console.log(`DB notification saved for user ${userId} (ID: ${dbNotif._id})`);
    } else if (tokens.length > 0) {
      // If no userId but tokens exist (e.g. multicast to admins), skip DB or handle differently
      console.log('Multicast to admins – no DB save (no specific userId)');
    }

    // 2. Send real push (FCM)
    if (tokens.length > 0) {
      const message = {
        tokens, // multicast if multiple
        notification: {
          title,
          body,
        },
        data: {
          type,
          itemId: relatedItemId ? relatedItemId.toString() : null,
          notificationId: dbNotif?._id?.toString() || null,
        },
        android: {
          priority: 'high',
          notification: {
            channelId: 'default',
            sound: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
            },
          },
        },
      };

      try {
        const response = await admin.messaging().sendMulticast(message);
        console.log(
          `Push sent to ${tokens.length} tokens. Success: ${response.successCount}, Failed: ${response.failureCount}`
        );

        // Handle failed tokens (invalid/expired)
        if (response.failureCount > 0) {
          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              const err = resp.error;
              console.warn(`Failed token ${tokens[idx]}: ${err?.message || 'Unknown error'}`);
              if (err?.code === 'messaging/registration-token-not-registered' || err?.code === 'messaging/invalid-argument') {
                // Clear invalid token from DB (optional but recommended)
                User.updateOne(
                  { deviceToken: tokens[idx] },
                  { $unset: { deviceToken: 1 } }
                ).catch(e => console.error('Failed to clear invalid token:', e));
              }
            }
          });
        }
      } catch (pushErr) {
        console.error('FCM send error:', pushErr);
        // Still return success for DB part
      }
    } else {
      console.log(`No valid device tokens – push skipped`);
    }

    return { success: true, notificationId: dbNotif?._id?.toString() };
  } catch (error) {
    console.error('Notification send error:', error);
    return { success: false, error };
  }
};

export default sendNotification;