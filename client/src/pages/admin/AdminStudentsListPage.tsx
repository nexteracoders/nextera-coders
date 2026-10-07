import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Eye,
  UserCheck,
  UserX,
  Flame,
  Award,
  BookOpen,
  Crown,
  ShieldCheck,
} from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { AdminStudentItem } from '../../types/admin.types';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminDataTable, Column } from '../../components/admin/AdminDataTable';
import { AdminStatusBadge } from '../../components/admin/AdminStatusBadge';
import { DeleteConfirmModal } from '../../components/admin/DeleteConfirmModal';

export const AdminStudentsListPage: React.FC = () => {
  const [students, setStudents] = useState<AdminStudentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [membershipFilter, setMembershipFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 15,
  });

  // Activation / Deactivation modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [targetStudent, setTargetStudent] = useState<AdminStudentItem | null>(null);

  useEffect(() => {
    fetchStudents(1);
  }, [search, statusFilter, membershipFilter, roleFilter]);

  const fetchStudents = async (page = 1) => {
    try {
      setLoading(true);
      const res = await adminService.getStudents({
        page,
        limit: pagination.limit,
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        ...(membershipFilter !== 'all' ? { membership: membershipFilter } : {}),
        ...(roleFilter !== 'all' ? { role: roleFilter } : {}),
      } as any);
      setStudents(res.students || []);
      setPagination(res.pagination);
    } catch (err) {
      console.error('Failed to fetch students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!targetStudent) return;
    const newStatus = !targetStudent.isActive;
    try {
      await adminService.updateStudentStatus(targetStudent.id, newStatus);
      fetchStudents(pagination.currentPage);
    } catch (err) {
      console.error('Failed to update student status:', err);
    }
  };

  const columns: Column<AdminStudentItem>[] = [
    {
      header: 'Student',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold text-xs shrink-0">
            {row.profileImage ? (
              <img
                src={row.profileImage}
                alt={row.name}
                className="w-full h-full rounded-xl object-cover"
              />
            ) : (
              row.name.slice(0, 2).toUpperCase()
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Link
                to={`/admin/students/${row.id}`}
                className="font-semibold text-slate-900 dark:text-slate-100 hover:text-amber-600 dark:hover:text-amber-400 transition-colors block"
              >
                {row.name}
              </Link>
              {row.isPro && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold">
                  <Crown className="w-2.5 h-2.5" /> PRO
                </span>
              )}
              {row.role === 'sub_admin' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold">
                  <ShieldCheck className="w-2.5 h-2.5 text-emerald-500" /> SUB-ADMIN
                </span>
              )}
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{row.email}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Learning Metrics',
      render: (row) => (
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold" title="Experience Points">
            <span>{row.points} XP</span>
          </div>
          <div className="flex items-center gap-1 text-orange-500 dark:text-orange-400 font-semibold" title="Learning Streak">
            <Flame className="w-3.5 h-3.5" />
            <span>{row.learningStreak}d</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Enrollments',
      render: (row) => (
        <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-amber-500" />
            {row.enrolledCoursesCount} courses
          </span>
          <span className="flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-emerald-500" />
            {row.certificatesCount} certs
          </span>
        </div>
      ),
    },
    {
      header: 'Status',
      render: (row) => (
        <AdminStatusBadge status={row.isActive ? 'ACTIVE' : 'INACTIVE'} />
      ),
    },
    {
      header: 'Joined',
      render: (row) => (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {new Date(row.createdAt).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            to={`/admin/students/${row.id}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="View Full Student Dossier"
          >
            <Eye className="w-4 h-4" />
          </Link>
          <button
            onClick={() => {
              setTargetStudent(row);
              setStatusModalOpen(true);
            }}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              row.isActive
                ? 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10'
                : 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
            }`}
            title={row.isActive ? 'Deactivate Student' : 'Activate Student'}
          >
            {row.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <AdminPageHeader
        title="Student Management & Roster"
        description="Search, inspect, and govern student accounts, learning streaks, course completions, and activity logs."
        breadcrumbs={[{ label: 'Students' }]}
      />

      <AdminDataTable
        columns={columns}
        data={students}
        loading={loading}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search student name or email..."
        filters={
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Deactivated Only</option>
            </select>

            <select
              value={membershipFilter}
              onChange={(e) => setMembershipFilter(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Tiers</option>
              <option value="pro">👑 Pro Members Only</option>
              <option value="free">Standard / Free Tier Only</option>
            </select>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Roles</option>
              <option value="student">Students Only</option>
              <option value="sub_admin">🛡️ Sub-Admins Only</option>
            </select>
          </div>
        }
        pagination={{
          ...pagination,
          onPageChange: (page) => fetchStudents(page),
        }}
        emptyTitle="No students found"
        emptyDescription="Try adjusting your search keywords or status filter."
      />

      {/* Account Deactivate / Activate Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        onConfirm={handleToggleStatus}
        title={targetStudent?.isActive ? 'Deactivate Student Account?' : 'Activate Student Account?'}
        itemName={targetStudent?.name}
        description={
          targetStudent?.isActive
            ? 'Deactivating this account will prevent the student from logging in and accessing platform materials until reactivated by an administrator.'
            : 'Activating this account will restore the student’s access to login and resume learning immediately.'
        }
        confirmText={targetStudent?.isActive ? 'Deactivate Account' : 'Activate Account'}
      />
    </div>
  );
};
