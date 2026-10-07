import { Router } from 'express';
import {
  debugCode,
  getProgressiveHint,
  chatWithMentor,
  fixCompilerError,
  generateCompilerTestCases,
  getAiStatus,
} from '../controllers/necAi.controller';
import { optionalAuthenticate } from '../middleware/auth.middleware';
import { necAiRateLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

// Rate limited endpoints with optional auth (accessible to logged-in students and guests)
router.use(necAiRateLimiter);
router.use(optionalAuthenticate);

// GET /api/v1/nec-ai/status
router.get('/status', getAiStatus);

// POST /api/v1/nec-ai/debug
router.post('/debug', debugCode);

// POST /api/v1/nec-ai/hints
router.post('/hints', getProgressiveHint);

// POST /api/v1/nec-ai/chat
router.post('/chat', chatWithMentor);

// POST /api/v1/nec-ai/compiler-fix
router.post('/compiler-fix', fixCompilerError);

// POST /api/v1/nec-ai/generate-testcases
router.post('/generate-testcases', generateCompilerTestCases);

export default router;
