import { Router } from 'express';
import {
  getMyProblemLists,
  createProblemList,
  updateProblemList,
  deleteProblemList,
  toggleProblemInLists,
  getProblemBookmarkStatus,
  removeProblemFromList,
} from '../controllers/problemList.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All problem list operations require authentication
router.use(authenticate);

router.get('/', getMyProblemLists);
router.post('/', createProblemList);
router.post('/toggle', toggleProblemInLists);
router.get('/status/:slug', getProblemBookmarkStatus);
router.put('/:id', updateProblemList);
router.delete('/:id', deleteProblemList);
router.delete('/:id/problems/:problemSlug', removeProblemFromList);

export default router;
