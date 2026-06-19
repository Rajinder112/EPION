const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend requests
app.use(cors({
  origin: '*', // Allow all origins for dev/sandbox ease
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Origin: ${req.headers.origin || 'N/A'}`);
  next();
});

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Create upload and local db directory if not exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Import db to trigger connection checker
require('./db');

// Root status endpoint
app.get('/', (req, res) => {
  const dbModule = require('./db');
  res.json({
    status: 'online',
    appName: 'SGPGI Nursing Prep API',
    databaseFallbackActive: dbModule.isUsingLocalDb(),
    localDbFile: dbModule.isUsingLocalDb() ? dbModule.getLocalDbPath() : 'Using PostgreSQL connection'
  });
});

// Mount routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/practice', require('./routes/practice'));
app.use('/api/mocks', require('./routes/mocks'));
app.use('/api/analytics', require('./routes/analytics'));

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.stack);
  res.status(500).json({
    message: 'Something went wrong on the server',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`SGPGI Nursing Prep Server is running on port ${PORT} (Listening on all interfaces)`);
});
