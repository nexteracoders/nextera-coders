import apiClient from './api';
import {
  ILearningCourseData,
  ILessonDetailsResponse,
  IEnrollmentProgress,
  IStudentDashboardData,
  IEnrolledCourseCard,
} from '../types/learning.types';
import { CoursePagination } from '../types/course.types';

export const learningService = {
  // Fetch complete learning player layout for a course
  async getCourseLearnData(slug: string, lessonId?: string): Promise<ILearningCourseData> {
    const params = lessonId ? { lessonId } : {};
    const res = await apiClient.get(`/courses/${slug}/learn-data`, { params });
    return res.data.data;
  },

  // Fetch individual lesson content & navigation
  async getLessonById(lessonId: string): Promise<ILessonDetailsResponse> {
    const res = await apiClient.get(`/lessons/${lessonId}`);
    return res.data.data;
  },

  // Mark lesson complete
  async markLessonComplete(lessonId: string): Promise<{ enrollment: IEnrollmentProgress }> {
    const res = await apiClient.post(`/lessons/${lessonId}/complete`);
    return res.data.data;
  },

  // Get single course progress
  async getCourseProgress(courseId: string): Promise<IEnrollmentProgress> {
    const res = await apiClient.get(`/courses/${courseId}/progress`);
    return res.data.data;
  },

  // Get student dashboard summary
  async getStudentDashboard(): Promise<IStudentDashboardData> {
    const res = await apiClient.get('/users/me/dashboard');
    return res.data.data;
  },

  // Get student enrollments list with filter tabs
  async getMyEnrollments(params?: {
    status?: 'all' | 'in-progress' | 'completed';
    page?: number;
    limit?: number;
  }): Promise<{ enrollments: IEnrolledCourseCard[]; pagination: CoursePagination }> {
    const res = await apiClient.get('/users/me/enrollments', { params });
    return res.data.data;
  },

  // Update profile
  async updateProfile(data: {
    name?: string;
    profileImage?: string;
    bio?: string;
    skills?: string[];
    github?: string;
    linkedin?: string;
  }) {
    const res = await apiClient.put('/users/me', data);
    return res.data.data;
  },
};
