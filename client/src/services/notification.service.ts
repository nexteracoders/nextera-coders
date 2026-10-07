import api from './api';
import { INotificationListResponse, INotificationItem } from '../types/notification.types';

export const notificationService = {
  // Get notifications with pagination and optional unread filter
  async getNotifications(options: { page?: number; limit?: number; unread?: boolean } = {}): Promise<INotificationListResponse> {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.unread) params.append('unread', 'true');

    const res = await api.get(`/notifications?${params.toString()}`);
    return res.data.data;
  },

  // Get unread count
  async getUnreadCount(): Promise<number> {
    const res = await api.get('/notifications/unread-count');
    return res.data.data.unreadCount;
  },

  // Mark single notification as read
  async markAsRead(id: string): Promise<INotificationItem> {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data.data.notification;
  },

  // Mark all notifications as read
  async markAllAsRead(): Promise<{ updatedCount: number }> {
    const res = await api.patch('/notifications/read-all');
    return res.data.data;
  },

  // Delete notification
  async deleteNotification(id: string): Promise<void> {
    await api.delete(`/notifications/${id}`);
  },
};
