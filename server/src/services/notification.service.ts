import { Types } from 'mongoose';
import { Notification, INotification, NotificationType } from '../models/notification.model';
import { User } from '../models/user.model';
import { ApiError } from '../utils/apiError';
import { socketService } from './socket.service';

export interface CreateNotificationParams {
  userId: string | Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  referenceType?: string;
  referenceId?: string;
}

export class NotificationService {
  /**
   * Create a notification for a user (Idempotent if referenceType & referenceId provided)
   */
  async createNotification(params: CreateNotificationParams): Promise<INotification> {
    const { userId, title, message, type, link, referenceType, referenceId } = params;

    if (referenceType && referenceId) {
      const existing = await Notification.findOne({
        userId,
        referenceType,
        referenceId,
      });

      if (existing) {
        return existing;
      }
    }

    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      link,
      referenceType,
      referenceId,
      isRead: false,
    });

    try {
      socketService.emitNotification(userId.toString(), {
        id: notification._id.toString(),
        title: notification.title,
        message: notification.message,
        type: notification.type,
        link: notification.link || null,
        isRead: false,
        createdAt: notification.createdAt,
      });
    } catch (socketErr) {
      // Non-blocking socket push failover
    }

    return notification;
  }

  /**
   * Get paginated notifications for a user
   */
  async getUserNotifications(
    userId: string | Types.ObjectId,
    options: { page?: number; limit?: number; unreadOnly?: boolean } = {}
  ) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(50, options.limit || 15));
    const skip = (page - 1) * limit;

    const query: any = { userId };
    if (options.unreadOnly) {
      query.isRead = false;
    }

    const [notifications, totalItems, unreadCount] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ userId, isRead: false }),
    ]);

    const formatted = notifications.map((n) => ({
      id: n._id.toString(),
      title: n.title,
      message: n.message,
      type: n.type,
      link: n.link || null,
      isRead: n.isRead,
      createdAt: n.createdAt,
    }));

    return {
      notifications: formatted,
      unreadCount,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit) || 1,
        totalItems,
        limit,
      },
    };
  }

  /**
   * Get unread count for badge
   */
  async getUnreadCount(userId: string | Types.ObjectId): Promise<number> {
    return Notification.countDocuments({ userId, isRead: false });
  }

  /**
   * Mark single notification as read
   */
  async markAsRead(notificationId: string, userId: string | Types.ObjectId): Promise<INotification> {
    if (!Types.ObjectId.isValid(notificationId)) {
      throw ApiError.badRequest('Invalid notification ID format');
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      throw ApiError.notFound('Notification not found');
    }

    return notification;
  }

  /**
   * Mark all notifications for a user as read
   */
  async markAllAsRead(userId: string | Types.ObjectId): Promise<{ updatedCount: number }> {
    const result = await Notification.updateMany({ userId, isRead: false }, { isRead: true });
    return { updatedCount: result.modifiedCount };
  }

  /**
   * Delete single notification
   */
  async deleteNotification(notificationId: string, userId: string | Types.ObjectId): Promise<void> {
    if (!Types.ObjectId.isValid(notificationId)) {
      throw ApiError.badRequest('Invalid notification ID format');
    }

    const deleted = await Notification.findOneAndDelete({ _id: notificationId, userId });
    if (!deleted) {
      throw ApiError.notFound('Notification not found');
    }
  }

  /**
   * Broadcast announcement notification to all users
   */
  async broadcastAnnouncement(title: string, message: string, link?: string): Promise<number> {
    const users = await User.find({ role: 'student' }).select('_id').lean();
    if (users.length === 0) return 0;

    const docs = users.map((u) => ({
      userId: u._id,
      title,
      message,
      type: 'ANNOUNCEMENT' as NotificationType,
      link,
      isRead: false,
    }));

    const result = await Notification.insertMany(docs);
    return result.length;
  }

  /**
   * Broadcast notification to all Admin users & Platform Owner
   */
  async notifyAdmins(params: {
    title: string;
    message: string;
    type?: NotificationType;
    link?: string;
    referenceType?: string;
    referenceId?: string;
  }): Promise<number> {
    try {
      const admins = await User.find({
        $or: [{ role: 'admin' }, { email: 'nexteracoders@gmail.com' }],
      })
        .select('_id email')
        .lean();

      if (!admins || admins.length === 0) return 0;

      const notifLink = params.link || '/admin/students';

      const docs = admins.map((admin) => ({
        userId: admin._id,
        title: params.title,
        message: params.message,
        type: (params.type || 'SYSTEM') as NotificationType,
        link: notifLink,
        referenceType: params.referenceType,
        referenceId: params.referenceId,
        isRead: false,
      }));

      const result = await Notification.insertMany(docs);

      // Emit real-time notification to all active admin sockets
      for (const admin of admins) {
        try {
          socketService.emitNotification(admin._id.toString(), {
            title: params.title,
            message: params.message,
            type: params.type || 'SYSTEM',
            link: notifLink,
            isRead: false,
            createdAt: new Date(),
          });
        } catch {
          // non-blocking
        }
      }

      return result.length;
    } catch {
      return 0;
    }
  }
}

export const notificationService = new NotificationService();
