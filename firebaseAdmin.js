// firebaseAdmin.js
import admin from 'firebase-admin';

if (!process.env.FIREBASE_KEY) {
  throw new Error('FIREBASE_KEY is not defined in environment variables');
}

const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

export { admin, db };
