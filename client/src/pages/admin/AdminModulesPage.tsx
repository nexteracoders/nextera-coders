import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ArrowUp, ArrowDown, BookOpen } from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { courseService } from '../../services/course.service';
import { AdminModuleItem } from '../../types/admin.types';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminDataTable, Column } from '../../components/admin/AdminDataTable';
import { DeleteConfirmModal } from '../../components/admin/DeleteConfirmModal';
import { Button } from '../../components/ui/Button';

export const AdminModulesPage: React.FC = () => {
  const [modules, setModules] = useState<AdminModuleItem[]>([]);
  const [courses, setCourses] = useState<Array<{ id: string; title: string }>>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<AdminModuleItem | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState('');
  const [order, setOrder] = useState<number>(1);
  const [saving, setSaving] = useState(false);

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingModule, setDeletingModule] = useState<AdminModuleItem | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    fetchModules();
  }, [selectedCourseId]);

  const fetchCourses = async () => {
    try {
      const res = await courseService.getCourses({ limit: 100 });
      const list = (res.courses || []).map((c: any) => ({
        id: c.id || c._id,
        title: c.title,
      }));
      setCourses(list);
    } catch (err) {
      console.error('Failed to load courses:', err);
    }
  };

  const fetchModules = async () => {
    try {
      setLoading(true);
      const res = await adminService.getModules(selectedCourseId || undefined);
      setModules(res.modules || []);
    } catch (err) {
      console.error('Failed to load modules:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingModule(null);
    setTitle('');
    setDescription('');
    setCourseId(selectedCourseId || courses[0]?.id || '');
    setOrder(modules.length + 1);
    setModalOpen(true);
  };

  const handleOpenEdit = (mod: AdminModuleItem) => {
    setEditingModule(mod);
    setTitle(mod.title);
    setDescription(mod.description);
    setCourseId(mod.course?.id || '');
    setOrder(mod.order);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !courseId) return;

    try {
      setSaving(true);
      if (editingModule) {
        await adminService.updateModule(editingModule.id, {
          title,
          description,
          order: Number(order),
        });
      } else {
        await adminService.createModule({
          courseId,
          title,
          description,
          order: Number(order),
        });
      }
      setModalOpen(false);
      fetchModules();
    } catch (err) {
      console.error('Failed to save module:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingModule) return;
    await adminService.deleteModule(deletingModule.id);
    fetchModules();
  };

  const handleReorder = async (mod: AdminModuleItem, direction: 'up' | 'down') => {
    const newOrder = direction === 'up' ? Math.max(1, mod.order - 1) : mod.order + 1;
    try {
      await adminService.reorderModule(mod.id, newOrder);
      fetchModules();
    } catch (err) {
      console.error('Failed to reorder module:', err);
    }
  };

  const columns: Column<AdminModuleItem>[] = [
    {
      header: 'Order',
      accessor: 'order',
      className: 'w-16 text-center font-mono font-bold text-slate-400 dark:text-slate-500',
      render: (row) => <span>#{row.order}</span>,
    },
    {
      header: 'Module Title',
      accessor: 'title',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-900 dark:text-slate-100">{row.title}</p>
          {row.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{row.description}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Course',
      render: (row) => (
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-amber-500" />
          {row.course?.title || 'Unknown Course'}
        </span>
      ),
    },
    {
      header: 'Lessons',
      render: (row) => (
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          {row.lessonCount} lessons
        </span>
      ),
    },
    {
      header: 'Reorder',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleReorder(row, 'up')}
            disabled={row.order <= 1}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Move Up"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleReorder(row, 'down')}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Move Down"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Edit Module"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setDeletingModule(row);
              setDeleteModalOpen(true);
            }}
            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Delete Module"
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
        title="Curriculum Modules"
        description="Organize courses into structured learning modules and manage curriculum sequences."
        breadcrumbs={[{ label: 'Modules' }]}
        action={
          <Button
            onClick={handleOpenCreate}
            leftIcon={<Plus className="w-4 h-4 stroke-[2.5]" />}
            className="w-full sm:w-auto shrink-0 shadow-md shadow-amber-500/20"
          >
            Create Module
          </Button>
        }
      />

      {/* Filter by Course */}
      <div className="flex items-center gap-3">
        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Filter Course:</label>
        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
        >
          <option value="">All Courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      <AdminDataTable
        columns={columns}
        data={modules}
        loading={loading}
        emptyTitle="No curriculum modules found"
        emptyDescription="Create a module to begin organizing lessons within a course track."
        emptyAction={
          <Button onClick={handleOpenCreate} size="md" className="shadow-md shadow-amber-500/20">
            <Plus className="w-4 h-4 stroke-[2.5] mr-1.5" />
            <span>Create Module</span>
          </Button>
        }
      />

      {/* Create / Edit Module Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {editingModule ? 'Edit Module' : 'Create New Module'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Course *
                </label>
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  disabled={!!editingModule}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="">Select Course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Module Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g., Module 1: Foundational TypeScript"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Brief summary of what this module covers..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Sequence Order
                </label>
                <input
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(parseInt(e.target.value, 10) || 1)}
                  min={1}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
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
                  {saving ? 'Saving...' : editingModule ? 'Save Changes' : 'Create Module'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Module?"
        itemName={deletingModule?.title}
        description="Deleting this module will also permanently remove all lessons contained within it. Proceed with caution."
      />
    </div>
  );
};
