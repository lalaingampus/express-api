// src/routes/authRoutes.js
const express = require('express');
const authController = require('../controllers/authController');
const authenticateJWT = require('../middlewares/authenticateJWT');

const router = express.Router();

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Mendaftar pengguna baru
 *     description: Endpoint untuk mendaftarkan pengguna baru dan menyimpan ke Firestore.
 *     parameters:
 *       - name: username
 *         in: body
 *         description: Nama pengguna
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - username
 *             - password
 *           properties:
 *             username:
 *               type: string
 *             password:
 *               type: string
 *     responses:
 *       200:
 *         description: Pengguna berhasil terdaftar
 *       400:
 *         description: Username sudah ada
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login pengguna dan dapatkan JWT
 *     description: Endpoint untuk login dan mendapatkan token JWT.
 *     parameters:
 *       - name: username
 *         in: body
 *         description: Nama pengguna
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - username
 *             - password
 *           properties:
 *             username:
 *               type: string
 *             password:
 *               type: string
 *     responses:
 *       200:
 *         description: Token JWT berhasil dibuat
 *       401:
 *         description: Username atau password salah
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Mendapatkan daftar users
 *     description: Endpoint untuk mendapatkan daftar pengguna dari Firestore
 *     security:
 *       - jwtAuth: []
 *     responses:
 *       200:
 *         description: Daftar users
 *       401:
 *         description: Unauthorized jika token tidak valid
 */
router.get('/users', authenticateJWT, authController.getUsers);

module.exports = router;
