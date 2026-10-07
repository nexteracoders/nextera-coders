import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Award, ExternalLink, ShieldCheck, Sliders } from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { ICertificate } from '../../types/certificate.types';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminDataTable, Column } from '../../components/admin/AdminDataTable';
import { Button } from '../../components/ui/Button';
import { CertificateTemplateCustomizerModal } from '../../components/admin/CertificateTemplateCustomizerModal';

export const AdminCertificatesListPage: React.FC = () => {
  const [certificates, setCertificates] = useState<ICertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 20,
  });

  useEffect(() => {
    fetchCertificates(pagination.currentPage);
  }, [search]);

  const fetchCertificates = async (page = 1) => {
    try {
      setLoading(true);
      const res = await adminService.getCertificates({
        page,
        limit: pagination.limit,
        search: search || undefined,
      });
      setCertificates(res.certificates || []);
      setPagination(res.pagination);
    } catch (err) {
      console.error('Failed to load certificates:', err);
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<ICertificate>[] = [
    {
      header: 'Certificate ID',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">{row.certificateId}</span>
            <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
              <ShieldCheck className="w-3 h-3" />
              Cryptographically Verified
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Student',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{row.studentName}</span>
        </div>
      ),
    },
    {
      header: 'Course Track',
      render: (row) => (
        <span className="font-medium text-xs text-slate-600 dark:text-slate-300">{row.courseName}</span>
      ),
    },
    {
      header: 'Issue Date',
      render: (row) => (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {new Date(row.issueDate).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      header: 'Public Verification',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            to={`/verify-certificate/${row.certificateId}`}
            target="_blank"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <span>Verify</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <AdminPageHeader
        title="Issued Credentials & Certificates"
        description="Inspect all digitally conferred and cryptographically verifiable student graduation credentials."
        breadcrumbs={[{ label: 'Certificates' }]}
        action={
          <Button
            variant="primary"
            onClick={() => setCustomizerOpen(true)}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold shadow-md flex items-center gap-2 text-xs sm:text-sm py-2 px-3 sm:px-4"
          >
            <Sliders className="w-4 h-4" />
            <span>Customize Certificate Format (Free & Pro)</span>
          </Button>
        }
      />

      <AdminDataTable
        columns={columns}
        data={certificates}
        loading={loading}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by student name, course or Certificate ID..."
        pagination={{
          ...pagination,
          onPageChange: (page) => fetchCertificates(page),
        }}
        emptyTitle="No certificates issued yet"
        emptyDescription="Certificates are automatically issued when students achieve 100% course curriculum completion."
      />

      {/* Interactive Certificate Format & Template Customizer Modal */}
      <CertificateTemplateCustomizerModal
        isOpen={customizerOpen}
        onClose={() => setCustomizerOpen(false)}
      />
    </div>
  );
};

