// Import libraries needed
require('dotenv').config();  // Load environment variables from .env file
const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

// Load the service account key from environment variable
let serviceAccount;

try {
  serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);

  if (!serviceAccount) {
    throw new Error('Firebase service account key is missing or invalid');
  }
} catch (error) {
  console.error('Error parsing GOOGLE_SERVICE_ACCOUNT_KEY:', error.message);
  process.exit(1);  // Exit the process if there's an error with the service account key
}

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

// Endpoint to delete a user by ID
// Endpoint to delete data_pemasukan by ID
app.delete('/data_pemasukan/:id', authenticateJWT, async (req, res) => {
  const pemasukanId = req.params.id;  // Get the pemasukan ID from the URL parameter

  try {
    // Check if the document exists in the 'data_pemasukan' collection
    const pemasukanDoc = await db.collection('data_pemasukan').doc(pemasukanId).get();
    if (!pemasukanDoc.exists) {
      return res.status(404).send('Data pemasukan not found');
    }

    // Delete the document from the 'data_pemasukan' collection
    await db.collection('data_pemasukan').doc(pemasukanId).delete();

    // Respond with a success message
    res.status(200).send('Data pemasukan deleted successfully');
  } catch (error) {
    console.error('Error deleting data pemasukan:', error);
    res.status(500).send('An error occurred while deleting data pemasukan');
  }
});



app.put('/data_pemasukan/:id', authenticateJWT, async (req, res) => {
  const pemasukanId = req.params.id;  // Get the pemasukan ID from the URL parameter
  const updatedData = req.body;  // Get the new data from the request body

  try {
    // Check if the document exists in the 'data_pemasukan' collection
    const pemasukanDoc = await db.collection('data_pemasukan').doc(pemasukanId).get();
    if (!pemasukanDoc.exists) {
      return res.status(404).send('Data pemasukan not found');
    }

    // Get the current data from the document
    const currentData = pemasukanDoc.data();

    const newSuami = updatedData.suami !== undefined ? updatedData.suami : currentData.suami;
    const newIstri = updatedData.istri !== undefined ? updatedData.istri : currentData.istri;


    // Prepare the updated data with the current date
    const newData = {
      ...currentData,
      suami: newSuami,
      istri: newIstri,
      dateUpdated: new Date().toISOString(), // Automatically set current date
    };

    // Update the document in the 'data_pemasukan' collection with the new data
    await db.collection('data_pemasukan').doc(pemasukanId).update(newData);

    // Respond with the updated data including the current date
    res.status(200).json({
      message: 'Data pemasukan updated successfully',
      updatedData: newData,
    });
  } catch (error) {
    console.error('Error updating data pemasukan:', error);
    res.status(500).send('An error occurred while updating data pemasukan');
  }
});




app.delete('/data_pengeluaran/:id', authenticateJWT, async (req, res) => {
  const pengeluaranId = req.params.id;  // Get the pengeluaran ID from the URL parameter

  
  try {
    // Check if the document exists in the 'data_pengeluaran' collection
    const pengeluaranDoc = await db.collection('data_pengeluaran').doc(pengeluaranId).get();
    if (!pengeluaranDoc.exists) {
      console.log(`Data pengeluaran with ID ${pengeluaranId} not found`);
      return res.status(404).send('Data pengeluaran not found');
    }


    // Retrieve the associated pemasukan data (use selectedSumber from data_pengeluaran)
    const selectedSumber = pengeluaranDoc.data().selectedSumber;  // This is the ID from data_pemasukan
    console.log('This is the selectedSumber data: ', selectedSumber);

    // Get the corresponding data_pemasukan document using the selectedSumber
    const pemasukanDoc = await db.collection('data_pemasukan').doc(selectedSumber).get();
    console.log('ini data data pemasukan', pemasukanDoc)
    if (!pemasukanDoc.exists) {
      console.log(`Data pemasukan with ID ${selectedSumber} not found`);
      return res.status(404).send('Data pemasukan not found');
    }

    // Retrieve the data from data_pemasukan
    const pemasukanData = pemasukanDoc.data();

    // Get the amount from data_pengeluaran
    const amount = pengeluaranDoc.data().amount;

    let updatedAmount = null;

    // If 'suami' is valid, add the amount back to 'suami' in data_pemasukan
    if (pemasukanData.suami !== null && pemasukanData.suami !== 0) {
      updatedAmount = pemasukanData.suami + amount;
      // Update the 'suami' field in the data_pemasukan document
      await db.collection('data_pemasukan').doc(selectedSumber).update({
        suami: updatedAmount
      });
      console.log(`Amount added to suami: ${updatedAmount}`);
    } 
    // If 'istri' is valid, add the amount back to 'istri' in data_pemasukan
    else if (pemasukanData.istri !== null && pemasukanData.istri !== 0) {
      updatedAmount = pemasukanData.istri + amount;
      // Update the 'istri' field in the data_pemasukan document
      await db.collection('data_pemasukan').doc(selectedSumber).update({
        istri: updatedAmount
      });
      console.log(`Amount added to istri: ${updatedAmount}`);
    } else {
      return res.status(400).send('Neither suami nor istri has a valid amount to update');
    }

    // Now, delete the 'data_pengeluaran' document
    await db.collection('data_pengeluaran').doc(pengeluaranId).delete();

    // Respond with a success message
    res.status(200).send('Data pengeluaran deleted successfully, and amount returned to selectedSumber');
  } catch (error) {
    console.error('Error deleting data pengeluaran:', error);
    res.status(500).send('An error occurred while deleting data pengeluaran');
  }
});


