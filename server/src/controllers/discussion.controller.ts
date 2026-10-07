import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { ProblemDiscussion } from '../models/discussion.model';
import { CodingProblem } from '../models/problem.model';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

// Format relative timestamp
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

// Initial realistic peer discussions seeded if a problem has no discussions yet
const INITIAL_PEER_DISCUSSIONS = [
  {
    authorName: 'Aarav Sharma',
    authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    text: `### 🚀 Optimal Approach
For this problem, a single-pass HashMap approach with O(N) time and O(N) auxiliary space is the most optimal in technical interviews!

### ⏱️ Complexity
- **Time Complexity:** \`O(N)\`
- **Auxiliary Space:** \`O(N)\`

### 💻 Python 3 Solution
\`\`\`python
def solve(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []
\`\`\``,
    initialLikes: 14,
  },
  {
    authorName: 'Priya Patel',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    text: `### 💡 C++ 17 Clean Implementation with unordered_map
Here is a very readable solution in C++ that avoids nested loops and handles boundary constraints cleanly:

\`\`\`cpp
#include <vector>
#include <unordered_map>
using namespace std;

class Solution {
public:
    vector<int> solve(vector<int>& nums, int target) {
        unordered_map<int, int> mp;
        for (int i = 0; i < nums.size(); ++i) {
            int complement = target - nums[i];
            if (mp.find(complement) != mp.end()) {
                return {mp[complement], i};
            }
            mp[nums[i]] = i;
        }
        return {};
    }
};
\`\`\`
Make sure to check if duplicate numbers sum up to the target (e.g. \`nums = [3, 3]\`, \`target = 6\`)!`,
    initialLikes: 9,
  },
];

