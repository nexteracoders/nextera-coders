import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  getMyEnrollments,
  getMyDashboard,
  getMyWallet,
  claimDailyStreak,
  redeemStoreReward,
  getMyCodingProfile,
  getUserPublicProfile,
  toggleFollowUser,
  getUserFollowers,
  getUserFollowing,
  getInstituteLeaderboard,
  awardContestReward,
} from '../controllers/user.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { updateProfileSchema } from '../validators/user.validator';

const router = Router();

// Public / Optional Auth routes
router.get('/:id/public-profile', optionalAuthenticate, getUserPublicProfile);
router.get('/:id/followers', optionalAuthenticate, getUserFollowers);
router.get('/:id/following', optionalAuthenticate, getUserFollowing);

// Protected routes (Self & Actions)
router.use(authenticate);

router.get('/me', getProfile);
router.put('/me', validateRequest(updateProfileSchema), updateProfile);
router.patch('/me', validateRequest(updateProfileSchema), updateProfile);
router.get('/me/enrollments', getMyEnrollments);
router.get('/me/dashboard', getMyDashboard);
router.get('/me/wallet', getMyWallet);
router.get('/me/coding-profile', getMyCodingProfile);
router.get('/me/institute-leaderboard', getInstituteLeaderboard);
router.post('/me/streak/claim', claimDailyStreak);
router.post('/me/rewards/claim', redeemStoreReward);
router.post('/me/contest/award', awardContestReward);
router.post('/:id/follow', toggleFollowUser);

export default router;
