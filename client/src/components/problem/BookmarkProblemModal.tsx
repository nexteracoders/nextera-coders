import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import {
  bookmarkService,
  IProblemList,
} from '../../services/bookmark.service';
import {
  Star,
  Bookmark,
  Flame,
  Folder,
  Plus,
  Check,
  ExternalLink,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useToast } from '../ui/Toast';
import { ROUTES } from '../../constants/routes';

interface BookmarkProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  problem: {
    slug: string;
    title: string;
    difficulty?: 'Easy' | 'Medium' | 'Hard';
    category?: string;
  } | null;
}

export const BookmarkProblemModal: React.FC<BookmarkProblemModalProps> = ({
  isOpen,
  onClose,
  problem,
}) => {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [lists, setLists] = useState<IProblemList[]>(() => bookmarkService.getCachedListsSync());
  const [selectedListIds, setSelectedListIds] = useState<Set<string>>(new Set());
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sync lists and current problem membership whenever modal opens or problem changes
  useEffect(() => {
    if (!isOpen || !problem) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const fetchedLists = await bookmarkService.getLists();
        setLists(fetchedLists);

        const cleanSlug = problem.slug.trim().toLowerCase();
        const activeIds = new Set(
          fetchedLists
            .filter((l) => l.problems.some((p) => p.problemSlug === cleanSlug))
            .map((l) => String(l._id))
        );
        setSelectedListIds(activeIds);
      } catch {
        // Cached lists will be used
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen, problem]);

  if (!problem) return null;

  const cleanSlug = problem.slug.trim().toLowerCase();

  const handleToggleList = async (list: IProblemList) => {
    const listIdStr = String(list._id);
    const nextSelected = new Set(selectedListIds);
    const willAdd = !nextSelected.has(listIdStr);

    if (willAdd) {
      nextSelected.add(listIdStr);
    } else {
      nextSelected.delete(listIdStr);
    }
    setSelectedListIds(nextSelected);

    try {
      await bookmarkService.toggleProblem(
        cleanSlug,
        problem.title,
        problem.difficulty || 'Medium',
        problem.category || 'Algorithms',
        Array.from(nextSelected)
      );

      if (willAdd) {
        success(`Added to "${list.name}"`, 'Problem Saved');
      } else {
        success(`Removed from "${list.name}"`, 'Problem Removed');
      }
    } catch {
      toastError('Failed to update bookmark list', 'Error');
    }
  };

  const handleCreateNewList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    setIsSubmitting(true);
    try {
      const created = await bookmarkService.createList(newListName.trim());
      setNewListName('');
      setIsCreatingNew(false);

      // Auto-add this problem to newly created list
      const nextSelected = new Set(selectedListIds);
      nextSelected.add(String(created._id));
      setSelectedListIds(nextSelected);

      await bookmarkService.toggleProblem(
        cleanSlug,
        problem.title,
        problem.difficulty || 'Medium',
        problem.category || 'Algorithms',
        Array.from(nextSelected)
      );

      // Refresh list
      const refreshed = await bookmarkService.getLists();
      setLists(refreshed);

      success(`Created list "${created.name}" and added problem!`, 'List Created');
    } catch (err: any) {
      toastError(err.message || 'Could not create list', 'Error');
    } finally {
      setIsSubmitting(false);
    }
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

  const diffBadgeVariant =
    problem.difficulty === 'Easy'
      ? 'success'
      : problem.difficulty === 'Medium'
      ? 'warning'
      : 'danger';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      maxWidth="md"
      className="p-0 overflow-hidden bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-neutral-800 rounded-3xl shadow-2xl text-slate-900 dark:text-neutral-100"
    >
      <div className="flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-neutral-800/80 bg-slate-50/70 dark:bg-[#202020]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Bookmark className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  Save to Problem Lists
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  Select collections to organize this question
                </p>
              </div>
            </div>
            <Badge variant={diffBadgeVariant} size="sm">
              {problem.difficulty || 'Medium'}
            </Badge>
          </div>

          <div className="mt-3 px-3 py-2 rounded-xl bg-white dark:bg-[#161616] border border-slate-200/80 dark:border-neutral-800 text-xs font-semibold text-slate-700 dark:text-neutral-200 truncate">
            {problem.title}
          </div>
        </div>

        {/* Lists Container */}
        <div className="p-5 space-y-2 max-h-[340px] overflow-y-auto">
          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
              <span className="text-xs">Loading collections...</span>
            </div>
          ) : (
            lists.map((list) => {
              const listIdStr = String(list._id);
              const isChecked = selectedListIds.has(listIdStr);

              return (
                <button
                  key={listIdStr}
                  type="button"
                  onClick={() => handleToggleList(list)}
                  className={cn(
                    'w-full p-3 rounded-2xl border transition-all text-left flex items-center justify-between gap-3 cursor-pointer group',
                    isChecked
                      ? 'bg-brand-50/70 dark:bg-brand-950/30 border-brand-300 dark:border-brand-500/40 text-slate-900 dark:text-white'
                      : 'bg-white dark:bg-[#222222] border-slate-200/90 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110',
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
                        <span className="text-sm font-bold truncate text-slate-900 dark:text-neutral-100">
                          {list.name}
                        </span>
                        {list.isDefault && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-[#2b2b2b] text-slate-500 dark:text-neutral-400">
                            Preset
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-neutral-400 truncate">
                        {list.description || `${list.problems.length} questions saved`}
                      </p>
                    </div>
                  </div>

                  {/* Custom Checkbox */}
                  <div
                    className={cn(
                      'w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all',
                      isChecked
                        ? 'bg-brand-600 border-brand-600 text-white shadow-xs'
                        : 'border-slate-300 dark:border-neutral-600 bg-white dark:bg-[#1c1c1c]'
                    )}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })
          )}

          {/* Create New List Form */}
          {isCreatingNew ? (
            <form
              onSubmit={handleCreateNewList}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#202020] border border-brand-300/80 dark:border-brand-500/40 space-y-2.5 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-neutral-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                  Create Custom Problem List
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingNew(false);
                    setNewListName('');
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-neutral-300"
                >
                  Cancel
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g., Google 2026, DP Patterns, Neetcode 150..."
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  maxLength={50}
                  autoFocus
                  className="flex-1 h-9 px-3 rounded-xl bg-white dark:bg-[#161616] border border-slate-300 dark:border-neutral-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
                />
                <button
                  type="submit"
                  disabled={!newListName.trim() || isSubmitting}
                  className="h-9 px-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-xs transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Create & Save</span>
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsCreatingNew(true)}
              className="w-full py-2.5 px-3 rounded-2xl border border-dashed border-slate-300 dark:border-neutral-700/80 hover:border-brand-500 text-slate-600 dark:text-neutral-300 hover:text-brand-600 dark:hover:text-brand-400 font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer bg-slate-50/50 dark:bg-[#202020]/50"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create New Custom List</span>
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-neutral-800 bg-slate-50/80 dark:bg-[#202020] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate(ROUTES.BOOKMARKS);
            }}
            className="text-xs font-semibold text-brand-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Open Saved Lists Hub</span>
            <ExternalLink className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-bold hover:bg-slate-800 dark:hover:bg-white transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
};
