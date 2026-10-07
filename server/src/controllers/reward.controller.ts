import { Request, Response, NextFunction } from 'express';
import { Reward, IReward } from '../models/reward.model';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';
import { auditLogService } from '../services/auditLog.service';

export const DEFAULT_REWARDS: Partial<IReward>[] = [
  {
    id: 'coupon-10',
    title: '10% Extra Discount Coupon',
    category: 'coupon',
    coinsCost: 100,
    discountPercent: 10,
    couponCode: 'NEC10COIN',
    description: 'Get an extra 10% instant discount on any Pro Course or subscription.',
    image: '🎫',
    tag: 'Quick Reward',
    inStock: true,
    originalValue: 'Worth ₹499',
    isFeatured: false,
  },
  {
    id: 'coupon-25',
    title: '25% Super Discount Coupon',
    category: 'coupon',
    coinsCost: 250,
    discountPercent: 25,
    couponCode: 'NEC25SUPER',
    description: 'Get a massive 25% instant discount applicable on any checkout.',
    image: '🎟️',
    tag: 'Popular',
    inStock: true,
    isFeatured: true,
    originalValue: 'Worth ₹999',
  },
  {
    id: 'coupon-50',
    title: '50% Mega Saver Coupon',
    category: 'coupon',
    coinsCost: 500,
    discountPercent: 50,
    couponCode: 'NEC50MEGA',
    description: 'Huge 50% discount on any Premium Pro Cohort or Masterclass track.',
    image: '💎',
    tag: 'Best Value',
    inStock: true,
    isFeatured: true,
    originalValue: 'Worth ₹2,499',
  },
  {
    id: 'course-dsa',
    title: 'DSA & Competitive Coding Ace Track',
    category: 'course',
    coinsCost: 500,
    courseSlug: 'dsa-competitive-programming-masterclass',
    description: 'Master 450+ Data Structures & Algorithms problems with full mentor video solutions.',
    image: '💻',
    tag: 'Full Course',
    inStock: true,
    isFeatured: false,
    originalValue: 'Worth ₹1,999',
  },
  {
    id: 'course-mern',
    title: 'Full-Stack MERN Mastery Cohort',
    category: 'course',
    coinsCost: 500,
    courseSlug: 'full-stack-web-development-bootcamp',
    description: 'Build 8+ production apps with React 19, Node.js, Express, MongoDB and Microservices.',
    image: '🚀',
    tag: 'Full Course',
    inStock: true,
    isFeatured: false,
    originalValue: 'Worth ₹2,499',
  },
  {
    id: 'course-python',
    title: 'Python for GenAI & Machine Learning',
    category: 'course',
    coinsCost: 400,
    courseSlug: 'python-for-data-science-and-ai',
    description: 'Hands-on Python, NumPy, Pandas, LangChain, and fine-tuning AI LLM models.',
    image: '🤖',
    tag: 'Specialization',
    inStock: true,
    isFeatured: false,
    originalValue: 'Worth ₹1,499',
  },
  {
    id: 'swag-bag',
    title: 'NEC Pro Developer Waterproof Backpack',
    category: 'swag',
    coinsCost: 500,
    description: 'Ergonomic water-resistant developer bag with padded 16" laptop sleeve and USB charging port.',
    image: '🎒',
    tag: 'Official Swag',
    inStock: true,
    isFeatured: true,
    originalValue: 'Worth ₹1,999',
  },
  {
    id: 'swag-bottle',
    title: 'NEC Stainless Steel Insulated Water Bottle',
    category: 'swag',
    coinsCost: 500,
    description: '750ml vacuum-insulated dual-wall flask keeps beverages cold for 24h & hot for 12h.',
    image: '🍶',
    tag: 'Official Swag',
    inStock: true,
    isFeatured: false,
    originalValue: 'Worth ₹899',
  },
  {
    id: 'swag-hoodie',
    title: 'NEC "Code The Future" Premium Developer Hoodie',
    category: 'swag',
    coinsCost: 500,
    description: 'Heavyweight fleece cotton hoodie with embroidered NEC logo and code glyphs.',
    image: '👕',
    tag: 'Limited Edition',
    inStock: true,
    isFeatured: true,
    originalValue: 'Worth ₹2,299',
  },
  {
    id: 'swag-desk-kit',
    title: 'NEC Developer Desk Swag Pack',
    category: 'swag',
    coinsCost: 250,
    description: 'Hardcover developer notebook, matte metal gel pen, and 20+ holographic dev stickers.',
    image: '🎁',
    tag: 'Swag Box',
    inStock: true,
    isFeatured: false,
    originalValue: 'Worth ₹799',
  },
];

