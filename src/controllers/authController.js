// src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');
const jwtService = require('../services/jwtService');

// Fungsi untuk registrasi
const register = async (req, res) => {
  const { email, username, password } = req.body;

  try {
    // Cek apakah username sudah ada
    const user = await UserModel.getUserByUsername(username);
    if (user) {
      return res.status(400).send('Username already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Simpan user baru ke Firestore
    await UserModel.createUser(username, email, hashedPassword);

    res.status(200).send('User registered successfully');
  } catch (error) {
    res.status(500).send('Error registering user: ' + error);
  }
};

// Fungsi untuk login
const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const userDoc = await UserModel.getUserByUsername(username);
    const user = userDoc.data();

    // Verifikasi password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).send('Username or password incorrect');
    }

    // Generate JWT token
    const token = jwtService.generateToken(userDoc.id, user.username);

    res.json({ token });
  } catch (error) {
    res.status(401).send('Username or password incorrect');
  }
};

// Fungsi untuk mendapatkan daftar users
const getUsers = async (req, res) => {
  try {
    const users = await UserModel.getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).send('Error getting users: ' + error);
  }
};

module.exports = {
  register,
  login,
  getUsers,
};
