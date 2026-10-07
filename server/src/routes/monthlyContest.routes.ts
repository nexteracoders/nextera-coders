import { Router } from 'express';
import {
  getActiveContest,
  getLeaderboard,
  getMyAttempt,
  startAttempt,
  solveChallenge,
  recordWarning,
  submitContest,
  adminGetConfig,
  adminUpdateConfig,
  adminUpdateLeaderboard,
  adminResetAttempt,
  adminSeedContest,
} from '../controllers/monthlyContest.controller';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// Public / Student contest views
router.get('/active', getActiveContest);
router.get('/leaderboard', getLeaderboard);

// Authenticated student actions
router.get('/my-attempt', authenticate, getMyAttempt);
router.post('/start', authenticate, startAttempt);
router.post('/solve', authenticate, solveChallenge);
router.post('/warning', authenticate, recordWarning);
router.post('/submit', authenticate, submitContest);

// Admin CMS Controls
router.get('/admin/config', authenticate, authorizeRoles('admin', 'sub_admin'), adminGetConfig);
router.put('/admin/config', authenticate, authorizeRoles('admin', 'sub_admin'), adminUpdateConfig);
router.put('/admin/leaderboard', authenticate, authorizeRoles('admin'), adminUpdateLeaderboard);
router.post('/admin/reset-attempt', authenticate, authorizeRoles('admin'), adminResetAttempt);
router.post('/admin/seed', authenticate, authorizeRoles('admin', 'sub_admin'), adminSeedContest);

export default router;
