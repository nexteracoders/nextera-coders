import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Trophy,
  Flame,
  Search,
  X,
  GraduationCap,
  Crown,
  ExternalLink,
  Users,
  Sparkles,
  Clock,
} from 'lucide-react';
import { cn } from '../../utils/cn';

export interface LeaderboardStudentItem {
  rank: number;
  userId: string;
  username: string;
  name: string;
  avatar: string;
  college: string;
  badge?: string;
  isCurrentUser?: boolean;

  // Streak metrics
  streak?: number;
  longestStreak?: number;
  totalSolved?: number;

  // Contest metrics
  score?: number;
  finishTime?: string;
  problemsCleared?: number;
  totalProblems?: number;
  integrityScore?: number;

  // Earnings
  coinsWon?: number;
}

interface FullLeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'streak' | 'weekly' | 'monthly';
  title: string;
  subtitle?: string;
  students: LeaderboardStudentItem[];
  onSelectStudent?: (student: LeaderboardStudentItem) => void;
  currentUserId?: string;
}

export const FullLeaderboardModal: React.FC<FullLeaderboardModalProps> = ({
  isOpen,
  onClose,
  type,
  title,
  subtitle,
  students,
  onSelectStudent,
  currentUserId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'top10' | 'special'>('all');
  const listRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Reset search when opened
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setActiveFilter('all');
    }
  }, [isOpen]);

  // Filter students based on search and tabs
  const filteredStudents = useMemo(() => {
    let result = [...students];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.username.toLowerCase().includes(q) ||
          s.college.toLowerCase().includes(q) ||
          `#${s.rank}`.includes(q) ||
          String(s.rank) === q
      );
    }

    // Quick category filters
    if (activeFilter === 'top10') {
      result = result.filter((s) => s.rank <= 10);
    } else if (activeFilter === 'special') {
      if (type === 'streak') {
        // Century club (100+ days)
        result = result.filter((s) => (s.streak || 0) >= 100);
      } else {
        // Top podium / high score
        result = result.filter((s) => s.rank <= 3 || (s.score || 0) >= 100);
      }
    }

    return result;
  }, [students, searchQuery, activeFilter, type]);

  // Current user item in the list
  const currentUserItem = useMemo(() => {
    return students.find((s) => s.isCurrentUser || (currentUserId && s.userId === currentUserId));
  }, [students, currentUserId]);

  const handleScrollToMe = () => {
    if (!currentUserItem) return;
    setSearchQuery(currentUserItem.name);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Center Modal Dialog Container */}
      <div
        className={cn(
          'relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-[#111319] border border-slate-200/90 dark:border-slate-800/90 rounded-3xl shadow-2xl flex flex-col overflow-hidden z-10 transition-all transform animate-in zoom-in-95 duration-200'
        )}
      >
        {/* Top Multi-color Gradient Accent Line */}
        <div
          className={cn(
            'absolute inset-x-0 top-0 h-1 bg-gradient-to-r',
            type === 'streak'
              ? 'from-amber-500 via-orange-500 to-amber-600'
              : type === 'weekly'
              ? 'from-amber-500 via-yellow-400 to-amber-600'
              : 'from-blue-600 via-indigo-500 to-purple-600'
          )}
        />

        {/* 1. MODAL HEADER */}
        <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 dark:border-slate-800/80 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={cn(
                'w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border shadow-xs',
                type === 'streak'
                  ? 'bg-orange-500/10 dark:bg-orange-500/20 text-orange-500 border-orange-500/30'
                  : type === 'weekly'
                  ? 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 border-amber-500/30'
                  : 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-500 border-blue-500/30'
              )}
            >
              {type === 'streak' ? (
                <Flame className="w-6 h-6 fill-orange-500 text-orange-500 animate-pulse" />
              ) : (
                <Trophy className="w-6 h-6 text-amber-500" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {title}
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-400 font-mono text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Live Standings</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {subtitle || `Scroll through all ${students.length} verified students & competitors`}
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Leaderboard Modal"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. CONTROLS TOOLBAR: SEARCH & QUICK FILTERS */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-50/70 dark:bg-[#14161f] border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student by name, username, college..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-white dark:bg-[#1a1d27] border border-slate-200 dark:border-slate-700/80 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Tabs & "My Rank" Jump */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-white dark:bg-[#1a1d27] p-1 rounded-xl border border-slate-200 dark:border-slate-700/80">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                  activeFilter === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                All ({students.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('top10')}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                  activeFilter === 'top10'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                Top 10
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('special')}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                  activeFilter === 'special'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                {type === 'streak' ? '100+ Days 🔥' : 'Podium 🥇'}
              </button>
            </div>

            {currentUserItem && (
              <button
                type="button"
                onClick={handleScrollToMe}
                className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold font-mono hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors flex items-center gap-1 cursor-pointer"
                title="Filter to find your ranking"
              >
                <span>My Rank #{currentUserItem.rank}</span>
                <span>📍</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. SCROLLABLE STUDENTS LIST */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5 max-h-[58vh] divide-y divide-transparent pr-2 sm:pr-3"
        >
          {filteredStudents.map((item) => {
            const isTop1 = item.rank === 1;
            const isTop2 = item.rank === 2;
            const isTop3 = item.rank === 3;

            return (
              <div
                key={item.userId}
                onClick={() => onSelectStudent?.(item)}
                className={cn(
                  'p-3.5 sm:p-4 rounded-2xl border transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group',
                  item.isCurrentUser
                    ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700 shadow-xs ring-1 ring-blue-500/25'
                    : isTop1
                    ? 'bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-transparent border-amber-400/80 dark:border-amber-500/40 shadow-xs'
                    : isTop2
                    ? 'bg-gradient-to-r from-slate-200/50 via-slate-100/30 to-transparent dark:from-slate-800/40 border-slate-300 dark:border-slate-700'
                    : isTop3
                    ? 'bg-gradient-to-r from-amber-700/10 via-orange-600/5 to-transparent border-amber-700/40 dark:border-amber-700/30'
                    : 'bg-slate-50/70 dark:bg-[#161822] hover:bg-slate-100/80 dark:hover:bg-[#1d1f2b] border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                )}
                title="Click to view full verified coder profile"
              >
                {/* Left: Rank, Avatar, Student Identity */}
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  {/* Rank Badge */}
                  <div className="w-8 text-center shrink-0">
                    {isTop1 ? (
                      <span className="text-xl" title="1st Place Champion">🥇</span>
                    ) : isTop2 ? (
                      <span className="text-xl" title="2nd Place Runner-Up">🥈</span>
                    ) : isTop3 ? (
                      <span className="text-xl" title="3rd Place Podium">🥉</span>
                    ) : (
                      <span className="font-mono text-xs font-bold text-slate-400 dark:text-slate-500">
                        #{item.rank}
                      </span>
                    )}
                  </div>

                  {/* Avatar with Crown for #1 */}
                  <div className="relative shrink-0">
                    <img
                      src={item.avatar}
                      alt={item.name}
                      className={cn(
                        'w-10 h-10 rounded-full object-cover border-2 shadow-xs group-hover:scale-105 transition-transform',
                        isTop1
                          ? 'border-amber-400 ring-2 ring-amber-400/20'
                          : isTop2
                          ? 'border-slate-300 dark:border-slate-600'
                          : isTop3
                          ? 'border-amber-700'
                          : 'border-slate-200 dark:border-slate-700'
                      )}
                    />
                    {isTop1 && (
                      <Crown className="w-4 h-4 fill-amber-500 text-amber-500 absolute -top-2 -right-1 animate-bounce" />
                    )}
                  </div>

                  {/* Name, Username, College */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                        {item.name}
                      </span>

                      {item.isCurrentUser && (
                        <span className="px-1.5 py-0.2 rounded-md bg-blue-600 text-white text-[9px] font-bold uppercase tracking-wider shrink-0 font-mono">
                          YOU
                        </span>
                      )}

                      {item.badge && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono truncate mt-0.5">
                      <span className="truncate">@{item.username}</span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1 truncate text-slate-600 dark:text-slate-300">
                        <GraduationCap className="w-3 h-3 text-blue-500 shrink-0" />
                        <span className="truncate">{item.college}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Specific Metric Badges based on type */}
                <div className="flex items-center gap-3 sm:gap-4 shrink-0 self-end sm:self-center">
                  {/* Daily Streak Metrics */}
                  {type === 'streak' && (
                    <div className="text-right font-mono">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 border border-orange-500/30 text-orange-600 dark:text-orange-400 text-xs font-extrabold shadow-xs">
                        <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                        <span>{item.streak} Days</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Best: {item.longestStreak}d &bull; {item.totalSolved} solved
                      </div>
                    </div>
                  )}

                  {/* Contest (Weekly or Monthly) Metrics */}
                  {(type === 'weekly' || type === 'monthly') && (
                    <div className="text-right font-mono">
                      <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {item.score !== undefined ? `${item.score} pts` : `${item.problemsCleared} Cleared`}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-end gap-1.5">
                        {item.finishTime && (
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-3 h-3" /> {item.finishTime}
                          </span>
                        )}
                        {item.coinsWon !== undefined && item.coinsWon > 0 && (
                          <span className="text-amber-500 font-bold">
                            +{item.coinsWon} 🪙
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Hover Inspect Icon */}
                  <div className="hidden sm:flex items-center text-slate-400 group-hover:text-blue-500 transition-colors pl-1">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Empty Search State */}
          {filteredStudents.length === 0 && (
            <div className="p-10 rounded-2xl bg-slate-50 dark:bg-[#151722] border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <Users className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No students found matching "{searchQuery}"
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Try searching by first name, username, or college keyword.
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Clear search query
              </button>
            </div>
          )}
        </div>

        {/* 4. MODAL FOOTER */}
        <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-[#14161f] border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>Click on any student card to open their verified coding profile & achievements.</span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="font-mono text-[11px] text-slate-400">
              Showing {filteredStudents.length} of {students.length} students
            </span>
            <button
              type="button"
              onClick={onClose}
              className="py-1.5 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
