import { Router } from 'express';
import { getAttemptById } from '../controllers/quiz.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// GET /api/quiz-attempts/:attemptId
router.get('/:attemptId', authenticate, getAttemptById);

export default router;
