import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { quizService } from '../../services/quiz.service';
import { IQuizSummary } from '../../types/quiz.types';
import { CoursePagination } from '../../types/course.types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import {
  HelpCircle,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sparkles,
  BookOpen,
  GraduationCap,
  Layers,
} from 'lucide-react';
import { getAllChapterAssessments } from '../../data/tutorialQuizBank';

export const QuizzesPage: React.FC = () => {
  useDocumentTitle('Interactive Quizzes & Skill Tests — NextEra Coders');

  const [quizzes, setQuizzes] = useState<IQuizSummary[]>([]);
  const [selectedTab, setSelectedTab] = useState<'all' | 'tutorials' | 'courses' | 'general'>('all');
  const [pagination, setPagination] = useState<CoursePagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 12,
  });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all tutorial chapter assessments
  const chapterAssessments = useMemo(() => {
    return getAllChapterAssessments();
  }, []);

  const fetchQuizzes = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      const data = await quizService.getQuizzes({
        page,
        limit: 12,
        search: search.trim() || undefined,
      });
      setQuizzes(data.quizzes);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchQuizzes(1);
  }, [fetchQuizzes]);

  // Filtered Chapter Assessments based on tab and search
  const filteredChapterAssessments = useMemo(() => {
    if (selectedTab === 'courses' || selectedTab === 'general') return [];
    if (!search.trim()) return chapterAssessments;
    const q = search.toLowerCase();
    return chapterAssessments.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.trackTitle.toLowerCase().includes(q) ||
        c.chapterTitle.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    );
  }, [chapterAssessments, search, selectedTab]);

  // Filtered Database Quizzes based on tab and search
  const filteredDbQuizzes = useMemo(() => {
    if (selectedTab === 'tutorials') return [];
    if (selectedTab === 'courses') {
      return quizzes.filter((q) => !!q.course);
    }
    if (selectedTab === 'general') {
      return quizzes.filter((q) => !q.course);
    }
    return quizzes;
  }, [quizzes, selectedTab]);

  const totalVisibleAssessments = filteredChapterAssessments.length + filteredDbQuizzes.length;

  return (
    <div className="min-h-screen py-8 sm:py-12 bg-slate-50/50 dark:bg-dark-950 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-medium border border-emerald-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Assessments & Skill Validation</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Test Your Knowledge & Validate Skills
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Timed 10-question chapter quizzes and comprehensive skill assessments with immediate explanations and performance tracking.
          </p>
        </div>

        {/* Filter Bar with Tabs & Search */}
        <div className="p-4 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-dark-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border ${
                selectedTab === 'all'
                  ? 'bg-emerald-600 dark:bg-emerald-500 text-white border-emerald-600 shadow-sm font-bold'
                  : 'bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-dark-750 hover:bg-slate-200/80'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All ({chapterAssessments.length + quizzes.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTab('tutorials')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border ${
                selectedTab === 'tutorials'
                  ? 'bg-emerald-600 dark:bg-emerald-500 text-white border-emerald-600 shadow-sm font-bold'
                  : 'bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-dark-750 hover:bg-slate-200/80'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
              <span>Tutorial Chapter Quizzes ({chapterAssessments.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTab('general')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border ${
                selectedTab === 'general'
                  ? 'bg-emerald-600 dark:bg-emerald-500 text-white border-emerald-600 shadow-sm font-bold'
                  : 'bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-dark-750 hover:bg-slate-200/80'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>General Tests</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTab('courses')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border ${
                selectedTab === 'courses'
                  ? 'bg-emerald-600 dark:bg-emerald-500 text-white border-emerald-600 shadow-sm font-bold'
                  : 'bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-dark-750 hover:bg-slate-200/80'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-amber-500" />
              <span>Course Quizzes</span>
            </button>
          </div>

          <div className="w-full md:w-80">
            <Input
              placeholder="Search by topic, chapter or skill..."
              leftIcon={<Search className="w-4 h-4" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} variant="elevated" className="h-64 flex flex-col justify-between">
                <CardHeader>
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full rounded-xl" />
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <ErrorState
            title="Error Loading Quizzes"
            message={error}
            onRetry={() => fetchQuizzes(1)}
          />
        )}

        {/* Unified Quizzes Grid (Tutorial Chapter Quizzes + DB Quizzes) */}
        {!loading && !error && totalVisibleAssessments > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 1. Render Tutorial Chapter Assessments */}
            {filteredChapterAssessments.map((c) => (
              <Card
                key={c.id}
                variant="elevated"
                className="flex flex-col justify-between hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all duration-200 group border-slate-200/80 dark:border-dark-800 shadow-sm"
              >
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
                      {c.trackShortTitle || c.trackTitle}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-dark-800 text-slate-500 dark:text-slate-400 font-semibold">
                      Chapter Assessment
                    </span>
                  </div>

                  <CardTitle className="text-base group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                    {c.title}
                  </CardTitle>

                  <CardDescription className="line-clamp-2 text-xs">
                    {c.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-dark-850 border border-slate-100 dark:border-dark-800 text-center font-mono">
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase">Questions</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {c.totalQuestions}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase">Time</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-center gap-0.5">
                        <Clock className="w-3 h-3 text-emerald-500" />
                        {c.timeLimit}m
                      </span>
                    </div>

                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase">Pass Req.</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {c.passingScore}%
                      </span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-0">
                  <Link to={c.link} className="w-full">
                    <Button
                      variant="primary"
                      size="md"
                      className="w-full font-mono text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/20"
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      Start Chapter Quiz
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}

            {/* 2. Render Database Platform Quizzes */}
            {filteredDbQuizzes.map((quiz) => (
              <Card
                key={quiz.id}
                variant="elevated"
                className="flex flex-col justify-between hover:border-brand-500/40 dark:hover:border-brand-500/40 transition-all duration-200 group border-slate-200/80 dark:border-dark-800 shadow-sm"
              >
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    {quiz.course ? (
                      <Badge variant="outline" size="sm" className="font-mono text-[11px]">
                        {quiz.course.title}
                      </Badge>
                    ) : (
                      <Badge variant="default" size="sm" className="font-mono text-[11px]">
                        General Skill Test
                      </Badge>
                    )}

                    {quiz.userAttempt ? (
                      quiz.userAttempt.passed ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Passed ({quiz.userAttempt.percentage}%)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-amber-600 dark:text-amber-400">
                          <XCircle className="w-3.5 h-3.5" /> Attempted ({quiz.userAttempt.percentage}%)
                        </span>
                      )
                    ) : (
                      <span className="text-[11px] font-mono text-slate-400">Not Attempted</span>
                    )}
                  </div>

                  <CardTitle className="text-base group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-1">
                    {quiz.title}
                  </CardTitle>

                  <CardDescription className="line-clamp-2 text-xs">
                    {quiz.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-dark-850 border border-slate-100 dark:border-dark-800 text-center font-mono">
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase">Questions</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {quiz.totalQuestions}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase">Time</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-center gap-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {quiz.timeLimit > 0 ? `${quiz.timeLimit}m` : '∞'}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase">Pass Req.</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {quiz.passingScore}%
                      </span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-0">
                  <Link to={`/quizzes/${quiz.slug || quiz.id}`} className="w-full">
                    <Button
                      variant={quiz.userAttempt?.passed ? 'outline' : 'primary'}
                      size="md"
                      className="w-full font-mono text-xs"
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      {quiz.userAttempt ? 'Review or Retake' : 'Start Assessment'}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination Controls for Database Quizzes */}
        {!loading && !error && selectedTab !== 'tutorials' && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-dark-800 text-xs text-slate-500 font-mono">
            <span>
              Showing Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalItems} assessments)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.currentPage <= 1}
                onClick={() => fetchQuizzes(pagination.currentPage - 1)}
                leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.currentPage >= pagination.totalPages}
                onClick={() => fetchQuizzes(pagination.currentPage + 1)}
                rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && totalVisibleAssessments === 0 && (
          <EmptyState
            icon={<HelpCircle className="w-6 h-6" />}
            title="No assessments found"
            description={
              search
                ? `No assessments matched "${search}". Try clearing your search query.`
                : 'No assessments available in this category yet.'
            }
            actionLabel={search ? 'Reset Search' : undefined}
            onAction={search ? () => setSearch('') : undefined}
          />
        )}
      </div>
    </div>
  );
};
