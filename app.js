// app.js
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const authRoutes = require('./src/routes/authRoutes');  // Mengimpor rute dari src/routes

// Setup Swagger
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
  apis: ['./src/routes/authRoutes.js'], // Lokasi file untuk mendokumentasikan API
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

// Inisialisasi aplikasi Express
const app = express();
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST'],
}));

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs)); // Swagger Docs

// Gunakan routes
app.use('/api', authRoutes);  // Menggunakan rute dari authRoutes.js

// Menjalankan server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
