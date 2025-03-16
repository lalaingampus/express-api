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
      { expiresIn: '5h' }
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
  const { selectedPerson, selectedCategory, suami, istri, total, keterangan } = req.body;
  const userId = req.user.userId;  // Get userId from JWT token

  // Convert suami to a number, or set it to null if it's not a valid number
  const suamiNumber = suami ? Number(suami) : null;
  const istriNumber = istri ? Number(istri) : null;

  // Data to be added
  const newPemasukan = {
    selectedCategory,
    selectedPerson,
    suami: suamiNumber,  // Store suami as a number
    istri: istriNumber,  // Store istri as a number
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
  const { selectedCategory, amount, selectedSumber, keterangan } = req.body;
  const userId = req.user.userId;  // Get userId from JWT token

  // Validate and convert the amount to a number
  const parsedAmount = Number(amount);

  // Check if the parsed amount is a valid number
  if (isNaN(parsedAmount)) {
    return res.status(400).send('Invalid amount. Please provide a valid number.');
  }

  // Data to be added
  const newPengeluaran = {
    selectedCategory,
    selectedSumber,
    amount: parsedAmount,  // Store as a number
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


// app.get('/list_data_hutang', authenticateJWT, async (req, res) => {
//   let { totalHutang, hutangBayar } = req.query;  // Change from req.body to req.query to handle GET requests
//   const userId = req.user.userId;  // Get userId from JWT token

//   // Ensure totalHutang and hutangBayar are numbers, if not, initialize as 0
//   totalHutang = Number(totalHutang) || 0;
//   hutangBayar = Number(hutangBayar) || 0;

//   try {
//     // Query to get all documents from 'data_pengeluaran' where selectedCategory is 'Hutang'
//     const hutangSnapshot = await db.collection('data_pengeluaran')
//       .where('selectedCategory', '==', 'Hutang')
//       .get();

//     // Create an array to store the formatted results
//     const hutangData = [];

//     // Iterate through each document and format the data
//     hutangSnapshot.forEach(doc => {
//       const data = doc.data();

//       const createdAt = data.createdAt; // Assuming createdAt exists in your document
//       const amount = data.amount; // Assuming amount exists in your document

//       // Check if 'amount' exists
//       if (amount !== undefined && amount !== null) {
//         // Format the date in Indonesian format (dd month yyyy)
//         const formattedDate = createdAt.toDate().toLocaleDateString('id-ID', {
//           year: 'numeric',
//           month: 'long',
//           day: 'numeric',
//         });

//         // Format the amount with "Rp." and separator (for currency formatting)
//         const formattedAmount = "Rp. " + amount.toLocaleString('id-ID', {
//           minimumFractionDigits: 0, // Ensure no decimals
//           maximumFractionDigits: 0  // Ensure no decimals
//         });

//         // Push the formatted data to the array
//         hutangData.push({ date: formattedDate, amount: formattedAmount });
//       } else {
//         // If no amount found, log it
//         console.log('Amount not found for this document.');
//       }
//     });

//     // Send the formatted data as the response
//     res.status(200).json(hutangData);
//   } catch (error) {
//     console.error('Error getting data:', error);
//     res.status(500).send({ error: 'An error occurred while processing data.' });
//   }
// });

app.get('/list_data_hutang', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.userId;  // Get userId from JWT token

    // Fetch expense data with both conditions (userId and selectedCategory)
    const snapshot = await db.collection('data_pengeluaran')
      .where('userId', '==', userId)
      .where('selectedCategory', '==', 'Hutang')  // Two conditions in one query
      .get();
    
    const pengeluaranList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(pengeluaranList);
  } catch (error) {
    res.status(500).send('Error getting pengeluaran: ' + error);
  }
});

