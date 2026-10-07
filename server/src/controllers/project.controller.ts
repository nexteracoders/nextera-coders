import { Request, Response, NextFunction } from 'express';
import { Project } from '../models/project.model';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

// @desc    Get published projects with search & filters
// @route   GET /api/projects
// @access  Public
export const getProjects = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 12;
    const skip = (page - 1) * limit;

    const search = req.query.search as string;
    const category = req.query.category as string;
    const difficulty = req.query.difficulty as string;

    const query: any = { isPublished: true };

    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { technologies: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (difficulty && difficulty !== 'All') {
      query.difficulty = difficulty;
    }

    const [projects, totalItems] = await Promise.all([
      Project.find(query)
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Project.countDocuments(query),
    ]);

    const formatted = projects.map((p) => ({
      ...p,
      id: p._id.toString(),
    }));

    ApiResponse.success(
      res,
      'Projects retrieved successfully',
      {
        projects: formatted,
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

// @desc    Get single project by slug
// @route   GET /api/projects/:slug
// @access  Public
export const getProjectBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { slug } = req.params;

    const project = await Project.findOne({ slug, isPublished: true }).lean();
    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    ApiResponse.success(
      res,
      'Project details retrieved',
      {
        project: {
          ...project,
          id: project._id.toString(),
        },
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get project categories with counts
// @route   GET /api/projects/categories
// @access  Public
export const getProjectCategories = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categories = await Project.aggregate([
      { $match: { isPublished: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    ApiResponse.success(
      res,
      'Project categories retrieved',
      {
        categories: categories.map((c) => ({
          category: c._id,
          count: c.count,
        })),
      },
      200
    );
  } catch (error) {
    next(error);
  }
};
