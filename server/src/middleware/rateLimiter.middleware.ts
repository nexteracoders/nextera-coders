import rateLimit from 'express-rate-limit';
import { ApiResponse } from '../utils/apiResponse';

const isDev = process.env.NODE_ENV !== 'production';

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 100000 : 3000, // Very generous API limit
  skip: () => isDev,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    ApiResponse.error(
      res,
      'Too many requests, please try again after a few moments.',
      'RATE_LIMIT_EXCEEDED',
      429
    );
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 50000 : 100, // 100 auth attempts per window in prod
  skip: () => isDev,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    ApiResponse.error(
      res,
      'Too many authentication attempts, please try again after 15 minutes.',
      'AUTH_RATE_LIMIT_EXCEEDED',
      429
    );
  },
});

export const codeExecutionRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 50000 : 120, // 120 code execution attempts per window
  skip: () => isDev,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    ApiResponse.error(
      res,
      'Too many code execution requests, please wait before submitting again.',
      'EXECUTION_RATE_LIMIT_EXCEEDED',
      429
    );
  },
});

export const necAiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 50000 : 60, // 60 AI requests per 15 minutes
  skip: () => isDev,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    ApiResponse.error(
      res,
      'Too many AI requests. Please give NEC AI a brief moment to catch up.',
      'AI_RATE_LIMIT_EXCEEDED',
      429
    );
  },
});
