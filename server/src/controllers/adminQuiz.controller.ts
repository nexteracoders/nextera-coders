import { Request, Response, NextFunction } from 'express';
import { Quiz } from '../models/quiz.model';
import { QuizAttempt } from '../models/quizAttempt.model';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

// @desc    Admin: Get all quizzes (published & drafts)
// @route   GET /api/admin/quizzes
// @access  Admin
export const adminGetQuizzes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const skip = (page - 1) * limit;

    const search = req.query.search as string;
    const status = req.query.status as string;

    const query: any = {};

    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    if (status === 'published') query.isPublished = true;
    if (status === 'draft') query.isPublished = false;

    const [quizzes, totalItems] = await Promise.all([
      Quiz.find(query)
        .populate('courseId', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Quiz.countDocuments(query),
    ]);

    const formatted = quizzes.map((q: any) => ({
      ...q,
      id: q._id.toString(),
      totalQuestions: q.questions?.length || 0,
      courseTitle: q.courseId?.title || null,
    }));

    ApiResponse.success(
      res,
      'Admin quizzes retrieved',
      {
        quizzes: formatted,
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

// @desc    Admin: Get quiz by ID with full questions and correct answers
// @route   GET /api/admin/quizzes/:id
// @access  Admin
export const adminGetQuizById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const quiz = await Quiz.findById(id).lean();
    if (!quiz) {
      throw ApiError.notFound('Quiz not found');
    }

    ApiResponse.success(
      res,
      'Admin quiz details retrieved',
      {
        quiz: {
          ...quiz,
          id: quiz._id.toString(),
        },
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Create quiz
// @route   POST /api/admin/quizzes
// @access  Admin
export const adminCreateQuiz = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const quiz = await Quiz.create(req.body);

    ApiResponse.success(
      res,
      'Quiz created successfully',
      {
        quiz: {
          ...quiz.toObject(),
          id: quiz._id.toString(),
        },
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Update quiz
// @route   PUT /api/admin/quizzes/:id
// @access  Admin
export const adminUpdateQuiz = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const quiz = await Quiz.findByIdAndUpdate(id, req.body, { new: true });
    if (!quiz) {
      throw ApiError.notFound('Quiz not found');
    }

    ApiResponse.success(
      res,
      'Quiz updated successfully',
      {
        quiz: {
          ...quiz.toObject(),
          id: quiz._id.toString(),
        },
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Delete quiz & attempts
// @route   DELETE /api/admin/quizzes/:id
// @access  Admin
export const adminDeleteQuiz = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const quiz = await Quiz.findById(id);
    if (!quiz) throw ApiError.notFound('Quiz not found');

    await Promise.all([
      Quiz.findByIdAndDelete(id),
      QuizAttempt.deleteMany({ quizId: id }),
    ]);

    ApiResponse.success(res, 'Quiz and its attempts deleted', null, 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Publish quiz
// @route   PATCH /api/admin/quizzes/:id/publish
// @access  Admin
export const adminPublishQuiz = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const quiz = await Quiz.findByIdAndUpdate(id, { isPublished: true }, { new: true });
    if (!quiz) throw ApiError.notFound('Quiz not found');

    ApiResponse.success(res, 'Quiz published', { isPublished: true }, 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Unpublish quiz
// @route   PATCH /api/admin/quizzes/:id/unpublish
// @access  Admin
export const adminUnpublishQuiz = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const quiz = await Quiz.findByIdAndUpdate(id, { isPublished: false }, { new: true });
    if (!quiz) throw ApiError.notFound('Quiz not found');

    ApiResponse.success(res, 'Quiz unpublished', { isPublished: false }, 200);
  } catch (error) {
    next(error);
  }
};
