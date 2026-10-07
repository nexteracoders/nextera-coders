import api from './api';
import { IProject, IProjectListResponse, IProjectCategory } from '../types/project.types';

export const projectService = {
  getProjects: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    difficulty?: string;
  }) => {
    const res = await api.get<{ data: IProjectListResponse }>('/projects', { params });
    return res.data.data;
  },

  getProjectBySlug: async (slug: string) => {
    const res = await api.get<{ data: { project: IProject } }>(`/projects/${slug}`);
    return res.data.data.project;
  },

  getProjectCategories: async () => {
    const res = await api.get<{ data: { categories: IProjectCategory[] } }>('/projects/categories');
    return res.data.data.categories;
  },
};
