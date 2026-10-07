import { Router } from 'express';
import {
  getQuizzes,
  getQuizById,
  startQuizAttempt,
  submitQuiz,
  getQuizAttempts,
} from '../controllers/quiz.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { submitQuizSchema } from '../validators/quiz.validator';

const router = Router();

router.get('/', optionalAuthenticate, getQuizzes);
router.get('/:id', optionalAuthenticate, getQuizById);
router.post('/:id/start', authenticate, startQuizAttempt);
router.post('/:id/submit', authenticate, validate(submitQuizSchema), submitQuiz);
router.get('/:id/attempts', authenticate, getQuizAttempts);

export default router;
