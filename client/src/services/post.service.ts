import { apiClient } from './api';
import { ApiResponse } from '../types';
import { PostItem, CreatePostInput, UpdatePostInput, PostComment } from '../types/post.types';

export const postService = {
  async getPosts(params?: {
    category?: string;
    search?: string;
    authorId?: string;
    sortBy?: string;
    reportedOnly?: boolean;
  }): Promise<{ posts: PostItem[]; total: number }> {
    const response = await apiClient.get<ApiResponse<{ posts: PostItem[]; total: number }>>('/posts', {
      params,
    });
    return response.data.data || { posts: [], total: 0 };
  },

  async getPostById(id: string): Promise<{ post: PostItem }> {
    const response = await apiClient.get<ApiResponse<{ post: PostItem }>>(`/posts/${id}`);
    return response.data.data!;
  },

  async createPost(data: CreatePostInput): Promise<{ post: PostItem }> {
    const response = await apiClient.post<ApiResponse<{ post: PostItem }>>('/posts', data);
    return response.data.data!;
  },

  async updatePost(id: string, data: UpdatePostInput): Promise<{ post: PostItem }> {
    const response = await apiClient.put<ApiResponse<{ post: PostItem }>>(`/posts/${id}`, data);
    return response.data.data!;
  },

  async togglePin(id: string): Promise<{ isPinned: boolean }> {
    const response = await apiClient.patch<ApiResponse<{ isPinned: boolean }>>(`/posts/${id}/pin`);
    return response.data.data!;
  },

  async toggleLike(id: string): Promise<{ liked: boolean; likesCount: number }> {
    const response = await apiClient.post<ApiResponse<{ liked: boolean; likesCount: number }>>(`/posts/${id}/like`);
    return response.data.data!;
  },

  async addComment(id: string, content: string): Promise<{ comment: PostComment; commentsCount: number }> {
    const response = await apiClient.post<ApiResponse<{ comment: PostComment; commentsCount: number }>>(
      `/posts/${id}/comment`,
      { content }
    );
    return response.data.data!;
  },

  async deleteComment(postId: string, commentId: string): Promise<{ commentsCount: number }> {
    const response = await apiClient.delete<ApiResponse<{ commentsCount: number }>>(
      `/posts/${postId}/comment/${commentId}`
    );
    return response.data.data!;
  },

  async deletePost(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(`/posts/${id}`);
  },

  async reportPost(
    id: string,
    data: { reason: string; details?: string }
  ): Promise<{ reportsCount: number; isFlagged: boolean; hasReported: boolean }> {
    const response = await apiClient.post<
      ApiResponse<{ reportsCount: number; isFlagged: boolean; hasReported: boolean }>
    >(`/posts/${id}/report`, data);
    return response.data.data!;
  },

  async dismissReports(id: string): Promise<{ id: string; reportsCount: number; isFlagged: boolean }> {
    const response = await apiClient.patch<ApiResponse<{ id: string; reportsCount: number; isFlagged: boolean }>>(
      `/posts/${id}/dismiss-reports`
    );
    return response.data.data!;
  },
};

