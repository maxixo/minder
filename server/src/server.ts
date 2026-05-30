import express, { type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import connectDB from './config/database.js';
import prisma from './lib/prisma.js';
import { requireCsrfToken } from './middleware/csrf.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { requireTrustedOrigin } from './middleware/trustedOrigin.js';
import authRoutes from './routes/authRoutes.js';
import cronRoutes from './routes/cronRoutes.js';
import entryRoutes from './routes/entryRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { startDailyReminderJob } from './jobs/reminderJob.js';

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });
await connectDB();

const app = express();
let isShuttingDown = false;

app.disable('x-powered-by');

const parseTrustProxySetting = (value: string | undefined) => {
  if (!value) {
    return process.env.NODE_ENV === 'production' ? 1 : false;
  }

  const normalizedValue = value.trim().toLowerCase();

  if (normalizedValue === 'true') return true;
  if (normalizedValue === 'false') return false;

  const parsedNumber = Number.parseInt(normalizedValue, 10);
  if (!Number.isNaN(parsedNumber)) return parsedNumber;

  return value;
};

app.set('trust proxy', parseTrustProxySetting(process.env.TRUST_PROXY));

app.use(helmet());
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('CORS origin not allowed'));
  },
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(process.env.NODE_ENV === 'development' ? morgan('dev') : morgan('combined'));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/cron', limiter, cronRoutes);
app.use('/api/', limiter);
app.use('/api/', requireTrustedOrigin(allowedOrigins));
app.use('/api/', requireCsrfToken);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Mindful Webapp API is running', timestamp: new Date().toISOString() });
});

app.get('/api/ready', async (req: Request, res: Response) => {
  if (isShuttingDown) {
    return res.status(503).json({ success: false, message: 'Server is shutting down' });
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({ success: true, message: 'Mindful Webapp API is ready' });
  } catch {
    return res.status(503).json({ success: false, message: 'Database is unavailable' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/entries', entryRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🌿 Mindful Webapp API running on port ${PORT} [${process.env.NODE_ENV}]`);
  startDailyReminderJob();
});

const shutdown = async (reason: string, exitCode: number) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.error(`Server shutdown triggered: ${reason}`);

  server.close(async () => {
    await prisma.$disconnect();
    process.exit(exitCode);
  });

  setTimeout(() => {
    process.exit(exitCode);
  }, 10_000).unref();
};

process.on('SIGTERM', () => {
  void shutdown('SIGTERM', 0);
});

process.on('unhandledRejection', (err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  void shutdown(`unhandledRejection: ${message}`, 1);
});

process.on('uncaughtException', (err: Error) => {
  void shutdown(`uncaughtException: ${err.message}`, 1);
});

export default app;
