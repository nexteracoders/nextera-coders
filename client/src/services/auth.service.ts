import { apiClient } from './api';
import {
  ApiResponse,
  User,
  LoginCredentials,
  RegisterData,
  ChangePasswordData,
  ResetPasswordData,
  UpdateProfileData,
} from '../types';

export const authService = {
  register: async (data: RegisterData): Promise<{ user: User }> => {
    const response = await apiClient.post<ApiResponse<{ user: User }>>('/auth/register', data);
    return response.data.data!;
  },

  login: async (credentials: LoginCredentials): Promise<{ user: User; welcomeMessage?: string }> => {
    const response = await apiClient.post<ApiResponse<{ user: User; welcomeMessage?: string }>>('/auth/login', credentials);
    return response.data.data!;
  },

  socialLogin: async (data: { provider: 'google' | 'github'; email?: string; name?: string; avatar?: string; credential?: string; code?: string }): Promise<{ user: User; welcomeMessage?: string }> => {
    const response = await apiClient.post<ApiResponse<{ user: User; welcomeMessage?: string }>>('/auth/social-login', data);
    return response.data.data!;
  },

  logout: async (): Promise<void> => {
    await apiClient.post<ApiResponse<void>>('/auth/logout');
  },

  getMe: async (): Promise<{ user: User }> => {
    const response = await apiClient.get<ApiResponse<{ user: User }>>('/auth/me');
    return response.data.data!;
  },

  changePassword: async (data: ChangePasswordData): Promise<void> => {
    await apiClient.post<ApiResponse<void>>('/auth/change-password', data);
  },

  forgotPassword: async (email: string): Promise<{ email: string; expiresInSeconds: number }> => {
    const response = await apiClient.post<ApiResponse<{ email: string; expiresInSeconds: number }>>('/auth/forgot-password', { email });
    return response.data.data!;
  },

  sendForgotOtp: async (email: string): Promise<{ email: string; expiresInSeconds: number }> => {
    const response = await apiClient.post<ApiResponse<{ email: string; expiresInSeconds: number }>>('/auth/forgot-password', { email });
    return response.data.data!;
  },

  verifyOtp: async (email: string, otp: string): Promise<{ user: User; welcomeMessage?: string }> => {
    const response = await apiClient.post<ApiResponse<{ user: User; welcomeMessage?: string }>>('/auth/verify-otp', { email, otp });
    return response.data.data!;
  },

  verifyOtpAndLogin: async (data: { email: string; otp: string }): Promise<{ user: User; welcomeMessage?: string }> => {
    const response = await apiClient.post<ApiResponse<{ user: User; welcomeMessage?: string }>>('/auth/verify-otp', data);
    return response.data.data!;
  },

  resetPassword: async (data: ResetPasswordData): Promise<void> => {
    await apiClient.post<ApiResponse<void>>('/auth/reset-password', data);
  },

  resetPasswordWithOtp: async (data: { email: string; otp: string; newPassword: string }): Promise<void> => {
    await apiClient.post<ApiResponse<void>>('/auth/reset-password', data);
  },

  updateProfile: async (data: UpdateProfileData): Promise<{ user: User }> => {
    const response = await apiClient.put<ApiResponse<{ user: User }>>('/users/me', data);
    return response.data.data!;
  },

  getCodingProfile: async (): Promise<{
    codingScore: number;
    totalProblemsSolved: number;
    difficultyBreakdown: { school: number; basic: number; easy: number; medium: number; hard: number };
    necDailyStreak: number;
    longestNecStreak: number;
    necProblemsSolved: number;
    instituteRank: number;
    articlesPublished: number;
    submissionDateMap: Record<string, number>;
    totalSubmissionsInYear: number;
    recentSolvedProblems: Array<{ id: string; title: string; slug: string; difficulty: string; status: string; timeAgo: string }>;
  }> => {
    const response = await apiClient.get<ApiResponse<any>>('/users/me/coding-profile');
    return response.data.data!;
  },

  getPublicProfile: async (userId: string): Promise<{
    user: any;
    codingStats: any;
  }> => {
    const response = await apiClient.get<ApiResponse<{ user: any; codingStats: any }>>(`/users/${userId}/public-profile`);
    return response.data.data!;
  },

  toggleFollowUser: async (userId: string): Promise<{ isFollowing: boolean; followersCount: number }> => {
    const response = await apiClient.post<ApiResponse<{ isFollowing: boolean; followersCount: number }>>(`/users/${userId}/follow`);
    return response.data.data!;
  },

  getUserFollowers: async (userId: string): Promise<{ followers: any[] }> => {
    const response = await apiClient.get<ApiResponse<{ followers: any[] }>>(`/users/${userId}/followers`);
    return response.data.data!;
  },

  getUserFollowing: async (userId: string): Promise<{ following: any[] }> => {
    const response = await apiClient.get<ApiResponse<{ following: any[] }>>(`/users/${userId}/following`);
    return response.data.data!;
  },

  getInstituteLeaderboard: async (): Promise<{ collegeName: string; leaderboard: any[] }> => {
    const response = await apiClient.get<ApiResponse<{ collegeName: string; leaderboard: any[] }>>('/users/me/institute-leaderboard');
    return response.data.data!;
  },

  testAdminAccess: async (): Promise<ApiResponse> => {
    const response = await apiClient.get<ApiResponse>('/admin/test');
    return response.data;
  },
};