app.put('/data_pengeluaran/:id', authenticateJWT, async (req, res) => {
  const pengeluaranId = req.params.id;  // Get the pengeluaran ID from the URL parameter
  const updatedData = req.body;  // Get the updated data from the request body

  try {
    // Check if the document exists in the 'data_pengeluaran' collection
    const pengeluaranDoc = await db.collection('data_pengeluaran').doc(pengeluaranId).get();
    if (!pengeluaranDoc.exists) {
      console.log(`Data pengeluaran with ID ${pengeluaranId} not found`);
      return res.status(404).send('Data pengeluaran not found');
    }

    // Retrieve the associated pemasukan data (use selectedSumber from data_pengeluaran)
    const selectedSumber = pengeluaranDoc.data().selectedSumber;  // Retrieve selectedSumber (which is the id in data_pemasukan)
    
    // Get the data_pemasukan document using the selectedSumber
    const pemasukanDoc = await db.collection('data_pemasukan').doc(selectedSumber).get(); 
    
    
    if (!pemasukanDoc.exists) {
      console.log(`Data pemasukan with ID ${selectedSumber} not found`);
      return res.status(404).send('Data pemasukan not found');
    }

    // Get selectedSumber from pemasukanDoc
    const pemasukanData = pemasukanDoc.data();

    // Get the old amount from data_pengeluaran to calculate the difference
    const oldAmount = pengeluaranDoc.data().amount;

    // Calculate the difference between the old amount and the updated amount
    const newAmount = updatedData.amount || oldAmount; // if updatedData.amount is provided, use it, else use the old amount

    console.log('Old Amount:', oldAmount);
    console.log('New Amount:', newAmount);


    let updatedAmount = null;

    // If 'suami' is valid, adjust the 'suami' field in the data_pemasukan document
    if (pemasukanData.suami !== null && pemasukanData.suami !== 0) {
      updatedAmount = pemasukanData.suami - oldAmount;
      // Update 'suami' field in the data_pemasukan document
      await db.collection('data_pemasukan').doc(selectedSumber).update({
        suami: updatedAmount
      });
      console.log(`Updated amount in suami: ${updatedAmount}`);
    } 
    // If 'istri' is valid, adjust the 'istri' field in the data_pemasukan document
    else if (pemasukanData.istri !== null && pemasukanData.istri !== 0) {
      updatedAmount = pemasukanData.istri - oldAmount;
      // Update 'istri' field in the data_pemasukan document
      await db.collection('data_pemasukan').doc(selectedSumber).update({
        istri: updatedAmount
      });
      console.log(`Updated amount in istri: ${updatedAmount}`);
    } else {
      return res.status(400).send('Neither suami nor istri has a valid amount to update');
    }

    // Now, update the 'data_pengeluaran' document with the new data
    const updatedDataWithDate = {
      ...updatedData,
      dateUpdated: new Date().toISOString(), // Automatically add the current date
    };

    await db.collection('data_pengeluaran').doc(pengeluaranId).update(updatedDataWithDate);

    // Respond with the updated data and the current date
    res.status(200).json({
      message: 'Data pengeluaran updated successfully, and amount adjusted in data_pemasukan',
      updatedData: updatedDataWithDate,
    });
  } catch (error) {
    console.error('Error updating data pengeluaran:', error);
    res.status(500).send('An error occurred while updating data pengeluaran');
  }
});


