import api from './api';
import { IProblemComment } from '../components/problem/ProblemDiscussionSection';

export const discussionService = {
  // Get all discussions for a problem (synced with MongoDB)
  getDiscussions: async (
    problemSlug: string,
    sortBy: 'top' | 'newest' = 'top'
  ): Promise<IProblemComment[]> => {
    const response = await api.get(`/discussions/${encodeURIComponent(problemSlug)}`, {
      params: { sortBy },
    });
    return response.data.data.discussions || [];
  },

  // Create a new discussion comment
  createDiscussion: async (
    problemSlug: string,
    text: string
  ): Promise<IProblemComment> => {
    const response = await api.post(`/discussions/${encodeURIComponent(problemSlug)}`, {
      text,
    });
    return response.data.data.discussion;
  },

  // Toggle upvote / like on a discussion comment
  toggleLike: async (
    commentId: string
  ): Promise<{ hasLiked: boolean; likesCount: number }> => {
    const response = await api.post(`/discussions/comments/${commentId}/like`);
    return response.data.data;
  },

  // Add reply to a discussion comment
  addReply: async (
    commentId: string,
    text: string
  ): Promise<any> => {
    const response = await api.post(`/discussions/comments/${commentId}/reply`, {
      text,
    });
    return response.data.data.reply;
  },

  // Delete a discussion comment
  deleteDiscussion: async (commentId: string): Promise<void> => {
    await api.delete(`/discussions/comments/${commentId}`);
  },
};
