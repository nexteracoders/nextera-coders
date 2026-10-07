import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Users,
  GraduationCap,
  Code2,
  HelpCircle,
  FileText,
  Calendar,
} from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { AdminAnalyticsData } from '../../types/admin.types';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { Skeleton } from '../../components/ui/Skeleton';

export const AdminAnalyticsPage: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [data, setData] = useState<AdminAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminService.getAnalytics(timeframe);
      setData(res);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  const timeSeries = data?.timeSeries || [];
  const topContent = data?.topContent;

  return (
    <div className="space-y-8 animate-fade-in">
      <AdminPageHeader
        title="Platform Analytics & Intelligence"
        description="Comprehensive metrics, student growth vectors, course completion ratios, and curriculum performance."
        breadcrumbs={[{ label: 'Analytics' }]}
        action={
          <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            {(['7d', '30d', '90d', '1y'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  timeframe === tf
                    ? 'bg-brand-primary text-slate-950 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {tf === '7d' ? '7 Days' : tf === '30d' ? '30 Days' : tf === '90d' ? '90 Days' : '1 Year'}
              </button>
            ))}
          </div>
        }
      />

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* Chart 1: Student Registrations & Certifications Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              Student Registration Velocity
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Last {timeframe}
            </span>
          </div>

          <div className="h-64">
            {loading ? (
              <Skeleton className="w-full h-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeries}>
                  <defs>
                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--tooltip-bg, #0f172a)',
                      borderColor: '#475569',
                      borderRadius: '0.75rem',
                      color: '#f8fafc',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="students"
                    name="New Students"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorStudents)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Course Enrollments vs Completions */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-emerald-500" />
              Course Enrollments vs Completions
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Last {timeframe}
            </span>
          </div>

          <div className="h-64">
            {loading ? (
              <Skeleton className="w-full h-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--tooltip-bg, #0f172a)',
                      borderColor: '#475569',
                      borderRadius: '0.75rem',
                      color: '#f8fafc',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                  <Bar dataKey="enrollments" name="Enrollments" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completions" name="Completions" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Chart 3 & 4: Assessment & DSA Challenge Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quiz Activity */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-500" />
              Quiz Assessment Activity & Pass Rate
            </h3>
          </div>

          <div className="h-64">
            {loading ? (
              <Skeleton className="w-full h-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeries}>
                  <defs>
                    <linearGradient id="colorQuiz" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--tooltip-bg, #0f172a)',
                      borderColor: '#475569',
                      borderRadius: '0.75rem',
                      color: '#f8fafc',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                  <Area
                    type="monotone"
                    dataKey="quizAttempts"
                    name="Total Attempts"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorQuiz)"
                  />
                  <Area
                    type="monotone"
                    dataKey="quizPassed"
                    name="Passed Attempts"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={0}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* DSA Submissions */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-purple-500" />
              DSA Problem Execution & Acceptance
            </h3>
          </div>

          <div className="h-64">
            {loading ? (
              <Skeleton className="w-full h-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--tooltip-bg, #0f172a)',
                      borderColor: '#475569',
                      borderRadius: '0.75rem',
                      color: '#f8fafc',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                  <Bar
                    dataKey="dsaSubmissions"
                    name="Total Submissions"
                    fill="#a855f7"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="dsaAccepted"
                    name="Accepted Solves"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Popular Content Performance Rankings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Top Courses */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-brand-primary" />
            Top Enrolled Courses
          </h4>
          <div className="space-y-2.5">
            {topContent?.courses?.map((c) => (
              <div
                key={c.id}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-xs transition-colors"
              >
                <div className="min-w-0 pr-2">
                  <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{c.title}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">{c.level}</p>
                </div>
                <span className="font-bold text-brand-primary shrink-0">
                  {c.totalEnrollments} enrolls
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top DSA Problems */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5 text-purple-500" />
            Top DSA Challenges
          </h4>
          <div className="space-y-2.5">
            {topContent?.problems?.map((p) => (
              <div
                key={p.id}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-xs transition-colors"
              >
                <div className="min-w-0 pr-2">
                  <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{p.title}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">{p.difficulty}</p>
                </div>
                <span className="font-bold text-purple-500 dark:text-purple-400 shrink-0">
                  {p.totalSubmissions} runs
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Quizzes */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
            Top Quizzes
          </h4>
          <div className="space-y-2.5">
            {topContent?.quizzes?.map((q) => (
              <div
                key={q.id}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-xs transition-colors"
              >
                <div className="min-w-0 pr-2">
                  <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{q.title}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">Pass: {q.passingScore}%</p>
                </div>
                <span className="font-bold text-amber-500 dark:text-amber-400 shrink-0">
                  {q.totalAttempts} attempts
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Tutorials */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-cyan-500" />
            Top Tutorials
          </h4>
          <div className="space-y-2.5">
            {topContent?.tutorials?.map((t) => (
              <div
                key={t.id}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-xs transition-colors"
              >
                <div className="min-w-0 pr-2">
                  <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{t.title}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">{t.category}</p>
                </div>
                <span className="font-bold text-cyan-500 dark:text-cyan-400 shrink-0">
                  {t.views} views
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
