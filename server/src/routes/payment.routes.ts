import { Router } from 'express';
import { getPublicPaymentConfig } from '../controllers/paymentSettings.controller';
import { validateCoupon } from '../controllers/coupon.controller';
import {
  submitPaymentRequest,
  getMyPaymentRequests,
} from '../controllers/paymentRequest.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/config', getPublicPaymentConfig);
router.post('/coupons/validate', validateCoupon);

// Student / Guest routes
router.post('/requests', optionalAuthenticate, submitPaymentRequest);
router.get('/my-requests', authenticate, getMyPaymentRequests);

export default router;
