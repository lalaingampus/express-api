// src/models/userModel.js
const db = require('../config/firebaseConfig');

const UserModel = {
  // Fungsi untuk mendapatkan user berdasarkan username
  getUserByUsername: async (username) => {
    const snapshot = await db.collection('users').where('username', '==', username).get();
    if (snapshot.empty) {
      throw new Error('User not found');
    }
    return snapshot.docs[0];
  },

  // Fungsi untuk membuat user baru
  createUser: async (username, email, password) => {
    const userRef = await db.collection('users').add({
      username,
      email,
      password,
      createdAt: new Date(),
    });
    return userRef;
  },

  // Fungsi untuk mendapatkan semua users
  getAllUsers: async () => {
    const snapshot = await db.collection('users').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  forgotPassword: async () => {
    return ''
  }
};

module.exports = UserModel;