// @desc    Get discussions for a coding problem
// @route   GET /api/discussions/:problemSlug
// @access  Public / Optional Auth
export const getProblemDiscussions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { problemSlug } = req.params;
    const sortBy = (req.query.sortBy as string) || 'top';
    const currentUserId = req.user?._id ? req.user._id.toString() : null;

    if (!problemSlug) {
      throw ApiError.badRequest('Problem slug is required');
    }

    let discussions = await ProblemDiscussion.find({ problemSlug }).lean();

    // Auto-seed initial peer discussion if database has no comments yet for this slug
    if (discussions.length === 0) {
      const problem = await CodingProblem.findOne({ slug: problemSlug }).lean();
      const seedUserId = new Types.ObjectId();

      const seedDocs = INITIAL_PEER_DISCUSSIONS.map((item) => ({
        problemId: problem?._id,
        problemSlug,
        userId: seedUserId,
        authorName: item.authorName,
        authorAvatar: item.authorAvatar,
        text: item.text,
        likes: Array(item.initialLikes).fill(new Types.ObjectId()),
        replies: [],
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 86400000 * 3)),
      }));

      try {
        await ProblemDiscussion.insertMany(seedDocs);
        discussions = await ProblemDiscussion.find({ problemSlug }).lean();
      } catch (seedErr) {
        console.warn('Could not auto-seed discussions:', seedErr);
      }
    }

    // Format comments for frontend consumption
    const formatted = discussions.map((d: any) => {
      const likeIds = (d.likes || []).map((id: any) => id.toString());
      const hasLiked = currentUserId ? likeIds.includes(currentUserId) : false;
      const isCurrentUser = currentUserId ? d.userId.toString() === currentUserId : false;

      return {
        id: d._id.toString(),
        userId: d.userId.toString(),
        author: d.authorName,
        avatar: d.authorAvatar || '',
        text: d.text,
        createdAt: formatTimeAgo(d.createdAt),
        rawCreatedAt: d.createdAt,
        likes: likeIds.length,
        hasLiked,
        isCurrentUser,
        isPinned: Boolean(d.isPinned),
        replies: (d.replies || []).map((r: any) => ({
          id: r._id.toString(),
          userId: r.userId.toString(),
          author: r.authorName,
          avatar: r.authorAvatar || '',
          text: r.text,
          createdAt: formatTimeAgo(r.createdAt),
        })),
      };
    });

    // Sort accordingly
    if (sortBy === 'newest') {
      formatted.sort((a, b) => new Date(b.rawCreatedAt).getTime() - new Date(a.rawCreatedAt).getTime());
    } else {
      // Top voted first, with pinned on top
      formatted.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.likes - a.likes;
      });
    }

    ApiResponse.success(
      res,
      'Problem discussions retrieved successfully',
      {
        discussions: formatted,
        totalCount: formatted.length,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new discussion comment
// @route   POST /api/discussions/:problemSlug
// @access  Protected (Student)
export const createProblemDiscussion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { problemSlug } = req.params;
    const { text } = req.body;
    const user = req.user!;

    if (!text || text.trim() === '') {
      throw ApiError.badRequest('Discussion comment text cannot be empty');
    }

    const problem = await CodingProblem.findOne({ slug: problemSlug }).lean();

    const authorName = user.name || 'Code Enthusiast';
    const authorAvatar = user.profileImage || '';

    const newDiscussion = await ProblemDiscussion.create({
      problemId: problem?._id,
      problemSlug,
      userId: user._id,
      authorName,
      authorAvatar,
      text: text.trim(),
      likes: [],
      replies: [],
      createdAt: new Date(),
    });

    ApiResponse.success(
      res,
      'Discussion comment posted successfully',
      {
        discussion: {
          id: newDiscussion._id.toString(),
          userId: user._id.toString(),
          author: authorName,
          avatar: authorAvatar,
          text: newDiscussion.text,
          createdAt: 'Just now',
          likes: 0,
          hasLiked: false,
          isCurrentUser: true,
          replies: [],
        },
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle upvote/like on a discussion comment
// @route   POST /api/discussions/:commentId/like
// @access  Protected (Student)
export const toggleLikeDiscussion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { commentId } = req.params;
    const user = req.user!;

    if (!Types.ObjectId.isValid(commentId)) {
      throw ApiError.badRequest('Invalid discussion comment ID format');
    }

    const discussion = await ProblemDiscussion.findById(commentId);
    if (!discussion) {
      throw ApiError.notFound('Discussion comment not found');
    }

    const userObjectId = new Types.ObjectId(user._id);
    const hasLiked = discussion.likes.some((id) => id.toString() === user._id.toString());

    if (hasLiked) {
      // Unlike
      discussion.likes = discussion.likes.filter((id) => id.toString() !== user._id.toString());
    } else {
      // Like
      discussion.likes.push(userObjectId);
    }

    await discussion.save();

    ApiResponse.success(
      res,
      hasLiked ? 'Comment unliked' : 'Comment liked',
      {
        commentId: discussion._id.toString(),
        hasLiked: !hasLiked,
        likesCount: discussion.likes.length,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Add reply to a discussion comment
// @route   POST /api/discussions/:commentId/reply
// @access  Protected (Student)
export const addReplyDiscussion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { commentId } = req.params;
    const { text } = req.body;
    const user = req.user!;

    if (!text || text.trim() === '') {
      throw ApiError.badRequest('Reply text cannot be empty');
    }

    if (!Types.ObjectId.isValid(commentId)) {
      throw ApiError.badRequest('Invalid discussion comment ID format');
    }

    const discussion = await ProblemDiscussion.findById(commentId);
    if (!discussion) {
      throw ApiError.notFound('Discussion comment not found');
    }

    const newReply = {
      _id: new Types.ObjectId(),
      userId: new Types.ObjectId(user._id),
      authorName: user.name || 'Code Enthusiast',
      authorAvatar: user.profileImage || '',
      text: text.trim(),
      createdAt: new Date(),
    };

    discussion.replies.push(newReply as any);
    await discussion.save();

    ApiResponse.success(
      res,
      'Reply added successfully',
      {
        reply: {
          id: newReply._id.toString(),
          userId: user._id.toString(),
          author: newReply.authorName,
          avatar: newReply.authorAvatar,
          text: newReply.text,
          createdAt: 'Just now',
        },
        totalReplies: discussion.replies.length,
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Delete discussion comment
// @route   DELETE /api/discussions/:commentId
// @access  Protected (Author or Admin)
export const deleteProblemDiscussion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { commentId } = req.params;
    const user = req.user!;

    if (!Types.ObjectId.isValid(commentId)) {
      throw ApiError.badRequest('Invalid discussion comment ID format');
    }

    const discussion = await ProblemDiscussion.findById(commentId);
    if (!discussion) {
      throw ApiError.notFound('Discussion comment not found');
    }

    const isAuthor = discussion.userId.toString() === user._id.toString();
    const isAdmin = user.role === 'admin';

    if (!isAuthor && !isAdmin) {
      throw ApiError.forbidden('You are not authorized to delete this comment');
    }

    await ProblemDiscussion.findByIdAndDelete(commentId);

    ApiResponse.success(
      res,
      'Discussion comment removed successfully',
      { commentId },
      200
    );
  } catch (error) {
    next(error);
  }
};
