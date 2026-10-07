import { Types } from 'mongoose';
import { User, IUserDocument } from '../models/user.model';
import { Achievement } from '../models/achievement.model';
import { UserAchievement } from '../models/userAchievement.model';
import { PointTransaction, PointTransactionType } from '../models/pointTransaction.model';
import { Enrollment } from '../models/enrollment.model';
import { QuizAttempt } from '../models/quizAttempt.model';
import { Submission } from '../models/submission.model';
import { notificationService } from './notification.service';

export interface AwardPointsParams {
  userId: string | Types.ObjectId;
  amount: number;
  type: PointTransactionType;
  referenceType?: string;
  referenceId?: string;
  description: string;
}

export class GamificationService {
  /**
   * Award points to a user (Idempotent if referenceType & referenceId provided)
   */
  async awardPoints(params: AwardPointsParams): Promise<{ awarded: boolean; amount: number; totalPoints: number }> {
    const { userId, amount, type, referenceType, referenceId, description } = params;

    if (amount <= 0) {
      const user = await User.findById(userId);
      return { awarded: false, amount: 0, totalPoints: user?.points || 0 };
    }

    if (referenceType && referenceId) {
      const existing = await PointTransaction.findOne({
        userId,
        referenceType,
        referenceId,
      });

      if (existing) {
        const user = await User.findById(userId);
        return { awarded: false, amount: 0, totalPoints: user?.points || 0 };
      }
    }

    await PointTransaction.create({
      userId,
      amount,
      type,
      referenceType,
      referenceId,
      description,
      createdAt: new Date(),
    });

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $inc: { points: amount, totalPoints: amount },
      },
      { new: true }
    );

    return {
      awarded: true,
      amount,
      totalPoints: updatedUser?.points || 0,
    };
  }

  /**
   * Award XP / TotalPoints only (Level / Rank progression - 0 spendable NEC Coins)
   */
  async awardXpOnly(params: {
    userId: string | Types.ObjectId;
    amount: number;
    reason?: string;
  }): Promise<{ awarded: boolean; amount: number; totalXp: number }> {
    const { userId, amount } = params;

    if (amount <= 0) {
      const user = await User.findById(userId);
      return { awarded: false, amount: 0, totalXp: user?.totalPoints || 0 };
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $inc: { totalPoints: amount },
      },
      { new: true }
    );

    return {
      awarded: true,
      amount,
      totalXp: updatedUser?.totalPoints || 0,
    };
  }

  /**
   * Update student daily learning streak
   */
  async updateStreak(userId: string | Types.ObjectId): Promise<{ streak: number; longestStreak: number }> {
    const user = await User.findById(userId);
    if (!user) return { streak: 0, longestStreak: 0 };

    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    let newStreak = user.learningStreak || 0;
    let longestStreak = user.longestStreak || 0;

    if (user.lastActivityDate) {
      const last = new Date(user.lastActivityDate);
      const lastDate = new Date(Date.UTC(last.getUTCFullYear(), last.getUTCMonth(), last.getUTCDate()));

      const diffTime = today.getTime() - lastDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        // Already logged activity today, do not increment
        return { streak: user.learningStreak, longestStreak: user.longestStreak };
      } else if (diffDays === 1) {
        // Consecutive calendar day
        newStreak += 1;
      } else {
        // Missed one or more days, reset streak to 1
        newStreak = 1;
      }
    } else {
      // First ever activity
      newStreak = 1;
    }

    longestStreak = Math.max(longestStreak, newStreak);

    user.learningStreak = newStreak;
    user.longestStreak = longestStreak;
    user.lastActivityDate = now;
    await user.save();

    // Check streak achievements
    await this.checkStreakAchievements(user);

    return { streak: newStreak, longestStreak };
  }

  /**
   * Check and unlock achievements
   */
  async checkAndUnlockAchievements(
    userId: string | Types.ObjectId,
    triggerContext?: {
      problemId?: string;
      courseId?: string;
      quizId?: string;
      percentage?: number;
    }
  ): Promise<any[]> {
    const user = await User.findById(userId);
    if (!user) return [];

    // Get all unlocked achievement IDs for this user
    const unlockedRecords = await UserAchievement.find({ userId }).select('achievementId').lean();
    const unlockedIds = new Set(unlockedRecords.map((r) => r.achievementId.toString()));

    // Get all active achievements not yet unlocked
    const lockedAchievements = await Achievement.find({
      isActive: true,
      _id: { $nin: Array.from(unlockedIds).map((id) => new Types.ObjectId(id)) },
    }).lean();

    if (lockedAchievements.length === 0) return [];

    // Gather candidate statistics
    const [solvedProblemIds, completedCoursesCount, submittedQuizCount, perfectScoreCount] =
      await Promise.all([
        Submission.distinct('problemId', { userId, status: 'Accepted' }),
        Enrollment.countDocuments({ userId, completedAt: { $ne: null } }),
        QuizAttempt.countDocuments({ userId, status: 'SUBMITTED' }),
        QuizAttempt.countDocuments({ userId, percentage: 100 }),
      ]);

    const distinctSolvedCount = solvedProblemIds.length;
    const currentStreak = user.learningStreak || 0;
    const currentPoints = user.totalPoints || user.points || 0;

    const newlyUnlocked: any[] = [];

    for (const ach of lockedAchievements) {
      let isEligible = false;

      switch (ach.requirementType) {
        case 'FIRST_PROBLEM':
          isEligible = distinctSolvedCount >= 1;
          break;
        case 'PROBLEMS_SOLVED':
          isEligible = distinctSolvedCount >= ach.requirementValue;
          break;
        case 'FIRST_COURSE':
          isEligible = completedCoursesCount >= 1;
          break;
        case 'COURSE_COMPLETED':
          isEligible = completedCoursesCount >= ach.requirementValue;
          break;
        case 'FIRST_QUIZ':
          isEligible = submittedQuizCount >= 1;
          break;
        case 'PERFECT_SCORE':
          isEligible = perfectScoreCount >= ach.requirementValue || triggerContext?.percentage === 100;
          break;
        case 'STREAK_DAYS':
          isEligible = currentStreak >= ach.requirementValue;
          break;
        case 'POINTS_EARNED':
          isEligible = currentPoints >= ach.requirementValue;
          break;
      }

      if (isEligible) {
        // Unlock user achievement
        await UserAchievement.create({
          userId: user._id,
          achievementId: ach._id,
          unlockedAt: new Date(),
        });

        // Add badge
        if (!user.badges.includes(ach.name)) {
          user.badges.push(ach.name);
          await user.save();
        }

        // Award achievement XP (XP ONLY, 0 Coins)
        if (ach.points > 0) {
          await this.awardXpOnly({
            userId: user._id,
            amount: ach.points,
            reason: `Unlocked achievement: ${ach.name}`,
          });
        }

        // Send notification
        await notificationService.createNotification({
          userId: user._id,
          title: 'Achievement Unlocked!',
          message: `Congratulations! You unlocked "${ach.name}" (+${ach.points} XP).`,
          type: 'ACHIEVEMENT',
          link: '/achievements',
          referenceType: 'ACHIEVEMENT',
          referenceId: ach._id.toString(),
        });

        newlyUnlocked.push({
          id: ach._id.toString(),
          name: ach.name,
          slug: ach.slug,
          description: ach.description,
          icon: ach.icon,
          category: ach.category,
          points: ach.points,
        });
      }
    }

    return newlyUnlocked;
  }

  private async checkStreakAchievements(user: IUserDocument) {
    await this.checkAndUnlockAchievements(user._id);
  }

  /**
   * Event: Lesson marked completed (XP ONLY, 0 Coins)
   */
  async recordLessonCompleted(
    userId: string | Types.ObjectId,
    _lessonId: string | Types.ObjectId,
    courseId: string | Types.ObjectId
  ) {
    // 1. Award 10 XP for lesson completion (XP only, does not grant spendable coins)
    await this.awardXpOnly({
      userId,
      amount: 10,
      reason: 'Completed lesson',
    });

    // 2. Update streak
    await this.updateStreak(userId);

    // 3. Check achievements
    await this.checkAndUnlockAchievements(userId, { courseId: courseId.toString() });
  }

  /**
   * Event: Quiz submitted (XP ONLY, 0 Coins)
   */
  async recordQuizSubmitted(
    userId: string | Types.ObjectId,
    quizId: string | Types.ObjectId,
    _attemptId: string | Types.ObjectId,
    percentage: number
  ) {
    // 1. Award 20 XP for quiz submission (XP only, does not grant spendable coins)
    await this.awardXpOnly({
      userId,
      amount: 20,
      reason: `Completed quiz assessment (${percentage}%)`,
    });

    // 2. Update streak
    await this.updateStreak(userId);

    // 3. Check achievements
    await this.checkAndUnlockAchievements(userId, {
      quizId: quizId.toString(),
      percentage,
    });
  }

  /**
   * Event: DSA problem accepted
   * First problem solve: One-time Lifetime Welcome Bonus of +50 NEC Coins & +25 XP
   * Subsequent problem solves: +25 XP ONLY (0 spendable coins)
   */
  async recordProblemSolved(
    userId: string | Types.ObjectId,
    problemId: string | Types.ObjectId,
    submissionId: string | Types.ObjectId
  ) {
    // 1. Check if problem was previously accepted by this user
    const previousAccepted = await Submission.findOne({
      userId,
      problemId,
      status: 'Accepted',
      _id: { $ne: submissionId },
    });

    // Only award on student's first accepted solution for this problem
    if (!previousAccepted) {
      // Check if user has EVER received the lifetime one-time 50 coins JOINING_BONUS
      const existingJoiningBonus = await PointTransaction.findOne({
        userId,
        type: 'JOINING_BONUS',
      });

      // Count distinct accepted problems by this user
      const distinctAcceptedProblems = await Submission.distinct('problemId', {
        userId,
        status: 'Accepted',
      });

      // If user has never received JOINING_BONUS and this is their first accepted problem
      if (!existingJoiningBonus && distinctAcceptedProblems.length <= 1) {
        // Award One-Time Lifetime 50 NEC Coins Welcome Bonus + 25 XP
        await PointTransaction.create({
          userId,
          amount: 50,
          type: 'JOINING_BONUS',
          referenceType: 'PROBLEM',
          referenceId: problemId.toString(),
          description: '🎁 One-time Lifetime Welcome Bonus: Solved 1st practice problem (+50 NEC Coins)',
          createdAt: new Date(),
        });

        // Increment spendable coins by 50 and lifetime XP by 75 (50 bonus + 25 problem XP)
        await User.findByIdAndUpdate(userId, {
          $inc: { points: 50, totalPoints: 75 },
        });

        await notificationService.createNotification({
          userId,
          title: '🎁 Welcome Bonus Claimed!',
          message: 'Congratulations on solving your first coding problem! You earned a one-time welcome bonus of +50 NEC Coins and +25 XP.',
          type: 'ACHIEVEMENT',
          link: '/rewards',
          referenceType: 'PROBLEM',
          referenceId: problemId.toString(),
        });
      } else {
        // Subsequent practice problem: Award +25 XP ONLY (0 spendable coins)
        await this.awardXpOnly({
          userId,
          amount: 25,
          reason: 'Solved coding practice problem',
        });
      }
    }

    // 2. Record activity date for calendar heatmap (POTD streak is preserved strictly for POTD)
    await User.findByIdAndUpdate(userId, { lastActivityDate: new Date() });

    // 3. Check achievements
    await this.checkAndUnlockAchievements(userId, {
      problemId: problemId.toString(),
    });
  }

  /**
   * Event: Course fully completed (XP ONLY, 0 Coins)
   */
  async recordCourseCompleted(
    userId: string | Types.ObjectId,
    courseId: string | Types.ObjectId,
    courseTitle: string
  ) {
    // 1. Award 100 XP for course completion (XP only, does not grant spendable coins)
    await this.awardXpOnly({
      userId,
      amount: 100,
      reason: `Completed course: ${courseTitle}`,
    });

    // 2. Update streak
    await this.updateStreak(userId);

    // 3. Check achievements
    await this.checkAndUnlockAchievements(userId, {
      courseId: courseId.toString(),
    });
  }

  /**
   * Get student gamification summary
   */
  async getStudentGamificationSummary(userId: string | Types.ObjectId) {
    const user = await User.findById(userId).lean();
    if (!user) return null;

    const [unlockedRecords, totalAchievementsCount, recentTransactions] = await Promise.all([
      UserAchievement.find({ userId })
        .populate('achievementId')
        .sort({ unlockedAt: -1 })
        .lean(),
      Achievement.countDocuments({ isActive: true }),
      PointTransaction.find({ userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    const recentAchievements = unlockedRecords
      .filter((r) => r.achievementId)
      .slice(0, 5)
      .map((r: any) => ({
        id: r.achievementId._id.toString(),
        name: r.achievementId.name,
        slug: r.achievementId.slug,
        description: r.achievementId.description,
        icon: r.achievementId.icon,
        category: r.achievementId.category,
        points: r.achievementId.points,
        unlockedAt: r.unlockedAt,
      }));

    return {
      points: user.points || 0,
      totalPoints: user.totalPoints || user.points || 0,
      learningStreak: user.learningStreak || 0,
      longestStreak: user.longestStreak || user.learningStreak || 0,
      lastActivityDate: user.lastActivityDate || null,
      unlockedCount: unlockedRecords.length,
      totalAchievements: totalAchievementsCount,
      recentAchievements,
      recentTransactions: recentTransactions.map((t) => ({
        id: t._id.toString(),
        amount: t.amount,
        type: t.type,
        description: t.description,
        createdAt: t.createdAt,
      })),
    };
  }

  /**
   * Get all achievements with student progress
   */
  async getAllAchievementsWithUserProgress(userId: string | Types.ObjectId) {
    const user = await User.findById(userId).lean();
    if (!user) return [];

    const [achievements, userAchievements, solvedCount, completedCoursesCount, submittedQuizCount, perfectScoreCount] =
      await Promise.all([
        Achievement.find({ isActive: true }).sort({ category: 1, requirementValue: 1 }).lean(),
        UserAchievement.find({ userId }).lean(),
        Submission.distinct('problemId', { userId, status: 'Accepted' }).then((res) => res.length),
        Enrollment.countDocuments({ userId, completedAt: { $ne: null } }),
        QuizAttempt.countDocuments({ userId, status: 'SUBMITTED' }),
        QuizAttempt.countDocuments({ userId, percentage: 100 }),
      ]);

    const userMap = new Map(
      userAchievements.map((ua) => [ua.achievementId.toString(), ua.unlockedAt])
    );

    const currentStreak = user.learningStreak || 0;
    const currentPoints = user.totalPoints || user.points || 0;

    return achievements.map((ach) => {
      const isUnlocked = userMap.has(ach._id.toString());
      const unlockedAt = userMap.get(ach._id.toString()) || null;

      let currentProgress = 0;
      switch (ach.requirementType) {
        case 'FIRST_PROBLEM':
        case 'PROBLEMS_SOLVED':
          currentProgress = solvedCount;
          break;
        case 'FIRST_COURSE':
        case 'COURSE_COMPLETED':
          currentProgress = completedCoursesCount;
          break;
        case 'FIRST_QUIZ':
          currentProgress = submittedQuizCount;
          break;
        case 'PERFECT_SCORE':
          currentProgress = perfectScoreCount;
          break;
        case 'STREAK_DAYS':
          currentProgress = currentStreak;
          break;
        case 'POINTS_EARNED':
          currentProgress = currentPoints;
          break;
      }

      return {
        id: ach._id.toString(),
        name: ach.name,
        slug: ach.slug,
        description: ach.description,
        icon: ach.icon,
        category: ach.category,
        points: ach.points,
        requirementType: ach.requirementType,
        requirementValue: ach.requirementValue,
        isUnlocked,
        unlockedAt,
        currentProgress: Math.min(currentProgress, ach.requirementValue),
        targetProgress: ach.requirementValue,
      };
    });
  }
}

export const gamificationService = new GamificationService();
