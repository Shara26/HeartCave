import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';

import connectDB from './config/db.js';
import apiRoutes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { initSockets } from './sockets/index.js';

const app = express();

// ─── CORS allowed origins ─────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL, // your primary frontend origin
  'https://heartcave.in',
  'https://www.heartcave.in',
  'http://localhost:5173',
].filter(Boolean);

// ─── Security & parsing ───────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      // Allow no-origin tools (curl, health checks) and any whitelisted origin.
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// ─── Routes ───────────────────────────────────────────────
app.use('/api', apiLimiter, apiRoutes);

// ─── Errors ───────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Boot ─────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  const server = http.createServer(app);
  initSockets(server);
  server.listen(PORT, () => {
    console.log(`✓ HeartCave API on http://localhost:${PORT}`);
    console.log(`  AI provider: ${process.env.AI_PROVIDER || 'rules'}`);
  });
};

start().catch((err) => {
  console.error('✗ Failed to start server:', err);
  process.exit(1);
});

export default app;