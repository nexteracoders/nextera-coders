import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { ProblemList, IProblemList } from '../models/problemList.model';
import { ApiError } from '../utils/apiError';

// 3 Core Default Preset Lists
const DEFAULT_PRESET_LISTS = [
  {
    name: 'Favorites',
    slug: 'favorites',
    description: 'Favorite algorithms & key DSA patterns for quick recall',
    icon: 'Star',
    color: '#f59e0b',
    listType: 'favorites' as const,
    isDefault: true,
  },
  {
    name: 'Revise Later',
    slug: 'revise-later',
    description: 'Questions to review before upcoming technical interviews',
    icon: 'Bookmark',
    color: '#3b82f6',
    listType: 'revise_later' as const,
    isDefault: true,
  },
  {
    name: 'Hard Questions',
    slug: 'hard-questions',
    description: 'Challenging questions requiring repeated practice and deep study',
    icon: 'Flame',
    color: '#ef4444',
    listType: 'hard_questions' as const,
    isDefault: true,
  },
];

/**
 * Helper: Ensures the 3 default preset lists exist for a user
 */
async function ensureDefaultListsExist(userId: Types.ObjectId): Promise<IProblemList[]> {
  const existing = await ProblemList.find({ userId }).sort({ isDefault: -1, createdAt: 1 });
  const existingSlugs = new Set(existing.map((l) => l.slug));

  const missing = DEFAULT_PRESET_LISTS.filter((def) => !existingSlugs.has(def.slug));

  if (missing.length > 0) {
    const toInsert = missing.map((item) => ({
      userId,
      name: item.name,
      slug: item.slug,
      description: item.description,
      icon: item.icon,
      color: item.color,
      isDefault: true,
      listType: item.listType,
      problems: [],
    }));
    await ProblemList.insertMany(toInsert);
    return await ProblemList.find({ userId }).sort({ isDefault: -1, createdAt: 1 });
  }

  return existing;
}

/**
 * GET /api/problem-lists
 * Fetches all problem lists (built-in presets + custom) for authenticated user
 */
