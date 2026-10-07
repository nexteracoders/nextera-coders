import { api } from './api';

export interface FooterLinkItem {
  _id: string;
  column: string;
  columnTitle: string;
  title: string;
  url: string;
  badge?: string;
  badgeType?: 'hot' | 'live' | 'free' | 'vip' | 'amber' | 'emerald' | 'cyan' | 'purple' | 'rose' | 'default';
  order: number;
  isActive: boolean;
  isExternal: boolean;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FooterGroupedResponse {
  grouped: Record<string, { columnKey: string; columnTitle: string; links: FooterLinkItem[] }>;
  allLinks: FooterLinkItem[];
}

export interface AdminFooterResponse {
  links: FooterLinkItem[];
  total: number;
  availableColumns: string[];
}

export interface CreateFooterLinkPayload {
  column: string;
  columnTitle?: string;
  title: string;
  url: string;
  badge?: string;
  badgeType?: string;
  order?: number;
  isActive?: boolean;
  isExternal?: boolean;
  description?: string;
}

export interface UpdateFooterLinkPayload extends Partial<CreateFooterLinkPayload> {}

export const footerService = {
  /**
   * Fetch public footer links grouped by column
   */
  async getPublicLinks(): Promise<FooterGroupedResponse> {
    const response = await api.get('/footer');
    return response.data.data;
  },

  /**
   * Fetch all footer links for admin management
   */
  async getAdminLinks(column?: string): Promise<AdminFooterResponse> {
    const url = column && column !== 'all' ? `/footer/admin?column=${encodeURIComponent(column)}` : '/footer/admin';
    const response = await api.get(url);
    return response.data.data;
  },

  /**
   * Create a new footer link
   */
  async createLink(payload: CreateFooterLinkPayload): Promise<FooterLinkItem> {
    const response = await api.post('/footer/admin', payload);
    return response.data.data;
  },

  /**
   * Update an existing footer link
   */
  async updateLink(id: string, payload: UpdateFooterLinkPayload): Promise<FooterLinkItem> {
    const response = await api.put(`/footer/admin/${id}`, payload);
    return response.data.data;
  },

  /**
   * Delete a footer link
   */
  async deleteLink(id: string): Promise<{ deletedId: string }> {
    const response = await api.delete(`/footer/admin/${id}`);
    return response.data.data;
  },

  /**
   * Reset default footer links
   */
  async resetDefaults(): Promise<{ seededCount: number }> {
    const response = await api.post('/footer/admin/seed');
    return response.data.data;
  },
};
