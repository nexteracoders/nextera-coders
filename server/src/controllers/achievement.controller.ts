import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Achievement } from '../models/achievement.model';
import { User } from '../models/user.model';
import { PointTransaction } from '../models/pointTransaction.model';
import { gamificationService } from '../services/gamification.service';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

// @desc    Get all achievements with current user progress
// @route   GET /api/achievements
// @access  Protected (Student / User)
export const getAchievements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const achievements = await gamificationService.getAllAchievementsWithUserProgress(user._id);

    const unlockedCount = achievements.filter((a) => a.isUnlocked).length;
    const totalPoints = user.totalPoints || user.points || 0;

    ApiResponse.success(
      res,
      'Achievements retrieved successfully',
      {
        achievements,
        stats: {
          totalAchievements: achievements.length,
          unlockedCount,
          lockedCount: achievements.length - unlockedCount,
          totalPoints,
          currentStreak: user.learningStreak || 0,
        },
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get gamification summary for student (points, streak, recent achievements)
// @route   GET /api/gamification/summary
// @access  Protected (Student / User)
export const getGamificationSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const summary = await gamificationService.getStudentGamificationSummary(user._id);

    ApiResponse.success(res, 'Gamification summary retrieved', { summary }, 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Get user points transaction history
// @route   GET /api/gamification/points
// @access  Protected (Student / User)
export const getPointHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const skip = (page - 1) * limit;

    const [transactions, totalItems, freshUser] = await Promise.all([
      PointTransaction.find({ userId: user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      PointTransaction.countDocuments({ userId: user._id }),
      User.findById(user._id).select('points totalPoints').lean(),
    ]);

    ApiResponse.success(
      res,
      'Point history retrieved',
      {
        transactions: transactions.map((t: any) => ({
          id: t._id.toString(),
          amount: t.amount,
          type: t.type,
          referenceType: t.referenceType,
          referenceId: t.referenceId,
          description: t.description,
          createdAt: t.createdAt,
        })),
        totalPoints: typeof freshUser?.points === 'number' ? freshUser.points : (user.points || 0),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalItems / limit) || 1,
          totalItems,
          limit,
        },
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Get all achievements
// @route   GET /api/admin/achievements
// @access  Protected (Admin)
export const getAdminAchievements = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const achievements = await Achievement.find().sort({ category: 1, requirementValue: 1 }).lean();

    ApiResponse.success(
      res,
      'Admin achievements list',
      {
        achievements: achievements.map((a) => ({
          id: a._id.toString(),
          name: a.name,
          slug: a.slug,
          description: a.description,
          icon: a.icon,
          category: a.category,
          requirementType: a.requirementType,
          requirementValue: a.requirementValue,
          points: a.points,
          isActive: a.isActive,
          createdAt: a.createdAt,
        })),
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Create new achievement
// @route   POST /api/admin/achievements
// @access  Protected (Admin)
export const createAdminAchievement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      name,
      slug,
      description,
      icon,
      category,
      requirementType,
      requirementValue,
      points,
      isActive,
    } = req.body;

    const generatedSlug =
      slug ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    const achievement = await Achievement.create({
      name,
      slug: generatedSlug,
      description,
      icon: icon || 'Award',
      category: category || 'Learning',
      requirementType,
      requirementValue: Number(requirementValue) || 1,
      points: Number(points) || 50,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    ApiResponse.success(
      res,
      'Achievement created successfully',
      { achievement },
      201
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Update achievement
// @route   PUT /api/admin/achievements/:id
// @access  Protected (Admin)
export const updateAdminAchievement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid achievement ID');
    }

    const updated = await Achievement.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      throw ApiError.notFound('Achievement not found');
    }

    ApiResponse.success(res, 'Achievement updated successfully', { achievement: updated }, 200);
  } catch (error) {
    next(error);
  }
};
