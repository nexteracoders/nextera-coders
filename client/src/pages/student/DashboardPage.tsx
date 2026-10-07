import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { learningService } from '../../services/learning.service';
import { achievementService } from '../../services/achievement.service';
import { certificateService } from '../../services/certificate.service';
import { IStudentDashboardData } from '../../types/learning.types';
import { IGamificationSummary } from '../../types/gamification.types';
import { ICertificate } from '../../types/certificate.types';
import { ROUTES } from '../../constants/routes';
import { MembershipBadge } from '../../components/common/MembershipBadge';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import {
  BookOpen,
  PlayCircle,
  CheckCircle2,
  Trophy,
  ArrowRight,
  Clock,
  Activity,
  Sparkles,
  Flame,
  Award,
  Crown,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  useDocumentTitle('Student Dashboard — NextEra Coders');

  const isProMember = Boolean(
    user &&
    user.isPro &&
    user.subscription?.plan &&
    user.subscription?.status === 'active' &&
    (!user.subscription.endDate || new Date(user.subscription.endDate) > new Date())
  );

  const [dashboard, setDashboard] = useState<IStudentDashboardData | null>(null);
  const [gamification, setGamification] = useState<IGamificationSummary | null>(null);
  const [certificates, setCertificates] = useState<ICertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const [dashData, gameData, certData] = await Promise.all([
        learningService.getStudentDashboard(),
        achievementService.getGamificationSummary().catch(() => null),
        certificateService.getMyCertificates().catch(() => ({ certificates: [] })),
      ]);
      setDashboard(dashData);
      setGamification(gameData);
      setCertificates(certData.certificates || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 pb-16">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="max-w-3xl mx-auto py-16">
        <ErrorState
          title="Unable to load dashboard"
          message={error || 'Could not fetch your learning analytics.'}
          onRetry={fetchDashboard}
        />
      </div>
    );
  }

  const { summary, continueLearning, recentLessons, activity } = dashboard;
  const primaryCourse = continueLearning[0] || null;

  return (
    <div className="space-y-8 pb-16">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Welcome back, {user?.name || 'Engineer'} 👋
            </h1>
            {isProMember && <MembershipBadge size="sm" />}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Your real-time engineering curriculum progress and activity breakdown.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to={ROUTES.COURSES}>
            <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Explore Courses
            </Button>
          </Link>
          <Link to={ROUTES.MY_LEARNING}>
            <Button variant="primary" size="sm">
              My Learning
            </Button>
          </Link>
        </div>
      </div>

      {/* Active Pro Membership Banner */}
      {isProMember && (
        <div className="rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-dark-900 border border-amber-500/30 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-500 flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {user?.subscription?.plan
                    ? `NEC Pro One ${user.subscription.plan.toUpperCase()} PASS`
                    : 'NextEra Coders Pro Track Access'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                  ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                All HD video lectures, source codes, SDE sheets, and mentorship sessions are unlocked.
              </p>
            </div>
          </div>
          <Link to={ROUTES.PROFILE}>
            <Button variant="outline" size="sm" className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10 text-xs shrink-0">
              View Plan Details
            </Button>
          </Link>
        </div>
      )}

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="default" className="p-4 sm:p-5 flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-500 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Total XP</p>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              {gamification?.totalPoints || user?.points || 0} XP
            </h3>
          </div>
        </Card>

        <Card variant="default" className="p-4 sm:p-5 flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950 text-rose-500 shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Active Streak</p>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              {gamification?.learningStreak || user?.learningStreak || 0} Days
            </h3>
          </div>
        </Card>

        <Card variant="default" className="p-4 sm:p-5 flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-500 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Certificates</p>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              {certificates.length}
            </h3>
          </div>
        </Card>

        <Card variant="default" className="p-4 sm:p-5 flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-500 shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Badges</p>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              {gamification?.unlockedCount || 0} Unlocked
            </h3>
          </div>
        </Card>
      </div>

      {/* Gamification & Milestone Quick Strip */}
      {gamification && gamification.recentAchievements?.length > 0 && (
        <Card variant="elevated" className="p-4 sm:p-5 bg-gradient-to-r from-amber-500/5 via-slate-50 to-brand-50/10 dark:from-amber-950/10 dark:via-dark-900 dark:to-brand-950/10 border-amber-500/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Recent Accomplishment: {gamification.recentAchievements[0].name}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  +{gamification.recentAchievements[0].points} XP • {gamification.recentAchievements[0].description}
                </p>
              </div>
            </div>

            <Link to={ROUTES.ACHIEVEMENTS}>
              <Button variant="outline" size="sm" className="font-mono text-xs" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                View All Achievements
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Primary Continue Learning Card */}
      {primaryCourse ? (
        <Card variant="elevated" className="overflow-hidden border-brand-200/80 dark:border-brand-900/40 bg-gradient-to-br from-white via-white to-brand-50/30 dark:from-dark-900 dark:via-dark-900 dark:to-brand-950/20">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="flex items-center gap-2">
                  <Badge variant="info" size="sm">
                    {primaryCourse.category}
                  </Badge>
                  <span className="text-xs font-mono text-slate-400">
                    {primaryCourse.completedLessonsCount} of {primaryCourse.totalLessons} lessons completed
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                  {primaryCourse.title}
                </h2>

                {primaryCourse.lastAccessedLesson && (
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-white">Next Up:</span>
                    <span className="font-mono text-brand-600 dark:text-brand-400">
                      {primaryCourse.lastAccessedLesson.title}
                    </span>
                    <span className="text-slate-400">({primaryCourse.lastAccessedLesson.duration})</span>
                  </p>
                )}

                {/* Progress Bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500">Overall Track Completion</span>
                    <span className="font-bold text-brand-600 dark:text-brand-400">
                      {primaryCourse.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-dark-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-brand-600 dark:bg-brand-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${primaryCourse.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-3">
                <Link
                  to={
                    primaryCourse.lastAccessedLesson
                      ? `/courses/${primaryCourse.slug}/learn?lesson=${primaryCourse.lastAccessedLesson.id}`
                      : `/courses/${primaryCourse.slug}/learn`
                  }
                >
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full shadow-lg shadow-brand-500/20"
                    rightIcon={<PlayCircle className="w-4 h-4" />}
                  >
                    Resume Learning
                  </Button>
                </Link>
                <Link to={`/courses/${primaryCourse.slug}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    View Full Syllabus
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : summary.enrolledCourses === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-6 h-6" />}
          title="Ready to begin your engineering journey?"
          description="You haven't enrolled in any programming courses yet. Explore our structured curricula to start learning."
          actionLabel="Browse Course Catalog"
          onAction={() => window.location.assign(ROUTES.COURSES)}
        />
      ) : (
        <div className="p-8 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
          <Sparkles className="w-8 h-8 text-emerald-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            All Current Courses Mastered!
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto">
            You have completed 100% of your enrolled courses. Check out the catalog to learn new advanced skills.
          </p>
          <Link to={ROUTES.COURSES}>
            <Button variant="primary" size="sm" className="bg-emerald-600 hover:bg-emerald-500">
              Browse More Curriculums
            </Button>
          </Link>
        </div>
      )}

      {/* Two Column Section: Recent Lessons & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recently Viewed Lessons */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-500" />
              Recently Accessed Lessons
            </h2>
            <Link to={ROUTES.MY_LEARNING} className="text-xs font-mono text-brand-600 hover:underline">
              View all
            </Link>
          </div>

          {recentLessons.length > 0 ? (
            <div className="space-y-2.5">
              {recentLessons.map((item, i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl border border-slate-200/80 dark:border-dark-800 bg-white dark:bg-dark-900 flex items-center justify-between gap-4 shadow-sm hover:border-brand-300 dark:hover:border-brand-800 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 shrink-0">
                      <PlayCircle className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                        {item.title}
                      </h4>
                      <p className="text-[11px] font-mono text-slate-400 truncate">
                        {item.courseTitle}
                      </p>
                    </div>
                  </div>

                  <Link to={`/courses/${item.courseSlug}/learn?lesson=${item.id}`}>
                    <Button variant="outline" size="sm" className="shrink-0 text-xs">
                      Resume
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <Card variant="default">
              <CardContent className="p-6 text-center text-slate-400 font-mono text-xs">
                Open a course lesson to build your recent viewing history.
              </CardContent>
            </Card>
          )}
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            Learning Activity Log
          </h2>

          {activity.length > 0 ? (
            <Card variant="default">
              <CardContent className="p-4 divide-y divide-slate-100 dark:divide-dark-800">
                {activity.map((act, i) => (
                  <div key={i} className="py-3 flex items-start gap-3 text-xs">
                    <div className="mt-0.5">
                      {act.type === 'COMPLETED_COURSE' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-brand-500" />
                      )}
                    </div>
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <p className="text-slate-800 dark:text-slate-200 font-medium truncate">
                        {act.description}
                      </p>
                      <p className="text-[10px] font-mono text-slate-400">
                        {new Date(act.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card variant="default">
              <CardContent className="p-6 text-center text-slate-400 font-mono text-xs">
                Your learning activity and course completions will be logged here.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
