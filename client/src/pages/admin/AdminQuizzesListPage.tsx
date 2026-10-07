import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../components/ui/Toast';
import { adminQuizService } from '../../services/adminQuiz.service';
import { IAdminQuiz } from '../../types/quiz.types';
import { CoursePagination } from '../../types/course.types';
import { ROUTES } from '../../constants/routes';
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
  CheckCircle2,
  EyeOff,
  HelpCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Layers,
  Sparkles,
  Clock,
} from 'lucide-react';
import { getAllChapterAssessments, IChapterAssessmentSummary } from '../../data/tutorialQuizBank';
import { ManageChapterQuizzesModal } from '../../components/admin/ManageChapterQuizzesModal';

export const AdminQuizzesListPage: React.FC = () => {
  useDocumentTitle('Admin Quiz Management — NextEra Coders');

  const { success, error: toastError } = useToast();
  const [activeTab, setActiveTab] = useState<'platform' | 'chapter_quizzes'>('platform');
  const [quizzes, setQuizzes] = useState<IAdminQuiz[]>([]);
  const [pagination, setPagination] = useState<CoursePagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 20,
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chapter Quizzes Modal state
  const [chapterQuizModalOpen, setChapterQuizModalOpen] = useState(false);
  const [selectedQuizTarget, setSelectedQuizTarget] = useState<{ trackId?: string; chapterId?: string } | null>(null);

  // Load all chapter assessments
  const [chapterAssessments, setChapterAssessments] = useState<IChapterAssessmentSummary[]>(() =>
    getAllChapterAssessments()
  );

  const refreshChapterAssessments = useCallback(() => {
    setChapterAssessments(getAllChapterAssessments());
  }, []);

  const fetchQuizzes = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminQuizService.getQuizzes({
        page,
        limit: 20,
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setQuizzes(data.quizzes);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchQuizzes(1);
  }, [fetchQuizzes]);

  // Filtered Chapter Assessments based on search
  const filteredChapterAssessments = useMemo(() => {
    if (!search.trim()) return chapterAssessments;
    const q = search.toLowerCase();
    return chapterAssessments.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.trackTitle.toLowerCase().includes(q) ||
        c.chapterTitle.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    );
  }, [chapterAssessments, search]);

  const handleTogglePublish = async (quiz: IAdminQuiz) => {
    try {
      if (quiz.isPublished) {
        await adminQuizService.unpublishQuiz(quiz.id);
        success(`Moved "${quiz.title}" to Drafts`, 'Status Updated');
      } else {
        await adminQuizService.publishQuiz(quiz.id);
        success(`Published "${quiz.title}"`, 'Status Updated');
      }
      fetchQuizzes(pagination.currentPage);
    } catch (err: any) {
      toastError(err.message || 'Failed to update publish status');
    }
  };

  const handleDelete = async (quiz: IAdminQuiz) => {
    if (!window.confirm(`Are you sure you want to delete "${quiz.title}"? This cannot be undone.`)) {
      return;
    }

    try {
      await adminQuizService.deleteQuiz(quiz.id);
      success('Quiz and attempts deleted successfully', 'Deleted');
      fetchQuizzes(pagination.currentPage);
    } catch (err: any) {
      toastError(err.message || 'Failed to delete quiz');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Quiz & Assessment Management</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
              ⚡ Evaluation Hub
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage both Platform Course Assessments and interactive Tutorial Chapter Quizzes (10 Questions • 5-min timer).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setSelectedQuizTarget(null);
              setChapterQuizModalOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-400 border border-teal-500/30 text-xs font-bold font-mono transition-all cursor-pointer shadow-2xs group"
          >
            <HelpCircle className="w-4 h-4 text-teal-500 group-hover:scale-110 transition-transform" />
            <span>❓ Manage Chapter Quizzes</span>
          </button>

          <Link to={ROUTES.ADMIN_QUIZZES_NEW} className="shrink-0 w-full sm:w-auto">
            <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4 stroke-[2.5]" />} className="w-full sm:w-auto shadow-md shadow-brand-500/20 font-bold text-xs">
              Create Assessment
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary Tab Switcher & Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-dark-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Assessment Category Switch */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('platform')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 border ${
              activeTab === 'platform'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm font-bold'
                : 'bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-dark-750 hover:bg-slate-200/80'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Platform Assessments ({quizzes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('chapter_quizzes')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 border ${
              activeTab === 'chapter_quizzes'
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white border-emerald-600 shadow-sm font-bold'
                : 'bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-dark-750 hover:bg-slate-200/80'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tutorial Chapter Quizzes ({chapterAssessments.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-full md:w-72">
            <Input
              placeholder={activeTab === 'platform' ? 'Search quizzes...' : 'Search chapter quizzes...'}
              leftIcon={<Search className="w-4 h-4" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {activeTab === 'platform' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 rounded-xl border border-slate-300 dark:border-dark-800 bg-white dark:bg-dark-900 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
            </select>
          )}
        </div>
      </div>

      {/* Platform Quizzes Tab Content */}
      {activeTab === 'platform' && (
        <>
          {loading && (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-2xl" />
              ))}
            </div>
          )}

          {!loading && error && (
            <ErrorState title="Error Loading Quizzes" message={error} onRetry={() => fetchQuizzes(1)} />
          )}

          {/* Quizzes Table */}
          {!loading && !error && quizzes.length > 0 && (
            <div className="rounded-2xl border border-slate-200/80 dark:border-dark-800 bg-white dark:bg-dark-900 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-dark-800 bg-slate-50/70 dark:bg-dark-850/40 text-slate-400">
                      <th className="py-3.5 px-4">Title & Slug</th>
                      <th className="py-3.5 px-4">Course</th>
                      <th className="py-3.5 px-4">Questions</th>
                      <th className="py-3.5 px-4">Time Limit</th>
                      <th className="py-3.5 px-4">Pass %</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-dark-800">
                    {quizzes.map((quiz) => (
                      <tr key={quiz.id} className="hover:bg-slate-50/60 dark:hover:bg-dark-850/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900 dark:text-white">{quiz.title}</p>
                          <span className="text-[11px] text-slate-400">/quizzes/{quiz.slug}</span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                          {quiz.courseTitle || '— Standalone —'}
                        </td>

                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                          {quiz.totalQuestions || quiz.questions?.length || 0}
                        </td>

                        <td className="py-3.5 px-4 text-slate-500">
                          {quiz.timeLimit > 0 ? `${quiz.timeLimit} mins` : 'Unlimited'}
                        </td>

                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                          {quiz.passingScore}%
                        </td>

                        <td className="py-3.5 px-4">
                          <Badge variant={quiz.isPublished ? 'success' : 'default'} size="sm">
                            {quiz.isPublished ? 'Published' : 'Draft'}
                          </Badge>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link to={`/quizzes/${quiz.slug || quiz.id}`} target="_blank">
                              <button
                                title="Preview Quiz"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-800 cursor-pointer"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            </Link>

                            <button
                              onClick={() => handleTogglePublish(quiz)}
                              title={quiz.isPublished ? 'Move to Draft' : 'Publish Quiz'}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-dark-800 cursor-pointer"
                            >
                              {quiz.isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            </button>

                            <Link to={`/admin/quizzes/${quiz.id}/edit`}>
                              <button
                                title="Edit Quiz"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-dark-800 cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </Link>

                            <button
                              onClick={() => handleDelete(quiz)}
                              title="Delete Quiz"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-dark-800 cursor-pointer"
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

              {pagination.totalPages > 1 && (
                <div className="p-4 border-t border-slate-200 dark:border-dark-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">
                    Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalItems} items)
                  </span>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.currentPage <= 1}
                      onClick={() => fetchQuizzes(pagination.currentPage - 1)}
                      leftIcon={<ChevronLeft className="w-4 h-4" />}
                    >
                      Prev
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.currentPage >= pagination.totalPages}
                      onClick={() => fetchQuizzes(pagination.currentPage + 1)}
                      rightIcon={<ChevronRight className="w-4 h-4" />}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {!loading && !error && quizzes.length === 0 && (
            <EmptyState
              icon={<HelpCircle className="w-6 h-6" />}
              title="No platform quizzes found"
              description="Create your first quiz or adjust your filters."
              actionLabel="Create Assessment"
              onAction={() => window.location.assign(ROUTES.ADMIN_QUIZZES_NEW)}
            />
          )}
        </>
      )}

      {/* Chapter Quizzes Tab Content */}
      {activeTab === 'chapter_quizzes' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-teal-500/5 dark:bg-teal-950/20 border border-teal-500/20 text-xs">
            <div className="flex items-center gap-2.5 text-teal-800 dark:text-teal-300">
              <Sparkles className="w-4 h-4 shrink-0 text-teal-500" />
              <span>
                <strong>Live Chapter Assessments:</strong> Each chapter features 10 targeted questions with a 5-minute timer (starts when student ticks 1st option). Admins can customize questions and time limits anytime!
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedQuizTarget(null);
                setChapterQuizModalOpen(true);
              }}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-mono font-bold text-xs cursor-pointer shadow-xs"
            >
              + Customize Any Chapter
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-dark-800 bg-white dark:bg-dark-900 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-dark-800 bg-slate-50/70 dark:bg-dark-850/40 text-slate-400">
                    <th className="py-3.5 px-4">Track & Chapter</th>
                    <th className="py-3.5 px-4">Assessment Title</th>
                    <th className="py-3.5 px-4">Questions</th>
                    <th className="py-3.5 px-4">Timer Rule</th>
                    <th className="py-3.5 px-4">Pass Req.</th>
                    <th className="py-3.5 px-4">Bank Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-800">
                  {filteredChapterAssessments.map((quiz) => (
                    <tr key={quiz.id} className="hover:bg-slate-50/60 dark:hover:bg-dark-850/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 w-fit border border-slate-200 dark:border-dark-700">
                            <BookOpen className="w-3 h-3 text-brand-500" />
                            {quiz.trackTitle}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-sans font-medium">
                            {quiz.chapterTitle}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900 dark:text-white font-sans text-sm">{quiz.title}</p>
                        <span className="text-[11px] text-slate-400 font-mono">ID: {quiz.chapterId}</span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          {quiz.totalQuestions} Questions
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>{quiz.timeLimit} mins (Starts on 1st tick)</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                        {quiz.passingScore}%
                      </td>

                      <td className="py-3.5 px-4">
                        {quiz.isCustomized ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                            ⭐ Custom Override
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
                            ✓ Standard Bank
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={quiz.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Preview in Student Tutorial"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-800 cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedQuizTarget({ trackId: quiz.trackId, chapterId: quiz.chapterId });
                              setChapterQuizModalOpen(true);
                            }}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-400 border border-teal-500/30 text-xs font-bold cursor-pointer transition-colors"
                            title="Configure 10 Questions and Timer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit Questions</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredChapterAssessments.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs font-mono">
                No chapter assessments matching "{search}"
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chapter Quizzes Management Modal */}
      <ManageChapterQuizzesModal
        isOpen={chapterQuizModalOpen}
        onClose={() => setChapterQuizModalOpen(false)}
        initialTrackId={selectedQuizTarget?.trackId}
        initialChapterId={selectedQuizTarget?.chapterId}
        onSaved={() => {
          refreshChapterAssessments();
        }}
      />
    </div>
  );
};
