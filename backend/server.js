const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/database');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`);
  next();
});

// Import routes
const authRoutes = require('./routes/authRoutes');
const societyRoutes = require('./routes/societyRoutes');
const proofRoutes = require('./routes/proofRoutes');
const adminRoutes = require('./routes/adminRoutes');
const complianceRoutes = require('./routes/complianceRoutes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/society', societyRoutes);
app.use('/api/proof', proofRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', complianceRoutes); // compliance, rebate, resident, heatmap

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Green-Tax Compliance & Rebate Monitor API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      society: '/api/society',
      proof: '/api/proof',
      admin: '/api/admin',
      compliance: '/api/compliance',
      rebate: '/api/rebate',
      resident: '/api/resident',
      heatmap: '/api/heatmap'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  console.error(err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║   🌿 Green-Tax Backend Server Running         ║
║   📡 Port: ${PORT}                            ║
║   🌍 Environment: ${process.env.NODE_ENV || 'development'}              ║
║   📊 MongoDB: Connected                       ║
╚═══════════════════════════════════════════════╝
  `);
  console.log('✅ Server is ready to accept requests\n');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

module.exports = app;