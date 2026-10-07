import { Request, Response, NextFunction } from 'express';
import { FooterLink } from '../models/footerLink.model';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';

export const DEFAULT_FOOTER_LINKS = [
  // Company
  {
    column: 'company',
    columnTitle: 'Company',
    title: 'About NextEra',
    url: '/about',
    order: 1,
    isActive: true,
    isExternal: false,
  },
  {
    column: 'company',
    columnTitle: 'Company',
    title: 'Careers',
    url: '/careers',
    badge: 'Hiring',
    badgeType: 'amber',
    order: 2,
    isActive: true,
    isExternal: false,
  },
  {
    column: 'company',
    columnTitle: 'Company',
    title: 'Pro One VIP',
    url: '/pro-one',
    badge: 'VIP',
    badgeType: 'purple',
    order: 3,
    isActive: true,
    isExternal: false,
  },
  {
    column: 'company',
    columnTitle: 'Company',
    title: 'Contact & Support',
    url: 'mailto:support@nexteracoders.com',
    order: 4,
    isActive: true,
    isExternal: true,
  },
  {
    column: 'company',
    columnTitle: 'Company',
    title: 'Member Sign In',
    url: '/login',
    order: 5,
    isActive: true,
    isExternal: false,
  },
  {
    column: 'company',
    columnTitle: 'Company',
    title: 'Join as Student',
    url: '/register',
    order: 6,
    isActive: true,
    isExternal: false,
  },

  // Explore
  {
    column: 'explore',
    columnTitle: 'Explore',
    title: 'Top Interview 150',
    url: '/top-interview-150',
    badge: 'Hot',
    badgeType: 'hot',
    order: 1,
    isActive: true,
    isExternal: false,
  },
  {
    column: 'explore',
    columnTitle: 'Explore',
    title: 'POTD & Problem Arena',
    url: '/practice',
    order: 2,
    isActive: true,
    isExternal: false,
  },
  {
    column: 'explore',
    columnTitle: 'Explore',
    title: 'Weekly Contests',
    url: '/contest',
    badge: 'Live',
    badgeType: 'live',
    order: 3,
    isActive: true,
    isExternal: false,
  },
  {
    column: 'explore',
    columnTitle: 'Explore',
    title: 'NEC Code Battle',
    url: '/duels',
    badge: 'Free',
    badgeType: 'free',
    order: 4,
    isActive: true,
    isExternal: false,
  },
  {
    column: 'explore',
    columnTitle: 'Explore',
    title: 'NEC Prime Battle',
    url: '/prime-duels',
    badge: '🪙 Staked',
    badgeType: 'amber',
    order: 5,
    isActive: true,
    isExternal: false,
  },
  {
    column: 'explore',
    columnTitle: 'Explore',
    title: 'In-Browser IDE',
    url: '/compiler',
    badge: 'Pro',
    badgeType: 'default',
    order: 6,
    isActive: true,
    isExternal: false,
  },
  {
    column: 'explore',
    columnTitle: 'Explore',
    title: 'Technical Quizzes',
    url: '/quizzes',
    order: 7,
    isActive: true,
    isExternal: false,
  },
  {
    column: 'explore',
    columnTitle: 'Explore',
    title: 'Production Projects',
    url: '/projects',
    order: 8,
    isActive: true,
    isExternal: false,
  },
  {
    column: 'explore',
    columnTitle: 'Explore',
    title: 'Rewards & Coins Store',
    url: '/rewards',
    order: 9,
    isActive: true,
    isExternal: false,
  },
  {
    column: 'explore',
    columnTitle: 'Explore',
    title: 'Explore All Tracks',
    url: '/explore',
    order: 10,
    isActive: true,
    isExternal: false,
  },

  // Tutorials
  {
    column: 'tutorials',
    columnTitle: 'Tutorials',
    title: 'Python 3.12 Guide',
    url: '/tutorials?track=python',
    order: 1,
    isActive: true,
    isExternal: false,
  },
  {
    column: 'tutorials',
    columnTitle: 'Tutorials',
    title: 'DSA & Algorithms',
    url: '/tutorials?track=dsa',
    order: 2,
    isActive: true,
    isExternal: false,
  },
  {
    column: 'tutorials',
    columnTitle: 'Tutorials',
    title: 'React & Next.js 15',
    url: '/tutorials?track=react',
    order: 3,
    isActive: true,
    isExternal: false,
  },
  {
    column: 'tutorials',
    columnTitle: 'Tutorials',
    title: 'Java 21 Enterprise',
    url: '/tutorials?track=java',
    order: 4,
    isActive: true,
    isExternal: false,
  },
  {
    column: 'tutorials',
    columnTitle: 'Tutorials',
    title: 'C++20 & STL Systems',
    url: '/tutorials?track=cpp',
    order: 5,
    isActive: true,
    isExternal: false,
  },
  {
    column: 'tutorials',
    columnTitle: 'Tutorials',
    title: 'System Design (HLD/LLD)',
    url: '/tutorials?track=systemdesign',
    order: 6,
    isActive: true,
    isExternal: false,
  },
  {
    column: 'tutorials',
    columnTitle: 'Tutorials',
    title: 'DevOps, Docker & K8s',
    url: '/tutorials?track=devops',
    order: 7,
    isActive: true,
    isExternal: false,
  },
  {
    column: 'tutorials',
    columnTitle: 'Tutorials',
    title: 'AI, ML & Generative AI',
    url: '/tutorials?track=ml',
    order: 8,
    isActive: true,
    isExternal: false,
  },

  // Courses
  {
    column: 'courses',
    columnTitle: 'Courses',
    title: 'Full-Stack Web Dev',
    url: '/courses/full-stack-web-development',
    order: 1,
    isActive: true,
    isExternal: false,
  },
  {
    column: 'courses',
    columnTitle: 'Courses',
    title: 'Python & Data Science',
    url: '/courses/python-for-data-science',
    order: 2,
    isActive: true,
    isExternal: false,
  },
  {
    column: 'courses',
    columnTitle: 'Courses',
    title: 'DSA & Placement Mastery',
    url: '/courses/dsa-mastery-course',
    order: 3,
    isActive: true,
    isExternal: false,
  },
  {
    column: 'courses',
    columnTitle: 'Courses',
    title: 'Java Backend & Spring',
    url: '/courses/java-fullstack-mastery',
    order: 4,
    isActive: true,
    isExternal: false,
  },
  {
    column: 'courses',
    columnTitle: 'Courses',
    title: 'All Pro Video Tracks',
    url: '/courses',
    order: 5,
    isActive: true,
    isExternal: false,
  },
  {
    column: 'courses',
    columnTitle: 'Courses',
    title: 'Verify Certificates',
    url: '/certificate/verify/DEMO-VERIFY',
    badge: 'Verify',
    badgeType: 'emerald',
    order: 6,
    isActive: true,
    isExternal: false,
  },
];

