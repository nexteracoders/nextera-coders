import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Lesson } from '../models/lesson.model';
import { Course } from '../models/course.model';
import { Module } from '../models/module.model';
import { Enrollment } from '../models/enrollment.model';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';
import { gamificationService } from '../services/gamification.service';
import { certificateService } from '../services/certificate.service';

// @desc    Get single lesson content with navigation metadata
// @route   GET /api/lessons/:id
// @access  Public for free preview lessons / Protected (Enrolled Student or Admin)
export const getLessonById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid lesson ID format');
    }

    const lesson = await Lesson.findById(id).lean();
    if (!lesson || !lesson.isPublished) {
      throw ApiError.notFound('Lesson not found or is currently in draft');
    }

    const course = await Course.findById(lesson.courseId).lean();
    if (!course || !course.isPublished) {
      throw ApiError.notFound('Parent course not found or is unpublished');
    }

    const currentModule = await Module.findById(lesson.moduleId).lean();

    // Check enrollment if lesson is not free
    let enrollment: any = null;

    if (req.user) {
      enrollment = await Enrollment.findOne({
        userId: req.user._id,
        courseId: course._id,
      });

      const isCourseIncludedInMembership = (course as any).isIncludedInMembership !== false;
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
      const hasMembershipPassAccess = isProMember && isCourseIncludedInMembership && isPlanMatching;
      const hasAdminAccess = req.user.role === 'admin' || req.user.role === 'sub_admin';
      const is100PercentFreeCourse = Boolean(
        (course as any).proPrice === 0 ||
        (course as any).isProAvailable === false ||
        ((course as any).isIncludedInMembership === false && (course as any).proPrice === 0)
      );

      const hasProAccess = Boolean(
        hasAdminAccess ||
        hasMembershipPassAccess ||
        is100PercentFreeCourse ||
        (enrollment && enrollment.tier === 'pro')
      );

      if (!lesson.isFree && !hasProAccess) {
        throw ApiError.forbidden('This is a Pro Video lesson. Please unlock this course or upgrade to Pro to watch.', 'PRO_REQUIRED');
      }
    } else if (!lesson.isFree) {
      throw ApiError.forbidden('You must be signed in and enrolled to access this lesson.', 'ENROLLMENT_REQUIRED');
    }

    // If student is enrolled, record last accessed lesson
    if (enrollment) {
      enrollment.lastAccessedLesson = lesson._id;
      await enrollment.save();
    }

    // Compute previous & next lesson navigation
    const allModules = await Module.find({ courseId: course._id }).sort({ order: 1 }).lean();
    const allPublishedLessons = await Lesson.find({
      courseId: course._id,
      isPublished: true,
    })
      .sort({ order: 1 })
      .select('_id moduleId title order duration isFree')
      .lean();

    const moduleOrderMap = new Map(allModules.map((m, idx) => [m._id.toString(), idx]));
    allPublishedLessons.sort((a, b) => {
      const modA = moduleOrderMap.get(a.moduleId.toString()) ?? 0;
      const modB = moduleOrderMap.get(b.moduleId.toString()) ?? 0;
      if (modA !== modB) return modA - modB;
      return a.order - b.order;
    });

    const currentIndex = allPublishedLessons.findIndex((l) => l._id.toString() === lesson._id.toString());
    const prevLesson = currentIndex > 0 ? {
      id: allPublishedLessons[currentIndex - 1]._id.toString(),
      title: allPublishedLessons[currentIndex - 1].title,
      duration: allPublishedLessons[currentIndex - 1].duration,
      isFree: allPublishedLessons[currentIndex - 1].isFree,
    } : null;

    const nextLesson = currentIndex < allPublishedLessons.length - 1 ? {
      id: allPublishedLessons[currentIndex + 1]._id.toString(),
      title: allPublishedLessons[currentIndex + 1].title,
      duration: allPublishedLessons[currentIndex + 1].duration,
      isFree: allPublishedLessons[currentIndex + 1].isFree,
    } : null;

    const isCompleted = enrollment
      ? enrollment.completedLessons.some((lId: any) => lId.toString() === lesson._id.toString())
      : false;

    ApiResponse.success(
      res,
      'Lesson retrieved successfully',
      {
        lesson: {
          id: lesson._id.toString(),
          courseId: lesson.courseId.toString(),
          moduleId: lesson.moduleId.toString(),
          title: lesson.title,
          description: lesson.description,
          videoUrl: lesson.videoUrl,
          thumbnail: (lesson as any).thumbnail || '',
          duration: lesson.duration,
          order: lesson.order,
          notes: lesson.notes || '',
          resources: lesson.resources || [],
          isFree: lesson.isFree,
          isCompleted,
        },
        module: currentModule
          ? {
              id: currentModule._id.toString(),
              title: currentModule.title,
              order: currentModule.order,
            }
          : null,
        course: {
          id: course._id.toString(),
          title: course.title,
          slug: course.slug,
          category: course.category,
        },
        navigation: {
          prevLesson,
          nextLesson,
          currentLessonIndex: currentIndex + 1,
          totalLessons: allPublishedLessons.length,
        },
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a lesson as complete and update course progress
// @route   POST /api/lessons/:id/complete
// @access  Protected (Student)
export const markLessonComplete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;

    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid lesson ID format');
    }

    const lesson = await Lesson.findById(id);
    if (!lesson || !lesson.isPublished) {
      throw ApiError.notFound('Lesson not found or is unpublished');
    }

    const course = await Course.findById(lesson.courseId);
    if (!course || !course.isPublished) {
      throw ApiError.notFound('Course not found or is unpublished');
    }

    let enrollment = await Enrollment.findOne({
      userId: user._id,
      courseId: course._id,
    });

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

    // Add lesson to completedLessons if not already present
    const lessonIdStr = lesson._id.toString();
    const alreadyCompleted = enrollment.completedLessons.some((lId) => lId.toString() === lessonIdStr);

    if (!alreadyCompleted) {
      enrollment.completedLessons.push(lesson._id);
    }

    enrollment.lastAccessedLesson = lesson._id;

    // Recalculate progress against published lessons
    const totalPublishedLessons = await Lesson.countDocuments({
      courseId: course._id,
      isPublished: true,
    });

    const completedCount = enrollment.completedLessons.length;
    const calculatedProgress = totalPublishedLessons > 0
      ? Math.min(100, Math.round((completedCount / totalPublishedLessons) * 100))
      : 0;

    enrollment.progress = calculatedProgress;

    // Check course completion
    const isNowCompleted = completedCount >= totalPublishedLessons && totalPublishedLessons > 0;
    if (isNowCompleted && !enrollment.completedAt) {
      enrollment.completedAt = new Date();
      enrollment.progress = 100;
    }

    await enrollment.save();

    // Trigger gamification (award lesson points, update streak, check achievements)
    if (!alreadyCompleted) {
      gamificationService
        .recordLessonCompleted(user._id, lesson._id, course._id)
        .catch((err) => console.error('Gamification record error:', err));
    }

    // If course is completed, check eligibility & generate certificate
    let certificateInfo: any = null;
    if (isNowCompleted) {
      try {
        const certResult = await certificateService.generateCertificate(user._id, course._id);
        certificateInfo = {
          id: certResult.certificate._id.toString(),
          certificateId: certResult.certificate.certificateId,
          verificationUrl: certResult.certificate.verificationUrl,
          certificateUrl: certResult.certificate.certificateUrl,
        };
      } catch (err: any) {
        // If required quiz pending or other condition, ignore error here
        console.warn('Auto certificate generation check:', err.message);
      }
    }

    ApiResponse.success(
      res,
      isNowCompleted ? 'Congratulations! You have completed this course!' : 'Lesson marked as complete!',
      {
        enrollment: {
          id: enrollment._id.toString(),
          courseId: course._id.toString(),
          progress: enrollment.progress,
          completedLessonsCount: enrollment.completedLessons.length,
          totalLessons: totalPublishedLessons,
          completedLessons: enrollment.completedLessons.map((l) => l.toString()),
          lastAccessedLesson: enrollment.lastAccessedLesson?.toString(),
          isCompleted: !!enrollment.completedAt,
          completedAt: enrollment.completedAt,
        },
        certificate: certificateInfo,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};
