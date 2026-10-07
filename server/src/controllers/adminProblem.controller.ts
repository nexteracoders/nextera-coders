import { Request, Response, NextFunction } from 'express';
import { CodingProblem } from '../models/problem.model';
import { Submission } from '../models/submission.model';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';
import { problemAiGeneratorService } from '../services/problemAiGenerator.service';

// @desc    Admin: Get all coding problems (published & drafts)
// @route   GET /api/admin/problems
// @access  Admin
export const adminGetProblems = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const skip = (page - 1) * limit;

    const search = req.query.search as string;
    const difficulty = req.query.difficulty as string;
    const category = req.query.category as string;
    const status = req.query.status as string; // 'published' | 'draft'

    const query: any = {};

    if (search && search.trim()) {
      const trimmed = search.trim();
      const parsedNum = parseInt(trimmed.replace(/^#/, ''), 10);
      const orConditions: any[] = [
        { title: { $regex: trimmed, $options: 'i' } },
        { slug: { $regex: trimmed, $options: 'i' } },
        { category: { $regex: trimmed, $options: 'i' } },
      ];
      if (!isNaN(parsedNum) && parsedNum > 0) {
        orConditions.push({ order: parsedNum });
      }
      query.$or = orConditions;
    }

    if (difficulty && difficulty !== 'All') query.difficulty = difficulty;
    if (category && category !== 'All') query.category = category;
    if (status === 'published') query.isPublished = true;
    if (status === 'draft') query.isPublished = false;

    const [problems, totalItems] = await Promise.all([
      CodingProblem.find(query).sort({ order: 1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      CodingProblem.countDocuments(query),
    ]);

    const formatted = problems.map((p) => ({
      ...p,
      id: p._id.toString(),
      order: p.order !== undefined ? p.order : 0,
      testCasesCount: p.testCases?.length || 0,
      hiddenTestCasesCount: p.testCases?.filter((t) => t.hidden).length || 0,
    }));

    ApiResponse.success(
      res,
      'Admin problems retrieved',
      {
        problems: formatted,
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

// @desc    Admin: Get problem by ID with full details (including hidden tests and solution)
// @route   GET /api/admin/problems/:id
// @access  Admin
export const adminGetProblemById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const problem = await CodingProblem.findById(id).lean();
    if (!problem) {
      throw ApiError.notFound('Problem not found');
    }

    ApiResponse.success(
      res,
      'Admin problem details retrieved',
      {
        problem: {
          ...problem,
          id: problem._id.toString(),
        },
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Get next recommended problem serial number / order
// @route   GET /api/admin/problems/next-order
// @access  Admin
export const adminGetNextProblemOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { category } = req.query;

    const [highestGlobal, totalCount] = await Promise.all([
      CodingProblem.findOne().sort({ order: -1 }).select('order').lean(),
      CodingProblem.countDocuments(),
    ]);

    const nextGlobalOrder = Math.max((highestGlobal?.order || 0) + 1, totalCount + 1);

    let nextCategoryOrder = nextGlobalOrder;
    if (category && category !== 'All') {
      const highestCat = await CodingProblem.findOne({ category: String(category) })
        .sort({ order: -1 })
        .select('order')
        .lean();
      if (highestCat?.order) {
        nextCategoryOrder = highestCat.order + 1;
      }
    }

    ApiResponse.success(
      res,
      'Next problem serial number calculated',
      {
        nextOrder: nextGlobalOrder,
        suggestedOrder: nextGlobalOrder,
        nextCategoryOrder,
        totalProblems: totalCount,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Create new problem
// @route   POST /api/admin/problems
// @access  Admin
export const adminCreateProblem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.body.slug && req.body.title) {
      req.body.slug = req.body.title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    const desiredOrder = req.body.order ? Number(req.body.order) : 0;
    if (desiredOrder <= 0) {
      const highestProblem = await CodingProblem.findOne().sort({ order: -1 }).select('order').lean();
      req.body.order = (highestProblem?.order || 0) + 1;
    } else {
      // Check if another problem already has this order
      const existing = await CodingProblem.findOne({ order: desiredOrder }).select('_id').lean();
      if (existing) {
        // Shift all problems with order >= desiredOrder by +1 to guarantee 100% uniqueness
        await CodingProblem.updateMany({ order: { $gte: desiredOrder } }, { $inc: { order: 1 } });
      }
      req.body.order = desiredOrder;
    }

    const problem = await CodingProblem.create(req.body);

    ApiResponse.success(
      res,
      'Problem created successfully',
      {
        problem: {
          ...problem.toObject(),
          id: problem._id.toString(),
          order: problem.order,
        },
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Update problem
// @route   PUT /api/admin/problems/:id
// @access  Admin
export const adminUpdateProblem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    if (req.body.order !== undefined) {
      const newOrder = Number(req.body.order);
      const currentProblem = await CodingProblem.findById(id).select('order').lean();
      if (!currentProblem) {
        throw ApiError.notFound('Problem not found');
      }

      const currentOrder = currentProblem.order;
      if (newOrder > 0 && newOrder !== currentOrder) {
        // Check if collision with another problem
        const collision = await CodingProblem.findOne({ order: newOrder, _id: { $ne: id } }).select('_id').lean();
        if (collision) {
          if (newOrder < currentOrder) {
            // Shift items in range [newOrder, currentOrder - 1] up by 1
            await CodingProblem.updateMany(
              { order: { $gte: newOrder, $lt: currentOrder }, _id: { $ne: id } },
              { $inc: { order: 1 } }
            );
          } else {
            // Shift items in range [currentOrder + 1, newOrder] down by 1
            await CodingProblem.updateMany(
              { order: { $gt: currentOrder, $lte: newOrder }, _id: { $ne: id } },
              { $inc: { order: -1 } }
            );
          }
        }
        req.body.order = newOrder;
      }
    }

    const problem = await CodingProblem.findByIdAndUpdate(id, req.body, { new: true });
    if (!problem) {
      throw ApiError.notFound('Problem not found');
    }

    ApiResponse.success(
      res,
      'Problem updated successfully',
      {
        problem: {
          ...problem.toObject(),
          id: problem._id.toString(),
          order: problem.order,
        },
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Delete problem and related submissions
// @route   DELETE /api/admin/problems/:id
// @access  Admin
export const adminDeleteProblem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const problem = await CodingProblem.findById(id);
    if (!problem) {
      throw ApiError.notFound('Problem not found');
    }

    await Promise.all([
      CodingProblem.findByIdAndDelete(id),
      Submission.deleteMany({ problemId: id }),
    ]);

    ApiResponse.success(res, 'Problem and associated submissions deleted', null, 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Publish problem
// @route   PATCH /api/admin/problems/:id/publish
// @access  Admin
export const adminPublishProblem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const problem = await CodingProblem.findByIdAndUpdate(id, { isPublished: true }, { new: true });
    if (!problem) throw ApiError.notFound('Problem not found');

    ApiResponse.success(res, 'Problem published', { isPublished: true }, 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Unpublish problem
// @route   PATCH /api/admin/problems/:id/unpublish
// @access  Admin
export const adminUnpublishProblem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const problem = await CodingProblem.findByIdAndUpdate(id, { isPublished: false }, { new: true });
    if (!problem) throw ApiError.notFound('Problem not found');

    ApiResponse.success(res, 'Problem moved to draft', { isPublished: false }, 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Generate problem with AI from Topic Name or Problem Title
// @route   POST /api/admin/problems/generate-ai
// @access  Admin
export const adminGenerateProblemAi = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { titleOrUrl, difficulty, category } = req.body;
    if (!titleOrUrl || typeof titleOrUrl !== 'string' || !titleOrUrl.trim()) {
      throw ApiError.badRequest('Problem title or topic name is required');
    }

    const generated = await problemAiGeneratorService.generateProblem({
      titleOrUrl: titleOrUrl.trim(),
      difficulty,
      category,
    });

    ApiResponse.success(res, 'Problem generated successfully', { problem: generated }, 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Bulk import problems (from JSON array or LeetCode batches)
// @route   POST /api/admin/problems/bulk-import
// @access  Admin
export const adminBulkImportProblems = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { problems } = req.body;
    if (!Array.isArray(problems) || problems.length === 0) {
      throw ApiError.badRequest('An array of problems is required');
    }

    const results: any[] = [];
    const errors: Array<{ index: number; title?: string; error: string }> = [];

    for (let i = 0; i < problems.length; i++) {
      const raw = problems[i];
      try {
        if (!raw.title || typeof raw.title !== 'string') {
          throw new Error('Title is required');
        }

        // Generate or clean slug
        let slug = raw.slug
          ? raw.slug.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
          : raw.title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');

        if (!slug) {
          slug = `problem-${Date.now()}-${i}`;
        }

        // Ensure unique slug
        let uniqueSlug = slug;
        let counter = 1;
        while (await CodingProblem.exists({ slug: uniqueSlug })) {
          uniqueSlug = `${slug}-${counter++}`;
        }

        const problemData = {
          title: raw.title.trim(),
          slug: uniqueSlug,
          description: raw.description || `Problem statement for ${raw.title}`,
          difficulty: ['Easy', 'Medium', 'Hard'].includes(raw.difficulty) ? raw.difficulty : 'Medium',
          category: raw.category || 'Algorithms',
          youtubeUrl: raw.youtubeUrl || '',
          constraints: Array.isArray(raw.constraints) ? raw.constraints : [],
          examples: Array.isArray(raw.examples) && raw.examples.length ? raw.examples : [
            { input: 'Sample Input', output: 'Sample Output', explanation: '' },
          ],
          hints: Array.isArray(raw.hints) ? raw.hints : [],
          testCases: Array.isArray(raw.testCases) && raw.testCases.length ? raw.testCases : [
            { input: '1', expectedOutput: '1', hidden: false },
            { input: '10', expectedOutput: '10', hidden: true },
          ],
          starterCode: {
            javascript: raw.starterCode?.javascript || '',
            typescript: raw.starterCode?.typescript || '',
            python: raw.starterCode?.python || '',
            java: raw.starterCode?.java || '',
            cpp: raw.starterCode?.cpp || '',
            c: raw.starterCode?.c || '',
            csharp: raw.starterCode?.csharp || '',
          },
          solution: raw.solution || '',
          supportedLanguages: raw.supportedLanguages || ['javascript', 'typescript', 'python', 'java', 'cpp', 'c', 'csharp'],
          expectedComplexity: raw.expectedComplexity || { time: 'O(n)', space: 'O(1)' },
          companies: Array.isArray(raw.companies) ? raw.companies : [],
          isPublished: raw.isPublished !== undefined ? raw.isPublished : true,
          order: typeof raw.order === 'number' ? raw.order : 0,
        };

        const created = await CodingProblem.create(problemData);
        results.push({
          id: created._id.toString(),
          title: created.title,
          slug: created.slug,
          difficulty: created.difficulty,
        });
      } catch (err: any) {
        errors.push({
          index: i,
          title: raw?.title || `Item ${i}`,
          error: err.message || 'Validation or database error',
        });
      }
    }

    ApiResponse.success(
      res,
      `Imported ${results.length} problems successfully (${errors.length} failed)`,
      {
        importedCount: results.length,
        failedCount: errors.length,
        importedProblems: results,
        errors,
      },
      results.length > 0 ? 201 : 400
    );
  } catch (error) {
    next(error);
  }
};
