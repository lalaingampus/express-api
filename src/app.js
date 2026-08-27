const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerDocs = require('./config/swagger');

// Lazy-loaded routes
let routesLoaded = false;
let mainRoutes = null;
let adminRoutes = null;

function loadRoutes() {
  if (!routesLoaded) {
    mainRoutes = require('./routes');
    adminRoutes = require('./routes/adminRoutes');
    routesLoaded = true;
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

// Lazy route mounting middleware - runs on every request until routes are loaded
app.use((req, res, next) => {
  loadRoutes();
  next();
});

// Swagger docs (doesn't need DB)
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Mount routes lazily - use a middleware that proxies to the actual routes
app.use('/admin', (req, res, next) => {
  loadRoutes();
  if (adminRoutes) {
    return adminRoutes(req, res, next);
  }
  next();
});

app.use('/api', (req, res, next) => {
  loadRoutes();
  if (mainRoutes) {
    return mainRoutes(req, res, next);
  }
  next();
});

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