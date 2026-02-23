// src/utils/notifications.js
import admin from 'firebase-admin';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let serviceAccount;
try {
  const filePath = path.join(__dirname, '../../.firebase/service-account.json');
  const raw = await fs.readFile(filePath, 'utf8');
  serviceAccount = JSON.parse(raw);
} catch (err) {
  console.error('Failed to load service account JSON:', err.message);
  console.error('Checked path:', filePath);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

console.log('Firebase Admin initialized successfully');
console.log('Project ID:', serviceAccount.project_id);

export const sendNotification = async (deviceToken, title, body) => {
  if (!deviceToken) {
    console.log('No device token → skipping notification');
    return;
  }

  try {
    await admin.messaging().send({
      token: deviceToken,
      notification: { title, body }
    });
    console.log('Notification sent successfully');
  } catch (error) {
    console.error('Error sending FCM notification:', error.message);
  }
};