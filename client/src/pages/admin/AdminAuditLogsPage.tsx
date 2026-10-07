import React, { useState, useEffect } from 'react';
import { Filter } from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { AdminAuditLogItem } from '../../types/admin.types';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminDataTable, Column } from '../../components/admin/AdminDataTable';
import { AdminStatusBadge } from '../../components/admin/AdminStatusBadge';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AdminAuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 25,
  });

  useEffect(() => {
    fetchLogs(pagination.currentPage);
  }, [actionFilter, resourceFilter]);

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      const res = await adminService.getAuditLogs({
        page,
        limit: pagination.limit,
        action: actionFilter || undefined,
        resourceType: resourceFilter || undefined,
      });
      setLogs(res.logs || []);
      setPagination(res.pagination);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<AdminAuditLogItem>[] = [
    {
      header: 'Action',
      render: (row) => (
        <div className="flex items-center gap-2">
          <AdminStatusBadge status={row.action} />
          <span className="font-semibold text-xs text-slate-700 dark:text-slate-300">{row.resourceType}</span>
        </div>
      ),
    },
    {
      header: 'Resource Target',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
            {row.resourceTitle || row.resourceId || 'Platform Target'}
          </span>
          {row.resourceId && (
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block truncate max-w-xs">
              ID: {row.resourceId}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Admin Actor',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-700 dark:text-slate-300">
            {row.admin?.name?.slice(0, 2).toUpperCase() || 'AD'}
          </div>
          <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">{row.admin?.name || 'Admin'}</span>
        </div>
      ),
    },
    {
      header: 'Timestamp',
      className: 'text-right',
      render: (row) => (
        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
          {new Date(row.createdAt).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <AdminPageHeader
        title="Administrative Audit Logs"
        description="Immutable system audit trail tracking content publication, student moderation, and security operations."
        breadcrumbs={[{ label: 'Audit Logs' }]}
      />

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Action:</label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
          >
            <option value="">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="PUBLISH">PUBLISH</option>
            <option value="UNPUBLISH">UNPUBLISH</option>
            <option value="ACTIVATE">ACTIVATE</option>
            <option value="DEACTIVATE">DEACTIVATE</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Resource:</label>
          <select
            value={resourceFilter}
            onChange={(e) => setResourceFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
          >
            <option value="">All Resources</option>
            <option value="COURSE">COURSE</option>
            <option value="MODULE">MODULE</option>
            <option value="LESSON">LESSON</option>
            <option value="QUIZ">QUIZ</option>
            <option value="PROBLEM">PROBLEM</option>
            <option value="PROJECT">PROJECT</option>
            <option value="TUTORIAL">TUTORIAL</option>
            <option value="ANNOUNCEMENT">ANNOUNCEMENT</option>
            <option value="FAQ">FAQ</option>
            <option value="TESTIMONIAL">TESTIMONIAL</option>
            <option value="STUDENT">STUDENT</option>
            <option value="SETTINGS">SETTINGS</option>
          </select>
        </div>
      </div>

      <AdminDataTable
        columns={columns}
        data={logs}
        loading={loading}
        pagination={{
          ...pagination,
          onPageChange: (page) => fetchLogs(page),
        }}
        emptyTitle="No audit logs recorded yet"
        emptyDescription="Administrative operations and status updates will be logged here."
      />
    </div>
  );
};
