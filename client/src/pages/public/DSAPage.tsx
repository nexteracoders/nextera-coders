import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { problemService } from '../../services/problem.service';
import { IDSAStats } from '../../types/problem.types';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { ROUTES } from '../../constants/routes';
import {
  Cpu,
  Layers,
  CheckCircle2,
  Clock,
  ArrowRight,
  Code2,
} from 'lucide-react';

export const DSAPage: React.FC = () => {
  useDocumentTitle('Data Structures & Algorithms Roadmap — NextEra Coders');

  const [stats, setStats] = useState<IDSAStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await problemService.getDSAStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load DSA statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div>
      <PageHeader
        badge="Curated DSA Ladder"
        title="Data Structures & Algorithms Roadmap"
        description="Master foundational and advanced coding patterns with our structured curriculum and automated test sandbox."
        breadcrumbs={[{ label: 'DSA Roadmap' }]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16">
        {loading && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-2xl" />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-44 rounded-2xl" />
              ))}
            </div>
          </div>
        )}

        {!loading && error && (
          <ErrorState
            title="Failed to Load DSA Roadmap"
            message={error}
            onRetry={fetchStats}
          />
        )}

        {!loading && !error && stats && (
          <>
            {/* Top Progress & Summary Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card variant="default" className="p-5 flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 shrink-0">
                  <Code2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-mono text-slate-500 dark:text-slate-400">Total DSA Challenges</p>
                  <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                    {stats.totalProblems}
                  </h3>
                </div>
              </Card>

              <Card variant="default" className="p-5 flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-mono text-slate-500 dark:text-slate-400">Problems Solved</p>
                  <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                    {stats.userProgress.solved}
                  </h3>
                </div>
              </Card>

              <Card variant="default" className="p-5 flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-mono text-slate-500 dark:text-slate-400">Attempted</p>
                  <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                    {stats.userProgress.attempted}
                  </h3>
                </div>
              </Card>

              <Card variant="default" className="p-5 flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 shrink-0">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-mono text-slate-500 dark:text-slate-400">Core Patterns</p>
                  <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                    {stats.categories.length}
                  </h3>
                </div>
              </Card>
            </div>

            {/* Difficulty Breakdown Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card variant="elevated" className="border-emerald-200/60 dark:border-emerald-900/40">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="success" size="md">
                      Easy Track
                    </Badge>
                    <span className="text-xs font-mono text-slate-400">
                      {stats.difficulty.easy.solved} / {stats.difficulty.easy.total} Solved
                    </span>
                  </div>
                  <CardTitle className="text-lg font-bold mt-2">Foundational Patterns</CardTitle>
                  <CardDescription className="text-xs">
                    Basic array manipulations, two pointers, hashing, and elementary math.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="w-full bg-slate-200 dark:bg-dark-800 rounded-full h-2 overflow-hidden mb-4">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          stats.difficulty.easy.total > 0
                            ? (stats.difficulty.easy.solved / stats.difficulty.easy.total) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <Link to={`${ROUTES.PRACTICE}?difficulty=Easy`}>
                    <Button variant="outline" size="sm" className="w-full" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                      Practice Easy Problems
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card variant="elevated" className="border-amber-200/60 dark:border-amber-900/40">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="warning" size="md">
                      Medium Track
                    </Badge>
                    <span className="text-xs font-mono text-slate-400">
                      {stats.difficulty.medium.solved} / {stats.difficulty.medium.total} Solved
                    </span>
                  </div>
                  <CardTitle className="text-lg font-bold mt-2">Core Interview Patterns</CardTitle>
                  <CardDescription className="text-xs">
                    Sliding window, binary search, tree traversals, graphs, and dynamic programming.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="w-full bg-slate-200 dark:bg-dark-800 rounded-full h-2 overflow-hidden mb-4">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          stats.difficulty.medium.total > 0
                            ? (stats.difficulty.medium.solved / stats.difficulty.medium.total) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <Link to={`${ROUTES.PRACTICE}?difficulty=Medium`}>
                    <Button variant="outline" size="sm" className="w-full" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                      Practice Medium Problems
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card variant="elevated" className="border-rose-200/60 dark:border-rose-900/40">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="danger" size="md">
                      Hard Track
                    </Badge>
                    <span className="text-xs font-mono text-slate-400">
                      {stats.difficulty.hard.solved} / {stats.difficulty.hard.total} Solved
                    </span>
                  </div>
                  <CardTitle className="text-lg font-bold mt-2">Advanced Algorithmic Mastery</CardTitle>
                  <CardDescription className="text-xs">
                    Monotonic stacks, segment trees, 2D dynamic programming, and network flows.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="w-full bg-slate-200 dark:bg-dark-800 rounded-full h-2 overflow-hidden mb-4">
                    <div
                      className="bg-rose-500 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          stats.difficulty.hard.total > 0
                            ? (stats.difficulty.hard.solved / stats.difficulty.hard.total) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <Link to={`${ROUTES.PRACTICE}?difficulty=Hard`}>
                    <Button variant="outline" size="sm" className="w-full" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                      Practice Hard Problems
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* Pattern & Category Grid */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Explore Problem Patterns
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Categorized algorithmic problems backed by live database test execution.
                  </p>
                </div>

                <Link to={ROUTES.PRACTICE}>
                  <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    View All Challenges
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.categories.map((cat, i) => (
                  <Link
                    key={i}
                    to={`${ROUTES.PRACTICE}?category=${encodeURIComponent(cat.name)}`}
                    className="p-4 rounded-2xl border border-slate-200/80 dark:border-dark-800 bg-white dark:bg-dark-900 hover:border-brand-300 dark:hover:border-brand-800 transition-colors shadow-sm flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-dark-850 text-brand-600 dark:text-brand-400 group-hover:scale-110 transition-transform">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors">
                          {cat.name}
                        </h4>
                        <span className="text-xs font-mono text-slate-400">
                          {cat.count} Problem{cat.count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
