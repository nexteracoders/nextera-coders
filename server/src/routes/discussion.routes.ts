import { Router } from 'express';
import {
  getProblemDiscussions,
  createProblemDiscussion,
  toggleLikeDiscussion,
  addReplyDiscussion,
  deleteProblemDiscussion,
} from '../controllers/discussion.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';

const router = Router();

// Public / Optional Authenticate (allows guests to read and auto-identifies logged in student's likes)
router.get('/:problemSlug', optionalAuthenticate, getProblemDiscussions);

// Protected actions (must be logged in)
router.post('/:problemSlug', authenticate, createProblemDiscussion);
router.post('/comments/:commentId/like', authenticate, toggleLikeDiscussion);
router.post('/comments/:commentId/reply', authenticate, addReplyDiscussion);
router.delete('/comments/:commentId', authenticate, deleteProblemDiscussion);

export default router;
