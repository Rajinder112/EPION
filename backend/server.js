const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable Helmet for secure HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting configurations
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { message: 'Too many requests from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  message: { message: 'Too many login or registration attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiter to all API endpoints
app.use('/api', limiter);
// Apply stricter limiters to authentication routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

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

// Body parser middleware with expanded limits for avatar/image uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: false }));

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