app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check if username already exists in Firestore
    const snapshot = await db.collection('users').where('username', '==', username).get();
    if (!snapshot.empty) {
      return res.status(400).send('Username already exists');
    }

    // Hash the password before saving to Firestore
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user document in Firestore
    const userRef = await db.collection('users').add({
      username,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    });

    // Generate JWT token with user information
    const token = jwt.sign(
      { 
        userId: userRef.id, 
        username: username,
        createdAt: new Date().toISOString() 
      },
      JWT_SECRET,
      { expiresIn: '5h' }
    );

    // Send the token as the response
    res.status(201).json({ token });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).send('Internal server error');
  }
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

app.get('/get_data_pemasukan', authenticateJWT, async (req, res) => {
  const userId = req.user.userId;  // Get userId from JWT token

  try {
    // Query Firestore to get all pemasukan data for the authenticated user
    const snapshot = await db.collection('data_pemasukan')
                              .where('userId', '==', userId)
                              .get();

    if (snapshot.empty) {
      return res.status(404).json({ message: 'No data found' });
    }

    // Prepare the result
    const data = snapshot.docs.map(doc => {
      const dataItem = doc.data();

      // Determine which value to use based on suami or istri
      let amountToDisplay = null;

      // Display `istri` if `suami` is 0 and `istri` > 0, otherwise display `suami`
      if (dataItem.suami === 0 && dataItem.istri > 0) {
        amountToDisplay = dataItem.istri;
      } else if (dataItem.istri === 0 && dataItem.suami > 0) {
        amountToDisplay = dataItem.suami;
      } else if (dataItem.suami > 0) {
        amountToDisplay = dataItem.suami; // Default to suami if both are non-zero
      } else if (dataItem.istri > 0) {
        amountToDisplay = dataItem.istri; // Display istri if suami is 0
      }

      // Return the modified item with amountToDisplay
      return {
        id: doc.id,
        selectedCategory: dataItem.selectedCategory,
        selectedPerson: dataItem.selectedPerson,
        suami: dataItem.suami,
        istri: dataItem.istri,
        total: dataItem.total,
        keterangan: dataItem.keterangan,
        amountToDisplay, // Include the computed amountToDisplay
        createdAt, // Add createdAt to the response
      };
    });

    // Send the response
    res.status(200).json(data);

  } catch (error) {
    res.status(500).send('Error fetching pemasukan data: ' + error);
  }
});

app.get('/get_data_pemasukan/:id', authenticateJWT, async (req, res) => {
  const userId = req.user.userId;  // Get userId from JWT token
  const docId = req.params.id; // Get the id parameter from the request URL

  try {
    // Query Firestore to get a single pemasukan data by id and check userId
    const docRef = db.collection('data_pemasukan').doc(docId);
    const doc = await docRef.get();

    // If the document doesn't exist or doesn't belong to the authenticated user
    if (!doc.exists || doc.data().userId !== userId) {
      return res.status(404).json({ message: 'Data not found or unauthorized access' });
    }

    const dataItem = doc.data();

    // Determine which value to use based on suami or istri
    let amountToDisplay = null;

    // Display `istri` if `suami` is 0 and `istri` > 0, otherwise display `suami`
    if (dataItem.suami === 0 && dataItem.istri > 0) {
      amountToDisplay = dataItem.istri;
    } else if (dataItem.istri === 0 && dataItem.suami > 0) {
      amountToDisplay = dataItem.suami;
    } else if (dataItem.suami > 0) {
      amountToDisplay = dataItem.suami; // Default to suami if both are non-zero
    } else if (dataItem.istri > 0) {
      amountToDisplay = dataItem.istri; // Display istri if suami is 0
    }

    // Prepare the response
    const response = {
      id: doc.id,
      selectedCategory: dataItem.selectedCategory,
      selectedPerson: dataItem.selectedPerson,
      suami: dataItem.suami,
      istri: dataItem.istri,
      total: dataItem.total,
      keterangan: dataItem.keterangan,
      amountToDisplay, // Include the computed amountToDisplay
      createdAt: dataItem.createdAt, // Include createdAt
    };

    // Send the response
    res.status(200).json(response);

  } catch (error) {
    res.status(500).send('Error fetching pemasukan data: ' + error);
  }
});

