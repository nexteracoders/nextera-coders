import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routes';
import {
  sundayContestService,
  PRACTICE_PROBLEMS_CATALOG,
  SundayContestProblem,
  CoderProfile,
} from '../../services/contest.service';
import {
  coinService,
  CoinWalletState,
} from '../../services/coin.service';
import { AnimatedCoinModal } from '../../components/contest/AnimatedCoinModal';
import { UserProfileModal } from '../../components/contest/UserProfileModal';
import { FullLeaderboardModal } from '../../components/contest/FullLeaderboardModal';
import {
  Flame,
  Clock,
  CheckCircle2,
  ArrowRight,
  Code2,
  Calendar,
  Gift,
  ChevronLeft,
  ChevronRight,
  Trophy,
  BookOpen,
  Sparkles,
  Search,
  ExternalLink,
  Zap,
  Target,
  Crown,
  GraduationCap,
  Users,
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface DailyArchiveItem {
  dateStr: string;
  dayNumber: number;
  monthName: string;
  year: number;
  problem: SundayContestProblem;
  companyTags: string[];
  submissionsCount: string;
  accuracyRate: string;
  isToday: boolean;
  isSolved: boolean;
}

interface StreakerItem {
  rank: number;
  userId: string;
  username: string;
  name: string;
  avatar: string;
  college: string;
  streak: number;
  longestStreak: number;
  totalSolved: number;
  coinsWon: number;
  badge: string;
  isCurrentUser?: boolean;
}

export const DailyStreakPage: React.FC = () => {
  useDocumentTitle('NEC Problem Of The Day — Daily Streak & Rewards');
  const navigate = useNavigate();
  const { user } = useAuth();

  const [wallet, setWallet] = useState<CoinWalletState>(() => coinService.getState());
  const [activeDailyProb, setActiveDailyProb] = useState<SundayContestProblem>(() =>
    sundayContestService.getDailyStreakProblem()
  );

  // Month & Year Selector for Calendar & Archive
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(() => new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'Easy' | 'Medium' | 'Hard'>('all');

  // Modals
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [selectedProfileForModal, setSelectedProfileForModal] = useState<CoderProfile | null>(null);
  const [isLeaderboardModalOpen, setIsLeaderboardModalOpen] = useState(false);

  // Time until midnight countdown timer
  const [timeUntilUnlock, setTimeUntilUnlock] = useState({ hours: 0, minutes: 0, seconds: 0, formatted: '00:00:00' });

  // Sync wallet state
  useEffect(() => {
    const unsub = coinService.subscribe(setWallet);
    return () => unsub();
  }, []);

  // Sync problem state
  useEffect(() => {
    setActiveDailyProb(sundayContestService.getDailyStreakProblem());
    const unsubContest = sundayContestService.subscribe(() => {
      setActiveDailyProb(sundayContestService.getDailyStreakProblem());
    });
    return () => unsubContest();
  }, []);

  // Countdown timer to midnight
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
      const diffMs = Math.max(0, midnight.getTime() - now.getTime());

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      const pad = (n: number) => n.toString().padStart(2, '0');
      setTimeUntilUnlock({
        hours,
        minutes,
        seconds,
        formatted: `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`,
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const now = new Date();
  const currentRealMonth = now.getMonth();
  const currentRealYear = now.getFullYear();
  const currentRealDay = now.getDate();

  // Calendar calculations
  const daysInSelectedMonth = new Date(selectedYear, selectedMonthIndex + 1, 0).getDate();
  const firstDayOfWeek = new Date(selectedYear, selectedMonthIndex, 1).getDay(); // 0 is Sunday, 1 is Monday
  const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  // Build archive list for the selected month
  const archiveItems: DailyArchiveItem[] = useMemo(() => {
    const items: DailyArchiveItem[] = [];
    const isCurrentViewingMonth = selectedMonthIndex === currentRealMonth && selectedYear === currentRealYear;
    const maxDay = isCurrentViewingMonth ? currentRealDay : daysInSelectedMonth;

    const mockCompanies = [
      ['Google', 'Amazon', 'Meta'],
      ['Zoho', 'Flipkart', 'Swiggy'],
      ['Microsoft', 'Adobe', 'Uber'],
      ['Paytm', 'Oracle', 'Salesforce'],
      ['Apple', 'Goldman Sachs', 'LinkedIn'],
    ];

    for (let day = maxDay; day >= 1; day--) {
      const isToday = isCurrentViewingMonth && day === currentRealDay;
      const probIndex = (day + selectedMonthIndex * 31) % PRACTICE_PROBLEMS_CATALOG.length;
      const catalogProb = isToday ? activeDailyProb : PRACTICE_PROBLEMS_CATALOG[probIndex] || PRACTICE_PROBLEMS_CATALOG[0];

      const problemObj: SundayContestProblem = {
        id: isToday ? activeDailyProb.id : `potd-${selectedYear}-${selectedMonthIndex + 1}-${day}`,
        number: day,
        title: isToday ? activeDailyProb.title : catalogProb.title,
        slug: isToday ? activeDailyProb.slug : catalogProb.slug,
        difficulty: catalogProb.difficulty,
        points: (catalogProb as any).points || 100,
        description: catalogProb.description || '',
        constraints: catalogProb.constraints || [],
        sampleTestCases: catalogProb.sampleTestCases || [],
        hiddenTestCases: catalogProb.hiddenTestCases || [],
        starterCode: catalogProb.starterCode || {},
      };

      const isPastDay = isCurrentViewingMonth && day < currentRealDay;
      const isTodaySolved = isToday && Boolean(wallet.claimedToday);
      const isPastSolved = isPastDay && (currentRealDay - day < (wallet.dailyStreak || 0));
      const isSolved = isTodaySolved || isPastSolved;

      const companyList = mockCompanies[day % mockCompanies.length];
      const submissions = `${Math.floor(40 + (day * 3.7) % 60)}K`;
      const accuracy = `${(45 + (day * 2.3) % 40).toFixed(1)}%`;

      items.push({
        dateStr: `${day} ${monthNames[selectedMonthIndex]}`,
        dayNumber: day,
        monthName: monthNames[selectedMonthIndex],
        year: selectedYear,
        problem: problemObj,
        companyTags: companyList,
        submissionsCount: submissions,
        accuracyRate: accuracy,
        isToday,
        isSolved,
      });
    }

    return items;
  }, [selectedMonthIndex, selectedYear, currentRealMonth, currentRealYear, currentRealDay, activeDailyProb, wallet.claimedToday, wallet.dailyStreak]);

  // Filtered archive
  const filteredArchive = useMemo(() => {
    return archiveItems.filter((item) => {
      if (difficultyFilter !== 'all' && item.problem.difficulty !== difficultyFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.problem.title.toLowerCase().includes(q);
        const matchTag = item.companyTags.some((c) => c.toLowerCase().includes(q));
        const matchDiff = item.problem.difficulty.toLowerCase().includes(q);
        if (!matchTitle && !matchTag && !matchDiff) return false;
      }
      return true;
    });
  }, [archiveItems, difficultyFilter, searchQuery]);

  // Full Streakers Leaderboard Data (for Modal & Scroll/Search)
  const allStreakers: StreakerItem[] = useMemo(() => {
    const rawList: Omit<StreakerItem, 'rank'>[] = [
      {
        userId: '6a8c5f3246f2897c4956fc99',
        username: 'sandipkrverma',
        name: 'Sandip Kr Verma',
        avatar: '',
        college: 'Ramgarh Engineering College',
        streak: 42,
        longestStreak: 42,
        totalSolved: 515,
        coinsWon: 4850,
        badge: '👑 Grandmaster',
      },
      {
        userId: '6a95745b5c11d4565f72e8d2',
        username: 'murari_verma',
        name: 'Murari Verma',
        avatar: '',
        college: 'BIT Sindri • Computer Science',
        streak: 35,
        longestStreak: 35,
        totalSolved: 452,
        coinsWon: 3920,
        badge: '🥈 Master',
      },
      {
        userId: '6a9576cc5c11d4565f72ee21',
        username: 'vipul_raj',
        name: 'Vipul Raj',
        avatar: '',
        college: 'NIT Jamshedpur • IT',
        streak: 28,
        longestStreak: 30,
        totalSolved: 400,
        coinsWon: 3100,
        badge: '🥉 Elite',
      },
      {
        userId: '6aa6d9c3910843570702f53f',
        username: 'utkarsh_kumar',
        name: 'Utkarsh Kumar',
        avatar: '',
        college: 'IIIT Ranchi • CSE',
        streak: 24,
        longestStreak: 25,
        totalSolved: 340,
        coinsWon: 2450,
        badge: '🔥 Century',
      },
      {
        userId: '6a957b592876e16538fa338c',
        username: 'nexteracoders',
        name: 'NextEra Coders Administrator',
        avatar: 'https://lh3.googleusercontent.com/a/ACg8ocKslGvax674MK5HEFFv4xVnWiIzb2LQoLkZ0IAENU0yI-WwnHE=s96-c',
        college: 'NextEra Coders Core Team',
        streak: 20,
        longestStreak: 22,
        totalSolved: 310,
        coinsWon: 1980,
        badge: '⚡ Consistent',
      },
      {
        userId: '6a9582cad07e99eb81fcd0fe',
        username: 'google_dev',
        name: 'Google Developer',
        avatar: '',
        college: 'IIT Patna • CSE',
        streak: 15,
        longestStreak: 18,
        totalSolved: 285,
        coinsWon: 1740,
        badge: '⚡ Consistent',
      },
    ];

    const currentStreak = wallet.dailyStreak || 0;
    const currentUserRaw = {
      userId: user?.id || 'current-user',
      username: (user?.name || 'You').toLowerCase().replace(/\s+/g, '_'),
      name: user?.name ? `${user.name} (You)` : 'You (Current Coder)',
      avatar: user?.profileImage || '',
      college: (user as any)?.college || 'Ramgarh Engineering College',
      streak: currentStreak,
      longestStreak: Math.max(27, currentStreak),
      totalSolved: 45 + currentStreak,
      coinsWon: wallet.coins || 0,
      badge: currentStreak >= 100 ? '🔥 Century' : currentStreak >= 30 ? '⚡ Consistent' : '🌱 Rising',
      isCurrentUser: true,
    };

    // Combine and sort by streak descending
    const combined = [...rawList, currentUserRaw].sort((a, b) => (b.streak || 0) - (a.streak || 0));

    return combined.map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));
  }, [wallet.dailyStreak, wallet.coins, user]);

  const topStreakers: StreakerItem[] = useMemo(() => {
    const top5 = allStreakers.slice(0, 5);
    const currentUser = allStreakers.find((s) => s.isCurrentUser);
    if (currentUser && currentUser.rank > 5) {
      return [...top5, currentUser];
    }
    return top5;
  }, [allStreakers]);

  // Month navigation
  const handlePrevMonth = () => {
    if (selectedMonthIndex === 0) {
      setSelectedMonthIndex(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonthIndex((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedYear > currentRealYear || (selectedYear === currentRealYear && selectedMonthIndex >= currentRealMonth)) {
      return;
    }
    if (selectedMonthIndex === 11) {
      setSelectedMonthIndex(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonthIndex((m) => m + 1);
    }
  };

  // Solve problem in IDE
  const handleSolveProblem = (slug: string) => {
    navigate(`/dsa/${encodeURIComponent(slug)}`);
  };

  // Open modal profile
  const handleOpenCoderProfile = (item: StreakerItem) => {
    const mockProfile: CoderProfile = {
      userId: item.userId,
      username: item.username,
      name: item.name.replace(' (You)', ''),
      avatar: item.avatar,
      rank: item.rank,
      score: item.coinsWon * 10,
      problemsSolved: item.totalSolved,
      finishTime: '00:28:15',
      coinsWon: item.coinsWon,
      badge: item.badge,
      bio: `Dedicated competitive programmer on NextEra Coders. Maintained an active streak of ${item.streak} days!`,
      college: item.college,
      globalRating: 2150 + item.rank * -40,
      globalRank: item.rank * 12,
      totalSolved: {
        easy: Math.floor(item.totalSolved * 0.45),
        medium: Math.floor(item.totalSolved * 0.4),
        hard: Math.floor(item.totalSolved * 0.15),
      },
      streak: item.streak,
      skills: ['Data Structures', 'Algorithms', 'C++', 'Python', 'Dynamic Programming'],
      country: 'India',
      articlesPublished: 4,
    };
    setSelectedProfileForModal(mockProfile);
  };

  const isTodaySolved = Boolean(wallet.claimedToday);
  const isStreakBonusDay = ((wallet.dailyStreak || 0) + 1) % 7 === 0;

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-[#0b0c10] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* CELEBRATION COIN MODAL */}
      <AnimatedCoinModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        coins={isStreakBonusDay ? 8 : 1}
        dailyCoins={1}
        extraCoins={isStreakBonusDay ? 7 : 0}
        streakCount={wallet.dailyStreak || 1}
        isBonus={isStreakBonusDay}
        isDailyStreak={true}
        title={isStreakBonusDay ? '🎉 7-DAY MEGA BONUS UNLOCKED!' : '⚡ DAILY STREAK CLAIMED!'}
        subtitle={
          isStreakBonusDay
            ? 'Awesome consistency! You earned +7 extra bonus coins on Day 7.'
            : 'Daily challenge solved & streak secured!'
        }
      />

      {/* USER PROFILE MODAL */}
      <UserProfileModal
        isOpen={Boolean(selectedProfileForModal)}
        onClose={() => setSelectedProfileForModal(null)}
        profile={selectedProfileForModal}
      />

      {/* FULL LEADERBOARD POPUP MODAL */}
      <FullLeaderboardModal
        isOpen={isLeaderboardModalOpen}
        onClose={() => setIsLeaderboardModalOpen(false)}
        type="streak"
        title="NEC Daily Streak Leaderboard"
        subtitle={`Viewing all ${allStreakers.length} consistent coders across universities`}
        students={allStreakers}
        currentUserId={user?.id}
        onSelectStudent={(student) => {
          handleOpenCoderProfile(student as any);
        }}
      />

      {/* MAIN CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-16 space-y-7">
        
        {/* 1. TOP HERO HEADER & BREADCRUMB */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Left Title & Breadcrumb */}
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
              <Link to={ROUTES.PRACTICE} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Practice
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-blue-600 dark:text-blue-400 font-semibold">Daily Streak Hub</span>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500/15 via-amber-500/10 to-transparent dark:from-orange-500/25 dark:via-amber-500/15 text-orange-500 border border-orange-500/25 flex items-center justify-center shrink-0 shadow-sm">
                <Flame className="w-6 h-6 fill-orange-500 text-orange-500 animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span>NEC Problem Of The</span>
                  <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 dark:from-blue-400 dark:to-indigo-300 bg-clip-text text-transparent">
                    Day
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
                  Solve daily coding challenges, build consistency, and earn NEC Coins.
                </p>
              </div>
            </div>
          </div>

          {/* Right Streak Pill & Wallet Pill */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            
            {/* Daily Streak Counter Pill */}
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-[#12141a]/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800/80 shadow-xs hover:border-orange-500/30 transition-all">
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center text-orange-500 border border-orange-500/20">
                <Flame className="w-4.5 h-4.5 fill-orange-500 text-orange-500" />
              </div>
              <div className="text-left">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider">Current Streak</div>
                <div className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1">
                  <span>{wallet.dailyStreak} {wallet.dailyStreak === 1 ? 'Day' : 'Days'}</span>
                  <span className="text-xs">🔥</span>
                </div>
              </div>
            </div>

            {/* Wallet Balance Pill */}
            <Link
              to={ROUTES.REWARDS}
              className="group flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-[#12141a]/95 backdrop-blur-md hover:bg-slate-50/80 dark:hover:bg-[#181a22] border border-slate-200/90 dark:border-slate-800/80 hover:border-amber-500/40 text-slate-800 dark:text-slate-200 transition-all shadow-xs"
              title="View NEC Rewards Store"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 font-bold text-sm shrink-0 group-hover:scale-105 transition-transform">
                🪙
              </div>
              <div className="text-left">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider">NEC Balance</div>
                <div className="text-sm font-extrabold text-amber-600 dark:text-amber-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-1">
                  <span>{wallet.coins} Coins</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform opacity-60" />
                </div>
              </div>
            </Link>
          </div>

        </div>

        {/* =================================================================
            A. TODAY'S CHALLENGE CONTAINER (REDESIGNED LUXURY HERO CONTAINER)
            ================================================================= */}
        <div className="relative rounded-3xl p-6 sm:p-8 bg-white/95 dark:bg-[#111319]/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/80 shadow-xl shadow-slate-200/30 dark:shadow-black/50 transition-all overflow-hidden group">
          
          {/* Top Multi-color Gradient Accent Line */}
          <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-blue-500 via-indigo-500 to-amber-500" />

          {/* Subtle Ambient Decorative Glows */}
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-amber-500/10 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Bar: Problem of the Day Badge + Date + Countdown Timer */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="flex flex-wrap items-center gap-2.5">
              
              {/* Problem of the Day Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/25 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-spin-slow" />
                <span>Problem Of The Day</span>
              </div>

              {/* Date Chip */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 text-xs font-medium text-slate-600 dark:text-slate-300">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>{currentRealDay} {monthNames[currentRealMonth]} {currentRealYear} &bull; Daily Challenge</span>
              </div>

              {/* Source/Topic Tag */}
              {activeDailyProb.sourceLabel && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/25 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
                  <Zap className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{activeDailyProb.sourceLabel}</span>
                </div>
              )}
            </div>

            {/* Countdown Timer Display */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/70 shadow-xs">
              <Clock className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
              <span className="text-slate-500 dark:text-slate-400 font-medium text-xs">Resets in:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-xs sm:text-sm tracking-wider px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/60 shadow-inner">
                {timeUntilUnlock.formatted}
              </span>
            </div>
          </div>

          {/* Main Content: Title & Meta on Left, Reward Box & Button on Right */}
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            {/* Left info: Title + Meta Tags + Synopsis + Specs */}
            <div className="space-y-3.5 min-w-0 flex-1">
              <div>
                <h2
                  onClick={() => handleSolveProblem(activeDailyProb.slug)}
                  className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer truncate"
                >
                  {activeDailyProb.title}
                </h2>
              </div>

              {/* Difficulty & Meta tags */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                {/* Difficulty Pill */}
                <span
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 shadow-xs',
                    activeDailyProb.difficulty === 'Easy'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                      : activeDailyProb.difficulty === 'Medium'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400'
                  )}
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
                  </span>
                  <span>{activeDailyProb.difficulty}</span>
                </span>

                {/* Topic tags */}
                <span className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/60">
                  Array &bull; Algorithms
                </span>

                {/* Companies Chips */}
                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-xs font-medium border border-slate-200/80 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                    Zoho
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-xs font-medium border border-slate-200/80 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                    Flipkart
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100/60 dark:bg-slate-800/60 text-xs font-medium border border-slate-200/60 dark:border-slate-700/60 text-slate-500">
                    +4 companies
                  </span>
                </div>

                {/* Stats badge */}
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>Submissions: <strong className="text-slate-800 dark:text-slate-200 font-semibold font-mono">86K</strong></span>
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">&bull;</span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                    <span>Accuracy: <strong className="text-blue-600 dark:text-blue-400 font-semibold font-mono">54.8%</strong></span>
                  </span>
                </div>
              </div>

              {/* Problem Brief Synopsis */}
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2 max-w-3xl">
                {activeDailyProb.description
                  ? activeDailyProb.description.split('###')[0].replace(/[*`_#]/g, '').trim()
                  : 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.'}
              </p>

              {/* Sample I/O & Algorithm Pattern Specs Row */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 pt-0.5">
                {/* Sample I/O Pill */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 text-xs font-mono">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-sans">
                    Sample:
                  </span>
                  <span className="text-slate-700 dark:text-slate-200 font-medium">
                    nums = [2, 7, 11, 15], target = 9
                  </span>
                  <span className="text-blue-500 font-bold">➜</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    [0, 1]
                  </span>
                </div>

                {/* Algorithmic Complexity Specs */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/25 text-indigo-700 dark:text-indigo-300 text-xs font-medium">
                  <Zap className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Optimal: <strong className="font-mono font-semibold">O(N)</strong> Time &bull; <strong className="font-mono font-semibold">O(N)</strong> Space</span>
                </div>

                {/* Pattern / Key Hint */}
                <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/25 text-amber-700 dark:text-amber-300 text-xs font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Pattern: Hash Map Lookup</span>
                </div>
              </div>
            </div>

            {/* Right Action Block: Gamified Reward Box & High-Impact CTA */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-50/80 to-blue-500/5 dark:from-amber-500/15 dark:via-[#161820] dark:to-blue-950/30 border border-amber-500/30 dark:border-amber-500/25 flex flex-col justify-between gap-3.5 lg:w-[380px] shrink-0 shadow-md">
              
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl shrink-0 shadow-sm shadow-amber-500/10">
                  🪙
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-1.5">
                    <span>{isStreakBonusDay ? '🎉 +8 NEC Coins Mega Bonus' : 'Daily Challenge Reward: +1 NEC Coin'}</span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
                    {isStreakBonusDay ? '1 Daily + 7 Streak Bonus Coins on Day 7!' : 'Solve and submit 100% test cases today.'}
                  </div>
                </div>
              </div>

              {/* Live submissions & streak points strip */}
              <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-white/70 dark:bg-black/30 border border-slate-200/70 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>1,420+ coders solved today</span>
                </span>
                <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-500" />
                  <span>+10 Streak XP</span>
                </span>
              </div>

              {isTodaySolved ? (
                <div className="flex items-center gap-2.5 w-full">
                  <button
                    type="button"
                    onClick={() => setIsClaimModalOpen(true)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-500/15 dark:bg-emerald-500/20 border border-emerald-500/40 text-emerald-700 dark:text-emerald-400 font-bold text-xs sm:text-sm cursor-pointer hover:bg-emerald-500/25 transition-all shadow-xs"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Solved & Streak Secured ✓</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSolveProblem(activeDailyProb.slug)}
                    className="py-3 px-4 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                  >
                    Practice Again
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSolveProblem(activeDailyProb.slug)}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2 group/btn"
                >
                  <Code2 className="w-4.5 h-4.5" />
                  <span>Solve Daily Streak</span>
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              )}
            </div>

          </div>

        </div>

        {/* =================================================================
            B. MAIN 2-COLUMN SECTION:
               LEFT: PREVIOUS CHALLENGES ARCHIVE (COL-SPAN-8)
               RIGHT: DAILY STREAK + LEADERBOARD + CALENDAR + STATS (COL-SPAN-4)
            ================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-7 items-start">
          
          {/* LEFT COLUMN (COL-SPAN-8): PREVIOUS CHALLENGES ARCHIVE */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Section Header with Search & Filter Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-1">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                  <span>Previous Daily Problems</span>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-200/80 dark:border-slate-700/60">
                    {filteredArchive.length} challenges
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
                  Catch up on previous challenges to test your problem-solving skills.
                </p>
              </div>

              {/* Filter & Search Bar */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                {/* Difficulty Filter */}
                <div className="relative">
                  <select
                    value={difficultyFilter}
                    onChange={(e) => setDifficultyFilter(e.target.value as any)}
                    aria-label="Filter challenges by difficulty"
                    className="text-xs font-semibold py-2 px-3 pr-8 rounded-xl bg-white dark:bg-[#15171d] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="all">All Difficulties</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                {/* Search Input */}
                <div className="relative flex-1 sm:w-56">
                  <input
                    type="text"
                    placeholder="Search title, tag..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs py-2 pl-8 pr-3 rounded-xl bg-white dark:bg-[#15171d] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            {/* Archive Problem List Items */}
            <div className="space-y-3">
              {filteredArchive.map((item) => (
                <div
                  key={item.problem.id}
                  className={cn(
                    'group p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4',
                    item.isToday
                      ? 'bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-transparent border-blue-300 dark:border-blue-800/80 shadow-xs ring-1 ring-blue-500/20'
                      : 'bg-white dark:bg-[#12141a] hover:bg-slate-50/80 dark:hover:bg-[#161820] border-slate-200/90 dark:border-slate-800/80 hover:border-blue-300 dark:hover:border-blue-700/60 shadow-xs hover:shadow-md hover:-translate-y-0.5'
                  )}
                >
                  {/* Left details: Date, Title, Tags */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{item.dateStr}</span>
                      <span>&bull;</span>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-md text-[11px] font-bold',
                          item.problem.difficulty === 'Easy'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                            : item.problem.difficulty === 'Medium'
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                            : 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
                        )}
                      >
                        {item.problem.difficulty}
                      </span>

                      {item.isToday && (
                        <span className="px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold text-[10px] border border-blue-500/25 flex items-center gap-1">
                          <Zap className="w-3 h-3 fill-blue-500 text-blue-500" /> Today
                        </span>
                      )}
                    </div>

                    <h4
                      onClick={() => handleSolveProblem(item.problem.slug)}
                      className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors cursor-pointer"
                    >
                      {item.problem.title}
                    </h4>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      {item.companyTags.map((company, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/70 text-[11px] font-medium text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/60"
                        >
                          {company}
                        </span>
                      ))}
                      <span className="text-[11px] ml-1">Submissions: <strong className="font-mono text-slate-700 dark:text-slate-300">{item.submissionsCount}</strong></span>
                      <span>&bull;</span>
                      <span className="text-[11px]">Accuracy: <strong className="font-mono text-blue-600 dark:text-blue-400">{item.accuracyRate}</strong></span>
                    </div>
                  </div>

                  {/* Right action button */}
                  <div className="self-end sm:self-center shrink-0">
                    {item.isSolved ? (
                      <div className="flex items-center gap-2">
                        <span className="px-3.5 py-2 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-semibold text-xs flex items-center gap-1.5 shadow-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Solved ✓
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSolveProblem(item.problem.slug)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                          title="Review or Practice Solution"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSolveProblem(item.problem.slug)}
                        className={cn(
                          'py-2.5 px-4 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5',
                          item.isToday
                            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20'
                            : 'bg-slate-100 hover:bg-blue-600 hover:text-white dark:bg-slate-800 dark:hover:bg-blue-600 dark:hover:text-white text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                        )}
                      >
                        <span>Solve Problem</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {filteredArchive.length === 0 && (
                <div className="p-8 rounded-2xl bg-white dark:bg-[#12141a] border border-slate-200 dark:border-slate-800 text-center space-y-2">
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    No daily challenges matched your filter.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setDifficultyFilter('all');
                    }}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Reset all filters
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN (COL-SPAN-4):
              1. DAILY STREAK WIDGET
              2. TOP STREAKERS LEADERBOARD
              3. CALENDAR WIDGET
              4. WALLET CARD
              5. STATS
              6. RULEBOOK */}
          <div className="lg:col-span-4 space-y-5">
            
            {/* 1. DAILY STREAK WIDGET (REVAMPED GAMIFIED LOOK) */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#12141a] border border-slate-200/90 dark:border-slate-800/80 shadow-sm space-y-4 relative overflow-hidden">
              
              {/* Header: Flame + Title + Day Badge */}
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 text-orange-500 border border-orange-500/30 flex items-center justify-center shrink-0">
                    <Flame className="w-5 h-5 fill-orange-500 text-orange-500 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Daily Streak
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Solve today's challenge to maintain
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 dark:bg-orange-500/20 border border-orange-500/30 text-orange-700 dark:text-orange-400 text-xs font-bold font-mono">
                  <span>Day {wallet.dailyStreak}/7</span>
                  <span>🔥</span>
                </span>
              </div>

              {/* Weekly Milestone Header & Progress Bar */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-blue-500" />
                    <span>Weekly Milestone</span>
                  </span>
                  <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">
                    {wallet.dailyStreak % 7 === 0 && wallet.dailyStreak > 0 ? '7/7 Completed 🎁' : `${wallet.dailyStreak % 7} / 7 Days`}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500 rounded-full transition-all duration-300 shadow-xs"
                    style={{
                      width: `${Math.min(100, Math.max(12, ((wallet.dailyStreak % 7 || (wallet.dailyStreak > 0 ? 7 : 0)) / 7) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              {/* 7-Day Milestone Grid (Days 1 to 7) */}
              <div className="grid grid-cols-7 gap-1.5 pt-1">
                {Array.from({ length: 7 }).map((_, i) => {
                  const dayNum = i + 1;
                  const streakMod = wallet.dailyStreak % 7 || (wallet.dailyStreak > 0 ? 7 : 0);
                  const isDone = dayNum <= streakMod;
                  const isDay7 = dayNum === 7;

                  return (
                    <div
                      key={dayNum}
                      className={cn(
                        'py-2.5 rounded-xl border text-center text-xs transition-all flex flex-col items-center justify-center gap-1 relative',
                        isDone
                          ? isDay7
                            ? 'bg-gradient-to-b from-amber-500/20 to-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-300 font-bold shadow-xs'
                            : 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400 font-bold shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 text-slate-400 dark:text-slate-500'
                      )}
                      title={isDay7 ? 'Day 7: +7 Extra Bonus Coins 🎁' : `Day ${dayNum}: +1 NEC Coin`}
                    >
                      <span className="text-[10px] font-semibold font-mono">0{dayNum}</span>
                      <span className="text-sm">
                        {isDay7 ? '🎁' : isDone ? '✓' : '🪙'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* 7-Day Mega Bonus Rule Callout */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-orange-500/10 dark:from-amber-500/15 dark:to-orange-500/15 border border-amber-500/25 text-xs space-y-1">
                <div className="text-slate-900 dark:text-white font-bold flex items-center gap-1.5">
                  <Gift className="w-3.5 h-3.5 text-amber-500" />
                  <span>7-Day Mega Bonus Rule</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Maintain 7 days continuous streak to earn <span className="text-amber-600 dark:text-amber-400 font-bold font-mono">+7 Extra Coins</span> on Day 7!
                </p>
              </div>

              {/* Current Status Prompt */}
              <div className="text-center pt-1 text-xs text-slate-500 dark:text-slate-400">
                {isTodaySolved ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Today's challenge solved & streak secured!
                  </span>
                ) : (
                  <span>Solve today's challenge before midnight to build your streak.</span>
                )}
              </div>

            </div>

            {/* 2. INTERACTIVE MONTHLY CALENDAR WIDGET */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#12141a] border border-slate-200/90 dark:border-slate-800/80 shadow-sm space-y-4">
              
              {/* Calendar Month Selector Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    {monthNames[selectedMonthIndex]} {selectedYear}
                  </h3>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    aria-label="Previous Month"
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                    title="Previous Month"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    disabled={selectedYear === currentRealYear && selectedMonthIndex >= currentRealMonth}
                    aria-label="Next Month"
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                    title="Next Month"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Weekday Headers */}
              <div className="grid grid-cols-7 text-center font-mono text-[11px] text-slate-400 dark:text-slate-500 font-semibold">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>

              {/* Day Cells Grid */}
              <div className="grid grid-cols-7 text-center gap-1 text-xs">
                {Array.from({ length: adjustedFirstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="py-1.5 text-slate-300 dark:text-slate-700 text-[11px]">
                    -
                  </div>
                ))}

                {Array.from({ length: daysInSelectedMonth }).map((_, i) => {
                  const day = i + 1;
                  const isCurrentViewingMonth = selectedMonthIndex === currentRealMonth && selectedYear === currentRealYear;
                  const isToday = isCurrentViewingMonth && day === currentRealDay;
                  const isPast = isCurrentViewingMonth ? day < currentRealDay : selectedYear < currentRealYear || selectedMonthIndex < currentRealMonth;
                  
                  const isDaySolved = isToday ? isTodaySolved : (isPast && isCurrentViewingMonth && (currentRealDay - day < (wallet.dailyStreak || 0)));
                  const isDay7Bonus = day % 7 === 0;

                  return (
                    <div
                      key={day}
                      className={cn(
                        'py-1.5 rounded-lg flex flex-col items-center justify-center transition-colors font-mono text-[11px] relative',
                        isDaySolved
                          ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400 font-bold border border-blue-500/30'
                          : isToday
                          ? 'bg-blue-600 text-white font-bold shadow-sm'
                          : isPast
                          ? 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                          : 'text-slate-400 dark:text-slate-600'
                      )}
                      title={
                        isDaySolved
                          ? `Day ${day}: Solved ✓ (+1 Coin)`
                          : isToday
                          ? `Day ${day}: Today's Active Challenge`
                          : `Day ${day}`
                      }
                    >
                      <span>{day}</span>
                      <span className="text-[9px] -mt-0.5 font-bold">
                        {isDaySolved ? '✓' : isDay7Bonus ? '🎁' : isToday ? '🪙' : ''}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Solved (+1🪙)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Day 7 Bonus 🎁</span>
                </div>
              </div>
            </div>

            {/* 3. LIVE NEC WALLET & REDEEM STORE CARD */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#12141a] border border-slate-200/90 dark:border-slate-800/80 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 text-amber-500 flex items-center justify-center text-lg shrink-0">
                    🪙
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                      NEC Coin Wallet
                    </h4>
                    <div className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
                      {wallet.coins} Coins
                    </div>
                  </div>
                </div>

                <Link
                  to={ROUTES.REWARDS}
                  className="py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Redeem</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Redeem your streak coins for Pro courses, 50% discount vouchers, and official swag delivered to your address.
              </p>
            </div>

            {/* 4. STREAK STATS OVERVIEW */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#12141a] border border-slate-200/90 dark:border-slate-800/80 shadow-sm space-y-3.5">
              <h4 className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 flex items-center gap-2 tracking-wider">
                <Trophy className="w-4 h-4 text-blue-500" />
                <span>Streak Statistics</span>
              </h4>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Global Longest</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white font-mono">1,852 Days</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Your Longest</div>
                  <div className="text-sm font-bold text-blue-600 dark:text-blue-400 font-mono">{Math.max(27, wallet.dailyStreak || 0)} Days</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Challenges Solved</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white font-mono">{45 + (wallet.dailyStreak || 0)}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Accuracy Rate</div>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">96.4%</div>
                </div>
              </div>
            </div>

            {/* 5. STYLISH STREAK LEADERBOARD */}
            <div className="relative rounded-3xl p-5 sm:p-6 bg-gradient-to-b from-white via-slate-50/70 to-amber-50/20 dark:from-[#12141a] dark:via-[#15171d] dark:to-[#1a1711] border border-amber-500/30 dark:border-amber-500/20 shadow-sm space-y-3.5 overflow-hidden">
              
              {/* Subtle ambient light behind trophy */}
              <div className="absolute -top-10 -right-10 w-28 h-28 bg-amber-500/10 dark:bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />

              {/* Header with Live Badge & View All */}
              <div className="relative z-10 flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
                <div
                  onClick={() => setIsLeaderboardModalOpen(true)}
                  className="flex items-center gap-2.5 cursor-pointer group"
                  title="Click to open full leaderboard popup"
                >
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 text-amber-500 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    <Trophy className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase text-slate-900 dark:text-white tracking-wider group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
                      <span>Streak Leaderboard</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Top consistent coding champions
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsLeaderboardModalOpen(true)}
                    className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 underline-offset-2 hover:underline cursor-pointer"
                  >
                    View All
                  </button>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-mono text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span>Live</span>
                  </span>
                </div>
              </div>

              {/* Streakers List */}
              <div className="relative z-10 space-y-2">
                {topStreakers.map((item) => (
                  <div
                    key={item.userId}
                    onClick={() => handleOpenCoderProfile(item)}
                    className={cn(
                      'p-2.5 rounded-xl border transition-all duration-150 flex items-center justify-between gap-2.5 cursor-pointer group',
                      item.isCurrentUser
                        ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700 shadow-xs ring-1 ring-blue-500/20'
                        : item.rank === 1
                        ? 'bg-gradient-to-r from-amber-50/70 to-yellow-50/30 dark:from-amber-950/30 dark:to-yellow-950/10 border-amber-300 dark:border-amber-700/80 shadow-xs'
                        : 'bg-white/80 dark:bg-[#18191e]/80 hover:bg-slate-50 dark:hover:bg-[#1f2026] border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    )}
                    title="Click to inspect coder profile"
                  >
                    {/* Rank & Avatar & Info */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-5 text-center text-xs font-extrabold shrink-0">
                        {item.rank === 1 ? (
                          <span className="text-sm">🥇</span>
                        ) : item.rank === 2 ? (
                          <span className="text-sm">🥈</span>
                        ) : item.rank === 3 ? (
                          <span className="text-sm">🥉</span>
                        ) : (
                          <span className="text-slate-400 text-[11px] font-mono">#{item.rank}</span>
                        )}
                      </div>

                      <div className="relative shrink-0">
                        <img
                          src={item.avatar}
                          alt={item.name}
                          className={cn(
                            'w-7 h-7 rounded-full object-cover border',
                            item.rank === 1
                              ? 'border-amber-400 ring-2 ring-amber-400/20'
                              : 'border-slate-200 dark:border-slate-700'
                          )}
                        />
                        {item.rank === 1 && (
                          <Crown className="w-3 h-3 fill-amber-500 text-amber-500 absolute -top-1.5 -right-1 animate-pulse" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          <span className="truncate">{item.name}</span>
                          {item.isCurrentUser && (
                            <span className="px-1.5 py-0.2 rounded-md bg-blue-600 text-white text-[9px] font-bold uppercase tracking-wider shrink-0 font-mono">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                          <GraduationCap className="w-2.5 h-2.5 text-blue-500 shrink-0" />
                          <span className="truncate">{item.college}</span>
                        </div>
                      </div>
                    </div>

                    {/* Streak badge */}
                    <div className="shrink-0 text-right flex items-center gap-2">
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 text-[11px] font-bold font-mono">
                        <Flame className="w-3 h-3 fill-orange-500 text-orange-500" />
                        <span>{item.streak}d</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom hint with clickable full modal launcher */}
              <div className="relative z-10 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <button
                  type="button"
                  onClick={() => setIsLeaderboardModalOpen(true)}
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>View All {allStreakers.length} Coders in Pop-up</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
                  <span>Solve daily challenges to climb into Top 5 streakers!</span>
                </div>
              </div>

            </div>

            {/* 6. RULEBOOK: HOW TO LEARN & EARN */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#12141a] border border-slate-200/90 dark:border-slate-800/80 shadow-sm space-y-3.5">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h4 className="text-xs font-bold uppercase text-slate-800 dark:text-slate-200 tracking-wider">
                  Rulebook: Learn & Earn
                </h4>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5 border border-blue-500/20">
                    1
                  </span>
                  <span>Solve the <strong className="text-slate-800 dark:text-slate-200 font-semibold">Problem of the Day</strong> before 11:59 PM to claim <strong className="text-blue-600 dark:text-blue-400 font-semibold">+1 NEC Coin</strong>.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5 border border-blue-500/20">
                    2
                  </span>
                  <span>Maintain a <strong className="text-slate-800 dark:text-slate-200 font-semibold">7-Day continuous streak</strong> to unlock the <strong className="text-amber-600 dark:text-amber-400 font-semibold">Mega Bonus (+7 Extra Coins)</strong> on Day 7!</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5 border border-blue-500/20">
                    3
                  </span>
                  <span>Redeem your coins anytime in the <strong className="text-slate-800 dark:text-slate-200 font-semibold">Rewards Store</strong> for discounts, courses, and official swag!</span>
                </li>
              </ul>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
};
