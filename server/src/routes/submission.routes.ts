import { Router } from 'express';
import {
  runCode,
  submitSolution,
  getMySubmissions,
  getProblemSubmissions,
  getSubmissionStatus,
} from '../controllers/submission.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { runCodeSchema, submitCodeSchema } from '../validators/submission.validator';
import { codeExecutionRateLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

// Student authenticated endpoints
router.post('/run', authenticate, codeExecutionRateLimiter, validate(runCodeSchema), runCode);
router.post('/', authenticate, codeExecutionRateLimiter, validate(submitCodeSchema), submitSolution);
router.get('/my', authenticate, getMySubmissions);
router.get('/problem/:problemId', authenticate, getProblemSubmissions);
router.get('/:id/status', authenticate, getSubmissionStatus);
router.get('/:id', authenticate, getSubmissionStatus);

export default router;
