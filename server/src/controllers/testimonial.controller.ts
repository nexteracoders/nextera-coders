import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Testimonial } from '../models/testimonial.model';
import { auditLogService } from '../services/auditLog.service';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

// @desc    Get published testimonials for public website
// @route   GET /api/testimonials
// @access  Public
export const getPublicTestimonials = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const testimonials = await Testimonial.find({ isPublished: true })
      .sort({ order: 1, createdAt: -1 })
      .lean();

    ApiResponse.success(
      res,
      'Testimonials retrieved successfully',
      {
        testimonials: testimonials.map((t) => ({
          id: t._id.toString(),
          name: t.name,
          role: t.role,
          company: t.company,
          avatar: t.avatar,
          content: t.content,
          rating: t.rating,
        })),
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Get all testimonials
// @route   GET /api/admin/testimonials
// @access  Protected (Admin)
export const adminGetTestimonials = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const testimonials = await Testimonial.find().sort({ order: 1, createdAt: -1 }).lean();

    ApiResponse.success(
      res,
      'Admin testimonials retrieved',
      {
        testimonials: testimonials.map((t) => ({
          id: t._id.toString(),
          name: t.name,
          role: t.role,
          company: t.company,
          avatar: t.avatar,
          content: t.content,
          rating: t.rating,
          isPublished: t.isPublished,
          order: t.order,
          createdAt: t.createdAt,
        })),
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Create testimonial
// @route   POST /api/admin/testimonials
// @access  Protected (Admin)
export const adminCreateTestimonial = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, role, company, avatar, content, rating, isPublished, order } = req.body;
    const admin = req.user!;

    if (!name || !role || !content) {
      throw ApiError.badRequest('Name, role, and content are required');
    }

    const testimonial = await Testimonial.create({
      name,
      role,
      company: company || '',
      avatar: avatar || '',
      content,
      rating: Number(rating) || 5,
      isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
      order: order !== undefined ? Number(order) : 0,
    });

    await auditLogService.recordLog({
      adminId: admin._id,
      action: 'CREATE',
      resourceType: 'TESTIMONIAL',
      resourceId: testimonial._id.toString(),
      resourceTitle: testimonial.name,
    });

    ApiResponse.success(res, 'Testimonial created successfully', { testimonial }, 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Update testimonial
// @route   PUT /api/admin/testimonials/:id
// @access  Protected (Admin)
export const adminUpdateTestimonial = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const admin = req.user!;

    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid testimonial ID');
    }

    const testimonial = await Testimonial.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!testimonial) {
      throw ApiError.notFound('Testimonial not found');
    }

    await auditLogService.recordLog({
      adminId: admin._id,
      action: 'UPDATE',
      resourceType: 'TESTIMONIAL',
      resourceId: testimonial._id.toString(),
      resourceTitle: testimonial.name,
    });

    ApiResponse.success(res, 'Testimonial updated successfully', { testimonial }, 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Delete testimonial
// @route   DELETE /api/admin/testimonials/:id
// @access  Protected (Admin)
export const adminDeleteTestimonial = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const admin = req.user!;

    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid testimonial ID');
    }

    const testimonial = await Testimonial.findByIdAndDelete(id);
    if (!testimonial) {
      throw ApiError.notFound('Testimonial not found');
    }

    await auditLogService.recordLog({
      adminId: admin._id,
      action: 'DELETE',
      resourceType: 'TESTIMONIAL',
      resourceId: id,
      resourceTitle: testimonial.name,
    });

    ApiResponse.success(res, 'Testimonial deleted successfully', null, 200);
  } catch (error) {
    next(error);
  }
};
