import { apiClient } from './api';
import { ApiResponse } from '../types';

export interface MentorItem {
  id: string;
  name: string;
  role: string;
  exCompanies: string[];
  image: string;
  quoteTitle: string;
  quoteBody: string;
  signature: string;
  experience: string;
  studentsMentored: string;
  placements: string;
  rating: string;
  email?: string;
  phone?: string;
  bio?: string;
  skills?: string[];
  courses?: string[];
  followersCount?: number;
  isFollowing?: boolean;
  userId?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    x?: string;
    facebook?: string;
    github?: string;
    youtube?: string;
  };
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface MentorCourseItem {
  id?: string;
  _id?: string;
  title: string;
  slug: string;
  description?: string;
  thumbnail?: string;
  level: string;
  category: string;
  rating?: number;
  originalPrice?: number;
  proPrice?: number;
  freePrice?: number;
  isProAvailable?: boolean;
}

export const mentorService = {
  async getPublicMentors(): Promise<{ mentors: MentorItem[] }> {
    const response = await apiClient.get<ApiResponse<{ mentors: MentorItem[] }>>('/mentors');
    return response.data.data || { mentors: [] };
  },

  async getMentorById(id: string): Promise<{ mentor: MentorItem; courses: MentorCourseItem[] }> {
    const response = await apiClient.get<ApiResponse<{ mentor: MentorItem; courses: MentorCourseItem[] }>>(`/mentors/${id}`);
    return response.data.data || { mentor: {} as any, courses: [] };
  },

  async toggleFollowMentor(id: string): Promise<{ isFollowing: boolean; followersCount: number; message: string }> {
    const response = await apiClient.post<ApiResponse<{ isFollowing: boolean; followersCount: number }>>(`/mentors/${id}/follow`);
    return {
      isFollowing: response.data.data?.isFollowing || false,
      followersCount: response.data.data?.followersCount || 0,
      message: response.data.message || '',
    };
  },

  async getMentorMe(): Promise<{ mentor: MentorItem }> {
    const response = await apiClient.get<ApiResponse<{ mentor: MentorItem }>>('/mentors/me');
    return response.data.data || { mentor: {} as any };
  },

  async updateMentorMe(data: Partial<MentorItem>): Promise<{ mentor: MentorItem }> {
    const response = await apiClient.put<ApiResponse<{ mentor: MentorItem }>>('/mentors/me', data);
    return response.data.data || { mentor: {} as any };
  },

  async changeMentorPassword(currentPassword: string, newPassword: string): Promise<any> {
    const response = await apiClient.put<ApiResponse<any>>('/mentors/me/password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },
};
