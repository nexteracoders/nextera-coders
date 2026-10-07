import api from './api';
import { IProject } from '../types/project.types';
import { CoursePagination } from '../types/course.types';

export const adminProjectService = {
  getProjects: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    difficulty?: string;
    status?: string;
  }) => {
    const res = await api.get<{ data: { projects: IProject[]; pagination: CoursePagination } }>(
      '/admin/projects',
      { params }
    );
    return res.data.data;
  },

  getProjectById: async (id: string) => {
    const res = await api.get<{ data: { project: IProject } }>(`/admin/projects/${id}`);
    return res.data.data.project;
  },

  createProject: async (payload: any) => {
    const res = await api.post<{ data: { project: IProject } }>('/admin/projects', payload);
    return res.data.data.project;
  },

  updateProject: async (id: string, payload: any) => {
    const res = await api.put<{ data: { project: IProject } }>(`/admin/projects/${id}`, payload);
    return res.data.data.project;
  },

  deleteProject: async (id: string) => {
    const res = await api.delete(`/admin/projects/${id}`);
    return res.data;
  },

  publishProject: async (id: string) => {
    const res = await api.patch<{ data: { isPublished: boolean } }>(`/admin/projects/${id}/publish`);
    return res.data.data;
  },

  unpublishProject: async (id: string) => {
    const res = await api.patch<{ data: { isPublished: boolean } }>(`/admin/projects/${id}/unpublish`);
    return res.data.data;
  },
};
