import { Router } from 'express';
import {
  getProblems,
  getProblemBySlug,
  getProblemCategories,
  getDSAStats,
} from '../controllers/problem.controller';
import { optionalAuthenticate } from '../middleware/auth.middleware';

const router = Router();

// Public with optional user session resolution
router.get('/', optionalAuthenticate, getProblems);
router.get('/categories', getProblemCategories);
router.get('/dsa/stats', optionalAuthenticate, getDSAStats);
router.get('/:slug', optionalAuthenticate, getProblemBySlug);

export default router;
