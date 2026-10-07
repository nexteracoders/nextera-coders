import { Router } from 'express';
import {
  getPublicMentors,
  getMentorById,
  toggleFollowMentor,
  getMentorMe,
  updateMentorMe,
  changeMentorPassword,
} from '../controllers/mentor.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/', optionalAuthenticate, getPublicMentors);

// Mentor Self routes (Logged-in mentor)
router.get('/me', authenticate, getMentorMe);
router.put('/me', authenticate, updateMentorMe);
router.put('/me/password', authenticate, changeMentorPassword);

// Mentor public profile by ID/slug
router.get('/:id', optionalAuthenticate, getMentorById);

// Student follow/unfollow mentor
router.post('/:id/follow', authenticate, toggleFollowMentor);

export default router;