// @desc    Get all active rewards from MongoDB (auto-seeds if empty)
// @route   GET /api/rewards
// @access  Public
export const getRewards = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let rewards = await Reward.find().sort({ isFeatured: -1, coinsCost: 1, createdAt: -1 });

    if (rewards.length === 0) {
      // Auto-seed default catalog
      await Reward.insertMany(DEFAULT_REWARDS);
      rewards = await Reward.find().sort({ isFeatured: -1, coinsCost: 1, createdAt: -1 });
    }

    ApiResponse.success(
      res,
      'Rewards catalog retrieved successfully',
      {
        rewards: rewards.map((r) => ({
          id: r.id,
          title: r.title,
          category: r.category,
          coinsCost: r.coinsCost,
          description: r.description,
          image: r.image,
          tag: r.tag,
          couponCode: r.couponCode,
          discountPercent: r.discountPercent,
          courseSlug: r.courseSlug,
          inStock: r.inStock,
          stockCount: r.stockCount,
          isFeatured: r.isFeatured,
          originalValue: r.originalValue,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        })),
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Create a new reward
// @route   POST /api/rewards
// @access  Protected (Admin)
export const adminCreateReward = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      id,
      title,
      category,
      coinsCost,
      description,
      image,
      tag,
      couponCode,
      discountPercent,
      courseSlug,
      inStock,
      stockCount,
      isFeatured,
      originalValue,
    } = req.body;

    if (!title || !category || coinsCost === undefined) {
      throw ApiError.badRequest('Title, category, and coinsCost are required.');
    }

    const uniqueId = id || `reward-${category}-${Date.now()}`;

    const existing = await Reward.findOne({ id: uniqueId });
    if (existing) {
      throw ApiError.badRequest(`A reward with id "${uniqueId}" already exists.`);
    }

    const reward = await Reward.create({
      id: uniqueId,
      title: title.trim(),
      category,
      coinsCost: Math.max(0, Number(coinsCost) || 0),
      description: description ? description.trim() : '',
      image: image ? image.trim() : '🎁',
      tag: tag ? tag.trim() : undefined,
      couponCode: couponCode ? couponCode.trim() : undefined,
      discountPercent: discountPercent !== undefined ? Number(discountPercent) : undefined,
      courseSlug: courseSlug ? courseSlug.trim() : undefined,
      inStock: inStock !== false,
      stockCount: stockCount !== undefined ? Number(stockCount) : 100,
      isFeatured: Boolean(isFeatured),
      originalValue: originalValue ? originalValue.trim() : undefined,
    });

    if (req.user) {
      await auditLogService.recordLog({
        adminId: req.user._id,
        action: 'CREATE',
        resourceType: 'REWARD',
        resourceId: reward._id.toString(),
        resourceTitle: reward.title,
        metadata: { id: reward.id, coinsCost: reward.coinsCost },
      });
    }

    ApiResponse.success(res, 'Reward created successfully', { reward }, 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Update existing reward by ID or _id
// @route   PUT /api/rewards/:id
// @access  Protected (Admin)
export const adminUpdateReward = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Search by custom id or mongo _id
    let reward = await Reward.findOne({ id });
    if (!reward) {
      try {
        reward = await Reward.findById(id);
      } catch {}
    }

    if (!reward) {
      const defaultItem = DEFAULT_REWARDS.find((d) => d.id === id);
      if (defaultItem) {
        reward = await Reward.create({
          ...defaultItem,
          ...updates,
          id: defaultItem.id || id,
        });
        if (req.user) {
          await auditLogService.recordLog({
            adminId: req.user._id,
            action: 'UPDATE',
            resourceType: 'REWARD',
            resourceId: reward._id.toString(),
            resourceTitle: reward.title,
            metadata: { id: reward.id, updates },
          });
        }
        ApiResponse.success(res, 'Reward updated successfully', { reward }, 200);
        return;
      }
      throw ApiError.notFound(`Reward "${id}" not found.`);
    }

    if (updates.title !== undefined) reward.title = updates.title.trim();
    if (updates.category !== undefined) reward.category = updates.category;
    if (updates.coinsCost !== undefined) reward.coinsCost = Math.max(0, Number(updates.coinsCost) || 0);
    if (updates.description !== undefined) reward.description = updates.description.trim();
    if (updates.image !== undefined) reward.image = updates.image.trim();
    if (updates.tag !== undefined) reward.tag = updates.tag.trim();
    if (updates.couponCode !== undefined) reward.couponCode = updates.couponCode.trim();
    if (updates.discountPercent !== undefined) reward.discountPercent = Number(updates.discountPercent);
    if (updates.courseSlug !== undefined) reward.courseSlug = updates.courseSlug.trim();
    if (updates.inStock !== undefined) reward.inStock = Boolean(updates.inStock);
    if (updates.stockCount !== undefined) reward.stockCount = Number(updates.stockCount);
    if (updates.isFeatured !== undefined) reward.isFeatured = Boolean(updates.isFeatured);
    if (updates.originalValue !== undefined) reward.originalValue = updates.originalValue.trim();

    await reward.save();

    if (req.user) {
      await auditLogService.recordLog({
        adminId: req.user._id,
        action: 'UPDATE',
        resourceType: 'REWARD',
        resourceId: reward._id.toString(),
        resourceTitle: reward.title,
        metadata: { id: reward.id, updates },
      });
    }

    ApiResponse.success(res, 'Reward updated successfully', { reward }, 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Delete a reward
// @route   DELETE /api/rewards/:id
// @access  Protected (Admin)
export const adminDeleteReward = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    let reward = await Reward.findOne({ id });
    if (!reward) {
      try {
        reward = await Reward.findById(id);
      } catch {}
    }

    if (!reward) {
      throw ApiError.notFound(`Reward "${id}" not found.`);
    }

    await Reward.deleteOne({ _id: reward._id });

    if (req.user) {
      await auditLogService.recordLog({
        adminId: req.user._id,
        action: 'DELETE',
        resourceType: 'REWARD',
        resourceId: reward._id.toString(),
        resourceTitle: reward.title,
        metadata: { id: reward.id },
      });
    }

    ApiResponse.success(res, `Reward "${reward.title}" deleted successfully`, { deletedId: reward.id }, 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Reset rewards catalog to default
// @route   POST /api/rewards/reset
// @access  Protected (Admin)
export const adminResetRewards = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await Reward.deleteMany({});
    await Reward.insertMany(DEFAULT_REWARDS);

    const fresh = await Reward.find().sort({ isFeatured: -1, coinsCost: 1, createdAt: -1 });

    if (req.user) {
      await auditLogService.recordLog({
        adminId: req.user._id,
        action: 'UPDATE',
        resourceType: 'REWARD',
        resourceId: 'all',
        resourceTitle: 'Reset Rewards to Default',
        metadata: { count: fresh.length },
      });
    }

    ApiResponse.success(res, 'Rewards reset to default platform catalog', { rewards: fresh }, 200);
  } catch (error) {
    next(error);
  }
};
