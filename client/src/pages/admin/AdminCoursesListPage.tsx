import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../components/ui/Toast';
import { adminCourseService } from '../../services/adminCourse.service';
import { ICourse, CoursePagination } from '../../types/course.types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import {
  Plus,
  Search,
  BookOpen,
  Edit,
  Trash2,
  Eye,
  Layers,
  Crown,
  Gift,
  FileText,
  ChevronLeft,
  ChevronRight,
  Lock,
  Users,
  Clock,
  Sparkles,
  X,
  RotateCcw,
} from 'lucide-react';
import { cn } from '../../utils/cn';

// Elegant fallback thumbnail component when image is missing or broken
const CourseThumbnail: React.FC<{ thumbnail?: string; title: string; category: string }> = ({
  thumbnail,
  title,
  category,
}) => {
  const [imgError, setImgError] = useState(false);

  const getGradient = (cat: string) => {
    const c = (cat || '').toLowerCase();
    if (c.includes('full-stack') || c.includes('react') || c.includes('frontend')) {
      return 'from-blue-600/30 via-indigo-600/20 to-slate-900 border-indigo-500/30';
    }
    if (c.includes('backend') || c.includes('system') || c.includes('node')) {
      return 'from-emerald-600/30 via-teal-600/20 to-slate-900 border-emerald-500/30';
    }
    if (c.includes('ai') || c.includes('agent') || c.includes('python')) {
      return 'from-purple-600/30 via-pink-600/20 to-slate-900 border-purple-500/30';
    }
    if (c.includes('dsa') || c.includes('algo')) {
      return 'from-amber-600/30 via-orange-600/20 to-slate-900 border-amber-500/30';
    }
    return 'from-brand-600/30 via-slate-800 to-slate-900 border-brand-500/30';
  };

  if (thumbnail && !imgError) {
    return (
      <div className="w-16 h-10 sm:w-20 sm:h-12 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-200 dark:border-dark-700 relative aspect-video shadow-xs group-hover:border-brand-500/50 transition-colors">
        <img
          src={thumbnail}
          alt={title}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'w-16 h-10 sm:w-20 sm:h-12 rounded-xl overflow-hidden shrink-0 border relative aspect-video flex flex-col justify-between p-1.5 bg-gradient-to-br shadow-xs select-none',
        getGradient(category)
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[8px] font-mono uppercase font-black tracking-wider text-slate-300 truncate max-w-[55px]">
          {category?.split(' ')[0] || 'Track'}
        </span>
        <div className="w-1.5 h-1.5 rounded-full bg-brand-400" />
      </div>
      <div className="text-[9px] sm:text-[10px] font-bold text-white truncate font-sans">
        {title.split(' ').slice(0, 2).join(' ')}
      </div>
    </div>
  );
};

export const AdminCoursesListPage: React.FC = () => {
  useDocumentTitle('Manage Courses — Admin CMS');
  const { success, error: toastError } = useToast();

  const [courses, setCourses] = useState<ICourse[]>([]);
  const [pagination, setPagination] = useState<CoursePagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 25,
  });
  const [stats, setStats] = useState({
    total: 0,
    pro: 0,
    free: 0,
    published: 0,
    drafts: 0,
  });

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'pro' | 'free'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [pageSize, setPageSize] = useState(25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<ICourse | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCourses = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminCourseService.getCourses({
        page,
        limit: pageSize,
        search: search.trim() || undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        category: categoryFilter !== 'All' ? categoryFilter : undefined,
      });
      setCourses(res.courses);
      setPagination(res.pagination);
      if (res.stats) {
        setStats({
          total: res.stats.total ?? 0,
          pro: res.stats.pro ?? 0,
          free: res.stats.free ?? 0,
          published: res.stats.published ?? 0,
          drafts: res.stats.drafts ?? 0,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch admin courses');
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, statusFilter, categoryFilter, pageSize]);

  useEffect(() => {
    fetchCourses(1);
  }, [fetchCourses]);

  const handleTogglePublish = async (course: ICourse) => {
    try {
      if (course.isPublished) {
        await adminCourseService.unpublishCourse(course.id);
        success(`${course.title} moved to Draft mode.`, 'Status Updated');
      } else {
        await adminCourseService.publishCourse(course.id);
        success(`${course.title} is now Published!`, 'Status Updated');
      }
      fetchCourses(pagination.currentPage);
    } catch (err: any) {
      toastError(err.message || 'Failed to update publication status');
    }
  };

  const handleToggleFeature = async (course: ICourse) => {
    try {
      const res = await adminCourseService.toggleFeature(course.id);
      success(
        `${course.title} ${res.isFeatured ? 'featured' : 'unfeatured'} successfully.`,
        'Feature Toggled'
      );
      fetchCourses(pagination.currentPage);
    } catch (err: any) {
      toastError(err.message || 'Failed to toggle feature');
    }
  };

  const confirmDelete = async () => {
    if (!courseToDelete) return;
    try {
      setDeleting(true);
      await adminCourseService.deleteCourse(courseToDelete.id);
      success(`Deleted course ${courseToDelete.title}`, 'Deleted');
      setDeleteModalOpen(false);
      setCourseToDelete(null);
      fetchCourses(pagination.currentPage);
    } catch (err: any) {
      toastError(err.message || 'Failed to delete course');
    } finally {
      setDeleting(false);
    }
  };

  const isFiltered = Boolean(
    search || typeFilter !== 'all' || statusFilter !== 'all' || categoryFilter !== 'All'
  );

  const resetFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setStatusFilter('all');
    setCategoryFilter('All');
  };

  const startItem = pagination.totalItems === 0 ? 0 : (pagination.currentPage - 1) * pagination.limit + 1;
  const endItem = Math.min(pagination.currentPage * pagination.limit, pagination.totalItems);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Manage Courses
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Curriculum catalog, tier pricing, and public student portal synchronization.
          </p>
        </div>
        <Link to="/admin/courses/new" className="shrink-0 w-full sm:w-auto">
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4 stroke-[2.5]" />}
            className="w-full sm:w-auto shadow-md shadow-brand-500/20 font-bold"
          >
            Create New Course
          </Button>
        </Link>
      </div>

      {/* Live Metric Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Courses Card */}
        <button
          type="button"
          onClick={() => {
            setTypeFilter('all');
            setStatusFilter('all');
          }}
          className={cn(
            'p-4 rounded-2xl text-left transition-all border cursor-pointer group relative overflow-hidden',
            typeFilter === 'all' && statusFilter === 'all'
              ? 'bg-brand-50/80 dark:bg-brand-950/40 border-brand-500/60 shadow-sm ring-1 ring-brand-500/20'
              : 'bg-white dark:bg-dark-900 border-slate-200/90 dark:border-dark-800 hover:border-brand-500/40'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">Total Courses</span>
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 group-hover:scale-110 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white font-mono">
            {stats.total}
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-mono">
            {stats.published} published • {stats.drafts} drafts
          </div>
        </button>

        {/* Pro VIP Tracks Card */}
        <button
          type="button"
          onClick={() => {
            setTypeFilter('pro');
            setStatusFilter('all');
          }}
          className={cn(
            'p-4 rounded-2xl text-left transition-all border cursor-pointer group relative overflow-hidden',
            typeFilter === 'pro'
              ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-500/60 shadow-sm ring-1 ring-amber-500/20'
              : 'bg-white dark:bg-dark-900 border-slate-200/90 dark:border-dark-800 hover:border-amber-500/40'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">👑 Pro VIP Tracks</span>
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white font-mono">
            {stats.pro}
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-mono">
            Pro Membership & Standalone
          </div>
        </button>

        {/* Free Library Card */}
        <button
          type="button"
          onClick={() => {
            setTypeFilter('free');
            setStatusFilter('all');
          }}
          className={cn(
            'p-4 rounded-2xl text-left transition-all border cursor-pointer group relative overflow-hidden',
            typeFilter === 'free'
              ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500/60 shadow-sm ring-1 ring-emerald-500/20'
              : 'bg-white dark:bg-dark-900 border-slate-200/90 dark:border-dark-800 hover:border-emerald-500/40'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">🎁 Free Library</span>
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <Gift className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white font-mono">
            {stats.free}
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-mono">
            Open access for all learners
          </div>
        </button>

        {/* Drafts Card */}
        <button
          type="button"
          onClick={() => {
            setStatusFilter('draft');
            setTypeFilter('all');
          }}
          className={cn(
            'p-4 rounded-2xl text-left transition-all border cursor-pointer group relative overflow-hidden',
            statusFilter === 'draft'
              ? 'bg-purple-50/80 dark:bg-purple-950/40 border-purple-500/60 shadow-sm ring-1 ring-purple-500/20'
              : 'bg-white dark:bg-dark-900 border-slate-200/90 dark:border-dark-800 hover:border-purple-500/40'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">📝 Draft Courses</span>
            <div className="p-2 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white font-mono">
            {stats.drafts}
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-mono">
            Unpublished / In preparation
          </div>
        </button>
      </div>

      {/* Modern Filter Toolbar */}
      <Card variant="default" className="shadow-xs">
        <CardContent className="p-3.5 sm:p-4 flex flex-col lg:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="w-full lg:w-80 relative">
            <Input
              placeholder="Search title, category, or slug..."
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs sm:text-sm py-2 pr-8"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full lg:w-auto">
            {/* Access Tier Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono text-slate-400">Tier:</span>
              <select
                aria-label="Filter by Tier"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="rounded-lg border border-slate-300 dark:border-dark-750 bg-white dark:bg-dark-900 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-medium focus:ring-1 focus:ring-brand-500 focus:outline-none"
              >
                <option value="all">All Tiers ({stats.total})</option>
                <option value="pro">👑 Pro VIP Only ({stats.pro})</option>
                <option value="free">🎁 Free Only ({stats.free})</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono text-slate-400">Status:</span>
              <select
                aria-label="Filter by Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="rounded-lg border border-slate-300 dark:border-dark-750 bg-white dark:bg-dark-900 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-medium focus:ring-1 focus:ring-brand-500 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="published">Published ({stats.published})</option>
                <option value="draft">Drafts ({stats.drafts})</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono text-slate-400">Category:</span>
              <select
                aria-label="Filter by Category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-lg border border-slate-300 dark:border-dark-750 bg-white dark:bg-dark-900 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-medium focus:ring-1 focus:ring-brand-500 focus:outline-none"
              >
                <option value="All">All Categories</option>
                <option value="Full-Stack Development">Full-Stack Development</option>
                <option value="DSA">DSA</option>
                <option value="Backend Development">Backend Development</option>
                <option value="React">React</option>
                <option value="Python">Python</option>
              </select>
            </div>

            {/* Items Per Page */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono text-slate-400">Show:</span>
              <select
                aria-label="Items per page"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="rounded-lg border border-slate-300 dark:border-dark-750 bg-white dark:bg-dark-900 px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-mono focus:ring-1 focus:ring-brand-500 focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            {/* Reset Filters Button */}
            {isFiltered && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 transition-colors cursor-pointer"
                title="Reset all filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <ErrorState title="Error Loading Courses" message={error} onRetry={() => fetchCourses(1)} />
      )}

      {/* Redesigned Structured Course Table */}
      {!loading && !error && courses.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-dark-800 bg-white dark:bg-dark-900 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[1020px]">
              <thead className="bg-slate-50/90 dark:bg-dark-850/80 border-b border-slate-200/90 dark:border-dark-800 text-slate-500 font-mono">
                <tr>
                  <th className="px-4 py-3.5 font-semibold w-[360px]">Course Details</th>
                  <th className="px-4 py-3.5 font-semibold w-[180px]">Format & Content</th>
                  <th className="px-4 py-3.5 font-semibold w-[110px]">Learners</th>
                  <th className="px-4 py-3.5 font-semibold w-[190px]">Pricing & Access</th>
                  <th className="px-4 py-3.5 font-semibold w-[140px]">Visibility</th>
                  <th className="px-4 py-3.5 font-semibold text-right w-[180px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-800 text-slate-700 dark:text-slate-300">
                {courses.map((course) => {
                  const isFree = course.proPrice === 0 || course.isProAvailable === false;
                  const isStandalone = !isFree && (
                    course.isIncludedInMembership === false ||
                    (Array.isArray(course.includedInProPlans) && course.includedInProPlans.length === 0)
                  );

                  return (
                    <tr
                      key={course.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-dark-850/50 transition-colors group"
                    >
                      {/* 1. Course Details (Thumbnail + Title + Category + Slug) */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <CourseThumbnail
                            thumbnail={course.thumbnail}
                            title={course.title}
                            category={course.category}
                          />
                          <div className="min-w-0 pr-2">
                            <Link
                              to={`/admin/courses/${course.id}/edit`}
                              className="font-bold text-slate-900 dark:text-white text-sm hover:text-brand-600 dark:hover:text-brand-400 transition-colors line-clamp-1"
                              title={course.title}
                            >
                              {course.title}
                            </Link>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-1 flex items-center gap-2 flex-wrap">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold">
                                {course.category}
                              </span>
                              <span className="text-slate-300 dark:text-dark-700">•</span>
                              <code className="text-brand-600 dark:text-brand-400 text-[10px] truncate max-w-[140px]">
                                /{course.slug}
                              </code>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Format & Content (Level + Duration + Counts) */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-1">
                          <span
                            className={cn(
                              'inline-block px-2 py-0.5 rounded-md text-[10px] font-bold font-mono',
                              course.level === 'Beginner'
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                                : course.level === 'Intermediate'
                                ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20'
                                : course.level === 'Advanced'
                                ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20'
                                : 'bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-dark-700'
                            )}
                          >
                            {course.level}
                          </span>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{course.duration || 'Flexible'}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {course.modulesCount || 0} modules • {course.lessonsCount || 0} lessons
                          </div>
                        </div>
                      </td>

                      {/* 3. Learners / Enrollments */}
                      <td className="px-4 py-3.5">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-semibold border border-slate-200/80 dark:border-dark-700">
                          <Users className="w-3 h-3 text-slate-400" />
                          <span>{course.enrollmentsCount || 0}</span>
                        </div>
                      </td>

                      {/* 4. Pricing & Access Tier */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-1">
                          {isFree ? (
                            <>
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
                                <Gift className="w-3 h-3" /> 100% Free
                              </span>
                              <div className="text-[10px] text-slate-400 font-mono">
                                Public catalog
                              </div>
                            </>
                          ) : isStandalone ? (
                            <>
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold font-mono bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/25">
                                <Lock className="w-3 h-3 text-purple-500" /> ₹{course.proPrice?.toLocaleString('en-IN') || '1,999'}
                              </span>
                              <div className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1">
                                <span>Direct Only (Not in Pro One)</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold font-mono bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                                <Crown className="w-3 h-3 text-amber-500" /> ₹{course.proPrice?.toLocaleString('en-IN') || '1,999'}
                              </span>
                              <div className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-semibold">
                                Pro One:{' '}
                                {!course.includedInProPlans || course.includedInProPlans.length === 3
                                  ? 'All 3 Plans'
                                  : course.includedInProPlans
                                      .map((p) => (p === 'lifetime' ? '3Y' : p === 'yearly' ? '1Y' : '1M'))
                                      .join(', ')}
                              </div>
                            </>
                          )}
                        </div>
                      </td>

                      {/* 5. Visibility & Featured Status */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-1.5 items-start">
                          <button
                            type="button"
                            onClick={() => handleTogglePublish(course)}
                            className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold font-mono transition-all cursor-pointer',
                              course.isPublished
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20'
                                : 'bg-slate-100 dark:bg-dark-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-dark-700 hover:bg-slate-200'
                            )}
                            title="Click to toggle published / draft mode"
                          >
                            <span
                              className={cn(
                                'w-1.5 h-1.5 rounded-full',
                                course.isPublished ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                              )}
                            />
                            <span>{course.isPublished ? 'Published' : 'Draft'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleFeature(course)}
                            className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold font-mono transition-all cursor-pointer',
                              course.isFeatured
                                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25 hover:bg-amber-500/20'
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                            )}
                            title="Click to toggle homepage featured status"
                          >
                            <Sparkles
                              className={cn(
                                'w-3 h-3',
                                course.isFeatured ? 'text-amber-500 fill-amber-500' : 'text-slate-400'
                              )}
                            />
                            <span>{course.isFeatured ? 'Featured' : 'Standard'}</span>
                          </button>
                        </div>
                      </td>

                      {/* 6. Clean Actions Group (No truncation) */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <Link
                            to={`/admin/courses/${course.id}/curriculum`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 border border-brand-500/30 transition-colors whitespace-nowrap shadow-2xs shrink-0"
                            title="Manage Modules & Lessons"
                          >
                            <Layers className="w-3.5 h-3.5" />
                            <span>Curriculum</span>
                          </Link>

                          <Link
                            to={`/courses/${course.slug}`}
                            target="_blank"
                            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
                            title="Preview Public Course Page"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>

                          <Link
                            to={`/admin/courses/${course.id}/edit`}
                            className="p-1.5 text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
                            title="Edit Course Metadata"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            type="button"
                            onClick={() => {
                              setCourseToDelete(course);
                              setDeleteModalOpen(true);
                            }}
                            className="p-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer"
                            title="Delete Course"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Full Pagination Controls */}
          <div className="px-4 py-3.5 border-t border-slate-200 dark:border-dark-800 bg-slate-50/50 dark:bg-dark-850/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div className="font-mono">
              Showing <span className="font-bold text-slate-900 dark:text-white">{startItem}</span> to{' '}
              <span className="font-bold text-slate-900 dark:text-white">{endItem}</span> of{' '}
              <span className="font-bold text-slate-900 dark:text-white">{pagination.totalItems}</span> courses
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.currentPage <= 1}
                onClick={() => fetchCourses(pagination.currentPage - 1)}
                leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
              >
                Previous
              </Button>

              <span className="px-3 py-1 font-mono text-xs rounded-md bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 font-bold text-slate-700 dark:text-slate-300">
                Page {pagination.currentPage} of {Math.max(1, pagination.totalPages)}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={pagination.currentPage >= pagination.totalPages}
                onClick={() => fetchCourses(pagination.currentPage + 1)}
                rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && courses.length === 0 && (
        <EmptyState
          icon={<BookOpen className="w-6 h-6" />}
          title="No Courses Found"
          description={
            isFiltered
              ? 'No courses match your active filter criteria. Try resetting filters.'
              : 'Get started by creating your first curriculum track.'
          }
          actionLabel={isFiltered ? 'Reset All Filters' : 'Create Course'}
          onAction={() => {
            if (isFiltered) {
              resetFilters();
            } else {
              window.location.assign('/admin/courses/new');
            }
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Course"
        description="Are you sure you want to permanently delete this course?"
      >
        <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
          <p>
            Deleting <strong>{courseToDelete?.title}</strong> will permanently remove all associated modules, lessons, and enrollment records.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="bg-rose-600 hover:bg-rose-500"
              onClick={confirmDelete}
              isLoading={deleting}
            >
              Confirm Permanent Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
