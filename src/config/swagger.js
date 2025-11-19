const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Finance Tracker API',
      version: '1.0.0',
      description:
        'API untuk manajemen pemasukan, pengeluaran, hutang, rekap, dan NB.\n\n' +
        'Gunakan tombol **Authorize** di kanan atas untuk login menggunakan token JWT global.',
    },
    servers: [
      { url: 'http://localhost:3090/api' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description:
            'Masukkan token JWT kamu di sini.\n\nFormat: **Bearer <token>**',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },

  // FIX PENTING
  apis: [path.join(__dirname, '../routes/*.js')],
};

module.exports = swaggerJsdoc(options);
