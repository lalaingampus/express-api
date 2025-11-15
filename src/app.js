const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const swaggerUi = require('swagger-ui-express');
const swaggerDocs = require('./config/swagger');

const app = express();

// Middleware umum
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger docs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Routes utama
app.use('/api', routes);

// Root check
app.get('/', (_req, res) => {
  res.send({
    message: '🚀 API berjalan dengan sukses!',
    docs: '/docs',
    version: '1.0.0'
  });
});

module.exports = app;
