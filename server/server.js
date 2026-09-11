/**
 * SKILL BADLU - Main Express Backend Server
 * Sovereign Peer-to-Peer Skill Exchange Protocol & ₹99 Onboarding Payment Gateway
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');
const db = require('./data/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (!req.path.startsWith('/assets') && !req.path.startsWith('/css')) {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'SKILL_BADLU_BACKEND',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    stats: {
      totalUsers: db.getUsers().length,
      totalPayments: db.getPayments().length,
      totalRevenue: db.getRevenueMetrics().totalRevenue
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// Serve static frontend assets from root directory
const rootDir = path.resolve(__dirname, '..');
app.use(express.static(rootDir));

// SPA fallback for frontend root
app.get('/', (req, res) => {
  res.sendFile(path.join(rootDir, 'index.html'));
});

// 404 handler for API routes
app.all('/api/*', (req, res) => {
  res.status(404).json({
    error: 'ENDPOINT_NOT_FOUND',
    message: `API route ${req.method} ${req.path} not found.`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err);
  res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: err.message || 'An unexpected error occurred.'
  });
});

// Start listening if run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n========================================================`);
    console.log(`  ⚡ SKILL BADLU BACKEND SERVER RUNNING`);
    console.log(`  📡 Port: http://localhost:${PORT}`);
    console.log(`  🔒 Auth Gate: Pre-Login Admin KYC + ₹99 Gateway Active`);
    console.log(`  💳 Payment Endpoint: http://localhost:${PORT}/api/payments`);
    console.log(`  👑 Admin Sovereign Desk: http://localhost:${PORT}/api/admin`);
    console.log(`========================================================\n`);
  });
}

module.exports = app;
