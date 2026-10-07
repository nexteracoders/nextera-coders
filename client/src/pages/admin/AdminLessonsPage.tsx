import React, { useState, useEffect } from 'react';
import { Video, Plus, Edit2, Trash2, Globe, EyeOff, BookOpen, Layers, PlayCircle } from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { courseService } from '../../services/course.service';
import { AdminLessonItem, AdminModuleItem } from '../../types/admin.types';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminDataTable, Column } from '../../components/admin/AdminDataTable';
import { AdminStatusBadge } from '../../components/admin/AdminStatusBadge';
import { DeleteConfirmModal } from '../../components/admin/DeleteConfirmModal';
import { Button } from '../../components/ui/Button';
import { VideoPlayer } from '../../components/learning/VideoPlayer';
import { getVideoProviderInfo } from '../../utils/youtube';
import { ThumbnailUploadInput } from '../../components/common/ThumbnailUploadInput';

export const AdminLessonsPage: React.FC = () => {
  const [lessons, setLessons] = useState<AdminLessonItem[]>([]);
  const [courses, setCourses] = useState<Array<{ id: string; title: string }>>([]);
  const [modules, setModules] = useState<AdminModuleItem[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Create/Edit Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<AdminLessonItem | null>(null);
  const [formCourseId, setFormCourseId] = useState('');
  const [formModuleId, setFormModuleId] = useState('');
  const [formAvailableModules, setFormAvailableModules] = useState<AdminModuleItem[]>([]);
  const [title, setTitle] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [duration, setDuration] = useState('10 mins');
  const [notes, setNotes] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [order, setOrder] = useState(1);
  const [saving, setSaving] = useState(false);

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingLesson, setDeletingLesson] = useState<AdminLessonItem | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      adminService.getModules(selectedCourseId).then((res) => setModules(res.modules || []));
    } else {
      setModules([]);
      setSelectedModuleId('');
    }
  }, [selectedCourseId]);

  useEffect(() => {
    fetchLessons();
  }, [selectedCourseId, selectedModuleId, search]);

  const fetchCourses = async () => {
    try {
      const res = await courseService.getCourses({ limit: 100 });
      const list = (res.courses || []).map((c: any) => ({
        id: c.id || c._id,
        title: c.title,
      }));
      setCourses(list);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    }
  };

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const res = await adminService.getLessons({
        courseId: selectedCourseId || undefined,
        moduleId: selectedModuleId || undefined,
        search: search || undefined,
      });
      setLessons(res.lessons || []);
    } catch (err) {
      console.error('Failed to fetch lessons:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = async () => {
    setEditingLesson(null);
    const initialCourse = selectedCourseId || courses[0]?.id || '';
    setFormCourseId(initialCourse);
    if (initialCourse) {
      const res = await adminService.getModules(initialCourse);
      setFormAvailableModules(res.modules || []);
      setFormModuleId(res.modules?.[0]?.id || '');
    } else {
      setFormAvailableModules([]);
      setFormModuleId('');
    }
    setTitle('');
    setThumbnail('');
    setDescription('');
    setVideoUrl('');
    setDuration('10 mins');
    setNotes('');
    setIsFree(false);
    setIsPublished(true);
    setOrder(lessons.length + 1);
    setModalOpen(true);
  };

  const handleOpenEdit = async (lesson: AdminLessonItem) => {
    setEditingLesson(lesson);
    setFormCourseId(lesson.course?.id || '');
    if (lesson.course?.id) {
      const res = await adminService.getModules(lesson.course.id);
      setFormAvailableModules(res.modules || []);
    }
    setFormModuleId(lesson.module?.id || '');
    setTitle(lesson.title);
    setThumbnail(lesson.thumbnail || '');
    setDescription(lesson.description);
    setVideoUrl(lesson.videoUrl || '');
    setDuration(lesson.duration || '10 mins');
    setNotes(lesson.notes || '');
    setIsFree(lesson.isFree);
    setIsPublished(lesson.isPublished);
    setOrder(lesson.order);
    setModalOpen(true);
  };

  const handleCourseChangeInForm = async (cId: string) => {
    setFormCourseId(cId);
    if (cId) {
      const res = await adminService.getModules(cId);
      setFormAvailableModules(res.modules || []);
      setFormModuleId(res.modules?.[0]?.id || '');
    } else {
      setFormAvailableModules([]);
      setFormModuleId('');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !formCourseId || !formModuleId) return;

    try {
      setSaving(true);
      const payload = {
        courseId: formCourseId,
        moduleId: formModuleId,
        title,
        thumbnail,
        description,
        videoUrl,
        duration,
        notes,
        isFree,
        isPublished,
        order: Number(order),
      };

      if (editingLesson) {
        await adminService.updateLesson(editingLesson.id, payload);
      } else {
        await adminService.createLesson(payload);
      }
      setModalOpen(false);
      fetchLessons();
    } catch (err) {
      console.error('Failed to save lesson:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (lesson: AdminLessonItem) => {
    try {
      if (lesson.isPublished) {
        await adminService.unpublishLesson(lesson.id);
      } else {
        await adminService.publishLesson(lesson.id);
      }
      fetchLessons();
    } catch (err) {
      console.error('Failed to toggle publish:', err);
    }
  };

  const handleDelete = async () => {
    if (!deletingLesson) return;
    await adminService.deleteLesson(deletingLesson.id);
    fetchLessons();
  };

  const columns: Column<AdminLessonItem>[] = [
    {
      header: 'Lesson',
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.thumbnail ? (
            <img
              src={row.thumbnail}
              alt=""
              className="w-12 h-7 rounded-lg object-cover aspect-video border border-slate-200 dark:border-slate-700 shrink-0 shadow-xs"
            />
          ) : (
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
              <Video className="w-4 h-4" />
            </div>
          )}
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{row.title}</p>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{row.duration}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Course Track',
      render: (row) => (
        <div className="text-xs">
          <p className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1">
            <BookOpen className="w-3 h-3 text-brand-600 dark:text-brand-400" />
            {row.course?.title || 'Unknown Course'}
          </p>
          <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
            <Layers className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            {row.module?.title || 'Module'}
          </p>
        </div>
      ),
    },
    {
      header: 'Access',
      render: (row) => (
        <span
          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
            row.isFree
              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
          }`}
        >
          {row.isFree ? 'Free Preview' : 'Enrolled Only'}
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
            title="Edit Lesson"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setDeletingLesson(row);
              setDeleteModalOpen(true);
            }}
            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Delete Lesson"
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
        title="Curriculum Lessons"
        description="Create, edit, publish, and manage video lectures, structured notes, and lesson resources."
        breadcrumbs={[{ label: 'Lessons' }]}
        action={
          <Button
            onClick={handleOpenCreate}
            leftIcon={<Plus className="w-4 h-4 stroke-[2.5]" />}
            className="w-full sm:w-auto shrink-0 shadow-md shadow-brand-500/20"
          >
            Create Lesson
          </Button>
        }
      />

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Course:</label>
          <select
            value={selectedCourseId}
            onChange={(e) => {
              setSelectedCourseId(e.target.value);
              setSelectedModuleId('');
            }}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500"
          >
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        {modules.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Module:</label>
            <select
              value={selectedModuleId}
              onChange={(e) => setSelectedModuleId(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500"
            >
              <option value="">All Modules</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <AdminDataTable
        columns={columns}
        data={lessons}
        loading={loading}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search lessons by title..."
        emptyTitle="No curriculum lessons found"
        emptyDescription="Create your first video lecture or lesson guide."
        emptyAction={
          <Button onClick={handleOpenCreate} size="md" className="shadow-md shadow-brand-500/20">
            <Plus className="w-4 h-4 stroke-[2.5] mr-1.5" />
            <span>Create Lesson</span>
          </Button>
        }
      />

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl my-8">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
              {editingLesson ? 'Edit Lesson' : 'Create New Lesson'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Course *
                  </label>
                  <select
                    value={formCourseId}
                    onChange={(e) => handleCourseChangeInForm(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500"
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
                    Module *
                  </label>
                  <select
                    value={formModuleId}
                    onChange={(e) => setFormModuleId(e.target.value)}
                    required
                    disabled={formAvailableModules.length === 0}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500 disabled:opacity-40"
                  >
                    <option value="">Select Module</option>
                    {formAvailableModules.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lesson Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g., Deep Dive: React 19 Compiler Architecture"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Video Stream / Embed URL
                      </label>
                      {videoUrl && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border ${getVideoProviderInfo(videoUrl).badgeClass}`}>
                          {getVideoProviderInfo(videoUrl).label}
                        </span>
                      )}
                    </div>
                    <input
                      type="url"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://commondatastorage.googleapis.com/... or YouTube URL"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500"
                    />

                    {/* Quick test samples */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                      <span className="text-[10px] font-mono text-slate-400">Quick Test:</span>
                      <button
                        type="button"
                        onClick={() => setVideoUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4')}
                        className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand-950/50 hover:text-brand-500 border border-slate-200 dark:border-slate-700 transition-colors"
                      >
                        GCS MP4
                      </button>
                      <button
                        type="button"
                        onClick={() => setVideoUrl('https://res.cloudinary.com/demo/video/upload/dog.mp4')}
                        className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand-950/50 hover:text-brand-500 border border-slate-200 dark:border-slate-700 transition-colors"
                      >
                        Cloudinary
                      </button>
                      <button
                        type="button"
                        onClick={() => setVideoUrl('https://www.youtube.com/watch?v=Tn6-PIqc4UM')}
                        className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand-950/50 hover:text-brand-500 border border-slate-200 dark:border-slate-700 transition-colors"
                      >
                        YouTube
                      </button>
                      {videoUrl && (
                        <button
                          type="button"
                          onClick={() => setVideoUrl('')}
                          className="text-[10px] text-rose-500 hover:underline font-mono ml-auto"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Duration (e.g. 12 mins)
                    </label>
                    <input
                      type="text"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="12 mins"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500"
                    />
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 font-mono">
                      💡 Supports: Google Cloud, Cloudinary, AWS S3, Supabase, Firebase, Google Drive, & YouTube.
                    </p>
                  </div>
                </div>

                {/* Live Video Preview Box in Admin Modal */}
                {videoUrl && (
                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-300 font-mono">
                      <span className="flex items-center gap-1.5 text-brand-400 font-semibold">
                        <PlayCircle className="w-3.5 h-3.5" /> Live Video Preview
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {getVideoProviderInfo(videoUrl).description}
                      </span>
                    </div>
                    <div className="w-full rounded-xl overflow-hidden shadow-lg border border-slate-800">
                      <VideoPlayer
                        videoUrl={videoUrl}
                        title={title || 'Preview Lesson'}
                        duration={duration}
                        autoPlay={false}
                      />
                    </div>
                  </div>
                )}

                {/* Lesson Thumbnail Upload / Auto-YouTube */}
                <ThumbnailUploadInput
                  value={thumbnail}
                  onChange={setThumbnail}
                  videoUrlForYouTubeThumbnail={videoUrl}
                  label="Lesson Thumbnail (16:9 Standard)"
                  helperText="Auto-adjusts to 16:9. Displayed on module sidebar in course player and admin overview."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lesson Overview / Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Summary of concepts learned in this lesson..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lesson Notes (Markdown Supported)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="## Code Highlights and architectural notes..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFree}
                    onChange={(e) => setIsFree(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-200">Free Preview Lesson</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-200">Publish Immediately</span>
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
                  {saving ? 'Saving...' : editingLesson ? 'Save Changes' : 'Create Lesson'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Lesson?"
        itemName={deletingLesson?.title}
        description="Permanently delete this lesson from the curriculum. Student completion progress on this specific lesson will be cleared."
      />
    </div>
  );
};
