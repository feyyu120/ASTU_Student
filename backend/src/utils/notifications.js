// utils/notifications.js
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
    // Normalize tokens to array and filter invalid/empty
    let tokens = Array.isArray(deviceTokens) ? deviceTokens : [deviceTokens];
    tokens = tokens.filter(t => t && typeof t === 'string' && t.trim().length > 20 && t.startsWith('ExponentPushToken')); // Expo tokens usually start like this

    if (tokens.length === 0) {
      console.log('No valid Expo push tokens provided – skipping push');
      // Still save DB notif if userId exists
    }

    // 1. Save to DB (persistent in-app record) – always for user-specific
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
    } else {
      console.log('Multicast (e.g. admins) – no specific DB save');
    }

    // 2. Send real push via FCM only if we have tokens
    if (tokens.length > 0) {
      const message = {
        tokens, // multicast
        notification: {
          title,
          body,
        },
        data: {
          type,
          itemId: relatedItemId ? relatedItemId.toString() : null,
          notificationId: dbNotif?._id?.toString() || null,
          // Optional: for deep linking when tapped
          click_action: 'FCM_PLUGIN_ACTIVITY', // helps some Android routing
        },
        android: {
          priority: 'high', // already good
          notification: {
            channelId: 'default', // matches your app channel
            sound: 'default',
            // Add tag/group for collapsing duplicates if needed
            tag: type, // e.g. group similar notifications
            // clickAction: 'your.custom.scheme://path' if using deep links
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              // Optional: badge if you track it server-side
              // badge: someBadgeCount,
            },
          },
        },
        // Optional: web push if needed later
      };

      try {
        const response = await admin.messaging().sendMulticast(message);
        console.log(
          `FCM multicast sent to ${tokens.length} tokens. Success: ${response.successCount}, Failed: ${response.failureCount}`
        );

        // Clean up invalid/expired tokens
        if (response.failureCount > 0) {
          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              const err = resp.error;
              console.warn(`Failed for token ${tokens[idx]}: ${err?.message || 'Unknown'}`);
              if (
                err?.code === 'messaging/registration-token-not-registered' ||
                err?.code === 'messaging/invalid-argument' ||
                err?.code === 'messaging/registration-token-not-registered'
              ) {
                // Remove invalid token from user
                User.updateOne(
                  { deviceToken: tokens[idx] },
                  { $unset: { deviceToken: '' } }
                ).catch(e => console.error('Failed to unset invalid token:', e));
              }
            }
          });
        }
      } catch (pushErr) {
        console.error('FCM multicast error:', pushErr);
        // Don't fail the whole function – DB save succeeded
      }
    } else {
      console.log('No valid tokens – only DB notification saved (if userId provided)');
    }

    return { success: true, notificationId: dbNotif?._id?.toString() };
  } catch (error) {
    console.error('Full notification send error:', error);
    return { success: false, error: error.message };
  }
};

export default sendNotification;