// Helper to seed defaults if collection is empty
export const ensureDefaultFooterLinks = async () => {
  try {
    const count = await FooterLink.countDocuments();
    if (count === 0) {
      await FooterLink.insertMany(DEFAULT_FOOTER_LINKS);
      logger.info(`[SEED] Initialized ${DEFAULT_FOOTER_LINKS.length} default footer links.`);
    }
  } catch (err) {
    logger.error('Failed to ensure default footer links:', err);
  }
};

/**
 * Public: Get active footer links grouped by column
 */
export const getPublicFooterLinks = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await ensureDefaultFooterLinks();
    const links = await FooterLink.find({ isActive: true }).sort({ column: 1, order: 1, createdAt: 1 }).lean();

    // Group links by column key
    const grouped: Record<string, { columnKey: string; columnTitle: string; links: any[] }> = {};

    for (const item of links) {
      const colKey = item.column.toLowerCase();
      if (!grouped[colKey]) {
        grouped[colKey] = {
          columnKey: colKey,
          columnTitle: item.columnTitle || colKey.toUpperCase(),
          links: [],
        };
      }
      grouped[colKey].links.push(item);
    }

    return ApiResponse.success(res, 'Footer links fetched successfully', {
      grouped,
      allLinks: links,
    }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Get all footer links with optional column filtering
 */
export const getAdminFooterLinks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await ensureDefaultFooterLinks();
    const { column } = req.query;
    const filter: any = {};
    if (column && typeof column === 'string' && column !== 'all') {
      filter.column = column.toLowerCase();
    }

    const links = await FooterLink.find(filter).sort({ column: 1, order: 1, createdAt: 1 }).lean();

    // Distinct columns available
    const columns = await FooterLink.distinct('column');

    return ApiResponse.success(res, 'Admin footer links fetched successfully', {
      links,
      total: links.length,
      availableColumns: columns,
    }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Create a new footer link
 */
export const createFooterLink = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { column, columnTitle, title, url, badge, badgeType, order, isActive, isExternal, description } = req.body;

    if (!column || !title || !url) {
      throw new ApiError(400, 'Column, Title, and URL are required.');
    }

    // Default columnTitle based on column name if not specified
    const computedColumnTitle =
      columnTitle?.trim() ||
      (column === 'company' ? 'Company' :
       column === 'explore' ? 'Explore' :
       column === 'tutorials' ? 'Tutorials' :
       column === 'courses' ? 'Courses' :
       column.charAt(0).toUpperCase() + column.slice(1));

    // Determine order if not passed
    let computedOrder = order !== undefined ? Number(order) : 0;
    if (order === undefined || isNaN(computedOrder)) {
      const maxOrderDoc = await FooterLink.findOne({ column: column.toLowerCase().trim() }).sort({ order: -1 }).lean();
      computedOrder = (maxOrderDoc?.order || 0) + 1;
    }

    const newLink = await FooterLink.create({
      column: column.toLowerCase().trim(),
      columnTitle: computedColumnTitle,
      title: title.trim(),
      url: url.trim(),
      badge: badge?.trim() || '',
      badgeType: badgeType || 'default',
      order: computedOrder,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      isExternal: isExternal !== undefined ? Boolean(isExternal) : url.startsWith('http') || url.startsWith('mailto:'),
      description: description?.trim() || '',
    });

    return ApiResponse.success(res, 'Footer link created successfully', newLink, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Update an existing footer link
 */
export const updateFooterLink = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { column, columnTitle, title, url, badge, badgeType, order, isActive, isExternal, description } = req.body;

    const existing = await FooterLink.findById(id);
    if (!existing) {
      throw new ApiError(404, 'Footer link not found.');
    }

    if (column !== undefined) existing.column = column.toLowerCase().trim();
    if (columnTitle !== undefined) existing.columnTitle = columnTitle.trim();
    if (title !== undefined) existing.title = title.trim();
    if (url !== undefined) {
      existing.url = url.trim();
      if (isExternal === undefined) {
        existing.isExternal = url.startsWith('http') || url.startsWith('mailto:');
      }
    }
    if (badge !== undefined) existing.badge = badge.trim();
    if (badgeType !== undefined) existing.badgeType = badgeType;
    if (order !== undefined) existing.order = Number(order);
    if (isActive !== undefined) existing.isActive = Boolean(isActive);
    if (isExternal !== undefined) existing.isExternal = Boolean(isExternal);
    if (description !== undefined) existing.description = description.trim();

    await existing.save();

    return ApiResponse.success(res, 'Footer link updated successfully', existing, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Delete a footer link
 */
export const deleteFooterLink = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const deleted = await FooterLink.findByIdAndDelete(id);
    if (!deleted) {
      throw new ApiError(404, 'Footer link not found.');
    }

    return ApiResponse.success(res, 'Footer link deleted successfully', { deletedId: id }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Reset/Re-seed default footer links
 */
export const resetDefaultFooterLinks = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await FooterLink.deleteMany({});
    const inserted = await FooterLink.insertMany(DEFAULT_FOOTER_LINKS);

    return ApiResponse.success(res, 'Default footer links restored successfully', { seededCount: inserted.length }, 200);
  } catch (error) {
    next(error);
  }
};
