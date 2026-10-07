import api from './api';
import { IAdminQuiz } from '../types/quiz.types';
import { CoursePagination } from '../types/course.types';

export const adminQuizService = {
  getQuizzes: async (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
    const res = await api.get<{ data: { quizzes: IAdminQuiz[]; pagination: CoursePagination } }>(
      '/admin/quizzes',
      { params }
    );
    return res.data.data;
  },

  getQuizById: async (id: string) => {
    const res = await api.get<{ data: { quiz: IAdminQuiz } }>(`/admin/quizzes/${id}`);
    return res.data.data.quiz;
  },

  createQuiz: async (payload: any) => {
    const res = await api.post<{ data: { quiz: IAdminQuiz } }>('/admin/quizzes', payload);
    return res.data.data.quiz;
  },

  updateQuiz: async (id: string, payload: any) => {
    const res = await api.put<{ data: { quiz: IAdminQuiz } }>(`/admin/quizzes/${id}`, payload);
    return res.data.data.quiz;
  },

  deleteQuiz: async (id: string) => {
    const res = await api.delete(`/admin/quizzes/${id}`);
    return res.data;
  },

  publishQuiz: async (id: string) => {
    const res = await api.patch<{ data: { isPublished: boolean } }>(`/admin/quizzes/${id}/publish`);
    return res.data.data;
  },

  unpublishQuiz: async (id: string) => {
    const res = await api.patch<{ data: { isPublished: boolean } }>(`/admin/quizzes/${id}/unpublish`);
    return res.data.data;
  },
};
