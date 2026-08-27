const express = require('express');
const cors = require('cors');
const path = require('path');
const routes = require('./routes');
const adminRoutes = require('./routes/adminRoutes');
const swaggerUi = require('swagger-ui-express');
const swaggerDocs = require('./config/swagger');

const app = express();

// Middleware umum
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger docs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Admin API routes (must come before static files)
app.use('/admin', adminRoutes);

// Routes utama
app.use('/api', routes);

// Static files for admin dashboard (after routes so API takes priority)
app.use('/admin', express.static(path.join(__dirname, '../public/admin')));

// Root check
app.get('/', (_req, res) => {
  res.send({
    message: '🚀 API berjalan dengan sukses!',
    docs: '/docs',
    admin: '/admin/login',
    version: '1.0.0'
  });
});

// Vercel serverless export
module.exports = app;
