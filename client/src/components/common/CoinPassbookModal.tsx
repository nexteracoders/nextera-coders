import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coins,
  X,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  Trophy,
  Crown,
  Gift,
  ShieldCheck,
  Code2,
  BookOpen,
  HelpCircle,
  Calendar,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle2,
  Info,
  ChevronDown,
} from 'lucide-react';
import { achievementService } from '../../services/achievement.service';
import { cn } from '../../utils/cn';

export interface CoinPassbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBalance?: number;
}

// Global Event Helper to open passbook from anywhere in the app
export const openCoinPassbook = () => {
  window.dispatchEvent(new CustomEvent('open-coin-passbook'));
};

interface TransactionItem {
  id: string;
  amount: number;
  type: string;
  referenceType?: string;
  referenceId?: string;
  description: string;
  createdAt: string | Date;
}

export const CoinPassbookModal: React.FC<CoinPassbookModalProps> = ({
  isOpen,
  onClose,
  initialBalance,
}) => {
  const [mounted, setMounted] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [totalPoints, setTotalPoints] = useState<number>(initialBalance ?? 0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [activeTab, setActiveTab] = useState<'all' | 'credit' | 'debit'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showEarnGuide, setShowEarnGuide] = useState<boolean>(false);

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const limit = 20;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch points from real MongoDB API
  const fetchPassbookData = useCallback(async (targetPage: number = 1, showSpinner: boolean = true) => {
    try {
      if (showSpinner) setIsLoading(true);
      setError(null);

      const res = await achievementService.getPointHistory(targetPage, limit);
      if (res) {
        setTransactions(res.transactions || []);
        if (typeof res.totalPoints === 'number') {
          setTotalPoints(res.totalPoints);
        }
        if (res.pagination) {
          setPage(res.pagination.currentPage || targetPage);
          setTotalPages(res.pagination.totalPages || 1);
          setTotalItems(res.pagination.totalItems || 0);
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to fetch transaction history. Please retry.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [limit]);

  useEffect(() => {
    if (isOpen) {
      fetchPassbookData(1, true);
    }
  }, [isOpen, fetchPassbookData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchPassbookData(page, false);
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Compute Credits vs Debits breakdown
  const stats = useMemo(() => {
    let credits = 0;
    let debits = 0;
    transactions.forEach((tx) => {
      if (tx.amount > 0) credits += tx.amount;
      else if (tx.amount < 0) debits += Math.abs(tx.amount);
    });
    return { credits, debits };
  }, [transactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Tab filter
      if (activeTab === 'credit' && tx.amount <= 0) return false;
      if (activeTab === 'debit' && tx.amount >= 0) return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesDesc = tx.description?.toLowerCase().includes(query);
        const matchesType = tx.type?.toLowerCase().includes(query);
        const matchesRef = tx.referenceId?.toLowerCase().includes(query) || tx.referenceType?.toLowerCase().includes(query);
        return matchesDesc || matchesType || matchesRef;
      }
      return true;
    });
  }, [transactions, activeTab, searchQuery]);

  // Helper: Format transaction visual style
  const getTransactionVisuals = (tx: TransactionItem) => {
    const type = tx.type;
    switch (type) {
      case 'STREAK_BONUS':
        return {
          icon: <Flame className="w-4 h-4 text-amber-500" />,
          badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
          category: 'POTD Streak Reward',
        };
      case 'CONTEST_REWARD':
        return {
          icon: <Trophy className="w-4 h-4 text-purple-500" />,
          badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
          category: 'Contest Reward',
        };
      case 'PRIME_DUEL_WIN':
        return {
          icon: <Crown className="w-4 h-4 text-amber-400" />,
          badgeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30',
          category: 'Prime Duel Win',
        };
      case 'PRIME_DUEL_ENTRY':
        return {
          icon: <ArrowDownRight className="w-4 h-4 text-rose-500" />,
          badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
          category: 'Prime Entry Stake',
        };
      case 'PRIME_DUEL_REFUND':
        return {
          icon: <ShieldCheck className="w-4 h-4 text-blue-500" />,
          badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
          category: 'Match Refund',
        };
      case 'SWAG_REDEEM':
        return {
          icon: <Gift className="w-4 h-4 text-pink-500" />,
          badgeColor: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
          category: 'Merch / Perk Store',
        };
      case 'ADMIN_ADJUSTMENT':
        return {
          icon: <ShieldCheck className="w-4 h-4 text-indigo-500" />,
          badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
          category: 'Admin Adjustment',
        };
      case 'JOINING_BONUS':
        return {
          icon: <Gift className="w-4 h-4 text-amber-500" />,
          badgeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30',
          category: '🎁 1st Problem Welcome Bonus',
        };
      case 'PROBLEM_SOLVED':
        return {
          icon: <Code2 className="w-4 h-4 text-emerald-500" />,
          badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          category: 'Problem Solved',
        };
      case 'LESSON_COMPLETE':
        return {
          icon: <BookOpen className="w-4 h-4 text-cyan-500" />,
          badgeColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
          category: 'Lesson Complete',
        };
      case 'QUIZ_COMPLETE':
        return {
          icon: <HelpCircle className="w-4 h-4 text-blue-500" />,
          badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
          category: 'Quiz Complete',
        };
      default:
        return {
          icon: tx.amount >= 0 ? <ArrowUpRight className="w-4 h-4 text-emerald-500" /> : <ArrowDownRight className="w-4 h-4 text-rose-500" />,
          badgeColor: tx.amount >= 0 ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border-rose-500/20',
          category: tx.type.replace(/_/g, ' '),
        };
    }
  };

  // Only render via portal to escape parent overflow or backdrop-filter
  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
          style={{ cursor: 'default' }}
        >
          {/* Modal Container: Guaranteed dead-center positioning */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'relative w-full max-w-2xl my-auto flex flex-col rounded-3xl overflow-hidden shadow-2xl',
              'bg-white dark:bg-[#0f1222] border border-slate-200 dark:border-slate-800'
            )}
            style={{ maxHeight: '88vh' }}
          >
            {/* 1. MODAL HEADER */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-[#14182b]/90 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20">
                  <Coins className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>NEC Coins Passbook</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30">
                      LIVE LEDGER
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Real-time transaction history from MongoDB
                  </p>
                </div>
              </div>

              {/* Actions: Refresh & Close Button */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={isRefreshing || isLoading}
                  title="Refresh Balance & Ledger"
                  style={{ cursor: 'pointer' }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw className={cn('w-3.5 h-3.5', isRefreshing && 'animate-spin text-amber-500')} />
                  <span className="hidden sm:inline">Sync</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  style={{ cursor: 'pointer' }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200/80 hover:bg-rose-500/10 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-500/20 dark:hover:text-rose-400 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer shadow-xs active:scale-95"
                  title="Close Passbook"
                >
                  <X className="w-4 h-4" />
                  <span>Close</span>
                </button>
              </div>
            </div>

            {/* 2. LIVE WALLET BALANCE SPOTLIGHT BANNER */}
            <div className="px-5 sm:px-6 pt-4 pb-2 shrink-0">
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-yellow-500/5 to-transparent border border-amber-500/30 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Available Wallet Balance</span>
                    </span>
                    <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-mono flex items-baseline gap-2 pt-1">
                      <span>{totalPoints.toLocaleString()}</span>
                      <span className="text-amber-500 dark:text-amber-400 text-lg font-bold font-sans">Coins 🪙</span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-1 font-mono">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Verified Database Balance • Fraud-Protected</span>
                    </div>
                  </div>

                  {/* Quick Credits vs Debits Summary */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="px-3.5 py-2 rounded-xl bg-white/80 dark:bg-[#171b30]/80 border border-slate-200 dark:border-slate-800 text-center min-w-[90px]">
                      <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-0.5">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>+{stats.credits}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Earned</div>
                    </div>

                    <div className="px-3.5 py-2 rounded-xl bg-white/80 dark:bg-[#171b30]/80 border border-slate-200 dark:border-slate-800 text-center min-w-[90px]">
                      <div className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 flex items-center justify-center gap-0.5">
                        <ArrowDownRight className="w-3.5 h-3.5" />
                        <span>-{stats.debits}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Spent</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Collapsible "How to Earn Coins" Official Rules Banner */}
              <div className="mt-2.5">
                <button
                  type="button"
                  onClick={() => setShowEarnGuide(!showEarnGuide)}
                  style={{ cursor: 'pointer' }}
                  className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/50 hover:bg-slate-200/80 dark:hover:bg-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
                    <Info className="w-3.5 h-3.5" />
                    <span>How can students win / earn coins legitimately?</span>
                  </span>
                  <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200', showEarnGuide && 'rotate-180')} />
                </button>

                {showEarnGuide && (
                  <div className="mt-1.5 p-3.5 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/25 text-xs text-slate-700 dark:text-neutral-300 space-y-2 animate-in fade-in duration-150 font-sans">
                    <div className="flex items-start gap-2">
                      <Flame className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900 dark:text-white">1. Daily POTD Streak:</strong> Solve today's Problem of the Day challenge to earn <strong>+1 Coin</strong> daily, plus <strong>+7 Bonus Coins</strong> on every 7-day continuous streak (7, 14, 21, 28... days).
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Trophy className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900 dark:text-white">2. Weekly Sunday Contests:</strong> Participate in official contests and pass 100% of test cases to earn <strong>+50 to +100 Coins</strong> per contest.
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Crown className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900 dark:text-white">3. 👑 NEC Prime Battles:</strong> High-stakes DSA Arena (50-5000 coins) where winner takes the net prize pool (after 10% platform cut).
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Gift className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900 dark:text-white">4. 🎁 Lifetime Welcome Bonus:</strong> Solve your very first DSA coding practice problem on the platform to claim a one-time welcome bonus of <strong>+50 NEC Coins</strong>. (Subsequent practice problems award XP towards your level).
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900 dark:text-white">5. Monthly Tournaments:</strong> Top leaderboard finishes in official monthly contests award grand coin prize pools.
                      </div>
                    </div>
                    <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 pt-1 border-t border-amber-500/20">
                      ⚡ <strong>Important Rule:</strong> Standard Code Battle is 100% Free Practice (0 coins won, 0 coins lost). Lessons, Quizzes & Courses award XP (Experience Points) towards your rank.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 3. TABS & SEARCH CONTROLS */}
            <div className="px-5 sm:px-6 py-2.5 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              {/* Tab Pills */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#161a2e] border border-slate-200 dark:border-slate-800 self-start text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  style={{ cursor: 'pointer' }}
                  className={cn(
                    'px-3 py-1.5 rounded-lg transition-all cursor-pointer',
                    activeTab === 'all'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  All ({transactions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('credit')}
                  style={{ cursor: 'pointer' }}
                  className={cn(
                    'px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer',
                    activeTab === 'credit'
                      ? 'bg-emerald-500 text-white shadow-xs font-bold'
                      : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                  )}
                >
                  <ArrowUpRight className="w-3 h-3" />
                  <span>Credits (+)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('debit')}
                  style={{ cursor: 'pointer' }}
                  className={cn(
                    'px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer',
                    activeTab === 'debit'
                      ? 'bg-rose-500 text-white shadow-xs font-bold'
                      : 'text-rose-600 dark:text-rose-400 hover:bg-rose-500/10'
                  )}
                >
                  <ArrowDownRight className="w-3 h-3" />
                  <span>Debits (-)</span>
                </button>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search ledger..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-[#161a2e] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* 4. TRANSACTIONS LIST (SCROLLABLE) */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-2 space-y-2 min-h-[220px]">
              {isLoading ? (
                // Loading Skeleton
                <div className="space-y-2.5 py-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 animate-pulse flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700" />
                        <div className="space-y-1.5">
                          <div className="w-32 h-3.5 rounded bg-slate-200 dark:bg-slate-700" />
                          <div className="w-48 h-2.5 rounded bg-slate-200 dark:bg-slate-700" />
                        </div>
                      </div>
                      <div className="w-16 h-5 rounded bg-slate-200 dark:bg-slate-700" />
                    </div>
                  ))}
                </div>
              ) : error ? (
                // Error State
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
                    <Info className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-rose-500">{error}</p>
                  <button
                    type="button"
                    onClick={() => fetchPassbookData(page, true)}
                    style={{ cursor: 'pointer' }}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs cursor-pointer shadow-xs"
                  >
                    Retry Loading
                  </button>
                </div>
              ) : filteredTransactions.length === 0 ? (
                // Empty State
                <div className="py-10 text-center space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-3xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <Coins className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {searchQuery ? 'No matching transactions found' : 'No coin transactions recorded yet'}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto pt-1 leading-relaxed">
                      Solve daily POTD challenges, win weekly contests, or compete in NEC Prime Battles to start earning coins!
                    </p>
                  </div>
                </div>
              ) : (
                // Real Dynamic Transactions
                filteredTransactions.map((tx) => {
                  const visuals = getTransactionVisuals(tx);
                  const isPositive = tx.amount > 0;
                  const dateStr = new Date(tx.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });
                  const timeStr = new Date(tx.createdAt).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={tx.id}
                      className="p-3 sm:p-3.5 rounded-2xl bg-slate-50/80 dark:bg-[#141729]/90 border border-slate-200/80 dark:border-slate-800 hover:border-amber-400/40 dark:hover:border-amber-500/40 transition-all flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Type Icon */}
                        <div
                          className={cn(
                            'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border',
                            visuals.badgeColor
                          )}
                        >
                          {visuals.icon}
                        </div>

                        {/* Details */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                              {tx.description}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5 font-mono flex-wrap">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{dateStr} • {timeStr}</span>
                            </span>
                            {tx.referenceId && (
                              <>
                                <span>•</span>
                                <span className="px-1.5 py-0.2 rounded bg-slate-200/70 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300">
                                  Ref: {tx.referenceId}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Coin Amount Pill */}
                      <div className="shrink-0 text-right">
                        <div
                          className={cn(
                            'px-2.5 py-1 rounded-xl font-mono font-black text-xs sm:text-sm flex items-center gap-1 border shadow-2xs',
                            isPositive
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                          )}
                        >
                          {isPositive ? (
                            <>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                              <span>+{tx.amount}</span>
                            </>
                          ) : (
                            <>
                              <ArrowDownRight className="w-3.5 h-3.5" />
                              <span>{tx.amount}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* 5. PAGINATION & FOOTER RULES */}
            <div className="px-5 sm:px-6 py-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#14182b]/80 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Standard Code Battle is 100% Free (0 Coins) • Prime Battles use coin stakes.</span>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-2 font-mono">
                  <button
                    type="button"
                    disabled={page <= 1 || isLoading}
                    onClick={() => fetchPassbookData(page - 1, true)}
                    style={{ cursor: page <= 1 || isLoading ? 'not-allowed' : 'pointer' }}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="text-[11px]">
                    Page {page} of {totalPages} ({totalItems} records)
                  </span>

                  <button
                    type="button"
                    disabled={page >= totalPages || isLoading}
                    onClick={() => fetchPassbookData(page + 1, true)}
                    style={{ cursor: page >= totalPages || isLoading ? 'not-allowed' : 'pointer' }}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
