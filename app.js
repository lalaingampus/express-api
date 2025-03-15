// Import libraries needed
require('dotenv').config();  // Load environment variables from .env file
const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

// Initialize Firebase
const serviceAccount = require('./serviceAccountKey.json'); // Replace with your service account key path

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
console.log('Connected to Firebase successfully!');

// Initialize Express.js
const app = express();
app.use(express.json()); // To parse JSON bodies
app.use(cors({
    origin: 'http://localhost:3090', // Or the appropriate address
    methods: ['GET', 'POST'],
  }));

// JWT secret key from environment variables
const JWT_SECRET = process.env.JWT_SECRET;

// Swagger setup (Swagger 2.0 / OpenAPI 2.0)
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
        description: 'JWT token for authentication. Use "Bearer <token>" format',
      },
    },
    security: [
      { jwtAuth: [] },
    ],
  },
  apis: ['./app.js'], // The file to document APIs
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Middleware to verify JWT token
const authenticateJWT = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  console.log('Authorization header:', req.headers['authorization']);  // For debugging

  if (!token) {
    return res.status(403).send('A token is required for authentication');
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).send('Invalid or expired token');
    }
    req.user = user;  // Attach the decoded user to the request object
    next();
  });
};


app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Check if username exists in Firestore
  const snapshot = await db.collection('users').where('username', '==', username).get();
  if (snapshot.empty) {
    return res.status(401).send('Username or password incorrect');
  }

  const user = snapshot.docs[0].data();
  console.log('User data:', user);

  // Verify password
  bcrypt.compare(password, user.password, (err, result) => {
    if (err || !result) {
      return res.status(401).send('Username or password incorrect');
    }

    // Generate JWT token with user information
    const token = jwt.sign(
      { 
        userId: snapshot.docs[0].id, 
        username: user.username, 
        createdAt: new Date().toISOString()  // Add createdAt to the JWT payload
      }, 
      JWT_SECRET, 
      { expiresIn: '1h' }
    );

    // Send token in response
    res.json({ token });
  });
});


app.get('/users', authenticateJWT, async (req, res) => {
  try {
    const snapshot = await db.collection('users').get();
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(users);
  } catch (error) {
    res.status(500).send('Error getting users: ' + error);
  }
});


app.post('/data_pemasukan', authenticateJWT, async (req, res) => {
  const { selectedCategory, suami, istri, total, keterangan } = req.body;
  const userId = req.user.userId;  // Get userId from JWT token

  // Data to be added
  const newPemasukan = {
    selectedCategory,
    suami: suami || null,
    istri: istri || null,
    total: total || null,
    keterangan: keterangan || '',
    userId,  // Track who created the record
    createdAt: new Date(),
  };

  try {
    // Add new income data to Firestore
    const docRef = await db.collection('data_pemasukan').add(newPemasukan);

    // Send success response
    res.status(201).json({
      id: docRef.id,
      ...newPemasukan,
    });
  } catch (error) {
    res.status(500).send('Error creating pemasukan: ' + error);
  }
});


app.post('/data_pengeluaran', authenticateJWT, async (req, res) => {
  const { kategori, nominal, sumber, keterangan } = req.body;
  const userId = req.user.userId;  // Get userId from JWT token

  

  // Data to be added
  const newPengeluaran = {
    kategori,
    nominal,
    sumber,
    keterangan,
    userId,  // Track who created the record
    createdAt: new Date(),
  };

  try {
    // Add new expense data to Firestore
    const docRef = await db.collection('data_pengeluaran').add(newPengeluaran);

    // Send success response
    res.status(201).json({
      id: docRef.id,
      ...newPengeluaran,
    });
  } catch (error) {
    res.status(500).send('Error creating pengeluaran: ' + error);
  }
});

/**
 * Endpoint to get income data (pemasukan list)
 * @swagger
 * /pemasukan_list:
 *   get:
 *     summary: Get list of income records
 *     description: Get the list of income records created by the authenticated user
 *     security:
 *       - jwtAuth: []
 *     responses:
 *       200:
 *         description: List of income records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   selectedCategory:
 *                     type: string
 *                   suami:
 *                     type: string
 *                   istri:
 *                     type: string
 *                   total:
 *                     type: number
 *                   keterangan:
 *                     type: string
 */
app.get('/pemasukan_list', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.userId;  // Get userId from JWT token

    // Fetch income data created by the authenticated user
    const snapshot = await db.collection('data_pemasukan').where('userId', '==', userId).get();
    const pemasukanList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(pemasukanList);
  } catch (error) {
    res.status(500).send('Error getting pemasukan: ' + error);
  }
});

/**
 * Endpoint to get expense data (pengeluaran list)
 * @swagger
 * /pengeluaran_list:
 *   get:
 *     summary: Get list of expense records
 *     description: Get the list of expense records created by the authenticated user
 *     security:
 *       - jwtAuth: []
 *     responses:
 *       200:
 *         description: List of expense records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   kategori:
 *                     type: string
 *                   nominal:
 *                     type: number
 *                   sumber:
 *                     type: string
 *                   keterangan:
 *                     type: string
 */
app.get('/pengeluaran_list', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.userId;  // Get userId from JWT token

    // Fetch expense data created by the authenticated user
    const snapshot = await db.collection('data_pengeluaran').where('userId', '==', userId).get();
    const pengeluaranList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(pengeluaranList);
  } catch (error) {
    res.status(500).send('Error getting pengeluaran: ' + error);
  }
});

// Start the server
const PORT = process.env.PORT || 3090;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
