import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Globe, EyeOff } from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { AdminFAQItem } from '../../types/admin.types';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminDataTable, Column } from '../../components/admin/AdminDataTable';
import { AdminStatusBadge } from '../../components/admin/AdminStatusBadge';
import { DeleteConfirmModal } from '../../components/admin/DeleteConfirmModal';
import { Button } from '../../components/ui/Button';

export const AdminFAQsPage: React.FC = () => {
  const [faqs, setFaqs] = useState<AdminFAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Create / Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<AdminFAQItem | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState('General');
  const [order, setOrder] = useState(1);
  const [isPublished, setIsPublished] = useState(true);
  const [saving, setSaving] = useState(false);

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingFaq, setDeletingFaq] = useState<AdminFAQItem | null>(null);

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const res = await adminService.getFaqs();
      setFaqs(res.faqs || []);
    } catch (err) {
      console.error('Failed to fetch FAQs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingFaq(null);
    setQuestion('');
    setAnswer('');
    setCategory('General');
    setOrder(faqs.length + 1);
    setIsPublished(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (faq: AdminFAQItem) => {
    setEditingFaq(faq);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setCategory(faq.category);
    setOrder(faq.order);
    setIsPublished(faq.isPublished);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;

    try {
      setSaving(true);
      if (editingFaq) {
        await adminService.updateFaq(editingFaq.id, {
          question,
          answer,
          category,
          order: Number(order),
          isPublished,
        });
      } else {
        await adminService.createFaq({
          question,
          answer,
          category,
          order: Number(order),
          isPublished,
        });
      }
      setModalOpen(false);
      fetchFaqs();
    } catch (err) {
      console.error('Failed to save FAQ:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (faq: AdminFAQItem) => {
    try {
      await adminService.updateFaq(faq.id, { isPublished: !faq.isPublished });
      fetchFaqs();
    } catch (err) {
      console.error('Failed to toggle FAQ publish:', err);
    }
  };

  const handleDelete = async () => {
    if (!deletingFaq) return;
    await adminService.deleteFaq(deletingFaq.id);
    fetchFaqs();
  };

  const filteredFaqs =
    categoryFilter === 'All'
      ? faqs
      : faqs.filter((f) => f.category.toLowerCase() === categoryFilter.toLowerCase());

  const columns: Column<AdminFAQItem>[] = [
    {
      header: 'Order',
      accessor: 'order',
      className: 'w-16 text-center font-mono font-bold text-slate-400 dark:text-slate-500',
      render: (row) => <span>#{row.order}</span>,
    },
    {
      header: 'Question & Answer',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-900 dark:text-slate-100">{row.question}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{row.answer}</p>
        </div>
      ),
    },
    {
      header: 'Category',
      accessor: 'category',
      render: (row) => (
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          {row.category}
        </span>
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
            title="Edit FAQ"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setDeletingFaq(row);
              setDeleteModalOpen(true);
            }}
            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Delete FAQ"
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
        title="Frequently Asked Questions (FAQs)"
        description="Manage questions and answers displayed dynamically across public knowledge and support sections."
        breadcrumbs={[{ label: 'FAQs' }]}
        action={
          <Button
            onClick={handleOpenCreate}
            leftIcon={<Plus className="w-4 h-4 stroke-[2.5]" />}
            className="w-full sm:w-auto shrink-0 shadow-md shadow-amber-500/20"
          >
            Create FAQ
          </Button>
        }
      />

      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Filter Category:</label>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
        >
          <option value="All">All Categories</option>
          <option value="General">General</option>
          <option value="Certificates">Certificates</option>
          <option value="DSA & Code Execution">DSA & Code Execution</option>
          <option value="Gamification">Gamification</option>
        </select>
      </div>

      <AdminDataTable
        columns={columns}
        data={filteredFaqs}
        loading={loading}
        emptyTitle="No FAQs found"
        emptyDescription="Create a frequently asked question to help students."
        emptyAction={
          <Button onClick={handleOpenCreate} size="md" className="shadow-md shadow-amber-500/20">
            <Plus className="w-4 h-4 stroke-[2.5] mr-1.5" />
            <span>Create FAQ</span>
          </Button>
        }
      />

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {editingFaq ? 'Edit FAQ' : 'Create FAQ'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Question *
                </label>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  required
                  placeholder="e.g., How do NextEra Coders certificates work?"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="General, Certificates, DSA..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Answer *
                </label>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  required
                  rows={4}
                  placeholder="Clear and detailed answer to the question..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="faq-publish"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
                />
                <label htmlFor="faq-publish" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  Publish to public FAQ directory immediately
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
                  {saving ? 'Saving...' : editingFaq ? 'Save Changes' : 'Create FAQ'}
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
        title="Delete FAQ?"
        itemName={deletingFaq?.question}
        description="Permanently delete this question from the platform FAQ repository."
      />
    </div>
  );
};
