import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../components/ui/Toast';
import { adminCourseService } from '../../services/adminCourse.service';
import { ICourse, IModule, ILesson } from '../../types/course.types';
import { ROUTES } from '../../constants/routes';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  PlayCircle,
  Lock,
  ChevronDown,
  Layers,
  Video,
  Clock,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { VideoPlayer } from '../../components/learning/VideoPlayer';
import { getVideoProviderInfo } from '../../utils/youtube';
import { ThumbnailUploadInput } from '../../components/common/ThumbnailUploadInput';

export const AdminCourseCurriculumPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  useDocumentTitle('Curriculum Builder — Admin CMS');
  const { success, error: toastError } = useToast();

  const [course, setCourse] = useState<ICourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openModuleIds, setOpenModuleIds] = useState<string[]>([]);

  // Module Modal State
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<IModule | null>(null);
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleDesc, setModuleDesc] = useState('');
  const [moduleSubmitting, setModuleSubmitting] = useState(false);

  // Lesson Modal State
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<ILesson | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonThumbnail, setLessonThumbnail] = useState('');
  const [lessonDesc, setLessonDesc] = useState('');
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [lessonDuration, setLessonDuration] = useState('10 mins');
  const [lessonIsFree, setLessonIsFree] = useState(false);
  const [lessonIsPublished, setLessonIsPublished] = useState(true);
  const [lessonSubmitting, setLessonSubmitting] = useState(false);

  const fetchCourse = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await adminCourseService.getCourseById(id);
      setCourse(data);
      if (data.curriculum) {
        setOpenModuleIds(data.curriculum.map((m) => m.id));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load course curriculum');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  const toggleModuleAccordion = (modId: string) => {
    setOpenModuleIds((prev) =>
      prev.includes(modId) ? prev.filter((i) => i !== modId) : [...prev, modId]
    );
  };

  // Module actions
  const openAddModuleModal = () => {
    setEditingModule(null);
    setModuleTitle('');
    setModuleDesc('');
    setModuleModalOpen(true);
  };

  const openEditModuleModal = (mod: IModule) => {
    setEditingModule(mod);
    setModuleTitle(mod.title);
    setModuleDesc(mod.description || '');
    setModuleModalOpen(true);
  };

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !moduleTitle.trim()) return;

    try {
      setModuleSubmitting(true);
      if (editingModule) {
        await adminCourseService.updateModule(editingModule.id, {
          title: moduleTitle.trim(),
          description: moduleDesc.trim(),
        });
        success('Module updated successfully', 'Saved');
      } else {
        await adminCourseService.createModule({
          courseId: id,
          title: moduleTitle.trim(),
          description: moduleDesc.trim(),
        });
        success('New module created', 'Created');
      }
      setModuleModalOpen(false);
      fetchCourse();
    } catch (err: any) {
      toastError(err.message || 'Failed to save module');
    } finally {
      setModuleSubmitting(false);
    }
  };

  const handleDeleteModule = async (modId: string, title: string) => {
    if (!window.confirm(`Delete "${title}" and all its lessons?`)) return;
    try {
      await adminCourseService.deleteModule(modId);
      success('Module deleted', 'Deleted');
      fetchCourse();
    } catch (err: any) {
      toastError(err.message || 'Failed to delete module');
    }
  };

  // Lesson actions
  const openAddLessonModal = (moduleId: string) => {
    setActiveModuleId(moduleId);
    setEditingLesson(null);
    setLessonTitle('');
    setLessonThumbnail('');
    setLessonDesc('');
    setLessonVideoUrl('');
    setLessonDuration('10 mins');
    setLessonIsFree(false);
    setLessonIsPublished(true);
    setLessonModalOpen(true);
  };

  const openEditLessonModal = (moduleId: string, lesson: ILesson) => {
    setActiveModuleId(moduleId);
    setEditingLesson(lesson);
    setLessonTitle(lesson.title);
    setLessonThumbnail(lesson.thumbnail || '');
    setLessonDesc(lesson.description || '');
    setLessonVideoUrl(lesson.videoUrl || '');
    setLessonDuration(lesson.duration || '10 mins');
    setLessonIsFree(lesson.isFree);
    setLessonIsPublished(lesson.isPublished);
    setLessonModalOpen(true);
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !activeModuleId || !lessonTitle.trim()) return;

    try {
      setLessonSubmitting(true);
      if (editingLesson) {
        await adminCourseService.updateLesson(editingLesson.id, {
          title: lessonTitle.trim(),
          thumbnail: lessonThumbnail,
          description: lessonDesc.trim(),
          videoUrl: lessonVideoUrl.trim(),
          duration: lessonDuration.trim(),
          isFree: lessonIsFree,
          isPublished: lessonIsPublished,
        });
        success('Lesson updated successfully', 'Saved');
      } else {
        await adminCourseService.createLesson({
          courseId: id,
          moduleId: activeModuleId,
          title: lessonTitle.trim(),
          thumbnail: lessonThumbnail,
          description: lessonDesc.trim(),
          videoUrl: lessonVideoUrl.trim(),
          duration: lessonDuration.trim(),
          isFree: lessonIsFree,
          isPublished: lessonIsPublished,
        });
        success('New lesson created', 'Created');
      }
      setLessonModalOpen(false);
      fetchCourse();
    } catch (err: any) {
      toastError(err.message || 'Failed to save lesson');
    } finally {
      setLessonSubmitting(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string, title: string) => {
    if (!window.confirm(`Delete lesson "${title}"?`)) return;
    try {
      await adminCourseService.deleteLesson(lessonId);
      success('Lesson deleted', 'Deleted');
      fetchCourse();
    } catch (err: any) {
      toastError(err.message || 'Failed to delete lesson');
    }
  };

  const handleToggleLessonPublish = async (lesson: ILesson) => {
    try {
      if (lesson.isPublished) {
        await adminCourseService.unpublishLesson(lesson.id);
        success(`${lesson.title} unpublished.`, 'Draft');
      } else {
        await adminCourseService.publishLesson(lesson.id);
        success(`${lesson.title} published!`, 'Published');
      }
      fetchCourse();
    } catch (err: any) {
      toastError(err.message || 'Failed to toggle publication');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <ErrorState title="Course Not Found" message={error || 'Unable to load course.'} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <Link to={ROUTES.ADMIN_COURSES} className="text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 text-xs font-mono">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Courses List
        </Link>
        <Link to={`/admin/courses/${id}/edit`}>
          <Button variant="outline" size="sm" leftIcon={<Edit className="w-3.5 h-3.5" />}>
            Edit Course Metadata
          </Button>
        </Link>
      </div>

      <div className="p-6 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant={course.isPublished ? 'success' : 'default'} size="sm">
              {course.isPublished ? 'Published Course' : 'Draft Course'}
            </Badge>
            <span className="text-xs font-mono text-slate-400">/{course.slug}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            {course.title}
          </h1>
          <p className="text-xs text-slate-500 font-mono">
            {course.curriculum?.length || 0} Modules •{' '}
            {course.curriculum?.reduce((acc, m) => acc + m.lessons.length, 0) || 0} Total Lessons
          </p>
        </div>

        <Button variant="primary" size="md" onClick={openAddModuleModal} leftIcon={<Plus className="w-4 h-4 stroke-[2.5]" />} className="shadow-md shadow-brand-500/20 shrink-0">
          Add New Module
        </Button>
      </div>

      {/* Curriculum Hierarchy */}
      <div className="space-y-4">
        {course.curriculum && course.curriculum.length > 0 ? (
          course.curriculum.map((mod, idx) => {
            const isOpen = openModuleIds.includes(mod.id);
            return (
              <div
                key={mod.id}
                className="rounded-2xl border border-slate-200 dark:border-dark-800 bg-white dark:bg-dark-900 overflow-hidden shadow-sm"
              >
                {/* Module Bar */}
                <div className="px-5 py-4 bg-slate-50 dark:bg-dark-850/80 border-b border-slate-200 dark:border-dark-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div
                    className="flex items-center gap-3 cursor-pointer select-none"
                    onClick={() => toggleModuleAccordion(mod.id)}
                  >
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 text-slate-400 transition-transform duration-200',
                        isOpen && 'rotate-180 text-brand-500'
                      )}
                    />
                    <div>
                      <span className="text-[11px] font-mono font-semibold text-brand-600 dark:text-brand-400">
                        MODULE {idx + 1}
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                        {mod.title}
                      </h3>
                      {mod.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">{mod.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className="text-xs font-mono text-slate-400 mr-1">
                      {mod.lessons.length} Lessons
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openAddLessonModal(mod.id)}
                      leftIcon={<Plus className="w-3 h-3" />}
                    >
                      Add Lesson
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1.5"
                      onClick={() => openEditModuleModal(mod)}
                      title="Edit Module"
                    >
                      <Edit className="w-3.5 h-3.5 text-slate-500" />
                    </Button>
                    <button
                      onClick={() => handleDeleteModule(mod.id, mod.title)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg"
                      title="Delete Module"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Lessons inside Module */}
                {isOpen && (
                  <div className="divide-y divide-slate-100 dark:divide-dark-800">
                    {mod.lessons.length > 0 ? (
                      mod.lessons.map((lesson, lIdx) => (
                        <div
                          key={lesson.id}
                          className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50/50 dark:hover:bg-dark-850/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-slate-400 font-mono w-5">{lIdx + 1}.</span>
                            {lesson.thumbnail ? (
                              <img
                                src={lesson.thumbnail}
                                alt=""
                                className="w-12 h-7 rounded-md object-cover aspect-video border border-slate-200 dark:border-dark-800 shrink-0 shadow-xs"
                              />
                            ) : lesson.isFree ? (
                              <PlayCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                            ) : (
                              <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white">
                                {lesson.title}
                              </p>
                              <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono mt-0.5">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {lesson.duration}
                                </span>
                                {lesson.videoUrl && (
                                  <span className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400">
                                    <Video className="w-3 h-3" /> Video Attached
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            {lesson.isFree && (
                              <Badge variant="success" size="sm">
                                Free Preview
                              </Badge>
                            )}

                            <button
                              onClick={() => handleToggleLessonPublish(lesson)}
                              title="Click to toggle lesson published state"
                            >
                              <Badge variant={lesson.isPublished ? 'info' : 'default'} size="sm">
                                {lesson.isPublished ? 'Published' : 'Draft'}
                              </Badge>
                            </button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1.5"
                              onClick={() => openEditLessonModal(mod.id, lesson)}
                              title="Edit Lesson"
                            >
                              <Edit className="w-3.5 h-3.5 text-slate-500" />
                            </Button>

                            <button
                              onClick={() => handleDeleteLesson(lesson.id, lesson.title)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg"
                              title="Delete Lesson"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-slate-400 text-xs font-mono">
                        No lessons in this module yet. Click "Add Lesson" above.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-dark-800 bg-slate-50/50 dark:bg-dark-900/40 space-y-3">
            <Layers className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">No Modules Added</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Start structuring your course by adding the first learning module.
            </p>
            <Button variant="primary" size="sm" onClick={openAddModuleModal} leftIcon={<Plus className="w-4 h-4" />}>
              Add Module 1
            </Button>
          </div>
        )}
      </div>

      {/* Module Modal */}
      <Modal
        isOpen={moduleModalOpen}
        onClose={() => setModuleModalOpen(false)}
        title={editingModule ? 'Edit Module' : 'Add New Module'}
        description="Modules group lessons into structured learning milestones."
      >
        <form onSubmit={handleSaveModule} className="space-y-4">
          <Input
            label="Module Title *"
            placeholder="e.g. Module 1: Foundations & Architecture"
            value={moduleTitle}
            onChange={(e) => setModuleTitle(e.target.value)}
            required
          />
          <Input
            label="Description (Optional)"
            placeholder="Brief overview of topics covered in this module..."
            value={moduleDesc}
            onChange={(e) => setModuleDesc(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setModuleModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={moduleSubmitting}>
              {editingModule ? 'Update Module' : 'Create Module'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Lesson Modal */}
      <Modal
        isOpen={lessonModalOpen}
        onClose={() => setLessonModalOpen(false)}
        title={editingLesson ? 'Edit Lesson' : 'Add New Lesson'}
        description="Define lesson titles, duration, video links, and preview permissions."
      >
        <form onSubmit={handleSaveLesson} className="space-y-4">
          <Input
            label="Lesson Title *"
            placeholder="e.g. 1.1 Monorepo Full-Stack Architecture"
            value={lessonTitle}
            onChange={(e) => setLessonTitle(e.target.value)}
            required
          />

          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-brand-500" /> Video Lecture (Cloud Stream / YouTube)
                </label>
                {lessonVideoUrl && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border ${getVideoProviderInfo(lessonVideoUrl).badgeClass}`}>
                    {getVideoProviderInfo(lessonVideoUrl).label}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste Cloud Storage URL (GCS, Cloudinary, S3), Google Drive, or YouTube link..."
                  value={lessonVideoUrl}
                  onChange={(e) => setLessonVideoUrl(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-dark-800 bg-white dark:bg-dark-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Quick sample video presets for testing */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-mono text-slate-400">Quick Samples:</span>
                {[
                  { label: 'GCS MP4', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
                  { label: 'Cloudinary', url: 'https://res.cloudinary.com/demo/video/upload/dog.mp4' },
                  { label: 'YouTube React', url: 'https://www.youtube.com/watch?v=Tn6-PIqc4UM' },
                  { label: 'YouTube Trees', url: 'https://www.youtube.com/watch?v=7h1s2SojIRw' },
                ].map((sample) => (
                  <button
                    key={sample.label}
                    type="button"
                    onClick={() => setLessonVideoUrl(sample.url)}
                    className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-dark-850 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950 dark:hover:text-brand-400 border border-slate-200 dark:border-dark-800 transition-colors"
                  >
                    {sample.label}
                  </button>
                ))}
                {lessonVideoUrl && (
                  <button
                    type="button"
                    onClick={() => setLessonVideoUrl('')}
                    className="text-[10px] text-rose-500 hover:underline font-mono ml-auto"
                  >
                    Clear Video
                  </button>
                )}
              </div>
            </div>

            {/* Live Video Preview Box in Admin Modal */}
            {lessonVideoUrl && (
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300 font-mono">
                  <span className="flex items-center gap-1.5 text-brand-400 font-semibold">
                    <PlayCircle className="w-3.5 h-3.5" /> Live Player Preview
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {getVideoProviderInfo(lessonVideoUrl).description}
                  </span>
                </div>
                <div className="w-full rounded-xl overflow-hidden shadow-lg border border-slate-800">
                  <VideoPlayer
                    videoUrl={lessonVideoUrl}
                    title={lessonTitle || 'Lesson Preview'}
                    duration={lessonDuration}
                    autoPlay={false}
                  />
                </div>
              </div>
            )}

            {/* Lesson Thumbnail Upload / Auto-YouTube */}
            <ThumbnailUploadInput
              value={lessonThumbnail}
              onChange={setLessonThumbnail}
              videoUrlForYouTubeThumbnail={lessonVideoUrl}
              label="Lesson Thumbnail (16:9 Standard)"
              helperText="Auto-adjusts to 16:9. Displayed on module sidebar in course player and curriculum list."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-600 dark:text-slate-400">Duration Estimate</label>
                <Input
                  placeholder="e.g. 15 mins"
                  value={lessonDuration}
                  onChange={(e) => setLessonDuration(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-600 dark:text-slate-400">Quick Duration</label>
                <div className="flex flex-wrap gap-1 pt-1">
                  {['5 mins', '10 mins', '15 mins', '25 mins', '45 mins'].map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setLessonDuration(dur)}
                      className="px-2 py-1 rounded text-[10px] font-mono bg-slate-100 dark:bg-dark-850 hover:bg-slate-200 dark:hover:bg-dark-800 text-slate-700 dark:text-slate-300"
                    >
                      {dur}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Description & Lecture Notes
            </label>
            <textarea
              rows={3}
              className="w-full rounded-lg border border-slate-300 dark:border-dark-800 bg-white dark:bg-dark-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Lecture notes, key takeaways, architectural links..."
              value={lessonDesc}
              onChange={(e) => setLessonDesc(e.target.value)}
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-850 border border-slate-200 dark:border-dark-800 space-y-2">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Access & Publication Settings:
            </div>
            <div className="flex flex-wrap items-center gap-6 text-xs text-slate-700 dark:text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded text-emerald-600"
                  checked={lessonIsFree}
                  onChange={(e) => setLessonIsFree(e.target.checked)}
                />
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Free Preview Lesson (Visible on Free Tier)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded text-brand-600"
                  checked={lessonIsPublished}
                  onChange={(e) => setLessonIsPublished(e.target.checked)}
                />
                <span className="font-semibold">Published (Live)</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setLessonModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={lessonSubmitting}>
              {editingLesson ? 'Save Lesson' : 'Create Lesson'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
