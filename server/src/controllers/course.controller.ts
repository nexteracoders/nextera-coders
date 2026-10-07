import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Course } from '../models/course.model';
import { Module } from '../models/module.model';
import { Lesson } from '../models/lesson.model';
import { Enrollment } from '../models/enrollment.model';
import { User } from '../models/user.model';
import { notificationService } from '../services/notification.service';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

// @desc    Get all published courses with pagination, search, & filter
// @route   GET /api/courses
// @access  Public
export const getPublishedCourses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 12;
    const skip = (page - 1) * limit;

    const search = req.query.search as string;
    const category = req.query.category as string;
    const level = req.query.level as string;
    const featured = req.query.featured as string;
    const sort = (req.query.sort as string) || 'newest';

    const courseType = (req.query.type as string)?.toLowerCase();
    const query: any = { isPublished: true };

    const searchConditions = search && search.trim() ? [
      { title: { $regex: search.trim(), $options: 'i' } },
      { shortDescription: { $regex: search.trim(), $options: 'i' } },
      { tags: { $in: [new RegExp(search.trim(), 'i')] } },
    ] : null;

    if (searchConditions && (courseType === 'premium' || courseType === 'pro')) {
      query.$and = [
        { $or: searchConditions },
        { proPrice: { $gt: 0 } },
        { isProAvailable: { $ne: false } },
      ];
    } else if (searchConditions && courseType === 'free') {
      query.$and = [
        { $or: searchConditions },
        {
          $or: [
            { isProAvailable: false },
            { proPrice: 0 },
            { proPrice: { $exists: false } },
          ],
        },
        { proPrice: { $not: { $gt: 0 } } },
      ];
    } else if (searchConditions) {
      query.$or = searchConditions;
    } else if (courseType === 'free') {
      query.$or = [
        { isProAvailable: false },
        { proPrice: 0 },
        { proPrice: { $exists: false } },
      ];
      query.proPrice = { $not: { $gt: 0 } };
    } else if (courseType === 'premium' || courseType === 'pro') {
      query.proPrice = { $gt: 0 };
      query.isProAvailable = { $ne: false };
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (level && level !== 'All' && level !== 'All Levels') {
      query.level = level;
    }

    if (featured === 'true') {
      query.isFeatured = true;
    }

    let sortCriteria: any = { createdAt: -1 };
    if (sort === 'oldest') sortCriteria = { createdAt: 1 };
    if (sort === 'title') sortCriteria = { title: 1 };

    const [courses, totalItems, totalPublished, totalPro, totalFree] = await Promise.all([
      Course.find(query).sort(sortCriteria).skip(skip).limit(limit).lean(),
      Course.countDocuments(query),
      Course.countDocuments({ isPublished: true }),
      Course.countDocuments({ isPublished: true, proPrice: { $gt: 0 }, isProAvailable: { $ne: false } }),
      Course.countDocuments({
        isPublished: true,
        $or: [{ isProAvailable: false }, { proPrice: 0 }, { proPrice: { $exists: false } }],
      }),
    ]);

    const userEnrollmentsMap = new Map<string, string>();
    const isUserPro = Boolean(
      req.user &&
      req.user.isPro &&
      req.user.subscription?.plan &&
      req.user.subscription?.status === 'active' &&
      (!req.user.subscription.endDate || new Date(req.user.subscription.endDate) > new Date())
    );
    const isAdmin = req.user?.role === 'admin';

    if (req.user) {
      const enrollments = await Enrollment.find({ userId: req.user._id }).lean();
      enrollments.forEach((e) => {
        userEnrollmentsMap.set(e.courseId.toString(), e.tier);
      });
    }

    const enrichedCourses = await Promise.all(
      courses.map(async (c) => {
        const [modulesCount, lessonsCount] = await Promise.all([
          Module.countDocuments({ courseId: c._id }),
          Lesson.countDocuments({ courseId: c._id, isPublished: true }),
        ]);

        const courseIdStr = c._id.toString();
        const userTier = userEnrollmentsMap.get(courseIdStr);
        const userPlan = (req as any).user?.subscription?.plan;
        const courseProPlans = Array.isArray((c as any).includedInProPlans)
          ? (c as any).includedInProPlans
          : ((c as any).isIncludedInMembership !== false ? ['monthly', 'yearly', 'lifetime'] : []);
        const isPlanMatching = Boolean(userPlan && courseProPlans.includes(userPlan));
        const hasMembershipAccess = isUserPro && (c as any).isIncludedInMembership !== false && isPlanMatching;
        const isFreeCourse = Boolean(c.proPrice === 0 || c.isProAvailable === false);
        const isEnrolled = Boolean(userTier || hasMembershipAccess || isFreeCourse || isAdmin);
        const effectiveTier = (userTier === 'pro' || hasMembershipAccess || isFreeCourse || isAdmin) ? 'pro' : (userTier || 'free');

        return {
          ...c,
          id: courseIdStr,
          modulesCount,
          lessonsCount,
          isEnrolled,
          enrollmentTier: isEnrolled ? effectiveTier : undefined,
        };
      })
    );

    ApiResponse.success(
      res,
      'Courses retrieved successfully',
      {
        courses: enrichedCourses,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalItems / limit) || 1,
          totalItems,
          limit,
        },
        stats: {
          total: totalPublished,
          pro: totalPro,
          free: totalFree,
        },
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get single course details by slug with published curriculum
// @route   GET /api/courses/:slug
// @access  Public
export const getCourseBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { slug } = req.params;

    const course = await Course.findOne({ slug, isPublished: true }).lean();
    if (!course) {
      throw ApiError.notFound('Course not found or is currently in draft mode');
    }

    const modules = await Module.find({ courseId: course._id }).sort({ order: 1 }).lean();

    const curriculum = await Promise.all(
      modules.map(async (mod) => {
        const lessons = await Lesson.find({
          moduleId: mod._id,
          isPublished: true,
        })
          .sort({ order: 1 })
          .select('_id title description duration isFree order videoUrl thumbnail')
          .lean();

        return {
          id: mod._id.toString(),
          title: mod.title,
          description: mod.description,
          order: mod.order,
          lessons: lessons.map((l) => ({
            id: l._id.toString(),
            title: l.title,
            description: l.description,
            duration: l.duration,
            isFree: l.isFree,
            order: l.order,
            videoUrl: (l as any).videoUrl || '',
            thumbnail: (l as any).thumbnail || '',
          })),
        };
      })
    );

    let isEnrolled = false;
    let enrollmentData: any = null;

    if (req.user) {
      const enrollment = await Enrollment.findOne({
        userId: req.user._id,
        courseId: course._id,
      }).lean();

      const isCourseIncludedInMembership = course.isIncludedInMembership !== false;
      const isProMember = Boolean(
        req.user.isPro &&
        req.user.subscription?.plan &&
        req.user.subscription?.status === 'active' &&
        (!req.user.subscription.endDate || new Date(req.user.subscription.endDate) > new Date())
      );
      const userPlan = req.user.subscription?.plan;
      const courseProPlans = Array.isArray((course as any).includedInProPlans)
        ? (course as any).includedInProPlans
        : (isCourseIncludedInMembership ? ['monthly', 'yearly', 'lifetime'] : []);
      const isPlanMatching = Boolean(userPlan && courseProPlans.includes(userPlan));
      const hasMembershipPassPro = isProMember && isCourseIncludedInMembership && isPlanMatching;
      const isAdmin = req.user.role === 'admin';

      if (enrollment || hasMembershipPassPro || isAdmin) {
        isEnrolled = true;
        enrollmentData = {
          tier: (enrollment?.tier === 'pro' || hasMembershipPassPro || isAdmin) ? 'pro' : (enrollment?.tier || 'free'),
          progress: enrollment?.progress || 0,
          lastAccessedLesson: enrollment?.lastAccessedLesson?.toString(),
          isCompleted: Boolean(enrollment?.completedAt || enrollment?.progress === 100),
        };
      }
    }

    const totalLessons = curriculum.reduce((acc, m) => acc + m.lessons.length, 0);

    ApiResponse.success(
      res,
      'Course details retrieved successfully',
      {
        course: {
          ...course,
          id: course._id.toString(),
          originalPrice: course.originalPrice || 9999,
          proPrice: course.proPrice || 1999,
          freePrice: 0,
          isProAvailable: course.isProAvailable !== false,
          curriculum,
          totalModules: modules.length,
          totalLessons,
          isEnrolled,
          enrollmentTier: enrollmentData ? enrollmentData.tier : undefined,
          enrollment: enrollmentData,
        },
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get complete course player learning data for enrolled student
// @route   GET /api/courses/:slug/learn-data
// @access  Protected (Student)
export const getCourseLearnData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { slug } = req.params;
    const requestedLessonId = req.query.lessonId as string;
    const user = req.user!;

    const course = await Course.findOne({ slug, isPublished: true }).lean();
    if (!course) {
      throw ApiError.notFound('Course not found or is in draft mode');
    }

    let enrollment = await Enrollment.findOne({
      userId: user._id,
      courseId: course._id,
    });

    const isCourseIncludedInMembership = course.isIncludedInMembership !== false;
    const isProMember = Boolean(
      user.isPro &&
      user.subscription?.plan &&
      user.subscription?.status === 'active' &&
      (!user.subscription.endDate || new Date(user.subscription.endDate) > new Date())
    );
    const userPlan = user.subscription?.plan;
    const courseProPlans = Array.isArray((course as any).includedInProPlans)
      ? (course as any).includedInProPlans
      : (isCourseIncludedInMembership ? ['monthly', 'yearly', 'lifetime'] : []);
    const isPlanMatching = Boolean(userPlan && courseProPlans.includes(userPlan));
    const hasMembershipPassPro = isProMember && isCourseIncludedInMembership && isPlanMatching;
    const isAdmin = user.role === 'admin' || user.role === 'sub_admin';
    const is100PercentFreeCourse = Boolean(
      course.proPrice === 0 ||
      course.isProAvailable === false ||
      (course.isIncludedInMembership === false && course.proPrice === 0)
    );

    if (!enrollment) {
      if (hasMembershipPassPro) {
        enrollment = await Enrollment.create({
          userId: user._id,
          courseId: course._id,
          tier: 'pro',
          progress: 0,
          completedLessons: [],
          paymentMethod: 'NEC_PRO_ONE_PASS',
        });
      } else if (is100PercentFreeCourse) {
        enrollment = await Enrollment.create({
          userId: user._id,
          courseId: course._id,
          tier: 'pro',
          progress: 0,
          completedLessons: [],
          paymentMethod: 'FREE_COURSE',
        });
      } else if (isAdmin) {
        enrollment = await Enrollment.create({
          userId: user._id,
          courseId: course._id,
          tier: 'pro',
          progress: 0,
          completedLessons: [],
          paymentMethod: 'STAFF_ACCESS',
        });
      }
    } else if (enrollment && (hasMembershipPassPro || is100PercentFreeCourse || isAdmin) && enrollment.tier !== 'pro') {
      enrollment.tier = 'pro';
      await enrollment.save();
    }

    if (!enrollment && !isAdmin) {
      throw ApiError.forbidden('You are not enrolled in this course. Please enroll or submit payment verification.', 'ENROLLMENT_REQUIRED');
    }

    const completedSet = new Set(enrollment ? enrollment.completedLessons.map((id) => id.toString()) : []);

    const modules = await Module.find({ courseId: course._id }).sort({ order: 1 }).lean();

    const curriculum = await Promise.all(
      modules.map(async (mod) => {
        const lessons = await Lesson.find({
          moduleId: mod._id,
          isPublished: true,
        })
          .sort({ order: 1 })
          .select('_id title description duration isFree order videoUrl thumbnail')
          .lean();

        return {
          id: mod._id.toString(),
          title: mod.title,
          description: mod.description,
          order: mod.order,
          lessons: lessons.map((l) => ({
            id: l._id.toString(),
            title: l.title,
            description: l.description,
            duration: l.duration,
            isFree: l.isFree,
            order: l.order,
            videoUrl: l.videoUrl || '',
            thumbnail: (l as any).thumbnail || '',
            hasVideo: !!l.videoUrl,
            isCompleted: completedSet.has(l._id.toString()),
          })),
        };
      })
    );

    const allLessons = curriculum.flatMap((m) => m.lessons);

    let activeLessonId = allLessons[0]?.id || null;

    if (requestedLessonId && allLessons.some((l) => l.id === requestedLessonId)) {
      activeLessonId = requestedLessonId;
    } else if (enrollment?.lastAccessedLesson && allLessons.some((l) => l.id === enrollment.lastAccessedLesson!.toString())) {
      activeLessonId = enrollment.lastAccessedLesson!.toString();
    } else {
      const firstUncompleted = allLessons.find((l) => !l.isCompleted);
      if (firstUncompleted) {
        activeLessonId = firstUncompleted.id;
      }
    }

    const totalLessons = allLessons.length;
    const completedCount = completedSet.size;
    const progress = totalLessons > 0 ? Math.min(100, Math.round((completedCount / totalLessons) * 100)) : 0;

    ApiResponse.success(
      res,
      'Learning data retrieved successfully',
      {
        course: {
          id: course._id.toString(),
          title: course.title,
          slug: course.slug,
          category: course.category,
          level: course.level,
          duration: course.duration,
          instructor: course.instructor,
          originalPrice: course.originalPrice || 9999,
          proPrice: course.proPrice || 1999,
          freePrice: 0,
        },
        enrollment: enrollment
          ? {
              id: enrollment._id.toString(),
              tier: enrollment.tier || 'free',
              progress: enrollment.progress !== undefined ? enrollment.progress : progress,
              completedLessons: Array.from(completedSet),
              lastAccessedLesson: enrollment.lastAccessedLesson?.toString() || activeLessonId,
              isCompleted: !!enrollment.completedAt,
              completedAt: enrollment.completedAt,
            }
          : null,
        curriculum,
        activeLessonId,
        totalLessons,
        completedCount,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get course progress for student
// @route   GET /api/courses/:id/progress
// @access  Protected (Student)
export const getCourseProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const courseId = req.params.id;
    const user = req.user!;

    if (!Types.ObjectId.isValid(courseId)) {
      throw ApiError.badRequest('Invalid course ID format');
    }

    const [course, initialEnrollment, totalLessons] = await Promise.all([
      Course.findById(courseId).lean(),
      Enrollment.findOne({ userId: user._id, courseId }),
      Lesson.countDocuments({ courseId, isPublished: true }),
    ]);

    if (!course) {
      throw ApiError.notFound('Course not found');
    }

    let enrollment: any = initialEnrollment;

    if (!enrollment) {
      const is100PercentFreeCourse = Boolean(
        course.proPrice === 0 ||
        course.isProAvailable === false ||
        (course.isIncludedInMembership === false && course.proPrice === 0)
      );
      const isStaff = user.role === 'admin' || user.role === 'sub_admin';

      if (is100PercentFreeCourse || isStaff) {
        enrollment = await Enrollment.create({
          userId: user._id,
          courseId: course._id,
          tier: 'pro',
          progress: 0,
          completedLessons: [],
          paymentMethod: is100PercentFreeCourse ? 'FREE_COURSE' : 'STAFF_ACCESS',
        });
      } else {
        throw ApiError.forbidden('You are not enrolled in this course', 'NOT_ENROLLED');
      }
    }

    const completedLessonCount = enrollment.completedLessons.length;
    const calculatedProgress = totalLessons > 0
      ? Math.min(100, Math.round((completedLessonCount / totalLessons) * 100))
      : 0;

    ApiResponse.success(
      res,
      'Course progress retrieved',
      {
        courseId,
        tier: enrollment.tier || 'free',
        progress: enrollment.progress !== undefined ? enrollment.progress : calculatedProgress,
        completedLessons: enrollment.completedLessons.map((id: any) => id.toString()),
        lastAccessedLesson: enrollment.lastAccessedLesson?.toString(),
        totalLessons,
        completedLessonCount,
        isCompleted: !!enrollment.completedAt,
        completedAt: enrollment.completedAt,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Enroll in or upgrade a published course
// @route   POST /api/courses/:id/enroll
// @access  Protected (Student)
export const enrollInCourse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const courseId = req.params.id;
    const user = req.user!;
    const { tier = 'free' } = req.body;

    if (!Types.ObjectId.isValid(courseId)) {
      throw ApiError.badRequest('Invalid course ID format');
    }

    const course = await Course.findById(courseId);
    if (!course || !course.isPublished) {
      throw ApiError.notFound('Course not found or unavailable for enrollment');
    }

    const existing = await Enrollment.findOne({
      userId: user._id,
      courseId: course._id,
    });

    const is100PercentFreeCourse = Boolean(
      course.proPrice === 0 ||
      course.isProAvailable === false ||
      (course.isIncludedInMembership === false && course.proPrice === 0)
    );
    const isCourseIncludedInMembership = course.isIncludedInMembership !== false;
    const isProMember = Boolean(
      user.isPro &&
      user.subscription?.plan &&
      user.subscription?.status === 'active' &&
      (!user.subscription.endDate || new Date(user.subscription.endDate) > new Date())
    );
    const userPlan = user.subscription?.plan;
    const courseProPlans = Array.isArray((course as any).includedInProPlans)
      ? (course as any).includedInProPlans
      : (isCourseIncludedInMembership ? ['monthly', 'yearly', 'lifetime'] : []);
    const isPlanMatching = Boolean(userPlan && courseProPlans.includes(userPlan));
    const hasMembershipPassPro = isProMember && isCourseIncludedInMembership && isPlanMatching;
    const isStaff = user.role === 'admin' || user.role === 'sub_admin';

    // Determine allowed tier for direct enrollment
    const finalTier: 'free' | 'pro' = (is100PercentFreeCourse || hasMembershipPassPro || isStaff)
      ? 'pro'
      : 'free';

    if (existing) {
      if (existing.tier === 'free' && finalTier === 'pro') {
        existing.tier = 'pro';
        existing.upgradedAt = new Date();
        await existing.save();

        ApiResponse.success(
          res,
          'Successfully unlocked Pro Track access!',
          {
            enrollment: {
              id: existing._id.toString(),
              courseId: course._id.toString(),
              tier: 'pro',
              enrolledAt: existing.enrolledAt,
              upgradedAt: existing.upgradedAt,
              progress: existing.progress,
            },
            course: {
              id: course._id.toString(),
              title: course.title,
              slug: course.slug,
            },
          },
          200
        );
        return;
      }

      throw ApiError.badRequest('You are already enrolled in this course', 'ALREADY_ENROLLED');
    }

    const enrollment = await Enrollment.create({
      userId: user._id,
      courseId: course._id,
      tier: finalTier,
      paymentId: finalTier === 'pro' ? (hasMembershipPassPro ? 'NEC_PRO_ONE_PASS' : 'FREE_COURSE') : '',
      paymentAmount: 0,
      paymentMethod: finalTier === 'pro' ? (hasMembershipPassPro ? 'NEC_PRO_ONE_PASS' : 'Free') : 'Free',
      progress: 0,
      completedLessons: [],
    });

    // Notify all admin accounts about student course enrollment
    try {
      const admins = await User.find({ role: 'admin' }).select('_id email').lean();
      for (const admin of admins) {
        await notificationService.createNotification({
          userId: admin._id,
          title: '🎓 New Course Enrollment!',
          message: `${user.name} (${user.email}) enrolled in "${course.title}" (${tier === 'pro' ? 'NEC Pro Track' : 'Free Curriculum'}).`,
          type: 'SYSTEM',
          link: '/admin/students',
          referenceType: 'COURSE_ENROLLMENT',
          referenceId: enrollment._id.toString(),
        });
      }
    } catch {
      // non-blocking
    }

    ApiResponse.success(
      res,
      tier === 'pro' ? 'Successfully enrolled in NEC Pro Track!' : 'Successfully enrolled in NEC Free Track!',
      {
        enrollment: {
          id: enrollment._id.toString(),
          courseId: course._id.toString(),
          tier: enrollment.tier,
          enrolledAt: enrollment.enrolledAt,
          progress: enrollment.progress,
        },
        course: {
          id: course._id.toString(),
          title: course.title,
          slug: course.slug,
        },
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get all courses enrolled by active student (Legacy list endpoint)
// @route   GET /api/courses/enrolled/me
// @access  Protected (Student)
export const getMyEnrolledCourses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;

    const enrollments = await Enrollment.find({ userId: user._id })
      .populate('courseId')
      .populate('lastAccessedLesson')
      .sort({ updatedAt: -1 })
      .lean();

    const courses = enrollments
      .filter((e) => e.courseId)
      .map((e: any) => ({
        enrollmentId: e._id.toString(),
        progress: e.progress,
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
      }));

    ApiResponse.success(res, 'Enrolled courses retrieved successfully', { courses }, 200);
  } catch (error) {
    next(error);
  }
};
