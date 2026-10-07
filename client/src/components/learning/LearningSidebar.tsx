import React, { useState } from 'react';
import { ILearningModule } from '../../types/learning.types';
import { CheckCircle2, ChevronDown, X, Sparkles, Video, Play } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Badge } from '../ui/Badge';
import { getYouTubeThumbnailUrl } from '../../utils/youtube';

interface LearningSidebarProps {
  courseTitle: string;
  category: string;
  progress: number;
  completedCount: number;
  totalLessons: number;
  curriculum: ILearningModule[];
  activeLessonId: string | null;
  onSelectLesson: (lessonId: string) => void;
  onCloseMobile?: () => void;
  isMobileDrawer?: boolean;
}

export const LearningSidebar: React.FC<LearningSidebarProps> = ({
  courseTitle,
  category,
  progress,
  completedCount,
  totalLessons,
  curriculum,
  activeLessonId,
  onSelectLesson,
  onCloseMobile,
  isMobileDrawer = false,
}) => {
  // Keep all modules expanded by default
  const [openModuleIds, setOpenModuleIds] = useState<string[]>(
    curriculum.map((m) => m.id)
  );

  const toggleModule = (modId: string) => {
    setOpenModuleIds((prev) =>
      prev.includes(modId) ? prev.filter((id) => id !== modId) : [...prev, modId]
    );
  };

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-white dark:bg-dark-900 border-r border-slate-200 dark:border-dark-800 select-none overflow-hidden',
        isMobileDrawer ? 'w-full' : 'w-80 lg:w-96 shrink-0'
      )}
    >
      {/* Sidebar Header */}
      <div className="p-5 border-b border-slate-200 dark:border-dark-800 space-y-3 bg-slate-50/70 dark:bg-dark-850/50">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="info" size="sm">
            {category}
          </Badge>
          {isMobileDrawer && onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-dark-700 text-slate-500"
              aria-label="Close curriculum drawer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white line-clamp-2 leading-snug">
          {courseTitle}
        </h2>

        {/* Course Progress Section */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-500 dark:text-slate-400">Course Progress</span>
            <span className="font-bold text-brand-600 dark:text-brand-400">{progress}%</span>
          </div>

          <div className="w-full bg-slate-200 dark:bg-dark-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-brand-600 dark:bg-brand-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>
              {completedCount} of {totalLessons} completed
            </span>
            {progress === 100 && (
              <span className="text-emerald-500 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Completed
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Curriculum Accordion List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-dark-800/80">
        {curriculum.map((mod, modIdx) => {
          const isOpen = openModuleIds.includes(mod.id);
          const moduleCompleted =
            mod.lessons.length > 0 && mod.lessons.every((l) => l.isCompleted);

          return (
            <div key={mod.id} className="group">
              {/* Module Header Toggle */}
              <button
                type="button"
                onClick={() => toggleModule(mod.id)}
                className="w-full px-4 py-3 flex items-center justify-between text-left gap-3 bg-slate-50/40 dark:bg-dark-850/30 hover:bg-slate-100/70 dark:hover:bg-dark-800/50 transition-colors focus:outline-none"
              >
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono font-semibold text-brand-600 dark:text-brand-400 tracking-wider">
                    MODULE {modIdx + 1}
                  </span>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                    {mod.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {moduleCompleted && (
                    <span className="text-emerald-500" title="Module complete">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                  )}
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 text-slate-400 transition-transform duration-200',
                      isOpen && 'rotate-180 text-brand-500'
                    )}
                  />
                </div>
              </button>

              {/* Lessons inside Module */}
              {isOpen && (
                <div className="py-1 space-y-0.5 bg-white dark:bg-dark-900">
                  {mod.lessons.map((lesson, lIdx) => {
                    const isActive = activeLessonId === lesson.id;
                    const isCompleted = lesson.isCompleted;
                    const thumbnail =
                      lesson.thumbnail ||
                      (lesson.videoUrl ? getYouTubeThumbnailUrl(lesson.videoUrl) : null);

                    return (
                      <button
                        key={lesson.id}
                        type="button"
                        onClick={() => {
                          onSelectLesson(lesson.id);
                          if (isMobileDrawer && onCloseMobile) onCloseMobile();
                        }}
                        className={cn(
                          'w-full px-3.5 py-2.5 flex items-center justify-between text-left gap-2.5 transition-colors text-xs focus:outline-none',
                          isActive
                            ? 'bg-brand-50/90 dark:bg-brand-950/60 border-l-4 border-brand-600 text-brand-900 dark:text-brand-200 font-semibold'
                            : 'hover:bg-slate-50 dark:hover:bg-dark-850/60 text-slate-700 dark:text-slate-300'
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Mini 16:9 Thumbnail Preview on Left */}
                          <div className="relative w-12 h-7 aspect-video rounded-md overflow-hidden bg-slate-800 shrink-0 border border-slate-700/60 shadow-2xs flex items-center justify-center">
                            {thumbnail ? (
                              <img
                                src={thumbnail}
                                alt=""
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-850 text-slate-500">
                                <Video className="w-3 h-3 text-slate-400" />
                              </div>
                            )}

                            {/* Active or Completed Overlay on Thumbnail */}
                            {isCompleted ? (
                              <div className="absolute inset-0 bg-emerald-950/70 flex items-center justify-center backdrop-blur-2xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              </div>
                            ) : isActive ? (
                              <div className="absolute inset-0 bg-brand-950/70 flex items-center justify-center backdrop-blur-2xs">
                                <Play className="w-3.5 h-3.5 text-white fill-white" />
                              </div>
                            ) : null}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-xs leading-snug">
                              <span className="font-mono text-slate-400 mr-1.5 text-[11px]">
                                {modIdx + 1}.{lIdx + 1}
                              </span>
                              {lesson.title}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px] text-slate-400">
                          {lesson.isFree && !isCompleted && (
                            <Badge variant="success" size="sm" className="text-[9px] px-1.5 py-0">
                              Preview
                            </Badge>
                          )}
                          <span>{lesson.duration}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
