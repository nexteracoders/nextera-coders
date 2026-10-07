import { CoursePagination } from './course.types';

export type NotificationType =
  | 'COURSE'
  | 'QUIZ'
  | 'ACHIEVEMENT'
  | 'CERTIFICATE'
  | 'ANNOUNCEMENT'
  | 'SYSTEM'
  | 'LEARNING'
  | 'PAYMENT'
  | 'WELCOME'
  | 'CAREER';

export interface INotificationItem {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface INotificationListResponse {
  notifications: INotificationItem[];
  unreadCount: number;
  pagination: CoursePagination;
}

export type NotificationItem = INotificationItem;
