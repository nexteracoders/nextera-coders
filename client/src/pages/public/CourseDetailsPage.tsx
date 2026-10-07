import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../components/ui/Toast';
import { courseService } from '../../services/course.service';
import { ICourse } from '../../types/course.types';
import { ROUTES } from '../../constants/routes';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { CoursePaymentModal } from '../../components/course/CoursePaymentModal';
import { MembershipBadge } from '../../components/common/MembershipBadge';
import {
  Clock,
  BookOpen,
  CheckCircle2,
  PlayCircle,
  Lock,
  ChevronDown,
  ArrowRight,
  User,
  Sparkles,
  Zap,
  ShieldCheck,
  Video,
  Award,
  Crown,
  Code2,
  Users,
  Infinity as InfinityIcon,
  FileCode,
} from 'lucide-react';
import { cn } from '../../utils/cn';

export const CourseDetailsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated, user } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [course, setCourse] = useState<ICourse | null>(null);
  const [relatedCourses, setRelatedCourses] = useState<ICourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [openModuleIds, setOpenModuleIds] = useState<string[]>([]);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  useDocumentTitle(course ? course.title : 'Course Details');

  const fetchCourseDetails = async () => {
    if (!slug) return;
    try {
      setLoading(true);
      setError(null);
      const data = await courseService.getCourseBySlug(slug);
      setCourse(data);
      if (data.curriculum && data.curriculum.length > 0) {
        setOpenModuleIds([data.curriculum[0].id]);
      }

      // Fetch related Pro VIP courses
      try {
        const res = await courseService.getCourses({ limit: 4, type: 'premium' });
        if (res && res.courses) {
          setRelatedCourses(res.courses.filter((c: ICourse) => c.slug !== slug).slice(0, 3));
        }
      } catch {
        // Silently ignore related courses loading error
      }
    } catch (err: any) {
      setError(err.message || 'Course not found or unavailable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseDetails();
  }, [slug]);

  const toggleModule = (modId: string) => {
    setOpenModuleIds((prev) =>
      prev.includes(modId) ? prev.filter((id) => id !== modId) : [...prev, modId]
    );
  };

  const handleEnrollFree = async () => {
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN, { state: { from: location } });
      return;
    }

    if (!course) return;

    try {
      setEnrolling(true);
      await courseService.enrollCourse(course.id, { tier: 'free' });
      success(`Successfully enrolled in ${course.title} (Free Track)!`, 'Enrollment Confirmed');
      setCourse({ ...course, isEnrolled: true, enrollmentTier: 'free' });
    } catch (err: any) {
      toastError(err.message || 'Enrollment failed');
    } finally {
      setEnrolling(false);
    }
  };

  const handleOpenProPayment = () => {
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN, { state: { from: location } });
      return;
    }
    setPaymentModalOpen(true);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <Skeleton className="h-64 w-full rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20">
        <ErrorState
          title="Course Unavailable"
          message={error || 'The requested course does not exist or is currently in draft.'}
          onRetry={fetchCourseDetails}
        />
        <div className="text-center mt-6">
          <Link to={ROUTES.COURSES}>
            <Button variant="outline" size="sm">
              Back to Course Catalog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const originalPrice = course.originalPrice || 9999;
  const proPrice = course.proPrice || 1999;
  const is100PercentFreeCourse = course.proPrice === 0 || course.isProAvailable === false;
  const isProCourse = !is100PercentFreeCourse;
  const isProMembershipUser = Boolean(
    user &&
    user.isPro &&
    user.subscription?.plan &&
    user.subscription?.status === 'active' &&
    (!user.subscription.endDate || new Date(user.subscription.endDate) > new Date())
  );
  const isCourseIncludedInMembership = course.isIncludedInMembership !== false;
  const courseProPlans = Array.isArray(course.includedInProPlans)
    ? course.includedInProPlans
    : (isCourseIncludedInMembership ? ['monthly', 'yearly', 'lifetime'] : []);
  const isPlanMatching = Boolean(user?.subscription?.plan && courseProPlans.includes(user.subscription.plan));
  const hasMembershipAccess = isProMembershipUser && isCourseIncludedInMembership && isPlanMatching;

  const isStaff = user?.role === 'admin' || user?.role === 'sub_admin';
  const isPro = Boolean(
    is100PercentFreeCourse ||
    isStaff ||
    (course.isEnrolled && course.enrollmentTier === 'pro') ||
    hasMembershipAccess
  );
  const isFreeEnrolled = course.isEnrolled && course.enrollmentTier !== 'pro' && !isPro;

  return (
    <div className="space-y-10 pb-20">
      {/* Course Hero Banner */}
      <div className="bg-slate-900 text-white border-b border-slate-800 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="info">{course.category}</Badge>
                <Badge variant="outline" className="border-slate-700 text-slate-300">
                  {course.level}
                </Badge>
                {course.isFeatured && <Badge variant="warning">Featured Track</Badge>}
                {is100PercentFreeCourse ? (
                  <Badge variant="success" className="bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono flex items-center gap-1">
                    🎁 100% FREE COURSE
                  </Badge>
                ) : (!isCourseIncludedInMembership || courseProPlans.length === 0) ? (
                  <Badge variant="warning" className="bg-purple-950/90 text-purple-300 border border-purple-700 font-mono flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-purple-400" /> Standalone Track (Separate Purchase)
                  </Badge>
                ) : (
                  <Badge variant="warning" className="bg-amber-950/90 text-amber-300 border border-amber-700/80 font-mono flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-400" /> In Pro One ({courseProPlans.map((p) => p === 'lifetime' ? '3Y' : p === 'yearly' ? '1Y' : '1M').join(', ')})
                  </Badge>
                )}
                {isProCourse && (
                  isPro ? (
                    isProMembershipUser ? (
                      <MembershipBadge size="sm" />
                    ) : (
                      <Badge variant="warning" className="bg-amber-950 text-amber-300 border border-amber-800 font-mono flex items-center gap-1">
                        <Crown className="w-3 h-3 text-amber-400" /> PRO UNLOCKED
                      </Badge>
                    )
                  ) : (
                    <Badge variant="warning" className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/40 font-mono flex items-center gap-1.5 px-3 py-1">
                      <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> PRO VIP MASTERCLASS
                    </Badge>
                  )
                )}
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                {course.title}
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl">
                {course.shortDescription}
              </p>

              <div className="flex flex-wrap items-center gap-6 pt-2 text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1.5 text-slate-200">
                  <User className="w-4 h-4 text-brand-400" /> Instructor: {course.instructor?.name}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-400" /> {course.duration}
                </span>
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-slate-400" /> {course.totalLessons || 0} Lessons (
                  {course.totalModules || 0} Modules)
                </span>
              </div>
            </div>

            {/* Quick Action Card on Desktop */}
            <div className="lg:col-span-4 w-full">
              <Card variant="elevated" className="bg-slate-850 border-slate-700 text-white shadow-2xl p-2">
                <CardContent className="p-5 space-y-4">
                  {isPro ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-3">
                        <Crown className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-amber-400 text-sm block">
                            {isProMembershipUser ? 'Included in Pro Membership 👑' : 'NEC Pro Access Active ⭐'}
                          </span>
                          <span className="text-xs text-slate-300 mt-1 block">
                            You have full unlimited access to this course, all HD video lectures, source codes, and certificates.
                          </span>
                        </div>
                      </div>

                      <Link to={user ? `/courses/${course.slug}/learn` : `/login?redirect=/courses/${course.slug}/learn`}>
                        <Button
                          variant="primary"
                          size="lg"
                          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold shadow-lg"
                          rightIcon={<PlayCircle className="w-4 h-4" />}
                        >
                          Start Learning Now (Pro Unlocked)
                        </Button>
                      </Link>
                    </div>
                  ) : isProCourse ? (
                    /* Dedicated Pro VIP Quick Card (No Free tab shown for Pro courses) */
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-mono font-extrabold uppercase border border-amber-400/30 flex items-center gap-1">
                          <Crown className="w-3 h-3 text-amber-400" /> Pro VIP Track
                        </span>
                        <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                          Save {Math.round(((originalPrice - proPrice) / originalPrice) * 100)}%
                        </span>
                      </div>

                      {(!isCourseIncludedInMembership || courseProPlans.length === 0) ? (
                        <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-800/80 text-[11px] text-purple-200 space-y-1">
                          <div className="font-bold flex items-center gap-1.5 text-purple-300">
                            <Sparkles className="w-3.5 h-3.5" /> Standalone Specialized Course
                          </div>
                          <p className="text-[10px] text-purple-300/80 leading-relaxed">
                            {isProMembershipUser
                              ? 'This premium masterclass is sold separately and is not included in any Pro One plan. Unlock it individually below.'
                              : 'Sold individually — not included in Pro One membership. Unlock lifetime access below.'}
                          </p>
                        </div>
                      ) : isProMembershipUser && !isPlanMatching ? (
                        <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-800/80 text-[11px] text-amber-200 space-y-1">
                          <div className="font-bold flex items-center gap-1.5 text-amber-300">
                            <Crown className="w-3.5 h-3.5" /> Plan Upgrade or Separate Purchase Required
                          </div>
                          <p className="text-[10px] text-amber-300/80 leading-relaxed">
                            Included in Pro One ({courseProPlans.map((p) => p === 'lifetime' ? '3 Years' : p === 'yearly' ? '1 Year' : '1 Month').join(', ')}). Your current plan ({user?.subscription?.plan === 'monthly' ? '1 Month' : user?.subscription?.plan === 'yearly' ? '1 Year' : '3 Years'}) does not cover this course. You can upgrade your plan or purchase it individually below.
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-[11px] text-slate-300 space-y-1">
                          <div className="font-bold flex items-center gap-1.5 text-amber-400">
                            <Crown className="w-3.5 h-3.5" /> Included with Pro One ({courseProPlans.map((p) => p === 'lifetime' ? '3 Years' : p === 'yearly' ? '1 Year' : '1 Month').join(', ')})
                          </div>
                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            Get this course and all tracks with a Pro One membership pass, or unlock it individually below.
                          </p>
                        </div>
                      )}

                      <div className="space-y-1 text-center py-2">
                        <div className="text-xs text-slate-400 font-mono line-through">
                          ₹{originalPrice.toLocaleString('en-IN')}
                        </div>
                        <div className="text-3xl font-extrabold text-white font-mono flex items-center justify-center gap-2">
                          <span>₹{proPrice.toLocaleString('en-IN')}</span>
                        </div>
                        <p className="text-[11px] text-amber-300/90 font-medium">
                          🎬 HD Video Lectures + Mentor Support + Certificate
                        </p>
                      </div>

                      <Button
                        variant="primary"
                        size="lg"
                        className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black shadow-lg shadow-amber-500/25"
                        onClick={handleOpenProPayment}
                        rightIcon={<Sparkles className="w-4 h-4 text-slate-950" />}
                      >
                        {isAuthenticated ? `Unlock NEC Pro (₹${proPrice.toLocaleString('en-IN')})` : 'Sign In to Get Pro'}
                      </Button>

                      <div className="pt-2 border-t border-slate-750 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-mono">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Instant access • Lifetime curriculum guarantee</span>
                      </div>
                    </div>
                  ) : (
                    /* 100% Free Course Quick Card */
                    <div className="space-y-4">
                      <div className="space-y-1 text-center py-2">
                        <div className="text-3xl font-extrabold text-emerald-400 font-mono flex items-center justify-center gap-2">
                          <span>FREE</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-normal border border-emerald-800">
                            ₹0 Forever
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Full curriculum, browser compiler & quizzes
                        </p>
                      </div>

                      <Button
                        variant="primary"
                        size="lg"
                        className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold"
                        onClick={handleEnrollFree}
                        isLoading={enrolling}
                        rightIcon={<ArrowRight className="w-4 h-4" />}
                      >
                        {isAuthenticated ? 'Start Free Curriculum' : 'Sign In & Start Free'}
                      </Button>

                      <div className="pt-2 border-t border-slate-750 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-mono">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Instant access • 100% Free Forever</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* ========================================================================= */}
        {/* 1. TOP PRO VIP COURSE FEATURES CONTAINER (Moderate Height, High Aesthetic) */}
        {/* ========================================================================= */}
        {isProCourse && (
          <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-amber-500/30 text-white shadow-2xl p-5 sm:p-7 overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-5">
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-750">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-mono font-extrabold uppercase flex items-center gap-1.5 shadow-xs">
                      <Crown className="w-3.5 h-3.5 fill-slate-950" /> NextEra Pro VIP Privileges
                    </span>
                    <span className="text-xs font-mono text-amber-300 font-semibold bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                      ⚡ Premium Cohort Features
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                    Everything Included with this Pro VIP Masterclass
                  </h2>
                </div>

                {!isPro && (
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block font-mono">
                      <div className="text-[11px] text-slate-400 line-through">₹{originalPrice.toLocaleString('en-IN')}</div>
                      <div className="text-lg font-black text-amber-400">₹{proPrice.toLocaleString('en-IN')}</div>
                    </div>
                    <Button
                      variant="primary"
                      size="md"
                      className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold shadow-lg shadow-amber-500/20 text-xs sm:text-sm px-5"
                      onClick={handleOpenProPayment}
                      rightIcon={<Sparkles className="w-4 h-4 text-slate-950" />}
                    >
                      {isAuthenticated ? `Unlock NEC Pro (₹${proPrice.toLocaleString('en-IN')})` : `Unlock NEC Pro (₹${proPrice})`}
                    </Button>
                  </div>
                )}
              </div>

              {/* 6 Feature Perks (Compact, balanced height) */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                {/* 1. HD Video Lectures */}
                <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-750 hover:border-amber-500/50 hover:bg-slate-800 transition-all space-y-2 group">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Video className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                      HD Video Lectures
                    </h4>
                    <p className="text-[10.5px] text-slate-400 leading-tight mt-0.5">
                      Comprehensive step-by-step 4K video modules
                    </p>
                  </div>
                </div>

                {/* 2. ISO Certificate */}
                <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-750 hover:border-yellow-500/50 hover:bg-slate-800 transition-all space-y-2 group">
                  <div className="w-8 h-8 rounded-xl bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-yellow-300 transition-colors">
                      ISO Verified Cert
                    </h4>
                    <p className="text-[10.5px] text-slate-400 leading-tight mt-0.5">
                      Shareable LinkedIn & CV career credential
                    </p>
                  </div>
                </div>

                {/* 3. 1-on-1 Mentorship */}
                <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-750 hover:border-orange-500/50 hover:bg-slate-800 transition-all space-y-2 group">
                  <div className="w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-orange-300 transition-colors">
                      1-on-1 Mentor Doubt
                    </h4>
                    <p className="text-[10.5px] text-slate-400 leading-tight mt-0.5">
                      Priority doubt resolution & code review
                    </p>
                  </div>
                </div>

                {/* 4. Production Source Code */}
                <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-750 hover:border-blue-500/50 hover:bg-slate-800 transition-all space-y-2 group">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                      Source Code & Repos
                    </h4>
                    <p className="text-[10.5px] text-slate-400 leading-tight mt-0.5">
                      Complete production Git repositories
                    </p>
                  </div>
                </div>

                {/* 5. In-Browser Cloud Compiler */}
                <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-750 hover:border-emerald-500/50 hover:bg-slate-800 transition-all space-y-2 group">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Code2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                      Cloud Compiler
                    </h4>
                    <p className="text-[10.5px] text-slate-400 leading-tight mt-0.5">
                      Zero-setup interactive coding playground
                    </p>
                  </div>
                </div>

                {/* 6. Lifetime Access */}
                <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-750 hover:border-purple-500/50 hover:bg-slate-800 transition-all space-y-2 group">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <InfinityIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                      Lifetime Access
                    </h4>
                    <p className="text-[10.5px] text-slate-400 leading-tight mt-0.5">
                      Unrestricted access & free future updates
                    </p>
                  </div>
                </div>
              </div>

              {/* Mobile CTA */}
              {!isPro && (
                <div className="pt-2 sm:hidden">
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold shadow-lg"
                    onClick={handleOpenProPayment}
                    rightIcon={<Sparkles className="w-4 h-4 text-slate-950" />}
                  >
                    Unlock NEC Pro (₹{proPrice.toLocaleString('en-IN')})
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. ENROLLMENT / STATUS BANNER OR LEARNING OPTION */}
        {/* ========================================================================= */}
        {isPro ? (
          <div className={cn(
            "p-6 sm:p-8 rounded-3xl border-2 shadow-xl dark:bg-dark-900 flex flex-col md:flex-row items-center justify-between gap-6",
            is100PercentFreeCourse
              ? "bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border-emerald-500/40"
              : "bg-gradient-to-r from-amber-500/10 via-brand-500/10 to-indigo-500/10 border-amber-500/40"
          )}>
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-mono font-extrabold flex items-center gap-1.5 shadow-xs",
                  is100PercentFreeCourse ? "bg-emerald-500 text-white" : "bg-amber-400 text-slate-950"
                )}>
                  {is100PercentFreeCourse ? '🎁 100% Free Course' : isProMembershipUser ? 'VIP Pro Membership Active' : 'NEC Pro Unlocked'}
                </span>
                <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-800">
                  ✓ All Lessons, Videos & Compiler Unlocked
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                Start Learning {course.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                {is100PercentFreeCourse
                  ? 'This course is completely free for all students. You have full access to interactive in-browser compiler exercises, all HD video lessons, source code, and community support.'
                  : 'Your Pro access is fully active. You have full access to interactive in-browser compiler exercises, all HD video lessons, source code, and mentor support.'}
              </p>
            </div>

            <div className="shrink-0 w-full md:w-auto">
              <Link to={user ? `/courses/${course.slug}/learn` : `/login?redirect=/courses/${course.slug}/learn`}>
                <Button
                  variant="primary"
                  size="lg"
                  className={cn(
                    "w-full md:w-auto px-8 py-4 font-extrabold text-base shadow-xl cursor-pointer",
                    is100PercentFreeCourse
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/25"
                      : "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-amber-500/25"
                  )}
                  rightIcon={<PlayCircle className="w-5 h-5" />}
                >
                  {is100PercentFreeCourse ? 'Start Free Learning 🚀' : 'Go to Course Player / Start Learning 🚀'}
                </Button>
              </Link>
            </div>
          </div>
        ) : isProCourse ? (
          /* Dedicated Pro VIP Single Enrollment Card */
          <div className="space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-extrabold border",
                (!isCourseIncludedInMembership || courseProPlans.length === 0)
                  ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30"
                  : "bg-amber-400/15 text-amber-500 dark:text-amber-400 border-amber-500/30"
              )}>
                {(!isCourseIncludedInMembership || courseProPlans.length === 0) ? (
                  <>
                    <Lock className="w-3.5 h-3.5" /> STANDALONE ENROLLMENT
                  </>
                ) : (
                  <>
                    <Crown className="w-3.5 h-3.5" /> PRO VIP ENROLLMENT
                  </>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {(!isCourseIncludedInMembership || courseProPlans.length === 0)
                  ? `Enroll in ${course.title}`
                  : 'Unlock Full VIP Pro Access'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Gain instant lifetime access to all HD video masterclasses, interactive coding playground, 1-on-1 mentor doubt solving, and verified ISO certificates.
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-brand-50/60 via-white to-amber-50/40 dark:from-dark-900 dark:via-dark-900 dark:to-brand-950/40 border-2 border-amber-500 dark:border-amber-500/80 shadow-2xl shadow-amber-500/10 flex flex-col justify-between space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-orange-500 text-slate-950 text-[10px] font-mono font-black uppercase px-3 py-1 rounded-bl-xl shadow-xs flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Pro VIP Track
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                        VIP Masterclass
                      </span>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{course.title}</span>
                        <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs text-slate-400 line-through font-mono">₹{originalPrice.toLocaleString('en-IN')}</div>
                    <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono flex items-baseline gap-2">
                      <span>₹{proPrice.toLocaleString('en-IN')}</span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full">
                        Save {Math.round(((originalPrice - proPrice) / originalPrice) * 100)}%
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Best for serious engineers and developers who want HD video lectures, direct mentor doubt resolution, downloadable source code, and verified certification.
                  </p>

                  <div className="pt-3 border-t border-slate-200 dark:border-dark-800 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-amber-500 shrink-0" />
                      <span><strong>HD Pro Video Lectures</strong> for all lessons</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-500 shrink-0" />
                      <span><strong>Verified ISO Certificate</strong> of Completion</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-500 shrink-0" />
                      <span><strong>1-on-1 Mentor Guidance</strong> & doubt solving</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>Complete production source code & Git repos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>In-browser cloud compiler playground</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <InfinityIcon className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>Lifetime curriculum access & updates</span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-base shadow-xl shadow-amber-500/25 cursor-pointer"
                  onClick={handleOpenProPayment}
                  rightIcon={<ArrowRight className="w-5 h-5 text-slate-950" />}
                >
                  Unlock NEC Pro (₹{proPrice.toLocaleString('en-IN')})
                </Button>
              </div>
            </div>

            {/* Pro One All-Access Pass Banner */}
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-dark-900 via-indigo-950 to-brand-950 border border-brand-500/30 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Crown className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2 flex-wrap">
                    <span>Looking for All-Access Unlimited Courses?</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-mono font-extrabold uppercase">
                      Pro One Membership
                    </span>
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Unlock ALL courses, live compiler, mentor access & career certificates with Monthly, Yearly, or 3-Years passes.
                  </p>
                </div>
              </div>
              <Link to="/pro-one" className="shrink-0 w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs"
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Explore Membership Plans
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* Free Course Learning Option */
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-dark-900 border-2 border-emerald-500/40 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 max-w-3xl mx-auto">
            <div className="space-y-2">
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold border border-emerald-200 dark:border-emerald-800">
                100% Free Track
              </span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Start Free Learning Today</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md">
                Get full access to reading materials, in-browser compiler playground, and exercises with zero cost.
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-500 font-bold shrink-0"
              onClick={handleEnrollFree}
              isLoading={enrolling}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {isAuthenticated ? 'Start Free Curriculum' : 'Sign In & Start Free'}
            </Button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. MAIN 2-COLUMN CONTENT GRID (Curriculum, Details, About) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-10">
            {/* What you'll learn */}
            {course.whatYouWillLearn && course.whatYouWillLearn.length > 0 && (
              <Card variant="default">
                <CardHeader>
                  <CardTitle className="text-lg">What You Will Learn</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    {course.whatYouWillLearn.map((item, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Course Description */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">About this Course</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {course.description}
              </p>
            </div>

            {/* Course Curriculum Accordion */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Curriculum Overview</h2>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  {course.totalModules || 0} Modules • {course.totalLessons || 0} Lessons
                </span>
              </div>

              {course.curriculum && course.curriculum.length > 0 ? (
                <div className="space-y-3">
                  {course.curriculum.map((mod, modIdx) => {
                    const isOpen = openModuleIds.includes(mod.id);
                    return (
                      <div
                        key={mod.id}
                        className="rounded-2xl border border-slate-200 dark:border-dark-800 bg-white dark:bg-dark-900 overflow-hidden shadow-sm transition-colors"
                      >
                        <button
                          type="button"
                          onClick={() => toggleModule(mod.id)}
                          className="w-full px-5 py-4 flex items-center justify-between text-left gap-4 hover:bg-slate-50 dark:hover:bg-dark-850/50 transition-colors focus:outline-none"
                        >
                          <div className="space-y-0.5">
                            <span className="text-[11px] font-mono font-semibold text-brand-600 dark:text-brand-400">
                              MODULE {modIdx + 1}
                            </span>
                            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                              {mod.title}
                            </h3>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono text-slate-400">
                              {mod.lessons.length} Lessons
                            </span>
                            <ChevronDown
                              className={cn(
                                'w-4 h-4 text-slate-400 transition-transform duration-200',
                                isOpen && 'rotate-180 text-brand-500'
                              )}
                            />
                          </div>
                        </button>

                        {isOpen && (
                          <div className="border-t border-slate-100 dark:border-dark-800 divide-y divide-slate-100 dark:divide-dark-800 bg-slate-50/50 dark:bg-dark-950/40">
                            {mod.lessons.map((lesson) => {
                              const isLessonUnlocked = lesson.isFree || isPro || isFreeEnrolled;
                              return (
                                <Link
                                  key={lesson.id}
                                  to={`/courses/${course.slug}/learn?lesson=${lesson.id || lesson._id}`}
                                  className="px-5 py-3.5 flex items-center justify-between gap-4 text-xs hover:bg-slate-100/80 dark:hover:bg-dark-850 transition-colors group cursor-pointer"
                                >
                                  <div className="flex items-center gap-3">
                                    {isLessonUnlocked ? (
                                      <PlayCircle
                                        className={cn(
                                          'w-4 h-4 shrink-0 transition-transform group-hover:scale-110',
                                          isPro ? 'text-amber-500' : 'text-emerald-500'
                                        )}
                                      />
                                    ) : (
                                      <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                                    )}
                                    <span className="font-medium text-slate-800 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                                      {lesson.title}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 font-mono">
                                    {isPro ? (
                                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-800">
                                        Pro Unlocked ⚡
                                      </span>
                                    ) : lesson.isFree ? (
                                      <Badge variant="success" size="sm">
                                        Free Preview
                                      </Badge>
                                    ) : (
                                      <span className="text-[10px] text-slate-400 bg-slate-200 dark:bg-dark-800 px-2 py-0.5 rounded">
                                        VIP Only
                                      </span>
                                    )}
                                    <span className="text-slate-400 text-[11px]">{lesson.duration}</span>
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 dark:border-dark-800 text-slate-500 text-xs font-mono">
                  Curriculum details are being finalized.
                </div>
              )}
            </div>

            {/* Requirements */}
            {course.requirements && course.requirements.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Requirements</h2>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 list-disc pl-5">
                  {course.requirements.map((req, i) => (
                    <li key={i}>{req}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="text-base">Instructor Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-base">
                    {course.instructor?.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                      {course.instructor?.name}
                    </h4>
                    <p className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      {course.instructor?.role}
                    </p>
                  </div>
                </div>
                {course.instructor?.bio && (
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                    {course.instructor.bio}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card variant="default">
              <CardHeader>
                <CardTitle className="text-base">Course Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {course.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-100 dark:bg-dark-850 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-dark-800"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. EXPLORE MORE PRO VIP TRACKS SECTION */}
        {/* ========================================================================= */}
        {relatedCourses.length > 0 && (
          <div className="pt-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-dark-800 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-500 dark:text-amber-400 text-xs font-mono font-bold">
                  <Crown className="w-3.5 h-3.5" /> MORE PRO VIP COURSES
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                  Explore More Pro VIP Masterclasses
                </h3>
              </div>
              <Link to="/courses?type=premium">
                <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  View All Pro Tracks
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedCourses.map((relCourse: any) => {
                const isRelFree = Boolean(relCourse.proPrice === 0 || relCourse.isProAvailable === false);
                const isRelStandalone = Boolean(
                  !isRelFree && (relCourse.isIncludedInMembership === false || (Array.isArray(relCourse.includedInProPlans) && relCourse.includedInProPlans.length === 0))
                );

                return (
                <Card
                  key={relCourse.id || relCourse._id}
                  className="group flex flex-col justify-between rounded-3xl border border-slate-200/90 dark:border-dark-800/90 bg-white dark:bg-dark-900 shadow-sm hover:shadow-xl hover:border-amber-500/50 transition-all duration-300 overflow-hidden"
                >
                  <div>
                    {/* Course Cover Banner (16:9 Aspect Ratio) */}
                    <Link to={`/courses/${relCourse.slug}`} className="block relative overflow-hidden aspect-video w-full bg-slate-900 group">
                      {relCourse.thumbnail ? (
                        <img
                          src={relCourse.thumbnail}
                          alt={relCourse.title}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-850 to-brand-950 flex items-center justify-center">
                          <div className="text-white/10 font-black text-2xl font-mono select-none tracking-wider">
                            {relCourse.category}
                          </div>
                        </div>
                      )}

                      {/* Vignette Overlays */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-black/50 pointer-events-none" />

                      {/* Badges Container */}
                      <div className="absolute inset-0 p-3 flex flex-col justify-between text-white z-10 pointer-events-none">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-black/60 backdrop-blur-md text-white border border-white/15">
                            {relCourse.category}
                          </span>
                          {isRelFree ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md flex items-center gap-1">
                              100% FREE
                            </span>
                          ) : isRelStandalone ? null : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md flex items-center gap-1">
                              <Crown className="w-3 h-3" /> PRO VIP
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-black/70 backdrop-blur-md text-slate-200 border border-white/10">
                            {relCourse.level}
                          </span>
                          <div className="flex items-center gap-1 text-[11px] font-medium text-slate-200 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10">
                            <Clock className="w-3 h-3 text-amber-400" />
                            <span>{relCourse.duration || '30+ Hours'}</span>
                          </div>
                        </div>
                      </div>
                    </Link>

                    <CardHeader className="p-4 pb-2">
                      <Link to={`/courses/${relCourse.slug}`} className="group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
                        <CardTitle className="text-sm font-extrabold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                          {relCourse.title}
                        </CardTitle>
                      </Link>
                      <CardDescription className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                        {relCourse.shortDescription || relCourse.description}
                      </CardDescription>
                    </CardHeader>
                  </div>

                  <div className="p-4 pt-2 border-t border-slate-100 dark:border-dark-800/80 flex items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-slate-900 dark:text-white font-mono">
                          ₹{relCourse.proPrice?.toLocaleString('en-IN') || '1,999'}
                        </span>
                        {relCourse.originalPrice && (
                          <span className="text-[10px] text-slate-400 line-through font-mono">
                            ₹{relCourse.originalPrice.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                      {isRelFree ? (
                        <span className="text-[9.5px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                          Free Access
                        </span>
                      ) : isRelStandalone ? null : (
                        <span className="text-[9.5px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                          <Crown className="w-2.5 h-2.5" /> Included in Pro VIP
                        </span>
                      )}
                    </div>

                    <Link to={`/courses/${relCourse.slug}`}>
                      <Button
                        variant="primary"
                        size="sm"
                        className={isRelStandalone ? "bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-xs" : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-xs"}
                        rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                      >
                        View Track
                      </Button>
                    </Link>
                  </div>
                </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Course Payment Modal for Pro Track */}
      {course && (
        <CoursePaymentModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          course={course}
          onSuccess={fetchCourseDetails}
        />
      )}
    </div>
  );
};