app.get('/get_data_pengeluaran/:id', authenticateJWT, async (req, res) => {
  const userId = req.user.userId;  // Get userId from JWT token
  const docId = req.params.id; // Get the id parameter from the request URL

  try {
    // Query Firestore to get the data_pengeluaran document by id
    const docRef = db.collection('data_pengeluaran').doc(docId);
    const doc = await docRef.get();
    
    // If the document doesn't exist or doesn't belong to the authenticated user
    if (!doc.exists || doc.data().userId !== userId) {
      return res.status(404).json({ message: 'Data not found or unauthorized access' });
    }

    const dataItem = doc.data();

    // Fetch the corresponding data_pemasukan document using selectedSumber
    const pemasukanRef = db.collection('data_pemasukan').doc(dataItem.selectedSumber);
    const pemasukanDoc = await pemasukanRef.get();

    // If the pemasukan document does not exist, set selectedCategory to 'Unknown'
    const selectedCategory = pemasukanDoc.exists ? pemasukanDoc.data().selectedCategory : 'Unknown Category';

    // Prepare the response, including selectedCategory from data_pemasukan
    const response = {
      id: doc.id,
      selectedSumber: dataItem.selectedSumber,
      selectedCategory: selectedCategory,  // From data_pemasukan
      amount: dataItem.amount,
      keterangan: dataItem.keterangan,
      createdAt: dataItem.createdAt,  // Include createdAt
    };

    // Send the response
    res.status(200).json(response);

  } catch (error) {
    // Handle any errors and send a response
    res.status(500).send('Error fetching pemasukan data: ' + error);
  }
});


app.get('/get_data_pemasukan/:id', authenticateJWT, async (req, res) => {
  const userId = req.user.userId;  // Get userId from JWT token
  const docId = req.params.id; // Get the id parameter from the request URL

  try {
    // Query Firestore to get a single pemasukan data by id and check userId
    const docRef = db.collection('data_pemasukan').doc(docId);
    const doc = await docRef.get();

    // If the document doesn't exist or doesn't belong to the authenticated user
    if (!doc.exists || doc.data().userId !== userId) {
      return res.status(404).json({ message: 'Data not found or unauthorized access' });
    }

    const dataItem = doc.data();

    // Determine which value to use based on suami or istri
    let amountToDisplay = null;

    // Display `istri` if `suami` is 0 and `istri` > 0, otherwise display `suami`
    if (dataItem.suami === 0 && dataItem.istri > 0) {
      amountToDisplay = dataItem.istri;
    } else if (dataItem.istri === 0 && dataItem.suami > 0) {
      amountToDisplay = dataItem.suami;
    } else if (dataItem.suami > 0) {
      amountToDisplay = dataItem.suami; // Default to suami if both are non-zero
    } else if (dataItem.istri > 0) {
      amountToDisplay = dataItem.istri; // Display istri if suami is 0
    }

    // Prepare the response
    const response = {
      id: doc.id,
      selectedCategory: dataItem.selectedCategory,
      selectedPerson: dataItem.selectedPerson,
      suami: dataItem.suami,
      istri: dataItem.istri,
      total: dataItem.total,
      keterangan: dataItem.keterangan,
      amountToDisplay, // Include the computed amountToDisplay
      createdAt: dataItem.createdAt, // Include createdAt
    };

    // Send the response
    res.status(200).json(response);

  } catch (error) {
    res.status(500).send('Error fetching pemasukan data: ' + error);
  }
});


