import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { config } from './config/env';
import routes from './routes';
import { errorHandler } from './middleware/error.middleware';
import { notFoundHandler } from './middleware/notFound.middleware';
import { apiRateLimiter } from './middleware/rateLimiter.middleware';

const app: Express = express();

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false,
  })
);

// Cross-Origin Resource Sharing with credentials
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const configuredOrigins = (config.clientUrl || '')
        .split(',')
        .map((url) => url.trim().replace(/\/+$/, ''))
        .filter(Boolean);

      const normalizedOrigin = origin.replace(/\/+$/, '');
      const isAllowed =
        normalizedOrigin.startsWith('http://localhost') ||
        normalizedOrigin.startsWith('http://127.0.0.1') ||
        configuredOrigins.includes(normalizedOrigin) ||
        configuredOrigins.includes('*') ||
        config.nodeEnv !== 'production';

      callback(null, isAllowed);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Request Logging
if (config.nodeEnv !== 'test') {
  app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));
}

// Parsers (with rawBody capture for webhook signature verification)
app.use(
  express.json({
    limit: '10mb',
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate Limiting on /api
app.use('/api', apiRateLimiter);

// Mount API Routes
app.use('/api', routes);

// 404 Route Handler
app.use(notFoundHandler);

// Central Error Handler
app.use(errorHandler);

export default app;