export async function getMyProblemLists(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!._id;
    const lists = await ensureDefaultListsExist(userId);

    res.status(200).json({
      success: true,
      data: lists,
      total: lists.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/problem-lists
 * Creates a custom problem list
 */
export async function createProblemList(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!._id;
    const { name, description, color, icon } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw ApiError.badRequest('List name is required');
    }

    const trimmedName = name.trim();
    const slug = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Check duplicate name for user
    const existing = await ProblemList.findOne({ userId, name: trimmedName });
    if (existing) {
      throw ApiError.conflict(`A list named "${trimmedName}" already exists.`);
    }

    const newList = await ProblemList.create({
      userId,
      name: trimmedName,
      slug: slug || `list-${Date.now()}`,
      description: (description || '').trim(),
      icon: icon || 'Folder',
      color: color || '#8b5cf6',
      isDefault: false,
      listType: 'custom',
      problems: [],
    });

    res.status(201).json({
      success: true,
      message: `List "${newList.name}" created successfully`,
      data: newList,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/problem-lists/:id
 * Updates name, description, icon or color of a list
 */
export async function updateProblemList(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!._id;
    const { id } = req.params;
    const { name, description, color, icon } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid problem list ID');
    }

    const list = await ProblemList.findOne({ _id: id, userId });
    if (!list) {
      throw ApiError.notFound('Problem list not found');
    }

    if (name && typeof name === 'string') {
      const trimmedName = name.trim();
      if (!list.isDefault) {
        list.name = trimmedName;
        list.slug = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
    }

    if (description !== undefined) {
      list.description = (description || '').trim();
    }
    if (color) {
      list.color = color;
    }
    if (icon) {
      list.icon = icon;
    }

    await list.save();

    res.status(200).json({
      success: true,
      message: 'Problem list updated successfully',
      data: list,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/problem-lists/:id
 * Deletes a custom problem list (default presets cannot be deleted)
 */
export async function deleteProblemList(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!._id;
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid problem list ID');
    }

    const list = await ProblemList.findOne({ _id: id, userId });
    if (!list) {
      throw ApiError.notFound('Problem list not found');
    }

    if (list.isDefault) {
      throw ApiError.badRequest('Default system lists ("Favorites", "Revise Later", "Hard Questions") cannot be deleted.');
    }

    await ProblemList.deleteOne({ _id: id, userId });

    res.status(200).json({
      success: true,
      message: `List "${list.name}" deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/problem-lists/toggle
 * Atomically adds or removes a problem across a set of target lists
 * Body: { problemSlug, problemTitle, difficulty, category, targetListIds: string[] }
 */
export async function toggleProblemInLists(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!._id;
    const { problemSlug, problemTitle, difficulty, category, targetListIds } = req.body;

    if (!problemSlug || typeof problemSlug !== 'string') {
      throw ApiError.badRequest('problemSlug is required');
    }

    const cleanSlug = problemSlug.trim().toLowerCase();
    const title = (problemTitle || cleanSlug).trim();
    const targetSet = new Set<string>((Array.isArray(targetListIds) ? targetListIds : []).map(String));

    // Fetch all user's lists
    const lists = await ensureDefaultListsExist(userId);

    for (const list of lists) {
      const listIdStr = list._id.toString();
      const isTarget = targetSet.has(listIdStr);
      const existingIdx = list.problems.findIndex((p) => p.problemSlug === cleanSlug);

      if (isTarget && existingIdx === -1) {
        // Add to list
        list.problems.push({
          problemSlug: cleanSlug,
          problemTitle: title,
          difficulty: difficulty || 'Medium',
          category: category || 'Algorithms',
          addedAt: new Date(),
          notes: '',
        });
        await list.save();
      } else if (!isTarget && existingIdx !== -1) {
        // Remove from list
        list.problems.splice(existingIdx, 1);
        await list.save();
      }
    }

    // Return fresh state of user's lists and which lists contain this problem
    const updatedLists = await ProblemList.find({ userId }).sort({ isDefault: -1, createdAt: 1 });
    const containingListIds = updatedLists
      .filter((l) => l.problems.some((p) => p.problemSlug === cleanSlug))
      .map((l) => l._id.toString());

    res.status(200).json({
      success: true,
      message: 'Problem bookmarks updated successfully',
      data: {
        containingListIds,
        lists: updatedLists,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/problem-lists/status/:slug
 * Returns list IDs containing the given problem slug
 */
export async function getProblemBookmarkStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!._id;
    const { slug } = req.params;

    if (!slug) {
      throw ApiError.badRequest('Problem slug is required');
    }

    const cleanSlug = slug.trim().toLowerCase();
    const lists = await ensureDefaultListsExist(userId);

    const containingListIds = lists
      .filter((l) => l.problems.some((p) => p.problemSlug === cleanSlug))
      .map((l) => l._id.toString());

    res.status(200).json({
      success: true,
      data: {
        problemSlug: cleanSlug,
        containingListIds,
        lists: lists.map((l) => ({
          _id: l._id,
          name: l.name,
          slug: l.slug,
          icon: l.icon,
          color: l.color,
          isDefault: l.isDefault,
          listType: l.listType,
          totalProblems: l.problems.length,
          containsProblem: l.problems.some((p) => p.problemSlug === cleanSlug),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/problem-lists/:id/problems/:problemSlug
 * Removes a specific problem from a specific list
 */
export async function removeProblemFromList(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!._id;
    const { id, problemSlug } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid problem list ID');
    }

    const list = await ProblemList.findOne({ _id: id, userId });
    if (!list) {
      throw ApiError.notFound('Problem list not found');
    }

    const cleanSlug = problemSlug.trim().toLowerCase();
    const prevCount = list.problems.length;
    list.problems = list.problems.filter((p) => p.problemSlug !== cleanSlug);

    if (list.problems.length !== prevCount) {
      await list.save();
    }

    res.status(200).json({
      success: true,
      message: 'Problem removed from list successfully',
      data: list,
    });
  } catch (error) {
    next(error);
  }
}
