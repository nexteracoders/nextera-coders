import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  RotateCcw,
  Search,
  ArrowRight,
  Eye,
  X,
  Footprints,
} from 'lucide-react';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { DeleteConfirmModal } from '../../components/admin/DeleteConfirmModal';
import { Button } from '../../components/ui/Button';
import {
  footerService,
  FooterLinkItem,
  CreateFooterLinkPayload,
} from '../../services/footer.service';

export const AdminFooterPage: React.FC = () => {
  const [links, setLinks] = useState<FooterLinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColumn, setSelectedColumn] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Create / Edit modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<FooterLinkItem | null>(null);
  const [formData, setFormData] = useState<{
    column: string;
    customColumn: string;
    columnTitle: string;
    title: string;
    url: string;
    badge: string;
    badgeType: 'hot' | 'live' | 'free' | 'vip' | 'amber' | 'emerald' | 'cyan' | 'purple' | 'rose' | 'default';
    order: number;
    isActive: boolean;
    isExternal: boolean;
    description: string;
  }>({
    column: 'company',
    customColumn: '',
    columnTitle: 'Company',
    title: '',
    url: '',
    badge: '',
    badgeType: 'default',
    order: 1,
    isActive: true,
    isExternal: false,
    description: '',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingLink, setDeletingLink] = useState<FooterLinkItem | null>(null);

  // Reset defaults modal state
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Load links from backend
  const fetchLinks = async () => {
    try {
      setLoading(true);
      const res = await footerService.getAdminLinks();
      setLinks(res.links || []);
    } catch (err) {
      console.error('Failed to fetch footer links:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  // Distinct columns
  const availableColumns = useMemo(() => {
    const set = new Set<string>();
    links.forEach((l) => set.add(l.column.toLowerCase()));
    // Always ensure standard 4 are present
    set.add('company');
    set.add('explore');
    set.add('tutorials');
    set.add('courses');
    return Array.from(set);
  }, [links]);

  // Filtered links
  const filteredLinks = useMemo(() => {
    return links.filter((item) => {
      // Column filter
      if (selectedColumn !== 'all' && item.column.toLowerCase() !== selectedColumn.toLowerCase()) {
        return false;
      }
      // Status filter
      if (statusFilter === 'active' && !item.isActive) return false;
      if (statusFilter === 'inactive' && item.isActive) return false;
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchUrl = item.url.toLowerCase().includes(q);
        const matchColumn = item.columnTitle?.toLowerCase().includes(q);
        const matchBadge = item.badge?.toLowerCase().includes(q);
        if (!matchTitle && !matchUrl && !matchColumn && !matchBadge) return false;
      }
      return true;
    });
  }, [links, selectedColumn, statusFilter, searchQuery]);

  // Open Create Modal
  const handleOpenCreate = (preselectedCol?: string) => {
    setEditingLink(null);
    setFormError(null);
    const col = preselectedCol || (selectedColumn !== 'all' ? selectedColumn : 'company');
    const colCapital = col.charAt(0).toUpperCase() + col.slice(1);
    const maxOrder = links
      .filter((l) => l.column.toLowerCase() === col.toLowerCase())
      .reduce((max, l) => Math.max(max, l.order || 0), 0);

    setFormData({
      column: col,
      customColumn: '',
      columnTitle: colCapital,
      title: '',
      url: '',
      badge: '',
      badgeType: 'default',
      order: maxOrder + 1,
      isActive: true,
      isExternal: false,
      description: '',
    });
    setModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (link: FooterLinkItem) => {
    setEditingLink(link);
    setFormError(null);
    const isCustom = !['company', 'explore', 'tutorials', 'courses'].includes(link.column.toLowerCase());

    setFormData({
      column: isCustom ? 'custom' : link.column.toLowerCase(),
      customColumn: isCustom ? link.column : '',
      columnTitle: link.columnTitle || link.column,
      title: link.title,
      url: link.url,
      badge: link.badge || '',
      badgeType: link.badgeType || 'default',
      order: link.order || 1,
      isActive: link.isActive !== false,
      isExternal: Boolean(link.isExternal),
      description: link.description || '',
    });
    setModalOpen(true);
  };

  // Submit Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const effectiveColumn =
      formData.column === 'custom'
        ? formData.customColumn.trim().toLowerCase()
        : formData.column.trim().toLowerCase();

    if (!effectiveColumn) {
      setFormError('Please select or specify a column.');
      return;
    }
    if (!formData.title.trim()) {
      setFormError('Link title is required.');
      return;
    }
    if (!formData.url.trim()) {
      setFormError('Target URL or Route is required.');
      return;
    }

    try {
      setSaving(true);
      const payload: CreateFooterLinkPayload = {
        column: effectiveColumn,
        columnTitle: formData.columnTitle.trim() || effectiveColumn.toUpperCase(),
        title: formData.title.trim(),
        url: formData.url.trim(),
        badge: formData.badge.trim(),
        badgeType: formData.badgeType,
        order: Number(formData.order) || 1,
        isActive: formData.isActive,
        isExternal: formData.isExternal || formData.url.startsWith('http'),
        description: formData.description.trim(),
      };

      if (editingLink) {
        await footerService.updateLink(editingLink._id, payload);
      } else {
        await footerService.createLink(payload);
      }

      setModalOpen(false);
      fetchLinks();
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'Failed to save link.');
    } finally {
      setSaving(false);
    }
  };

  // Toggle active state
  const handleToggleActive = async (link: FooterLinkItem) => {
    try {
      await footerService.updateLink(link._id, { isActive: !link.isActive });
      setLinks((prev) =>
        prev.map((l) => (l._id === link._id ? { ...l, isActive: !l.isActive } : l))
      );
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  // Delete Link
  const handleDeleteConfirm = async () => {
    if (!deletingLink) return;
    try {
      await footerService.deleteLink(deletingLink._id);
      setDeleteModalOpen(false);
      setDeletingLink(null);
      fetchLinks();
    } catch (err) {
      console.error('Failed to delete link:', err);
    }
  };

  // Reset to Defaults
  const handleResetDefaultsConfirm = async () => {
    try {
      setResetting(true);
      await footerService.resetDefaults();
      setResetModalOpen(false);
      fetchLinks();
    } catch (err) {
      console.error('Failed to reset default links:', err);
    } finally {
      setResetting(false);
    }
  };

  // Helper for Badge styling preview
  const getBadgeStyle = (badgeType?: string) => {
    switch (badgeType) {
      case 'hot':
      case 'rose':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'live':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'free':
      case 'cyan':
        return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20';
      case 'vip':
      case 'purple':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case 'amber':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'emerald':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      default:
        return 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/20';
    }
  };

  // Stats calculation
  const totalCount = links.length;
  const activeCount = links.filter((l) => l.isActive).length;
  const inactiveCount = totalCount - activeCount;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <AdminPageHeader
        title="Footer Links Manager"
        description="Add, edit, reorder, or remove navigation links across Company, Explore, Tutorials, Courses, and custom categories."
        breadcrumbs={[{ label: 'Footer Links' }]}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setResetModalOpen(true)}
              className="gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 border-slate-300 dark:border-dark-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenCreate()}
              className="gap-1.5 text-xs font-semibold shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Footer Link</span>
            </Button>
          </div>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-dark-800 shadow-xs">
          <span className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 block font-semibold">
            Total Links
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {totalCount}
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">Across all columns</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-dark-800 shadow-xs">
          <span className="text-[11px] font-mono uppercase text-emerald-600 dark:text-emerald-400 block font-semibold">
            Active Online
          </span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {activeCount}
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">Visible on public footer</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-dark-800 shadow-xs">
          <span className="text-[11px] font-mono uppercase text-amber-600 dark:text-amber-400 block font-semibold">
            Inactive Hidden
          </span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {inactiveCount}
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">Drafted or paused</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-dark-800 shadow-xs">
          <span className="text-[11px] font-mono uppercase text-brand-600 dark:text-brand-400 block font-semibold">
            Columns / Categories
          </span>
          <div className="text-2xl font-black text-brand-600 dark:text-brand-400 mt-1">
            {availableColumns.length}
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">Company, Explore, Tutorials, Courses...</span>
        </div>
      </div>

      {/* Column Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200 dark:border-dark-800">
        <button
          type="button"
          onClick={() => setSelectedColumn('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            selectedColumn === 'all'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-800'
          }`}
        >
          All Columns ({totalCount})
        </button>

        {availableColumns.map((colKey) => {
          const count = links.filter((l) => l.column.toLowerCase() === colKey.toLowerCase()).length;
          const label =
            colKey === 'company'
              ? 'Company'
              : colKey === 'explore'
              ? 'Explore'
              : colKey === 'tutorials'
              ? 'Tutorials'
              : colKey === 'courses'
              ? 'Courses'
              : colKey.toUpperCase();

          return (
            <button
              key={colKey}
              type="button"
              onClick={() => setSelectedColumn(colKey)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer capitalize ${
                selectedColumn === colKey
                  ? 'bg-brand-600 text-white shadow-xs shadow-brand-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-800'
              }`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, url, badge..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 focus:outline-hidden focus:border-brand-500 transition-colors text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-dark-900 p-1 rounded-xl border border-slate-200/80 dark:border-dark-800 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-dark-800 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                statusFilter === 'active'
                  ? 'bg-white dark:bg-dark-800 text-emerald-600 dark:text-emerald-400 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('inactive')}
              className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                statusFilter === 'inactive'
                  ? 'bg-white dark:bg-dark-800 text-amber-600 dark:text-amber-400 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Inactive
            </button>
          </div>
        </div>
      </div>

      {/* Links List View */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 font-mono">
            Loading footer links...
          </p>
        </div>
      ) : filteredLinks.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-dark-800">
          <Footprints className="w-10 h-10 text-slate-300 dark:text-dark-700 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">No Footer Links Found</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery || selectedColumn !== 'all' || statusFilter !== 'all'
              ? 'No links match your current search or filter criteria.'
              : 'Start by adding navigation links or reset to platform defaults.'}
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <Button size="sm" variant="primary" onClick={() => handleOpenCreate()}>
              <Plus className="w-3.5 h-3.5" />
              <span>Add First Link</span>
            </Button>
            <Button size="sm" variant="outline" onClick={() => setResetModalOpen(true)}>
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-dark-900 rounded-2xl border border-slate-200/80 dark:border-dark-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-dark-800/60 text-slate-500 dark:text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-200/80 dark:border-dark-800">
                <tr>
                  <th className="py-3 px-4 font-semibold w-14">Order</th>
                  <th className="py-3 px-4 font-semibold">Column</th>
                  <th className="py-3 px-4 font-semibold">Title / Label</th>
                  <th className="py-3 px-4 font-semibold">Target Route / URL</th>
                  <th className="py-3 px-4 font-semibold">Badge</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-800">
                {filteredLinks.map((item) => (
                  <tr
                    key={item._id}
                    className="hover:bg-slate-50/80 dark:hover:bg-dark-800/40 transition-colors group"
                  >
                    {/* Order # */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-500">
                      #{item.order}
                    </td>

                    {/* Column */}
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase tracking-tight bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-dark-700">
                        {item.columnTitle || item.column}
                      </span>
                    </td>

                    {/* Title */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {item.title}
                        </span>
                        {item.isExternal && (
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        )}
                      </div>
                    </td>

                    {/* URL */}
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-brand-600 dark:hover:text-brand-400 hover:underline"
                        title={item.url}
                      >
                        {item.url}
                      </a>
                    </td>

                    {/* Badge */}
                    <td className="py-3 px-4">
                      {item.badge ? (
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase border ${getBadgeStyle(
                            item.badgeType
                          )}`}
                        >
                          {item.badge}
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-dark-700 text-[10px]">—</span>
                      )}
                    </td>

                    {/* Status Toggle */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(item)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border cursor-pointer transition-all ${
                          item.isActive
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-slate-200/60 dark:bg-dark-800 text-slate-500 border-slate-300 dark:border-dark-700 hover:bg-slate-300'
                        }`}
                        title="Click to toggle visibility"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        <span>{item.isActive ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/50 transition-colors cursor-pointer"
                          title="Edit Link"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeletingLink(item);
                            setDeleteModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                          title="Delete Link"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal (Non-cut-off container with top margins & sticky header/footer) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-start justify-center p-3 sm:p-4 pt-8 sm:pt-14 pb-16">
          <div className="w-full max-w-lg bg-white dark:bg-dark-900 rounded-3xl border border-slate-200 dark:border-dark-800 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 px-6 py-4 bg-white dark:bg-dark-900 border-b border-slate-200 dark:border-dark-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-600 flex items-center justify-center font-bold">
                  {editingLink ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {editingLink ? 'Edit Footer Link' : 'Add New Footer Link'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Configure link title, target route, column placement, and badge.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-medium">
                  {formError}
                </div>
              )}

              {/* Column Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Target Footer Column *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'company', label: 'Company' },
                    { id: 'explore', label: 'Explore' },
                    { id: 'tutorials', label: 'Tutorials' },
                    { id: 'courses', label: 'Courses' },
                    { id: 'custom', label: '+ Custom Section' },
                  ].map((col) => (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          column: col.id,
                          columnTitle: col.id !== 'custom' ? col.label : prev.customColumn || 'New Category',
                        }));
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                        formData.column === col.id
                          ? 'bg-brand-500/10 text-brand-600 border-brand-500/40 shadow-xs'
                          : 'bg-slate-50 dark:bg-dark-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-dark-700 hover:border-slate-300'
                      }`}
                    >
                      {col.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Column Input if selected */}
              {formData.column === 'custom' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-amber-800 dark:text-amber-400 font-mono">
                      Column Key (e.g. gate_cs, resources)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. gate_cs"
                      value={formData.customColumn}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          customColumn: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''),
                        }))
                      }
                      className="w-full px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-dark-900 border border-amber-500/30 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-amber-800 dark:text-amber-400 font-mono">
                      Column Display Title (e.g. GATE CS)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. GATE CS Tutorials"
                      value={formData.columnTitle}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, columnTitle: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-dark-900 border border-amber-500/30 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* Link Title */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Link Title / Label *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GATE Computer Science Guide, React Native..."
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 focus:outline-hidden focus:border-brand-500 text-slate-900 dark:text-white"
                />
              </div>

              {/* URL / Path */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Target Route or URL *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. /tutorials?track=gate-cs or /courses/dsa or https://..."
                  value={formData.url}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      url: e.target.value,
                      isExternal: e.target.value.startsWith('http') || e.target.value.startsWith('mailto:'),
                    }))
                  }
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 focus:outline-hidden focus:border-brand-500 font-mono text-slate-900 dark:text-white"
                />
              </div>

              {/* Badge & Badge Color */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Badge Text (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. HOT, LIVE, FREE, VIP, NEW"
                    value={formData.badge}
                    onChange={(e) => setFormData((prev) => ({ ...prev, badge: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 font-mono uppercase text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Badge Color / Style
                  </label>
                  <select
                    value={formData.badgeType}
                    onChange={(e: any) =>
                      setFormData((prev) => ({ ...prev, badgeType: e.target.value }))
                    }
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 font-mono text-slate-900 dark:text-white"
                  >
                    <option value="default">Brand (Default)</option>
                    <option value="hot">Hot (Rose)</option>
                    <option value="live">Live (Emerald / Green)</option>
                    <option value="free">Free (Cyan)</option>
                    <option value="vip">VIP (Purple)</option>
                    <option value="amber">Amber (Gold / Coins)</option>
                  </select>
                </div>
              </div>

              {/* Order & Switches */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.order}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, order: Number(e.target.value) || 1 }))
                    }
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isActiveToggle"
                    checked={formData.isActive}
                    onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                    className="w-4 h-4 rounded-sm text-brand-600 focus:ring-brand-500"
                  />
                  <label htmlFor="isActiveToggle" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    Active / Visible
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isExternalToggle"
                    checked={formData.isExternal}
                    onChange={(e) => setFormData((prev) => ({ ...prev, isExternal: e.target.checked }))}
                    className="w-4 h-4 rounded-sm text-brand-600 focus:ring-brand-500"
                  />
                  <label htmlFor="isExternalToggle" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    Open in New Tab
                  </label>
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-dark-800/60 border border-slate-200 dark:border-dark-700/80 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span className="flex items-center gap-1 font-bold">
                    <Eye className="w-3.5 h-3.5 text-brand-500" />
                    Footer Hover Preview
                  </span>
                  <span>Column: {formData.columnTitle || formData.column}</span>
                </div>
                <div className="p-3 bg-white dark:bg-dark-950 rounded-xl border border-slate-200/80 dark:border-dark-800">
                  <div className="group inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer transition-colors">
                    <span>{formData.title || 'Sample Link Title'}</span>
                    {formData.badge && (
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase border ${getBadgeStyle(
                          formData.badgeType
                        )}`}
                      >
                        {formData.badge}
                      </span>
                    )}
                    <span className="opacity-0 -translate-x-1.5 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 ease-out text-amber-500 shrink-0 flex items-center">
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            </form>

            {/* Sticky Footer */}
            <div className="sticky bottom-0 z-10 px-6 py-3.5 bg-slate-50 dark:bg-dark-900/90 border-t border-slate-200 dark:border-dark-800 flex items-center justify-end gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="gap-1.5 font-bold"
              >
                {saving ? 'Saving...' : editingLink ? 'Save Changes' : 'Create Link'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Footer Link"
        itemName={deletingLink?.title}
        description={`Are you sure you want to remove "${deletingLink?.title}" from the footer? This action will immediately remove the link from the website footer.`}
        confirmText="Yes, Delete Link"
        onConfirm={handleDeleteConfirm}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeletingLink(null);
        }}
      />

      {/* Reset Defaults Confirmation Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-dark-900 rounded-3xl border border-slate-200 dark:border-dark-800 shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Reset All Footer Links to Defaults?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                This will restore all standard 30 navigation links across Company, Explore, Tutorials, and Courses. Any custom links added will be overwritten.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setResetModalOpen(false)}
                disabled={resetting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleResetDefaultsConfirm}
                disabled={resetting}
                className="gap-1.5"
              >
                {resetting ? 'Resetting...' : 'Yes, Restore Defaults'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
