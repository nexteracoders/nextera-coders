import { Request, Response, NextFunction } from 'express';
import { CodingProblem } from '../models/problem.model';
import { Submission } from '../models/submission.model';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

// @desc    Get published coding problems with search, filters & user status
// @route   GET /api/problems
// @access  Public
export const getProblems = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 15;
    const skip = (page - 1) * limit;

    const search = req.query.search as string;
    const category = req.query.category as string;
    const difficulty = req.query.difficulty as string;
    const language = req.query.language as string;
    const statusFilter = req.query.status as string; // 'solved' | 'attempted' | 'unsolved' | 'all'
    const sort = (req.query.sort as string) || 'order';

    const query: any = { isPublished: true };

    if (search && search.trim()) {
      const trimmed = search.trim();
      const parsedNum = parseInt(trimmed.replace(/^#/, ''), 10);
      const orConditions: any[] = [
        { title: { $regex: trimmed, $options: 'i' } },
        { description: { $regex: trimmed, $options: 'i' } },
      ];
      if (!isNaN(parsedNum) && parsedNum > 0) {
        orConditions.push({ order: parsedNum });
      }
      query.$or = orConditions;
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (difficulty && difficulty !== 'All') {
      query.difficulty = difficulty;
    }

    if (language && language !== 'All') {
      query.supportedLanguages = language.toLowerCase();
    }

    let sortCriteria: any = { order: 1, createdAt: 1 };
    if (sort === 'newest') sortCriteria = { createdAt: -1 };
    if (sort === 'title') sortCriteria = { title: 1 };
    if (sort === 'difficulty') sortCriteria = { difficulty: 1 };

    // Fetch user submission statuses if student is logged in (using index-backed distinct scan)
    let userSolvedSet = new Set<string>();
    let userAttemptedSet = new Set<string>();

    if (req.user) {
      const [solvedIds, attemptedIds] = await Promise.all([
        Submission.distinct('problemId', { userId: req.user._id, status: 'Accepted' }),
        Submission.distinct('problemId', { userId: req.user._id }),
      ]);
      userSolvedSet = new Set(solvedIds.map((id) => id.toString()));
      userAttemptedSet = new Set(attemptedIds.map((id) => id.toString()));
    }

    const [problems, totalItems] = await Promise.all([
      CodingProblem.find(query)
        .select('-testCases -solution')
        .sort(sortCriteria)
        .skip(skip)
        .limit(limit)
        .lean(),
      CodingProblem.countDocuments(query),
    ]);

    let enriched = problems.map((p) => {
      const pId = p._id.toString();
      const isSolved = userSolvedSet.has(pId);
      const isAttempted = !isSolved && userAttemptedSet.has(pId);

      return {
        id: pId,
        title: p.title,
        slug: p.slug,
        order: p.order !== undefined ? p.order : 0,
        difficulty: p.difficulty,
        category: p.category,
        youtubeUrl: p.youtubeUrl || '',
        supportedLanguages: p.supportedLanguages,
        expectedComplexity: p.expectedComplexity,
        acceptanceRate: p.acceptanceRate ?? (p.totalSubmissions ? Math.round(((p.totalAccepted || 0) / p.totalSubmissions) * 100) : 0),
        totalSubmissions: p.totalSubmissions || 0,
        companies: p.companies || [],
        submissionsCount: p.submissionsCount || (p.totalSubmissions ? `${Math.round(p.totalSubmissions / 1000)}K+` : '10K+'),
        accuracy: p.accuracy || (p.totalSubmissions ? `${Math.round(((p.totalAccepted || 0) / p.totalSubmissions) * 100)}%` : '50.00%'),
        status: isSolved ? 'Solved' : isAttempted ? 'Attempted' : 'Unsolved',
        createdAt: p.createdAt,
      };
    });

    // Apply status filter if requested by student
    if (statusFilter && statusFilter !== 'all') {
      const targetStatus = statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1).toLowerCase();
      enriched = enriched.filter((p) => p.status.toLowerCase() === targetStatus.toLowerCase());
    }

    ApiResponse.success(
      res,
      'Problems retrieved successfully',
      {
        problems: enriched,
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

// @desc    Get single problem by slug (Sanitized: NO hidden test cases, NO solutions)
// @route   GET /api/problems/:slug
// @access  Public
export const getProblemBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { slug } = req.params;
    const rawSlug = decodeURIComponent(slug || '').trim();
    const normalizedSlug = rawSlug.toLowerCase().replace(/\s+/g, '-');
    const spaceSlug = rawSlug.toLowerCase().replace(/-/g, ' ');

    const problem = await CodingProblem.findOne({
      $or: [
        { slug: rawSlug },
        { slug: normalizedSlug },
        { slug: spaceSlug },
        { title: { $regex: new RegExp(`^${rawSlug.replace(/[-_]/g, ' ')}$`, 'i') } },
      ],
      isPublished: true,
    }).lean();

    if (!problem) {
      throw ApiError.notFound('Problem not found or is unpublished');
    }

    // Only return safe public test cases
    const publicTestCases = (problem.testCases || [])
      .filter((tc) => !tc.hidden)
      .map((tc) => ({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
      }));

    let isSolved = false;
    let isAttempted = false;

    if (req.user) {
      const submissions = await Submission.find({
        userId: req.user._id,
        problemId: problem._id,
      })
        .select('status')
        .lean();

      isSolved = submissions.some((s) => s.status === 'Accepted');
      isAttempted = !isSolved && submissions.length > 0;
    }

    ApiResponse.success(
      res,
      'Problem details retrieved',
      {
        problem: {
          id: problem._id.toString(),
          title: problem.title,
          slug: problem.slug,
          order: problem.order !== undefined ? problem.order : 0,
          description: problem.description,
          difficulty: problem.difficulty,
          category: problem.category,
          youtubeUrl: problem.youtubeUrl || '',
          constraints: problem.constraints,
          examples: problem.examples,
          hints: problem.hints,
          starterCode: problem.starterCode,
          supportedLanguages: problem.supportedLanguages,
          expectedComplexity: problem.expectedComplexity,
          sampleTestCases: publicTestCases,
          companies: problem.companies || [],
          submissionsCount: problem.submissionsCount || (problem.totalSubmissions ? `${Math.round(problem.totalSubmissions / 1000)}K+` : '150K+'),
          accuracy: problem.accuracy || (problem.totalSubmissions ? `${Math.round(((problem.totalAccepted || 0) / problem.totalSubmissions) * 100)}%` : '58.62%'),
          acceptanceRate: problem.totalSubmissions
            ? Math.round(((problem.totalAccepted || 0) / problem.totalSubmissions) * 100)
            : 0,
          totalSubmissions: problem.totalSubmissions || 0,
          isSolved,
          isAttempted,
          createdAt: problem.createdAt,
        },
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get all distinct categories with counts
// @route   GET /api/problems/categories
// @access  Public
export const getProblemCategories = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categories = await CodingProblem.aggregate([
      { $match: { isPublished: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          easyCount: { $sum: { $cond: [{ $eq: ['$difficulty', 'Easy'] }, 1, 0] } },
          mediumCount: { $sum: { $cond: [{ $eq: ['$difficulty', 'Medium'] }, 1, 0] } },
          hardCount: { $sum: { $cond: [{ $eq: ['$difficulty', 'Hard'] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    ApiResponse.success(
      res,
      'Problem categories retrieved',
      {
        categories: categories.map((c) => ({
          category: c._id,
          totalProblems: c.count,
          easyCount: c.easyCount,
          mediumCount: c.mediumCount,
          hardCount: c.hardCount,
        })),
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get aggregated DSA roadmap stats
// @route   GET /api/problems/dsa/stats
// @access  Public (Enhanced if authenticated)
export const getDSAStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [totalProblems, easyCount, mediumCount, hardCount, categories] = await Promise.all([
      CodingProblem.countDocuments({ isPublished: true }),
      CodingProblem.countDocuments({ isPublished: true, difficulty: 'Easy' }),
      CodingProblem.countDocuments({ isPublished: true, difficulty: 'Medium' }),
      CodingProblem.countDocuments({ isPublished: true, difficulty: 'Hard' }),
      CodingProblem.aggregate([
        { $match: { isPublished: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    let solvedCount = 0;
    let attemptedCount = 0;
    let easySolved = 0;
    let mediumSolved = 0;
    let hardSolved = 0;

    if (req.user) {
      const acceptedSubmissions = await Submission.find({
        userId: req.user._id,
        status: 'Accepted',
      })
        .populate('problemId', 'difficulty')
        .lean();

      const uniqueSolvedIds = new Set<string>();
      for (const s of acceptedSubmissions) {
        if (s.problemId) {
          const p = s.problemId as any;
          const id = p._id.toString();
          if (!uniqueSolvedIds.has(id)) {
            uniqueSolvedIds.add(id);
            if (p.difficulty === 'Easy') easySolved++;
            if (p.difficulty === 'Medium') mediumSolved++;
            if (p.difficulty === 'Hard') hardSolved++;
          }
        }
      }

      solvedCount = uniqueSolvedIds.size;

      const allUserSubmissions = await Submission.find({ userId: req.user._id }).distinct('problemId');
      attemptedCount = Math.max(0, allUserSubmissions.length - solvedCount);
    }

    ApiResponse.success(
      res,
      'DSA roadmap statistics retrieved',
      {
        totalProblems,
        difficulty: {
          easy: { total: easyCount, solved: easySolved },
          medium: { total: mediumCount, solved: mediumSolved },
          hard: { total: hardCount, solved: hardSolved },
        },
        userProgress: {
          solved: solvedCount,
          attempted: attemptedCount,
          unsolved: Math.max(0, totalProblems - solvedCount - attemptedCount),
        },
        categories: categories.map((c) => ({
          name: c._id,
          count: c.count,
        })),
      },
      200
    );
  } catch (error) {
    next(error);
  }
};