app.post('/data_pengeluaran', authenticateJWT, async (req, res) => {
  const { selectedCategory, amount, selectedSumber, keterangan } = req.body;
  const userId = req.user.userId; // Get userId from JWT token
  const parsedAmount = Number(amount);

  // Validasi amount
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ message: 'Invalid amount. Please provide a valid number greater than zero.' });
  }

  let createdDocRef = null; // Store the document reference for possible deletion

  try {
    // Get the sumber data
    const sumberDocRef = db.collection('data_pemasukan').doc(selectedSumber);
    const sumberDoc = await sumberDocRef.get();

    // If sumber does not exist or does not have valid data
    if (!sumberDoc.exists) {
      return res.status(400).json({ message: 'Selected sumber not found in the database.' });
    }

    const sumberData = sumberDoc.data();
    const suamiBalance = sumberData.suami || 0;
    const istriBalance = sumberData.istri || 0;

    // Validation for balance sufficiency
    let balanceIsValid = false;
    let newSuamiBalance = suamiBalance;
    let newIstriBalance = istriBalance;

    // Check if suami balance is sufficient
    if (suamiBalance > 0 && suamiBalance >= parsedAmount) {
      balanceIsValid = true;
      newSuamiBalance = suamiBalance - parsedAmount;
    }
    // If not, check if istri balance is sufficient
    else if (istriBalance > 0 && istriBalance >= parsedAmount) {
      balanceIsValid = true;
      newIstriBalance = istriBalance - parsedAmount;
    }

    if (!balanceIsValid) {
      return res.status(400).json({ message: 'Insufficient balance in either suami or istri account.' });
    }

    // Update the sumber document first
    const updateData = {};
    if (suamiBalance >= parsedAmount) {
      updateData.suami = newSuamiBalance; // Only update suami if its balance was used
    } 
    if (istriBalance >= parsedAmount) {
      updateData.istri = newIstriBalance; // Only update istri if its balance was used
    }

    await sumberDocRef.update(updateData);

    // After successful source balance update, prepare the data to be stored
    const newPengeluaran = {
      selectedCategory,
      selectedSumber,
      amount: parsedAmount,
      keterangan,
      userId,
      createdAt: new Date(),
    };

    // Add new pengeluaran data to Firebase
    const docRef = await db.collection('data_pengeluaran').add(newPengeluaran);
    createdDocRef = docRef; // Store the reference to delete it in case of error later

    res.status(201).json({
      id: docRef.id,
      ...newPengeluaran,
      newSuamiBalance, // Send the updated balance
      newIstriBalance, // Send the updated balance
    });

  } catch (error) {
    console.error('Error creating pengeluaran:', error);

    // If any error occurs and a document was created earlier, delete it
    if (createdDocRef) {
      await createdDocRef.delete();
    }

    res.status(500).json({ message: 'Error creating pengeluaran: ' + error.message });
  }
});



