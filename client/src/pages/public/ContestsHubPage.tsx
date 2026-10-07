import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Trophy,
  Zap,
  CheckCircle2,
  ArrowRight,
  Shield,
  Plus,
  Trash2,
  Edit3,
  Search,
  Medal,
} from 'lucide-react';
import { contestsHubService, ContestItem, ContestWinnerArchive } from '../../services/contestsHub.service';
import { coinService } from '../../services/coin.service';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/ui/Toast';
import { ROUTES } from '../../constants/routes';
import { cn } from '../../utils/cn';
import { ThemeToggle } from '../../components/common/ThemeToggle';

export const ContestsHubPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isAdmin } = useAuth();
  const { success, error: toastError, info } = useToast();

  const [contests, setContests] = useState<ContestItem[]>(() => contestsHubService.getContests());
  const [archives, setArchives] = useState<ContestWinnerArchive[]>(() => contestsHubService.getArchives());
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(() => contestsHubService.getRegisteredIds());
  const [wallet, setWallet] = useState(() => coinService.getState());

  const [activeTab, setActiveTab] = useState<'all' | 'weekly' | 'biweekly' | 'collegiate' | 'archive'>('all');
  const [search, setSearch] = useState('');

  // Admin Mode state
  const [adminMode, setAdminMode] = useState(false);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingContest, setEditingContest] = useState<ContestItem | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    type: 'Weekly' as 'Weekly' | 'Biweekly' | 'Collegiate' | 'Special Arena',
    status: 'upcoming' as 'live' | 'upcoming' | 'concluded',
    startTime: new Date().toISOString(),
    durationMinutes: 90,
    prizeCoins: 100,
    difficulty: 'Open to All' as 'Beginner' | 'Intermediate' | 'Hard' | 'Open to All',
    description: '',
    rules: 'Solve problems in time\n100% test cases required\nInstant ranking updates',
    targetRoute: '/contest',
    problemCount: 2,
  });

  // Subscribe to service updates
  useEffect(() => {
    const updateData = () => {
      setContests(contestsHubService.getContests());
      setArchives(contestsHubService.getArchives());
      setRegisteredIds(contestsHubService.getRegisteredIds());
    };
    updateData();
    const unsub = contestsHubService.subscribe(updateData);
    const unsubCoin = coinService.subscribe(setWallet);
    return () => {
      unsub();
      unsubCoin();
    };
  }, []);

  // Filtered contests
  const filteredContests = useMemo(() => {
    return contests.filter((c) => {
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesTitle = c.title.toLowerCase().includes(query);
        const matchesType = c.type.toLowerCase().includes(query);
        if (!matchesTitle && !matchesType) return false;
      }

      if (activeTab === 'weekly' && c.type !== 'Weekly') return false;
      if (activeTab === 'biweekly' && c.type !== 'Biweekly') return false;
      if (activeTab === 'collegiate' && c.type !== 'Collegiate') return false;

      return true;
    });
  }, [contests, search, activeTab]);

  const handleToggleRegistration = (contestId: string, contestTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN, { state: { from: location } });
      return;
    }
    const isReg = contestsHubService.toggleRegistration(contestId);
    if (isReg) {
      success(`Successfully registered for "${contestTitle}"! Calendar reminder added.`);
    } else {
      info(`Registration cancelled for "${contestTitle}".`);
    }
  };

  // Admin open modal
  const handleOpenCreateModal = () => {
    setEditingContest(null);
    setFormData({
      title: '',
      slug: '',
      type: 'Weekly',
      status: 'upcoming',
      startTime: new Date(Date.now() + 86400000 * 3).toISOString(),
      durationMinutes: 90,
      prizeCoins: 100,
      difficulty: 'Open to All',
      description: 'Competitive coding contest on NextEra.',
      rules: 'Solve in time\nPass all test cases\nEarn coins bounty',
      targetRoute: '/contest',
      problemCount: 2,
    });
    setIsAddEditModalOpen(true);
  };

  const handleOpenEditModal = (c: ContestItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingContest(c);
    setFormData({
      title: c.title,
      slug: c.slug,
      type: c.type,
      status: c.status,
      startTime: c.startTime,
      durationMinutes: c.durationMinutes,
      prizeCoins: c.prizeCoins,
      difficulty: c.difficulty,
      description: c.description,
      rules: c.rules.join('\n'),
      targetRoute: c.targetRoute || '/contest',
      problemCount: c.problemCount || 2,
    });
    setIsAddEditModalOpen(true);
  };

  const handleDeleteContest = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Delete contest "${title}"?`)) {
      contestsHubService.deleteContest(id);
      success(`Contest "${title}" deleted.`);
    }
  };

  const handleSaveContest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.slug.trim()) {
      toastError('Title and Slug are required');
      return;
    }

    const rulesArray = formData.rules.split('\n').filter(Boolean);

    if (editingContest) {
      contestsHubService.updateContest(editingContest.id, {
        title: formData.title.trim(),
        slug: formData.slug.trim().toLowerCase().replace(/\s+/g, '-'),
        type: formData.type,
        status: formData.status,
        startTime: formData.startTime,
        durationMinutes: Number(formData.durationMinutes) || 90,
        prizeCoins: Number(formData.prizeCoins) || 100,
        difficulty: formData.difficulty,
        description: formData.description,
        rules: rulesArray,
        targetRoute: formData.targetRoute,
        problemCount: Number(formData.problemCount) || 2,
      });
      success('Contest updated successfully!');
    } else {
      contestsHubService.createContest({
        title: formData.title.trim(),
        slug: formData.slug.trim().toLowerCase().replace(/\s+/g, '-'),
        type: formData.type,
        status: formData.status,
        startTime: formData.startTime,
        durationMinutes: Number(formData.durationMinutes) || 90,
        prizeCoins: Number(formData.prizeCoins) || 100,
        difficulty: formData.difficulty,
        description: formData.description,
        rules: rulesArray,
        targetRoute: formData.targetRoute,
        problemCount: Number(formData.problemCount) || 2,
      });
      success('New contest scheduled!');
    }
    setIsAddEditModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0d0e15] text-slate-800 dark:text-slate-200 antialiased font-sans selection:bg-amber-500/30 selection:text-amber-700 dark:selection:text-amber-200 pb-20 transition-colors duration-200">
      
      {/* 1. TOP NAVBAR */}
      <div className="border-b border-slate-200 dark:border-neutral-800/80 bg-white/90 dark:bg-[#12131e]/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between font-mono text-xs shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            to={ROUTES.PRACTICE}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-neutral-900/80 dark:hover:bg-neutral-800 text-slate-700 hover:text-slate-900 dark:text-neutral-300 dark:hover:text-white border border-slate-200 dark:border-neutral-800 transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
          >
            <span>&larr; Practice Hub</span>
          </Link>
          <div className="h-4 w-px bg-slate-200 dark:bg-neutral-800 hidden sm:block" />
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold">
            <Trophy className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span>Contests Arena Hub</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Live Wallet Pill */}
          <Link
            to={ROUTES.REWARDS}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-xs font-mono font-bold transition-all shadow-xs"
            title="Your NEC Coins Wallet"
          >
            <span>🪙</span>
            <span>{wallet.coins} Coins</span>
          </Link>

          {/* Weekly Contest Direct Link */}
          <Link
            to={ROUTES.CONTEST}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs font-mono shadow-xs active:scale-95 transition-all"
          >
            <Zap className="w-3.5 h-3.5 fill-slate-950" />
            <span>Sunday Live Arena</span>
          </Link>

          {/* Theme Toggle */}
          <ThemeToggle compact />

          {/* Admin Mode Toggle */}
          {(isAdmin || user?.role === 'admin') && (
            <button
              type="button"
              onClick={() => setAdminMode(!adminMode)}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all border cursor-pointer',
                adminMode
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-600 dark:text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                  : 'bg-slate-100 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{adminMode ? 'Admin Active' : 'Admin Control'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* 2. HERO BANNER */}
        <div className="relative rounded-3xl bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-slate-100 dark:from-[#1c1811] dark:via-[#14120f] dark:to-[#0d0e15] border border-amber-500/30 p-6 sm:p-12 shadow-2xl overflow-hidden backdrop-blur-xl">
          <div className="absolute -top-24 -left-24 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-xs font-mono font-bold">
                <Trophy className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span>NextEra Competitive Programming Arena</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                Contests & <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 dark:from-amber-400 dark:via-orange-400 dark:to-amber-300 bg-clip-text text-transparent">Championships</span>
              </h1>

              <p className="text-sm sm:text-base text-slate-600 dark:text-neutral-300 leading-relaxed font-normal max-w-2xl">
                Compete in rated weekly battles, speed sprints, and collegiate coding cups. 
                Improve your global ranking, climb the leaderboard, and earn pure <span className="text-amber-600 dark:text-amber-300 font-bold font-mono">NEC Coins</span> prizes every week!
              </p>

              {/* Contest types quick links */}
              <div className="pt-2 flex items-center justify-center lg:justify-start gap-2 flex-wrap text-xs font-mono">
                <span className="text-slate-500 dark:text-neutral-500 font-bold">Formats:</span>
                <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 shadow-xs">⚡ Sunday Grand (90m)</span>
                <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 shadow-xs">⏱️ Saturday Sprint (60m)</span>
                <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 shadow-xs">🏛️ Collegiate Cup</span>
              </div>
            </div>

            {/* Right: User's Global Rating Card */}
            <div className="lg:col-span-5 bg-white/90 dark:bg-[#121118]/90 border border-amber-500/30 rounded-2xl p-6 shadow-xl space-y-4 font-mono">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <Medal className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                  <span className="text-xs font-bold text-slate-700 dark:text-neutral-300">Your Contest Standing</span>
                </div>
                <span className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-bold">
                  Knight Tier
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1a1715] border border-slate-200 dark:border-amber-500/20">
                  <span className="text-[10px] text-slate-500 dark:text-neutral-400 uppercase tracking-wider">Contest Rating</span>
                  <div className="text-2xl font-black text-amber-600 dark:text-amber-300 mt-0.5">1,540</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1a1715] border border-slate-200 dark:border-amber-500/20">
                  <span className="text-[10px] text-slate-500 dark:text-neutral-400 uppercase tracking-wider">National Percentile</span>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">Top 12%</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400 pt-1">
                <span>Contests Participated: <strong className="text-slate-900 dark:text-white">6</strong></span>
                <span>Wins & Coins: <strong className="text-amber-600 dark:text-amber-300">300🪙</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. ADMIN MANAGEMENT TOOLBAR */}
        {adminMode && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50 via-slate-50 to-slate-100 dark:from-rose-950/40 dark:via-neutral-900 dark:to-neutral-900 border border-rose-300 dark:border-rose-500/40 flex flex-wrap items-center justify-between gap-4 shadow-lg font-mono text-xs">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-rose-500 dark:text-rose-400" />
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white font-sans">Contests Administrator Hub</h4>
                <p className="text-xs text-slate-500 dark:text-neutral-400">Schedule new contests, update live status, or edit prize pools.</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Schedule New Contest</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  contestsHubService.resetToDefault();
                  success('Contests reset to default directory.');
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 font-bold border border-slate-200 dark:border-neutral-700 cursor-pointer"
              >
                <span>Reset Defaults</span>
              </button>
            </div>
          </div>
        )}

        {/* 4. TABS & SEARCH BAR */}
        <div className="bg-white dark:bg-[#12131f] border border-slate-200 dark:border-neutral-800/80 rounded-2xl p-4 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#181a28] border border-slate-200 dark:border-neutral-700/80 rounded-xl p-1 font-mono text-xs overflow-x-auto w-full sm:w-auto">
              {[
                { id: 'all', label: 'All Contests' },
                { id: 'weekly', label: 'Weekly Sunday' },
                { id: 'biweekly', label: 'Biweekly Sprint' },
                { id: 'collegiate', label: 'Collegiate Cup' },
                { id: 'archive', label: 'Past Archives' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    'px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer text-[11px] whitespace-nowrap',
                    activeTab === tab.id
                      ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                      : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 dark:text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search contests..."
                className="w-full bg-slate-50 dark:bg-[#181a28] border border-slate-300 dark:border-neutral-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

          </div>
        </div>

        {/* 5. CONTEST CARDS OR ARCHIVE VIEW */}
        {activeTab === 'archive' ? (
          /* Past Contests Archive Grid */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white font-sans flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                <span>Past Contest Championships & Winners Podium</span>
              </h3>
              <span className="text-xs font-mono text-slate-500 dark:text-neutral-400">{archives.length} Concluded Editions</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {archives.map((arch) => (
                <div
                  key={arch.contestId}
                  className="bg-white dark:bg-[#12131e] border border-slate-200 dark:border-neutral-800/80 rounded-2xl p-6 shadow-lg space-y-5 font-mono text-xs"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-neutral-800">
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white font-sans">{arch.contestTitle}</h4>
                      <span className="text-[11px] text-slate-500 dark:text-neutral-400">{arch.date} • {arch.totalParticipants.toLocaleString()} Participants</span>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 font-bold border border-slate-200 dark:border-neutral-700">
                      Concluded
                    </span>
                  </div>

                  {/* Top 3 Winners */}
                  <div className="space-y-2.5">
                    <span className="text-slate-500 dark:text-neutral-500 font-bold uppercase tracking-wider text-[10px]">Champions Podium</span>
                    {arch.winners.map((w) => (
                      <div
                        key={w.username}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-[#161726] border border-slate-200 dark:border-neutral-800 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={cn(
                            'w-5 font-black text-xs text-center',
                            w.rank === 1 ? 'text-amber-500 dark:text-amber-400' : w.rank === 2 ? 'text-slate-500 dark:text-slate-300' : 'text-amber-700 dark:text-amber-600'
                          )}>
                            #{w.rank}
                          </span>
                          <img
                            src={w.avatar}
                            alt={w.name}
                            className="w-8 h-8 rounded-full border border-slate-200 dark:border-neutral-700 object-cover"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 dark:text-white font-sans truncate">{w.name}</div>
                            <div className="text-[10px] text-slate-500 dark:text-neutral-400 truncate">{w.college}</div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-amber-600 dark:text-amber-300 font-bold">+{w.coinsAwarded} 🪙 Coins</div>
                          <div className="text-[10px] text-slate-500 dark:text-neutral-400">{w.finishTime}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Problem Slugs */}
                  <div className="pt-2 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-between">
                    <span className="text-slate-500 dark:text-neutral-500 text-[11px]">Problems:</span>
                    <div className="flex items-center gap-2">
                      {arch.problemSlugs.map((p) => (
                        <Link
                          key={p.slug}
                          to={`/dsa/${encodeURIComponent(p.slug)}`}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-amber-600 hover:text-amber-700 dark:text-amber-300 dark:hover:text-amber-200 border border-slate-200 dark:border-neutral-800 transition-colors text-[11px]"
                        >
                          {p.title} &rarr;
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Active / Upcoming Contests Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredContests.map((contest) => {
              const isRegistered = registeredIds.has(contest.id);
              const isLive = contest.status === 'live';

              return (
                <div
                  key={contest.id}
                  className={cn(
                    'rounded-3xl border p-6 sm:p-8 flex flex-col justify-between space-y-6 transition-all relative overflow-hidden shadow-xl group',
                    isLive
                      ? 'bg-gradient-to-b from-amber-500/15 via-amber-500/5 to-slate-100 dark:from-[#201810] dark:via-[#16120d] dark:to-[#100e14] border-amber-500/60 shadow-[0_0_30px_rgba(245,158,11,0.15)]'
                      : 'bg-white dark:bg-[#12131e] border-slate-200 dark:border-neutral-800/80 hover:border-amber-500/40 hover:bg-amber-50/20 dark:hover:bg-[#151624]'
                  )}
                >
                  <div className="space-y-4">
                    {/* Top Row: Type Badge + Live/Upcoming Status */}
                    <div className="flex items-center justify-between font-mono text-xs">
                      <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-300 font-bold border border-amber-500/30 uppercase tracking-wider">
                        {contest.type}
                      </span>

                      {isLive ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-300 font-bold border border-rose-500/40 animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          <span>LIVE NOW</span>
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 font-semibold border border-slate-200 dark:border-neutral-700">
                          {new Date(contest.startTime).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>

                    {/* Title & Description */}
                    <div className="space-y-2">
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors font-sans">
                        {contest.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed font-normal">
                        {contest.description}
                      </p>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-3 gap-2 font-mono text-xs pt-2">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-neutral-900/80 border border-slate-200 dark:border-neutral-800 text-center">
                        <span className="text-[10px] text-slate-500 dark:text-neutral-500 uppercase block">Duration</span>
                        <span className="text-slate-900 dark:text-white font-bold">{contest.durationMinutes} Mins</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-neutral-900/80 border border-slate-200 dark:border-neutral-800 text-center">
                        <span className="text-[10px] text-slate-500 dark:text-neutral-500 uppercase block">Prize Pool</span>
                        <span className="text-amber-600 dark:text-amber-300 font-bold">+{contest.prizeCoins} 🪙 Coins</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-neutral-900/80 border border-slate-200 dark:border-neutral-800 text-center">
                        <span className="text-[10px] text-slate-500 dark:text-neutral-500 uppercase block">Registered</span>
                        <span className="text-slate-700 dark:text-neutral-300 font-bold">{contest.registeredCount.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Rules */}
                    <ul className="space-y-1.5 text-xs text-slate-500 dark:text-neutral-400 font-mono pt-1">
                      {contest.rules.slice(0, 2).map((rule, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                          <span className="truncate">{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-4 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-between gap-3 font-mono text-xs">
                    {/* Admin Buttons */}
                    {adminMode && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => handleOpenEditModal(contest, e)}
                          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 transition-colors cursor-pointer"
                          title="Edit contest"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteContest(contest.id, contest.title, e)}
                          className="p-2 rounded-lg bg-slate-100 hover:bg-rose-100 dark:bg-neutral-800 dark:hover:bg-rose-900/40 text-slate-700 dark:text-neutral-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                          title="Delete contest"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                        </button>
                      </div>
                    )}

                    {/* Register Toggle */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleRegistration(contest.id, contest.title, e)}
                      className={cn(
                        'px-4 py-2.5 rounded-xl font-bold transition-all border cursor-pointer',
                        isRegistered
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 border-slate-300 dark:border-neutral-700 text-slate-700 dark:text-neutral-300'
                      )}
                    >
                      {isRegistered ? 'Registered ✓' : 'Register Now'}
                    </button>

                    {/* Direct Join Button */}
                    <button
                      type="button"
                      onClick={() => navigate(contest.targetRoute || '/contest')}
                      className={cn(
                        'px-5 py-2.5 rounded-xl font-black flex items-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer',
                        isLive
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                          : 'bg-slate-900 hover:bg-slate-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-white'
                      )}
                    >
                      <span>{isLive ? 'Enter Live Arena' : 'View Arena'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* 6. ADMIN CREATE / EDIT CONTEST MODAL */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#151624] border border-slate-200 dark:border-amber-500/30 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 font-mono text-xs text-slate-800 dark:text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-neutral-800 pb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 font-sans">
                <Shield className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                <span>{editingContest ? 'Edit Contest Schedule' : 'Schedule New Contest'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveContest} className="space-y-4">
              <div>
                <label className="block text-slate-700 dark:text-neutral-400 mb-1 font-bold">Contest Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setFormData({
                      ...formData,
                      title,
                      slug: editingContest ? formData.slug : title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                    });
                  }}
                  placeholder="e.g. NextEra Grand Championship #43"
                  className="w-full bg-slate-100 dark:bg-[#1c1d2e] border border-slate-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-neutral-400 mb-1 font-bold">Slug URL *</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-[#1c1d2e] border border-slate-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-neutral-400 mb-1 font-bold">Contest Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full bg-slate-100 dark:bg-[#1c1d2e] border border-slate-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  >
                    <option value="Weekly">Weekly</option>
                    <option value="Biweekly">Biweekly</option>
                    <option value="Collegiate">Collegiate</option>
                    <option value="Special Arena">Special Arena</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-neutral-400 mb-1 font-bold">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-slate-100 dark:bg-[#1c1d2e] border border-slate-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="live">Live Now</option>
                    <option value="concluded">Concluded</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-neutral-400 mb-1 font-bold">Prize Coins</label>
                  <input
                    type="number"
                    value={formData.prizeCoins}
                    onChange={(e) => setFormData({ ...formData, prizeCoins: Number(e.target.value) })}
                    className="w-full bg-slate-100 dark:bg-[#1c1d2e] border border-slate-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-neutral-400 mb-1 font-bold">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Summary of the contest objective"
                  className="w-full bg-slate-100 dark:bg-[#1c1d2e] border border-slate-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black cursor-pointer shadow-md"
                >
                  Save Contest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ContestsHubPage;
