import { Router } from 'express';
import {
  getProjects,
  getProjectBySlug,
  getProjectCategories,
} from '../controllers/project.controller';

const router = Router();

router.get('/', getProjects);
router.get('/categories', getProjectCategories);
router.get('/:slug', getProjectBySlug);

export default router;
