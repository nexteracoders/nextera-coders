import { Router } from 'express';
import {
  getRewards,
  adminCreateReward,
  adminUpdateReward,
  adminDeleteReward,
  adminResetRewards,
} from '../controllers/reward.controller';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// Public: Get all active rewards (auto-seeds if empty)
router.get('/', getRewards);

// Admin & Sub-Admin operations
router.post('/', authenticate, authorizeRoles('admin', 'sub_admin'), adminCreateReward);
router.put('/:id', authenticate, authorizeRoles('admin', 'sub_admin'), adminUpdateReward);
router.delete('/:id', authenticate, authorizeRoles('admin', 'sub_admin'), adminDeleteReward);
router.post('/reset', authenticate, authorizeRoles('admin', 'sub_admin'), adminResetRewards);

export default router;
