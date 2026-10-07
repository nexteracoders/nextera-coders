import { Router } from 'express';
import {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  togglePinPost,
  toggleLikePost,
  addComment,
  deleteComment,
  deletePost,
  reportPost,
  dismissReports,
} from '../controllers/post.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';

const router = Router();

// Public / Optional Authenticate routes
router.get('/', optionalAuthenticate, getPosts);
router.get('/:id', optionalAuthenticate, getPostById);

// Protected routes (Logged in students & admins)
router.post('/', authenticate, createPost);
router.put('/:id', authenticate, updatePost);
router.patch('/:id/pin', authenticate, togglePinPost);
router.post('/:id/like', authenticate, toggleLikePost);
router.post('/:id/comment', authenticate, addComment);
router.delete('/:id/comment/:commentId', authenticate, deleteComment);
router.delete('/:id', authenticate, deletePost);

// Moderation & Reporting routes
router.post('/:id/report', authenticate, reportPost);
router.patch('/:id/dismiss-reports', authenticate, dismissReports);

export default router;

