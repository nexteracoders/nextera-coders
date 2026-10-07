import { Request, Response, NextFunction } from 'express';
import { monthlyContestService } from '../services/monthlyContest.service';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

// @desc    Get active monthly contest config, stages & rules
// @route   GET /api/monthly-contest/active
// @access  Public
export const getActiveContest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const monthKey = req.query.monthKey as string | undefined;
    const config = await monthlyContestService.getActiveContestConfig(monthKey);
    ApiResponse.success(res, 'Monthly contest config fetched successfully', config, 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Get current contest leaderboard with prize allocations
// @route   GET /api/monthly-contest/leaderboard
// @access  Public
export const getLeaderboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const monthKey = req.query.monthKey as string | undefined;
    const leaderboard = await monthlyContestService.getLeaderboard(monthKey);
    ApiResponse.success(res, 'Leaderboard retrieved successfully', leaderboard, 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's contest attempt status, solved problems & timer
// @route   GET /api/monthly-contest/my-attempt
// @access  Protected (Student)
export const getMyAttempt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const monthKey = req.query.monthKey as string | undefined;
    const attempt = await monthlyContestService.getUserAttempt(userId, monthKey);
    ApiResponse.success(res, 'User contest attempt retrieved', attempt, 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Start 72-hour personal countdown window for contest
// @route   POST /api/monthly-contest/start
// @access  Protected (Student)
export const startAttempt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { monthKey } = req.body;
    const attempt = await monthlyContestService.startAttempt(userId, monthKey);
    ApiResponse.success(res, '72-Hour personal contest sprint started', attempt, 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a contest problem as solved with automatic verified blue tick hash
// @route   POST /api/monthly-contest/solve
// @access  Protected (Student)
export const solveChallenge = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { slug, difficulty, monthKey } = req.body;

    if (!slug) {
      throw ApiError.badRequest('Problem slug is required');
    }

    const result = await monthlyContestService.solveChallenge(
      userId,
      slug,
      difficulty || 'Medium',
      monthKey
    );

    ApiResponse.success(res, 'Challenge solved and verified', result, 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Record anti-cheat tab-switch warning & reduce trust integrity
// @route   POST /api/monthly-contest/warning
// @access  Protected (Student)
export const recordWarning = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { monthKey } = req.body;
    const attempt = await monthlyContestService.recordWarning(userId, monthKey);
    ApiResponse.success(res, 'Warning recorded', attempt, 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Submit final contest attempt, lock score, and enter leaderboard
// @route   POST /api/monthly-contest/submit
// @access  Protected (Student)
export const submitContest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const { monthKey, college, country } = req.body;

    const result = await monthlyContestService.submitContest(
      user.id,
      {
        name: user.name,
        username: (user as any).username || (user.email ? user.email.split('@')[0] : 'contestant'),
        avatar: user.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
        college: college || (user as any).college,
        country: country || (user as any).country,
      },
      monthKey
    );

    ApiResponse.success(res, 'Contest submitted successfully to official leaderboard', result, 200);
  } catch (error) {
    next(error);
  }
};

// ================= ADMIN CMS CONTROLS =================

// @desc    Admin: Get full contest configuration & management state
// @route   GET /api/monthly-contest/admin/config
// @access  Admin only
export const adminGetConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const monthKey = req.query.monthKey as string | undefined;
    const config = await monthlyContestService.getActiveContestConfig(monthKey);
    ApiResponse.success(res, 'Admin contest config retrieved', config, 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Update contest configuration, prizes, rules, or stages
// @route   PUT /api/monthly-contest/admin/config
// @access  Admin only
export const adminUpdateConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { monthKey, ...updates } = req.body;
    const updated = await monthlyContestService.updateContestConfig(updates, monthKey);
    ApiResponse.success(res, 'Contest configuration updated successfully', updated, 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Directly modify, re-rank, or adjust the leaderboard
// @route   PUT /api/monthly-contest/admin/leaderboard
// @access  Admin only
export const adminUpdateLeaderboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { leaderboard, monthKey } = req.body;
    if (!Array.isArray(leaderboard)) {
      throw ApiError.badRequest('Leaderboard must be an array of entries');
    }
    const updated = await monthlyContestService.updateLeaderboard(leaderboard, monthKey);
    ApiResponse.success(res, 'Leaderboard updated successfully by admin', updated, 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Reset a student attempt
// @route   POST /api/monthly-contest/admin/reset-attempt
// @access  Admin only
export const adminResetAttempt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId, monthKey } = req.body;
    if (!userId) {
      throw ApiError.badRequest('userId is required');
    }
    const success = await monthlyContestService.resetUserAttempt(userId, monthKey);
    ApiResponse.success(res, 'Student contest attempt reset successfully', { reset: success }, 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Re-seed default month configuration
// @route   POST /api/monthly-contest/admin/seed
// @access  Admin only
export const adminSeedContest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { monthKey, forceReset } = req.body;
    const config = await monthlyContestService.seedContest(monthKey, Boolean(forceReset));
    ApiResponse.success(res, 'Monthly contest seeded successfully', config, 200);
  } catch (error) {
    next(error);
  }
};
