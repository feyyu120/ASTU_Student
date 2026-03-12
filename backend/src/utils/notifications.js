
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
    // Normalize tokens to array and filter obviously invalid ones
    let tokens = Array.isArray(deviceTokens) ? deviceTokens : [deviceTokens];
    tokens = tokens.filter(t => 
      t && 
      typeof t === 'string' && 
      t.trim().length > 20 && 
      t.startsWith('ExponentPushToken')
    );

    if (tokens.length === 0) {
      console.log('No valid Expo push tokens → skipping FCM push');
    }

    // 1. Always save to database (persistent record)
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
      console.log(`DB notification saved → user: ${userId} | id: ${dbNotif._id}`);
    }

    // 2. Send push notification only if we have valid tokens
    if (tokens.length > 0) {
      const message = {
        tokens, // multicast

        // This part ensures the notification is visible even when app is killed
        notification: {
          title,
          body,
        },

        // Custom data your app can read
        data: {
          type,
          itemId: relatedItemId ? relatedItemId.toString() : null,
          notificationId: dbNotif?._id?.toString() || null,
          click_action: 'FCM_PLUGIN_ACTIVITY', // helps some Android deep linking
        },

        android: {
          // Critical for visibility & priority on Android
          priority: 'high',
          collapseKey: type,                    // group similar notifications
          ttl: 2419200,                         // 28 days - very long TTL

          notification: {
            channelId: 'default',               // MUST match your Expo channel name
            sound: 'default',
            tag: type,                          // collapse key for same-type notifs
            priority: 'high',                   // extra emphasis (some devices need it)
            defaultVibrateTimings: true,
            defaultSound: true,
            defaultLightSettings: true,
            // Optional but recommended: color
            color: '#6366f1',                   // your app's primary color (indigo)
              // custom icon name (if you added one)
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
          `FCM multicast → ${tokens.length} tokens | Success: ${response.successCount} | Failed: ${response.failureCount}`
        );

        // Handle failed deliveries → clean up invalid tokens
        if (response.failureCount > 0) {
          const failedTokens = [];
          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              const err = resp.error;
              console.warn(`Token failed: ${tokens[idx]} → ${err?.message || 'Unknown error'}`);

              if (
                err?.code === 'messaging/registration-token-not-registered' ||
                err?.code === 'messaging/invalid-argument' ||
                err?.code === 'messaging/invalid-registration-token'
              ) {
                failedTokens.push(tokens[idx]);
              }
            }
          });

          // Bulk remove invalid tokens
          if (failedTokens.length > 0) {
            await User.updateMany(
              { deviceToken: { $in: failedTokens } },
              { $unset: { deviceToken: '' } }
            );
            console.log(`Removed ${failedTokens.length} invalid/expired tokens`);
          }
        }
      } catch (pushErr) {
        console.error('FCM sendMulticast failed:', pushErr.message);
        // Do NOT throw — we still want DB record to exist
      }
    }

    return {
      success: true,
      notificationId: dbNotif?._id?.toString() || null,
    };
  } catch (error) {
    console.error('sendNotification failed:', error);
    return { success: false, error: error.message };
  }
};

export default sendNotification;