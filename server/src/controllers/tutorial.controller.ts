import { Request, Response, NextFunction } from 'express';
import { Tutorial } from '../models/tutorial.model';
import { TutorialSubject } from '../models/tutorialSubject.model';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

// @desc    Get published tutorials with search & filter
// @route   GET /api/tutorials
// @access  Public
export const getTutorials = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 12;
    const skip = (page - 1) * limit;

    const search = req.query.search as string;
    const category = req.query.category as string;
    const track = req.query.track as string;
    const tag = req.query.tag as string;
    const type = req.query.type as string;

    const query: any = { isPublished: true };

    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { excerpt: { $regex: search.trim(), $options: 'i' } },
        { tags: { $regex: search.trim(), $options: 'i' } },
        { track: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (track && track !== 'All') {
      query.track = track;
    }

    if (tag) {
      query.tags = tag;
    }

    if (type === 'video') {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { type: 'video' },
          { type: 'both' },
          { videoUrl: { $exists: true, $nin: ['', null] } },
        ],
      });
    } else if (type === 'article') {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { type: 'article' },
          { type: 'both' },
          { videoUrl: { $in: ['', null] } },
        ],
      });
    }

    const includeContent = req.query.includeContent === 'true';
    const sortOption: any = req.query.track || includeContent
      ? { order: 1, createdAt: 1 }
      : { publishedAt: -1, createdAt: -1 };

    let findQuery = Tutorial.find(query)
      .populate('author', 'name profileImage')
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    if (!includeContent) {
      findQuery = findQuery.select('-content') as any;
    }

    const [tutorials, totalItems] = await Promise.all([
      findQuery.lean(),
      Tutorial.countDocuments(query),
    ]);

    const formatted = tutorials.map((t: any) => ({
      ...t,
      id: t._id.toString(),
      author: t.author
        ? { id: t.author._id.toString(), name: t.author.name, profileImage: t.author.profileImage }
        : { name: 'NextEra Staff' },
    }));

    ApiResponse.success(
      res,
      'Tutorials retrieved successfully',
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

// @desc    Get tutorial by slug with related tutorials
// @route   GET /api/tutorials/:slug
// @access  Public
export const getTutorialBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { slug } = req.params;

    const tutorial = await Tutorial.findOne({ slug, isPublished: true })
      .populate('author', 'name bio profileImage role')
      .lean();

    if (!tutorial) {
      throw ApiError.notFound('Tutorial not found or is unpublished');
    }

    // Increment views asynchronously
    Tutorial.findByIdAndUpdate(tutorial._id, { $inc: { views: 1 } }).exec();

    // Fetch related tutorials in same category or matching tags
    const related = await Tutorial.find({
      _id: { $ne: tutorial._id },
      isPublished: true,
      $or: [{ category: tutorial.category }, { tags: { $in: tutorial.tags } }],
    })
      .populate('author', 'name')
      .select('title slug excerpt thumbnail category readingTime publishedAt')
      .limit(3)
      .lean();

    ApiResponse.success(
      res,
      'Tutorial details retrieved',
      {
        tutorial: {
          ...tutorial,
          id: tutorial._id.toString(),
          author: tutorial.author
            ? {
                id: (tutorial.author as any)._id.toString(),
                name: (tutorial.author as any).name,
                bio: (tutorial.author as any).bio,
                role: (tutorial.author as any).role,
                profileImage: (tutorial.author as any).profileImage,
              }
            : { name: 'NextEra Staff', role: 'Staff Educator' },
        },
        relatedTutorials: related.map((r: any) => ({
          ...r,
          id: r._id.toString(),
          authorName: r.author?.name || 'NextEra Staff',
        })),
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get all distinct tutorial tracks/subjects with chapter counts and categories
// @route   GET /api/tutorials/tracks
// @access  Public
export const getTutorialTracks = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tracksAgg = await Tutorial.aggregate([
      { $match: { isPublished: true, track: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$track',
          category: { $first: '$category' },
          totalChapters: { $sum: 1 },
          sections: { $addToSet: '$sectionTitle' },
          latestUpdated: { $max: '$updatedAt' },
        },
      },
      { $sort: { totalChapters: -1, _id: 1 } },
    ]);

    ApiResponse.success(
      res,
      'Tutorial tracks retrieved',
      {
        tracks: tracksAgg.map((t) => ({
          trackId: t._id,
          category: t.category,
          chapterCount: t.totalChapters,
          sections: (t.sections || []).filter(Boolean),
          latestUpdated: t.latestUpdated,
        })),
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get tutorial categories with counts
// @route   GET /api/tutorials/categories
// @access  Public
export const getTutorialCategories = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categories = await Tutorial.aggregate([
      { $match: { isPublished: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    ApiResponse.success(
      res,
      'Tutorial categories retrieved',
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

// @desc    Get published tutorial subjects
// @route   GET /api/tutorials/subjects
// @access  Public
export const getTutorialSubjects = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const subjects = await TutorialSubject.find({ isPublished: true })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    const subjectsWithCounts = await Promise.all(
      subjects.map(async (subj: any) => {
        const chapterCount = await Tutorial.countDocuments({ track: subj.slug, isPublished: true });
        return {
          ...subj,
          id: subj._id.toString(),
          totalChapters: chapterCount,
        };
      })
    );

    ApiResponse.success(
      res,
      'Tutorial subjects retrieved',
      { subjects: subjectsWithCounts },
      200
    );
  } catch (error) {
    next(error);
  }
};
