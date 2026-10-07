import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../components/ui/Toast';
import { adminTutorialService, ITutorialSubject } from '../../services/adminTutorial.service';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  ExternalLink,
  ChevronRight,
  Flame,
  Sparkles,
  HelpCircle,
  BookOpen,
  FolderKanban,
  FileCode2,
  Layers,
  Database,
  Cpu,
  Coffee,
  Cloud,
  Network,
  X,
} from 'lucide-react';
import { DeleteConfirmModal } from '../../components/admin/DeleteConfirmModal';
import { LiveTechCohortsModal } from '../../components/admin/LiveTechCohortsModal';
import { ManageHomeTutorialsModal } from '../../components/admin/ManageHomeTutorialsModal';
import { ManageChapterQuizzesModal } from '../../components/admin/ManageChapterQuizzesModal';
import { cn } from '../../utils/cn';

const CATEGORY_OPTIONS = [
  { id: 'all', label: 'All Categories' },
  { id: 'Web Development', label: '🌐 Web Development' },
  { id: 'Backend & Runtime', label: '⚙️ Backend & Runtime' },
  { id: 'Core Computer Science', label: '🏛️ Core CS & GATE' },
  { id: 'Programming Languages', label: '💻 Programming Languages' },
  { id: 'Core Languages', label: '⚡ Core Languages' },
  { id: 'Databases & Storage', label: '🗄️ Databases & Storage' },
  { id: 'DevOps & Cloud', label: '☁️ DevOps & Cloud' },
  { id: 'Cloud & Architecture', label: '🌐 Cloud & Architecture' },
  { id: 'Security & Testing', label: '🛡️ Security & Testing' },
  { id: 'AI & Data Science', label: '✨ AI & Data Science' },
];

