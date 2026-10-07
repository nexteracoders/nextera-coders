import React, { useState, useEffect } from 'react';
import {
  ILiveTechCohort,
  liveTechCohortsService,
} from '../../services/liveTechCohorts.service';
import {
  X,
  Plus,
  Flame,
  Star,
  Clock,
  Trash2,
  Edit2,
  RotateCcw,
  Eye,
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface LiveTechCohortsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LiveTechCohortsModal: React.FC<LiveTechCohortsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [cohorts, setCohorts] = useState<ILiveTechCohort[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [badge, setBadge] = useState<'LIVE' | 'PRO' | 'UPCOMING' | 'FAST TRACK'>('LIVE');
  const [rating, setRating] = useState<number>(4.9);
  const [schedule, setSchedule] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [instructor, setInstructor] = useState('');

  const [formMode, setFormMode] = useState<'list' | 'edit' | 'create'>('list');

  useEffect(() => {
    if (!isOpen) return;
    const unsub = liveTechCohortsService.subscribe((list) => {
      setCohorts(list);
    });
    return () => unsub();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOpenCreate = () => {
    setTitle('');
    setSlug('');
    setBadge('LIVE');
    setRating(4.9);
    setSchedule('Starting from — Sept 20, 2026');
    setLinkUrl('/courses');
    setInstructor('NextEra Lead Instructor');
    setEditingId(null);
    setFormMode('create');
  };

  const handleOpenEdit = (c: ILiveTechCohort) => {
    setTitle(c.title);
    setSlug(c.slug);
    setBadge(c.badge);
    setRating(c.rating);
    setSchedule(c.schedule);
    setLinkUrl(c.linkUrl || `/courses/${c.slug}`);
    setInstructor(c.instructor || '');
    setEditingId(c.id);
    setFormMode('edit');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !schedule.trim()) return;

    liveTechCohortsService.saveCohort({
      id: editingId || undefined,
      title,
      slug: slug || undefined,
      badge,
      rating: Number(rating) || 4.9,
      schedule,
      linkUrl: linkUrl || undefined,
      instructor: instructor || undefined,
    });

    setFormMode('list');
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to remove this Live Tech Cohort?')) {
      liveTechCohortsService.deleteCohort(id);
    }
  };

  const handleToggle = (id: string) => {
    liveTechCohortsService.toggleActive(id);
  };

  const handleReset = () => {
    if (window.confirm('Reset all Live Tech Cohorts to platform defaults?')) {
      liveTechCohortsService.resetToDefaults();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white dark:bg-dark-900 rounded-3xl border border-slate-200 dark:border-dark-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-200 dark:border-dark-800 flex items-center justify-between bg-slate-50/80 dark:bg-dark-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Flame className="w-5 h-5 fill-amber-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Live Tech Cohorts Manager
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                  {cohorts.filter((c) => c.isActive).length} Active
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage upcoming live batches displayed on student tutorial sidebars in real-time.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {formMode === 'list' ? (
            <div className="space-y-4">
              {/* Action Bar */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono uppercase tracking-wider">
                  Configured Cohorts ({cohorts.length})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-dark-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Defaults</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenCreate}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Cohort</span>
                  </button>
                </div>
              </div>

              {/* Cohorts List */}
              <div className="space-y-2.5">
                {cohorts.map((cohort) => (
                  <div
                    key={cohort.id}
                    className={cn(
                      'flex items-center justify-between p-3.5 rounded-2xl border transition-all',
                      cohort.isActive
                        ? 'bg-slate-50/80 dark:bg-dark-950/80 border-slate-200/90 dark:border-dark-800'
                        : 'bg-slate-100/50 dark:bg-dark-950/30 border-dashed border-slate-300 dark:border-dark-800 opacity-60'
                    )}
                  >
                    <div className="space-y-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-md text-[9px] font-mono font-bold',
                            cohort.badge === 'LIVE'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : cohort.badge === 'PRO'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                          )}
                        >
                          {cohort.badge}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                          <Star className="w-3 h-3 fill-current" />
                          <span>{cohort.rating}</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {cohort.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {cohort.schedule}
                        </span>
                        {cohort.instructor && <span>• {cohort.instructor}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Active Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggle(cohort.id)}
                        className={cn(
                          'px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-colors cursor-pointer',
                          cohort.isActive
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : 'bg-slate-200 dark:bg-dark-800 text-slate-500'
                        )}
                      >
                        {cohort.isActive ? 'Active' : 'Disabled'}
                      </button>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(cohort)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/50 transition-colors cursor-pointer"
                        title="Edit Cohort"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDelete(cohort.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                        title="Delete Cohort"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Create / Edit Form */
            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-dark-800">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                  {formMode === 'create' ? '✨ Add New Live Tech Cohort' : '✏️ Edit Cohort Details'}
                </span>
                <button
                  type="button"
                  onClick={() => setFormMode('list')}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline cursor-pointer"
                >
                  Back to List
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Cohort Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Data Analytics Course with Python & SQL"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-dark-800 bg-white dark:bg-dark-950 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Badge Type
                  </label>
                  <select
                    value={badge}
                    onChange={(e) => setBadge(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-dark-800 bg-white dark:bg-dark-950 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="LIVE">🟢 LIVE</option>
                    <option value="PRO">⭐ PRO</option>
                    <option value="UPCOMING">🚀 UPCOMING</option>
                    <option value="FAST TRACK">⚡ FAST TRACK</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Rating (e.g. 4.9)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="3.0"
                    max="5.0"
                    value={rating}
                    onChange={(e) => setRating(parseFloat(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-dark-800 bg-white dark:bg-dark-950 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Schedule / Timeline *
                  </label>
                  <input
                    type="text"
                    required
                    value={schedule}
                    onChange={(e) => setSchedule(e.target.value)}
                    placeholder="e.g. Starting from — Sept 5, 2026 or Every Sat & Sun • 8 PM"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-dark-800 bg-white dark:bg-dark-950 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Target Course Link URL
                  </label>
                  <input
                    type="text"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="e.g. /courses/python-for-data-science"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-dark-800 bg-white dark:bg-dark-950 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Instructor Name
                  </label>
                  <input
                    type="text"
                    value={instructor}
                    onChange={(e) => setInstructor(e.target.value)}
                    placeholder="e.g. Sandip Verma"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-dark-800 bg-white dark:bg-dark-950 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 space-y-2">
                <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-slate-500 uppercase">
                  <Eye className="w-3.5 h-3.5 text-brand-500" />
                  Live Preview in Student Sidebar
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                      {badge}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] text-amber-500 font-bold">
                      <Star className="w-3 h-3 fill-current" />
                      <span>{rating}</span>
                    </div>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2">
                    {title || 'Cohort Title Preview'}
                  </h4>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    <Clock className="w-3 h-3" />
                    <span>{schedule || 'Starting from — Date'}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFormMode('list')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                >
                  Save Cohort
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
