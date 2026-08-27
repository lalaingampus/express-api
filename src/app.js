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

// Static files for admin dashboard
app.use('/admin', express.static(path.join(__dirname, '../public/admin')));

// Swagger docs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Admin routes
app.use('/admin', adminRoutes);

// Routes utama
app.use('/api', routes);

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
