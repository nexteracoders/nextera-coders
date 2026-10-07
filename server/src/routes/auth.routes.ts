import { Router } from 'express';
import {
  register,
  login,
  socialLogin,
  logout,
  getMe,
  changePassword,
  forgotPassword,
  verifyOtp,
  resetPassword,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { authRateLimiter } from '../middleware/rateLimiter.middleware';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
} from '../validators/auth.validator';

const router = Router();

// Public Auth Endpoints
router.post('/register', authRateLimiter, validateRequest(registerSchema), register);
router.post('/login', authRateLimiter, validateRequest(loginSchema), login);
router.post('/social-login', authRateLimiter, socialLogin);
router.post('/logout', logout);
router.post('/forgot-password', authRateLimiter, validateRequest(forgotPasswordSchema), forgotPassword);
router.post('/verify-otp', authRateLimiter, validateRequest(verifyOtpSchema), verifyOtp);
router.post('/reset-password', authRateLimiter, validateRequest(resetPasswordSchema), resetPassword);

// Protected Auth Endpoints
router.get('/me', authenticate, getMe);
router.post('/change-password', authenticate, authRateLimiter, validateRequest(changePasswordSchema), changePassword);

export default router;
