import { Request, Response, NextFunction } from 'express';
import { Project } from '../models/project.model';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

// @desc    Admin: Get all projects (published & drafts)
// @route   GET /api/admin/projects
// @access  Admin
export const adminGetProjects = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const skip = (page - 1) * limit;

    const search = req.query.search as string;
    const difficulty = req.query.difficulty as string;
    const status = req.query.status as string;

    const query: any = {};

    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { category: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    if (difficulty && difficulty !== 'All') query.difficulty = difficulty;
    if (status === 'published') query.isPublished = true;
    if (status === 'draft') query.isPublished = false;

    const [projects, totalItems] = await Promise.all([
      Project.find(query).sort({ order: 1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      Project.countDocuments(query),
    ]);

    ApiResponse.success(
      res,
      'Admin projects retrieved',
      {
        projects: projects.map((p) => ({ ...p, id: p._id.toString() })),
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

// @desc    Admin: Get project by ID
// @route   GET /api/admin/projects/:id
// @access  Admin
export const adminGetProjectById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id).lean();
    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    ApiResponse.success(
      res,
      'Admin project details retrieved',
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

// @desc    Admin: Create project
// @route   POST /api/admin/projects
// @access  Admin
export const adminCreateProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const project = await Project.create(req.body);

    ApiResponse.success(
      res,
      'Project created successfully',
      {
        project: {
          ...project.toObject(),
          id: project._id.toString(),
        },
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Update project
// @route   PUT /api/admin/projects/:id
// @access  Admin
export const adminUpdateProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const project = await Project.findByIdAndUpdate(id, req.body, { new: true });
    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    ApiResponse.success(
      res,
      'Project updated successfully',
      {
        project: {
          ...project.toObject(),
          id: project._id.toString(),
        },
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Delete project
// @route   DELETE /api/admin/projects/:id
// @access  Admin
export const adminDeleteProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const project = await Project.findByIdAndDelete(id);
    if (!project) throw ApiError.notFound('Project not found');

    ApiResponse.success(res, 'Project deleted successfully', null, 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Publish project
// @route   PATCH /api/admin/projects/:id/publish
// @access  Admin
export const adminPublishProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const project = await Project.findByIdAndUpdate(id, { isPublished: true }, { new: true });
    if (!project) throw ApiError.notFound('Project not found');

    ApiResponse.success(res, 'Project published', { isPublished: true }, 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Unpublish project
// @route   PATCH /api/admin/projects/:id/unpublish
// @access  Admin
export const adminUnpublishProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const project = await Project.findByIdAndUpdate(id, { isPublished: false }, { new: true });
    if (!project) throw ApiError.notFound('Project not found');

    ApiResponse.success(res, 'Project unpublished', { isPublished: false }, 200);
  } catch (error) {
    next(error);
  }
};
