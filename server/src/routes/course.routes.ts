import { Router } from 'express';
import {
  getPublishedCourses,
  getCourseBySlug,
  getCourseLearnData,
  getCourseProgress,
  enrollInCourse,
  getMyEnrolledCourses,
} from '../controllers/course.controller';
import { authenticate } from '../middleware/auth.middleware';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { User } from '../models/user.model';

const router = Router();

const optionalAuth = async (req: any, _res: any, next: any) => {
  try {
    let token = req.cookies?.[config.cookieName];
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      const decoded = jwt.verify(token, config.jwtSecret) as { id: string };
      const user = await User.findById(decoded.id);
      if (user) {
        req.user = user;
      }
    }
  } catch {
    // Ignore invalid tokens for optional auth
  }
  next();
};

router.get('/', optionalAuth, getPublishedCourses);
router.get('/enrolled/me', authenticate, getMyEnrolledCourses);
router.get('/:slug/learn-data', authenticate, getCourseLearnData);
router.get('/:id/progress', authenticate, getCourseProgress);
router.get('/slug/:slug', optionalAuth, getCourseBySlug);
router.get('/:slug', optionalAuth, getCourseBySlug);
router.post('/:id/enroll', authenticate, enrollInCourse);

export default router;
