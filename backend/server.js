require('dotenv').config();
const http = require('http');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');

const { connectDB } = require('./src/config/database');
const { connectRedis, getRedisClient, getRedisSubscriber } = require('./src/config/redis');
const { socketAuth } = require('./src/socket/socketAuth');
const { registerSocketHandlers } = require('./src/socket/index');
const { errorHandler, notFound } = require('./src/middleware/errorHandler');
const { apiLimiter } = require('./src/middleware/rateLimiter');
const logger = require('./src/utils/logger');

// ── Route imports ──────────────────────────────────────────────────────────────
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const roomRoutes = require('./src/routes/rooms');

// ── Express setup ──────────────────────────────────────────────────────────────
const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      process.env.CLIENT_URL,
      'http://localhost:5173',
      'http://localhost:3000',
    ].filter(Boolean);
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Handle preflight for all routes
app.options('*', cors());
app.use(compression());
app.use(morgan('combined', { stream: { write: (msg) => logger.http(msg.trim()) } }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// ── REST API ──────────────────────────────────────────────────────────────────
app.use('/api', apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok', ts: Date.now() }));

app.use(notFound);
app.use(errorHandler);

// ── HTTP + Socket.IO server ───────────────────────────────────────────────────
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 min
    skipMiddlewares: true,
  },
  pingTimeout: 20000,
  pingInterval: 10000,
});

// ── Bootstrap ─────────────────────────────────────────────────────────────────
async function bootstrap() {
  try {
    await connectDB();
    await connectRedis();

    // Attach Redis adapter only when Redis is available
    const pubClient = getRedisClient();
    const subClient = getRedisSubscriber();
    if (pubClient && subClient) {
      io.adapter(createAdapter(pubClient, subClient));
      logger.info('Socket.IO Redis adapter attached.');
    } else {
      logger.info('Redis not configured — using in-memory Socket.IO adapter (single-server mode).');
    }

    // Socket auth middleware
    io.use(socketAuth);

    // Register event handlers
    registerSocketHandlers(io);

    const PORT = parseInt(process.env.PORT || '4000', 10);
    httpServer.listen(PORT, () => {
      logger.info(`CollabCode backend running on port ${PORT}`);
    });
  } catch (err) {
    logger.error('Bootstrap failed', { err: err.message });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down...');
  httpServer.close(() => process.exit(0));
});

bootstrap();