app.get('/list_data_hutang', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.userId;  // Get userId from JWT token

    // Fetch expense data with both conditions (userId and selectedCategory)
    const snapshot = await db.collection('data_pengeluaran')
      .where('userId', '==', userId)
      .where('selectedCategory', '==', 'Debt')  // Two conditions in one query
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
    const { hutangBayar, selectedHutang, selectedSumber, parsedAmount, keterangan } = req.body;  // Get hutangBayar, selectedHutang, and selectedSumber from request body

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
    let updatedSuamiAmount = pemasukanData.suami;
    let updatedIstriAmount = pemasukanData.istri;

    // Deduct the hutangBayar from suami or istri based on which one has a balance
    if (pemasukanData.suami >= parseFloat(hutangBayar)) {
      updatedSuamiAmount = pemasukanData.suami - parseFloat(hutangBayar);
    } else if (pemasukanData.istri >= parseFloat(hutangBayar)) {
      updatedIstriAmount = pemasukanData.istri - parseFloat(hutangBayar);
    } else {
      return res.status(400).send('Saldo suami atau istri tidak cukup');
    }

    // Subtract hutangBayar from both pengeluaran and pemasukan
    const updatedPengeluaranAmount = pengeluaranData.amount - parseFloat(hutangBayar);

    // Update pengeluaran document with the new amount
    await pengeluaranDocRef.update({
      amount: updatedPengeluaranAmount
    });

    // Update pemasukan document with the new suami or istri amount
    await pemasukanDocRef.update({
      suami: updatedSuamiAmount,
      istri: updatedIstriAmount
    });

    // If there's a partner, also update the partner's pemasukan
    if (partnerId) {
      const partnerPemasukanDocRef = db.collection('data_pemasukan').doc(partnerId);
      const partnerPemasukanDocSnapshot = await partnerPemasukanDocRef.get();
      if (partnerPemasukanDocSnapshot.exists) {
        const partnerPemasukanData = partnerPemasukanDocSnapshot.data();
        let updatedPartnerAmount = partnerPemasukanData.amount;

        // Deduct hutangBayar from partner's amount as well
        if (partnerPemasukanData.suami === 0) {
          updatedPartnerAmount = partnerPemasukanData.istri - parseFloat(hutangBayar);
        } else if (partnerPemasukanData.istri === 0) {
          updatedPartnerAmount = partnerPemasukanData.suami - parseFloat(hutangBayar);
        }

        await partnerPemasukanDocRef.update({
          amount: updatedPartnerAmount
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
        suami: data.suami, 
        istri: data.istri, 
        hutangBayar: parseFloat(hutangBayar),  // Include hutangBayar in the response
        ...data 
      };
    });

    // Log the updated pengeluaran and pemasukan lists to the console
    pengeluaranList.forEach(item => {
      console.log('Updated Pengeluaran Amount:', item.amount);
    });

    pemasukanList.forEach(item => {
      console.log('Updated Pemasukan Amount (Suami/ Istri):', item.suami, item.istri);
    });

    // Respond with the updated pengeluaran and pemasukan lists
    res.status(200).json({ pengeluaranList, pemasukanList });
  } catch (error) {
    res.status(500).send('Error updating pengeluaran and pemasukan: ' + error);
  }
});

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

app.get('/pemasukan_list_suami', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.userId;  // Get userId from JWT token

    // Fetch income data created by the authenticated user with suami == 0 and istri > 0
    const snapshot = await db.collection('data_pemasukan')
      .where('userId', '==', userId)
      .where('selectedPerson', '==', 'Suami')
      .get();
    
    const pemasukanList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(pemasukanList);
  } catch (error) {
    res.status(500).send('Error getting pemasukan: ' + error);
  }
});

app.get('/pemasukan_list_istri', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.userId;  // Get userId from JWT token

    // Fetch income data created by the authenticated user with suami == 0 and istri > 0
    const snapshot = await db.collection('data_pemasukan')
      .where('userId', '==', userId)
      .where('selectedPerson', '==', 'Istri')
      .get();
    
    const pemasukanList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(pemasukanList);
  } catch (error) {
    res.status(500).send('Error getting pemasukan: ' + error);
  }
});

app.get('/pengeluaran_list_istri', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.userId;  // Get userId from JWT token

    // Step 1: Fetch the relevant data_pemasukan document where 'suami == 0'
    const pemasukanSnapshot = await db.collection('data_pemasukan')
      .where('suami', '==', null)
      .where('userId', '==', userId)
      .get();

    if (pemasukanSnapshot.empty) {
      return res.status(404).send('No pemasukan data found for istri == 0');
    }

    // Assuming you only expect one pemasukan document with suami == 0
    const pemasukanData = pemasukanSnapshot.docs[0].data();
    const pemasukanId = pemasukanSnapshot.docs[0].id;  // ID from data_pemasukan

    // Step 2: Use the pemasukanId in your pengeluaran query
    const snapshot = await db.collection('data_pengeluaran')
      .where('userId', '==', userId)
      .where('selectedSumber', '==', pemasukanId)  // Referencing the pemasukanId here
      .get();
    
    const pengeluaranList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(pengeluaranList);
    
  } catch (error) {
    res.status(500).send('Error getting pengeluaran: ' + error);
  }
});

