// Import library yang diperlukan
require('dotenv').config();  // Memuat environment variables dari file .env
const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

// Inisialisasi aplikasi Firebase
// const serviceAccount = require('./serviceAccountKey.json'); // Ganti dengan path file key Anda
const serviceAccount = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
console.log('Connected to Firebase successfully!');

// Inisialisasi Express.js
const app = express();
app.use(express.json()); // Untuk parsing JSON
app.use(cors({
    origin: 'http://localhost:3000', // Atau alamat IP yang digunakan
    methods: ['GET', 'POST'],
  }));

// Mengambil JWT_SECRET dari file .env
const JWT_SECRET = process.env.JWT_SECRET;

// Swagger setup menggunakan Swagger 2.0 (OpenAPI 2.0)
const swaggerOptions = {
  swaggerDefinition: {
    swagger: '2.0',
    info: {
      title: 'Express Firebase API with JWT',
      version: '1.0.0',
      description: 'API documentation with Swagger for Express.js and Firebase using JWT authentication',
    },
    securityDefinitions: {
      jwtAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'Authorization',
        description: 'JWT token untuk autentikasi. Harus menggunakan format "Bearer <token>"',
      },
    },
    security: [
      { jwtAuth: [] },
    ],
  },
  apis: ['./app.js'], // Lokasi file untuk mendokumentasikan API
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Middleware untuk memverifikasi token JWT
const authenticateJWT = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  console.log('Authorization header:', req.headers['authorization']);  // Untuk memeriksa header authorization
  
  if (!token) {
    return res.status(403).send('A token is required for authentication');
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).send('Invalid or expired token');
    }
    req.user = user;
    next();
  });
};

/**
 * Endpoint untuk registrasi pengguna dan menyimpan pengguna ke Firestore
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
app.post('/register', async (req, res) => {
  const { email, username, password } = req.body;

  // Cek apakah username sudah terdaftar
  const snapshot = await db.collection('users').where('username', '==', username).get();
  if (!snapshot.empty) {
    return res.status(400).send('Username already exists');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Menyimpan data pengguna ke Firestore
  try {
    const docRef = await db.collection('users').add({
      username,
      email,
      password: hashedPassword,
      createdAt: new Date(),
    });

    res.status(200).send('User registered successfully');
  } catch (error) {
    res.status(500).send('Error registering user: ' + error);
  }
});

/**
 * Endpoint untuk login pengguna dan menghasilkan JWT token
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
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Cek apakah username ada di Firestore
  const snapshot = await db.collection('users').where('username', '==', username).get();
  if (snapshot.empty) {
    return res.status(401).send('Username or password incorrect');
  }

  const user = snapshot.docs[0].data();
  console.log('ini apa ya ?', user)

  // Verifikasi password
  bcrypt.compare(password, user.password, (err, result) => {
    if (err || !result) {
      return res.status(401).send('Username or password incorrect');
    }

    // Generate JWT token
    const token = jwt.sign({ userId: snapshot.docs[0].id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  });
});

/**
 * Endpoint untuk mendapatkan daftar users (hanya untuk yang terautentikasi)
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
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   username:
 *                     type: string
 */
app.get('/users', authenticateJWT, async (req, res) => {
  try {
    const snapshot = await db.collection('users').get();
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(users);
  } catch (error) {
    res.status(500).send('Error getting users: ' + error);
  }
});

// Menjalankan server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
