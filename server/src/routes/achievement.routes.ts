import { Router } from 'express';
import {
  getAchievements,
  getGamificationSummary,
  getPointHistory,
} from '../controllers/achievement.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getAchievements);
router.get('/summary', authenticate, getGamificationSummary);
router.get('/points', authenticate, getPointHistory);

export default router;