app.get('/pengeluaran_list_suami', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.userId;  // Get userId from JWT token

    // Step 1: Fetch the relevant data_pemasukan document where 'suami == 0'
    const pemasukanSnapshot = await db.collection('data_pemasukan')
      .where('istri', '==', null)
      .where('userId', '==', userId)
      .get();

    if (pemasukanSnapshot.empty) {
      return res.status(404).send('No pemasukan data found for suami == 0');
    }

    // Assuming you only expect one pemasukan document with suami == 0
    const pemasukanData = pemasukanSnapshot.docs[0].data();
    const pemasukanId = pemasukanSnapshot.docs[0].id;  // ID from data_pemasukan

    // Step 2: Use the pemasukanId in your pengeluaran query
    const snapshot = await db.collection('data_pengeluaran')
      .where('userId', '==', userId)
      .where('selectedSumber', '==', pemasukanId)  // Referencing the pemasukanId here
      .get();
    
    const pengeluaranList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(pengeluaranList);
    
  } catch (error) {
    res.status(500).send('Error getting pengeluaran: ' + error);
  }
});

app.get('/transaksi_list_semua', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.userId;  // Get userId from JWT token

    // Step 1: Fetch the relevant data_pemasukan document for istri where 'suami == null'
    const pemasukanIstriSnapshot = await db.collection('data_pemasukan')
      .where('suami', '==', null)  // Adjust according to actual data logic for Istri
      .where('userId', '==', userId)
      .get();

    if (pemasukanIstriSnapshot.empty) {
      return res.status(404).send('No pemasukan data found for Istri');
    }

    const pemasukanIstriId = pemasukanIstriSnapshot.docs[0].id;  // ID from data_pemasukan for istri
    const pemasukanIstriList = pemasukanIstriSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Step 2: Fetch the relevant data_pemasukan document for suami where 'istri == null'
    const pemasukanSuamiSnapshot = await db.collection('data_pemasukan')
      .where('istri', '==', null)  // Adjust according to actual data logic for Suami
      .where('userId', '==', userId)
      .get();

    if (pemasukanSuamiSnapshot.empty) {
      return res.status(404).send('No pemasukan data found for Suami');
    }

    const pemasukanSuamiId = pemasukanSuamiSnapshot.docs[0].id;  // ID from data_pemasukan for suami
    const pemasukanSuamiList = pemasukanSuamiSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Step 3: Fetch pengeluaran data for Istri
    const pengeluaranIstriSnapshot = await db.collection('data_pengeluaran')
      .where('userId', '==', userId)
      .where('selectedSumber', '==', pemasukanIstriId)  // Istri reference
      .get();

    const pengeluaranIstriList = pengeluaranIstriSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Step 4: Fetch pengeluaran data for Suami
    const pengeluaranSuamiSnapshot = await db.collection('data_pengeluaran')
      .where('userId', '==', userId)
      .where('selectedSumber', '==', pemasukanSuamiId)  // Suami reference
      .get();

    const pengeluaranSuamiList = pengeluaranSuamiSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Step 5: Combine the results into a single array
    const combinedList = [
      ...pemasukanIstriList,
      ...pemasukanSuamiList,
      ...pengeluaranIstriList,
      ...pengeluaranSuamiList,
    ];

    // Step 6: Sort the combined list by createdAt (timestamp) in descending order
    const sortedCombinedList = combinedList.sort((a, b) => {
      const dateA = a.createdAt ? a.createdAt.toDate() : new Date(0);  // Convert to Date object, default to epoch if missing
      const dateB = b.createdAt ? b.createdAt.toDate() : new Date(0);  // Convert to Date object, default to epoch if missing
    
      return dateB - dateA;  // Sort in descending order (newest first)
    });

    // Return the sorted combined list
    res.status(200).json(sortedCombinedList);
    
  } catch (error) {
    res.status(500).send('Error getting transaksi list: ' + error);
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

app.post('/move_pengeluaran_to_rekap', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.userId;  // Get userId from JWT token

    // Fetch data from the 'data_pengeluaran' collection
    const snapshot = await db.collection('data_pengeluaran')
      .where('userId', '==', userId)
      .get();

    // Initialize variables to store the aggregated data
    let totalPengeluaran = 0;
    const pengeluaranData = [];

    // Loop through the data to sum the expenses
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      totalPengeluaran += data.amount;  // Sum the amount from each document
      pengeluaranData.push({
        id: doc.id,
        ...data,  // Add document data (without the id field)
      });
    });

    // Check if there is data to move
    if (pengeluaranData.length > 0) {
      // Create a new document in 'rekap_data_pengeluaran' without removing data from 'data_pengeluaran'
      await db.collection('rekap_data_pengeluaran').add({
        userId,
        totalPengeluaran,  // Insert total sum of expenses
        month: new Date().getMonth() + 1,  // Example: Store the current month
        year: new Date().getFullYear(),    // Store the current year
        data: pengeluaranData,  // Store the original data (if needed)
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      res.status(200).send('Data successfully copied to rekap_data_pengeluaran.');
    } else {
      res.status(404).send('No data found to copy.');
    }
  } catch (error) {
    console.error('Error moving data:', error);
    res.status(500).send('Error moving data: ' + error.message);
  }
});


