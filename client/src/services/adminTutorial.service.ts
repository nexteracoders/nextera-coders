import api from './api';
import { ITutorialDetail } from '../types/tutorial.types';
import { CoursePagination } from '../types/course.types';

export interface ITutorialSubject {
  id: string;
  _id?: string;
  title: string;
  slug: string;
  shortTitle: string;
  category: string;
  iconName?: string;
  description?: string;
  order?: number;
  isPublished: boolean;
  totalChapters?: number;
  createdAt?: string;
  updatedAt?: string;
}

export const adminTutorialService = {
  // --- Subject Management ---
  getSubjects: async (params?: {
    search?: string;
    category?: string;
    status?: string;
  }) => {
    const res = await api.get<{
      data: { subjects: ITutorialSubject[] };
    }>('/admin/tutorials/subjects', { params });
    return res.data.data.subjects;
  },

  createSubject: async (payload: Partial<ITutorialSubject>) => {
    const res = await api.post<{
      data: { subject: ITutorialSubject };
    }>('/admin/tutorials/subjects', payload);
    return res.data.data.subject;
  },

  getSubjectBySlug: async (slug: string) => {
    const res = await api.get<{
      data: { subject: ITutorialSubject; chapters: any[] };
    }>(`/admin/tutorials/subjects/${slug}`);
    return res.data.data;
  },

  updateSubject: async (slug: string, payload: Partial<ITutorialSubject>) => {
    const res = await api.put<{
      data: { subject: ITutorialSubject };
    }>(`/admin/tutorials/subjects/${slug}`, payload);
    return res.data.data.subject;
  },

  deleteSubject: async (slug: string) => {
    const res = await api.delete(`/admin/tutorials/subjects/${slug}`);
    return res.data;
  },

  togglePublishSubject: async (slug: string) => {
    const res = await api.patch<{
      data: { isPublished: boolean };
    }>(`/admin/tutorials/subjects/${slug}/publish`);
    return res.data.data;
  },

  // --- Chapter Management ---
  getTutorials: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    status?: string;
  }) => {
    const res = await api.get<{
      data: { tutorials: any[]; pagination: CoursePagination };
    }>('/admin/tutorials', { params });
    return res.data.data;
  },

  getTutorialById: async (id: string) => {
    const res = await api.get<{ data: { tutorial: ITutorialDetail } }>(`/admin/tutorials/${id}`);
    return res.data.data.tutorial;
  },

  createTutorial: async (payload: any) => {
    const res = await api.post<{ data: { tutorial: ITutorialDetail } }>('/admin/tutorials', payload);
    return res.data.data.tutorial;
  },

  updateTutorial: async (id: string, payload: any) => {
    const res = await api.put<{ data: { tutorial: ITutorialDetail } }>(`/admin/tutorials/${id}`, payload);
    return res.data.data.tutorial;
  },

  deleteTutorial: async (id: string) => {
    const res = await api.delete(`/admin/tutorials/${id}`);
    return res.data;
  },

  publishTutorial: async (id: string) => {
    const res = await api.patch<{ data: { isPublished: boolean } }>(`/admin/tutorials/${id}/publish`);
    return res.data.data;
  },

  unpublishTutorial: async (id: string) => {
    const res = await api.patch<{ data: { isPublished: boolean } }>(`/admin/tutorials/${id}/unpublish`);
    return res.data.data;
  },
};