app.post('/calculate_hutang', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.userId;  // Get userId from JWT token
    const { hutangBayar, selectedHutang, selectedSumber, keterangan } = req.body;  // Get hutangBayar, selectedHutang, and selectedSumber from request body

    // Check if hutangBayar, selectedHutang, and selectedSumber are provided
    if (!hutangBayar || !selectedHutang || !selectedSumber) {
      return res.status(400).send('hutangBayar, selectedHutang, and selectedSumber are required');
    }

    // Fetch the specific pengeluaran document by selectedHutang
    const pengeluaranDocRef = db.collection('data_pengeluaran').doc(selectedHutang);
    const pengeluaranDocSnapshot = await pengeluaranDocRef.get();

    // Check if the pengeluaran document exists
    if (!pengeluaranDocSnapshot.exists) {
      return res.status(404).send('Pengeluaran document not found');
    }

    const pengeluaranData = pengeluaranDocSnapshot.data();

    // Fetch the specific pemasukan document by selectedSumber
    const pemasukanDocRef = db.collection('data_pemasukan').doc(selectedSumber);
    const pemasukanDocSnapshot = await pemasukanDocRef.get();

    // Check if the pemasukan document exists
    if (!pemasukanDocSnapshot.exists) {
      return res.status(404).send('Pemasukan document not found');
    }

    const pemasukanData = pemasukanDocSnapshot.data();

    // Check if the userId matches for both pengeluaran and pemasukan
    if (pengeluaranData.userId !== userId || pemasukanData.userId !== userId) {
      return res.status(400).send('Invalid user for pengeluaran or pemasukan');
    }

    // Check if amount in data_pengeluaran is sufficient to pay the debt
    if (pengeluaranData.amount <= 0) {
      return res.status(400).send('Saldo tidak cukup untuk membayar hutang');
    }

    // If partnerId exists, we also need to ensure the partner's balance is updated
    const partnerId = pemasukanData.partnerId;

    // Check if pemasukan amount is sufficient to pay the debt (from suami or istri)
    const updatedPemasukanAmount = 
      pemasukanData.suami === 0 ? pemasukanData.istri - parseFloat(hutangBayar) : 
      pemasukanData.istri === 0 ? pemasukanData.suami - parseFloat(hutangBayar) : 
      pemasukanData.suami - parseFloat(hutangBayar);

    if (updatedPemasukanAmount < 0) {
      return res.status(400).send('Saldo tidak cukup');
    }

    // Subtract hutangBayar from both pengeluaran and pemasukan
    const updatedPengeluaranAmount = pengeluaranData.amount - parseFloat(hutangBayar);

    // Update pengeluaran document with the new amount
    await pengeluaranDocRef.update({
      amount: updatedPengeluaranAmount
    });

    // Update pemasukan document with the new amount (for both user and partner if applicable)
    await pemasukanDocRef.update({
      amount: updatedPemasukanAmount
    });

    // If there's a partner, also update the partner's pemasukan
    if (partnerId) {
      const partnerPemasukanDocRef = db.collection('data_pemasukan').doc(partnerId);
      const partnerPemasukanDocSnapshot = await partnerPemasukanDocRef.get();
      if (partnerPemasukanDocSnapshot.exists) {
        const partnerPemasukanData = partnerPemasukanDocSnapshot.data();
        const updatedPartnerPemasukanAmount = partnerPemasukanData.amount - parseFloat(hutangBayar);

        await partnerPemasukanDocRef.update({
          amount: updatedPartnerPemasukanAmount
        });
      }
    }

    // Fetch the updated list of pengeluaran and pemasukan for the user
    const pengeluaranSnapshot = await db.collection('data_pengeluaran')
      .where('userId', '==', userId)
      .where('selectedCategory', '==', 'Hutang')
      .get();

    const pemasukanSnapshot = await db.collection('data_pemasukan')
      .where('userId', '==', userId)
      .get();

    // Map through the snapshot to include the updated amount
    const pengeluaranList = pengeluaranSnapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        id: doc.id, 
        amount: data.amount, 
        hutangBayar: parseFloat(hutangBayar),  // Include hutangBayar in the response
        ...data 
      };
    });

    const pemasukanList = pemasukanSnapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        id: doc.id, 
        amount: data.amount, 
        hutangBayar: parseFloat(hutangBayar),  // Include hutangBayar in the response
        ...data 
      };
    });

    // Log the updated pengeluaran and pemasukan lists to the console
    pengeluaranList.forEach(item => {
      console.log('Updated Pengeluaran Amount:', item.amount);
    });

    pemasukanList.forEach(item => {
      console.log('Updated Pemasukan Amount:', item.amount);
    });

    // Respond with the updated pengeluaran and pemasukan lists
    res.status(200).json({ pengeluaranList, pemasukanList });
  } catch (error) {
    res.status(500).send('Error updating pengeluaran and pemasukan: ' + error);
  }
});















