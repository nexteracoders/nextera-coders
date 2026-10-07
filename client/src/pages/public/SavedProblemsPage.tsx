import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../components/ui/Toast';
import {
  bookmarkService,
  IProblemList,
} from '../../services/bookmark.service';
import {
  Bookmark,
  Star,
  Flame,
  Folder,
  Plus,
  Trash2,
  Edit2,
  Search,
  CheckCircle2,
  Clock,
  Circle,
  Shuffle,
  BookOpen,
  ArrowRight,
  Sparkles,
  Layers,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { ROUTES } from '../../constants/routes';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';

export const SavedProblemsPage: React.FC = () => {
  useDocumentTitle('Saved Problems & Custom Lists — NextEra Coders');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { success, error: toastError } = useToast();

  const [lists, setLists] = useState<IProblemList[]>(() => bookmarkService.getCachedListsSync());
  const [selectedListId, setSelectedListId] = useState<string>(() => {
    const listParam = searchParams.get('list');
    if (listParam) {
      const match = bookmarkService.getCachedListsSync().find(
        (l) => l.slug === listParam || String(l._id) === listParam
      );
      if (match) return String(match._id);
    }
    return String(bookmarkService.getCachedListsSync()[0]?._id || 'default-favorites');
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');

  // Create List Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  // Edit List Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingList, setEditingList] = useState<IProblemList | null>(null);
  const [editListName, setEditListName] = useState('');
  const [editListDescription, setEditListDescription] = useState('');

  // Delete Confirm Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingList, setDeletingList] = useState<IProblemList | null>(null);

  // Fetch lists on mount and subscribe to bookmark events
  useEffect(() => {
    const fetchLists = async () => {
      try {
        const fetched = await bookmarkService.getLists();
        setLists(fetched);
      } catch {
        // Fallback to cache
      }
    };

    fetchLists();
    const unsubscribe = bookmarkService.subscribe(() => {
      setLists(bookmarkService.getCachedListsSync());
    });

    return () => unsubscribe();
  }, []);

  // Update selected list if query param changes
  useEffect(() => {
    const listParam = searchParams.get('list');
    if (listParam && lists.length > 0) {
      const match = lists.find((l) => l.slug === listParam || String(l._id) === listParam);
      if (match && String(match._id) !== selectedListId) {
        setSelectedListId(String(match._id));
      }
    }
  }, [searchParams, lists, selectedListId]);

  // Active Selected List
  const activeList = useMemo(() => {
    return lists.find((l) => String(l._id) === selectedListId) || lists[0] || null;
  }, [lists, selectedListId]);

  // Overall Statistics across all lists
  const stats = useMemo(() => {
    const allUniqueSlugs = new Set<string>();
    let favoritesCount = 0;
    let reviseLaterCount = 0;
    let hardQuestionsCount = 0;
    let customListsCount = 0;

    lists.forEach((list) => {
      list.problems.forEach((p) => allUniqueSlugs.add(p.problemSlug));
      if (list.listType === 'favorites') favoritesCount = list.problems.length;
      if (list.listType === 'revise_later') reviseLaterCount = list.problems.length;
      if (list.listType === 'hard_questions') hardQuestionsCount = list.problems.length;
      if (list.listType === 'custom') customListsCount++;
    });

    return {
      totalUniqueSaved: allUniqueSlugs.size,
      favoritesCount,
      reviseLaterCount,
      hardQuestionsCount,
      customListsCount,
      totalListsCount: lists.length,
    };
  }, [lists]);

  // Solved check helper (inspects localStorage solved marks)
  const isProblemSolved = (slug: string) => {
    try {
      const clean = slug.toLowerCase().trim();
      const solvedKey = `prob_solved_${clean}`;
      const submissions = localStorage.getItem('nextera:solved_problems');
      if (submissions) {
        const parsed: string[] = JSON.parse(submissions);
        if (parsed.includes(clean)) return true;
      }
      return localStorage.getItem(solvedKey) === 'true';
    } catch {
      return false;
    }
  };

  // Filtered problems in active list
  const filteredProblems = useMemo(() => {
    if (!activeList) return [];
    return activeList.problems.filter((p) => {
      const matchesSearch =
        searchQuery === '' ||
        p.problemTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.problemSlug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesDiff =
        difficultyFilter === 'All' || p.difficulty === difficultyFilter;

      return matchesSearch && matchesDiff;
    });
  }, [activeList, searchQuery, difficultyFilter]);

  // Solved count in active list
  const activeListSolvedCount = useMemo(() => {
    if (!activeList) return 0;
    return activeList.problems.filter((p) => isProblemSolved(p.problemSlug)).length;
  }, [activeList]);

  const activeListSolvedPercent = useMemo(() => {
    if (!activeList || activeList.problems.length === 0) return 0;
    return Math.round((activeListSolvedCount / activeList.problems.length) * 100);
  }, [activeList, activeListSolvedCount]);

  const handleSelectList = (list: IProblemList) => {
    setSelectedListId(String(list._id));
    setSearchParams({ list: list.slug });
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    setIsSubmittingCreate(true);
    try {
      const created = await bookmarkService.createList(newListName.trim(), newListDescription.trim());
      setNewListName('');
      setNewListDescription('');
      setIsCreateModalOpen(false);

      const refreshed = await bookmarkService.getLists();
      setLists(refreshed);
      setSelectedListId(String(created._id));
      setSearchParams({ list: created.slug });

      success(`List "${created.name}" created successfully!`, 'List Created');
    } catch (err: any) {
      toastError(err.message || 'Could not create list', 'Error');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  const handleOpenEditModal = (list: IProblemList, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingList(list);
    setEditListName(list.name);
    setEditListDescription(list.description || '');
    setIsEditModalOpen(true);
  };

  const handleSaveEditList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingList || !editListName.trim()) return;

    try {
      await bookmarkService.updateList(String(editingList._id), {
        name: editListName.trim(),
        description: editListDescription.trim(),
      });
      setIsEditModalOpen(false);
      setEditingList(null);

      const refreshed = await bookmarkService.getLists();
      setLists(refreshed);
      success('List details updated', 'Updated');
    } catch {
      toastError('Could not update list', 'Error');
    }
  };

  const handleOpenDeleteModal = (list: IProblemList, e: React.MouseEvent) => {
    e.stopPropagation();
    if (list.isDefault) {
      toastError('Preset lists cannot be deleted.', 'Action Restricted');
      return;
    }
    setDeletingList(list);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingList) return;

    try {
      await bookmarkService.deleteList(String(deletingList._id));
      setIsDeleteModalOpen(false);
      setDeletingList(null);

      const refreshed = await bookmarkService.getLists();
      setLists(refreshed);
      if (selectedListId === String(deletingList._id) && refreshed.length > 0) {
        setSelectedListId(String(refreshed[0]._id));
        setSearchParams({ list: refreshed[0].slug });
      }
      success('List deleted successfully', 'Deleted');
    } catch {
      toastError('Could not delete list', 'Error');
    }
  };

  const handleRemoveProblem = async (problemSlug: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeList) return;

    try {
      await bookmarkService.removeProblemFromList(String(activeList._id), problemSlug);
      const refreshed = await bookmarkService.getLists();
      setLists(refreshed);
      success('Removed from list', 'Problem Removed');
    } catch {
      toastError('Could not remove problem', 'Error');
    }
  };

  const handlePracticeRandom = () => {
    if (!activeList || activeList.problems.length === 0) return;
    const randomIdx = Math.floor(Math.random() * activeList.problems.length);
    const chosen = activeList.problems[randomIdx];
    navigate(`/dsa/${encodeURIComponent(chosen.problemSlug)}`);
  };

  const getListIcon = (list: IProblemList) => {
    switch (list.listType) {
      case 'favorites':
        return <Star className="w-4 h-4 text-amber-500 fill-amber-500/20" />;
      case 'revise_later':
        return <Bookmark className="w-4 h-4 text-blue-500 fill-blue-500/20" />;
      case 'hard_questions':
        return <Flame className="w-4 h-4 text-rose-500 fill-rose-500/20" />;
      default:
        return <Folder className="w-4 h-4 text-purple-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#121212] text-slate-900 dark:text-neutral-100 py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 dark:border-neutral-800 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold uppercase tracking-wider bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                Personalized Learning Hub
              </span>
              <span className="text-xs text-slate-500 dark:text-neutral-500 font-mono">
                {stats.totalUniqueSaved} saved questions across {stats.totalListsCount} collections
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <span>Bookmark & Custom Problem Lists</span>
              <span className="text-amber-500">📑</span>
            </h1>
            <p className="text-sm text-slate-600 dark:text-neutral-400 mt-1">
              Curate, review, and master questions for tech interviews with built-in presets and custom playlists.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 shadow-sm shadow-brand-500/20 active:scale-95 cursor-pointer w-full md:w-auto"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create Custom List</span>
            </button>
            <Link
              to={ROUTES.PRACTICE}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#1e1e1e] hover:bg-slate-50 dark:hover:bg-[#282828] border border-slate-200 dark:border-neutral-700/80 text-slate-700 dark:text-neutral-200 text-xs font-bold font-mono transition-all flex items-center justify-center gap-1.5 shrink-0"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>DSA Problemset &rarr;</span>
            </Link>
          </div>
        </div>

        {/* Telemetry Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-slate-200/90 dark:border-neutral-800 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400 font-mono">
              <span>Total Bookmarked</span>
              <Bookmark className="w-4 h-4 text-brand-500" />
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white font-mono">
              {stats.totalUniqueSaved}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
              Unique DSA questions
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-slate-200/90 dark:border-neutral-800 shadow-xs">
            <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 font-mono">
              <span>Favorites</span>
              <Star className="w-4 h-4 text-amber-500 fill-amber-500/30" />
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white font-mono">
              {stats.favoritesCount}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
              Key algorithms & patterns
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-slate-200/90 dark:border-neutral-800 shadow-xs">
            <div className="flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 font-mono">
              <span>Revise Later</span>
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white font-mono">
              {stats.reviseLaterCount}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
              Interview prep priority
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-slate-200/90 dark:border-neutral-800 shadow-xs">
            <div className="flex items-center justify-between text-xs text-rose-600 dark:text-rose-400 font-mono">
              <span>Hard Questions</span>
              <Flame className="w-4 h-4 text-rose-500 fill-rose-500/30" />
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white font-mono">
              {stats.hardQuestionsCount}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
              Deep study challenges
            </p>
          </div>
        </div>

        {/* Main 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (4/12): List Navigator */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-4 rounded-3xl bg-white dark:bg-[#1a1a1a] border border-slate-200/90 dark:border-neutral-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 font-mono flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  Your Collections ({lists.length})
                </h2>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="text-xs font-bold text-brand-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New List</span>
                </button>
              </div>

              {/* Lists Scroll Area */}
              <div className="space-y-1.5">
                {lists.map((list) => {
                  const isSelected = String(list._id) === selectedListId;
                  const listSolved = list.problems.filter((p) => isProblemSolved(p.problemSlug)).length;

                  return (
                    <div
                      key={String(list._id)}
                      onClick={() => handleSelectList(list)}
                      className={cn(
                        'group p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3',
                        isSelected
                          ? 'bg-brand-50/80 dark:bg-brand-950/40 border-brand-300 dark:border-brand-500/50 shadow-xs'
                          : 'bg-white dark:bg-[#202020] border-slate-200/80 dark:border-neutral-800/80 hover:border-slate-300 dark:hover:border-neutral-700'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105',
                            list.listType === 'favorites' && 'bg-amber-500/10 dark:bg-amber-500/20',
                            list.listType === 'revise_later' && 'bg-blue-500/10 dark:bg-blue-500/20',
                            list.listType === 'hard_questions' && 'bg-rose-500/10 dark:bg-rose-500/20',
                            list.listType === 'custom' && 'bg-purple-500/10 dark:bg-purple-500/20'
                          )}
                        >
                          {getListIcon(list)}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'text-sm font-bold truncate',
                                isSelected
                                  ? 'text-brand-950 dark:text-white'
                                  : 'text-slate-800 dark:text-neutral-200'
                              )}
                            >
                              {list.name}
                            </span>
                            {list.isDefault && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-[#2a2a2a] text-slate-500 dark:text-neutral-400">
                                Preset
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-neutral-400 font-mono mt-0.5">
                            <span>{list.problems.length} problems</span>
                            <span>&bull;</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              {listSolved} solved
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Action Menu for Custom Lists */}
                      <div className="flex items-center gap-1 shrink-0">
                        {!list.isDefault ? (
                          <>
                            <button
                              type="button"
                              onClick={(e) => handleOpenEditModal(list, e)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2e2e2e] transition-colors"
                              title="Edit List"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleOpenDeleteModal(list, e)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              title="Delete List"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <ArrowRight className={cn("w-4 h-4 transition-transform", isSelected ? "text-brand-600 dark:text-cyan-400 translate-x-0.5" : "text-slate-300 dark:text-neutral-600")} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Practice Motivation Card */}
            <div className="p-4 rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 text-slate-900 dark:text-white space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 font-mono">
                <Sparkles className="w-4 h-4" />
                <span>Smart Revision Tip</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed">
                Add tricky problems into <strong>"Revise Later"</strong> as you practice. Solving them 48 hours later cements the memory pattern in your subconscious mind!
              </p>
            </div>
          </div>

          {/* Right Column (8/12): Selected List View */}
          <div className="lg:col-span-8 space-y-4">
            {activeList ? (
              <div className="p-5 rounded-3xl bg-white dark:bg-[#1a1a1a] border border-slate-200/90 dark:border-neutral-800 shadow-xs space-y-6">
                {/* Active List Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-neutral-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs',
                        activeList.listType === 'favorites' && 'bg-amber-500/15 dark:bg-amber-500/25 text-amber-600 dark:text-amber-400',
                        activeList.listType === 'revise_later' && 'bg-blue-500/15 dark:bg-blue-500/25 text-blue-600 dark:text-blue-400',
                        activeList.listType === 'hard_questions' && 'bg-rose-500/15 dark:bg-rose-500/25 text-rose-600 dark:text-rose-400',
                        activeList.listType === 'custom' && 'bg-purple-500/15 dark:bg-purple-500/25 text-purple-600 dark:text-purple-400'
                      )}
                    >
                      {getListIcon(activeList)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                          {activeList.name}
                        </h2>
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#262626] text-slate-600 dark:text-neutral-400 border border-slate-200 dark:border-neutral-700/60">
                          {activeList.problems.length} problems
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                        {activeList.description || 'Custom curated collection of problems'}
                      </p>
                    </div>
                  </div>

                  {activeList.problems.length > 0 && (
                    <button
                      type="button"
                      onClick={handlePracticeRandom}
                      className="px-3.5 py-2 rounded-xl bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/40 dark:hover:bg-brand-900/60 border border-brand-200 dark:border-brand-500/30 text-brand-700 dark:text-brand-300 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 shrink-0"
                    >
                      <Shuffle className="w-3.5 h-3.5 text-brand-500" />
                      <span>Practice Random</span>
                    </button>
                  )}
                </div>

                {/* Progress Bar in Active List */}
                {activeList.problems.length > 0 && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#202020] border border-slate-200/80 dark:border-neutral-800 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-600 dark:text-neutral-300">
                        Completion Progress: <strong>{activeListSolvedCount}</strong> of <strong>{activeList.problems.length}</strong> solved
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {activeListSolvedPercent}% Solved
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-neutral-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 rounded-full"
                        style={{ width: `${activeListSolvedPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Filters & Search Toolbar inside Active List */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Filter problems in this collection..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-50 dark:bg-[#161616] border border-slate-200 dark:border-neutral-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    {(['All', 'Easy', 'Medium', 'Hard'] as const).map((diff) => (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => setDifficultyFilter(diff)}
                        className={cn(
                          'px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer',
                          difficultyFilter === diff
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                            : 'bg-slate-100 dark:bg-[#252525] text-slate-600 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-[#2d2d2d]'
                        )}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Problems Table / List */}
                {filteredProblems.length > 0 ? (
                  <div className="rounded-2xl border border-slate-200 dark:border-neutral-800 overflow-hidden">
                    <div className="divide-y divide-slate-100 dark:divide-neutral-800/70">
                      {filteredProblems.map((prob) => {
                        const solved = isProblemSolved(prob.problemSlug);
                        const diffBadgeVariant =
                          prob.difficulty === 'Easy'
                            ? 'success'
                            : prob.difficulty === 'Medium'
                            ? 'warning'
                            : 'danger';

                        return (
                          <div
                            key={prob.problemSlug}
                            className="p-3.5 sm:p-4 bg-white dark:bg-[#1e1e1e] hover:bg-slate-50/80 dark:hover:bg-[#252525] transition-colors flex items-center justify-between gap-3 group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {/* Status Icon */}
                              <div className="shrink-0">
                                {solved ? (
                                  <span title="Solved">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                  </span>
                                ) : (
                                  <span title="Unsolved">
                                    <Circle className="w-4 h-4 text-slate-300 dark:text-neutral-600" />
                                  </span>
                                )}
                              </div>

                              <div className="min-w-0">
                                <Link
                                  to={`/dsa/${encodeURIComponent(prob.problemSlug)}`}
                                  className="text-sm font-bold text-slate-800 dark:text-neutral-100 hover:text-brand-600 dark:hover:text-cyan-400 transition-colors truncate block"
                                >
                                  {prob.problemTitle}
                                </Link>
                                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-neutral-400 font-mono mt-0.5">
                                  <span>{prob.category || 'Algorithms'}</span>
                                  {prob.addedAt && (
                                    <>
                                      <span>&bull;</span>
                                      <span>
                                        Added {new Date(prob.addedAt).toLocaleDateString()}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Right metadata & actions */}
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge variant={diffBadgeVariant} size="sm">
                                {prob.difficulty || 'Medium'}
                              </Badge>

                              <Link
                                to={`/dsa/${encodeURIComponent(prob.problemSlug)}`}
                                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#2a2a2a] dark:hover:bg-[#333333] text-slate-800 dark:text-neutral-200 text-xs font-mono font-bold transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <span>Solve</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link>

                              <button
                                type="button"
                                onClick={(e) => handleRemoveProblem(prob.problemSlug, e)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                title="Remove from list"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* Empty State */
                  <div className="p-12 text-center rounded-2xl bg-slate-50/60 dark:bg-[#1f1f1f]/50 border border-dashed border-slate-200 dark:border-neutral-800 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 mx-auto flex items-center justify-center">
                      <Bookmark className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {searchQuery ? 'No matching questions found' : 'No questions saved in this list yet'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mx-auto">
                      {searchQuery
                        ? 'Try modifying your search or difficulty filter.'
                        : 'Explore questions in the DSA practice catalog and click the Bookmark button to add them here.'}
                    </p>
                    <Link
                      to={ROUTES.PRACTICE}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs transition-all shadow-xs"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>Browse DSA Problemset</span>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-500" />
                <p className="text-xs mt-2">Loading list collections...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 1. Create New List Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Custom Problem List"
        maxWidth="md"
      >
        <form onSubmit={handleCreateList} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1.5">
              List Name *
            </label>
            <input
              type="text"
              placeholder="e.g., Google SDE Prep, DP Masterclass, Graph Practice"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              maxLength={50}
              required
              className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-[#161616] border border-slate-300 dark:border-neutral-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              placeholder="What is this collection for? (e.g. Problems to revise 1 week before technical interviews)"
              value={newListDescription}
              onChange={(e) => setNewListDescription(e.target.value)}
              maxLength={250}
              rows={3}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#161616] border border-slate-300 dark:border-neutral-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-[#2a2a2a] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newListName.trim() || isSubmittingCreate}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              {isSubmittingCreate ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>Create List</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* 2. Edit List Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Problem List"
        maxWidth="md"
      >
        <form onSubmit={handleSaveEditList} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1.5">
              List Name *
            </label>
            <input
              type="text"
              value={editListName}
              onChange={(e) => setEditListName(e.target.value)}
              maxLength={50}
              required
              className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-[#161616] border border-slate-300 dark:border-neutral-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1.5">
              Description
            </label>
            <textarea
              value={editListDescription}
              onChange={(e) => setEditListDescription(e.target.value)}
              maxLength={250}
              rows={3}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#161616] border border-slate-300 dark:border-neutral-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-[#2a2a2a] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!editListName.trim()}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* 3. Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Custom List?"
        maxWidth="sm"
      >
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed">
            Are you sure you want to delete the list <strong>"{deletingList?.name}"</strong>?
            This will only remove the list collection. The questions will remain available in the master problemset.
          </p>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-[#2a2a2a] transition-all"
            >
              Keep List
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Yes, Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
