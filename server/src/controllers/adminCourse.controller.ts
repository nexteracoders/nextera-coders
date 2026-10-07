import { Request, Response, NextFunction } from 'express';
import { Course } from '../models/course.model';
import { Module } from '../models/module.model';
import { Lesson } from '../models/lesson.model';
import { Enrollment } from '../models/enrollment.model';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

// @desc    Get all courses for admin
// @route   GET /api/admin/courses
// @access  Admin
export const adminGetCourses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const skip = (page - 1) * limit;

    const search = req.query.search as string;
    const status = req.query.status as string;
    const category = req.query.category as string;

    const query: any = {};

    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { category: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    if (status === 'published') query.isPublished = true;
    if (status === 'draft') query.isPublished = false;
    if (category && category !== 'All') query.category = category;

    const courseType = (req.query.type as string)?.toLowerCase();
    if (courseType === 'pro' || courseType === 'premium') {
      query.proPrice = { $gt: 0 };
      query.isProAvailable = { $ne: false };
    } else if (courseType === 'free') {
      query.$or = [
        { isProAvailable: false },
        { proPrice: 0 },
        { proPrice: { $exists: false } },
      ];
    }

    const [courses, totalItems, totalAll, totalPublished, totalDrafts, totalPro, totalFree] = await Promise.all([
      Course.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Course.countDocuments(query),
      Course.countDocuments({}),
      Course.countDocuments({ isPublished: true }),
      Course.countDocuments({ isPublished: false }),
      Course.countDocuments({ proPrice: { $gt: 0 }, isProAvailable: { $ne: false } }),
      Course.countDocuments({
        $or: [{ isProAvailable: false }, { proPrice: 0 }, { proPrice: { $exists: false } }],
      }),
    ]);

    const enriched = await Promise.all(
      courses.map(async (c) => {
        const [modulesCount, lessonsCount, enrollmentsCount] = await Promise.all([
          Module.countDocuments({ courseId: c._id }),
          Lesson.countDocuments({ courseId: c._id }),
          Enrollment.countDocuments({ courseId: c._id }),
        ]);
        return {
          ...c,
          id: c._id.toString(),
          modulesCount,
          lessonsCount,
          enrollmentsCount,
        };
      })
    );

    ApiResponse.success(
      res,
      'Admin courses list retrieved',
      {
        courses: enriched,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalItems / limit) || 1,
          totalItems,
          limit,
        },
        stats: {
          total: totalAll,
          published: totalPublished,
          drafts: totalDrafts,
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

// @desc    Get course by ID for admin
// @route   GET /api/admin/courses/:id
// @access  Admin
export const adminGetCourseById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id).lean();
    if (!course) {
      throw ApiError.notFound('Course not found');
    }

    const modules = await Module.find({ courseId: course._id }).sort({ order: 1 }).lean();

    const fullCurriculum = await Promise.all(
      modules.map(async (mod) => {
        const lessons = await Lesson.find({ moduleId: mod._id }).sort({ order: 1 }).lean();
        return {
          ...mod,
          id: mod._id.toString(),
          lessons: lessons.map((l) => ({
            ...l,
            id: l._id.toString(),
          })),
        };
      })
    );

    ApiResponse.success(
      res,
      'Course fetched for admin management',
      {
        course: {
          ...course,
          id: course._id.toString(),
          curriculum: fullCurriculum,
        },
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Create new course
// @route   POST /api/admin/courses
// @access  Admin
export const adminCreateCourse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const payload = { ...req.body };
    if (payload.includedInProPlans !== undefined) {
      if (Array.isArray(payload.includedInProPlans) && payload.includedInProPlans.length > 0) {
        payload.isIncludedInMembership = true;
      } else {
        payload.isIncludedInMembership = false;
        payload.includedInProPlans = [];
      }
    } else if (payload.isIncludedInMembership === false) {
      payload.includedInProPlans = [];
    }

    const course = await Course.create(payload);

    ApiResponse.success(
      res,
      'Course created successfully',
      {
        course: {
          ...course.toObject(),
          id: course._id.toString(),
        },
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Update existing course
// @route   PUT /api/admin/courses/:id
// @access  Admin
export const adminUpdateCourse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id);
    if (!course) {
      throw ApiError.notFound('Course not found');
    }

    const payload = { ...req.body };
    if (payload.includedInProPlans !== undefined) {
      if (Array.isArray(payload.includedInProPlans) && payload.includedInProPlans.length > 0) {
        payload.isIncludedInMembership = true;
      } else {
        payload.isIncludedInMembership = false;
        payload.includedInProPlans = [];
      }
    } else if (payload.isIncludedInMembership === false) {
      payload.includedInProPlans = [];
    }

    course.set(payload);
    course.markModified('includedInProPlans');
    course.markModified('isIncludedInMembership');
    await course.save();

    ApiResponse.success(
      res,
      'Course updated successfully',
      {
        course: {
          ...course.toObject(),
          id: course._id.toString(),
        },
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Delete course and cascade delete contents
// @route   DELETE /api/admin/courses/:id
// @access  Admin
export const adminDeleteCourse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id);
    if (!course) {
      throw ApiError.notFound('Course not found');
    }

    await Promise.all([
      Course.findByIdAndDelete(id),
      Module.deleteMany({ courseId: id }),
      Lesson.deleteMany({ courseId: id }),
      Enrollment.deleteMany({ courseId: id }),
    ]);

    ApiResponse.success(res, 'Course and all related contents deleted successfully', null, 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Publish course
// @route   PATCH /api/admin/courses/:id/publish
// @access  Admin
export const adminPublishCourse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const course = await Course.findByIdAndUpdate(id, { isPublished: true }, { new: true });
    if (!course) throw ApiError.notFound('Course not found');

    ApiResponse.success(res, 'Course published successfully', { isPublished: true }, 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Unpublish course
// @route   PATCH /api/admin/courses/:id/unpublish
// @access  Admin
export const adminUnpublishCourse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const course = await Course.findByIdAndUpdate(id, { isPublished: false }, { new: true });
    if (!course) throw ApiError.notFound('Course not found');

    ApiResponse.success(res, 'Course moved to draft mode', { isPublished: false }, 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle feature course
// @route   PATCH /api/admin/courses/:id/feature
// @access  Admin
export const adminToggleFeatureCourse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id);
    if (!course) throw ApiError.notFound('Course not found');

    course.isFeatured = !course.isFeatured;
    await course.save();

    ApiResponse.success(
      res,
      `Course ${course.isFeatured ? 'featured' : 'unfeatured'} successfully`,
      { isFeatured: course.isFeatured },
      200
    );
  } catch (error) {
    next(error);
  }
};
