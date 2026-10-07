import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { projectService } from '../../services/project.service';
import { IProject, IProjectCategory } from '../../types/project.types';
import { CoursePagination } from '../../types/course.types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import {
  FolderGit2,
  Search,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  useDocumentTitle('Project-Based Learning — NextEra Coders');

  const [projects, setProjects] = useState<IProject[]>([]);
  const [categories, setCategories] = useState<IProjectCategory[]>([]);
  const [pagination, setPagination] = useState<CoursePagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 12,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    projectService.getProjectCategories().then(setCategories).catch(() => {});
  }, []);

  const fetchProjects = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      const data = await projectService.getProjects({
        page,
        limit: 12,
        search: searchTerm.trim() || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        difficulty: selectedDifficulty !== 'All' ? selectedDifficulty : undefined,
      });
      setProjects(data.projects);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory, selectedDifficulty]);

  useEffect(() => {
    fetchProjects(1);
  }, [fetchProjects]);

  return (
    <div className="min-h-screen py-8 sm:py-12 bg-slate-50/50 dark:bg-dark-950 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-mono font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Project-Based Learning</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Build Production-Ready Applications
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Gain job-ready portfolio experience constructing full-stack systems, stateful frontends, and resilient backends.
          </p>
        </div>

        {/* Filters */}
        <div className="p-4 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-dark-800 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="w-full lg:w-80">
            <Input
              placeholder="Search projects or technologies..."
              leftIcon={<Search className="w-4 h-4" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-10 px-3 rounded-xl border border-slate-300 dark:border-dark-800 bg-white dark:bg-dark-900 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="All">All Categories</option>
              {categories.map((c) => (
                <option key={c.category} value={c.category}>
                  {c.category} ({c.count})
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1">
              {['All', 'Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSelectedDifficulty(lvl)}
                  className={`px-3 py-2 rounded-xl text-xs font-mono font-medium transition-colors ${
                    selectedDifficulty === lvl
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-dark-850 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-dark-800'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} variant="elevated" className="h-96 flex flex-col justify-between">
                <Skeleton className="h-44 w-full rounded-t-2xl" />
                <CardHeader>
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardFooter>
                  <Skeleton className="h-9 w-full rounded-xl" />
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <ErrorState
            title="Error Loading Projects"
            message={error}
            onRetry={() => fetchProjects(1)}
          />
        )}

        {/* Projects Grid */}
        {!loading && !error && projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((proj) => (
              <Card
                key={proj.id}
                variant="elevated"
                className="flex flex-col justify-between overflow-hidden hover:border-brand-500/40 dark:hover:border-brand-500/40 transition-all duration-200 group"
              >
                {proj.thumbnail ? (
                  <div className="h-44 w-full overflow-hidden bg-slate-900 relative">
                    <img
                      src={proj.thumbnail}
                      alt={proj.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3">
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
                    </div>
                  </div>
                ) : (
                  <div className="h-32 w-full bg-gradient-to-br from-brand-600/10 to-indigo-600/10 flex items-center justify-center p-4 border-b border-slate-100 dark:border-dark-800">
                    <FolderGit2 className="w-8 h-8 text-brand-600 dark:text-brand-400" />
                  </div>
                )}

                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" size="sm" className="font-mono">
                      {proj.category}
                    </Badge>
                    {!proj.thumbnail && (
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
                    )}
                  </div>

                  <CardTitle className="text-base font-bold group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {proj.title}
                  </CardTitle>

                  <CardDescription className="line-clamp-2 text-xs">
                    {proj.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0 space-y-3">
                  {/* Technology Tags */}
                  <div className="flex flex-wrap gap-1">
                    {proj.technologies?.slice(0, 4).map((tech) => (
                      <span
                        key={tech}
                        className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-100 dark:bg-dark-850 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-dark-800"
                      >
                        {tech}
                      </span>
                    ))}
                    {proj.technologies?.length > 4 && (
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono text-slate-400">
                        +{proj.technologies.length - 4} more
                      </span>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="pt-0">
                  <Link to={`/projects/${proj.slug || proj.id}`} className="w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full font-mono text-xs group-hover:border-brand-500/50"
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      View Project Blueprint
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && projects.length === 0 && (
          <EmptyState
            icon={<FolderGit2 className="w-6 h-6" />}
            title="No projects match your filter"
            description="Clear your filter criteria to explore our complete blueprint library."
            actionLabel="Reset Search"
            onAction={() => {
              setSearchTerm('');
              setSelectedCategory('All');
              setSelectedDifficulty('All');
            }}
          />
        )}

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-6 font-mono text-xs">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.currentPage <= 1}
              onClick={() => fetchProjects(pagination.currentPage - 1)}
              leftIcon={<ChevronLeft className="w-4 h-4" />}
            >
              Previous
            </Button>

            <span className="text-slate-500">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>

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
        )}
      </div>
    </div>
  );
};
