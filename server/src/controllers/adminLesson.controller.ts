import { Request, Response, NextFunction } from 'express';
import { Module } from '../models/module.model';
import { Lesson } from '../models/lesson.model';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

// @desc    Get all lessons (optionally filtered by courseId / moduleId)
// @route   GET /api/admin/lessons
// @access  Admin
export const adminGetLessons = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseId, moduleId, search } = req.query;
    const query: any = {};
    if (courseId) query.courseId = courseId;
    if (moduleId) query.moduleId = moduleId;
    if (search && typeof search === 'string' && search.trim()) {
      query.title = { $regex: search.trim(), $options: 'i' };
    }

    const lessons = await Lesson.find(query)
      .populate('courseId', 'title slug')
      .populate('moduleId', 'title order')
      .sort({ courseId: 1, moduleId: 1, order: 1 })
      .lean();

    ApiResponse.success(
      res,
      'Lessons retrieved successfully',
      {
        lessons: lessons.map((l: any) => ({
          id: l._id.toString(),
          title: l.title,
          description: l.description,
          duration: l.duration,
          order: l.order,
          videoUrl: l.videoUrl,
          thumbnail: l.thumbnail || '',
          isFree: l.isFree,
          isPublished: l.isPublished,
          notes: l.notes,
          resources: l.resources,
          course: l.courseId
            ? { id: l.courseId._id.toString(), title: l.courseId.title, slug: l.courseId.slug }
            : null,
          module: l.moduleId
            ? { id: l.moduleId._id.toString(), title: l.moduleId.title, order: l.moduleId.order }
            : null,
          createdAt: l.createdAt,
        })),
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Create a lesson inside a module
// @route   POST /api/admin/lessons
// @access  Admin
export const adminCreateLesson = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseId, moduleId, title, description, videoUrl, thumbnail, duration, order, notes, resources, isFree, isPublished } = req.body;

    const mod = await Module.findById(moduleId);
    if (!mod) throw ApiError.notFound('Module not found');

    let lessonOrder = order;
    if (!lessonOrder) {
      const highest = await Lesson.findOne({ moduleId }).sort({ order: -1 });
      lessonOrder = highest ? highest.order + 1 : 1;
    }

    const lesson = await Lesson.create({
      courseId,
      moduleId,
      title,
      description: description || '',
      videoUrl: videoUrl || '',
      thumbnail: thumbnail || '',
      duration: duration || '5 mins',
      order: lessonOrder,
      notes: notes || '',
      resources: resources || [],
      isFree: !!isFree,
      isPublished: isPublished !== undefined ? isPublished : true,
    });

    ApiResponse.success(
      res,
      'Lesson created successfully',
      {
        lesson: {
          ...lesson.toObject(),
          id: lesson._id.toString(),
        },
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Update a lesson
// @route   PUT /api/admin/lessons/:id
// @access  Admin
export const adminUpdateLesson = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const lesson = await Lesson.findByIdAndUpdate(id, req.body, { new: true });
    if (!lesson) throw ApiError.notFound('Lesson not found');

    ApiResponse.success(
      res,
      'Lesson updated successfully',
      {
        lesson: {
          ...lesson.toObject(),
          id: lesson._id.toString(),
        },
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a lesson
// @route   DELETE /api/admin/lessons/:id
// @access  Admin
export const adminDeleteLesson = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const lesson = await Lesson.findByIdAndDelete(id);
    if (!lesson) throw ApiError.notFound('Lesson not found');

    ApiResponse.success(res, 'Lesson deleted successfully', null, 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Publish a lesson
// @route   PATCH /api/admin/lessons/:id/publish
// @access  Admin
export const adminPublishLesson = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const lesson = await Lesson.findByIdAndUpdate(id, { isPublished: true }, { new: true });
    if (!lesson) throw ApiError.notFound('Lesson not found');

    ApiResponse.success(res, 'Lesson published', { isPublished: true }, 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Unpublish a lesson
// @route   PATCH /api/admin/lessons/:id/unpublish
// @access  Admin
export const adminUnpublishLesson = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const lesson = await Lesson.findByIdAndUpdate(id, { isPublished: false }, { new: true });
    if (!lesson) throw ApiError.notFound('Lesson not found');

    ApiResponse.success(res, 'Lesson unpublished', { isPublished: false }, 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Reorder a lesson
// @route   PATCH /api/admin/lessons/:id/reorder
// @access  Admin
export const adminReorderLesson = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { newOrder } = req.body;

    if (typeof newOrder !== 'number') {
      throw ApiError.badRequest('newOrder must be a number');
    }

    const lesson = await Lesson.findByIdAndUpdate(id, { order: newOrder }, { new: true });
    if (!lesson) throw ApiError.notFound('Lesson not found');

    ApiResponse.success(res, 'Lesson reordered', { lesson }, 200);
  } catch (error) {
    next(error);
  }
};
