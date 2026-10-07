import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../components/ui/Toast';
import { adminProjectService } from '../../services/adminProject.service';
import { IProject } from '../../types/project.types';
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
  FolderGit2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const AdminProjectsListPage: React.FC = () => {
  useDocumentTitle('Admin Project Blueprints — NextEra Coders');

  const { success, error: toastError } = useToast();
  const [projects, setProjects] = useState<IProject[]>([]);
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

  const fetchProjects = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminProjectService.getProjects({
        page,
        limit: 20,
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        difficulty: difficultyFilter !== 'All' ? difficultyFilter : undefined,
      });
      setProjects(data.projects);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, difficultyFilter]);

  useEffect(() => {
    fetchProjects(1);
  }, [fetchProjects]);

  const handleTogglePublish = async (project: IProject) => {
    try {
      if (project.isPublished) {
        await adminProjectService.unpublishProject(project.id);
        success(`Moved "${project.title}" to Drafts`, 'Status Updated');
      } else {
        await adminProjectService.publishProject(project.id);
        success(`Published "${project.title}"`, 'Status Updated');
      }
      fetchProjects(pagination.currentPage);
    } catch (err: any) {
      toastError(err.message || 'Failed to update publish status');
    }
  };

  const handleDelete = async (project: IProject) => {
    if (!window.confirm(`Are you sure you want to delete "${project.title}"? This cannot be undone.`)) {
      return;
    }

    try {
      await adminProjectService.deleteProject(project.id);
      success('Project deleted successfully', 'Deleted');
      fetchProjects(pagination.currentPage);
    } catch (err: any) {
      toastError(err.message || 'Failed to delete project');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Project Blueprint Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Create, configure tech stacks, requirements, and publish full-stack portfolios.
          </p>
        </div>

        <Link to={ROUTES.ADMIN_PROJECTS_NEW} className="shrink-0 w-full sm:w-auto">
          <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4 stroke-[2.5]" />} className="w-full sm:w-auto shadow-md shadow-brand-500/20">
            Create Project
          </Button>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-dark-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search projects..."
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
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
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
        <ErrorState title="Error Loading Projects" message={error} onRetry={() => fetchProjects(1)} />
      )}

      {/* Projects Table */}
      {!loading && !error && projects.length > 0 && (
        <div className="rounded-2xl border border-slate-200/80 dark:border-dark-800 bg-white dark:bg-dark-900 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-200 dark:border-dark-800 bg-slate-50/70 dark:bg-dark-850/40 text-slate-400">
                  <th className="py-3.5 px-4">Title & Slug</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Difficulty</th>
                  <th className="py-3.5 px-4">Technologies</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-800">
                {projects.map((proj) => (
                  <tr key={proj.id} className="hover:bg-slate-50/60 dark:hover:bg-dark-850/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 dark:text-white">{proj.title}</p>
                      <span className="text-[11px] text-slate-400">/projects/{proj.slug}</span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {proj.category}
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          proj.difficulty === 'Beginner'
                            ? 'success'
                            : proj.difficulty === 'Intermediate'
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                      >
                        {proj.difficulty}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                      {proj.technologies?.join(', ') || '—'}
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge variant={proj.isPublished ? 'success' : 'default'} size="sm">
                        {proj.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link to={`/projects/${proj.slug || proj.id}`} target="_blank">
                          <button
                            title="Preview Project"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-800"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </Link>

                        <button
                          onClick={() => handleTogglePublish(proj)}
                          title={proj.isPublished ? 'Move to Draft' : 'Publish Project'}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-dark-800"
                        >
                          {proj.isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>

                        <Link to={`/admin/projects/${proj.id}/edit`}>
                          <button
                            title="Edit Project"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-dark-800"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </Link>

                        <button
                          onClick={() => handleDelete(proj)}
                          title="Delete Project"
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
                  onClick={() => fetchProjects(pagination.currentPage - 1)}
                  leftIcon={<ChevronLeft className="w-4 h-4" />}
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.currentPage >= pagination.totalPages}
                  onClick={() => fetchProjects(pagination.currentPage + 1)}
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && !error && projects.length === 0 && (
        <EmptyState
          icon={<FolderGit2 className="w-6 h-6" />}
          title="No projects found"
          description="Create your first project blueprint or adjust your filters."
          actionLabel="Create Project"
          onAction={() => window.location.assign(ROUTES.ADMIN_PROJECTS_NEW)}
        />
      )}
    </div>
  );
};
