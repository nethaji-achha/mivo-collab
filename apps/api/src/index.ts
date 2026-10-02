import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth.routes';
import { meetingsRouter } from './routes/meetings.routes';
import { usersRouter } from './routes/users.routes';
import { organizationsRouter } from './routes/organizations.routes';
import { billingRouter } from './routes/billing.routes';
import { notificationsRouter } from './routes/notifications.routes';
import { adminRouter } from './routes/admin.routes';
import { chatRouter } from './routes/chat.routes';
import { pollsRouter } from './routes/polls.routes';
import { productsRouter } from './routes/products.routes';
import { errorHandler } from './middleware/errorHandler.middleware';
import { APP_CONFIG } from '@mivo/config';

dotenv.config();

const app = express();
const PORT = process.env.PORT || APP_CONFIG.defaultPort.api;

// Security & Parsing Middlewares
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow local development, vercel previews, and configured origins
      callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many requests, please try again later.' } },
});
app.use('/api/', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: '@mivo/api',
    version: APP_CONFIG.version,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/meetings', meetingsRouter);
app.use('/api/users', usersRouter);
app.use('/api/organizations', organizationsRouter);
app.use('/api/billing', billingRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/chat', chatRouter);
app.use('/api/meetings', pollsRouter);
app.use('/api/products', productsRouter);

// Centralized error handling
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`🚀 [Mivo Collab API] Running on http://localhost:${PORT}`);
  console.log(`📡 [Mivo Collab API] Health check ready at http://localhost:${PORT}/health`);
});

export { app, server };
