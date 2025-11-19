const swaggerJsdoc = require('swagger-jsdoc');

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
            'Masukkan token JWT kamu di sini.\n\nFormat: **Bearer &lt;token&gt;**',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['../routes/*.js'], // akan generate dari semua file route
};

const swaggerSpecs = swaggerJsdoc(options);

module.exports = swaggerSpecs;
