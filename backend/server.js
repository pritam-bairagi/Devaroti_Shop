require('express-async-errors');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cluster = require('cluster');
const os = require('os');

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased from 100 to 1000 to accommodate dashboard requests
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
  }
});

const path = require('path');
const fs = require('fs');
const http = require('http');
const socketAction = require('./src/utils/socketAction');

dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./src/middleware/errorMiddleware');

const app = express();
const server = http.createServer(app);

const startServer = async () => {
  try {
    await connectDB();
    socketAction.initSocket(server);

    app.use(cors({
      origin: [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    if (process.env.NODE_ENV === 'development') {
      app.use(morgan('dev'));
    } else {
      app.use(morgan('combined'));
    }

    app.use(compression());
    app.use(mongoSanitize());
    app.use(helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false
    }));

    // Apply rate limiter to all API routes
    app.use('/api', limiter);

    // FIX: Stripe webhook needs raw body — must come BEFORE express.json()
    app.use('/api/payment/stripe/webhook',
      express.raw({ type: 'application/json' }),
      (req, res, next) => { req.rawBody = req.body; next(); }
    );

    app.use(express.json({ limit: '1mb' }));
    app.use(express.urlencoded({ extended: true, limit: '1mb' }));

    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    app.use('/uploads', express.static(uploadsDir, { maxAge: '1d' }));

    // Routes
    app.use('/api/auth', require('./src/routes/authRoutes'));
    app.use('/api/users', require('./src/routes/userRoutes'));
    app.use('/api/products', require('./src/routes/productRoutes'));
    app.use('/api/orders', require('./src/routes/orderRoutes'));
    app.use('/api/admin', require('./src/routes/adminRoutes'));
    app.use('/api/seller', require('./src/routes/sellerRoutes'));
    app.use('/api/payment', require('./src/routes/paymentRoutes'));
    app.use('/api/reviews', require('./src/routes/reviewRoutes'));
    app.use('/api/config', require('./src/routes/configRoutes'));
    app.use('/api/coupons', require('./src/routes/couponRoutes'));
    app.use('/api/withdrawals', require('./src/routes/withdrawalRoutes'));
    app.use('/api/courier', require('./src/routes/courierRoutes'));
    app.use('/api/chats', require('./src/routes/chatRoutes'));
    app.use('/api/upload', require('./src/routes/uploadRoutes'));

    // FIX: Google OAuth callback must be public (no admin middleware)
    app.get(
      '/api/admin/google/callback',
      require('./src/controllers/adminController').googleDriveCallback
    );

    app.get('/health', (req, res) => res.json({
      success: true,
      message: 'Server is healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    }));

    app.use(notFound);
    app.use(errorHandler);

    const PORT = Number(process.env.PORT) || 5000;

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
      console.log(`🩺 Health: http://localhost:${PORT}/health`);
      console.log(`📊 DB: ${mongoose.connection.name} @ ${mongoose.connection.host}`);
      console.log('='.repeat(50) + '\n');
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Port ${PORT} is already in use!`);
        console.error('Solutions:');
        console.error(`  Windows: netstat -ano | findstr :${PORT}  then  taskkill /PID <PID> /F`);
        console.error(`  Or run:  npx kill-port ${PORT}`);
        console.error(`  Or change PORT in .env file\n`);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

if (cluster.isMaster && process.env.NODE_ENV === 'production') {
  const numCPUs = os.cpus().length;
  console.log(`\n🚀 Master ${process.pid} is running`);
  console.log(`🧵 Spanning ${numCPUs} workers...\n`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`⚠️ Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
} else {
  startServer();
}

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
});
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err?.message || err);
});

process.on('SIGTERM', async () => {
  console.log('👋 SIGTERM received. Closing...');
  await mongoose.connection.close();
  process.exit(0);
});
process.on('SIGINT', async () => {
  console.log('\n👋 SIGINT received. Closing...');
  await mongoose.connection.close();
  process.exit(0);
});

module.exports = app;