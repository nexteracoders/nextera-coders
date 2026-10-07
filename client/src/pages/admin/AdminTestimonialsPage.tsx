import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Globe, EyeOff, Star } from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { AdminTestimonialItem } from '../../types/admin.types';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminDataTable, Column } from '../../components/admin/AdminDataTable';
import { AdminStatusBadge } from '../../components/admin/AdminStatusBadge';
import { DeleteConfirmModal } from '../../components/admin/DeleteConfirmModal';
import { Button } from '../../components/ui/Button';

export const AdminTestimonialsPage: React.FC = () => {
  const [testimonials, setTestimonials] = useState<AdminTestimonialItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Create / Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<AdminTestimonialItem | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [avatar, setAvatar] = useState('');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [isPublished, setIsPublished] = useState(true);
  const [order, setOrder] = useState(1);
  const [saving, setSaving] = useState(false);

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingTestimonial, setDeletingTestimonial] = useState<AdminTestimonialItem | null>(null);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const res = await adminService.getTestimonials();
      setTestimonials(res.testimonials || []);
    } catch (err) {
      console.error('Failed to fetch testimonials:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingTestimonial(null);
    setName('');
    setRole('');
    setCompany('');
    setAvatar('');
    setContent('');
    setRating(5);
    setOrder(testimonials.length + 1);
    setIsPublished(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (t: AdminTestimonialItem) => {
    setEditingTestimonial(t);
    setName(t.name);
    setRole(t.role);
    setCompany(t.company || '');
    setAvatar(t.avatar || '');
    setContent(t.content);
    setRating(t.rating || 5);
    setOrder(t.order || 1);
    setIsPublished(t.isPublished);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim() || !content.trim()) return;

    try {
      setSaving(true);
      const payload = {
        name,
        role,
        company,
        avatar,
        content,
        rating: Number(rating),
        order: Number(order),
        isPublished,
      };

      if (editingTestimonial) {
        await adminService.updateTestimonial(editingTestimonial.id, payload);
      } else {
        await adminService.createTestimonial(payload);
      }
      setModalOpen(false);
      fetchTestimonials();
    } catch (err) {
      console.error('Failed to save testimonial:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (t: AdminTestimonialItem) => {
    try {
      await adminService.updateTestimonial(t.id, { isPublished: !t.isPublished });
      fetchTestimonials();
    } catch (err) {
      console.error('Failed to toggle publish:', err);
    }
  };

  const handleDelete = async () => {
    if (!deletingTestimonial) return;
    await adminService.deleteTestimonial(deletingTestimonial.id);
    fetchTestimonials();
  };

  const columns: Column<AdminTestimonialItem>[] = [
    {
      header: 'Author',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200 shrink-0">
            {row.avatar ? (
              <img src={row.avatar} alt={row.name} className="w-full h-full rounded-xl object-cover" />
            ) : (
              row.name.slice(0, 2).toUpperCase()
            )}
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{row.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {row.role} {row.company && `at ${row.company}`}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'Testimonial',
      render: (row) => (
        <p className="text-xs text-slate-600 dark:text-slate-300 italic line-clamp-2 max-w-md">"{row.content}"</p>
      ),
    },
    {
      header: 'Rating',
      render: (row) => (
        <div className="flex items-center gap-1 text-amber-500">
          {Array.from({ length: row.rating }).map((_, i) => (
            <Star key={i} className="w-3.5 h-3.5 fill-current" />
          ))}
        </div>
      ),
    },
    {
      header: 'Status',
      render: (row) => <AdminStatusBadge status={row.isPublished} />,
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => handleTogglePublish(row)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={row.isPublished ? 'Unpublish' : 'Publish'}
          >
            {row.isPublished ? <EyeOff className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
          </button>
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Edit Testimonial"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setDeletingTestimonial(row);
              setDeleteModalOpen(true);
            }}
            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Delete Testimonial"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <AdminPageHeader
        title="Student Testimonials & Reviews"
        description="Manage verified student success stories displayed on the homepage and about page."
        breadcrumbs={[{ label: 'Testimonials' }]}
        action={
          <Button
            onClick={handleOpenCreate}
            leftIcon={<Plus className="w-4 h-4 stroke-[2.5]" />}
            className="w-full sm:w-auto shrink-0 shadow-md shadow-amber-500/20"
          >
            Add Testimonial
          </Button>
        }
      />

      <AdminDataTable
        columns={columns}
        data={testimonials}
        loading={loading}
        emptyTitle="No testimonials created yet"
        emptyDescription="Add reviews and career transition stories from verified alumni."
        emptyAction={
          <Button onClick={handleOpenCreate} size="md" className="shadow-md shadow-amber-500/20">
            <Plus className="w-4 h-4 stroke-[2.5] mr-1.5" />
            <span>Add Testimonial</span>
          </Button>
        }
      />

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {editingTestimonial ? 'Edit Testimonial' : 'Add Testimonial'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Student Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g., Sarah Jenkins"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Professional Role *
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                    placeholder="e.g., Frontend Engineer"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Company (Optional)
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g., Stripe"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Avatar Image URL
                  </label>
                  <input
                    type="url"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Testimonial Quote *
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  rows={4}
                  placeholder="Share their learning experience and career outcome..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Rating (1 - 5 Stars)
                  </label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value={5}>5 Stars (Exceptional)</option>
                    <option value={4}>4 Stars (Very Good)</option>
                    <option value={3}>3 Stars (Average)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(parseInt(e.target.value, 10) || 1)}
                    min={1}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="test-publish"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
                />
                <label htmlFor="test-publish" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  Display on public landing pages immediately
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : editingTestimonial ? 'Save Changes' : 'Add Testimonial'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Testimonial?"
        itemName={deletingTestimonial?.name}
        description="Permanently delete this testimonial review from the CMS."
      />
    </div>
  );
};
