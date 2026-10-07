import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/user.model';
import { Lesson } from '../models/lesson.model';
import { Enrollment } from '../models/enrollment.model';
import { PaymentRequest } from '../models/paymentRequest.model';
import { Submission } from '../models/submission.model';
import { Tutorial } from '../models/tutorial.model';
import { Reward } from '../models/reward.model';
import { CodingProblem } from '../models/problem.model';
import { PointTransaction } from '../models/pointTransaction.model';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';

// @desc    Get user profile with live enrollment counts & subscription history
// @route   GET /api/users/me
// @access  Protected
export const getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required.', 'AUTH_REQUIRED');
    }

    const [enrolledCount, completedCount, paymentRequests, proEnrollments] = await Promise.all([
      Enrollment.countDocuments({ userId: req.user._id }),
      Enrollment.countDocuments({ userId: req.user._id, progress: 100 }),
      PaymentRequest.find({
        $or: [{ userId: req.user._id }, { userEmail: req.user.email.toLowerCase() }],
      })
        .sort({ createdAt: -1 })
        .lean(),
      Enrollment.find({ userId: req.user._id, tier: 'pro' })
        .populate('courseId', 'title slug thumbnail category level duration')
        .sort({ updatedAt: -1 })
        .lean(),
    ]);

    const sanitized = req.user.toSanitizedUser();

    ApiResponse.success(
      res,
      'User profile retrieved successfully.',
      {
        user: {
          ...sanitized,
          stats: {
            enrolledCourses: enrolledCount,
            completedCourses: completedCount,
            proCoursesCount: proEnrollments.length,
          },
          paymentRequests,
          proEnrollments,
        },
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile safe fields
// @route   PUT /api/users/me
// @access  Protected
export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required.', 'AUTH_REQUIRED');
    }

    const { name, profileImage, profileImages, autoFlipAvatar, bio, skills, github, linkedin, college, phone } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      throw ApiError.notFound('User not found.', 'USER_NOT_FOUND');
    }

    if (name !== undefined) user.name = name.trim();
    if (profileImage !== undefined) user.profileImage = profileImage;
    if (profileImages !== undefined) user.profileImages = profileImages;
    if (autoFlipAvatar !== undefined) user.autoFlipAvatar = autoFlipAvatar;
    if (college !== undefined) user.college = college.trim();
    if (bio !== undefined) user.bio = bio;
    if (skills !== undefined) user.skills = skills;
    if (github !== undefined) user.github = github.trim();
    if (linkedin !== undefined) user.linkedin = linkedin.trim();
    if (phone !== undefined) user.phone = phone.trim();

    await user.save();

    ApiResponse.success(
      res,
      'Profile updated successfully.',
      { user: user.toSanitizedUser() },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get student enrollments with tab status filtering & pagination
// @route   GET /api/users/me/enrollments
// @access  Protected (Student)
export const getMyEnrollments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const status = (req.query.status as string) || 'all';
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 12;
    const skip = (page - 1) * limit;

    const filter: any = { userId: user._id };

    if (status === 'in-progress') {
      filter.progress = { $lt: 100 };
    } else if (status === 'completed') {
      filter.$or = [{ progress: 100 }, { completedAt: { $exists: true, $ne: null } }];
    }

    const [enrollments, totalItems] = await Promise.all([
      Enrollment.find(filter)
        .populate('courseId')
        .populate('lastAccessedLesson')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Enrollment.countDocuments(filter),
    ]);

    const enrichedEnrollments = await Promise.all(
      enrollments
        .filter((e) => e.courseId)
        .map(async (e: any) => {
          const totalLessons = await Lesson.countDocuments({
            courseId: e.courseId._id,
            isPublished: true,
          });

          return {
            enrollmentId: e._id.toString(),
            progress: e.progress,
            completedLessonsCount: e.completedLessons?.length || 0,
            totalLessons,
            isCompleted: e.progress === 100 || !!e.completedAt,
            enrolledAt: e.enrolledAt,
            completedAt: e.completedAt,
            lastAccessedLesson: e.lastAccessedLesson
              ? {
                  id: e.lastAccessedLesson._id.toString(),
                  title: e.lastAccessedLesson.title,
                  duration: e.lastAccessedLesson.duration,
                }
              : null,
            course: {
              id: e.courseId._id.toString(),
              title: e.courseId.title,
              slug: e.courseId.slug,
              shortDescription: e.courseId.shortDescription,
              thumbnail: e.courseId.thumbnail,
              category: e.courseId.category,
              level: e.courseId.level,
              duration: e.courseId.duration,
              instructor: e.courseId.instructor,
            },
          };
        })
    );

    ApiResponse.success(
      res,
      'Enrollments retrieved successfully',
      {
        enrollments: enrichedEnrollments,
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

// @desc    Get aggregated student dashboard data
// @route   GET /api/users/me/dashboard
// @access  Protected (Student)
export const getMyDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;

    const enrollments = await Enrollment.find({ userId: user._id })
      .populate('courseId')
      .populate('lastAccessedLesson')
      .sort({ updatedAt: -1 })
      .lean();

    const validEnrollments = enrollments.filter((e) => e.courseId);

    const enrolledCount = validEnrollments.length;
    const completedEnrollments = validEnrollments.filter((e) => e.progress === 100 || !!e.completedAt);
    const completedCount = completedEnrollments.length;
    const inProgressCount = enrolledCount - completedCount;
    const completedLessonsCount = validEnrollments.reduce((acc, e) => acc + (e.completedLessons?.length || 0), 0);

    const inProgressEnrollments = validEnrollments.filter((e) => e.progress < 100 && !e.completedAt);

    const continueLearning = await Promise.all(
      inProgressEnrollments.slice(0, 3).map(async (e: any) => {
        const totalLessons = await Lesson.countDocuments({
          courseId: e.courseId._id,
          isPublished: true,
        });

        return {
          enrollmentId: e._id.toString(),
          courseId: e.courseId._id.toString(),
          title: e.courseId.title,
          slug: e.courseId.slug,
          category: e.courseId.category,
          level: e.courseId.level,
          progress: e.progress,
          completedLessonsCount: e.completedLessons?.length || 0,
          totalLessons,
          lastAccessedLesson: e.lastAccessedLesson
            ? {
                id: e.lastAccessedLesson._id.toString(),
                title: e.lastAccessedLesson.title,
                duration: e.lastAccessedLesson.duration,
              }
            : null,
        };
      })
    );

    const recentLessons: any[] = [];
    for (const e of validEnrollments) {
      if (e.lastAccessedLesson) {
        const lesson = e.lastAccessedLesson as any;
        recentLessons.push({
          id: lesson._id ? lesson._id.toString() : lesson.toString(),
          title: lesson.title || 'Lesson',
          duration: lesson.duration || '',
          courseTitle: (e.courseId as any).title,
          courseSlug: (e.courseId as any).slug,
          accessedAt: e.updatedAt,
        });
      }
    }

    const completedCourses = completedEnrollments.map((e: any) => ({
      enrollmentId: e._id.toString(),
      courseId: e.courseId._id.toString(),
      title: e.courseId.title,
      slug: e.courseId.slug,
      category: e.courseId.category,
      completedAt: e.completedAt || e.updatedAt,
    }));

    const activity: any[] = [];
    for (const e of validEnrollments) {
      activity.push({
        type: 'ENROLLED',
        description: `Enrolled in ${(e.courseId as any).title}`,
        timestamp: e.enrolledAt,
      });

      if (e.completedAt) {
        activity.push({
          type: 'COMPLETED_COURSE',
          description: `Completed ${(e.courseId as any).title}`,
          timestamp: e.completedAt,
        });
      }
    }
    activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    ApiResponse.success(
      res,
      'Dashboard data aggregated successfully',
      {
        summary: {
          enrolledCourses: enrolledCount,
          inProgressCourses: inProgressCount,
          completedCourses: completedCount,
          completedLessons: completedLessonsCount,
        },
        continueLearning,
        recentLessons: recentLessons.slice(0, 5),
        completedCourses,
        activity: activity.slice(0, 8),
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get live wallet, coins balance, daily streak, and claimed rewards from MongoDB
// @route   GET /api/users/me/wallet
// @access  Protected
export const getMyWallet = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required.', 'AUTH_REQUIRED');
    }

    const user = await User.findById(req.user._id).lean();
    if (!user) {
      throw ApiError.notFound('User not found.', 'USER_NOT_FOUND');
    }

    const todayStr = new Date().toDateString();
    const todayDateIso = new Date().toISOString().slice(0, 10);
    const lastPotdStr = (user as any).lastPotdClaimDate ? new Date((user as any).lastPotdClaimDate).toDateString() : '';
    const claimedToday = Boolean(
      (lastPotdStr && lastPotdStr === todayStr) ||
      ((user as any).solvedPotdDates && (user as any).solvedPotdDates.includes(todayDateIso))
    );

    ApiResponse.success(
      res,
      'Wallet state retrieved successfully',
      {
        coins: typeof user.points === 'number' ? user.points : 0,
        dailyStreak: user.learningStreak || 0,
        claimedToday,
        lastClaimDate: (user as any).lastPotdClaimDate || user.lastActivityDate || null,
        unlockedCoupons: user.unlockedCoupons || [],
        unlockedCourses: user.unlockedCourses || [],
        swagOrders: user.swagOrders || [],
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Claim daily streak (awards exactly 1 coin per day in MongoDB, requires solving today's POTD challenge)
// @route   POST /api/users/me/streak/claim
// @access  Protected
export const claimDailyStreak = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required.', 'AUTH_REQUIRED');
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      throw ApiError.notFound('User not found.', 'USER_NOT_FOUND');
    }

    const { problemSlug, problemId } = req.body;
    const now = new Date();
    const todayStr = now.toDateString();
    const todayDateIso = now.toISOString().slice(0, 10);
    const lastPotdStr = (user as any).lastPotdClaimDate ? new Date((user as any).lastPotdClaimDate).toDateString() : '';

    // Check if already claimed for today
    if (lastPotdStr === todayStr || ((user as any).solvedPotdDates && (user as any).solvedPotdDates.includes(todayDateIso))) {
      ApiResponse.success(
        res,
        'Daily streak already maintained for today.',
        {
          success: true,
          coinsAwarded: 0,
          newStreak: user.learningStreak || 0,
          totalCoins: user.points || 0,
          alreadyClaimed: true,
        },
        200
      );
      return;
    }

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

    // Verify problem match if provided
    let hasValidSubmission = false;
    if (problemId && mongoose.Types.ObjectId.isValid(problemId)) {
      hasValidSubmission = Boolean(
        await Submission.exists({
          userId: user._id,
          problemId,
          status: 'Accepted',
          submittedAt: { $gte: startOfToday },
        })
      );
    } else if (problemSlug) {
      const matchedProblem = await CodingProblem.findOne({ slug: problemSlug });
      if (matchedProblem) {
        hasValidSubmission = Boolean(
          await Submission.exists({
            userId: user._id,
            problemId: matchedProblem._id,
            status: 'Accepted',
            submittedAt: { $gte: startOfToday },
          })
        );
      }
    }

    // Verify accepted submission strictly from database
    if (!hasValidSubmission) {
      // Check if user has ANY accepted submission today
      hasValidSubmission = Boolean(
        await Submission.exists({
          userId: user._id,
          status: 'Accepted',
          submittedAt: { $gte: startOfToday },
        })
      );
    }

    if (!hasValidSubmission) {
      ApiResponse.error(
        res,
        "Please solve today's POTD coding challenge first before claiming your daily streak reward.",
        'PROBLEM_NOT_SOLVED_TODAY',
        400
      );
      return;
    }

    // Calculate streak continuity
    let newStreak = (user.learningStreak || 0) + 1;
    if ((user as any).lastPotdClaimDate) {
      const lastDate = new Date((user as any).lastPotdClaimDate);
      const diffDays = Math.round((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 1) {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    const isBonus = newStreak % 7 === 0;
    const extraCoins = isBonus ? 7 : 0;
    const totalCoinsAwarded = 1 + extraCoins;

    user.points = (user.points || 0) + totalCoinsAwarded;
    user.totalPoints = (user.totalPoints || 0) + totalCoinsAwarded;
    user.learningStreak = newStreak;
    (user as any).lastPotdClaimDate = now;
    user.lastActivityDate = now;

    if (!(user as any).solvedPotdDates) {
      (user as any).solvedPotdDates = [];
    }
    if (!(user as any).solvedPotdDates.includes(todayDateIso)) {
      (user as any).solvedPotdDates.push(todayDateIso);
    }

    if (user.learningStreak > (user.longestStreak || 0)) {
      user.longestStreak = user.learningStreak;
    }

    await user.save();

    try {
      await PointTransaction.create({
        userId: user._id,
        amount: totalCoinsAwarded,
        type: 'STREAK_BONUS',
        referenceType: 'POTD',
        referenceId: todayDateIso,
        description: isBonus
          ? `Day ${newStreak} POTD Streak Reward (+1 Coin) & 7-Day Streak Bonus (+${extraCoins} Coins)`
          : `Day ${newStreak} Daily POTD Streak Reward (+1 Coin)`,
      });
    } catch (txErr: any) {
      logger.warn(`[PointTransaction] Failed to log daily streak reward: ${txErr.message}`);
    }

    ApiResponse.success(
      res,
      isBonus
        ? `🎉 Congratulations on maintaining your 7-Day Daily Streak! Credited 1 Coin + ${extraCoins} Extra Bonus Coins.`
        : 'Daily streak claimed successfully!',
      {
        success: true,
        coinsAwarded: totalCoinsAwarded,
        dailyCoins: 1,
        extraCoins,
        isBonus,
        newStreak: user.learningStreak,
        totalCoins: user.points,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Redeem a store reward item (coupon, full course, or physical swag merchandise)
// @route   POST /api/users/me/rewards/claim
// @access  Protected
export const redeemStoreReward = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required.', 'AUTH_REQUIRED');
    }

    const { rewardId, title, category, coinsCost, couponCode, discountPercent, courseSlug, shippingAddress } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      throw ApiError.notFound('User not found.', 'USER_NOT_FOUND');
    }

    const cost = Number(coinsCost) || 0;
    if ((user.points || 0) < cost) {
      throw ApiError.badRequest(
        `Insufficient NEC Coins balance. Required: ${cost}, Available: ${user.points || 0}`,
        'INSUFFICIENT_COINS'
      );
    }

    // Verify item is in stock
    if (rewardId) {
      let rewardDoc = await Reward.findOne({ id: rewardId });
      if (!rewardDoc) {
        try {
          rewardDoc = await Reward.findById(rewardId);
        } catch {}
      }
      if (rewardDoc && rewardDoc.inStock === false) {
        throw ApiError.badRequest(
          `"${rewardDoc.title || 'This item'}" is currently out of stock and cannot be redeemed.`,
          'OUT_OF_STOCK'
        );
      }
    }

    // Deduct coins
    user.points = Math.max(0, (user.points || 0) - cost);

    let generatedCouponCode = couponCode;
    let generatedOrder: any = null;

    if (category === 'coupon') {
      const uniqueCode = `${couponCode || 'NEC'}-${Math.floor(1000 + Math.random() * 9000)}`;
      generatedCouponCode = uniqueCode;
      if (!user.unlockedCoupons) user.unlockedCoupons = [];
      user.unlockedCoupons.push({
        code: uniqueCode,
        discount: Number(discountPercent) || 10,
        title: title || 'Discount Coupon',
        unlockedAt: new Date(),
      });
    } else if (category === 'course') {
      if (!user.unlockedCourses) user.unlockedCourses = [];
      if (courseSlug && !user.unlockedCourses.includes(courseSlug)) {
        user.unlockedCourses.push(courseSlug);
      }
    } else if (category === 'swag') {
      const orderId = `SWAG-${Math.floor(100000 + Math.random() * 900000)}`;
      const trackingId = `NEC-EXP-${Math.floor(100000 + Math.random() * 900000)}`;
      generatedOrder = {
        id: orderId,
        rewardId: rewardId || 'swag-item',
        rewardTitle: title || 'NEC Swag Item',
        coinsCost: cost,
        fullName: shippingAddress?.fullName || user.name,
        phone: shippingAddress?.phone || '',
        address: shippingAddress?.address || '',
        city: shippingAddress?.city || '',
        pincode: shippingAddress?.pincode || '',
        status: 'Processing',
        orderedAt: new Date(),
        trackingNumber: trackingId,
      };

      if (!user.swagOrders) user.swagOrders = [];
      user.swagOrders.push(generatedOrder);
    }

    await user.save();

    if (cost > 0) {
      try {
        await PointTransaction.create({
          userId: user._id,
          amount: -cost,
          type: 'SWAG_REDEEM',
          referenceType: String(category || 'STORE').toUpperCase(),
          referenceId: rewardId ? String(rewardId) : undefined,
          description: `Redeemed ${category || 'Store Item'}: ${title || 'Item'} (-${cost} Coins)`,
        });
      } catch (txErr: any) {
        logger.warn(`[PointTransaction] Failed to log store redemption: ${txErr.message}`);
      }
    }

    ApiResponse.success(
      res,
      'Reward claimed successfully!',
      {
        success: true,
        coins: user.points,
        couponCode: generatedCouponCode,
        order: generatedOrder,
        unlockedCoupons: user.unlockedCoupons,
        unlockedCourses: user.unlockedCourses,
        swagOrders: user.swagOrders,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Award coins for weekly contest completion after passing all test cases and submitting
// @route   POST /api/users/me/contest/award
// @access  Protected
export const awardContestReward = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required.', 'AUTH_REQUIRED');
    }

    const { contestNumber, coinsAmount, allPassed } = req.body;

    if (!allPassed) {
      throw ApiError.badRequest('Cannot award coins without passing 100% of all test cases and submitting.', 'TEST_CASES_FAILED');
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      throw ApiError.notFound('User not found.', 'USER_NOT_FOUND');
    }

    const contestIdStr = String(contestNumber || 'weekly-current');

    // Prevent duplicate claims for the same contest
    const existingTx = await PointTransaction.findOne({
      userId: user._id,
      type: 'CONTEST_REWARD',
      referenceId: contestIdStr,
    });
    if (existingTx) {
      throw ApiError.badRequest(`Contest reward for Contest #${contestIdStr} has already been claimed.`, 'ALREADY_CLAIMED');
    }

    // Securely cap contest reward amount (default 50, max 100)
    const coinsToAdd = Math.min(100, Math.max(10, Number(coinsAmount) || 50));

    // Credit coins into user points and totalPoints
    user.points = (user.points || 0) + coinsToAdd;
    user.totalPoints = (user.totalPoints || 0) + coinsToAdd;
    user.lastActivityDate = new Date();

    await user.save();

    try {
      await PointTransaction.create({
        userId: user._id,
        amount: coinsToAdd,
        type: 'CONTEST_REWARD',
        referenceType: 'CONTEST',
        referenceId: contestIdStr,
        description: `Weekly Contest #${contestIdStr} Completion Reward (+${coinsToAdd} Coins)`,
      });
    } catch (txErr: any) {
      logger.warn(`[PointTransaction] Failed to log contest reward: ${txErr.message}`);
    }

    ApiResponse.success(
      res,
      `🎉 Successfully credited +${coinsToAdd} NEC Coins for Weekly Contest #${contestNumber || 42}!`,
      {
        success: true,
        coinsAwarded: coinsToAdd,
        totalCoins: user.points,
        points: user.points,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get student's comprehensive coding score profile, heatmap & breakdown
// @route   GET /api/users/me/coding-profile
// @access  Protected (Student)
export const getMyCodingProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const userIdObj = user._id instanceof mongoose.Types.ObjectId ? user._id : new mongoose.Types.ObjectId(user._id);

    // Fetch accepted submissions, activity heatmap aggregation, and total submissions count concurrently
    const [acceptedSubmissions, heatmapAgg, totalSubmissionsCount] = await Promise.all([
      Submission.find({ userId: userIdObj, status: 'Accepted' })
        .populate('problemId', 'title slug difficulty category')
        .sort({ submittedAt: -1 })
        .limit(200)
        .lean(),
      Submission.aggregate([
        { $match: { userId: userIdObj } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$submittedAt' } },
            count: { $sum: 1 },
          },
        },
      ]),
      Submission.countDocuments({ userId: userIdObj }),
    ]);

    // Build distinct solved problem list
    const seenProblems = new Set<string>();
    const distinctSolvedProblems: any[] = [];
    const difficultyBreakdown = {
      school: 0,
      basic: 0,
      easy: 0,
      medium: 0,
      hard: 0,
    };

    acceptedSubmissions.forEach((s: any) => {
      if (s.problemId) {
        const probKey = s.problemId._id ? s.problemId._id.toString() : s.problemId.slug;
        if (!seenProblems.has(probKey)) {
          seenProblems.add(probKey);
          const diff = (s.problemId.difficulty || 'Easy').toLowerCase();
          if (diff in difficultyBreakdown) {
            (difficultyBreakdown as any)[diff] += 1;
          }
          distinctSolvedProblems.push({
            id: s._id.toString(),
            title: s.problemId.title,
            slug: s.problemId.slug,
            difficulty: s.problemId.difficulty,
            status: s.status,
            category: s.problemId.category || 'DSA',
            timeAgo: new Date(s.submittedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
          });
        }
      }
    });

    const realAcceptedCount = distinctSolvedProblems.length;
    const baseTotalSolved = realAcceptedCount;
    const codingScore = user.points || 0;

    // Map aggregated heatmap dates directly
    const submissionDateMap: Record<string, number> = {};
    heatmapAgg.forEach((item: any) => {
      if (item._id) {
        submissionDateMap[item._id] = item.count;
      }
    });

    // Populate streak history for past active streak days if streak is active
    const streakDays = user.learningStreak || 0;
    if (streakDays > 0) {
      const baseDate = user.lastActivityDate ? new Date(user.lastActivityDate) : new Date();
      for (let i = 0; i < streakDays; i++) {
        const d = new Date(baseDate);
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        if (!submissionDateMap[dStr]) {
          submissionDateMap[dStr] = 1;
        }
      }
    }

    const enrichedSolvedProblems = distinctSolvedProblems;

    // Real Articles Published by User
    const articlesPublished = await Tutorial.countDocuments({ author: user._id, isPublished: true });

    // Real Institute Rank
    let instituteRank = 1;
    if (user.college && user.college.trim() !== '') {
      const higherRanked = await User.countDocuments({
        college: user.college.trim(),
        points: { $gt: user.points || 0 },
      });
      instituteRank = higherRanked + 1;
    } else {
      const higherRankedGlobal = await User.countDocuments({
        points: { $gt: user.points || 0 },
      });
      instituteRank = higherRankedGlobal + 1;
    }

    ApiResponse.success(
      res,
      'Coding profile data retrieved successfully.',
      {
        codingScore,
        totalProblemsSolved: baseTotalSolved,
        difficultyBreakdown,
        necDailyStreak: user.learningStreak || 0,
        longestNecStreak: user.longestStreak || 0,
        necProblemsSolved: realAcceptedCount,
        instituteRank,
        articlesPublished,
        submissionDateMap,
        totalSubmissionsInYear: totalSubmissionsCount,
        recentSolvedProblems: enrichedSolvedProblems,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get comprehensive public coding profile of any user
// @route   GET /api/users/:id/public-profile
// Rich mock coder profiles for weekly contest leaderboard and problem comments
const MOCK_PROFILES: Record<string, any> = {
  'usr-1': {
    id: 'usr-1',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@iitb.ac.in',
    profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    college: 'IIT Bombay • Computer Science',
    bio: 'Competitive programmer & Full-Stack Engineer. Passionate about graph algorithms and dynamic programming.',
    skills: ['C++', 'TypeScript', 'Graph Theory', 'DP', 'System Design'],
    github: 'https://github.com/aarav-algo',
    linkedin: 'https://linkedin.com/in/aarav-algo',
    role: 'STUDENT',
    isPro: true,
    followersCount: 148,
    followingCount: 32,
    isFollowing: false,
    isSelf: false,
    codingScore: 2480,
    totalProblemsSolved: 515,
    difficultyBreakdown: { school: 0, basic: 45, easy: 180, medium: 240, hard: 95 },
    necDailyStreak: 42,
    longestNecStreak: 56,
    necProblemsSolved: 515,
    instituteRank: 1,
    articlesPublished: 8,
    totalSubmissionsInYear: 140,
    submissionDateMap: {
      '2026-08-31': 3,
      '2026-08-30': 2,
      '2026-08-29': 4,
      '2026-08-28': 1,
      '2026-08-27': 5,
    },
    recentSolvedProblems: [
      { id: 'mock-p1', title: 'Shortest Path with Obstacle Elimination in Grid', slug: 'sunday-shortest-path-obstacle-elimination', difficulty: 'Hard', status: 'Accepted', timeAgo: 'Today' },
      { id: 'mock-p2', title: 'Two Sum II - Input Array Is Sorted', slug: 'two-sum-ii', difficulty: 'Medium', status: 'Accepted', timeAgo: 'Yesterday' },
      { id: 'mock-p3', title: 'Trapping Rain Water', slug: 'trapping-rain-water', difficulty: 'Hard', status: 'Accepted', timeAgo: '2 days ago' },
      { id: 'mock-p4', title: 'Binary Tree Maximum Path Sum', slug: 'binary-tree-max-path-sum', difficulty: 'Hard', status: 'Accepted', timeAgo: '3 days ago' },
      { id: 'mock-p5', title: 'Course Schedule II', slug: 'course-schedule-ii', difficulty: 'Medium', status: 'Accepted', timeAgo: '4 days ago' },
    ],
  },
  'usr-2': {
    id: 'usr-2',
    name: 'Priya Patel',
    email: 'priya.patel@bits-pilani.ac.in',
    profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    college: 'BITS Pilani • Data Science',
    bio: 'Software Engineer @ FinTech. CodeForces Candidate Master. Love solving hard combinatorial problems.',
    skills: ['Python', 'Java', 'Algorithms', 'Distributed Systems'],
    github: 'https://github.com/priya-codes',
    linkedin: 'https://linkedin.com/in/priya-patel',
    role: 'STUDENT',
    isPro: true,
    followersCount: 112,
    followingCount: 24,
    isFollowing: false,
    isSelf: false,
    codingScore: 2310,
    totalProblemsSolved: 452,
    difficultyBreakdown: { school: 0, basic: 32, easy: 160, medium: 210, hard: 82 },
    necDailyStreak: 28,
    longestNecStreak: 41,
    necProblemsSolved: 452,
    instituteRank: 2,
    articlesPublished: 12,
    totalSubmissionsInYear: 118,
    submissionDateMap: {
      '2026-08-31': 2,
      '2026-08-30': 4,
      '2026-08-28': 3,
    },
    recentSolvedProblems: [
      { id: 'mock-p6', title: 'Median of Two Sorted Arrays', slug: 'median-two-sorted-arrays', difficulty: 'Hard', status: 'Accepted', timeAgo: 'Today' },
      { id: 'mock-p7', title: 'Longest Palindromic Substring', slug: 'longest-palindromic-substring', difficulty: 'Medium', status: 'Accepted', timeAgo: 'Yesterday' },
      { id: 'mock-p8', title: 'LRU Cache', slug: 'lru-cache', difficulty: 'Medium', status: 'Accepted', timeAgo: '3 days ago' },
    ],
  },
  'usr-3': {
    id: 'usr-3',
    name: 'Rohan Verma',
    email: 'rohan.verma@nitt.edu',
    profileImage: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80',
    college: 'NIT Trichy • CSE',
    bio: 'Backend & Cloud architect. Active competitive coder on NEC and LeetCode Guardian.',
    skills: ['Go', 'C++', 'Microservices', 'Redis'],
    github: 'https://github.com/rohan-verma',
    linkedin: 'https://linkedin.com/in/rohan-verma',
    role: 'STUDENT',
    isPro: false,
    followersCount: 89,
    followingCount: 19,
    isFollowing: false,
    isSelf: false,
    codingScore: 2185,
    totalProblemsSolved: 400,
    difficultyBreakdown: { school: 0, basic: 28, easy: 145, medium: 190, hard: 65 },
    necDailyStreak: 19,
    longestNecStreak: 35,
    necProblemsSolved: 400,
    instituteRank: 3,
    articlesPublished: 5,
    totalSubmissionsInYear: 95,
    submissionDateMap: {
      '2026-08-30': 3,
      '2026-08-29': 1,
    },
    recentSolvedProblems: [
      { id: 'mock-p9', title: 'Word Ladder II', slug: 'word-ladder-ii', difficulty: 'Hard', status: 'Accepted', timeAgo: 'Yesterday' },
      { id: 'mock-p10', title: 'Merge k Sorted Lists', slug: 'merge-k-sorted-lists', difficulty: 'Hard', status: 'Accepted', timeAgo: '2 days ago' },
    ],
  },
  'usr-4': {
    id: 'usr-4',
    name: 'Neha Gupta',
    email: 'neha.gupta@dtu.ac.in',
    profileImage: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
    college: 'Delhi Technological University',
    bio: 'Frontend wizard & algorithms explorer. Building next-gen web interfaces with React & WebAssembly.',
    skills: ['JavaScript', 'React', 'DSA', 'Tailwind'],
    github: 'https://github.com/neha-gupta',
    linkedin: 'https://linkedin.com/in/neha-gupta',
    role: 'STUDENT',
    isPro: false,
    followersCount: 67,
    followingCount: 15,
    isFollowing: false,
    isSelf: false,
    codingScore: 1940,
    totalProblemsSolved: 295,
    difficultyBreakdown: { school: 0, basic: 20, easy: 120, medium: 140, hard: 35 },
    necDailyStreak: 14,
    longestNecStreak: 25,
    necProblemsSolved: 295,
    instituteRank: 4,
    articlesPublished: 3,
    totalSubmissionsInYear: 82,
    submissionDateMap: {
      '2026-08-31': 1,
    },
    recentSolvedProblems: [
      { id: 'mock-p11', title: 'Valid Parentheses', slug: 'valid-parentheses', difficulty: 'Easy', status: 'Accepted', timeAgo: 'Today' },
      { id: 'mock-p12', title: 'Subsets II', slug: 'subsets-ii', difficulty: 'Medium', status: 'Accepted', timeAgo: '3 days ago' },
    ],
  },
  'usr-5': {
    id: 'usr-5',
    name: 'Vikram Mehta',
    email: 'vikram.mehta@iiit.ac.in',
    profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    college: 'IIIT Hyderabad • AI',
    bio: 'AI/ML Researcher & Systems Programmer. Passionate about parallel computing and CUDA optimizations.',
    skills: ['Python', 'PyTorch', 'C++', 'GPU Computing'],
    github: 'https://github.com/vikram-mehta',
    linkedin: 'https://linkedin.com/in/vikram-mehta',
    role: 'STUDENT',
    isPro: true,
    followersCount: 54,
    followingCount: 12,
    isFollowing: false,
    isSelf: false,
    codingScore: 1890,
    totalProblemsSolved: 280,
    difficultyBreakdown: { school: 0, basic: 18, easy: 110, medium: 130, hard: 40 },
    necDailyStreak: 9,
    longestNecStreak: 22,
    necProblemsSolved: 280,
    instituteRank: 5,
    articlesPublished: 6,
    totalSubmissionsInYear: 70,
    submissionDateMap: {
      '2026-08-30': 2,
    },
    recentSolvedProblems: [
      { id: 'mock-p13', title: 'Maximum Subarray', slug: 'maximum-subarray', difficulty: 'Medium', status: 'Accepted', timeAgo: 'Yesterday' },
      { id: 'mock-p14', title: 'Climbing Stairs', slug: 'climbing-stairs', difficulty: 'Easy', status: 'Accepted', timeAgo: '2 days ago' },
    ],
  },
};

// Aliases by username
MOCK_PROFILES['aarav_algo'] = MOCK_PROFILES['usr-1'];
MOCK_PROFILES['priya_codes'] = MOCK_PROFILES['usr-2'];
MOCK_PROFILES['rohan_dev'] = MOCK_PROFILES['usr-3'];
MOCK_PROFILES['neha_algo'] = MOCK_PROFILES['usr-4'];
MOCK_PROFILES['vikram_m'] = MOCK_PROFILES['usr-5'];

// In-memory follow state tracking for mock users
const mockFollowState = new Map<string, boolean>();

// @desc    Get comprehensive public coding profile of any user
// @route   GET /api/users/:id/public-profile
// @access  Public / Optional Auth
export const getUserPublicProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const targetId = req.params.id;
    let targetUser: any;

    if (!targetId || targetId === 'me') {
      if (!req.user) {
        throw ApiError.unauthorized('Authentication required to view profile.', 'AUTH_REQUIRED');
      }
      targetUser = req.user;
    } else if (MOCK_PROFILES[targetId]) {
      const mock = MOCK_PROFILES[targetId];
      const currentUserId = req.user?._id?.toString() || 'guest';
      const isFollowing = mockFollowState.get(`${currentUserId}:${mock.id}`) ?? false;

      ApiResponse.success(
        res,
        'Public profile retrieved successfully.',
        {
          user: {
            id: mock.id,
            name: mock.name,
            email: mock.email,
            profileImage: mock.profileImage,
            college: mock.college,
            bio: mock.bio,
            skills: mock.skills,
            github: mock.github,
            linkedin: mock.linkedin,
            role: mock.role,
            isPro: mock.isPro,
            followersCount: isFollowing ? mock.followersCount + 1 : mock.followersCount,
            followingCount: mock.followingCount,
            isFollowing,
            isSelf: false,
          },
          codingStats: {
            codingScore: mock.codingScore,
            totalProblemsSolved: mock.totalProblemsSolved,
            difficultyBreakdown: mock.difficultyBreakdown,
            necDailyStreak: mock.necDailyStreak,
            longestNecStreak: mock.longestNecStreak,
            necProblemsSolved: mock.necProblemsSolved,
            instituteRank: mock.instituteRank,
            articlesPublished: mock.articlesPublished,
            submissionDateMap: mock.submissionDateMap,
            totalSubmissionsInYear: mock.totalSubmissionsInYear,
            recentSolvedProblems: mock.recentSolvedProblems,
          },
        },
        200
      );
      return;
    } else {
      if (!mongoose.Types.ObjectId.isValid(targetId)) {
        throw ApiError.notFound('Student profile not found.', 'USER_NOT_FOUND');
      }
      targetUser = await User.findById(targetId);
      if (!targetUser) {
        throw ApiError.notFound('Student profile not found.', 'USER_NOT_FOUND');
      }
    }

    const currentUserId = req.user?._id?.toString();
    const isSelf = currentUserId === targetUser._id.toString();
    const isFollowing = currentUserId
      ? (targetUser.followers || []).some((f: any) => f.toString() === currentUserId)
      : false;

    // Fetch actual accepted submissions and recent submissions for this user
    const [acceptedSubmissions, distinctSubmissionsCount, articlesCount] = await Promise.all([
      Submission.find({ userId: targetUser._id, status: 'Accepted' })
        .populate('problemId', 'title slug difficulty category')
        .sort({ submittedAt: -1 })
        .limit(200)
        .lean(),
      Submission.countDocuments({ userId: targetUser._id }),
      Tutorial.countDocuments({ author: targetUser._id, isPublished: true }),
    ]);

    const seenProblems = new Set<string>();
    const distinctSolvedProblems: any[] = [];
    const difficultyBreakdown = {
      school: 0,
      basic: 0,
      easy: 0,
      medium: 0,
      hard: 0,
    };

    acceptedSubmissions.forEach((s: any) => {
      if (s.problemId) {
        const probKey = s.problemId._id ? s.problemId._id.toString() : s.problemId.slug;
        if (!seenProblems.has(probKey)) {
          seenProblems.add(probKey);
          const diff = (s.problemId.difficulty || 'Easy').toLowerCase();
          if (diff in difficultyBreakdown) {
            (difficultyBreakdown as any)[diff] += 1;
          }
          distinctSolvedProblems.push({
            id: s._id.toString(),
            title: s.problemId.title,
            slug: s.problemId.slug,
            difficulty: s.problemId.difficulty,
            status: s.status,
            category: s.problemId.category || 'DSA',
            timeAgo: new Date(s.submittedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
          });
        }
      }
    });

    const realAcceptedCount = distinctSolvedProblems.length;
    const baseTotalSolved = realAcceptedCount;
    const codingScore = targetUser.points || 0;

    // Calculate real institute rank
    let instituteRank = 1;
    if (targetUser.college && targetUser.college.trim() !== '') {
      const higherRankedInCollege = await User.countDocuments({
        college: targetUser.college.trim(),
        points: { $gt: targetUser.points || 0 },
      });
      instituteRank = higherRankedInCollege + 1;
    } else {
      const higherRankedGlobal = await User.countDocuments({
        points: { $gt: targetUser.points || 0 },
      });
      instituteRank = higherRankedGlobal + 1;
    }

    const targetUserIdObj =
      targetUser._id instanceof mongoose.Types.ObjectId
        ? targetUser._id
        : new mongoose.Types.ObjectId(targetUser._id);

    const heatmapAgg = await Submission.aggregate([
      { $match: { userId: targetUserIdObj } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$submittedAt' } },
          count: { $sum: 1 },
        },
      },
    ]);

    const submissionDateMap: Record<string, number> = {};
    heatmapAgg.forEach((item: any) => {
      if (item._id) {
        submissionDateMap[item._id] = item.count;
      }
    });

    const enrichedSolvedProblems = distinctSolvedProblems;

    ApiResponse.success(
      res,
      'Public profile retrieved successfully.',
      {
        user: {
          id: targetUser._id.toString(),
          name: targetUser.name,
          email: targetUser.email,
          profileImage:
            targetUser.profileImage && targetUser.profileImage.trim() !== ''
              ? targetUser.profileImage
              : `https://unavatar.io/${encodeURIComponent(targetUser.email)}?fallback=https%3A%2F%2Fapi.dicebear.com%2F7.x%2Fadventurer%2Fsvg%3Fseed%3D${encodeURIComponent(targetUser.name || targetUser.email)}`,
          college: targetUser.college || 'Ramgarh Engineering College',
          bio: targetUser.bio || 'Aspiring Software Engineer & Problem Solver on NextEra Coders.',
          skills: targetUser.skills || [],
          github: targetUser.github || '',
          linkedin: targetUser.linkedin || '',
          role: targetUser.role,
          isPro: targetUser.isPro,
          followersCount: targetUser.followers?.length || 0,
          followingCount: targetUser.following?.length || 0,
          isFollowing,
          isSelf,
        },
        codingStats: {
          codingScore,
          totalProblemsSolved: baseTotalSolved,
          difficultyBreakdown,
          necDailyStreak: targetUser.learningStreak || 0,
          longestNecStreak: targetUser.longestStreak || 0,
          necProblemsSolved: realAcceptedCount,
          instituteRank,
          articlesPublished: articlesCount,
          submissionDateMap,
          totalSubmissionsInYear: distinctSubmissionsCount,
          recentSolvedProblems: enrichedSolvedProblems,
        },
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Follow or unfollow another student
// @route   POST /api/users/:id/follow
// @access  Protected
export const toggleFollowUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const targetUserId = req.params.id;

    if (user._id.toString() === targetUserId) {
      throw ApiError.badRequest('You cannot follow yourself.', 'CANNOT_FOLLOW_SELF');
    }

    // Support mock student profiles (usr-1, usr-2, etc.)
    if (MOCK_PROFILES[targetUserId]) {
      const mock = MOCK_PROFILES[targetUserId];
      const currentUserId = user._id.toString();
      const followKey = `${currentUserId}:${mock.id}`;
      const isCurrentlyFollowing = mockFollowState.get(followKey) ?? false;
      const nextFollowState = !isCurrentlyFollowing;
      mockFollowState.set(followKey, nextFollowState);

      const updatedCount = nextFollowState ? mock.followersCount + 1 : mock.followersCount;

      ApiResponse.success(
        res,
        nextFollowState ? `You are now following ${mock.name}!` : `You have unfollowed ${mock.name}.`,
        { isFollowing: nextFollowState, followersCount: updatedCount },
        200
      );
      return;
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      throw ApiError.notFound('Target student not found.', 'USER_NOT_FOUND');
    }

    const isAlreadyFollowing = (user.following || []).some((id: any) => id.toString() === targetUserId);

    if (isAlreadyFollowing) {
      // Unfollow
      await Promise.all([
        User.findByIdAndUpdate(user._id, { $pull: { following: targetUser._id } }),
        User.findByIdAndUpdate(targetUser._id, { $pull: { followers: user._id } }),
      ]);

      ApiResponse.success(
        res,
        `You have unfollowed ${targetUser.name}.`,
        { isFollowing: false, followersCount: Math.max(0, (targetUser.followers?.length || 1) - 1) },
        200
      );
    } else {
      // Follow
      await Promise.all([
        User.findByIdAndUpdate(user._id, { $addToSet: { following: targetUser._id } }),
        User.findByIdAndUpdate(targetUser._id, { $addToSet: { followers: user._id } }),
      ]);

      ApiResponse.success(
        res,
        `You are now following ${targetUser.name}!`,
        { isFollowing: true, followersCount: (targetUser.followers?.length || 0) + 1 },
        200
      );
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's followers list
// @route   GET /api/users/:id/followers
// @access  Public / Optional Auth
export const getUserFollowers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const targetId = req.params.id === 'me' ? req.user?._id?.toString() : req.params.id;

    // Support mock student profiles
    if (targetId && MOCK_PROFILES[targetId]) {
      const mockList = Object.keys(MOCK_PROFILES)
        .filter((k) => k !== targetId && k.startsWith('usr-'))
        .map((k) => {
          const m = MOCK_PROFILES[k];
          return {
            id: m.id,
            name: m.name,
            email: m.email,
            profileImage: m.profileImage,
            college: m.college,
            points: m.codingScore,
            role: m.role,
            isPro: m.isPro,
          };
        });

      ApiResponse.success(res, 'Followers retrieved successfully', { followers: mockList }, 200);
      return;
    }

    const user = await User.findById(targetId).populate('followers', 'name email profileImage college points role isPro');
    if (!user) {
      throw ApiError.notFound('User not found.', 'USER_NOT_FOUND');
    }

    const followers = (user.followers || []).map((f: any) => ({
      id: f._id.toString(),
      name: f.name,
      email: f.email,
      profileImage: f.profileImage || `https://unavatar.io/${encodeURIComponent(f.email)}?fallback=https%3A%2F%2Fapi.dicebear.com%2F7.x%2Fadventurer%2Fsvg%3Fseed%3D${encodeURIComponent(f.name || f.email)}`,
      college: f.college || 'Engineering Institute',
      points: f.points || 0,
      role: f.role,
      isPro: f.isPro,
    }));

    ApiResponse.success(res, 'Followers retrieved successfully', { followers }, 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's following list
// @route   GET /api/users/:id/following
// @access  Public / Optional Auth
export const getUserFollowing = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const targetId = req.params.id === 'me' ? req.user?._id?.toString() : req.params.id;

    // Support mock student profiles
    if (targetId && MOCK_PROFILES[targetId]) {
      const mockList = Object.keys(MOCK_PROFILES)
        .filter((k) => k !== targetId && k.startsWith('usr-'))
        .map((k) => {
          const m = MOCK_PROFILES[k];
          return {
            id: m.id,
            name: m.name,
            email: m.email,
            profileImage: m.profileImage,
            college: m.college,
            points: m.codingScore,
            role: m.role,
            isPro: m.isPro,
          };
        });

      ApiResponse.success(res, 'Following list retrieved successfully', { following: mockList }, 200);
      return;
    }

    const user = await User.findById(targetId).populate('following', 'name email profileImage college points role isPro');
    if (!user) {
      throw ApiError.notFound('User not found.', 'USER_NOT_FOUND');
    }

    const following = (user.following || []).map((f: any) => ({
      id: f._id.toString(),
      name: f.name,
      email: f.email,
      profileImage: f.profileImage || `https://unavatar.io/${encodeURIComponent(f.email)}?fallback=https%3A%2F%2Fapi.dicebear.com%2F7.x%2Fadventurer%2Fsvg%3Fseed%3D${encodeURIComponent(f.name || f.email)}`,
      college: f.college || 'Engineering Institute',
      points: f.points || 0,
      role: f.role,
      isPro: f.isPro,
    }));

    ApiResponse.success(res, 'Following list retrieved successfully', { following }, 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Get institute leaderboard
// @route   GET /api/users/me/institute-leaderboard
// @access  Protected
export const getInstituteLeaderboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const collegeFilter = user.college && user.college.trim() !== '' ? { college: user.college.trim() } : {};

    const topStudents = await User.find(collegeFilter)
      .select('name email profileImage college points learningStreak longestStreak role isPro')
      .sort({ points: -1, learningStreak: -1 })
      .limit(20)
      .lean();

    const leaderboard = topStudents.map((s, index) => ({
      rank: index + 1,
      id: s._id.toString(),
      name: s.name,
      email: s.email,
      profileImage: s.profileImage || `https://unavatar.io/${encodeURIComponent(s.email)}?fallback=https%3A%2F%2Fapi.dicebear.com%2F7.x%2Fadventurer%2Fsvg%3Fseed%3D${encodeURIComponent(s.name || s.email)}`,
      college: s.college || 'Ramgarh Engineering College',
      points: s.points || 0,
      learningStreak: s.learningStreak || 0,
      isCurrentUser: s._id.toString() === user._id.toString(),
    }));

    ApiResponse.success(
      res,
      'Institute leaderboard retrieved successfully',
      {
        collegeName: user.college || 'Global Institute',
        leaderboard,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

