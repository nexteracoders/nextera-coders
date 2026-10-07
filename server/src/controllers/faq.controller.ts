import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { FAQ } from '../models/faq.model';
import { auditLogService } from '../services/auditLog.service';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

// @desc    Get published FAQs for public website
// @route   GET /api/faqs
// @access  Public
export const getPublicFaqs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { category } = req.query;
    const query: any = { isPublished: true };
    if (category && category !== 'All') {
      query.category = category;
    }

    const faqs = await FAQ.find(query).sort({ order: 1, createdAt: 1 }).lean();

    ApiResponse.success(
      res,
      'FAQs retrieved successfully',
      {
        faqs: faqs.map((f) => ({
          id: f._id.toString(),
          question: f.question,
          answer: f.answer,
          category: f.category,
          order: f.order,
        })),
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Get all FAQs (including unpublished)
// @route   GET /api/admin/faqs
// @access  Protected (Admin)
export const adminGetFaqs = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const faqs = await FAQ.find().sort({ order: 1, createdAt: -1 }).lean();

    ApiResponse.success(
      res,
      'Admin FAQs retrieved',
      {
        faqs: faqs.map((f) => ({
          id: f._id.toString(),
          question: f.question,
          answer: f.answer,
          category: f.category,
          order: f.order,
          isPublished: f.isPublished,
          createdAt: f.createdAt,
        })),
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Create FAQ
// @route   POST /api/admin/faqs
// @access  Protected (Admin)
export const adminCreateFaq = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { question, answer, category, order, isPublished } = req.body;
    const admin = req.user!;

    if (!question || !answer) {
      throw ApiError.badRequest('Question and answer are required');
    }

    let faqOrder = order;
    if (faqOrder === undefined) {
      const highest = await FAQ.findOne().sort({ order: -1 });
      faqOrder = highest ? highest.order + 1 : 1;
    }

    const faq = await FAQ.create({
      question,
      answer,
      category: category || 'General',
      order: faqOrder,
      isPublished: isPublished !== undefined ? isPublished : true,
    });

    await auditLogService.recordLog({
      adminId: admin._id,
      action: 'CREATE',
      resourceType: 'FAQ',
      resourceId: faq._id.toString(),
      resourceTitle: faq.question,
    });

    ApiResponse.success(res, 'FAQ created successfully', { faq }, 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Update FAQ
// @route   PUT /api/admin/faqs/:id
// @access  Protected (Admin)
export const adminUpdateFaq = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const admin = req.user!;

    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid FAQ ID');
    }

    const faq = await FAQ.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!faq) {
      throw ApiError.notFound('FAQ not found');
    }

    await auditLogService.recordLog({
      adminId: admin._id,
      action: 'UPDATE',
      resourceType: 'FAQ',
      resourceId: faq._id.toString(),
      resourceTitle: faq.question,
    });

    ApiResponse.success(res, 'FAQ updated successfully', { faq }, 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Delete FAQ
// @route   DELETE /api/admin/faqs/:id
// @access  Protected (Admin)
export const adminDeleteFaq = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const admin = req.user!;

    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid FAQ ID');
    }

    const faq = await FAQ.findByIdAndDelete(id);
    if (!faq) {
      throw ApiError.notFound('FAQ not found');
    }

    await auditLogService.recordLog({
      adminId: admin._id,
      action: 'DELETE',
      resourceType: 'FAQ',
      resourceId: id,
      resourceTitle: faq.question,
    });

    ApiResponse.success(res, 'FAQ deleted successfully', null, 200);
  } catch (error) {
    next(error);
  }
};
