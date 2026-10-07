import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

// @desc    Get current student's notifications
// @route   GET /api/notifications
// @access  Protected (Student / User)
export const getMyNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const unreadOnly = req.query.unread === 'true';

    const result = await notificationService.getUserNotifications(user._id, {
      page,
      limit,
      unreadOnly,
    });

    ApiResponse.success(res, 'Notifications retrieved successfully', result, 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Protected (Student / User)
export const getUnreadCount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const unreadCount = await notificationService.getUnreadCount(user._id);

    ApiResponse.success(res, 'Unread count retrieved', { unreadCount }, 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Mark single notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Protected (Student / User)
export const markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const notification = await notificationService.markAsRead(id, user._id);

    ApiResponse.success(
      res,
      'Notification marked as read',
      {
        notification: {
          id: notification._id.toString(),
          isRead: notification.isRead,
        },
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all notifications for current user as read
// @route   PATCH /api/notifications/read-all
// @access  Protected (Student / User)
export const markAllAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const result = await notificationService.markAllAsRead(user._id);

    ApiResponse.success(res, 'All notifications marked as read', result, 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete single notification
// @route   DELETE /api/notifications/:id
// @access  Protected (Student / User)
export const deleteNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;

    await notificationService.deleteNotification(id, user._id);

    ApiResponse.success(res, 'Notification deleted successfully', null, 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Broadcast announcement notification to all students
// @route   POST /api/admin/announcements
// @access  Protected (Admin)
export const createAnnouncement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, message, link } = req.body;

    if (!title || !message) {
      throw ApiError.badRequest('Title and message are required for announcement');
    }

    const broadcastedCount = await notificationService.broadcastAnnouncement(title, message, link);

    ApiResponse.success(
      res,
      `Announcement broadcasted to ${broadcastedCount} students`,
      { broadcastedCount },
      201
    );
  } catch (error) {
    next(error);
  }
};
