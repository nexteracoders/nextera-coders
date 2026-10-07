import api from './api';
import {
  IQuizListResponse,
  IQuizDetail,
  IQuizStartResponse,
  IQuizSubmitPayload,
  IQuizResultResponse,
  IQuizAttemptSummary,
} from '../types/quiz.types';

export const quizService = {
  getQuizzes: async (params?: { page?: number; limit?: number; search?: string; courseId?: string }) => {
    const res = await api.get<{ data: IQuizListResponse }>('/quizzes', { params });
    return res.data.data;
  },

  getQuizById: async (idOrSlug: string) => {
    const res = await api.get<{ data: { quiz: IQuizDetail } }>(`/quizzes/${idOrSlug}`);
    return res.data.data.quiz;
  },

  startQuiz: async (quizId: string) => {
    const res = await api.post<{ data: IQuizStartResponse }>(`/quizzes/${quizId}/start`);
    return res.data.data;
  },

  submitQuiz: async (quizId: string, payload: IQuizSubmitPayload) => {
    const res = await api.post<{ data: IQuizResultResponse }>(`/quizzes/${quizId}/submit`, payload);
    return res.data.data;
  },

  getQuizAttempts: async (quizId: string) => {
    const res = await api.get<{ data: { attempts: IQuizAttemptSummary[] } }>(`/quizzes/${quizId}/attempts`);
    return res.data.data.attempts;
  },

  getAttemptById: async (attemptId: string) => {
    const res = await api.get<{ data: { attempt: any } }>(`/quiz-attempts/${attemptId}`);
    return res.data.data.attempt;
  },
};
