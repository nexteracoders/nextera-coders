import { Request, Response, NextFunction } from 'express';
import { Tutorial } from '../models/tutorial.model';
import { TutorialSubject } from '../models/tutorialSubject.model';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

// @desc    Admin: Get all tutorials (published & drafts)
// @route   GET /api/admin/tutorials
// @access  Admin
export const adminGetTutorials = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const skip = (page - 1) * limit;

    const search = req.query.search as string;
    const category = req.query.category as string;
    const track = req.query.track as string;
    const status = req.query.status as string;

    const query: any = {};

    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { category: { $regex: search.trim(), $options: 'i' } },
        { track: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    if (category && category !== 'All') query.category = category;
    if (track && track !== 'All') query.track = track;
    if (status === 'published') query.isPublished = true;
    if (status === 'draft') query.isPublished = false;

    const [tutorials, totalItems] = await Promise.all([
      Tutorial.find(query)
        .populate('author', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Tutorial.countDocuments(query),
    ]);

    const formatted = tutorials.map((t: any) => ({
      ...t,
      id: t._id.toString(),
      authorName: t.author?.name || 'Admin',
    }));

    ApiResponse.success(
      res,
      'Admin tutorials retrieved',
      {
        tutorials: formatted,
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

// @desc    Admin: Get tutorial by ID
// @route   GET /api/admin/tutorials/:id
// @access  Admin
export const adminGetTutorialById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const tutorial = await Tutorial.findById(id).lean();
    if (!tutorial) {
      throw ApiError.notFound('Tutorial not found');
    }

    ApiResponse.success(
      res,
      'Admin tutorial details retrieved',
      {
        tutorial: {
          ...tutorial,
          id: tutorial._id.toString(),
        },
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Create tutorial (Author automatically set to current admin)
// @route   POST /api/admin/tutorials
// @access  Admin
export const adminCreateTutorial = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const tutorial = await Tutorial.create({
      ...req.body,
      author: user._id,
      publishedAt: req.body.isPublished ? new Date() : undefined,
    });

    ApiResponse.success(
      res,
      'Tutorial created successfully',
      {
        tutorial: {
          ...tutorial.toObject(),
          id: tutorial._id.toString(),
        },
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Update tutorial
// @route   PUT /api/admin/tutorials/:id
// @access  Admin
export const adminUpdateTutorial = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const updateData = { ...req.body };
    if (updateData.isPublished) {
      updateData.publishedAt = new Date();
    }

    const tutorial = await Tutorial.findByIdAndUpdate(id, updateData, { new: true });
    if (!tutorial) {
      throw ApiError.notFound('Tutorial not found');
    }

    ApiResponse.success(
      res,
      'Tutorial updated successfully',
      {
        tutorial: {
          ...tutorial.toObject(),
          id: tutorial._id.toString(),
        },
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Delete tutorial
// @route   DELETE /api/admin/tutorials/:id
// @access  Admin
export const adminDeleteTutorial = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const tutorial = await Tutorial.findByIdAndDelete(id);
    if (!tutorial) throw ApiError.notFound('Tutorial not found');

    ApiResponse.success(res, 'Tutorial deleted successfully', null, 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Publish tutorial
// @route   PATCH /api/admin/tutorials/:id/publish
// @access  Admin
export const adminPublishTutorial = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const tutorial = await Tutorial.findByIdAndUpdate(
      id,
      { isPublished: true, publishedAt: new Date() },
      { new: true }
    );
    if (!tutorial) throw ApiError.notFound('Tutorial not found');

    ApiResponse.success(res, 'Tutorial published', { isPublished: true }, 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Unpublish tutorial
// @route   PATCH /api/admin/tutorials/:id/unpublish
// @access  Admin
export const adminUnpublishTutorial = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const tutorial = await Tutorial.findByIdAndUpdate(id, { isPublished: false }, { new: true });
    if (!tutorial) throw ApiError.notFound('Tutorial not found');

    ApiResponse.success(res, 'Tutorial unpublished', { isPublished: false }, 200);
  } catch (error) {
    next(error);
  }
};

import { ALL_IT_SUBJECTS } from '../scripts/seedTutorialSubjectsAndChapters';

const BASE_SUBJECTS = ALL_IT_SUBJECTS.map((s, idx) => ({
  title: s.title,
  slug: s.slug,
  shortTitle: s.shortTitle,
  category: s.category,
  iconName: s.iconName,
  description: s.description,
  order: idx + 1,
  isPublished: true,
}));

// @desc    Admin: Get all tutorial subjects with chapters count
// @route   GET /api/admin/tutorials/subjects
// @access  Admin
export const adminGetSubjects = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Auto-seed base subjects if collection is empty
    const count = await TutorialSubject.countDocuments();
    if (count === 0) {
      await TutorialSubject.insertMany(BASE_SUBJECTS);
    }

    const { search, category, status } = req.query;
    const query: any = {};

    if (search && typeof search === 'string' && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { shortTitle: { $regex: search.trim(), $options: 'i' } },
        { slug: { $regex: search.trim(), $options: 'i' } },
        { category: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    if (category && category !== 'all' && category !== 'All') {
      query.category = { $regex: String(category).trim(), $options: 'i' };
    }

    if (status === 'published') query.isPublished = true;
    if (status === 'draft') query.isPublished = false;

    const subjects = await TutorialSubject.find(query).sort({ order: 1, createdAt: 1 }).lean();

    // Attach dynamic chapter counts from Tutorial collection
    const subjectsWithCounts = await Promise.all(
      subjects.map(async (subj: any) => {
        const chapterCount = await Tutorial.countDocuments({ track: subj.slug });
        return {
          ...subj,
          id: subj._id.toString(),
          totalChapters: chapterCount,
        };
      })
    );

    ApiResponse.success(
      res,
      'Tutorial subjects retrieved successfully',
      { subjects: subjectsWithCounts },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Create new tutorial subject
// @route   POST /api/admin/tutorials/subjects
// @access  Admin
export const adminCreateSubject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, slug, shortTitle, category, iconName, description, isPublished } = req.body;

    if (!title || !title.trim()) {
      throw ApiError.badRequest('Subject title is required');
    }

    const formattedSlug = (slug || title)
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const existing = await TutorialSubject.findOne({ slug: formattedSlug });
    if (existing) {
      throw ApiError.conflict(`Subject with slug "${formattedSlug}" already exists`);
    }

    const newSubject = await TutorialSubject.create({
      title: title.trim(),
      slug: formattedSlug,
      shortTitle: shortTitle?.trim() || title.trim(),
      category: category?.trim() || 'Core Computer Science',
      iconName: iconName?.trim() || 'BookOpen',
      description: description?.trim() || '',
      isPublished: isPublished !== false,
      order: (await TutorialSubject.countDocuments()) + 1,
    });

    ApiResponse.success(
      res,
      'Subject created successfully',
      {
        subject: {
          ...newSubject.toObject(),
          id: newSubject._id.toString(),
          totalChapters: 0,
        },
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Get subject details by slug with its chapters
// @route   GET /api/admin/tutorials/subjects/:slug
// @access  Admin
export const adminGetSubjectBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { slug } = req.params;
    let subject: any = await TutorialSubject.findOne({ slug: slug.toLowerCase() }).lean();

    // If not found in DB, check if it's one of the base subjects and auto-create it
    if (!subject) {
      const baseSubj = BASE_SUBJECTS.find((b) => b.slug === slug.toLowerCase());
      if (baseSubj) {
        const created = await TutorialSubject.create(baseSubj);
        subject = created.toObject();
      } else {
        throw ApiError.notFound('Subject not found');
      }
    }

    // Fetch all chapters under this subject
    const chapters = await Tutorial.find({ track: subject.slug })
      .sort({ createdAt: 1 })
      .lean();

    ApiResponse.success(
      res,
      'Subject details retrieved successfully',
      {
        subject: {
          ...subject,
          id: subject._id.toString(),
          totalChapters: chapters.length,
        },
        chapters: chapters.map((ch: any) => ({
          ...ch,
          id: ch._id.toString(),
        })),
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Update subject details
// @route   PUT /api/admin/tutorials/subjects/:slug
// @access  Admin
export const adminUpdateSubject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { slug } = req.params;
    const { title, shortTitle, category, iconName, description, isPublished } = req.body;

    const subject = await TutorialSubject.findOneAndUpdate(
      { slug: slug.toLowerCase() },
      {
        ...(title && { title: title.trim() }),
        ...(shortTitle && { shortTitle: shortTitle.trim() }),
        ...(category && { category: category.trim() }),
        ...(iconName && { iconName: iconName.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(isPublished !== undefined && { isPublished }),
      },
      { new: true, upsert: true }
    );

    ApiResponse.success(
      res,
      'Subject updated successfully',
      {
        subject: {
          ...subject.toObject(),
          id: subject._id.toString(),
        },
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Delete subject and its chapters
// @route   DELETE /api/admin/tutorials/subjects/:slug
// @access  Admin
export const adminDeleteSubject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { slug } = req.params;
    const subject = await TutorialSubject.findOneAndDelete({ slug: slug.toLowerCase() });
    if (!subject) throw ApiError.notFound('Subject not found');

    // Delete associated chapters
    await Tutorial.deleteMany({ track: slug.toLowerCase() });

    ApiResponse.success(res, 'Subject and associated chapters deleted successfully', null, 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Toggle publish subject
// @route   PATCH /api/admin/tutorials/subjects/:slug/publish
// @access  Admin
export const adminTogglePublishSubject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { slug } = req.params;
    const subject = await TutorialSubject.findOne({ slug: slug.toLowerCase() });
    if (!subject) throw ApiError.notFound('Subject not found');

    subject.isPublished = !subject.isPublished;
    await subject.save();

    ApiResponse.success(
      res,
      `Subject is now ${subject.isPublished ? 'Published' : 'Draft'}`,
      { isPublished: subject.isPublished },
      200
    );
  } catch (error) {
    next(error);
  }
};
