import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { courseService } from '../../services/course.service';
import { ICourse, CoursePagination } from '../../types/course.types';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAuth } from '../../hooks/useAuth';
import {
  Search,
  Clock,
  BookOpen,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  Crown,
  Zap,
  Award,
  Sparkles,
  Gift,
  Code2,
  GraduationCap,
  Users,
  Play,
  Loader2,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { ROUTES } from '../../constants/routes';

export const CoursesPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const currentType = (searchParams.get('type') || 'all').toLowerCase(); // 'all' | 'free' | 'premium' | 'pro'

  const isFreeView = currentType === 'free';
  const isProView = currentType === 'premium' || currentType === 'pro';

  const isProMember = Boolean(
    user &&
    user.isPro &&
    user.subscription?.plan &&
    user.subscription?.status === 'active' &&
    (!user.subscription.endDate || new Date(user.subscription.endDate) > new Date())
  );

  const pageConfig = useMemo(() => {
    if (isFreeView) {
      return {
        badge: '🎁 100% Free Open Library',
        title: 'Free Programming Courses & Curriculums',
        description:
          'High-quality, self-paced coding curriculums and interactive modules. Zero fees, zero subscriptions — start coding immediately in your browser.',
        docTitle: 'Free Programming Courses & Tutorials — NextEra Coders',
        breadcrumbs: [{ label: 'Courses', href: '/courses' }, { label: 'Free Resources' }],
      };
    }
    if (isProView) {
      return {
        badge: '👑 NextEra Pro VIP Masterclasses & Tracks',
        title: 'Industry-Grade Pro Tracks & Accelerators',
        description:
          'Production-level full-stack, system design, AI, and DSA masterclasses with 1-on-1 mentor reviews, real capstones, and verified ISO certificates.',
        docTitle: 'Premium Pro Tracks & Career Cohorts — NextEra Coders',
        breadcrumbs: [{ label: 'Courses', href: '/courses' }, { label: 'Pro Tracks' }],
      };
    }
    return {
      badge: '🌟 Comprehensive Engineering Catalog',
      title: 'Programming Courses & Learning Tracks',
      description:
        'Explore database-driven, production-grade video courses and modules engineered for real-world software mastery.',
      docTitle: 'Programming Courses & Curriculums — NextEra Coders',
      breadcrumbs: [{ label: 'Courses' }],
    };
  }, [isFreeView, isProView]);

  useDocumentTitle(pageConfig.docTitle);

  const [courses, setCourses] = useState<ICourse[]>([]);
  const [pagination, setPagination] = useState<CoursePagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 12,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    'All',
    'Full-Stack Development',
    'DSA',
    'Backend Development',
    'React',
    'JavaScript',
    'Python',
    'Java',
  ];

  const fetchCourses = useCallback(
    async (page: number = 1, append: boolean = false) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }
        setError(null);
        const res = await courseService.getCourses({
          page,
          limit: 12,
          search: searchTerm.trim() || undefined,
          category: selectedCategory !== 'All' ? selectedCategory : undefined,
          level: selectedLevel !== 'All' ? selectedLevel : undefined,
          sort: sortBy,
          type: isFreeView ? 'free' : isProView ? 'premium' : undefined,
        });

        if (append) {
          setCourses((prev) => {
            const existingIds = new Set(prev.map((c) => c._id || (c as any).id));
            const newItems = res.courses.filter((c) => !existingIds.has(c._id || (c as any).id));
            return [...prev, ...newItems];
          });
        } else {
          setCourses(res.courses);
        }

        setPagination(res.pagination);
      } catch (err: any) {
        setError(err.message || 'Failed to load courses from server');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [searchTerm, selectedCategory, selectedLevel, sortBy, isFreeView, isProView]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCourses(1, false);
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchCourses]);

  const handleLoadMore = () => {
    if (pagination.currentPage < pagination.totalPages) {
      const nextPage = pagination.currentPage + 1;
      fetchCourses(nextPage, true);
    }
  };

  return (
    <div className="min-h-screen">
      {!isFreeView && !isProView && (
        <PageHeader
          badge={pageConfig.badge}
          title={pageConfig.title}
          description={pageConfig.description}
          breadcrumbs={pageConfig.breadcrumbs}
        />
      )}

      <div className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5 pb-20", (isFreeView || isProView) && "pt-4 sm:pt-5")}>
        
        {/* ========================================================================= */}
        {/* 1. COMPACT & HIGH-IMPACT FREE RESOURCES HERO CONTAINER                    */}
        {/* ========================================================================= */}
        {isFreeView && (
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-cyan-500/10 dark:from-dark-900/90 dark:via-emerald-950/30 dark:to-dark-900/90 border border-emerald-500/30 dark:border-emerald-500/25 shadow-lg shadow-emerald-500/5 p-4 sm:p-5 lg:p-6 backdrop-blur-xl transition-all">
            
            {/* Ambient Aurora Glow Orbs */}
            <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 rounded-full bg-emerald-400/15 dark:bg-emerald-500/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-64 h-64 rounded-full bg-cyan-500/15 dark:bg-cyan-600/10 blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-3.5">
              {/* Top Row: Breadcrumbs & Badge inline */}
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <nav className="flex items-center gap-1.5 text-xs font-mono text-slate-500 dark:text-slate-400">
                  <Link to={ROUTES.HOME} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                    Home
                  </Link>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                  <Link to={ROUTES.COURSES} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                    Courses
                  </Link>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                  <span className="text-emerald-700 dark:text-emerald-300 font-bold">Free Resources</span>
                </nav>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shadow-2xs">
                  <Gift className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>🎁 100% Free Open Library</span>
                </div>
              </div>

              {/* Title & Description Compact */}
              <div className="space-y-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Free Programming Courses & <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 bg-clip-text text-transparent">Curriculums</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                  High-quality, self-paced coding curriculums and interactive sandbox lessons. Zero fees, zero subscriptions — start coding immediately.
                </p>
              </div>

              {/* 4 Compact Feature Badges in 1 Streamlined Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 pt-3 border-t border-emerald-500/20 dark:border-white/10">
                {/* 1. Instant Access */}
                <div className="p-2.5 rounded-xl bg-white/75 dark:bg-dark-950/60 border border-slate-200/80 dark:border-white/10 hover:border-emerald-400/50 hover:bg-white dark:hover:bg-dark-850 transition-all flex items-center gap-2.5 shadow-2xs group">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform shrink-0">
                    <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      Instant 1-Click Access
                    </h4>
                    <p className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate">
                      Zero payment, start instantly
                    </p>
                  </div>
                </div>

                {/* 2. Code IDE */}
                <div className="p-2.5 rounded-xl bg-white/75 dark:bg-dark-950/60 border border-slate-200/80 dark:border-white/10 hover:border-cyan-400/50 hover:bg-white dark:hover:bg-dark-850 transition-all flex items-center gap-2.5 shadow-2xs group">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform shrink-0">
                    <Code2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                      In-Browser Code IDE
                    </h4>
                    <p className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate">
                      Python, JS, C++, & Java
                    </p>
                  </div>
                </div>

                {/* 3. Structured Curriculums */}
                <div className="p-2.5 rounded-xl bg-white/75 dark:bg-dark-950/60 border border-slate-200/80 dark:border-white/10 hover:border-indigo-400/50 hover:bg-white dark:hover:bg-dark-850 transition-all flex items-center gap-2.5 shadow-2xs group">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform shrink-0">
                    <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      Structured Curriculums
                    </h4>
                    <p className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate">
                      Beginner to advanced roadmaps
                    </p>
                  </div>
                </div>

                {/* 4. Skill Milestones */}
                <div className="p-2.5 rounded-xl bg-white/75 dark:bg-dark-950/60 border border-slate-200/80 dark:border-white/10 hover:border-amber-400/50 hover:bg-white dark:hover:bg-dark-850 transition-all flex items-center gap-2.5 shadow-2xs group">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform shrink-0">
                    <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      Skill Milestones
                    </h4>
                    <p className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate">
                      Streaks, quizzes & badges
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. COMPACT & HIGH-IMPACT PRO VIP HERO CONTAINER                           */}
        {/* ========================================================================= */}
        {isProView && (
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-yellow-500/10 dark:from-dark-900/95 dark:via-amber-950/40 dark:to-dark-900/95 border border-amber-500/35 dark:border-amber-500/30 shadow-xl shadow-amber-500/10 p-4 sm:p-5 lg:p-6 backdrop-blur-2xl transition-all">
            
            {/* Ambient Gold Glow Orbs */}
            <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 rounded-full bg-amber-500/20 dark:bg-amber-500/15 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-64 h-64 rounded-full bg-orange-500/15 dark:bg-orange-600/10 blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-3.5">
              {/* Top Row: Breadcrumbs & Badge inline */}
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <nav className="flex items-center gap-1.5 text-xs font-mono text-slate-500 dark:text-slate-400">
                  <Link to={ROUTES.HOME} className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                    Home
                  </Link>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                  <Link to={ROUTES.COURSES} className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                    Courses
                  </Link>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                  <span className="text-amber-700 dark:text-amber-300 font-bold">Pro Tracks</span>
                </nav>

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/35 shadow-2xs">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>FLAGSHIP PRO VIP PASS</span>
                </div>
              </div>

              {/* Title & Description & CTA Compact */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
                <div className="space-y-1 max-w-3xl">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    Industry-Grade Pro Tracks & <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-400 bg-clip-text text-transparent">Accelerators</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    Unlock every System Design, GenAI/LLM, Next.js 15, Spring Boot, and DSA cohort with 1-on-1 mentor reviews, resume critique, and verified ISO credentials.
                  </p>
                </div>

                <div className="shrink-0 w-full sm:w-auto">
                  {isProMember ? (
                    <Link
                      to={ROUTES.PRO_ONE}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-700 dark:text-amber-300 text-xs font-bold shadow-sm hover:scale-[1.02] active:scale-95 transition-all group"
                    >
                      <Sparkles className="w-4 h-4 text-amber-500 group-hover:rotate-12 transition-transform" />
                      <span>VIP Pass Active</span>
                      <ArrowRight className="w-3.5 h-3.5 text-amber-500 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  ) : (
                    <Link to={ROUTES.PRO_ONE} className="block w-full sm:w-auto">
                      <button className="w-full sm:w-auto relative group overflow-hidden px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 bg-[length:200%_auto] hover:bg-right text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer border-none">
                        <Sparkles className="w-4 h-4" />
                        <span>Get Pro VIP Pass</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </Link>
                  )}
                </div>
              </div>

              {/* 4 Interactive Feature Badges in 1 Streamlined Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 pt-3 border-t border-amber-500/20 dark:border-white/10">
                {/* 1. All Tracks Unlocked */}
                <div className="p-2.5 rounded-xl bg-white/75 dark:bg-dark-950/60 border border-slate-200/80 dark:border-white/10 hover:border-amber-400/60 hover:bg-white dark:hover:bg-dark-850 hover:-translate-y-0.5 transition-all flex items-center gap-2.5 shadow-2xs group cursor-default">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform shrink-0">
                    <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      All Tracks Unlocked
                    </h4>
                    <p className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate">
                      Access all current & future tracks
                    </p>
                  </div>
                </div>

                {/* 2. 1-on-1 Mentorship */}
                <div className="p-2.5 rounded-xl bg-white/75 dark:bg-dark-950/60 border border-slate-200/80 dark:border-white/10 hover:border-orange-400/60 hover:bg-white dark:hover:bg-dark-850 hover:-translate-y-0.5 transition-all flex items-center gap-2.5 shadow-2xs group cursor-default">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-orange-500/15 text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform shrink-0">
                    <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                      1-on-1 Mentorship
                    </h4>
                    <p className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate">
                      Doubt resolution & code critique
                    </p>
                  </div>
                </div>

                {/* 3. ISO Certificates */}
                <div className="p-2.5 rounded-xl bg-white/75 dark:bg-dark-950/60 border border-slate-200/80 dark:border-white/10 hover:border-yellow-400/60 hover:bg-white dark:hover:bg-dark-850 hover:-translate-y-0.5 transition-all flex items-center gap-2.5 shadow-2xs group cursor-default">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 group-hover:scale-110 transition-transform shrink-0">
                    <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">
                      ISO Certificates
                    </h4>
                    <p className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate">
                      Shareable LinkedIn & CV credentials
                    </p>
                  </div>
                </div>

                {/* 4. Placement Pool */}
                <div className="p-2.5 rounded-xl bg-white/75 dark:bg-dark-950/60 border border-slate-200/80 dark:border-white/10 hover:border-amber-400/60 hover:bg-white dark:hover:bg-dark-850 hover:-translate-y-0.5 transition-all flex items-center gap-2.5 shadow-2xs group cursor-default">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform shrink-0">
                    <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      Placement Pool
                    </h4>
                    <p className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate">
                      Direct referral pipeline to startups
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* FILTER, SEARCH & SORT CONTROLS                                            */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-dark-900 border border-slate-200/90 dark:border-dark-800 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                placeholder={
                  isProView
                    ? 'Search Pro VIP tracks (e.g. System Design, Next.js 15, AI, Spring Boot)...'
                    : isFreeView
                    ? 'Search free courses (e.g. JavaScript, HTML5, Python)...'
                    : 'Search all courses and learning paths...'
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 rounded-2xl bg-slate-50/50 dark:bg-dark-950/50"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select
                aria-label="Filter by level"
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="h-11 px-3.5 text-xs font-semibold rounded-2xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
              >
                <option value="All">All Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>

              <select
                aria-label="Sort courses by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-11 px-3.5 text-xs font-semibold rounded-2xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest</option>
                <option value="title">Alphabetical (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase font-mono mr-1 shrink-0">
              Category:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer',
                  selectedCategory === cat
                    ? 'bg-brand-600 text-white shadow-xs font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-700 text-slate-600 dark:text-slate-300'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. COURSE LIST GRID */}
        {/* ========================================================================= */}
        {loading && courses.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="p-5 rounded-3xl border border-slate-200 dark:border-dark-800 bg-white dark:bg-dark-900 space-y-4 animate-pulse"
              >
                <Skeleton className="h-44 w-full rounded-2xl" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-dark-800">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-24 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Unable to load catalog"
            message={error}
            onRetry={() => fetchCourses(1, false)}
          />
        ) : courses.length === 0 ? (
          <EmptyState
            title="No courses found"
            description="We could not find any courses matching your criteria. Try resetting the search or filters."
            actionLabel="Reset Filters"
            onAction={() => {
              setSearchTerm('');
              setSelectedCategory('All');
              setSelectedLevel('All');
            }}
          />
        ) : (
          <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course: any) => {
                const is100PercentFree = Boolean(course.proPrice === 0 || course.isProAvailable === false);
                const isProCourse = !is100PercentFree;
                const isStandalonePro = Boolean(
                  isProCourse && (course.isIncludedInMembership === false || (Array.isArray(course.includedInProPlans) && course.includedInProPlans.length === 0))
                );
                const isIncludedInProOne = Boolean(isProCourse && !isStandalonePro);

                const courseProPlans: ('monthly' | 'yearly' | 'lifetime')[] = Array.isArray(course.includedInProPlans)
                  ? course.includedInProPlans
                  : (course.isIncludedInMembership !== false ? ['monthly', 'yearly', 'lifetime'] : []);
                const isPlanMatching = Boolean(user?.subscription?.plan && courseProPlans.includes(user.subscription.plan as any));
                const hasMembershipAccess = Boolean(isProMember && isIncludedInProOne && isPlanMatching);
                const isDirectEnrolled = Boolean(course.isEnrolled && (course.enrollmentTier === 'pro' || is100PercentFree));
                const isStaff = user?.role === 'admin' || user?.role === 'sub_admin';
                const isUnlocked = Boolean(
                  is100PercentFree ||
                  isStaff ||
                  isDirectEnrolled ||
                  hasMembershipAccess
                );
                const courseUrl = (user && isUnlocked) ? `/courses/${course.slug}/learn` : `/courses/${course.slug}`;

                return (
                  <Card
                    key={course.id || course._id}
                    className="group flex flex-col justify-between rounded-3xl border border-slate-200/90 dark:border-dark-800/90 bg-white dark:bg-dark-900 shadow-sm hover:shadow-xl hover:border-brand-500/50 dark:hover:border-brand-500/40 transition-all duration-300 overflow-hidden"
                  >
                    <div>
                      {/* Course Cover Banner (16:9 YouTube Aspect Ratio) */}
                      <Link to={courseUrl} className="block relative overflow-hidden aspect-video w-full bg-slate-900 group">
                        {course.thumbnail ? (
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-850 to-brand-950 flex items-center justify-center">
                            {/* Ambient Glow */}
                            <div
                              className={cn(
                                'absolute -right-10 -bottom-10 w-36 h-36 rounded-full blur-2xl opacity-30',
                                isStandalonePro ? 'bg-purple-500' : isProCourse ? 'bg-amber-500' : 'bg-emerald-500'
                              )}
                            />
                            <div className="text-white/10 font-black text-3xl font-mono select-none tracking-wider">
                              {course.category}
                            </div>
                          </div>
                        )}

                        {/* Top & Bottom Vignette Overlays for Crisp Badge Readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-black/50 pointer-events-none" />

                        {/* Badges Container */}
                        <div className="absolute inset-0 p-3.5 flex flex-col justify-between text-white z-10 pointer-events-none">
                          {/* Top Badges */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-black/60 backdrop-blur-md text-white border border-white/15 shadow-sm">
                              {course.category}
                            </span>
                            
                            {is100PercentFree ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md flex items-center gap-1">
                                <Gift className="w-3 h-3" />
                                100% FREE
                              </span>
                            ) : isIncludedInProOne ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md flex items-center gap-1">
                                <Crown className="w-3 h-3" />
                                PRO VIP
                              </span>
                            ) : null}
                          </div>

                          {/* Bottom Badges */}
                          <div className="flex items-center justify-between text-xs">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-black/70 backdrop-blur-md text-slate-200 border border-white/10">
                              {course.level}
                            </span>
                            <div className="flex items-center gap-1 text-[11px] font-medium text-slate-200 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10">
                              <Clock className="w-3 h-3 text-brand-400" />
                              <span>{course.duration || '20+ Hours'}</span>
                            </div>
                          </div>
                        </div>
                      </Link>

                      {/* Course Content */}
                      <CardHeader className="p-5 pb-3">
                        <Link to={courseUrl} className="group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                          <CardTitle className="text-base font-extrabold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                            {course.title}
                          </CardTitle>
                        </Link>
                        <CardDescription className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                          {course.shortDescription || course.description}
                        </CardDescription>
                      </CardHeader>

                      {/* Instructor Info */}
                      <div className="px-5 py-2 flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 font-bold text-xs flex items-center justify-center ring-1 ring-brand-500/20">
                          {course.instructor?.name?.charAt(0) || 'E'}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {course.instructor?.name || 'Staff Educator'}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {course.instructor?.role || 'Senior Architect'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer & Pricing CTA */}
                    <div className="p-5 pt-3 border-t border-slate-100 dark:border-dark-800/80 flex items-center justify-between gap-3">
                      <div>
                        {is100PercentFree ? (
                          <div>
                            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                              Free Access
                            </span>
                            <span className="block text-[10px] text-slate-400">
                              No Credit Card
                            </span>
                          </div>
                        ) : isStandalonePro ? (
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-base font-black text-slate-900 dark:text-white">
                                ₹{course.proPrice?.toLocaleString('en-IN') || '1,999'}
                              </span>
                              {course.originalPrice && course.originalPrice > (course.proPrice || 0) && (
                                <span className="text-[11px] text-slate-400 line-through">
                                  ₹{course.originalPrice.toLocaleString('en-IN')}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-base font-black text-slate-900 dark:text-white">
                                ₹{course.proPrice?.toLocaleString('en-IN') || '1,999'}
                              </span>
                              {course.originalPrice && course.originalPrice > (course.proPrice || 0) && (
                                <span className="text-[11px] text-slate-400 line-through">
                                  ₹{course.originalPrice.toLocaleString('en-IN')}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                              <Crown className="w-2.5 h-2.5" />
                              Included in Pro VIP
                            </span>
                          </div>
                        )}
                      </div>

                      <Link to={courseUrl} className="shrink-0">
                        {isUnlocked ? (
                          <div className={cn(
                            "relative group/btn inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-extrabold text-xs shadow-md hover:scale-[1.03] active:scale-95 transition-all duration-200",
                            is100PercentFree
                              ? "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/20"
                              : "bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-amber-500/20"
                          )}>
                            <Play className={cn("w-3 h-3", is100PercentFree ? "fill-white text-white" : "fill-slate-950 text-slate-950")} />
                            <span>Start Learning</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                          </div>
                        ) : isStandalonePro ? (
                          <div className="relative group/btn inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-xs shadow-md shadow-brand-500/20 hover:shadow-lg hover:scale-[1.03] active:scale-95 transition-all duration-200">
                            <span>Enroll Now</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                          </div>
                        ) : isProCourse ? (
                          <div className="relative group/btn inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 hover:scale-[1.03] active:scale-95 transition-all duration-200">
                            <Crown className="w-3.5 h-3.5 text-slate-950" />
                            <span>Unlock VIP</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                          </div>
                        ) : (
                          <div className="relative group/btn inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white dark:bg-dark-850 hover:bg-slate-50 dark:hover:bg-dark-800 text-slate-900 dark:text-white font-bold text-xs border border-slate-300 dark:border-white/15 shadow-2xs hover:border-brand-500/50 hover:scale-[1.03] active:scale-95 transition-all duration-200">
                            <span>Start Free</span>
                            <ArrowRight className="w-3.5 h-3.5 text-brand-500 group-hover/btn:translate-x-0.5 transition-transform" />
                          </div>
                        )}
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* ========================================================================= */}
            {/* 5. INTERACTIVE SEE MORE COURSES CTA                                       */}
            {/* ========================================================================= */}
            <div className="pt-8 border-t border-slate-200/80 dark:border-dark-800 flex flex-col items-center justify-center">
              {pagination.currentPage < pagination.totalPages ? (
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className={cn(
                    "relative group overflow-hidden px-8 py-3.5 rounded-2xl font-black text-xs sm:text-sm transition-all duration-300 shadow-md flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed border-none",
                    isProView
                      ? "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 bg-[length:200%_auto] hover:bg-right text-slate-950 shadow-amber-500/20 hover:shadow-amber-500/35 hover:scale-[1.02] active:scale-95"
                      : isFreeView
                      ? "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/20 hover:shadow-emerald-600/35 hover:scale-[1.02] active:scale-95"
                      : "bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-500 hover:from-brand-500 hover:to-indigo-500 text-white shadow-brand-500/20 hover:shadow-brand-500/35 hover:scale-[1.02] active:scale-95"
                  )}
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-current" />
                      <span>Loading More Courses...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>
                        See More {isProView ? 'Pro Tracks' : isFreeView ? 'Free Courses' : 'Courses'}
                      </span>
                      <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                    </>
                  )}
                </button>
              ) : (
                courses.length > 0 && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono font-medium text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-dark-800/80 border border-slate-200/80 dark:border-dark-700/80">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>You've explored all {isProView ? 'Pro tracks' : isFreeView ? 'free courses' : 'courses'}</span>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
