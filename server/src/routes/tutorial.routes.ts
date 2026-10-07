import { Router } from 'express';
import {
  getTutorials,
  getTutorialTracks,
  getTutorialSubjects,
  getTutorialBySlug,
  getTutorialCategories,
} from '../controllers/tutorial.controller';

const router = Router();

router.get('/', getTutorials);
router.get('/tracks', getTutorialTracks);
router.get('/subjects', getTutorialSubjects);
router.get('/categories', getTutorialCategories);
router.get('/:slug', getTutorialBySlug);

export default router;
