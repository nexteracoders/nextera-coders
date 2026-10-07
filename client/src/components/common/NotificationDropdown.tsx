import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../../services/notification.service';
import { socketService } from '../../services/socket.service';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../ui/Toast';
import { INotificationItem } from '../../types/notification.types';
import {
  Bell,
  CheckCheck,
  Trophy,
  Award,
  HelpCircle,
  BookOpen,
  Sparkles,
  ChevronRight,
  Briefcase,
} from 'lucide-react';
import { cn } from '../../utils/cn';

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<INotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasNewAlert, setHasNewAlert] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { info, success } = useToast();

  const fetchUnread = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // Ignore if unauthenticated
    }
  };

  const fetchRecent = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getNotifications({ limit: 6 });
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  // Sync user authentication with real-time socket engine
  useEffect(() => {
    if (user?.id) {
      socketService.authenticate(user.id);
    }
  }, [user?.id]);

  // Real-time Push Notification Listener + Polling Fallback
  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // 30s fallback interval

    // Listen for live instant notifications from Socket.io
    const unsubscribe = socketService.onNotification((newNotif) => {
      setUnreadCount((prev) => prev + 1);
      setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== newNotif.id)].slice(0, 8));
      setHasNewAlert(true);
      setTimeout(() => setHasNewAlert(false), 4000);

      // Instant interactive desktop toast notification
      if (newNotif.type === 'ACHIEVEMENT' || newNotif.type === 'CERTIFICATE' || newNotif.type === 'PAYMENT') {
        success(newNotif.message, newNotif.title);
      } else {
        info(newNotif.message, newNotif.title);
      }
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [info, success]);

  useEffect(() => {
    if (isOpen) {
      fetchRecent();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
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
      setIsOpen(false);
      if (item.link) {
        navigate(item.link);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'CAREER':
        return <Briefcase className="w-4 h-4 text-amber-500" />;
      case 'ACHIEVEMENT':
        return <Trophy className="w-4 h-4 text-amber-500" />;
      case 'CERTIFICATE':
        return <Award className="w-4 h-4 text-emerald-500" />;
      case 'QUIZ':
        return <HelpCircle className="w-4 h-4 text-purple-500" />;
      case 'COURSE':
      case 'LEARNING':
        return <BookOpen className="w-4 h-4 text-brand-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Clean Notification Icon Button (Badge positioned at outer top-right corner) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        className={cn(
          'relative p-2 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-center',
          'border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 shadow-xs',
          'dark:border-dark-800 dark:bg-dark-900 dark:hover:bg-dark-850 dark:text-slate-200 group',
          isOpen && 'ring-2 ring-brand-500/20 border-brand-500 dark:border-brand-500',
          hasNewAlert && 'ring-2 ring-brand-500 border-brand-500 animate-pulse'
        )}
        title="View Notifications"
      >
        <Bell className={cn(
          'w-4 h-4 text-slate-600 dark:text-slate-300 group-hover:text-brand-500 group-hover:rotate-12 transition-transform duration-200',
          hasNewAlert && 'text-brand-500 animate-bounce'
        )} />
        
        {/* Crisp badge sitting on outer corner with glowing pulse animation */}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4.5 min-w-[18px] items-center justify-center pointer-events-none">
            <span className="absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-60 animate-ping duration-1000" />
            <span className="relative inline-flex h-4.5 min-w-[18px] px-1 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-[10px] font-mono font-black text-white shadow-md shadow-rose-500/50 ring-2 ring-white dark:ring-dark-950 animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 sm:w-96 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-3.5 px-4 border-b border-slate-100 dark:border-dark-800 flex items-center justify-between bg-slate-50/70 dark:bg-dark-850/60">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold border border-rose-200/50 dark:border-rose-900/50">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-100 dark:divide-dark-800">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">
                <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading alerts...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center space-y-1.5">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-dark-800 flex items-center justify-center mx-auto text-slate-400 mb-2">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  All caught up!
                </p>
                <p className="text-[11px] text-slate-400 max-w-[200px] mx-auto">
                  No new notifications right now.
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={cn(
                    'p-3 px-4 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-dark-850 transition-colors cursor-pointer group',
                    !item.isRead && 'bg-brand-50/40 dark:bg-brand-950/20'
                  )}
                >
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-dark-800 shrink-0 group-hover:scale-105 transition-transform">
                    {getIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {item.title}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {new Date(item.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>
                  </div>
                  {!item.isRead && (
                    <div className="w-2 h-2 rounded-full bg-brand-500 shrink-0 self-center" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2 px-3 border-t border-slate-100 dark:border-dark-800 bg-slate-50/50 dark:bg-dark-900/50 text-center">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/notifications');
              }}
              className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>View All Notifications</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
