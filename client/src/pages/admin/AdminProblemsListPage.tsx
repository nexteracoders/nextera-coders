import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../components/ui/Toast';
import { adminProblemService } from '../../services/adminProblem.service';
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
  Code2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Sparkles,
} from 'lucide-react';
import { ProblemImporterModal } from '../../components/admin/ProblemImporterModal';

export const AdminProblemsListPage: React.FC = () => {
  useDocumentTitle('Admin Problem Management — NextEra Coders');

  const { success, error: toastError } = useToast();
  const [problems, setProblems] = useState<any[]>([]);
  const [pagination, setPagination] = useState<CoursePagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 20,
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isImporterOpen, setIsImporterOpen] = useState(false);

  const fetchProblems = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminProblemService.getProblems({
        page,
        limit: 20,
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        difficulty: difficultyFilter !== 'All' ? difficultyFilter : undefined,
      });
      setProblems(data.problems);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch admin problems');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, difficultyFilter]);

  useEffect(() => {
    fetchProblems(1);
  }, [fetchProblems]);

  const handleTogglePublish = async (problem: any) => {
    try {
      if (problem.isPublished) {
        await adminProblemService.unpublishProblem(problem.id);
        success(`Moved "${problem.title}" to Drafts`, 'Status Updated');
      } else {
        await adminProblemService.publishProblem(problem.id);
        success(`Published "${problem.title}"`, 'Status Updated');
      }
      fetchProblems(pagination.currentPage);
    } catch (err: any) {
      toastError(err.message || 'Failed to update publish state');
    }
  };

  const handleDelete = async (problem: any) => {
    if (!window.confirm(`Are you sure you want to delete "${problem.title}"? This cannot be undone.`)) {
      return;
    }

    try {
      await adminProblemService.deleteProblem(problem.id);
      success('Problem deleted successfully', 'Deleted');
      fetchProblems(pagination.currentPage);
    } catch (err: any) {
      toastError(err.message || 'Failed to delete problem');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            DSA Problem Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Create, manage test cases, and publish coding challenges to the platform.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto flex-wrap">
          <Link to={ROUTES.ADMIN_MONTHLY_CONTEST} className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="md"
              leftIcon={<Trophy className="w-4 h-4 text-amber-500 fill-amber-500" />}
              className="w-full sm:w-auto border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 font-bold"
            >
              Monthly Contest
            </Button>
          </Link>
          <Button
            variant="outline"
            size="md"
            onClick={() => setIsImporterOpen(true)}
            leftIcon={<Sparkles className="w-4 h-4 text-brand-500" />}
            className="w-full sm:w-auto border-brand-500/30 text-brand-600 dark:text-brand-400 hover:bg-brand-500/10 font-bold"
          >
            One-Click Importer
          </Button>
          <Link to={ROUTES.ADMIN_PROBLEMS_NEW} className="w-full sm:w-auto">
            <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4 stroke-[2.5]" />} className="w-full sm:w-auto shadow-md shadow-brand-500/20 font-bold">
              Create Problem
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-dark-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search problems..."
            leftIcon={<Search className="w-4 h-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-300 dark:border-dark-800 bg-white dark:bg-dark-900 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="All">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-300 dark:border-dark-800 bg-white dark:bg-dark-900 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      )}

      {!loading && error && (
        <ErrorState title="Error Loading Problems" message={error} onRetry={() => fetchProblems(1)} />
      )}

      {/* Problems Table */}
      {!loading && !error && problems.length > 0 && (
        <div className="rounded-2xl border border-slate-200/80 dark:border-dark-800 bg-white dark:bg-dark-900 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-dark-800 bg-slate-50/70 dark:bg-dark-850/40 text-slate-500 dark:text-slate-400 font-mono">
                  <th className="py-3.5 px-3 w-16 text-center"># SL</th>
                  <th className="py-3.5 px-4">Title & Slug</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Difficulty</th>
                  <th className="py-3.5 px-4">Test Cases</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-800">
                {problems.map((prob) => (
                  <tr key={prob.id} className="hover:bg-slate-50/60 dark:hover:bg-dark-850/40 transition-colors">
                    <td className="py-3.5 px-3 text-center">
                      <span className="inline-flex items-center justify-center font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-dark-700">
                        #{prob.order || '-'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 dark:text-white">{prob.title}</p>
                      <span className="text-[11px] font-mono text-slate-400">/dsa/{prob.slug}</span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {prob.category}
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          prob.difficulty === 'Easy'
                            ? 'success'
                            : prob.difficulty === 'Medium'
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                      >
                        {prob.difficulty}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {prob.testCasesCount} ({prob.hiddenTestCasesCount} hidden)
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge variant={prob.isPublished ? 'success' : 'default'} size="sm">
                        {prob.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link to={`/dsa/${prob.slug}`} target="_blank">
                          <button
                            title="Preview on site"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-800"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </Link>

                        <button
                          onClick={() => handleTogglePublish(prob)}
                          title={prob.isPublished ? 'Move to Draft' : 'Publish Problem'}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-dark-800"
                        >
                          {prob.isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>

                        <Link to={`/admin/problems/${prob.id}/edit`}>
                          <button
                            title="Edit Problem"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-dark-800"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </Link>

                        <button
                          onClick={() => handleDelete(prob)}
                          title="Delete Problem"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-dark-800"
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
                  onClick={() => fetchProblems(pagination.currentPage - 1)}
                  leftIcon={<ChevronLeft className="w-4 h-4" />}
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.currentPage >= pagination.totalPages}
                  onClick={() => fetchProblems(pagination.currentPage + 1)}
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && !error && problems.length === 0 && (
        <EmptyState
          icon={<Code2 className="w-6 h-6" />}
          title="No problems found"
          description="Create your first DSA challenge or adjust your filters."
          actionLabel="Create Problem"
          onAction={() => window.location.assign(ROUTES.ADMIN_PROBLEMS_NEW)}
        />
      )}

      {/* Problem Importer Modal */}
      <ProblemImporterModal
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        onSuccess={() => fetchProblems(pagination.currentPage)}
      />
    </div>
  );
};
