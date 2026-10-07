import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Post, PostCategory } from '../models/post.model';
import { User } from '../models/user.model';
import { notificationService } from '../services/notification.service';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

// Human friendly relative time formatter
function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

// @desc    Get all posts / reviews with filters
// @route   GET /api/posts
// @access  Public / Optional Authenticate
export const getPosts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { category, search, authorId, sortBy = 'newest', reportedOnly } = req.query;
    const currentUserId = req.user?._id?.toString();
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'sub_admin';

    const andClauses: any[] = [];

    // Category filter
    if (category && typeof category === 'string' && category !== 'all') {
      andClauses.push({ category });
    }

    // Specific author filter (e.g. student profile 'My Posts' tab)
    if (authorId && typeof authorId === 'string' && Types.ObjectId.isValid(authorId)) {
      andClauses.push({ author: new Types.ObjectId(authorId) });
    }

    // Keyword search filter in title or content
    if (search && typeof search === 'string' && search.trim().length > 0) {
      const searchRegex = new RegExp(search.trim(), 'i');
      andClauses.push({
        $or: [
          { title: searchRegex },
          { content: searchRegex },
          { authorName: searchRegex },
        ],
      });
    }

    // 🛡️ Moderation safety: Standard viewers cannot see flagged/adult posts unless they are the author
    if (!isAdmin) {
      if (currentUserId) {
        andClauses.push({
          $or: [
            { isFlagged: { $ne: true } },
            { author: new Types.ObjectId(currentUserId) },
          ],
        });
      } else {
        andClauses.push({ isFlagged: { $ne: true } });
      }
    } else if (reportedOnly === 'true') {
      // 🛡️ Admin can filter specifically for flagged / reported posts needing review
      andClauses.push({
        $or: [
          { isFlagged: true },
          { reportsCount: { $gt: 0 } },
        ],
      });
    }

    const query = andClauses.length > 0 ? { $and: andClauses } : {};

    let sortOption: any = { isPinned: -1, createdAt: -1 };
    if (sortBy === 'top') {
      sortOption = { isPinned: -1, rating: -1, createdAt: -1 };
    } else if (sortBy === 'oldest') {
      sortOption = { isPinned: -1, createdAt: 1 };
    } else if (sortBy === 'reported') {
      sortOption = { isFlagged: -1, reportsCount: -1, createdAt: -1 };
    }

    const posts = await Post.find(query).sort(sortOption).limit(100).lean();

    const formatted = posts.map((post: any) => {
      const likeIds = (post.likes || []).map((id: any) => id.toString());
      const hasLiked = currentUserId ? likeIds.includes(currentUserId) : false;
      const isCurrentUser = currentUserId ? post.author.toString() === currentUserId : false;
      const reports = post.reports || [];
      const hasReported = currentUserId ? reports.some((r: any) => r.user.toString() === currentUserId) : false;

      return {
        id: post._id.toString(),
        authorId: post.author.toString(),
        authorName: post.authorName,
        authorEmail: post.authorEmail,
        authorAvatar: post.authorAvatar || '',
        authorCollege: post.authorCollege || '',
        title: post.title,
        content: post.content,
        category: post.category as PostCategory,
        rating: post.rating,
        images: post.images || [],
        likesCount: likeIds.length,
        hasLiked,
        isCurrentUser,
        isPinned: Boolean(post.isPinned),
        reportsCount: post.reportsCount || reports.length,
        isFlagged: Boolean(post.isFlagged),
        hasReported,
        reports: isAdmin
          ? reports.map((r: any) => ({
              id: r._id.toString(),
              userId: r.user.toString(),
              userName: r.userName,
              reason: r.reason,
              details: r.details || '',
              createdAt: r.createdAt,
            }))
          : [],
        commentsCount: (post.comments || []).length,
        comments: (post.comments || []).map((c: any) => ({
          id: c._id.toString(),
          authorId: c.author.toString(),
          authorName: c.authorName,
          authorAvatar: c.authorAvatar || '',
          content: c.content,
          createdAt: formatTimeAgo(c.createdAt),
          rawCreatedAt: c.createdAt,
          isCurrentUser: currentUserId ? c.author.toString() === currentUserId : false,
        })),
        createdAt: formatTimeAgo(post.createdAt),
        rawCreatedAt: post.createdAt,
      };
    });

    // Custom in-memory sort if 'popular' (by likes count)
    if (sortBy === 'popular') {
      formatted.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.likesCount - a.likesCount;
      });
    }

    ApiResponse.success(
      res,
      'Posts retrieved successfully',
      {
        posts: formatted,
        total: formatted.length,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get single post by ID
// @route   GET /api/posts/:id
// @access  Public / Optional Authenticate
export const getPostById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid post ID');
    }

    const currentUserId = req.user?._id?.toString();
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'sub_admin';
    const post = await Post.findById(id).lean();

    if (!post) {
      throw ApiError.notFound('Post not found');
    }

    // If post is flagged and viewer is not admin or the author, block view
    if (post.isFlagged && !isAdmin && post.author.toString() !== currentUserId) {
      throw ApiError.notFound('This post has been hidden due to community reports');
    }

    const likeIds = (post.likes || []).map((l: any) => l.toString());
    const hasLiked = currentUserId ? likeIds.includes(currentUserId) : false;
    const isCurrentUser = currentUserId ? post.author.toString() === currentUserId : false;
    const reports = post.reports || [];
    const hasReported = currentUserId ? reports.some((r: any) => r.user.toString() === currentUserId) : false;

    const formatted = {
      id: post._id.toString(),
      authorId: post.author.toString(),
      authorName: post.authorName,
      authorEmail: post.authorEmail,
      authorAvatar: post.authorAvatar || '',
      authorCollege: post.authorCollege || '',
      title: post.title,
      content: post.content,
      category: post.category,
      rating: post.rating,
      images: post.images || [],
      likesCount: likeIds.length,
      hasLiked,
      isCurrentUser,
      isPinned: Boolean(post.isPinned),
      reportsCount: post.reportsCount || reports.length,
      isFlagged: Boolean(post.isFlagged),
      hasReported,
      reports: isAdmin
        ? reports.map((r: any) => ({
            id: r._id.toString(),
            userId: r.user.toString(),
            userName: r.userName,
            reason: r.reason,
            details: r.details || '',
            createdAt: r.createdAt,
          }))
        : [],
      commentsCount: (post.comments || []).length,
      comments: (post.comments || []).map((c: any) => ({
        id: c._id.toString(),
        authorId: c.author.toString(),
        authorName: c.authorName,
        authorAvatar: c.authorAvatar || '',
        content: c.content,
        createdAt: formatTimeAgo(c.createdAt),
        rawCreatedAt: c.createdAt,
        isCurrentUser: currentUserId ? c.author.toString() === currentUserId : false,
      })),
      createdAt: formatTimeAgo(post.createdAt),
      rawCreatedAt: post.createdAt,
    };

    ApiResponse.success(res, 'Post retrieved successfully', { post: formatted }, 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new post / review / problem
// @route   POST /api/posts
// @access  Protected (Student/Admin)
export const createPost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const { title, content, category = 'general', rating, images = [] } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      throw ApiError.badRequest('Post title is required');
    }

    if (!content || typeof content !== 'string' || !content.trim()) {
      throw ApiError.badRequest('Post description/content is required');
    }

    const validCategories: PostCategory[] = ['review', 'problem', 'project', 'general'];
    const chosenCategory: PostCategory = validCategories.includes(category) ? category : 'general';

    let validatedRating: number | undefined = undefined;
    if (chosenCategory === 'review') {
      const numRating = Number(rating);
      validatedRating = isNaN(numRating) ? 5 : Math.max(1, Math.min(5, numRating));
    }

    // Limit maximum images attached per post to prevent bloat
    const cleanImages = Array.isArray(images)
      ? images.slice(0, 4).filter((img) => typeof img === 'string' && img.length > 0)
      : [];

    const newPost = await Post.create({
      author: user._id,
      authorName: user.name,
      authorEmail: user.email,
      authorAvatar: user.profileImage || (user.profileImages && user.profileImages[0]) || '',
      authorCollege: user.college || '',
      title: title.trim(),
      content: content.trim(),
      category: chosenCategory,
      rating: validatedRating,
      images: cleanImages,
      likes: [],
      comments: [],
      isPinned: false,
    });

    ApiResponse.success(
      res,
      'Post published successfully!',
      {
        post: {
          id: newPost._id.toString(),
          authorId: user._id.toString(),
          authorName: user.name,
          authorAvatar: newPost.authorAvatar,
          authorCollege: newPost.authorCollege,
          title: newPost.title,
          content: newPost.content,
          category: newPost.category,
          rating: newPost.rating,
          images: newPost.images,
          likesCount: 0,
          hasLiked: false,
          isCurrentUser: true,
          isPinned: false,
          commentsCount: 0,
          comments: [],
          createdAt: 'Just now',
          rawCreatedAt: newPost.createdAt,
        },
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle like on a post
// @route   POST /api/posts/:id/like
// @access  Protected
export const toggleLikePost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid post ID');
    }

    const post = await Post.findById(id);
    if (!post) {
      throw ApiError.notFound('Post not found');
    }

    const existingIndex = post.likes.findIndex((uid) => uid.toString() === userId.toString());
    let liked = false;

    if (existingIndex > -1) {
      // User has already liked, so unlike
      post.likes.splice(existingIndex, 1);
      liked = false;
    } else {
      // Like
      post.likes.push(userId);
      liked = true;
    }

    await post.save();

    ApiResponse.success(
      res,
      liked ? 'Post liked' : 'Post unliked',
      {
        liked,
        likesCount: post.likes.length,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Add comment to a post
// @route   POST /api/posts/:id/comment
// @access  Protected
export const addComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const user = req.user!;

    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid post ID');
    }

    if (!content || typeof content !== 'string' || !content.trim()) {
      throw ApiError.badRequest('Comment text cannot be empty');
    }

    const post = await Post.findById(id);
    if (!post) {
      throw ApiError.notFound('Post not found');
    }

    const newComment = {
      _id: new Types.ObjectId(),
      author: user._id,
      authorName: user.name,
      authorAvatar: user.profileImage || (user.profileImages && user.profileImages[0]) || '',
      content: content.trim(),
      createdAt: new Date(),
    };

    post.comments.push(newComment as any);
    await post.save();

    ApiResponse.success(
      res,
      'Comment added successfully',
      {
        comment: {
          id: newComment._id.toString(),
          authorId: user._id.toString(),
          authorName: user.name,
          authorAvatar: newComment.authorAvatar,
          content: newComment.content,
          createdAt: 'Just now',
          rawCreatedAt: newComment.createdAt,
          isCurrentUser: true,
        },
        commentsCount: post.comments.length,
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Protected (Author or Admin)
export const deletePost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;

    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid post ID');
    }

    const post = await Post.findById(id);
    if (!post) {
      throw ApiError.notFound('Post not found');
    }

    const isAuthor = post.author.toString() === user._id.toString();
    const isAdmin = user.role === 'admin' || user.role === 'sub_admin';

    if (!isAuthor && !isAdmin) {
      throw ApiError.forbidden('You do not have permission to delete this post');
    }

    await Post.findByIdAndDelete(id);

    // If an administrator deleted another user's post, notify the author
    if (isAdmin && !isAuthor) {
      try {
        await notificationService.createNotification({
          userId: post.author,
          title: '🚫 Post Removed by Moderation',
          message: `Your community post "${post.title}" was permanently removed by an administrator for violating community guidelines.`,
          type: 'SYSTEM',
          link: '/community',
        });
      } catch (notifyErr) {
        // Non-blocking notification failover
      }
    }

    ApiResponse.success(res, 'Post deleted successfully', null, 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Update / edit a post (Author or Admin)
// @route   PUT /api/posts/:id
// @access  Protected (Author or Admin)
export const updatePost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const { title, content, category, rating, images, isPinned } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid post ID');
    }

    const post = await Post.findById(id);
    if (!post) {
      throw ApiError.notFound('Post not found');
    }

    const isAuthor = post.author.toString() === user._id.toString();
    const isAdmin = user.role === 'admin' || user.role === 'sub_admin';

    if (!isAuthor && !isAdmin) {
      throw ApiError.forbidden('You do not have permission to edit this post');
    }

    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) {
        throw ApiError.badRequest('Post title cannot be empty');
      }
      post.title = title.trim();
    }

    if (content !== undefined) {
      if (typeof content !== 'string' || !content.trim()) {
        throw ApiError.badRequest('Post content cannot be empty');
      }
      post.content = content.trim();
    }

    if (category !== undefined) {
      const validCategories: PostCategory[] = ['review', 'problem', 'project', 'general'];
      if (validCategories.includes(category)) {
        post.category = category;
      }
    }

    if (rating !== undefined) {
      const numRating = Number(rating);
      post.rating = isNaN(numRating) ? undefined : Math.max(1, Math.min(5, numRating));
    }

    if (images !== undefined && Array.isArray(images)) {
      post.images = images.slice(0, 4).filter((img) => typeof img === 'string' && img.length > 0);
    }

    // Only Admin can directly toggle isPinned flag
    if (isAdmin && typeof isPinned === 'boolean') {
      post.isPinned = isPinned;
    }

    await post.save();

    const currentUserId = user._id.toString();
    const likeIds = (post.likes || []).map((l: any) => l.toString());
    const hasLiked = likeIds.includes(currentUserId);

    ApiResponse.success(
      res,
      isAdmin && !isAuthor ? 'Post updated by Admin' : 'Post updated successfully',
      {
        post: {
          id: post._id.toString(),
          authorId: post.author.toString(),
          authorName: post.authorName,
          authorEmail: post.authorEmail,
          authorAvatar: post.authorAvatar || '',
          authorCollege: post.authorCollege || '',
          title: post.title,
          content: post.content,
          category: post.category,
          rating: post.rating,
          images: post.images || [],
          likesCount: likeIds.length,
          hasLiked,
          isCurrentUser: isAuthor,
          isPinned: Boolean(post.isPinned),
          commentsCount: (post.comments || []).length,
          comments: (post.comments || []).map((c: any) => ({
            id: c._id.toString(),
            authorId: c.author.toString(),
            authorName: c.authorName,
            authorAvatar: c.authorAvatar || '',
            content: c.content,
            createdAt: formatTimeAgo(c.createdAt),
            rawCreatedAt: c.createdAt,
            isCurrentUser: c.author.toString() === currentUserId,
          })),
          createdAt: formatTimeAgo(post.createdAt),
          rawCreatedAt: post.createdAt,
        },
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Pin or unpin a post (Admin only)
// @route   PATCH /api/posts/:id/pin
// @access  Protected (Admin only)
export const togglePinPost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;

    if (user.role !== 'admin') {
      throw ApiError.forbidden('Only administrators can pin or unpin posts');
    }

    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid post ID');
    }

    const post = await Post.findById(id);
    if (!post) {
      throw ApiError.notFound('Post not found');
    }

    post.isPinned = !post.isPinned;
    await post.save();

    ApiResponse.success(
      res,
      post.isPinned ? 'Post pinned to top by Admin' : 'Post unpinned by Admin',
      { isPinned: post.isPinned },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a comment (Comment author, Post author, or Admin)
// @route   DELETE /api/posts/:id/comment/:commentId
// @access  Protected (Comment Author, Post Author, or Admin)
export const deleteComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, commentId } = req.params;
    const user = req.user!;

    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(commentId)) {
      throw ApiError.badRequest('Invalid post or comment ID');
    }

    const post = await Post.findById(id);
    if (!post) {
      throw ApiError.notFound('Post not found');
    }

    const commentIndex = post.comments.findIndex((c: any) => c._id.toString() === commentId);
    if (commentIndex === -1) {
      throw ApiError.notFound('Comment not found');
    }

    const targetComment = post.comments[commentIndex] as any;
    const isCommentAuthor = targetComment.author.toString() === user._id.toString();
    const isPostAuthor = post.author.toString() === user._id.toString();
    const isAdmin = user.role === 'admin' || user.role === 'sub_admin';

    if (!isCommentAuthor && !isPostAuthor && !isAdmin) {
      throw ApiError.forbidden('You do not have permission to delete this comment');
    }

    post.comments.splice(commentIndex, 1);
    await post.save();

    ApiResponse.success(
      res,
      isAdmin && !isCommentAuthor ? 'Comment deleted by Admin' : 'Comment deleted',
      { commentsCount: post.comments.length },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Report an inappropriate or adult post
// @route   POST /api/posts/:id/report
// @access  Protected (Authenticated users)
export const reportPost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const { reason, details } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid post ID');
    }

    if (!reason || typeof reason !== 'string' || !reason.trim()) {
      throw ApiError.badRequest('Report reason is required');
    }

    const post = await Post.findById(id);
    if (!post) {
      throw ApiError.notFound('Post not found');
    }

    const currentUserId = user._id.toString();
    const hasAlreadyReported = (post.reports || []).some(
      (r: any) => r.user.toString() === currentUserId
    );

    if (hasAlreadyReported) {
      throw ApiError.badRequest('You have already reported this post. Our moderation team is reviewing it.');
    }

    const newReport = {
      _id: new Types.ObjectId(),
      user: user._id,
      userName: user.name,
      reason: reason.trim(),
      details: typeof details === 'string' ? details.trim() : '',
      createdAt: new Date(),
    };

    if (!post.reports) {
      post.reports = [];
    }
    post.reports.push(newReport as any);
    post.reportsCount = post.reports.length;

    // 🚨 Threshold check: If 8 or more reports, automatically flag and hide the post from students!
    const reachedThreshold = post.reportsCount >= 8;
    if (reachedThreshold && !post.isFlagged) {
      post.isFlagged = true;
      post.autoHiddenAt = new Date();
    }

    await post.save();

    if (reachedThreshold) {
      try {
        // 1. Alert all Admins and Sub-Admins in real-time
        const admins = await User.find({ role: { $in: ['admin', 'sub_admin'] } }).select('_id');
        for (const admin of admins) {
          await notificationService.createNotification({
            userId: admin._id,
            title: '🚨 Community Post Flagged (8+ Reports)',
            message: `Post "${post.title}" by ${post.authorName} has reached ${post.reportsCount} community reports (${reason.trim()}). It has been auto-hidden from students for review.`,
            type: 'SYSTEM',
            link: '/community?reportedOnly=true',
            referenceType: 'POST_FLAGGED',
            referenceId: post._id.toString(),
          });
        }

        // 2. Alert the post author that post was auto-hidden
        await notificationService.createNotification({
          userId: post.author,
          title: '⚠️ Your Post has been Hidden by Moderation',
          message: `Your post "${post.title}" has received multiple community reports and has been temporarily hidden pending administrator review.`,
          type: 'SYSTEM',
          link: '/community',
          referenceType: 'POST_FLAGGED_AUTHOR',
          referenceId: post._id.toString(),
        });
      } catch (notifyErr) {
        // Non-blocking notification failover
      }
    }

    ApiResponse.success(
      res,
      reachedThreshold
        ? 'Report submitted. Due to multiple reports, this post has been auto-hidden from the feed and escalated to administrators for action.'
        : 'Thank you for reporting. Our moderation team has logged your report.',
      {
        reportsCount: post.reportsCount,
        isFlagged: Boolean(post.isFlagged),
        hasReported: true,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Dismiss reports and restore a post (Admin / Sub-Admin only)
// @route   PATCH /api/posts/:id/dismiss-reports
// @access  Protected (Admin / Sub-Admin)
export const dismissReports = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;

    if (user.role !== 'admin' && user.role !== 'sub_admin') {
      throw ApiError.forbidden('Only administrators can dismiss post reports');
    }

    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid post ID');
    }

    const post = await Post.findById(id);
    if (!post) {
      throw ApiError.notFound('Post not found');
    }

    post.reports = [];
    post.reportsCount = 0;
    post.isFlagged = false;
    post.autoHiddenAt = undefined;

    await post.save();

    ApiResponse.success(
      res,
      'Post reports dismissed and post restored to community feed',
      {
        id: post._id.toString(),
        reportsCount: 0,
        isFlagged: false,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

