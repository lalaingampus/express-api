const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerDocs = require('./config/swagger');

// Lazy-load routes to avoid DB connection on cold start
let routes = null;
let adminRoutes = null;

function loadRoutes() {
  if (!routes) {
    routes = require('./routes');
    adminRoutes = require('./routes/adminRoutes');
  }
}

const app = express();

// Middleware umum
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check - no DB required
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Load routes on first request (lazy)
app.use((req, res, next) => {
  loadRoutes();
  next();
});

// Swagger docs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Admin API routes
app.use('/admin', adminRoutes);

// Routes utama
app.use('/api', routes);

// Static files for admin dashboard
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

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    message: 'Internal server error', 
    error: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
});

// Vercel serverless export
module.exports = app;
