import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Award,
  Trophy,
  BookOpen,
  HelpCircle,
  Code2,
  Coins,
  Flame,
  CheckCircle2,
  XCircle,
  UserCheck,
  UserX,
  Crown,
  CreditCard,
  Edit3,
  Key,
  PlusCircle,
  Trash2,
  Gift,
  Package,
  Tag,
  Truck,
  ExternalLink,
  ShieldCheck,
  Eye,
  EyeOff,
  Copy,
} from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { courseService } from '../../services/course.service';
import { coinService, UserWalletRecord } from '../../services/coin.service';
import { sundayContestService, SundayContestConfig } from '../../services/contest.service';
import { AdminStudentDossier } from '../../types/admin.types';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminStatusBadge } from '../../components/admin/AdminStatusBadge';
import { Skeleton } from '../../components/ui/Skeleton';
import { DeleteConfirmModal } from '../../components/admin/DeleteConfirmModal';
import { useToast } from '../../components/ui/Toast';

export const AdminStudentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [dossier, setDossier] = useState<AdminStudentDossier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'membership' | 'courses' | 'quizzes' | 'dsa' | 'certificates' | 'achievements' | 'points'
  >('membership');
  const [subAdminPwRevealed, setSubAdminPwRevealed] = useState(false);

  const { success: toastSuccess, error: toastError } = useToast();

  // Student Coin Wallet & Contest State
  const [studentWallet, setStudentWallet] = useState<UserWalletRecord | null>(null);
  const [contestConfig] = useState<SundayContestConfig>(sundayContestService.getConfig());
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toastSuccess(`Coupon code "${code}" copied to clipboard!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Status toggle modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  // Pro Subscription Modal
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [subAction, setSubAction] = useState<'grant' | 'extend' | 'revoke'>('grant');
  const [subPlan, setSubPlan] = useState<'monthly' | 'yearly' | 'lifetime'>('yearly');
  const [subCustomDate, setSubCustomDate] = useState<string>('');
  const [subSubmitting, setSubSubmitting] = useState(false);

  // Manual Course Enrollment Modal
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [allCourses, setAllCourses] = useState<Array<{ id: string; title: string; slug: string }>>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [enrollTier, setEnrollTier] = useState<'free' | 'pro'>('pro');
  const [enrollSubmitting, setEnrollSubmitting] = useState(false);

  // Edit Profile Modal
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'student' | 'sub_admin'>('student');
  const [editAvatar, setEditAvatar] = useState('');
  const [editCollege, setEditCollege] = useState('');
  const [editPoints, setEditPoints] = useState<number>(500);
  const [editStreak, setEditStreak] = useState<number>(7);
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [editBio, setEditBio] = useState('');
  const [editSkills, setEditSkills] = useState('');
  const [editGithub, setEditGithub] = useState('');
  const [editLinkedin, setEditLinkedin] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [profileSubmitting, setProfileSubmitting] = useState(false);

  useEffect(() => {
    if (id) fetchDossier();
  }, [id]);

  const fetchDossier = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminService.getStudentById(id!);
      setDossier(res);

      if (res.student) {
        setEditName(res.student.name || '');
        setEditEmail(res.student.email || '');
        setEditRole((res.student.role as any) || 'student');
        setEditAvatar(res.student.profileImage || '');
        setEditCollege((res.student as any).college || '');
        setEditPoints(typeof res.student.points === 'number' ? res.student.points : 500);
        setEditStreak(typeof res.student.learningStreak === 'number' ? res.student.learningStreak : 7);
        setEditIsActive(res.student.isActive !== false);
        setEditBio(res.student.bio || '');
        setEditSkills(Array.isArray(res.student.skills) ? res.student.skills.join(', ') : (typeof res.student.skills === 'string' ? res.student.skills : ''));
        setEditGithub(res.student.github || '');
        setEditLinkedin(res.student.linkedin || '');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch student dossier');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!dossier?.student) return;
    const newStatus = !dossier.student.isActive;
    try {
      await adminService.updateStudentStatus(dossier.student.id, newStatus);
      toastSuccess(
        `Student account ${newStatus ? 'activated' : 'deactivated'} successfully`
      );
      fetchDossier();
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to update student status');
    }
  };

  const handleUpdateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      setSubSubmitting(true);
      await adminService.updateStudentSubscription(id, {
        action: subAction,
        plan: subPlan,
        customEndDate: subCustomDate || undefined,
      });
      toastSuccess(
        subAction === 'revoke'
          ? 'Pro membership revoked successfully'
          : `Pro membership ${subPlan.toUpperCase()} access saved successfully`
      );
      setSubModalOpen(false);
      fetchDossier();
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to update subscription');
    } finally {
      setSubSubmitting(false);
    }
  };

  const openEnrollModal = async () => {
    try {
      setEnrollModalOpen(true);
      if (allCourses.length === 0) {
        const res = await courseService.getCourses({ limit: 100 });
        setAllCourses(res.courses || []);
        if (res.courses && res.courses.length > 0) {
          setSelectedCourseId(res.courses[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load courses for enrollment modal', err);
    }
  };

  const handleManualEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedCourseId) return;
    try {
      setEnrollSubmitting(true);
      await adminService.enrollStudentInCourse(id, {
        courseId: selectedCourseId,
        tier: enrollTier,
      });
      toastSuccess('Student successfully enrolled in course!');
      setEnrollModalOpen(false);
      fetchDossier();
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to enroll student');
    } finally {
      setEnrollSubmitting(false);
    }
  };

  const handleRemoveEnrollment = async (enrollmentId: string, courseTitle: string) => {
    if (!id) return;
    if (!window.confirm(`Are you sure you want to remove enrollment for "${courseTitle}"?`)) return;
    try {
      await adminService.removeStudentEnrollment(id, enrollmentId);
      toastSuccess(`Enrollment for "${courseTitle}" removed`);
      fetchDossier();
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to remove enrollment');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      setProfileSubmitting(true);
      const skillsArr = editSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await adminService.updateStudentProfile(id, {
        name: editName,
        email: editEmail,
        role: editRole,
        profileImage: editAvatar,
        college: editCollege,
        points: editPoints,
        learningStreak: editStreak,
        isActive: editIsActive,
        bio: editBio,
        skills: skillsArr,
        github: editGithub,
        linkedin: editLinkedin,
        newPassword: editPassword || undefined,
      });

      // Also sync wallet state in coinService for admin consistency
      coinService.adminAdjustUserCoins(id, editPoints, 'set', 'Admin profile edit');
      coinService.adminAdjustUserStreak(id, editStreak, true);

      toastSuccess('Student profile details updated successfully!');
      setProfileModalOpen(false);
      setEditPassword('');
      fetchDossier();
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to update student profile');
    } finally {
      setProfileSubmitting(false);
    }
  };

  useEffect(() => {
    if (dossier?.student) {
      const studentData = dossier.student as any;
      const allWallets = coinService.getAllUserWallets();
      const matched = allWallets.find(
        (w: any) =>
          w.userId === studentData.id ||
          (studentData.email && w.userEmail?.toLowerCase() === studentData.email.toLowerCase())
      );

      setStudentWallet({
        userId: studentData.id,
        userName: studentData.name,
        userEmail: studentData.email,
        avatar: studentData.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
        college: studentData.college || 'Engineering College',
        coins: typeof studentData.points === 'number' ? studentData.points : (matched?.coins ?? 0),
        dailyStreak: typeof studentData.learningStreak === 'number' ? studentData.learningStreak : (matched?.dailyStreak ?? 0),
        lastClaimDate: studentData.lastActivityDate || matched?.lastClaimDate || null,
        claimedToday: matched?.claimedToday || false,
        unlockedCoupons: (studentData.unlockedCoupons && studentData.unlockedCoupons.length > 0) ? studentData.unlockedCoupons : (matched?.unlockedCoupons || []),
        unlockedCourses: (studentData.unlockedCourses && studentData.unlockedCourses.length > 0) ? studentData.unlockedCourses : (matched?.unlockedCourses || []),
        swagOrders: (studentData.swagOrders && studentData.swagOrders.length > 0) ? studentData.swagOrders : (matched?.swagOrders || []),
        updatedAt: new Date().toISOString(),
      });
    }
  }, [dossier]);

  const student = dossier?.student;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64 rounded-xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <p className="text-rose-500 dark:text-rose-400 font-semibold mb-4">{error || 'Student not found'}</p>
        <Link
          to="/admin/students"
          className="text-xs text-brand-primary font-bold hover:underline"
        >
          ← Back to Students Roster
        </Link>
      </div>
    );
  }

  const isPro = Boolean(student.isPro);
  const sub = student.subscription;

  const studentContestSolved = student
    ? sundayContestService.getUserSolvedProblemNumbers(student.id) ||
      (student.email ? sundayContestService.getUserSolvedProblemNumbers(student.email) : []) ||
      sundayContestService.getUserSolvedProblemNumbers('user-current') ||
      []
    : [];

  const studentLeaderboardEntry = contestConfig.leaderboard?.find(
    (c) =>
      c.userId === student?.id ||
      (student?.email && (c.bio?.toLowerCase().includes(student.email.toLowerCase()) || c.username === student.name.toLowerCase().replace(/\s+/g, '_'))) ||
      c.name.toLowerCase() === student?.name?.toLowerCase()
  );

  const easySolved = dossier?.submissions?.filter((s) => s.problem?.difficulty?.toLowerCase() === 'easy' && s.status?.toUpperCase() === 'ACCEPTED').length || 0;
  const mediumSolved = dossier?.submissions?.filter((s) => s.problem?.difficulty?.toLowerCase() === 'medium' && s.status?.toUpperCase() === 'ACCEPTED').length || 0;
  const hardSolved = dossier?.submissions?.filter((s) => s.problem?.difficulty?.toLowerCase() === 'hard' && s.status?.toUpperCase() === 'ACCEPTED').length || 0;
  const totalSolved = (dossier?.submissions?.filter((s) => s.status?.toUpperCase() === 'ACCEPTED').length || 0);

  return (
    <div className="space-y-8 animate-fade-in">
      <AdminPageHeader
        title={`${student.name}'s Dossier`}
        description="Comprehensive 360-degree educational audit, Pro membership governance, course enrollments, assessment results, and billing."
        breadcrumbs={[{ label: 'Students', path: '/admin/students' }, { label: student.name }]}
        action={
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setProfileModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-brand-primary" />
              <span>Edit Profile & Password</span>
            </button>

            <button
              onClick={() => {
                setSubAction(isPro ? 'extend' : 'grant');
                setSubModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20 border border-amber-500/40 text-amber-600 dark:text-amber-400 hover:border-amber-500 transition-all"
            >
              <Crown className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              <span>{isPro ? 'Manage Pro Pass' : 'Grant Pro Pass'}</span>
            </button>

            <button
              onClick={() => setStatusModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                student.isActive
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
              }`}
            >
              {student.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
              <span>{student.isActive ? 'Deactivate Account' : 'Activate Account'}</span>
            </button>
          </div>
        }
      />

      {/* Student Profile Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 font-extrabold text-xl shadow-sm shrink-0 overflow-hidden">
                {student.profileImage ? (
                  <img
                    src={student.profileImage}
                    alt={student.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  student.name.slice(0, 2).toUpperCase()
                )}
              </div>
              {isPro && (
                <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 flex items-center justify-center text-xs text-slate-950 font-bold shadow-md">
                  👑
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{student.name}</h2>
                <AdminStatusBadge status={student.isActive ? 'ACTIVE' : 'INACTIVE'} />
                {isPro ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-600 dark:text-amber-400 text-xs font-mono font-bold">
                    <Crown className="w-3 h-3" /> PRO VIP ACTIVE
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-mono">
                    Standard Free Tier
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{student.email}</p>
              {student.bio && (
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 max-w-xl line-clamp-2">
                  {student.bio}
                </p>
              )}
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                Total XP
              </span>
              <span className="text-base font-extrabold text-amber-500 dark:text-amber-400">{student.points}</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Streak</span>
              <span className="text-base font-extrabold text-orange-500 dark:text-orange-400 flex items-center justify-center gap-1">
                <Flame className="w-3.5 h-3.5" />
                {student.learningStreak}d
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                Enrollments
              </span>
              <span className="text-base font-extrabold text-brand-primary">
                {dossier?.enrollments.length}
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                Certificates
              </span>
              <span className="text-base font-extrabold text-emerald-500 dark:text-emerald-400">
                {dossier?.certificates.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 🛡️ SUB-ADMINISTRATOR PRIVILEGES & CREDENTIAL CONSOLE (If Sub-Admin) */}
      {student.role === 'sub_admin' && (
        <div className="rounded-2xl border border-emerald-500/30 dark:border-emerald-500/30 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs relative overflow-hidden space-y-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            {/* Left: Officer Identification */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/25 shadow-xs shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Sub-Administrator Officer
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    ACTIVE DELEGATE
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Appointed by <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">{(student as any).subAdminCredential?.appointedBy || 'NextEra Coders Leadership'}</strong>
                  {(student as any).subAdminCredential?.appointedAt && ` • ${new Date((student as any).subAdminCredential.appointedAt).toLocaleDateString()}`}
                </p>
              </div>
            </div>

            {/* Right: Master Password Card (ALWAYS SHOWN & REVEALABLE) */}
            <div className="w-full lg:w-auto flex items-center justify-between sm:justify-start gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-emerald-500/30 shadow-2xs">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <Key className="w-4 h-4" />
                </div>
                <div className="text-xs font-mono">
                  <span className="text-slate-500 dark:text-slate-400 text-[10px] block uppercase font-bold leading-none mb-0.5">
                    Sub-Admin Password
                  </span>
                  <span className="text-slate-900 dark:text-white font-extrabold select-all">
                    {subAdminPwRevealed
                      ? ((student as any).subAdminCredential?.plainPassword || '••••••••')
                      : '••••••••••••'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-2">
                <button
                  type="button"
                  onClick={() => setSubAdminPwRevealed(!subAdminPwRevealed)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  title={subAdminPwRevealed ? 'Hide Password' : 'Show Password'}
                >
                  {subAdminPwRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const pw = (student as any).subAdminCredential?.plainPassword || '';
                    if (pw) {
                      navigator.clipboard.writeText(pw);
                      toastSuccess('Sub-Admin password copied to clipboard!');
                    }
                  }}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  title="Copy Password"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(true)}
                  className="px-2 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 transition-colors cursor-pointer"
                  title="Change Password"
                >
                  Change
                </button>
              </div>
            </div>
          </div>

          {/* Clean Light/Dark Scope Matrix (Adaptive pills) */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold mr-1">
              Delegated Scope:
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-medium">
              ✓ Courses & Lessons
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-medium">
              ✓ DSA Problems & Testcases
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-medium">
              ✓ Community Moderation
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-medium ml-auto">
              🔒 Settings & Finance Locked to Owner
            </span>
          </div>
        </div>
      )}

      {/* Dossier Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto">
        {[
          { key: 'membership', label: '👑 Membership & Orders', count: dossier?.paymentRequests?.length || 0, icon: Crown },
          { key: 'courses', label: 'Enrolled Courses', count: dossier?.enrollments.length, icon: BookOpen },
          { key: 'quizzes', label: 'Quiz Assessments', count: dossier?.quizAttempts.length, icon: HelpCircle },
          { key: 'dsa', label: 'DSA Submissions', count: dossier?.submissions.length, icon: Code2 },
          { key: 'certificates', label: 'Certificates', count: dossier?.certificates.length, icon: Award },
          { key: 'achievements', label: 'Achievements', count: dossier?.achievements.length, icon: Trophy },
          { key: 'points', label: 'Points History', count: dossier?.pointTransactions.length, icon: Coins },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive
                    ? 'bg-brand-primary/20 text-brand-primary'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {tab.count ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        {/* Tab: Membership & Orders */}
        {activeTab === 'membership' && (
          <div className="space-y-6">
            {/* Pro Subscription Status Card */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-500 dark:text-amber-400">
                    <Crown className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      NEC Pro One Membership
                      {isPro ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          Active
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                          Not Active
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {isPro
                        ? `Enrolled Plan: ${sub?.plan ? sub.plan.toUpperCase() : 'VIP'} Pass`
                        : 'Student is on the standard Free tier.'}
                    </p>
                  </div>
                </div>

                {isPro && sub && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Plan Started</span>
                      <span className="text-slate-800 dark:text-slate-200 font-bold">
                        {sub.startDate ? new Date(sub.startDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Expires On</span>
                      <span className="text-amber-600 dark:text-amber-400 font-bold">
                        {sub.endDate ? new Date(sub.endDate).toLocaleDateString() : '3-Year Pass'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Reference / Auth ID</span>
                      <span className="text-slate-700 dark:text-slate-300 truncate block">{sub.paymentId || 'ADMIN_AUTH'}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 shrink-0">
                <button
                  onClick={() => {
                    setSubAction(isPro ? 'extend' : 'grant');
                    setSubModalOpen(true);
                  }}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Crown className="w-3.5 h-3.5" />
                  {isPro ? 'Extend / Modify Plan' : 'Grant Pro Pass'}
                </button>

                {isPro && (
                  <button
                    onClick={() => {
                      setSubAction('revoke');
                      setSubModalOpen(true);
                    }}
                    className="w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-colors"
                  >
                    Revoke Pass
                  </button>
                )}
              </div>
            </div>

            {/* Payment Orders Table */}
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-brand-primary" />
                Payment & Approval History ({dossier?.paymentRequests?.length || 0})
              </h4>

              {(!dossier?.paymentRequests || dossier.paymentRequests.length === 0) ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700/40">
                  No payment verification requests recorded for this student yet.
                </p>
              ) : (
                <div className="rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Order Type & Title</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Transaction ID / UTR</th>
                        <th className="px-4 py-3">Method</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                      {dossier.paymentRequests.map((pr) => (
                        <tr key={pr.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="px-4 py-3 font-sans">
                            <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                              {pr.courseTitle || (pr.planId ? `Pro Plan (${pr.planId})` : 'NEC Pro One')}
                            </span>
                            <span className="text-[10px] text-slate-500 uppercase">{pr.type}</span>
                          </td>
                          <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">₹{pr.amount}</td>
                          <td className="px-4 py-3 text-slate-800 dark:text-slate-200">{pr.transactionId}</td>
                          <td className="px-4 py-3 uppercase">{pr.paymentMethod}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                pr.status === 'approved'
                                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                  : pr.status === 'rejected'
                                  ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                                  : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                              }`}
                            >
                              {pr.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                            {new Date(pr.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ================= SECTION 1: PROBLEM PRACTICE & DSA SUBMISSIONS ================= */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-emerald-500/30 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700/60 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                    Problem Practice & DSA Coding Activity
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Comprehensive overview of practice problem submissions, topic coverage, and difficulty distribution.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono text-xs font-bold border border-emerald-500/40">
                    {totalSolved} Solved Total
                  </span>
                </div>
              </div>

              {/* Difficulty Breakdown Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Easy Solved</span>
                  <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">{easySolved}</span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Medium Solved</span>
                  <span className="text-base font-extrabold text-amber-600 dark:text-amber-400">{mediumSolved}</span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Hard Solved</span>
                  <span className="text-base font-extrabold text-rose-600 dark:text-rose-400">{hardSolved}</span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Active Streak</span>
                  <span className="text-base font-extrabold text-orange-500 dark:text-orange-400 flex items-center justify-center gap-1">
                    <Flame className="w-3.5 h-3.5 fill-orange-500 dark:fill-orange-400" /> {dossier?.student?.learningStreak || 7}d
                  </span>
                </div>
              </div>

              {/* Recent Practice Submissions Table */}
              {(!dossier?.submissions || dossier.submissions.length === 0) ? (
                <div className="p-5 rounded-xl bg-white dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 text-xs text-center border border-slate-200 dark:border-slate-700/40">
                  No practice problem submissions recorded yet for this student.
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-[11px] uppercase">
                      <tr>
                        <th className="px-4 py-2.5">Problem Title</th>
                        <th className="px-4 py-2.5">Difficulty</th>
                        <th className="px-4 py-2.5">Language</th>
                        <th className="px-4 py-2.5">Status</th>
                        <th className="px-4 py-2.5">Submitted On</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                      {dossier.submissions.slice(0, 5).map((sub) => (
                        <tr key={sub.id} className="hover:bg-slate-100 dark:hover:bg-slate-800/40">
                          <td className="px-4 py-2.5 font-sans font-semibold text-slate-900 dark:text-slate-100">
                            {sub.problem?.title || 'Algorithm Practice Problem'}
                          </td>
                          <td className="px-4 py-2.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                sub.problem?.difficulty?.toLowerCase() === 'hard'
                                  ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30'
                                  : sub.problem?.difficulty?.toLowerCase() === 'medium'
                                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                                  : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30'
                              }`}
                            >
                              {sub.problem?.difficulty || 'Medium'}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 uppercase text-slate-700 dark:text-slate-300">{sub.language}</td>
                          <td className="px-4 py-2.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                sub.status?.toUpperCase() === 'ACCEPTED'
                                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {sub.status?.toUpperCase() === 'ACCEPTED' ? 'ACCEPTED ✓' : sub.status}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">
                            {new Date(sub.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ================= SECTION 2: WEEKLY CONTEST PERFORMANCE ================= */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-amber-500/30 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700/60 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                    Sunday Weekly Contest Performance & Standing
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Contest problem solutions, arena rank, finish time, and 100🪙 Grand Bounty achievement.
                  </p>
                </div>
                <div>
                  {(studentContestSolved.length >= 2 || (studentLeaderboardEntry && studentLeaderboardEntry.problemsSolved >= 2)) ? (
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono text-xs font-bold border border-amber-500/40 flex items-center gap-1">
                      👑 100🪙 GRAND BOUNTY WON
                    </span>
                  ) : studentContestSolved.length === 1 ? (
                    <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-700 dark:text-blue-300 font-mono text-xs font-bold border border-blue-500/40 flex items-center gap-1">
                      ⚡ Q1 Solved (1/2)
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 font-mono text-xs">
                      Ready for Sunday Contest #{contestConfig.contestNumber}
                    </span>
                  )}
                </div>
              </div>

              {/* Contest Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Contest Edition</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">#{contestConfig.contestNumber} Edition</span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Questions Solved</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                        studentContestSolved.includes(1) || (studentLeaderboardEntry && studentLeaderboardEntry.problemsSolved >= 1)
                          ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-600'
                      }`}
                    >
                      Q1 {studentContestSolved.includes(1) || (studentLeaderboardEntry && studentLeaderboardEntry.problemsSolved >= 1) ? '✓' : '-'}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                        studentContestSolved.includes(2) || (studentLeaderboardEntry && studentLeaderboardEntry.problemsSolved >= 2)
                          ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-600'
                      }`}
                    >
                      Q2 {studentContestSolved.includes(2) || (studentLeaderboardEntry && studentLeaderboardEntry.problemsSolved >= 2) ? '✓' : '-'}
                    </span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Leaderboard Rank</span>
                  <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                    {studentLeaderboardEntry ? `#${studentLeaderboardEntry.rank} (${studentLeaderboardEntry.badge})` : 'Unranked'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Contest Score</span>
                  <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                    {studentLeaderboardEntry ? `${studentLeaderboardEntry.score} pts` : `${studentContestSolved.length * 500} pts`}
                  </span>
                </div>
              </div>
            </div>

            {/* ================= SECTION 3: REWARDS STORE CLAIMS & COIN WALLET ================= */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-purple-500/30 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700/60 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Gift className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                    Rewards Store Claims & Coins Wallet
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Live balance of NEC Coins, daily streak claim status, unlocked discount coupons, free course grants, and swag orders.
                  </p>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/40 text-xs flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5" />
                    {studentWallet?.coins ?? dossier?.student?.points ?? 0} NEC Coins
                  </span>
                </div>
              </div>

              {/* Wallet Summary Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Current Coins</span>
                  <span className="text-base font-extrabold text-amber-500 dark:text-amber-400">
                    {studentWallet?.coins ?? dossier?.student?.points ?? 0} 🪙
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Daily Streak</span>
                  <span className="text-base font-extrabold text-orange-500 dark:text-orange-400 flex items-center justify-center gap-1">
                    <Flame className="w-3.5 h-3.5 fill-orange-500 dark:fill-orange-400" /> {studentWallet?.dailyStreak ?? dossier?.student?.learningStreak ?? 0}d
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Claimed Coupons</span>
                  <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                    {studentWallet?.unlockedCoupons?.length || 0}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Swag Shipments</span>
                  <span className="text-base font-extrabold text-purple-600 dark:text-purple-400">
                    {studentWallet?.swagOrders?.length || 0}
                  </span>
                </div>
              </div>

              {/* 3.1 Unlocked Discount Coupons */}
              <div className="space-y-2.5">
                <h5 className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" /> Claimed Discount Coupons ({studentWallet?.unlockedCoupons?.length || 0})
                </h5>

                {(!studentWallet?.unlockedCoupons || studentWallet.unlockedCoupons.length === 0) ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700/40">
                    No discount coupons claimed by this student yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {studentWallet.unlockedCoupons.map((c, i) => (
                      <div key={i} className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-amber-500/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono text-[10px] font-bold">
                            {c.discount}% OFF VOUCHER
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                            {new Date(c.unlockedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{c.title}</div>
                        <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between font-mono text-xs">
                          <span className="text-amber-700 dark:text-amber-300 font-bold tracking-wider">{c.code}</span>
                          <button
                            onClick={() => handleCopyCode(c.code)}
                            className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 text-[10px] font-bold flex items-center gap-1 transition-colors"
                          >
                            {copiedCode === c.code ? <CheckCircle2 className="w-3 h-3 text-emerald-500 dark:text-emerald-400" /> : <Tag className="w-3 h-3" />}
                            <span>{copiedCode === c.code ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3.2 Unlocked Free Courses */}
              <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-700/60">
                <h5 className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" /> Claimed Free Pro Courses ({studentWallet?.unlockedCourses?.length || 0})
                </h5>

                {(!studentWallet?.unlockedCourses || studentWallet.unlockedCourses.length === 0) ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700/40">
                    No course redemptions made via coin store yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {studentWallet.unlockedCourses.map((slug, i) => (
                      <div key={i} className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-sky-500/30 flex items-center justify-between gap-3">
                        <div>
                          <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-700 dark:text-sky-300 font-mono text-[10px] font-bold block w-fit mb-1">
                            FULL ACCESS
                          </span>
                          <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{slug}</div>
                        </div>
                        <Link
                          to={`/courses/${slug}`}
                          target="_blank"
                          className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-700 dark:text-sky-300 text-xs font-mono font-bold flex items-center gap-1 transition-colors shrink-0"
                        >
                          <span>View</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3.3 Physical Swag Merchandise Deliveries */}
              <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-700/60">
                <h5 className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" /> Official Swag Merchandise Shipments ({studentWallet?.swagOrders?.length || 0})
                </h5>

                {(!studentWallet?.swagOrders || studentWallet.swagOrders.length === 0) ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700/40">
                    No physical merchandise orders placed by this student yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {studentWallet.swagOrders.map((o) => (
                      <div key={o.id} className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-purple-500/30 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <span>{o.rewardTitle}</span>
                            <span className="text-[11px] font-mono text-purple-600 dark:text-purple-300">({o.coinsCost} 🪙 Paid)</span>
                          </div>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                              o.status === 'Delivered'
                                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                : o.status === 'Shipped'
                                ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                                : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            <Truck className="w-3 h-3 inline-block mr-1" />
                            {o.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/60">
                          <div><strong className="text-slate-500 dark:text-slate-400">Recipient:</strong> {o.fullName} ({o.phone})</div>
                          <div><strong className="text-slate-500 dark:text-slate-400">Address:</strong> {o.address}, {o.city} ({o.pincode})</div>
                          {o.trackingNumber && (
                            <div className="col-span-1 sm:col-span-2 text-emerald-600 dark:text-emerald-400">
                              <strong>Tracking ID:</strong> {o.trackingNumber}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* Tab: Courses */}
        {activeTab === 'courses' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Enrolled Courses ({dossier?.enrollments.length || 0})
              </h4>
              <button
                onClick={openEnrollModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-primary/10 border border-brand-primary/30 text-brand-primary hover:bg-brand-primary/20 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Manually Enroll Course</span>
              </button>
            </div>

            {dossier?.enrollments.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-8">
                Student is not currently enrolled in any course.
              </p>
            ) : (
              dossier?.enrollments.map((enr) => (
                <div
                  key={enr.id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-brand-primary font-bold text-sm shrink-0">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {enr.course?.title || 'Unknown Course'}
                        </h4>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded uppercase font-bold ${
                            enr.tier === 'pro'
                              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {enr.tier === 'pro' ? 'Pro Access' : 'Free Tier'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {enr.course?.category} · {enr.course?.level}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 sm:text-right">
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{enr.progress}% Complete</div>
                      <div className="w-32 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full bg-brand-primary rounded-full transition-all"
                          style={{ width: `${enr.progress}%` }}
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveEnrollment(enr.id, enr.course?.title || 'Course')}
                      className="p-2 rounded-lg text-rose-500 dark:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Remove student course enrollment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab: Quizzes */}
        {activeTab === 'quizzes' && (
          <div className="space-y-3">
            {dossier?.quizAttempts.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-8">No quiz attempts recorded.</p>
            ) : (
              dossier?.quizAttempts.map((qa) => (
                <div
                  key={qa.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        qa.passed ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {qa.passed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {qa.quiz?.title || 'Quiz Assessment'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Pass Threshold: {qa.quiz?.passingScore}% · Time Taken: {Math.round(qa.timeTaken)}s
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-sm font-extrabold ${
                        qa.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {qa.percentage}% ({qa.score} pts)
                    </span>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {new Date(qa.completedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab: DSA */}
        {activeTab === 'dsa' && (
          <div className="space-y-3">
            {dossier?.submissions.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-8">No problem submissions yet.</p>
            ) : (
              dossier?.submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {sub.problem?.title || 'Coding Problem'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {sub.problem?.difficulty} · {sub.language} · {sub.runtime}ms · {sub.memory}MB
                    </p>
                  </div>

                  <div className="text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                        sub.status === 'Accepted'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {sub.status}
                    </span>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                      {new Date(sub.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab: Certificates */}
        {activeTab === 'certificates' && (
          <div className="space-y-3">
            {dossier?.certificates.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-8">No issued certificates yet.</p>
            ) : (
              dossier?.certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{cert.courseName}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">ID: {cert.certificateId}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-mono block">
                      Issued: {new Date(cert.issueDate).toLocaleDateString()}
                    </span>
                    {cert.verificationUrl && (
                      <a
                        href={cert.verificationUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-brand-primary font-bold hover:underline inline-flex items-center gap-1 mt-1"
                      >
                        Verify Certificate
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab: Achievements */}
        {activeTab === 'achievements' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {dossier?.achievements.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-8 col-span-full">
                No achievements unlocked yet.
              </p>
            ) : (
              dossier?.achievements.map((ach) => (
                <div
                  key={ach.id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-center gap-3"
                >
                  <div className="text-2xl">{ach.achievement?.icon || '🏆'}</div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {ach.achievement?.name || 'Achievement'}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                      {ach.achievement?.description}
                    </p>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold font-mono">
                      +{ach.achievement?.points} XP
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab: Points */}
        {activeTab === 'points' && (
          <div className="space-y-2 font-mono text-xs">
            {dossier?.pointTransactions.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-8">No point transactions logged.</p>
            ) : (
              dossier?.pointTransactions.map((pt) => (
                <div
                  key={pt.id}
                  className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between"
                >
                  <span className="text-slate-700 dark:text-slate-300">{pt.description}</span>
                  <div className="flex items-center gap-4">
                    <span
                      className={`font-bold ${
                        pt.amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {pt.amount >= 0 ? `+${pt.amount}` : pt.amount} XP
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {new Date(pt.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* MODAL 1: Manage Pro Subscription Modal */}
      {subModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-500 dark:text-amber-400">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {subAction === 'revoke'
                    ? 'Revoke Pro Membership'
                    : subAction === 'extend'
                    ? 'Extend Pro Membership'
                    : 'Grant Pro Membership'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{student.name} ({student.email})</p>
              </div>
            </div>

            <form onSubmit={handleUpdateSubscription} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Action</label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setSubAction('grant')}
                    className={`py-2 rounded-xl font-bold border transition-colors ${
                      subAction === 'grant'
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Grant New
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubAction('extend')}
                    className={`py-2 rounded-xl font-bold border transition-colors ${
                      subAction === 'extend'
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Extend
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubAction('revoke')}
                    className={`py-2 rounded-xl font-bold border transition-colors ${
                      subAction === 'revoke'
                        ? 'bg-rose-500 text-white border-rose-400'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Revoke
                  </button>
                </div>
              </div>

              {subAction !== 'revoke' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Select Plan Track</label>
                    <select
                      value={subPlan}
                      onChange={(e) => setSubPlan(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-primary"
                    >
                      <option value="lifetime">👑 NEC Pro One 3-Year Pass (3 Years Full Access)</option>
                      <option value="yearly">⭐ NEC Pro One Yearly Pass (1 Year)</option>
                      <option value="monthly">⚡ NEC Pro One Monthly Pass (30 Days)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Custom Expiry Date (Optional override)
                    </label>
                    <input
                      type="date"
                      value={subCustomDate}
                      onChange={(e) => setSubCustomDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                </>
              )}

              {subAction === 'revoke' && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs">
                  ⚠️ This will immediately revoke the student’s VIP Pro status. They will lose access to Pro-exclusive courses and video player locks.
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setSubModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={subSubmitting}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition-colors ${
                    subAction === 'revoke'
                      ? 'bg-rose-500 hover:bg-rose-400 text-white'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  }`}
                >
                  {subSubmitting ? 'Saving...' : subAction === 'revoke' ? 'Confirm Revoke' : 'Save Pro Pass'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Manual Course Enrollment Modal */}
      {enrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-brand-primary/20 text-brand-primary">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Manual Course Enrollment</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Enroll {student.name} into any course</p>
              </div>
            </div>

            <form onSubmit={handleManualEnroll} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Select Course</label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-primary"
                >
                  {allCourses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} (/{c.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Enrollment Track / Tier</label>
                <select
                  value={enrollTier}
                  onChange={(e) => setEnrollTier(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-primary"
                >
                  <option value="pro">👑 Pro Track (Full Lectures, Projects & Certificate)</option>
                  <option value="free">Free Tier (Introductory curriculum access)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setEnrollModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={enrollSubmitting || !selectedCourseId}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-brand-primary hover:bg-brand-primary/90 text-white transition-colors"
                >
                  {enrollSubmitting ? 'Enrolling...' : 'Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Comprehensive Edit Student Profile & Credentials Modal */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-brand-primary/20 text-brand-primary">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>Edit Student Profile & Governance</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/30">
                      ID: {id?.slice(-6)}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Update personal information, college, role, coins balance, daily streak, and credentials.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setProfileModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {/* Section 1: Avatar & Basic Information */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3">
                <h4 className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-brand-primary" /> 1. Personal & College Details
                </h4>

                {/* Avatar Preview & Quick Select */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700/40">
                  <img
                    src={editAvatar || student.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120'}
                    alt="Preview"
                    className="w-12 h-12 rounded-full object-cover border-2 border-brand-primary shrink-0 shadow"
                  />
                  <div className="flex-1 space-y-1.5">
                    <label className="block text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400">
                      Profile Avatar URL
                    </label>
                    <input
                      type="text"
                      value={editAvatar}
                      onChange={(e) => setEditAvatar(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-brand-primary"
                    />
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Quick Avatars:</span>
                      {[
                        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120',
                        'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=120',
                        'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=120',
                        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
                      ].map((presetUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setEditAvatar(presetUrl)}
                          className="w-5 h-5 rounded-full overflow-hidden border border-slate-300 dark:border-slate-600 hover:border-brand-primary transition-all"
                        >
                          <img src={presetUrl} alt="Preset" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      required
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">College / University</label>
                    <input
                      type="text"
                      value={editCollege}
                      onChange={(e) => setEditCollege(e.target.value)}
                      placeholder="e.g. IIT Delhi, BITS Pilani, NIT Trichy"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Account Role <span className="text-[10px] text-amber-500 font-normal">(Master Admin is exclusive to Owner)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setEditRole('student')}
                        className={`py-2 px-1 rounded-xl text-xs font-bold border transition-colors ${
                          editRole === 'student'
                            ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/40 shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Student
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditRole('sub_admin');
                          const randNum = Math.floor(Math.random() * 9999) + 9;
                          setEditPassword(`NEC@${randNum}SubAdmin`);
                        }}
                        className={`py-2 px-1 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                          editRole === 'sub_admin'
                            ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 shadow-sm ring-1 ring-emerald-500/40'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        Sub-Admin
                      </button>
                    </div>

                    {editRole === 'sub_admin' && (
                      <div className="mt-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-2">
                        <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-400">
                          <ShieldCheck className="w-4 h-4 shrink-0" />
                          <span>Sub-Admin Privilege Scope (Content Manager)</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                          This user will have permission to manage <strong>Tutorials, Video Courses, Modules, Lessons, DSA Problems, Quizzes, Projects, Contests, and Community Posts</strong>.
                          <br />
                          <span className="text-emerald-700 dark:text-emerald-400 font-semibold">🔒 Protected:</span> Personal student records, payments, revenue, and system settings remain strictly locked.
                        </p>
                        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-emerald-500/20">
                          <span className="text-[10.5px] text-slate-500 dark:text-slate-400">
                            📧 Congratulation email with login credentials will be delivered to <strong>{editEmail || dossier?.student?.email}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const randNum = Math.floor(Math.random() * 9999) + 9;
                              const randomPass = `NEC@${randNum}SubAdmin`;
                              setEditPassword(randomPass);
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1 cursor-pointer"
                          >
                            <Key className="w-3 h-3" /> Auto-Gen Password ({editPassword || 'NEC@...SubAdmin'})
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 2: Wallet, Coins & Streaks */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-amber-500/30 space-y-3">
                <h4 className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5" /> 2. NEC Coins & Learning Streak Balance
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">NEC Coins Balance</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={editPoints}
                        onChange={(e) => setEditPoints(Number(e.target.value))}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-600 dark:text-amber-400 focus:outline-none focus:border-amber-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs">🪙</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Daily Streak Days</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={editStreak}
                        onChange={(e) => setEditStreak(Number(e.target.value))}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-orange-600 dark:text-orange-400 focus:outline-none focus:border-orange-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs">🔥</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Account Status</label>
                    <button
                      type="button"
                      onClick={() => setEditIsActive(!editIsActive)}
                      className={`w-full py-2 rounded-xl text-xs font-bold border transition-colors ${
                        editIsActive
                          ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40'
                      }`}
                    >
                      {editIsActive ? 'Active Account ✓' : 'Suspended Account ✗'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 3: Bio & Social Profiles */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3">
                <h4 className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" /> 3. Bio & Professional Links
                </h4>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Bio Description</label>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    rows={2}
                    placeholder="Short bio about the student..."
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Skills (comma separated)</label>
                  <input
                    type="text"
                    value={editSkills}
                    onChange={(e) => setEditSkills(e.target.value)}
                    placeholder="React, TypeScript, Python, Node.js, C++, Docker"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">GitHub URL</label>
                    <input
                      type="text"
                      value={editGithub}
                      onChange={(e) => setEditGithub(e.target.value)}
                      placeholder="https://github.com/username"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">LinkedIn URL</label>
                    <input
                      type="text"
                      value={editLinkedin}
                      onChange={(e) => setEditLinkedin(e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Direct Password Reset Override */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <label className="block text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" /> Direct Password Reset Override
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Enter new password (leave blank to keep current password unchanged)"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-400"
                />
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  Must be at least 6 characters. If changed, the student can log in with this new password immediately without requiring email OTP.
                </span>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profileSubmitting}
                  className="px-6 py-2 rounded-xl text-xs font-bold bg-brand-primary hover:bg-brand-primary/90 text-white transition-all shadow-md shadow-brand-primary/20 flex items-center gap-1.5"
                >
                  {profileSubmitting ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account Deactivate / Activate Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        onConfirm={handleToggleStatus}
        title={student.isActive ? 'Deactivate Student Account?' : 'Activate Student Account?'}
        itemName={student.name}
        description={
          student.isActive
            ? 'Deactivating this account will prevent the student from logging in and accessing platform materials until reactivated by an administrator.'
            : 'Activating this account will restore the student’s access to login and resume learning immediately.'
        }
        confirmText={student.isActive ? 'Deactivate Account' : 'Activate Account'}
      />
    </div>
  );
};
