import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Plus,
  Edit3,
  Trash2,
  RotateCcw,
  Shield,
  Layers,
  Star,
  Shuffle,
} from 'lucide-react';
import { top150Service, Top150Problem, TOP_150_CATEGORIES } from '../../services/top150.service';
import { coinService } from '../../services/coin.service';
import { PRACTICE_PROBLEMS_CATALOG } from '../../services/contest.service';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/ui/Toast';
import { ROUTES } from '../../constants/routes';
import { cn } from '../../utils/cn';

export const TopInterview150Page: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { success, error: toastError, info } = useToast();

  const [problems, setProblems] = useState<Top150Problem[]>([]);
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set());
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [wallet, setWallet] = useState(() => coinService.getState());

  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedCompany, setSelectedCompany] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<'All' | 'Solved' | 'Unsolved'>('All');

  // Category Collapsed state
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // Admin Controls state
  const [adminMode, setAdminMode] = useState(false);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingProblem, setEditingProblem] = useState<Top150Problem | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    difficulty: 'Medium' as 'Easy' | 'Medium' | 'Hard',
    category: 'Array / String',
    companies: 'Google, Amazon, Meta',
    acceptanceRate: '52.0%',
    frequency: 85,
    points: 200,
    hints: '',
  });

  // Subscribe to service changes
  useEffect(() => {
    const updateData = () => {
      setProblems(top150Service.getProblems());
      setSolvedIds(top150Service.getSolvedIds());
      setFavoriteIds(top150Service.getFavoriteIds());
    };
    updateData();
    const unsub = top150Service.subscribe(updateData);
    const unsubCoin = coinService.subscribe(setWallet);
    return () => {
      unsub();
      unsubCoin();
    };
  }, []);

  // Stats calculation
  const stats = useMemo(() => top150Service.getStats(), [problems, solvedIds]);

  // Unique companies list
  const allCompanies = useMemo(() => {
    const set = new Set<string>();
    problems.forEach((p) => p.companies?.forEach((c) => set.add(c)));
    return ['All', ...Array.from(set).sort()];
  }, [problems]);

  // Filtered problems
  const filteredProblems = useMemo(() => {
    return problems.filter((p) => {
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(query);
        const matchesCat = p.category.toLowerCase().includes(query);
        const matchesComp = p.companies?.some((c) => c.toLowerCase().includes(query));
        if (!matchesTitle && !matchesCat && !matchesComp) return false;
      }

      if (selectedDifficulty !== 'All' && p.difficulty !== selectedDifficulty) {
        return false;
      }

      if (selectedCategory !== 'All' && p.category !== selectedCategory) {
        return false;
      }

      if (selectedCompany !== 'All' && !p.companies?.includes(selectedCompany)) {
        return false;
      }

      if (selectedStatus === 'Solved' && !solvedIds.has(p.id)) {
        return false;
      }

      if (selectedStatus === 'Unsolved' && solvedIds.has(p.id)) {
        return false;
      }

      return true;
    });
  }, [problems, search, selectedDifficulty, selectedCategory, selectedCompany, selectedStatus, solvedIds]);

  // Grouped by category
  const groupedByCategory = useMemo(() => {
    const map: Record<string, Top150Problem[]> = {};
    filteredProblems.forEach((p) => {
      if (!map[p.category]) map[p.category] = [];
      map[p.category].push(p);
    });
    return map;
  }, [filteredProblems]);

  const toggleCategoryCollapse = (cat: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }));
  };

  const handleToggleSolved = (problemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isNowSolved = top150Service.toggleSolved(problemId);
    if (isNowSolved) {
      success('Problem marked as solved! Keep up the momentum 🚀');
    }
  };

  const handleToggleFavorite = (problemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isFav = top150Service.toggleFavorite(problemId);
    if (isFav) {
      info('Problem added to your starred list ⭐');
    }
  };

  const handlePickRandom = () => {
    const pool = filteredProblems.length > 0 ? filteredProblems : problems;
    if (pool.length === 0) return;
    const random = pool[Math.floor(Math.random() * pool.length)];
    navigate(`/dsa/${encodeURIComponent(random.slug)}`);
  };

  // Admin: Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingProblem(null);
    setFormData({
      title: '',
      slug: '',
      difficulty: 'Medium',
      category: 'Array / String',
      companies: 'Google, Amazon, Meta',
      acceptanceRate: '50.0%',
      frequency: 80,
      points: 200,
      hints: '',
    });
    setIsAddEditModalOpen(true);
  };

  // Admin: Open Edit Modal
  const handleOpenEditModal = (p: Top150Problem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProblem(p);
    setFormData({
      title: p.title,
      slug: p.slug,
      difficulty: p.difficulty,
      category: p.category,
      companies: p.companies.join(', '),
      acceptanceRate: p.acceptanceRate,
      frequency: p.frequency,
      points: p.points,
      hints: p.hints ? p.hints.join('\n') : '',
    });
    setIsAddEditModalOpen(true);
  };

  // Admin: Delete
  const handleDeleteProblem = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to remove "${title}" from the Top 150 list?`)) {
      top150Service.deleteProblem(id);
      success(`Problem "${title}" removed.`);
    }
  };

  // Admin: Save Form
  const handleSaveProblem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.slug.trim()) {
      toastError('Title and Slug are required fields.');
      return;
    }

    const companiesArray = formData.companies
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const hintsArray = formData.hints
      .split('\n')
      .map((h) => h.trim())
      .filter(Boolean);

    if (editingProblem) {
      top150Service.updateProblem(editingProblem.id, {
        title: formData.title.trim(),
        slug: formData.slug.trim().toLowerCase().replace(/\s+/g, '-'),
        difficulty: formData.difficulty,
        category: formData.category,
        companies: companiesArray,
        acceptanceRate: formData.acceptanceRate,
        frequency: Number(formData.frequency) || 80,
        points: Number(formData.points) || 100,
        hints: hintsArray,
      });
      success('Problem updated successfully!');
    } else {
      top150Service.addProblem({
        title: formData.title.trim(),
        slug: formData.slug.trim().toLowerCase().replace(/\s+/g, '-'),
        difficulty: formData.difficulty,
        category: formData.category,
        companies: companiesArray,
        acceptanceRate: formData.acceptanceRate,
        frequency: Number(formData.frequency) || 80,
        points: Number(formData.points) || 100,
        hints: hintsArray,
      });
      success('New problem added to Top 150!');
    }
    setIsAddEditModalOpen(false);
  };

  // Admin: Reset to Default
  const handleResetToDefault = () => {
    if (window.confirm('Reset the Top 150 catalog back to the original curated LeetCode list?')) {
      top150Service.resetToDefault();
      success('Catalog reset to default 100+ problems.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0d0e15] text-slate-800 dark:text-slate-200 antialiased font-sans selection:bg-cyan-500/30 selection:text-cyan-200 pb-20">
      
      {/* 1. TOP NAVBAR / BREADCRUMB */}
      <div className="border-b border-slate-200 dark:border-neutral-800/80 bg-white/90 dark:bg-[#12131e]/90 backdrop-blur-md relative z-10 px-4 sm:px-8 py-3.5 flex items-center justify-between font-mono text-xs">
        <div className="flex items-center gap-3">
          <Link
            to={ROUTES.PRACTICE}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-neutral-900/80 dark:hover:bg-neutral-800 text-slate-700 hover:text-slate-900 dark:text-neutral-300 dark:hover:text-white border border-slate-200 dark:border-neutral-800 transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
          >
            <span>&larr; Practice Hub</span>
          </Link>
          <div className="h-4 w-px bg-slate-200 dark:bg-neutral-800 hidden sm:block" />
          <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-bold">
            <Sparkles className="w-4 h-4" />
            <span>NEC DSA Sheet — Top Interview 150</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Live Wallet Pill */}
          <Link
            to={ROUTES.REWARDS}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-mono font-bold transition-all shadow-xs"
            title="Your NEC Coins Wallet"
          >
            <span>🪙</span>
            <span>{wallet.coins} Coins</span>
          </Link>

          {/* Admin Mode Toggle */}
          {(isAdmin || user?.role === 'admin') && (
            <button
              type="button"
              onClick={() => setAdminMode(!adminMode)}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all border cursor-pointer',
                adminMode
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-700 dark:text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                  : 'bg-slate-100 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{adminMode ? 'Admin Active' : 'Admin Control'}</span>
            </button>
          )}

          {/* Random Problem */}
          <button
            type="button"
            onClick={handlePickRandom}
            className="px-3 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            title="Pick a random question to solve"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pick Random</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        
        {/* 2. HERO BANNER & INTERACTIVE PROGRESS CARD */}
        <div className="relative rounded-3xl p-[1.5px] bg-gradient-to-r from-cyan-500/40 via-indigo-500/30 to-emerald-500/40 shadow-xl shadow-cyan-500/5 dark:shadow-black/40">
          <div className="relative rounded-[22px] bg-white/95 dark:bg-[#10121e]/95 backdrop-blur-2xl p-6 sm:p-8 lg:p-9 overflow-hidden">
            {/* Top Accent Strip in RGB Gradient */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-500" />

            {/* Ambient Background Glows */}
            <div className="absolute -top-20 -left-20 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Left Col: Header & Description */}
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-100 dark:bg-dark-800 border border-slate-200/90 dark:border-dark-700 text-slate-800 dark:text-slate-200 text-xs font-mono font-bold tracking-wide shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-500 animate-pulse" />
                  <span>NEC DSA Sheet • FAANG & Product Company High-Frequency Problems</span>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                  NEC DSA Sheet{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-indigo-600 to-emerald-600 dark:from-cyan-400 dark:via-indigo-400 dark:to-emerald-400">
                    — Top Interview 150
                  </span>
                </h1>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed font-normal">
                  The ultimate collection of 150 essential algorithmic coding problems curated from high-frequency FAANG, Microsoft & Tier-1 company interviews across all core DSA patterns: Two Pointers, Sliding Windows, Dynamic Programming, Graphs, and Advanced Trees.
                </p>

                {/* Company Badges Preview */}
                <div className="pt-2 flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">Target Companies:</span>
                  {['Google', 'Amazon', 'Meta', 'Microsoft', 'Apple', 'Uber'].map((comp) => (
                    <button
                      key={comp}
                      type="button"
                      onClick={() => setSelectedCompany(selectedCompany === comp ? 'All' : comp)}
                      className={cn(
                        'text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer font-mono font-medium',
                        selectedCompany === comp
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-slate-900 dark:border-white font-bold shadow-xs'
                          : 'bg-slate-50 dark:bg-dark-800 border-slate-200 dark:border-dark-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-750 hover:border-slate-300 dark:hover:border-slate-600'
                      )}
                    >
                      {comp}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Col: Progress Box & Telemetry Stats */}
              <div className="lg:col-span-5 rounded-2xl bg-slate-50/80 dark:bg-[#161828]/80 border border-slate-200/80 dark:border-dark-750 p-5 backdrop-blur-md shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Your Progress</h3>
                    <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
                      {stats.solved} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">/ {stats.total} Solved</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400 font-mono">{stats.percentage}%</div>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Completion</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-2 rounded-full bg-slate-200/80 dark:bg-dark-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${stats.percentage}%` }}
                  />
                </div>

                {/* Difficulty Breakdown Badges */}
                <div className="grid grid-cols-3 gap-2.5 pt-1 text-center font-mono">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-dark-900 border border-emerald-500/30 shadow-2xs">
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">Easy</div>
                    <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                      {stats.easy.solved} <span className="text-[10px] text-slate-400">/ {stats.easy.total}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-dark-900 border border-amber-500/30 shadow-2xs">
                    <div className="text-[11px] text-amber-600 dark:text-amber-400 font-bold uppercase">Medium</div>
                    <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                      {stats.medium.solved} <span className="text-[10px] text-slate-400">/ {stats.medium.total}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-dark-900 border border-rose-500/30 shadow-2xs">
                    <div className="text-[11px] text-rose-600 dark:text-rose-400 font-bold uppercase">Hard</div>
                    <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                      {stats.hard.solved} <span className="text-[10px] text-slate-400">/ {stats.hard.total}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* 3. ADMIN MANAGEMENT TOOLBAR (Visible if adminMode is ON) */}
        {adminMode && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50 via-white to-slate-50 dark:from-rose-950/40 dark:via-neutral-900 dark:to-neutral-900 border border-rose-300 dark:border-rose-500/40 flex flex-wrap items-center justify-between gap-4 shadow-md">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Top 150 Administrator Control Center</h4>
                <p className="text-xs text-slate-500 dark:text-neutral-400">Add custom problems, edit metadata, delete, or reset curated catalog.</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Problem</span>
              </button>

              <button
                type="button"
                onClick={handleResetToDefault}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 text-xs font-mono font-bold flex items-center gap-1.5 border border-slate-300 dark:border-neutral-700 active:scale-95 transition-all cursor-pointer"
                title="Reset all 150 problems to original state"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span>Reset Defaults</span>
              </button>
            </div>
          </div>
        )}

        {/* 4. SEARCH & FILTER TOOLBAR */}
        <div className="bg-white dark:bg-[#12131f] border border-slate-200 dark:border-neutral-800/80 rounded-2xl p-4 shadow-sm dark:shadow-md space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
            
            {/* Search Input */}
            <div className="lg:col-span-5 relative">
              <Search className="w-4 h-4 text-slate-400 dark:text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search problem title, topic, company..."
                className="w-full bg-slate-50 dark:bg-[#181a28] border border-slate-200 dark:border-neutral-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-white cursor-pointer"
                >
                  &times;
                </button>
              )}
            </div>

            {/* Category Dropdown */}
            <div className="lg:col-span-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#181a28] border border-slate-200 dark:border-neutral-700/80 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-neutral-200 focus:outline-none focus:border-cyan-500 font-mono cursor-pointer"
              >
                <option value="All">All Topics ({problems.length})</option>
                {TOP_150_CATEGORIES.map((cat) => {
                  const count = problems.filter((p) => p.category === cat).length;
                  return (
                    <option key={cat} value={cat}>
                      {cat} ({count})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Difficulty Tabs */}
            <div className="lg:col-span-2 flex items-center bg-slate-50 dark:bg-[#181a28] border border-slate-200 dark:border-neutral-700/80 rounded-xl p-1 font-mono text-xs">
              {(['All', 'Easy', 'Medium', 'Hard'] as const).map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setSelectedDifficulty(diff)}
                  className={cn(
                    'flex-1 py-1 rounded-lg text-center font-bold transition-all cursor-pointer text-[11px]',
                    selectedDifficulty === diff
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-xs'
                      : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  {diff}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="lg:col-span-2 flex items-center bg-slate-50 dark:bg-[#181a28] border border-slate-200 dark:border-neutral-700/80 rounded-xl p-1 font-mono text-xs">
              {(['All', 'Solved', 'Unsolved'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedStatus(st)}
                  className={cn(
                    'flex-1 py-1 rounded-lg text-center font-bold transition-all cursor-pointer text-[11px]',
                    selectedStatus === st
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-xs'
                      : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  {st}
                </button>
              ))}
            </div>

          </div>

          {/* Company Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono scrollbar-thin">
            <span className="text-slate-400 dark:text-neutral-500 font-bold shrink-0">Company:</span>
            {allCompanies.slice(0, 10).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedCompany(c)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all shrink-0 cursor-pointer',
                  selectedCompany === c
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-700 dark:text-cyan-300 font-bold'
                    : 'bg-slate-100 dark:bg-neutral-900/60 border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-neutral-700'
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* 5. TOPIC ACCORDION GROUPS & PROBLEM LIST */}
        <div className="space-y-6">
          {Object.keys(groupedByCategory).length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-[#12131f] border border-slate-200 dark:border-neutral-800 rounded-3xl space-y-3 shadow-sm">
              <Filter className="w-8 h-8 text-slate-400 dark:text-neutral-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-800 dark:text-neutral-300">No problems match your filter criteria</h3>
              <p className="text-xs text-slate-500 dark:text-neutral-500 font-mono">Try adjusting search query, topic, or difficulty settings.</p>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSelectedDifficulty('All');
                  setSelectedCategory('All');
                  setSelectedCompany('All');
                  setSelectedStatus('All');
                }}
                className="px-4 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 text-xs font-mono font-bold hover:bg-cyan-500/20 transition-all cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            Object.entries(groupedByCategory).map(([category, catProblems]) => {
              const isCollapsed = Boolean(collapsedCategories[category]);
              const catSolvedCount = catProblems.filter((p) => solvedIds.has(p.id)).length;
              const catTotalCount = catProblems.length;
              const isAllCatSolved = catSolvedCount === catTotalCount && catTotalCount > 0;

              return (
                <div
                  key={category}
                  className="bg-white dark:bg-[#12131f] border border-slate-200 dark:border-neutral-800/80 rounded-2xl overflow-hidden shadow-sm transition-all"
                >
                  {/* Category Header */}
                  <div
                    onClick={() => toggleCategoryCollapse(category)}
                    className="px-5 py-3.5 bg-slate-50 dark:bg-[#171826] border-b border-slate-200 dark:border-neutral-800/80 flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-[#1c1d2e] transition-colors select-none"
                  >
                    <div className="flex items-center gap-3">
                      <Layers className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white font-mono flex items-center gap-2">
                        <span>{category}</span>
                        {isAllCatSolved && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                            Completed ✓
                          </span>
                        )}
                      </h3>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Solved Count Badge */}
                      <span className="text-xs font-mono font-bold text-slate-600 dark:text-neutral-400 bg-slate-100 dark:bg-neutral-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-neutral-800">
                        <span className="text-cyan-600 dark:text-cyan-400">{catSolvedCount}</span> / {catTotalCount}
                      </span>

                      {isCollapsed ? (
                        <ChevronDown className="w-4 h-4 text-slate-400 dark:text-neutral-400" />
                      ) : (
                        <ChevronUp className="w-4 h-4 text-slate-400 dark:text-neutral-400" />
                      )}
                    </div>
                  </div>

                  {/* Problem Rows Table */}
                  {!isCollapsed && (
                    <div className="divide-y divide-slate-100 dark:divide-neutral-800/60">
                      {catProblems.map((prob) => {
                        const isSolved = solvedIds.has(prob.id);
                        const isFav = favoriteIds.has(prob.id);

                        return (
                          <div
                            key={prob.id}
                            onClick={() => navigate(`/dsa/${encodeURIComponent(prob.slug)}`)}
                            className={cn(
                              'px-5 py-3 flex items-center justify-between gap-4 transition-colors group cursor-pointer font-mono text-xs',
                              isSolved ? 'bg-emerald-50/50 dark:bg-emerald-950/10 hover:bg-emerald-50 dark:hover:bg-emerald-950/20' : 'hover:bg-slate-50 dark:hover:bg-[#18192a]'
                            )}
                          >
                            {/* Left: Checkbox + Number + Title */}
                            <div className="flex items-center gap-3.5 min-w-0 flex-1">
                              <button
                                type="button"
                                onClick={(e) => handleToggleSolved(prob.id, e)}
                                className="text-slate-400 hover:text-emerald-600 dark:text-neutral-500 dark:hover:text-emerald-400 transition-colors shrink-0 cursor-pointer"
                                title={isSolved ? 'Mark Unsolved' : 'Mark Solved'}
                              >
                                {isSolved ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
                                ) : (
                                  <Circle className="w-4 h-4 text-slate-300 dark:text-neutral-600 hover:text-slate-500 dark:hover:text-neutral-400" />
                                )}
                              </button>

                              <span className="text-slate-400 dark:text-neutral-500 font-bold shrink-0 w-8">
                                #{prob.number}
                              </span>

                              <div className="min-w-0 flex-1 flex items-center gap-2 flex-wrap">
                                <span className={cn('font-bold font-sans text-sm transition-colors truncate', isSolved ? 'text-slate-400 dark:text-neutral-300 line-through decoration-slate-400 dark:decoration-neutral-600' : 'text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300')}>
                                  {prob.title}
                                </span>

                                {prob.isCustom && (
                                  <span className="text-[10px] bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 px-1.5 py-0.2 rounded font-mono">
                                    Custom
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Center / Right Metadata */}
                            <div className="flex items-center gap-3 shrink-0">
                              {/* Companies */}
                              <div className="hidden md:flex items-center gap-1">
                                {prob.companies?.slice(0, 3).map((comp) => (
                                  <span
                                    key={comp}
                                    className="px-2 py-0.5 rounded bg-slate-100 dark:bg-neutral-900 text-slate-600 dark:text-neutral-400 text-[10px] border border-slate-200 dark:border-neutral-800"
                                  >
                                    {comp}
                                  </span>
                                ))}
                              </div>

                              {/* Acceptance */}
                              <span className="hidden sm:inline text-[11px] text-slate-500 dark:text-neutral-400 w-14 text-right">
                                {prob.acceptanceRate}
                              </span>

                              {/* Difficulty Badge */}
                              <span
                                className={cn(
                                  'px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider',
                                  prob.difficulty === 'Easy'
                                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                                    : prob.difficulty === 'Medium'
                                    ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20'
                                    : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'
                                )}
                              >
                                {prob.difficulty}
                              </span>

                              {/* Favorite Star */}
                              <button
                                type="button"
                                onClick={(e) => handleToggleFavorite(prob.id, e)}
                                className={cn(
                                  'p-1.5 rounded-lg transition-colors cursor-pointer',
                                  isFav ? 'text-amber-500 dark:text-amber-400' : 'text-slate-300 hover:text-slate-600 dark:text-neutral-600 dark:hover:text-neutral-300'
                                )}
                                title={isFav ? 'Starred' : 'Star problem'}
                              >
                                <Star className={cn('w-3.5 h-3.5', isFav ? 'fill-amber-400' : '')} />
                              </button>

                              {/* Admin Action Buttons */}
                              {adminMode && (
                                <div className="flex items-center gap-1 border-l border-slate-200 dark:border-neutral-800 pl-2">
                                  <button
                                    type="button"
                                    onClick={(e) => handleOpenEditModal(prob, e)}
                                    className="p-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 transition-colors"
                                    title="Edit problem"
                                  >
                                    <Edit3 className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => handleDeleteProblem(prob.id, prob.title, e)}
                                    className="p-1 rounded bg-slate-100 hover:bg-rose-100 dark:bg-neutral-800 dark:hover:bg-rose-900/40 text-slate-700 dark:text-neutral-300 transition-colors"
                                    title="Delete problem"
                                  >
                                    <Trash2 className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                                  </button>
                                </div>
                              )}

                              {/* Direct Solve Button */}
                              <button
                                type="button"
                                onClick={() => navigate(`/dsa/${encodeURIComponent(prob.slug)}`)}
                                className="px-3 py-1 rounded-lg bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-500/10 dark:hover:bg-cyan-500/20 border border-cyan-200 dark:border-cyan-500/30 text-cyan-700 dark:text-cyan-300 text-xs font-bold flex items-center gap-1 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-all cursor-pointer"
                              >
                                <span>{isSolved ? 'Review' : 'Solve'}</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* 6. ADMIN ADD / EDIT PROBLEM MODAL */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#151624] border border-slate-200 dark:border-cyan-500/30 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 text-slate-800 dark:text-slate-200 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-neutral-800 pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />
                <span>{editingProblem ? 'Edit Top 150 Problem' : 'Add New Problem to Top 150'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddEditModalOpen(false)}
                className="text-slate-400 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white text-lg font-mono"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveProblem} className="space-y-4 font-mono text-xs">
              {!editingProblem && (
                <div className="p-3 rounded-xl bg-cyan-500/10 dark:bg-cyan-950/30 border border-cyan-500/30 space-y-1.5">
                  <label className="block text-cyan-700 dark:text-cyan-300 font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>⚡ Quick Import from Practice Catalog</span>
                  </label>
                  <select
                    onChange={(e) => {
                      const val = e.target.value;
                      const match = PRACTICE_PROBLEMS_CATALOG.find((p) => p.slug === val);
                      if (match) {
                        setFormData({
                          ...formData,
                          title: match.title,
                          slug: match.slug,
                          difficulty: match.difficulty,
                          category: match.category || 'Array / String',
                          companies: 'Google, Amazon, Meta, Microsoft',
                          acceptanceRate: '54.0%',
                          points: match.difficulty === 'Hard' ? 300 : match.difficulty === 'Medium' ? 200 : 100,
                        });
                      }
                    }}
                    className="w-full bg-white dark:bg-[#1c1d2e] border border-cyan-500/40 rounded-xl px-3 py-2 text-slate-800 dark:text-cyan-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="">-- Choose a Problem to Auto-Fill --</option>
                    <optgroup label="Practice Catalog Problems">
                      {PRACTICE_PROBLEMS_CATALOG.map((p) => (
                        <option key={p.slug} value={p.slug}>
                          [{p.difficulty}] {p.title} ({p.category})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-600 dark:text-neutral-400 mb-1 font-bold">Problem Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setFormData({
                      ...formData,
                      title,
                      slug: editingProblem ? formData.slug : title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                    });
                  }}
                  placeholder="e.g. Valid Palindrome"
                  className="w-full bg-slate-100 dark:bg-[#1c1d2e] border border-slate-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-neutral-400 mb-1 font-bold">Slug URL *</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="e.g. valid-palindrome"
                    className="w-full bg-slate-100 dark:bg-[#1c1d2e] border border-slate-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-neutral-400 mb-1 font-bold">Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                    className="w-full bg-slate-100 dark:bg-[#1c1d2e] border border-slate-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-neutral-400 mb-1 font-bold">Topic Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-slate-100 dark:bg-[#1c1d2e] border border-slate-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  {TOP_150_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-neutral-400 mb-1 font-bold">Companies (comma separated)</label>
                <input
                  type="text"
                  value={formData.companies}
                  onChange={(e) => setFormData({ ...formData, companies: e.target.value })}
                  placeholder="e.g. Google, Amazon, Microsoft, Meta"
                  className="w-full bg-slate-100 dark:bg-[#1c1d2e] border border-slate-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-neutral-400 mb-1 font-bold">Acceptance Rate</label>
                  <input
                    type="text"
                    value={formData.acceptanceRate}
                    onChange={(e) => setFormData({ ...formData, acceptanceRate: e.target.value })}
                    placeholder="e.g. 54.2%"
                    className="w-full bg-slate-100 dark:bg-[#1c1d2e] border border-slate-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-neutral-400 mb-1 font-bold">Points Awarded</label>
                  <input
                    type="number"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: Number(e.target.value) })}
                    className="w-full bg-slate-100 dark:bg-[#1c1d2e] border border-slate-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black shadow-lg transition-all cursor-pointer"
                >
                  Save Problem
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
export default TopInterview150Page;
