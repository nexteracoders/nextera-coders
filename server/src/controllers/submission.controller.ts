import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { CodingProblem } from '../models/problem.model';
import { Submission } from '../models/submission.model';
import { codeExecutionService } from '../services/codeExecution/codeExecution.service';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';
import { submissionQueueService } from '../services/submissionQueue.service';

// @desc    Run code for ad-hoc test execution (does NOT mark solved)
// @route   POST /api/code/run
// @access  Protected (Student / User)
export const runCode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { language, code, input } = req.body;

    if (!code || code.trim() === '') {
      throw ApiError.badRequest('Code cannot be empty');
    }

    const result = await codeExecutionService.runCode(language, code, input || '');

    ApiResponse.success(
      res,
      result.status === 'Success' ? 'Code executed successfully' : 'Execution completed with error',
      {
        output: result.output,
        error: result.error,
        executionTime: result.executionTime,
        memory: result.memory,
        status: result.status,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Submit solution against all test cases (including hidden)
// @route   POST /api/submissions
// @access  Protected (Student)
export const submitSolution = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { problemId, language, code } = req.body;
    const user = req.user!;

    if (!Types.ObjectId.isValid(problemId)) {
      throw ApiError.badRequest('Invalid problem ID format');
    }

    const problem = await CodingProblem.findById(problemId);
    if (!problem || !problem.isPublished) {
      throw ApiError.notFound('Problem not found or is unpublished');
    }

    const PLATFORM_SUPPORTED_LANGUAGES = [
      'javascript', 'js', 'typescript', 'ts', 'python', 'python3', 'py',
      'java', 'cpp', 'c++', 'c', 'csharp', 'cs', 'go', 'golang',
      'kotlin', 'kt', 'rust', 'rs', 'php', 'swift', 'ruby', 'rb', 'dart'
    ];

    const problemLangs = (problem.supportedLanguages || []).map((l) => l.toLowerCase());
    const isSupported = problemLangs.includes(language.toLowerCase()) || PLATFORM_SUPPORTED_LANGUAGES.includes(language.toLowerCase());

    if (!isSupported) {
      throw ApiError.badRequest(`Language '${language}' is not supported for this problem`);
    }

    if (!problem.testCases || problem.testCases.length === 0) {
      throw ApiError.internal('Problem has no test cases configured');
    }

    // Save initial submission record with Queued status
    const submission = await Submission.create({
      userId: user._id,
      problemId: problem._id,
      language,
      code,
      status: 'Queued',
      executionTime: 0,
      memory: 0,
      testCasesPassed: 0,
      totalTestCases: problem.testCases.length,
      errorMessage: '',
      submittedAt: new Date(),
    });

    // Enqueue submission into asynchronous worker pipeline
    await submissionQueueService.enqueueSubmission({
      submissionId: submission._id.toString(),
      problemId: problem._id.toString(),
      userId: user._id.toString(),
      language,
      code,
    });

    ApiResponse.success(
      res,
      'Submission queued for evaluation',
      {
        submission: {
          id: submission._id.toString(),
          problemId: problem._id.toString(),
          status: submission.status,
          executionTime: 0,
          memory: 0,
          testCasesPassed: 0,
          totalTestCases: submission.totalTestCases,
          errorMessage: '',
          submittedAt: submission.submittedAt,
          details: [],
        },
      },
      202
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get submission status & evaluated test case details
// @route   GET /api/submissions/:id/status
// @access  Protected (Student)
export const getSubmissionStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;

    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid submission ID format');
    }

    const submission = await Submission.findById(id).lean();
    if (!submission) {
      throw ApiError.notFound('Submission not found');
    }

    if (submission.userId.toString() !== user._id.toString() && user.role !== 'admin') {
      throw ApiError.forbidden('Unauthorized to view this submission');
    }

    ApiResponse.success(
      res,
      `Submission status: ${submission.status}`,
      {
        submission: {
          id: submission._id.toString(),
          problemId: submission.problemId.toString(),
          status: submission.status,
          executionTime: submission.executionTime,
          memory: submission.memory,
          testCasesPassed: submission.testCasesPassed,
          totalTestCases: submission.totalTestCases,
          errorMessage: submission.errorMessage,
          submittedAt: submission.submittedAt,
          details: submission.details || [],
        },
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's past submissions
// @route   GET /api/submissions/my
// @access  Protected (Student)
export const getMySubmissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const skip = (page - 1) * limit;

    const [submissions, totalItems] = await Promise.all([
      Submission.find({ userId: user._id })
        .populate('problemId', 'title slug difficulty category')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Submission.countDocuments({ userId: user._id }),
    ]);

    const enriched = submissions
      .filter((s) => s.problemId)
      .map((s: any) => ({
        id: s._id.toString(),
        problem: {
          id: s.problemId._id.toString(),
          title: s.problemId.title,
          slug: s.problemId.slug,
          difficulty: s.problemId.difficulty,
          category: s.problemId.category,
        },
        language: s.language,
        code: s.code,
        status: s.status,
        executionTime: s.executionTime,
        memory: s.memory,
        testCasesPassed: s.testCasesPassed,
        totalTestCases: s.totalTestCases,
        submittedAt: s.submittedAt,
      }));

    ApiResponse.success(
      res,
      'My submissions retrieved',
      {
        submissions: enriched,
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

// @desc    Get current user's submissions for a specific problem
// @route   GET /api/submissions/problem/:problemId
// @access  Protected (Student)
export const getProblemSubmissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const { problemId } = req.params;

    if (!Types.ObjectId.isValid(problemId)) {
      throw ApiError.badRequest('Invalid problem ID format');
    }

    const submissions = await Submission.find({
      userId: user._id,
      problemId,
    })
      .sort({ submittedAt: -1 })
      .limit(20)
      .lean();

    const formatted = submissions.map((s) => ({
      id: s._id.toString(),
      language: s.language,
      code: s.code,
      status: s.status,
      executionTime: s.executionTime,
      memory: s.memory,
      testCasesPassed: s.testCasesPassed,
      totalTestCases: s.totalTestCases,
      errorMessage: s.errorMessage,
      submittedAt: s.submittedAt,
    }));

    ApiResponse.success(res, 'Problem submissions retrieved', { submissions: formatted }, 200);
  } catch (error) {
    next(error);
  }
};
