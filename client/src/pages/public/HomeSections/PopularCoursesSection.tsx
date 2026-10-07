import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { Section } from '../../../components/ui/Section';
import { SectionHeading } from '../../../components/ui/SectionHeading';
import { CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { courseService } from '../../../services/course.service';
import { ICourse } from '../../../types/course.types';
import { useAuth } from '../../../hooks/useAuth';
import { Clock, ArrowRight, Crown } from 'lucide-react';

export const PopularCoursesSection: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<ICourse[]>([]);
  const [loading, setLoading] = useState(true);

  const isProMember = Boolean(
    user &&
    user.isPro &&
    user.subscription?.plan &&
    user.subscription?.status === 'active' &&
    (!user.subscription.endDate || new Date(user.subscription.endDate) > new Date())
  );

  useEffect(() => {
    const fetchPopularCourses = async () => {
      try {
        setLoading(true);
        const res = await courseService.getCourses({ limit: 12, sort: 'newest' });
        // Prioritize featured courses first, followed by newest
        const sorted = (res.courses || []).sort((a, b) => {
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          return 0;
        });
        setCourses(sorted);
      } catch (err) {
        console.error('Failed to load homepage courses', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPopularCourses();
  }, []);

  return (
    <Section
      variant="default"
      className="pt-12 sm:pt-14 pb-8 sm:pb-10 relative z-20 bg-slate-100/90 dark:bg-[#070b14] border-t border-slate-200/90 dark:border-dark-800 shadow-[0_-20px_40px_rgba(0,0,0,0.03)] dark:shadow-[0_-25px_60px_rgba(0,0,0,0.6)]"
    >
      {/* Top Laser Accent Horizon Line */}
      <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-500/40 via-cyan-500/40 to-transparent pointer-events-none" />

      <SectionHeading
        title="Master In-Demand Technologies"
        subtitle="Structured, hands-on courses built by industry engineers to help you build real-world products and crack top tech roles."
        highlightText="In-Demand Technologies"
        className="mb-6 sm:mb-8"
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mt-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="p-4 rounded-2xl border border-slate-200 dark:border-dark-800 bg-white dark:bg-dark-900 space-y-3">
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3.5 w-full" />
              <div className="pt-2 flex justify-between">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : courses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-6">
          {courses.slice(0, 8).map((course) => {
            const is100PercentFree = (course.proPrice === 0 || course.isProAvailable === false);
            const courseProPlans = Array.isArray(course.includedInProPlans)
              ? course.includedInProPlans
              : (course.isIncludedInMembership !== false ? ['monthly', 'yearly', 'lifetime'] : []);
            const isPlanMatching = Boolean(user?.subscription?.plan && courseProPlans.includes(user.subscription.plan as any));
            const isStaff = user?.role === 'admin' || user?.role === 'sub_admin';
            const isUnlocked = Boolean(
              is100PercentFree ||
              isStaff ||
              (course.isEnrolled && course.enrollmentTier === 'pro') ||
              (isProMember && course.isIncludedInMembership !== false && isPlanMatching)
            );
            const courseUrl = (user && isUnlocked) ? `/courses/${course.slug}/learn` : `/courses/${course.slug}`;

            return (
              <div
                key={course.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 dark:border-dark-800 bg-white dark:bg-dark-900 shadow-sm hover:shadow-2xl hover:shadow-brand-500/10 dark:hover:shadow-brand-500/15 hover:border-brand-400/60 dark:hover:border-brand-500/60 transition-all duration-300 transform hover:-translate-y-2"
              >
                {/* Glowing subtle top accent on hover */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-500 via-amber-400 to-brand-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20" />

                <Link to={courseUrl} className="block">
                  <div className="h-32 bg-gradient-to-br from-slate-800 to-dark-950 p-3.5 flex flex-col justify-between relative overflow-hidden text-white">
                    <div className="flex items-center justify-between relative z-10">
                      <Badge variant="default" className="bg-brand-600/90 text-white border-none text-[11px] font-semibold px-2 py-0.5 shadow-xs">
                        {course.category}
                      </Badge>
                      {is100PercentFree ? (
                        <span className="text-[9px] font-mono font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-700/80 px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-sm shadow-xs">
                          FREE
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono font-bold bg-amber-950/90 text-amber-300 border border-amber-700/80 px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-sm shadow-xs">
                          <Crown className="w-2.5 h-2.5 text-amber-400" /> PRO
                        </span>
                      )}
                    </div>
                    <div className="relative z-10">
                      <span className="text-[11px] text-slate-300 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400 group-hover:text-brand-400 transition-colors" /> {course.duration} • {course.lessonsCount || 0} Lessons
                      </span>
                    </div>
                    {/* Animated hover gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-900/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-300 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>
                  </div>

                  <CardHeader className="p-3.5">
                    <CardTitle className="text-sm font-bold line-clamp-1 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors duration-200">
                      {course.title}
                    </CardTitle>
                    <CardDescription className="text-[11px] line-clamp-2 mt-0.5 text-slate-500 dark:text-slate-400">
                      {course.shortDescription || course.description}
                    </CardDescription>
                  </CardHeader>
                </Link>

                <CardContent className="p-3.5 pt-0 space-y-3">
                  {is100PercentFree ? (
                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-1.5 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          Free
                        </span>
                        <span className="text-[10px] text-slate-400 line-through font-mono">₹{course.originalPrice || 9999}</span>
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono text-xs">
                          ₹0
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-emerald-500 font-bold px-1.5 py-0.2 rounded bg-emerald-500/10">
                        FREE
                      </span>
                    </div>
                  ) : isUnlocked ? (
                    <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-1 text-xs">
                      <span className="font-bold text-amber-500 flex items-center gap-1 text-[10px] font-mono">
                        <Crown className="w-3 h-3 text-amber-400" /> PRO PASS
                      </span>
                      <span className="text-[9px] font-mono text-emerald-500 font-bold px-1.5 py-0.2 rounded bg-emerald-500/10">
                        UNLOCKED
                      </span>
                    </div>
                  ) : (
                    /* NEC Pro Course Pricing (No Free ₹0 on Pro courses) */
                    <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-1.5 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                          Pro
                        </span>
                        {course.originalPrice && course.originalPrice > (course.proPrice || 1999) && (
                          <span className="text-[10px] text-slate-400 line-through font-mono">
                            ₹{course.originalPrice.toLocaleString('en-IN')}
                          </span>
                        )}
                        <span className="font-extrabold text-amber-600 dark:text-amber-400 font-mono text-xs">
                          ₹{(course.proPrice || 1999).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-amber-600 dark:text-amber-400 font-bold px-1.5 py-0.2 rounded bg-amber-500/15 border border-amber-500/20 flex items-center gap-0.5">
                        <Crown className="w-2.5 h-2.5" /> PRO
                      </span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 dark:border-dark-800 flex items-center justify-between text-xs gap-1">
                    <div className="truncate pr-1">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 text-[11px] truncate">
                        {course.instructor?.name || 'Instructor'}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {course.modulesCount || 0} Modules
                      </p>
                    </div>

                    <Link to={courseUrl} className="shrink-0">
                      <Button
                        variant="primary"
                        size="sm"
                        className={
                          is100PercentFree
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] px-2.5 py-1 h-auto shadow-xs group/btn'
                            : isUnlocked
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-[11px] px-2.5 py-1 h-auto shadow-xs group/btn'
                            : 'text-[11px] px-2.5 py-1 h-auto font-semibold group/btn'
                        }
                        rightIcon={<ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />}
                      >
                        {is100PercentFree ? 'Start Free' : isUnlocked ? 'Learn' : 'View'}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="text-center mt-8 sm:mt-10">
        <Link to={ROUTES.COURSES}>
          <Button
            variant="primary"
            size="sm"
            className="sm:text-sm text-xs px-4 sm:px-6 py-2 sm:py-2.5 font-bold shadow-md shadow-brand-500/20"
            rightIcon={<ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          >
            <span className="hidden sm:inline">Browse All Programming Courses</span>
            <span className="sm:hidden">Browse All Courses</span>
          </Button>
        </Link>
      </div>
    </Section>
  );
};