app.post('/move_pemasukan_to_rekap', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.userId;  // Get userId from JWT token

    // Fetch data from the 'data_pemasukan' collection
    const snapshot = await db.collection('data_pemasukan')
      .where('userId', '==', userId)
      .get();

    // Initialize variables to store the aggregated data
    let totalPemasukan = 0;
    const pemasukanData = [];

    // Loop through the data to sum the expenses
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      totalPemasukan += data.amount;  // Sum the amount from each document
      pemasukanData.push({
        id: doc.id,
        ...data,  // Add document data (without the id field)
      });
    });

    // Check if there is data to move
    if (pemasukanData.length > 0) {
      // Create a new document in 'rekap_data_pengeluaran' without removing data from 'data_pengeluaran'
      await db.collection('rekap_data_pemasukan').add({
        userId,
        totalPemasukan,  // Insert total sum of expenses
        month: new Date().getMonth() + 1,  // Example: Store the current month
        year: new Date().getFullYear(),    // Store the current year
        data: pemasukanData,  // Store the original data (if needed)
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      res.status(200).send('Data successfully copied to rekap_data_pemasukan.');
    } else {
      res.status(404).send('No data found to copy.');
    }
  } catch (error) {
    console.error('Error moving data:', error);
    res.status(500).send('Error moving data: ' + error.message);
  }
});

app.get('/rekap_pengeluaran_list', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.userId;  // Ambil userId dari JWT token

    // Ambil parameter bulan dan tahun dari query string
    const { bulan, tahun } = req.query;

    // Mulai query Firestore untuk mengambil data berdasarkan userId
    let query = db.collection('rekap_data_pengeluaran').where('userId', '==', userId);

    // Jika bulan dan tahun disediakan, tambahkan filter untuk bulan dan tahun
    if (bulan && tahun) {
      query = query.where('month', '==', parseInt(bulan))
                   .where('year', '==', parseInt(tahun));
    }

    // Ambil data dari Firestore
    const snapshot = await query.get();
    if (snapshot.empty) {
      return res.status(404).send('Data pengeluaran tidak ditemukan untuk bulan dan tahun yang diminta.');
    }

    // Format data yang diambil
    const pengeluaranList = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Kirimkan data ke frontend
    res.status(200).json(pengeluaranList);

  } catch (error) {
    console.error('Error getting pengeluaran: ', error);
    res.status(500).send('Error getting pengeluaran: ' + error.message);
  }
});

app.get('/rekap_pemasukan_list', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.userId;  // Ambil userId dari JWT token

    // Ambil parameter bulan dan tahun dari query string
    const { bulan, tahun } = req.query;

    // Mulai query Firestore untuk mengambil data berdasarkan userId
    let query = db.collection('rekap_data_pemasukan').where('userId', '==', userId);

    // Jika bulan dan tahun disediakan, tambahkan filter untuk bulan dan tahun
    if (bulan && tahun) {
      query = query.where('month', '==', parseInt(bulan))
                   .where('year', '==', parseInt(tahun));
    }

    // Ambil data dari Firestore
    const snapshot = await query.get();
    if (snapshot.empty) {
      return res.status(404).send('Data pemasukan tidak ditemukan untuk bulan dan tahun yang diminta.');
    }

    // Format data yang diambil
    const pemasukanList = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Kirimkan data ke frontend
    res.status(200).json(pemasukanList);

  } catch (error) {
    console.error('Error getting pengeluaran: ', error);
    res.status(500).send('Error getting pengeluaran: ' + error.message);
  }
});



// Start the server
const PORT = process.env.PORT || 3090;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
