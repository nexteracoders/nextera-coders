import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  BookOpen,
  GraduationCap,
  Award,
  Code2,
  HelpCircle,
  FolderGit2,
  FileText,
  PlusCircle,
  Megaphone,
  ArrowRight,
  Clock,
  Sparkles,
  BarChart3,
  Activity,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { adminService } from '../../services/admin.service';
import { AdminDashboardData } from '../../types/admin.types';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminStatusBadge } from '../../components/admin/AdminStatusBadge';
import { Skeleton } from '../../components/ui/Skeleton';
import { ROUTES } from '../../constants/routes';

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminService.getDashboard();
      setData(res);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch admin dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  const kpis = data?.kpis;

  const statCards = [
    {
      title: 'Total Students',
      value: kpis?.totalStudents ?? 0,
      subValue: `+${kpis?.newStudentsThirtyDays ?? 0} in last 30d`,
      icon: Users,
      color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400',
      link: ROUTES.ADMIN_STUDENTS,
    },
    {
      title: 'Active Students',
      value: kpis?.activeStudentsSevenDays ?? 0,
      subValue: 'Active in last 7 days',
      icon: Sparkles,
      color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400',
      link: ROUTES.ADMIN_STUDENTS,
    },
    {
      title: 'Course Catalog',
      value: kpis?.totalCourses ?? 0,
      subValue: `${kpis?.publishedCourses ?? 0} Published · ${kpis?.draftCourses ?? 0} Draft`,
      icon: BookOpen,
      color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-400',
      link: ROUTES.ADMIN_COURSES,
    },
    {
      title: 'Total Enrollments',
      value: kpis?.totalEnrollments ?? 0,
      subValue: `${kpis?.completedEnrollments ?? 0} Completed (${kpis?.completionRate ?? 0}%)`,
      icon: GraduationCap,
      color: 'from-indigo-500/20 to-purple-500/20 border-indigo-500/30 text-indigo-400',
      link: ROUTES.ADMIN_COURSES,
    },
    {
      title: 'DSA Challenges',
      value: kpis?.totalProblems ?? 0,
      subValue: 'Algorithm practice problems',
      icon: Code2,
      color: 'from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-400',
      link: ROUTES.ADMIN_PROBLEMS,
    },
    {
      title: 'Assessments & Quizzes',
      value: kpis?.totalQuizzes ?? 0,
      subValue: 'Knowledge check quizzes',
      icon: HelpCircle,
      color: 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30 text-yellow-400',
      link: ROUTES.ADMIN_QUIZZES,
    },
    {
      title: 'Verified Certificates',
      value: kpis?.totalCertificates ?? 0,
      subValue: 'Conferred credentials',
      icon: Award,
      color: 'from-emerald-500/20 to-green-500/20 border-emerald-500/30 text-emerald-400',
      link: ROUTES.ADMIN_CERTIFICATES,
    },
    {
      title: 'Projects & Tutorials',
      value: (kpis?.totalProjects ?? 0) + (kpis?.totalTutorials ?? 0),
      subValue: `${kpis?.totalProjects ?? 0} Projects · ${kpis?.totalTutorials ?? 0} Tutorials`,
      icon: FileText,
      color: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-cyan-400',
      link: ROUTES.ADMIN_TUTORIALS,
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Admin Header */}
      <AdminPageHeader
        title="Admin Control Center"
        description={`Welcome back, ${user?.name}. Manage curriculum, student records, learning assets, and platform governance.`}
        action={
          <div className="flex items-center gap-3">
            <Link
              to={ROUTES.ADMIN_ANTI_CHEAT}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-semibold border border-rose-500/30 transition-colors"
            >
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <span>Anti-Cheat Center</span>
            </Link>
            <Link
              to={ROUTES.ADMIN_HEALTH}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold border border-amber-500/30 transition-colors"
            >
              <Activity className="w-4 h-4 text-amber-500 animate-pulse" />
              <span>Execution Health</span>
            </Link>
            <Link
              to={ROUTES.ADMIN_ANALYTICS}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Full Analytics</span>
            </Link>
            <Link
              to={ROUTES.ADMIN_COURSES_NEW}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-primary text-slate-950 text-xs font-bold hover:bg-brand-primary-hover shadow-lg shadow-brand-primary/20 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Course</span>
            </Link>
          </div>
        }
      />

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-sm"
              >
                <Skeleton className="h-4 w-1/2 rounded" />
                <Skeleton className="h-8 w-3/4 rounded" />
                <Skeleton className="h-3 w-2/3 rounded" />
              </div>
            ))
          : statCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <Link
                  key={idx}
                  to={card.link}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl p-5 transition-all hover:scale-[1.01] hover:shadow-md group relative overflow-hidden shadow-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{card.title}</span>
                    <div
                      className={`p-2.5 rounded-xl bg-gradient-to-br ${card.color} border shrink-0`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                    {card.value}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                    <span>{card.subValue}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 group-hover:text-brand-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              );
            })}
      </div>

      {/* Quick Actions Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-primary" />
          Quick Resource Creation
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link
            to={ROUTES.ADMIN_COURSES_NEW}
            className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-brand-primary/40 text-center transition-all group"
          >
            <BookOpen className="w-5 h-5 text-brand-primary mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">New Course</span>
          </Link>

          <Link
            to={ROUTES.ADMIN_PROBLEMS_NEW}
            className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-purple-500/40 text-center transition-all group"
          >
            <Code2 className="w-5 h-5 text-purple-500 dark:text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">New DSA Problem</span>
          </Link>

          <Link
            to={ROUTES.ADMIN_QUIZZES_NEW}
            className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-500/40 text-center transition-all group"
          >
            <HelpCircle className="w-5 h-5 text-amber-500 dark:text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">New Quiz</span>
          </Link>

          <Link
            to={ROUTES.ADMIN_TUTORIALS_NEW}
            className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-cyan-500/40 text-center transition-all group"
          >
            <FileText className="w-5 h-5 text-cyan-500 dark:text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">New Tutorial</span>
          </Link>

          <Link
            to={ROUTES.ADMIN_PROJECTS_NEW}
            className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500/40 text-center transition-all group"
          >
            <FolderGit2 className="w-5 h-5 text-blue-500 dark:text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">New Project</span>
          </Link>

          <Link
            to={ROUTES.ADMIN_ANNOUNCEMENTS}
            className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/40 text-center transition-all group"
          >
            <Megaphone className="w-5 h-5 text-emerald-500 dark:text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Broadcast Update</span>
          </Link>
        </div>
      </div>

      {/* Recent Activity Stream */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-primary" />
              Live Platform Activity
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Real-time feed of registrations, course enrollments, certifications, and challenge completions.
            </p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="text-xs text-brand-primary hover:underline font-semibold"
          >
            Refresh Feed
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {loading ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-9 h-9 rounded-xl" />
                  <div className="space-y-1">
                    <Skeleton className="w-48 h-4 rounded" />
                    <Skeleton className="w-32 h-3 rounded" />
                  </div>
                </div>
                <Skeleton className="w-20 h-5 rounded-full" />
              </div>
            ))
          ) : data?.recentActivity.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
              No recent activity recorded yet.
            </div>
          ) : (
            data?.recentActivity.map((act) => (
              <div
                key={act.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-200 shrink-0">
                    {act.user?.profileImage ? (
                      <img
                        src={act.user.profileImage}
                        alt={act.user.name}
                        className="w-full h-full rounded-xl object-cover"
                      />
                    ) : (
                      act.user?.name?.slice(0, 2).toUpperCase() || 'ST'
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{act.title}</span>
                      <AdminStatusBadge status={act.type} />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{act.description}</p>
                  </div>
                </div>

                <div className="text-xs text-slate-400 dark:text-slate-500 shrink-0 sm:text-right">
                  {new Date(act.timestamp).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
