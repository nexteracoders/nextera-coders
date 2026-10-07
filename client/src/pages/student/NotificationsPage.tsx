import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../components/ui/Toast';
import { notificationService } from '../../services/notification.service';
import { socketService } from '../../services/socket.service';
import { INotificationItem } from '../../types/notification.types';
import { CoursePagination } from '../../types/course.types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import {
  Bell,
  CheckCheck,
  Trash2,
  Trophy,
  Award,
  HelpCircle,
  BookOpen,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Briefcase,
} from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  useDocumentTitle('Notifications — NextEra Coders');

  const { success } = useToast();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<INotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [pagination, setPagination] = useState<CoursePagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 15,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(
    async (page: number = 1) => {
      try {
        setLoading(true);
        setError(null);
        const data = await notificationService.getNotifications({
          page,
          limit: 15,
          unread: unreadOnly,
        });
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
        setPagination(data.pagination);
      } catch (err: any) {
        setError(err.message || 'Failed to load notifications');
      } finally {
        setLoading(false);
      }
    },
    [unreadOnly]
  );

  useEffect(() => {
    fetchNotifications(1);

    const unsubscribe = socketService.onNotification((newNotif) => {
      setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== newNotif.id)]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      unsubscribe();
    };
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      success('All notifications marked as read', 'Updated');
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (item: INotificationItem) => {
    try {
      if (!item.isRead) {
        await notificationService.markAsRead(item.id);
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
        );
      }
      if (item.link) {
        navigate(item.link);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await notificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      success('Notification deleted', 'Removed');
    } catch (err: any) {
      console.error(err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'CAREER':
        return <Briefcase className="w-5 h-5 text-amber-500" />;
      case 'ACHIEVEMENT':
        return <Trophy className="w-5 h-5 text-amber-500" />;
      case 'CERTIFICATE':
        return <Award className="w-5 h-5 text-emerald-500" />;
      case 'QUIZ':
        return <HelpCircle className="w-5 h-5 text-purple-500" />;
      case 'COURSE':
      case 'LEARNING':
        return <BookOpen className="w-5 h-5 text-brand-500" />;
      default:
        return <Sparkles className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Notifications
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Stay updated with course releases, quiz scores, certificates, and achievements.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            leftIcon={<CheckCheck className="w-4 h-4" />}
            className="font-mono text-xs"
          >
            Mark all as read
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-dark-800 pb-3">
        <button
          onClick={() => setUnreadOnly(false)}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold transition-colors ${
            !unreadOnly
              ? 'bg-brand-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-850'
          }`}
        >
          All Notifications
        </button>

        <button
          onClick={() => setUnreadOnly(true)}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 ${
            unreadOnly
              ? 'bg-brand-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-850'
          }`}
        >
          <span>Unread Only</span>
          {unreadCount > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                unreadOnly ? 'bg-white/20 text-white' : 'bg-brand-50 text-brand-600 dark:bg-brand-950'
              }`}
            >
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <ErrorState
          title="Error Loading Notifications"
          message={error}
          onRetry={() => fetchNotifications(1)}
        />
      )}

      {/* Notifications List */}
      {!loading && !error && notifications.length > 0 && (
        <div className="space-y-3">
          {notifications.map((item) => (
            <Card
              key={item.id}
              variant="elevated"
              onClick={() => handleNotificationClick(item)}
              className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition-all duration-200 cursor-pointer hover:border-brand-500/40 dark:hover:border-brand-500/40 group ${
                !item.isRead
                  ? 'bg-brand-50/40 dark:bg-brand-950/20 border-brand-500/30 dark:border-brand-500/30 shadow-sm'
                  : 'border-slate-200 dark:border-dark-800'
              }`}
            >
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-dark-850 shrink-0 mt-0.5">
                  {getIcon(item.type)}
                </div>

                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {item.title}
                    </h3>
                    {!item.isRead && (
                      <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.message}
                  </p>

                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 pt-1">
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>
                      {new Date(item.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {item.link && (
                      <>
                        <span>•</span>
                        <span className="text-brand-600 dark:text-brand-400 font-semibold flex items-center gap-0.5">
                          View details <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={(e) => handleDelete(e, item.id)}
                  title="Delete Notification"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && notifications.length === 0 && (
        <EmptyState
          icon={<Bell className="w-8 h-8 text-slate-400" />}
          title="You're all caught up"
          description={
            unreadOnly
              ? 'No unread notifications at this time.'
              : 'You have no notifications yet. Keep learning and completing milestones!'
          }
          actionLabel={unreadOnly ? 'Show All Notifications' : undefined}
          onAction={unreadOnly ? () => setUnreadOnly(false) : undefined}
        />
      )}

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-6 font-mono text-xs">
          <span className="text-slate-400">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.currentPage <= 1}
              onClick={() => fetchNotifications(pagination.currentPage - 1)}
              leftIcon={<ChevronLeft className="w-4 h-4" />}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.currentPage >= pagination.totalPages}
              onClick={() => fetchNotifications(pagination.currentPage + 1)}
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