// app.post('/data_hutang', authenticateJWT, async (req, res) => {
//   let { totalHutang, selectedSumber, hutangBayar } = req.body;  // 'hutangBayar' is passed in the request body
//   const userId = req.user.userId;  // Get userId from JWT token
  
//   // Ensure totalHutang starts as a number, if not, initialize as 0
//   totalHutang = Number(totalHutang) || 0;

//   // Ensure hutangBayar starts as a number, if not, initialize as 0
//   hutangBayar = Number(hutangBayar) || 0;

//   try {
//     // Query to get all documents from 'data_pengeluaran' where selectedCategory is 'Hutang'
//     const hutangSnapshot = await db.collection('data_pengeluaran')
//       .where('selectedCategory', '==', 'Hutang')
//       .get();

//     // Iterate through each document and sum the 'amount' values
//     console.log('list daftar hutang', hutangSnapshot.createdAt)
//     // hutangSnapshot.forEach(doc => {
//     //   const data = doc.data();
//     //   let amount = data.amount;
      
//     //   // Convert 'amount' to a number if it's not already
//     //   amount = Number(amount);
      
//     //   if (isNaN(amount)) {
//     //     console.log(`Invalid or missing amount field in document ${doc.id}`);
//     //   } else {
//     //     totalHutang += amount;
//     //     console.log(`Added ${amount} to totalHutang. Current totalHutang: ${totalHutang}`);
//     //   }
//     // });

//     // // Subtract hutangBayar from totalHutang
//     // totalHutang -= hutangBayar;
//     // console.log(`After payment, totalHutang is reduced by ${hutangBayar}. Updated totalHutang: ${totalHutang}`);

//     // // Send back the updated totalHutang value as a response
//     // res.status(200).json({ totalHutang });

//   } catch (error) {
//     console.error('Error retrieving hutang data: ', error);
//     res.status(500).send('Internal Server Error');
//   }
// });







// app.post('/data_hutang', authenticateJWT, async (req, res) => {
//   const { hutangBayar, selectedSumber } = req.body;
//   const userId = req.user.userId;  // Get userId from JWT token
  
//   // Query to get all documents from 'data_pengeluaran' where selectedCategory is 'Hutang'
//   try {
//     const hutangSnapshot = await db.collection('data_pengeluaran')
//       .where('selectedCategory', '==', 'Hutang')
//       .get();
    
//       console.log('ini data hutang', hutangSnapshot.amount)
//     // // Sum the 'amount' of each document where selectedCategory is 'Hutang'
//     // let totalHutang = 0;
//     // hutangSnapshot.forEach(doc => {
//     //   const data = doc.data();
//     //   totalHutang += data.amount || 0;
//     // });

//     // // Calculate the remaining hutang after payment
//     // const remainingHutang = totalHutang - hutangBayar;

//     // // Prepare the data to be added to 'data_hutang' collection
//     // const newHutangData = {
//     //   hutang: remainingHutang,  // Store the updated hutang amount after the payment
//     //   hutangBayar,              // The amount paid (from the request body)
//     //   selectedSumber,           // The selected source (from the request body)
//     //   userId,                   // The userId who is creating the record
//     //   createdAt: new Date(),
//     // };

//     // // Add the new hutang data to 'data_hutang'
//     // const docRef = await db.collection('data_hutang').add(newHutangData);

//     // // Send success response
//     // res.status(201).json({
//     //   id: docRef.id,
//     //   ...newHutangData,
//     // });
//   } catch (error) {
//     res.status(500).send('Error creating hutang: ' + error);
//   }
// });


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
