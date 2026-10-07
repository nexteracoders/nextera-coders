import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../components/ui/Toast';
import { ROUTES } from '../../constants/routes';
import {
  top150Service,
  Top150Problem,
  TOP_150_CATEGORIES,
} from '../../services/top150.service';
import {
  Target,
  Search,
  CheckCircle2,
  Plus,
  Edit3,
  Trash2,
  RotateCcw,
  TrendingUp,
  Layers,
  ExternalLink,
  Shuffle,
  Users,
  Video,
  HelpCircle,
  X,
  BarChart3,
  Trophy,
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface Top150StudentLeader {
  rank: number;
  name: string;
  username: string;
  avatar: string;
  college: string;
  solvedCount: number;
  totalProblems: number;
  streak: number;
  badge: string;
  lastActive: string;
}

const MOCK_TOP_STUDENTS: Top150StudentLeader[] = [
  {
    rank: 1,
    name: 'Devanshu Verma',
    username: 'dev_algo_god',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    college: 'IIT Bombay',
    solvedCount: 148,
    totalProblems: 150,
    streak: 64,
    badge: 'FAANG Ready Master',
    lastActive: '12m ago',
  },
  {
    rank: 2,
    name: 'Ishita Kashyap',
    username: 'ishita_k',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    college: 'IIIT Allahabad',
    solvedCount: 142,
    totalProblems: 150,
    streak: 52,
    badge: 'Diamond Coder',
    lastActive: '45m ago',
  },
  {
    rank: 3,
    name: 'Tanmay Kulkarni',
    username: 'tanmay_k',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    college: 'BITS Pilani',
    solvedCount: 136,
    totalProblems: 150,
    streak: 41,
    badge: 'Algorithm Specialist',
    lastActive: '2h ago',
  },
  {
    rank: 4,
    name: 'Bhavna Aggarwal',
    username: 'bhavna_ag',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    college: 'DTU Delhi',
    solvedCount: 129,
    totalProblems: 150,
    streak: 38,
    badge: 'Tree & DP Slayer',
    lastActive: '3h ago',
  },
  {
    rank: 5,
    name: 'Mohit Reddy',
    username: 'mohit_r',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    college: 'NIT Surathkal',
    solvedCount: 121,
    totalProblems: 150,
    streak: 29,
    badge: 'Graph Master',
    lastActive: '5h ago',
  },
];

export const AdminTop150Page: React.FC = () => {
  useDocumentTitle('NEC Top 150 Management & Tracking — Admin CMS');
  const { success, error: toastError } = useToast();

  const [problems, setProblems] = useState<Top150Problem[]>([]);
  const [activeTab, setActiveTab] = useState<'problems' | 'analytics' | 'leaderboard'>('problems');

  // Search & Filters
  const [search, setSearch] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedCompany, setSelectedCompany] = useState<string>('All');

  // Modal State for Add / Edit / Swap
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProblem, setEditingProblem] = useState<Top150Problem | null>(null);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [targetSwapProblem, setTargetSwapProblem] = useState<Top150Problem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    difficulty: 'Medium' as 'Easy' | 'Medium' | 'Hard',
    category: 'Array / String',
    companies: 'Google, Amazon, Meta',
    acceptanceRate: '54.2%',
    frequency: 85,
    points: 200,
    hints: '',
    youtubeUrl: '',
    solutionNotes: '',
  });

  // Reset confirmation modal
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Subscribe to service
  useEffect(() => {
    const updateData = () => {
      setProblems(top150Service.getProblems());
    };
    updateData();
    const unsub = top150Service.subscribe(updateData);
    return () => unsub();
  }, []);

  // Stats calculation
  const totalCount = problems.length;
  const easyCount = problems.filter((p) => p.difficulty === 'Easy').length;
  const mediumCount = problems.filter((p) => p.difficulty === 'Medium').length;
  const hardCount = problems.filter((p) => p.difficulty === 'Hard').length;

  // Unique companies
  const allCompanies = useMemo(() => {
    const set = new Set<string>();
    problems.forEach((p) => p.companies?.forEach((c) => set.add(c)));
    return ['All', ...Array.from(set).sort()];
  }, [problems]);

  // Filtered problems list
  const filteredProblems = useMemo(() => {
    return problems.filter((p) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesCategory = p.category.toLowerCase().includes(q);
        const matchesSlug = p.slug.toLowerCase().includes(q);
        const matchesCompany = p.companies?.some((c) => c.toLowerCase().includes(q));
        if (!matchesTitle && !matchesCategory && !matchesSlug && !matchesCompany) {
          return false;
        }
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

      return true;
    });
  }, [problems, search, selectedDifficulty, selectedCategory, selectedCompany]);

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingProblem(null);
    setFormData({
      title: '',
      slug: '',
      difficulty: 'Medium',
      category: 'Array / String',
      companies: 'Google, Amazon, Meta, Microsoft',
      acceptanceRate: '52.0%',
      frequency: 85,
      points: 200,
      hints: '',
      youtubeUrl: '',
      solutionNotes: '',
    });
    setIsEditModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (prob: Top150Problem) => {
    setEditingProblem(prob);
    setFormData({
      title: prob.title,
      slug: prob.slug,
      difficulty: prob.difficulty,
      category: prob.category,
      companies: prob.companies?.join(', ') || '',
      acceptanceRate: prob.acceptanceRate || '50.0%',
      frequency: prob.frequency || 80,
      points: prob.points || 200,
      hints: prob.hints?.join('\n') || '',
      youtubeUrl: prob.youtubeUrl || '',
      solutionNotes: prob.solutionNotes || '',
    });
    setIsEditModalOpen(true);
  };

  // Save problem (Create or Update)
  const handleSaveProblem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toastError('Problem title is required', 'Validation Error');
      return;
    }

    const slug = formData.slug.trim()
      ? formData.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
      : formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const companiesArray = formData.companies
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const hintsArray = formData.hints
      .split('\n')
      .map((h) => h.trim())
      .filter(Boolean);

    if (editingProblem) {
      // Update
      top150Service.updateProblem(editingProblem.id, {
        title: formData.title,
        slug,
        difficulty: formData.difficulty,
        category: formData.category,
        companies: companiesArray.length > 0 ? companiesArray : ['Google', 'Amazon'],
        acceptanceRate: formData.acceptanceRate,
        frequency: Number(formData.frequency) || 80,
        points: Number(formData.points) || (formData.difficulty === 'Easy' ? 100 : formData.difficulty === 'Medium' ? 200 : 300),
        hints: hintsArray,
        youtubeUrl: formData.youtubeUrl,
        solutionNotes: formData.solutionNotes,
      });
      success(`Updated problem "${formData.title}" in Top 150`, 'Problem Updated');
    } else {
      // Create
      top150Service.addProblem({
        title: formData.title,
        slug,
        difficulty: formData.difficulty,
        category: formData.category,
        companies: companiesArray.length > 0 ? companiesArray : ['Google', 'Amazon'],
        acceptanceRate: formData.acceptanceRate,
        frequency: Number(formData.frequency) || 80,
        points: Number(formData.points) || (formData.difficulty === 'Easy' ? 100 : formData.difficulty === 'Medium' ? 200 : 300),
        hints: hintsArray,
        youtubeUrl: formData.youtubeUrl,
        solutionNotes: formData.solutionNotes,
      });
      success(`Added "${formData.title}" to Top 150 sheet`, 'Problem Added');
    }

    setIsEditModalOpen(false);
  };

  // Delete problem
  const handleDeleteProblem = (prob: Top150Problem) => {
    if (window.confirm(`Are you sure you want to remove "#${prob.number}: ${prob.title}" from the Top 150 sheet?`)) {
      top150Service.deleteProblem(prob.id);
      success(`Removed "${prob.title}" from Top 150 sheet`, 'Problem Removed');
    }
  };

  // Open Swap Modal
  const handleOpenSwap = (prob: Top150Problem) => {
    setTargetSwapProblem(prob);
    setIsSwapModalOpen(true);
  };

  // Execute Swap (Replaces problem details with new trending question while maintaining position)
  const handleExecuteSwap = (newQuestionData: Partial<Top150Problem>) => {
    if (!targetSwapProblem) return;

    top150Service.updateProblem(targetSwapProblem.id, {
      title: newQuestionData.title || targetSwapProblem.title,
      slug: (newQuestionData.title || targetSwapProblem.title).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      difficulty: newQuestionData.difficulty || targetSwapProblem.difficulty,
      category: newQuestionData.category || targetSwapProblem.category,
      companies: newQuestionData.companies || ['Google', 'Amazon', 'Meta'],
      frequency: 95,
      acceptanceRate: '54.0%',
      points: newQuestionData.difficulty === 'Easy' ? 100 : newQuestionData.difficulty === 'Medium' ? 200 : 300,
    });

    setIsSwapModalOpen(false);
    success(
      `Successfully swapped #${targetSwapProblem.number} with "${newQuestionData.title}"!`,
      'Problem Swapped'
    );
  };

  // Reset to default standard 150
  const handleConfirmReset = () => {
    top150Service.resetToDefault();
    setIsResetConfirmOpen(false);
    success('Restored Top 150 sheet to original FAANG curated standard!', 'Reset Complete');
  };

  // Category completion statistics (mock student engagement)
  const categoryStats = useMemo(() => {
    const statsMap: Record<string, { count: number; avgCompletion: number }> = {};

    TOP_150_CATEGORIES.forEach((cat) => {
      const count = problems.filter((p) => p.category === cat).length;
      // Simulated realistic completion rates across student body
      let comp = 65;
      if (cat.includes('Array') || cat.includes('Two Pointer')) comp = 78;
      else if (cat.includes('Stack') || cat.includes('Sliding')) comp = 68;
      else if (cat.includes('Tree') || cat.includes('BFS')) comp = 54;
      else if (cat.includes('Graph')) comp = 42;
      else if (cat.includes('Dynamic Programming')) comp = 28;
      else if (cat.includes('Bit')) comp = 35;
      statsMap[cat] = { count, avgCompletion: comp };
    });

    return statsMap;
  }, [problems]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  NEC Top 150 DSA Sheet Management
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  {totalCount} Questions
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Curate, update, swap, and monitor student completion across the Top 150 FAANG & Tier-1 interview preparation sheet.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          <Link
            to={ROUTES.TOP_INTERVIEW_150}
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Student Sheet</span>
          </Link>

          <button
            onClick={() => setIsResetConfirmOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer"
            title="Reset sheet to canonical default problems"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Standard</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-xl shadow-md shadow-purple-500/20 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Problem</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Problems */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Curated
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {totalCount}
            </span>
            <span className="text-xs text-slate-400">Questions</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            <span className="text-emerald-500 font-bold">{easyCount} Easy</span>
            <span>•</span>
            <span className="text-amber-500 font-bold">{mediumCount} Med</span>
            <span>•</span>
            <span className="text-rose-500 font-bold">{hardCount} Hard</span>
          </p>
        </div>

        {/* Card 2: Active Student Solvers */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Student Solvers
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              1,842
            </span>
            <span className="text-xs font-medium text-emerald-500 flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +24% this month
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Registered students working through the sheet
          </p>
        </div>

        {/* Card 3: Total Completed Solves */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Solves
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              43.8K
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Accepted test-case solutions submitted
          </p>
        </div>

        {/* Card 4: Top Category Mastery */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Top Topic Solved
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900 dark:text-white truncate">
              Array / String
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            78% average student completion rate
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('problems')}
          className={cn(
            'px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2',
            activeTab === 'problems'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          )}
        >
          <Layers className="w-4 h-4" />
          <span>Problem Roster ({filteredProblems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={cn(
            'px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2',
            activeTab === 'analytics'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          )}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Category Mastery Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={cn(
            'px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2',
            activeTab === 'leaderboard'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          )}
        >
          <Trophy className="w-4 h-4" />
          <span>Student Leaderboard</span>
        </button>
      </div>

      {/* TAB 1: PROBLEM ROSTER & DYNAMIC MANAGEMENT */}
      {activeTab === 'problems' && (
        <div className="space-y-4">
          {/* Search & Filter Toolbar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            {/* Search */}
            <div className="relative md:col-span-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title, slug or company..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              >
                <option value="All">All Categories ({TOP_150_CATEGORIES.length})</option>
                {TOP_150_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Difficulty Filter */}
            <div>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value as any)}
                className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              >
                <option value="All">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            {/* Company Filter */}
            <div>
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              >
                {allCompanies.map((comp) => (
                  <option key={comp} value={comp}>
                    {comp === 'All' ? 'All Companies' : comp}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Problems Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">Problem Name & Slug</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Difficulty</th>
                    <th className="py-3 px-4">Target Companies</th>
                    <th className="py-3 px-4">Frequency</th>
                    <th className="py-3 px-4">Points</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredProblems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No problems found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredProblems.map((prob) => (
                      <tr
                        key={prob.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-400">
                          {prob.number}
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{prob.title}</span>
                              {prob.youtubeUrl && (
                                <span title="Video solution attached">
                                  <Video className="w-3 h-3 text-rose-500 shrink-0" />
                                </span>
                              )}
                              {prob.hints && prob.hints.length > 0 && (
                                <span title="Hints available">
                                  <HelpCircle className="w-3 h-3 text-amber-500 shrink-0" />
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">
                              /{prob.slug}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {prob.category}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-md text-[10px] font-bold font-mono',
                              prob.difficulty === 'Easy' && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                              prob.difficulty === 'Medium' && 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
                              prob.difficulty === 'Hard' && 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            )}
                          >
                            {prob.difficulty}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 flex-wrap max-w-xs">
                            {prob.companies?.slice(0, 3).map((comp) => (
                              <span
                                key={comp}
                                className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                              >
                                {comp}
                              </span>
                            ))}
                            {(prob.companies?.length || 0) > 3 && (
                              <span className="text-[10px] text-slate-400">
                                +{(prob.companies?.length || 0) - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                          {prob.frequency || 80}%
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-amber-500">
                          +{prob.points || 200} 🪙
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Swap Button (Great for evolving trends over time) */}
                            <button
                              onClick={() => handleOpenSwap(prob)}
                              title="Swap with another question"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              <Shuffle className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit Button */}
                            <button
                              onClick={() => handleOpenEdit(prob)}
                              title="Edit problem details"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteProblem(prob)}
                              title="Delete from Top 150"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CATEGORY MASTERY ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-500" />
                <span>Student Category Completion & Mastery Distribution</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Pinpoint topics where students drop off (e.g. Dynamic Programming, Graphs) to assign targeted live mentor sessions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {TOP_150_CATEGORIES.map((cat) => {
                const stat = categoryStats[cat] || { count: 0, avgCompletion: 50 };
                return (
                  <div
                    key={cat}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 dark:text-white truncate">
                        {cat}
                      </span>
                      <span className="font-mono text-slate-400 text-[11px] shrink-0">
                        {stat.count} Questions
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-slate-400">Avg Student Progress</span>
                        <span
                          className={cn(
                            'font-bold',
                            stat.avgCompletion >= 70
                              ? 'text-emerald-500'
                              : stat.avgCompletion >= 45
                              ? 'text-amber-500'
                              : 'text-rose-500'
                          )}
                        >
                          {stat.avgCompletion}%
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-500',
                            stat.avgCompletion >= 70
                              ? 'bg-emerald-500'
                              : stat.avgCompletion >= 45
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          )}
                          style={{ width: `${stat.avgCompletion}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: STUDENT LEADERBOARD */}
      {activeTab === 'leaderboard' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4 p-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Top 150 Sheet Student Leaderboard</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Recognize the most dedicated students completing the full 150-question track.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">Rank</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">College</th>
                  <th className="py-3 px-4">Questions Solved</th>
                  <th className="py-3 px-4">Completion %</th>
                  <th className="py-3 px-4">Streak</th>
                  <th className="py-3 px-4">Badge</th>
                  <th className="py-3 px-4 text-right">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {MOCK_TOP_STUDENTS.map((st) => (
                  <tr key={st.rank} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30">
                    <td className="py-3.5 px-4 text-center font-bold font-mono">
                      {st.rank === 1 ? '🥇' : st.rank === 2 ? '🥈' : st.rank === 3 ? '🥉' : `#${st.rank}`}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={st.avatar}
                          alt={st.name}
                          className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-500/20 shrink-0"
                        />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {st.name}
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">
                            @{st.username}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                      {st.college}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {st.solvedCount} / {st.totalProblems}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <span className="px-2 py-0.5 rounded font-bold bg-emerald-500/10 text-emerald-500">
                        {((st.solvedCount / st.totalProblems) * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-orange-500 font-bold">
                      🔥 {st.streak} Days
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                        {st.badge}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-400 font-mono">
                      {st.lastActive}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT PROBLEM */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-indigo-500" />
                  <span>{editingProblem ? `Edit Problem #${editingProblem.number}` : 'Add New Problem to Top 150'}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Update problem attributes, target companies, reward coins, or hints.
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProblem} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-slate-400 font-medium mb-1">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                    placeholder="e.g. Course Schedule"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    {TOP_150_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Slug</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                    placeholder="e.g. course-schedule"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Companies (Comma Separated)</label>
                <input
                  type="text"
                  value={formData.companies}
                  onChange={(e) => setFormData({ ...formData, companies: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  placeholder="Google, Amazon, Meta, Microsoft, Apple"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Frequency (1-100)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Points / Coins</label>
                  <input
                    type="number"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Acceptance Rate</label>
                  <input
                    type="text"
                    value={formData.acceptanceRate}
                    onChange={(e) => setFormData({ ...formData, acceptanceRate: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                    placeholder="e.g. 54.2%"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">YouTube Video Solution URL (Optional)</label>
                <input
                  type="text"
                  value={formData.youtubeUrl}
                  onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Hints (1 per line)</label>
                <textarea
                  rows={2}
                  value={formData.hints}
                  onChange={(e) => setFormData({ ...formData, hints: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  placeholder="Model this as topological sort on a DAG..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold shadow-md shadow-purple-500/20"
                >
                  Save Problem
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SWAP PROBLEM (DYNAMIC EVOLUTION) */}
      {isSwapModalOpen && targetSwapProblem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Shuffle className="w-4 h-4 text-indigo-500" />
                  <span>Swap Problem #{targetSwapProblem.number}: {targetSwapProblem.title}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Replace with a trending interview question while preserving question number and category.
                </p>
              </div>
              <button
                onClick={() => setIsSwapModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="block text-slate-400 font-medium">
                Pick a Trending Replacement for "{targetSwapProblem.category}":
              </label>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {[
                  { title: 'Subarray Sum Equals K', diff: 'Medium', comps: ['Google', 'Meta', 'Amazon'] },
                  { title: 'Minimum Window Substring', diff: 'Hard', comps: ['Apple', 'Microsoft'] },
                  { title: 'Longest Palindromic Substring', diff: 'Medium', comps: ['Amazon', 'Google'] },
                  { title: 'Word Break II', diff: 'Hard', comps: ['Uber', 'ByteDance'] },
                  { title: 'Kth Smallest Element in a BST', diff: 'Medium', comps: ['Facebook', 'Bloomberg'] },
                ].map((sug, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{sug.title}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-amber-500/10 text-amber-500">
                          {sug.diff}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {sug.comps.join(', ')}
                      </span>
                    </div>

                    <button
                      onClick={() =>
                        handleExecuteSwap({
                          title: sug.title,
                          difficulty: sug.diff as any,
                          category: targetSwapProblem.category,
                          companies: sug.comps,
                        })
                      }
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-500 hover:bg-indigo-400 text-white cursor-pointer"
                    >
                      Swap In
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RESET CONFIRMATION */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Reset Top 150 to Standard?
              </h3>
              <p className="text-xs text-slate-500">
                This will reset any custom problems back to the canonical 150 FAANG interview questions. Solved status will remain intact.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReset}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 transition-colors shadow-md shadow-amber-500/20 cursor-pointer"
              >
                Yes, Restore Standard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
