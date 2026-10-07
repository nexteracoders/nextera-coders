import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { learningService } from '../../services/learning.service';
import { IEnrolledCourseCard } from '../../types/learning.types';
import { CoursePagination } from '../../types/course.types';
import { ROUTES } from '../../constants/routes';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { BookOpen, Clock, ArrowRight, PlayCircle, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

export const MyLearningPage: React.FC = () => {
  useDocumentTitle('My Learning — NextEra Coders');

  const [activeTab, setActiveTab] = useState<'all' | 'in-progress' | 'completed'>('all');
  const [enrollments, setEnrollments] = useState<IEnrolledCourseCard[]>([]);
  const [pagination, setPagination] = useState<CoursePagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 9,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEnrollments = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      const res = await learningService.getMyEnrollments({
        status: activeTab,
        page,
        limit: 9,
      });
      setEnrollments(res.enrollments);
      setPagination(res.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to load your enrolled courses');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchEnrollments(1);
  }, [fetchEnrollments]);

  return (
    <div className="space-y-8 pb-16">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            My Learning
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Resume your courses, review mastered concepts, and track your engineering path.
          </p>
        </div>

        <Link to={ROUTES.COURSES}>
          <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
            Explore Course Catalog
          </Button>
        </Link>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-dark-800 pb-3">
        {[
          { key: 'all', label: 'All Courses' },
          { key: 'in-progress', label: 'In Progress' },
          { key: 'completed', label: 'Completed' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-mono font-medium transition-colors focus:outline-none',
              activeTab === tab.key
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-dark-850 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-dark-800'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading Skeleton Grid */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-5 rounded-2xl border border-slate-200 dark:border-dark-800 bg-white dark:bg-dark-900 space-y-4">
              <Skeleton className="h-40 w-full rounded-xl" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <ErrorState title="Error Loading Courses" message={error} onRetry={() => fetchEnrollments(1)} />
      )}

      {/* Enrollments Grid */}
      {!loading && !error && enrollments.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.map((item) => {
              const learnUrl = item.lastAccessedLesson
                ? `/courses/${item.course.slug}/learn?lesson=${item.lastAccessedLesson.id}`
                : `/courses/${item.course.slug}/learn`;

              return (
                <Card key={item.enrollmentId} variant="elevated" className="flex flex-col justify-between overflow-hidden">
                  <div>
                    <div className="h-36 bg-gradient-to-br from-slate-800 to-dark-950 p-4 flex flex-col justify-between text-white relative overflow-hidden">
                      <div className="flex items-center justify-between relative z-10">
                        <Badge variant="default" className="bg-brand-600/90 text-white border-none">
                          {item.course.category}
                        </Badge>
                        {item.isCompleted ? (
                          <Badge variant="success" size="sm" className="bg-emerald-500/90 text-white border-none flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Mastered
                          </Badge>
                        ) : (
                          <span className="text-xs font-mono bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm">
                            {item.progress}%
                          </span>
                        )}
                      </div>

                      <div className="relative z-10 flex items-center justify-between text-xs text-slate-300 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {item.course.duration}
                        </span>
                        <span>
                          {item.completedLessonsCount} / {item.totalLessons} Lessons
                        </span>
                      </div>
                      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>
                    </div>

                    <CardHeader>
                      <CardTitle className="text-base font-bold line-clamp-1">{item.course.title}</CardTitle>
                      <CardDescription className="text-xs line-clamp-2 mt-1">
                        {item.course.shortDescription}
                      </CardDescription>
                    </CardHeader>
                  </div>

                  <CardContent className="space-y-4 pt-0">
                    {/* Progress bar */}
                    <div className="space-y-1.5">
                      <div className="w-full bg-slate-200 dark:bg-dark-800 rounded-full h-2 overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-500',
                            item.isCompleted ? 'bg-emerald-500' : 'bg-brand-600 dark:bg-brand-500'
                          )}
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-dark-800 flex items-center justify-between gap-2">
                      <Link to={`/courses/${item.course.slug}`}>
                        <Button variant="ghost" size="sm">
                          Syllabus
                        </Button>
                      </Link>

                      <Link to={learnUrl}>
                        <Button
                          variant="primary"
                          size="sm"
                          className={item.isCompleted ? 'bg-slate-800 hover:bg-slate-700 dark:bg-dark-700' : ''}
                          rightIcon={item.isCompleted ? <BookOpen className="w-3.5 h-3.5" /> : <PlayCircle className="w-3.5 h-3.5" />}
                        >
                          {item.isCompleted ? 'Review' : 'Continue'}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-dark-800 text-xs font-mono">
              <span className="text-slate-500 dark:text-slate-400">
                Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalItems} courses)
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.currentPage <= 1}
                  onClick={() => fetchEnrollments(pagination.currentPage - 1)}
                  leftIcon={<ChevronLeft className="w-4 h-4" />}
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.currentPage >= pagination.totalPages}
                  onClick={() => fetchEnrollments(pagination.currentPage + 1)}
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && !error && enrollments.length === 0 && (
        <EmptyState
          icon={<BookOpen className="w-6 h-6" />}
          title={
            activeTab === 'completed'
              ? 'No Completed Courses Yet'
              : activeTab === 'in-progress'
              ? 'No In-Progress Courses'
              : 'You Have Not Enrolled In Any Courses'
          }
          description={
            activeTab === 'completed'
              ? 'Complete all published lessons in an enrolled course to master it and see it listed here.'
              : 'Browse our comprehensive catalog to start learning full-stack development, DSA, and backend systems.'
          }
          actionLabel="Explore Course Catalog"
          onAction={() => window.location.assign(ROUTES.COURSES)}
        />
      )}
    </div>
  );
};
