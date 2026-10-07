import { Router } from 'express';
import { runCode } from '../controllers/submission.controller';
import { optionalAuthenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { runCodeSchema } from '../validators/submission.validator';
import { codeExecutionRateLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

// POST /api/code/run
router.post('/run', optionalAuthenticate, codeExecutionRateLimiter, validate(runCodeSchema), runCode);

export default router;
