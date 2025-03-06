// src/config/firebaseConfig.js
const admin = require('firebase-admin');
const serviceAccount = require('../../serviceAccountKey.json'); // Ganti dengan path file key Anda

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
console.log('Connected to Firebase successfully!');

module.exports = db;
