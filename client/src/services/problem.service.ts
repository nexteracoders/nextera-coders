import api from './api';
import {
  IProblemListItem,
  IProblemDetail,
  IProblemCategoryStat,
  IDSAStats,
} from '../types/problem.types';
import { CoursePagination } from '../types/course.types';

export interface GetProblemsParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  difficulty?: string;
  language?: string;
  status?: string;
  sort?: string;
}

export const problemService = {
  // Get problems list with search and filters
  getProblems: async (
    params: GetProblemsParams = {}
  ): Promise<{ problems: IProblemListItem[]; pagination: CoursePagination }> => {
    const response = await api.get('/problems', { params });
    return response.data.data;
  },

  // Get problem details by slug
  getProblemBySlug: async (slug: string): Promise<IProblemDetail> => {
    const response = await api.get(`/problems/${slug}`);
    return response.data.data.problem;
  },

  // Get categories with counts
  getCategories: async (): Promise<IProblemCategoryStat[]> => {
    const response = await api.get('/problems/categories');
    return response.data.data.categories;
  },

  // Get DSA stats
  getDSAStats: async (): Promise<IDSAStats> => {
    const response = await api.get('/problems/dsa/stats');
    return response.data.data;
  },
};
