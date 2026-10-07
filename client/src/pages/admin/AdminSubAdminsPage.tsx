import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  UserPlus,
  Key,
  Eye,
  EyeOff,
  Copy,
  Check,
  Crown,
  Search,
  ExternalLink,
  GraduationCap,
  Lock,
  RefreshCw,
  UserX,
} from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { AdminSubAdminItem, AdminSubAdminsResponse } from '../../types/admin.types';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminDataTable, Column } from '../../components/admin/AdminDataTable';
import { AdminStatusBadge } from '../../components/admin/AdminStatusBadge';
import { DeleteConfirmModal } from '../../components/admin/DeleteConfirmModal';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';

export const AdminSubAdminsPage: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast();
  const [data, setData] = useState<AdminSubAdminsResponse | null>(null);
  const [subAdmins, setSubAdmins] = useState<AdminSubAdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Appoint Modal State
  const [appointModalOpen, setAppointModalOpen] = useState(false);
  const [appointSource, setAppointSource] = useState<'student' | 'mentor' | 'direct'>('student');
  const [appointEmail, setAppointEmail] = useState('');
  const [appointName, setAppointName] = useState('');
  const [appointPassword, setAppointPassword] = useState('');
  const [appointCollege, setAppointCollege] = useState('');
  const [appointBio, setAppointBio] = useState('');
  const [submittingAppoint, setSubmittingAppoint] = useState(false);

  // Change Password Modal State
  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [selectedSubAdmin, setSelectedSubAdmin] = useState<AdminSubAdminItem | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [submittingPw, setSubmittingPw] = useState(false);

  // Demote Confirmation Modal State
  const [demoteModalOpen, setDemoteModalOpen] = useState(false);
  const [demotingSubAdmin, setDemotingSubAdmin] = useState<AdminSubAdminItem | null>(null);
  const [submittingDemote, setSubmittingDemote] = useState(false);

  useEffect(() => {
    fetchSubAdmins();
  }, []);

  const fetchSubAdmins = async () => {
    try {
      setLoading(true);
      const res = await adminService.getSubAdmins();
      setData(res);
      setSubAdmins(res.subAdmins || []);
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to fetch Sub-Admins list');
    } finally {
      setLoading(false);
    }
  };

  const generateRandomPassword = () => {
    const randNum = Math.floor(Math.random() * 9999) + 9;
    return `NEC@${randNum}SubAdmin`;
  };

  const handleOpenAppoint = () => {
    setAppointSource('student');
    setAppointEmail('');
    setAppointName('');
    setAppointPassword(generateRandomPassword());
    setAppointCollege('NextEra Technical Delegate');
    setAppointBio('Official NextEra Coders Sub-Admin & Content Curator.');
    setAppointModalOpen(true);
  };

  const handleSelectMentor = (mentor: { name: string; image?: string; role?: string }) => {
    setAppointSource('mentor');
    setAppointName(mentor.name);
    setAppointEmail(`${mentor.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@nexteracoders.com`);
    setAppointCollege(`${mentor.role || 'Industry Mentor'} • NextEra Faculty`);
    setAppointBio(`Official NextEra Coders Mentor & Sub-Admin.`);
    setAppointPassword(generateRandomPassword());
  };

  const handleSubmitAppoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointEmail || !appointEmail.trim()) {
      toastError('Email is required');
      return;
    }
    if (appointPassword && appointPassword.trim().length > 0 && appointPassword.trim().length < 6) {
      toastError('If setting a custom password, it must be at least 6 characters');
      return;
    }

    try {
      setSubmittingAppoint(true);
      await adminService.appointSubAdmin({
        email: appointEmail.trim(),
        name: appointName.trim() || undefined,
        password: appointPassword.trim() || undefined,
        college: appointCollege.trim() || undefined,
        bio: appointBio.trim() || undefined,
        source: appointSource,
      });

      toastSuccess(`Sub-Admin appointed successfully! User can login with their normal existing password.`);
      setAppointModalOpen(false);
      fetchSubAdmins();
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to appoint sub-admin');
    } finally {
      setSubmittingAppoint(false);
    }
  };

  const handleOpenChangePw = (s: AdminSubAdminItem) => {
    setSelectedSubAdmin(s);
    setNewPassword(generateRandomPassword());
    setPwModalOpen(true);
  };

  const handleSubmitChangePw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubAdmin) return;
    if (!newPassword || newPassword.trim().length < 6) {
      toastError('Password must be at least 6 characters');
      return;
    }

    try {
      setSubmittingPw(true);
      await adminService.updateSubAdminPassword(selectedSubAdmin.id, newPassword.trim());
      toastSuccess(`Password for ${selectedSubAdmin.name} updated successfully!`);
      setPwModalOpen(false);
      fetchSubAdmins();
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to update sub-admin password');
    } finally {
      setSubmittingPw(false);
    }
  };

  const handleOpenDemote = (s: AdminSubAdminItem) => {
    setDemotingSubAdmin(s);
    setDemoteModalOpen(true);
  };

  const handleConfirmDemote = async () => {
    if (!demotingSubAdmin) return;
    try {
      setSubmittingDemote(true);
      await adminService.demoteSubAdmin(demotingSubAdmin.id);
      toastSuccess(`${demotingSubAdmin.name} has been revoked of Sub-Admin privileges.`);
      setDemoteModalOpen(false);
      fetchSubAdmins();
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to revoke sub-admin status');
    } finally {
      setSubmittingDemote(false);
    }
  };

  const togglePasswordReveal = (id: string) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopyPassword = (id: string, text?: string) => {
    if (!text) {
      toastError('Password not available to copy');
      return;
    }
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toastSuccess('Password copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const filteredSubAdmins = subAdmins.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      (s.college && s.college.toLowerCase().includes(q))
    );
  });

  const columns: Column<AdminSubAdminItem>[] = [
    {
      header: 'Sub-Administrator',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200">
              {row.profileImage ? (
                <img
                  src={row.profileImage}
                  alt={row.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                row.name.slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] shadow-sm ring-1 ring-white dark:ring-slate-900" title="Active Sub-Admin">
              🛡️
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{row.name}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Sub-Admin
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{row.email}</p>
            {row.college && (
              <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                <GraduationCap className="w-3 h-3" /> {row.college}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Origin & Appointment',
      render: (row) => (
        <div className="space-y-1 text-xs">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
            row.initialRoleSource === 'mentor'
              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
              : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
          }`}>
            {row.initialRoleSource === 'mentor' ? '🎓 Appointed Mentor' : '👨‍🎓 Appointed Student'}
          </span>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            By: <span className="font-medium text-slate-700 dark:text-slate-300">{row.appointedBy}</span>
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            {new Date(row.appointedAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
      ),
    },
    {
      header: 'Password (Master Access)',
      render: (row) => {
        const isRevealed = Boolean(revealedPasswords[row.id]);
        const plainPw = row.plainPassword || '';
        const passwordDisplay = isRevealed ? (plainPw || '••••••••') : '••••••••••••';

        return (
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
              <Key className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 min-w-[100px] select-all">
                {passwordDisplay}
              </span>
              <button
                type="button"
                onClick={() => togglePasswordReveal(row.id)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                title={isRevealed ? 'Hide Password' : 'Show Password'}
              >
                {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => handleCopyPassword(row.id, plainPw)}
                className="p-1 rounded text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                title="Copy Password"
              >
                {copiedId === row.id ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <div>
              <button
                type="button"
                onClick={() => handleOpenChangePw(row)}
                className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Change Password</span> →
              </button>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Authority Scope',
      render: () => (
        <div className="space-y-1 text-xs">
          <div className="flex flex-wrap gap-1 max-w-xs">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              ✓ Courses & Lessons
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              ✓ DSA Problems
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              ✓ Community
            </span>
          </div>
          <span className="text-[10px] text-rose-500 dark:text-rose-400 flex items-center gap-1 font-medium">
            <Lock className="w-2.5 h-2.5" /> Settings & Payments Locked
          </span>
        </div>
      ),
    },
    {
      header: 'Status',
      render: (row) => <AdminStatusBadge status={row.isActive ? 'ACTIVE' : 'INACTIVE'} />,
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Link
            to={`/admin/students/${row.id}`}
            className="p-1.5 rounded-lg text-slate-500 hover:text-brand-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="View Full Dossier"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
          <button
            onClick={() => handleOpenChangePw(row)}
            className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
            title="Reset Password"
          >
            <Key className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenDemote(row)}
            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            title="Demote to Student"
          >
            <UserX className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <AdminPageHeader
        title="Sub-Administrators Management"
        description="Appoint trusted mentors or students as Sub-Admins with strict content delegation boundaries. Only NextEra Coders owner (nexteracoders@gmail.com) has full platform governance."
        action={
          <div className="flex items-center gap-2">
            <Button
              onClick={fetchSubAdmins}
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </Button>
            <Button
              onClick={handleOpenAppoint}
              variant="primary"
              size="sm"
              className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Appoint Sub-Admin</span>
            </Button>
          </div>
        }
      />

      {/* 👑 MASTER PLATFORM OWNER STATUS CARD */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg shadow-amber-500/20 shrink-0">
              <Crown className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  NextEra Coders • Master Platform Owner
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500 text-slate-950 shadow-xs">
                  ★ SOLE MASTER ADMIN
                </span>
              </div>
              <p className="text-xs font-mono font-semibold text-amber-700 dark:text-amber-400 mt-1">
                Owner Email: {data?.superAdmin?.email || 'nexteracoders@gmail.com'}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Platform ownership and critical governance (Server Health, Audit Logs, Settings, System Financials, and Sub-Admin Password Control) are strictly locked to you. Sub-Admins can create and curate content but cannot modify security or platform-wide policies.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-4 py-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-amber-500/20 text-center">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400 block">
                Total Sub-Admins
              </span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {subAdmins.length}
              </span>
            </div>
            <div className="px-4 py-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-amber-500/20 text-center">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400 block">
                Owner Security
              </span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1 mt-1">
                <ShieldCheck className="w-4 h-4" /> 100% Locked
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK MENTORS PROMOTION CAROUSEL / STRIP */}
      {data?.availableMentors && data.availableMentors.length > 0 && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-purple-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Quick Appoint From Published Mentors
              </h4>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Click a mentor to immediately prepare Sub-Admin credentials
            </span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-thin">
            {data.availableMentors.map((m) => {
              const alreadySubAdmin = subAdmins.some(
                (sa) => sa.name.toLowerCase() === m.name.toLowerCase()
              );
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-2.5 p-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 shrink-0 hover:border-purple-500/50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-300">
                    {m.image ? (
                      <img src={m.image} alt={m.name} className="w-full h-full object-cover" />
                    ) : (
                      m.name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[130px]">{m.name}</p>
                    <p className="text-[10px] text-slate-500 truncate max-w-[130px]">{m.role}</p>
                  </div>
                  {alreadySubAdmin ? (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      ✓ Appointed
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        handleSelectMentor(m);
                        setAppointModalOpen(true);
                      }}
                      className="px-2 py-1 rounded-md text-[10px] font-bold bg-purple-600 hover:bg-purple-700 text-white transition-colors cursor-pointer"
                    >
                      + Make Sub-Admin
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB ADMINS TABLE */}
      <AdminDataTable
        data={filteredSubAdmins}
        columns={columns}
        loading={loading}
        actions={
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, college..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
        }
        emptyTitle="No Sub-Admins appointed yet"
        emptyDescription="Appoint your first Sub-Admin from students or mentors using the button above."
      />

      {/* 🛡️ MODAL: APPOINT SUB-ADMIN */}
      {appointModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Appoint Sub-Administrator
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Delegates will only receive Content & Moderation access. Master Admin remains owner.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAppointModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {/* Source Tab Toggle */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300">
              <button
                type="button"
                onClick={() => setAppointSource('student')}
                className={`py-1.5 rounded-lg transition-all ${
                  appointSource === 'student'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                From Student
              </button>
              <button
                type="button"
                onClick={() => setAppointSource('mentor')}
                className={`py-1.5 rounded-lg transition-all ${
                  appointSource === 'mentor'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                From Mentor
              </button>
              <button
                type="button"
                onClick={() => setAppointSource('direct')}
                className={`py-1.5 rounded-lg transition-all ${
                  appointSource === 'direct'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Direct Invite
              </button>
            </div>

            <form onSubmit={handleSubmitAppoint} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Candidate Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={appointName}
                    onChange={(e) => setAppointName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Candidate Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={appointEmail}
                    onChange={(e) => setAppointEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Sub-Admin Password (Format: NEC@...SubAdmin) *
                  </label>
                  <button
                    type="button"
                    onClick={() => setAppointPassword(generateRandomPassword())}
                    className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    🎲 Regenerate Format Password
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={appointPassword}
                    onChange={(e) => setAppointPassword(e.target.value)}
                    placeholder="NEC@...SubAdmin"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  {appointPassword && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(appointPassword);
                        toastSuccess('Password copied to clipboard!');
                      }}
                      className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-emerald-500"
                      title="Copy Password"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1.5 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Sub-Admin bante hi unka password reset ho jayega aur yahi credentials unke registered email par deliver honge.
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Designation / College
                  </label>
                  <input
                    type="text"
                    value={appointCollege}
                    onChange={(e) => setAppointCollege(e.target.value)}
                    placeholder="e.g. Senior Tech Mentor"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Delegation Note / Bio
                  </label>
                  <input
                    type="text"
                    value={appointBio}
                    onChange={(e) => setAppointBio(e.target.value)}
                    placeholder="e.g. Lead DSA Problem Author"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Permissions Guarantee Badge */}
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Strict Security Guarantee</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                  Sub-Admins <strong>CANNOT</strong> access System Settings, Audit Logs, Server Health, Payments, Anti-Cheat, or promote/demote anyone. They will only see content creation tools (Courses, Modules, Lessons, DSA Problems, Quizzes, Community).
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAppointModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submittingAppoint}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {submittingAppoint ? 'Appointing...' : 'Confirm Sub-Admin Appointment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🔑 MODAL: CHANGE SUB-ADMIN PASSWORD */}
      {pwModalOpen && selectedSubAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Reset Sub-Admin Password
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {selectedSubAdmin.name} ({selectedSubAdmin.email})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPwModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitChangePw} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    New Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewPassword(generateRandomPassword())}
                    className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline font-semibold cursor-pointer"
                  >
                    🎲 Generate NEC@...SubAdmin
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(newPassword);
                      toastSuccess('Password copied to clipboard!');
                    }}
                    className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-amber-500"
                    title="Copy Password"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  The password will immediately become active for their login and be recorded in your dashboard.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPwModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submittingPw}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {submittingPw ? 'Saving...' : 'Update Password'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🚫 MODAL: DEMOTE SUB-ADMIN */}
      {demoteModalOpen && demotingSubAdmin && (
        <DeleteConfirmModal
          isOpen={demoteModalOpen}
          onClose={() => setDemoteModalOpen(false)}
          onConfirm={handleConfirmDemote}
          title="Revoke Sub-Admin Privileges?"
          description={`Are you sure you want to demote ${demotingSubAdmin.name} back to Student? They will immediately lose access to all content management and moderation capabilities.`}
          confirmText={submittingDemote ? 'Revoking...' : 'Revoke & Return to Student'}
        />
      )}
    </div>
  );
};
