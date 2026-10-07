import { Request, Response, NextFunction } from 'express';
import { Course } from '../models/course.model';
import { Module } from '../models/module.model';
import { Lesson } from '../models/lesson.model';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

// @desc    Get all modules (optionally filtered by courseId)
// @route   GET /api/admin/modules
// @access  Admin
export const adminGetModules = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseId } = req.query;
    const query: any = {};
    if (courseId) {
      query.courseId = courseId;
    }

    const modules = await Module.find(query)
      .populate('courseId', 'title slug')
      .sort({ courseId: 1, order: 1 })
      .lean();

    const enriched = await Promise.all(
      modules.map(async (m) => {
        const lessonCount = await Lesson.countDocuments({ moduleId: m._id });
        return {
          id: m._id.toString(),
          title: m.title,
          description: m.description,
          order: m.order,
          course: m.courseId
            ? { id: (m.courseId as any)._id.toString(), title: (m.courseId as any).title, slug: (m.courseId as any).slug }
            : null,
          lessonCount,
          createdAt: m.createdAt,
        };
      })
    );

    ApiResponse.success(res, 'Modules retrieved successfully', { modules: enriched }, 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a module
// @route   POST /api/admin/modules
// @access  Admin
export const adminCreateModule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseId, title, description, order } = req.body;

    const course = await Course.findById(courseId);
    if (!course) throw ApiError.notFound('Course not found');

    let moduleOrder = order;
    if (!moduleOrder) {
      const highest = await Module.findOne({ courseId }).sort({ order: -1 });
      moduleOrder = highest ? highest.order + 1 : 1;
    }

    const newModule = await Module.create({
      courseId,
      title,
      description: description || '',
      order: moduleOrder,
    });

    ApiResponse.success(
      res,
      'Module created successfully',
      {
        module: {
          ...newModule.toObject(),
          id: newModule._id.toString(),
        },
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Update a module
// @route   PUT /api/admin/modules/:id
// @access  Admin
export const adminUpdateModule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const mod = await Module.findByIdAndUpdate(id, req.body, { new: true });
    if (!mod) throw ApiError.notFound('Module not found');

    ApiResponse.success(
      res,
      'Module updated successfully',
      {
        module: {
          ...mod.toObject(),
          id: mod._id.toString(),
        },
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a module and its lessons
// @route   DELETE /api/admin/modules/:id
// @access  Admin
export const adminDeleteModule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const mod = await Module.findById(id);
    if (!mod) throw ApiError.notFound('Module not found');

    await Promise.all([
      Module.findByIdAndDelete(id),
      Lesson.deleteMany({ moduleId: id }),
    ]);

    ApiResponse.success(res, 'Module and lessons deleted successfully', null, 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Reorder a module
// @route   PATCH /api/admin/modules/:id/reorder
// @access  Admin
export const adminReorderModule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { newOrder } = req.body;

    if (typeof newOrder !== 'number') {
      throw ApiError.badRequest('newOrder must be a number');
    }

    const mod = await Module.findByIdAndUpdate(id, { order: newOrder }, { new: true });
    if (!mod) throw ApiError.notFound('Module not found');

    ApiResponse.success(res, 'Module reordered successfully', { module: mod }, 200);
  } catch (error) {
    next(error);
  }
};
