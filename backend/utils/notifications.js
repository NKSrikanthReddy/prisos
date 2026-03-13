// notifications.js — send FCM push via Firebase Admin SDK
const admin = require('firebase-admin');
const User  = require('../models/User');

// Initialize once (called from server.js)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    })
  });
}

// Send notification to all users within ~5 km of [lng, lat]
exports.sendToNearbyUsers = async ([lng, lat], { title, body, data }) => {
  try {
    const nearbyUsers = await User.find({
      role: 'customer',
      fcmToken: { $exists: true, $ne: null },
      location: {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: 5000
        }
      }
    }).select('fcmToken');

    const tokens = nearbyUsers.map(u => u.fcmToken).filter(Boolean);
    if (tokens.length === 0) return;

    // Batch in groups of 500 (FCM limit)
    for (let i = 0; i < tokens.length; i += 500) {
      const batch = tokens.slice(i, i + 500);
      await admin.messaging().sendEachForMulticast({
        tokens: batch,
        notification: { title, body },
        data: data || {}
      });
    }
    console.log(`Notified ${tokens.length} nearby users`);
  } catch (err) {
    console.error('Push notification error:', err.message);
  }
};