export const AdminTutorialsListPage: React.FC = () => {
  useDocumentTitle('Subjects & Tutorials Management — NextEra Coders Admin');
  const { success, error: toastError } = useToast();

  const [subjects, setSubjects] = useState<ITutorialSubject[]>([]);
  const [allSubjects, setAllSubjects] = useState<ITutorialSubject[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [deleteTarget, setDeleteTarget] = useState<ITutorialSubject | null>(null);
  const [cohortsModalOpen, setCohortsModalOpen] = useState(false);
  const [homeSubjectsModalOpen, setHomeSubjectsModalOpen] = useState(false);
  const [chapterQuizModalOpen, setChapterQuizModalOpen] = useState(false);
  const [selectedQuizTarget, setSelectedQuizTarget] = useState<{ trackId?: string; chapterId?: string } | null>(null);

  // Subject Modal (Create / Edit)
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<ITutorialSubject | null>(null);
  const [savingSubject, setSavingSubject] = useState(false);
  const [subjectForm, setSubjectForm] = useState({
    title: '',
    slug: '',
    shortTitle: '',
    category: 'Core Computer Science',
    iconName: 'BookOpen',
    description: '',
    isPublished: true,
  });

  const fetchAllSubjects = useCallback(async () => {
    try {
      const data = await adminTutorialService.getSubjects();
      setAllSubjects(data);
    } catch {
      // ignore
    }
  }, []);

  const fetchSubjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminTutorialService.getSubjects({
        search: search || undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setSubjects(data);
      if (!search && categoryFilter === 'all' && statusFilter === 'all') {
        setAllSubjects(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load tutorial subjects');
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, statusFilter]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  useEffect(() => {
    fetchAllSubjects();
  }, [fetchAllSubjects]);

  const handleOpenAddSubject = () => {
    setEditingSubject(null);
    setSubjectForm({
      title: '',
      slug: '',
      shortTitle: '',
      category: 'Core Computer Science',
      iconName: 'BookOpen',
      description: '',
      isPublished: true,
    });
    setSubjectModalOpen(true);
  };

  const handleOpenEditSubject = (subj: ITutorialSubject) => {
    setEditingSubject(subj);
    setSubjectForm({
      title: subj.title,
      slug: subj.slug,
      shortTitle: subj.shortTitle || subj.title,
      category: subj.category || 'Core Computer Science',
      iconName: subj.iconName || 'BookOpen',
      description: subj.description || '',
      isPublished: subj.isPublished,
    });
    setSubjectModalOpen(true);
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectForm.title.trim()) {
      toastError('Subject title is required');
      return;
    }

    try {
      setSavingSubject(true);
      if (editingSubject) {
        await adminTutorialService.updateSubject(editingSubject.slug, subjectForm);
        success(`Subject "${subjectForm.title}" updated successfully`, 'Updated');
      } else {
        await adminTutorialService.createSubject(subjectForm);
        success(`Subject "${subjectForm.title}" created successfully`, 'Created');
      }
      setSubjectModalOpen(false);
      fetchSubjects();
      fetchAllSubjects();
    } catch (err: any) {
      toastError(err.message || 'Failed to save subject');
    } finally {
      setSavingSubject(false);
    }
  };

  const handleTogglePublish = async (subj: ITutorialSubject) => {
    try {
      await adminTutorialService.togglePublishSubject(subj.slug);
      success(
        `Subject "${subj.title}" is now ${subj.isPublished ? 'Draft' : 'Published'}`,
        'Status Updated'
      );
      fetchSubjects();
      fetchAllSubjects();
    } catch (err: any) {
      toastError(err.message || 'Failed to update publish status');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminTutorialService.deleteSubject(deleteTarget.slug);
      success(`Subject "${deleteTarget.title}" and its chapters deleted successfully`, 'Deleted');
      setDeleteTarget(null);
      fetchSubjects();
      fetchAllSubjects();
    } catch (err: any) {
      toastError(err.message || 'Failed to delete subject');
    }
  };

  const renderSubjectIcon = (slug: string) => {
    const s = slug.toLowerCase();
    if (s.includes('dbms') || s.includes('sql') || s.includes('database')) {
      return <Database className="w-4 h-4 text-emerald-500" />;
    }
    if (s.includes('os') || s.includes('operating')) {
      return <Cpu className="w-4 h-4 text-violet-500" />;
    }
    if (s.includes('cn') || s.includes('network')) {
      return <Network className="w-4 h-4 text-sky-500" />;
    }
    if (s.includes('react')) {
      return <Layers className="w-4 h-4 text-cyan-500" />;
    }
    if (s.includes('python')) {
      return <FileCode2 className="w-4 h-4 text-blue-500" />;
    }
    if (s.includes('java')) {
      return <Coffee className="w-4 h-4 text-red-500" />;
    }
    if (s.includes('devops') || s.includes('cloud')) {
      return <Cloud className="w-4 h-4 text-sky-500" />;
    }
    return <BookOpen className="w-4 h-4 text-indigo-500" />;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Tutorials & Developer Docs Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage engineering subjects, syllabus chapters, attached architecture diagrams, and interactive code runners.
          </p>
        </div>
      </div>

      {/* Low-Height Compact Unified Container: 4 Action Buttons + All Dynamic Subjects */}
      <div className="p-2 sm:p-2.5 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-dark-800 shadow-2xs flex items-center gap-2.5 overflow-hidden">
        {/* Left: 4 Action Buttons with concise labels and single clean icons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              setSelectedQuizTarget(null);
              setChapterQuizModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-400 border border-teal-500/30 text-xs font-bold transition-all cursor-pointer shadow-2xs group whitespace-nowrap"
            title="Manage Chapter Quizzes"
          >
            <HelpCircle className="w-3.5 h-3.5 text-teal-500 group-hover:scale-110 transition-transform" />
            <span>Quizzes</span>
          </button>

          <button
            type="button"
            onClick={() => setHomeSubjectsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30 text-xs font-bold transition-all cursor-pointer shadow-2xs group whitespace-nowrap"
            title="Home Page Featured Subjects"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 group-hover:scale-110 transition-transform" />
            <span>Home Subjects</span>
          </button>

          <button
            type="button"
            onClick={() => setCohortsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer shadow-2xs group whitespace-nowrap"
            title="Live Tech Cohorts"
          >
            <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500 group-hover:scale-110 transition-transform" />
            <span>Live Cohorts</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddSubject}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer shadow-xs shadow-emerald-600/20 whitespace-nowrap"
            title="Create New Subject"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Subject</span>
          </button>
        </div>

        {/* Subtle Vertical Divider */}
        <div className="h-6 w-px bg-slate-200 dark:bg-dark-800 shrink-0 mx-0.5" />

        {/* Right: Dynamic Horizontally Scrollable Subjects List (No Hardcoding) */}
        <div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-0.5">
          <button
            type="button"
            onClick={() => setSearch('')}
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border',
              !search
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-2xs'
                : 'bg-slate-100/80 dark:bg-dark-800/60 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-dark-750 hover:bg-slate-200/70 dark:hover:bg-dark-700'
            )}
            title="Show all subjects"
          >
            <span>All</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-200/80 dark:bg-dark-700 text-slate-700 dark:text-slate-300">
              {(allSubjects.length > 0 ? allSubjects : subjects).length}
            </span>
          </button>

          {(allSubjects.length > 0 ? allSubjects : subjects).map((subj) => {
            const isActive = search.trim().toLowerCase() === subj.title.toLowerCase();
            return (
              <button
                key={subj.id || subj._id || subj.slug}
                type="button"
                onClick={() => {
                  if (isActive) {
                    setSearch('');
                  } else {
                    setSearch(subj.title);
                  }
                }}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border whitespace-nowrap group',
                  isActive
                    ? 'bg-brand-600 text-white border-brand-500 shadow-xs'
                    : 'bg-slate-50/80 dark:bg-dark-800/40 text-slate-700 dark:text-slate-300 border-slate-200/70 dark:border-dark-750 hover:bg-slate-100 dark:hover:bg-dark-700 hover:border-slate-300 dark:hover:border-dark-600'
                )}
                title={`${subj.title} • ${subj.totalChapters ?? 0} Chapters`}
              >
                <span className="shrink-0">{renderSubjectIcon(subj.slug)}</span>
                <span>{subj.shortTitle || subj.title}</span>
                {subj.totalChapters !== undefined && (
                  <span
                    className={cn(
                      'text-[10px] font-mono px-1.5 py-0.2 rounded-full',
                      isActive
                        ? 'bg-brand-700 text-white'
                        : 'bg-slate-200/70 dark:bg-dark-700 text-slate-600 dark:text-slate-400'
                    )}
                  >
                    {subj.totalChapters}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-dark-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="w-full md:w-80">
          <Input
            placeholder="Search subjects, tracks, or categories..."
            leftIcon={<Search className="w-4 h-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-300 dark:border-dark-800 bg-white dark:bg-dark-900 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-300 dark:border-dark-800 bg-white dark:bg-dark-900 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="published">Published Only</option>
            <option value="draft">Drafts Only</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      )}

      {!loading && error && (
        <ErrorState title="Error Loading Subjects" message={error} onRetry={fetchSubjects} />
      )}

      {!loading && !error && subjects.length === 0 && (
        <EmptyState
          title="No Subjects Found"
          description="Create your first tutorial subject (e.g. Operating Systems, Computer Networks, DBMS, React) to organize chapters."
          actionLabel="Add Subject"
          onAction={handleOpenAddSubject}
        />
      )}

      {/* Subjects Table */}
      {!loading && !error && subjects.length > 0 && (
        <div className="rounded-2xl border border-slate-200/80 dark:border-dark-800 bg-white dark:bg-dark-900 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="border-b border-slate-200 dark:border-dark-800 bg-slate-50/70 dark:bg-dark-850/40 text-slate-400 font-mono">
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Total Chapters</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-800">
                {subjects.map((subj) => (
                  <tr
                    key={subj.id || subj._id}
                    className="hover:bg-slate-50/60 dark:hover:bg-dark-850/40 transition-colors group"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-slate-100 dark:bg-dark-800 shrink-0">
                          {renderSubjectIcon(subj.slug)}
                        </div>
                        <div>
                          <Link
                            to={`/admin/tutorials/subject/${subj.slug}`}
                            className="font-bold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors line-clamp-1 text-sm flex items-center gap-1.5"
                          >
                            <span>{subj.title}</span>
                            <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600" />
                          </Link>
                          <span className="text-[11px] text-slate-400 font-mono">
                            /tutorials?track={subj.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      <span className="font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-dark-800 text-[11px]">
                        {subj.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        <FolderKanban className="w-3.5 h-3.5" />
                        <span>{subj.totalChapters || 0} Chapters</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(subj)}
                        className="cursor-pointer"
                        title="Click to toggle publish/draft"
                      >
                        <Badge variant={subj.isPublished ? 'success' : 'default'} size="sm">
                          {subj.isPublished ? 'Published' : 'Draft'}
                        </Badge>
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Manage Chapters Link */}
                        <Link
                          to={`/admin/tutorials/subject/${subj.slug}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-xs font-semibold transition-colors"
                          title="View and Edit Chapters for this Subject"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Manage Chapters</span>
                        </Link>

                        {/* Public Preview */}
                        <Link
                          to={`/tutorials?track=${subj.slug}`}
                          target="_blank"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors"
                          title="Preview in Student View"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>

                        {/* Edit Subject Meta */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditSubject(subj)}
                          className="p-1.5 rounded-lg text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                          title="Edit Subject Name & Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Subject */}
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(subj)}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Delete Subject & All Associated Chapters"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ADD / EDIT SUBJECT MODAL                                 */}
      {/* ======================================================== */}
      {subjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>{editingSubject ? `Edit Subject: ${editingSubject.title}` : '+ Add New Subject'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setSubjectModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Subject Title *
                </label>
                <Input
                  placeholder="e.g. Operating Systems (OS) or Database Management Systems"
                  value={subjectForm.title}
                  onChange={(e) => {
                    const val = e.target.value;
                    const autoSlug = val
                      .toLowerCase()
                      .replace(/[^\w\s-]/g, '')
                      .replace(/[\s_-]+/g, '-')
                      .replace(/^-+|-+$/g, '');
                    setSubjectForm((prev) => ({
                      ...prev,
                      title: val,
                      ...(!editingSubject && { slug: autoSlug, shortTitle: val }),
                    }));
                  }}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    URL Slug *
                  </label>
                  <Input
                    placeholder="e.g. os or dbms"
                    value={subjectForm.slug}
                    onChange={(e) => setSubjectForm({ ...subjectForm, slug: e.target.value })}
                    disabled={!!editingSubject}
                    required
                  />
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                    /tutorials?track={subjectForm.slug || 'slug'}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Short Title
                  </label>
                  <Input
                    placeholder="e.g. OS or DBMS"
                    value={subjectForm.shortTitle}
                    onChange={(e) => setSubjectForm({ ...subjectForm, shortTitle: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Category
                </label>
                <select
                  value={subjectForm.category}
                  onChange={(e) => setSubjectForm({ ...subjectForm, category: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-dark-800 bg-white dark:bg-dark-900 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="Core Computer Science">Core Computer Science & GATE</option>
                  <option value="Core Languages">Core Languages & Systems</option>
                  <option value="Cloud & Infrastructure">Cloud, DevOps & System Design</option>
                  <option value="Web & Full-Stack">Web & Full-Stack Development</option>
                  <option value="AI & Machine Learning">AI, Data Science & GenAI</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-dark-800 bg-white dark:bg-dark-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                  placeholder="Master process management, memory paging, CPU scheduling, and file systems..."
                  value={subjectForm.description}
                  onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-dark-850">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Publish Subject</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={subjectForm.isPublished}
                    onChange={(e) => setSubjectForm({ ...subjectForm, isPublished: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-dark-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSubjectModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={savingSubject}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  {editingSubject ? 'Save Changes' : 'Create Subject'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Subject"
        itemName={deleteTarget?.title}
        description="Are you sure you want to permanently delete this subject and all its associated chapters? This cannot be undone."
      />

      {/* Live Tech Cohorts Management Modal */}
      <LiveTechCohortsModal
        isOpen={cohortsModalOpen}
        onClose={() => setCohortsModalOpen(false)}
      />

      {/* Home Page Tutorial Subjects Management Modal */}
      <ManageHomeTutorialsModal
        isOpen={homeSubjectsModalOpen}
        onClose={() => setHomeSubjectsModalOpen(false)}
      />

      {/* Tutorial Chapter Quizzes Management Modal */}
      <ManageChapterQuizzesModal
        isOpen={chapterQuizModalOpen}
        onClose={() => {
          setChapterQuizModalOpen(false);
          setSelectedQuizTarget(null);
        }}
        initialTrackId={selectedQuizTarget?.trackId}
        initialChapterId={selectedQuizTarget?.chapterId}
        onSaved={fetchSubjects}
      />
    </div>
  );
};
