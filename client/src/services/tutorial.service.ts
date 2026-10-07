import api from './api';
import {
  ITutorialDetail,
  ITutorialListResponse,
  ITutorialCategory,
  ITutorialSummary,
} from '../types/tutorial.types';

export const tutorialService = {
  getTutorials: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    tag?: string;
    type?: string;
  }) => {
    const res = await api.get<{ data: ITutorialListResponse }>('/tutorials', { params });
    return res.data.data;
  },

  getTutorialBySlug: async (slug: string) => {
    const res = await api.get<{
      data: { tutorial: ITutorialDetail; relatedTutorials: ITutorialSummary[] };
    }>(`/tutorials/${slug}`);
    return res.data.data;
  },

  getTutorialCategories: async () => {
    const res = await api.get<{ data: { categories: ITutorialCategory[] } }>('/tutorials/categories');
    return res.data.data.categories;
  },
};
