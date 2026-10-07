import { Router } from 'express';
import { getLessonById, markLessonComplete } from '../controllers/lesson.controller';
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

router.get('/:id', optionalAuth, getLessonById);
router.post('/:id/complete', authenticate, markLessonComplete);

export default router;
