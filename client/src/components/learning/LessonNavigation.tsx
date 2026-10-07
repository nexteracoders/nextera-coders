import React from 'react';
import { Button } from '../ui/Button';
import { ChevronLeft, ChevronRight, CheckCircle2, Trophy } from 'lucide-react';
import { ILearningNavigation } from '../../types/learning.types';

interface LessonNavigationProps {
  navigation: ILearningNavigation;
  isCompleted: boolean;
  isCompleting: boolean;
  isCourseCompleted: boolean;
  onPrevLesson: () => void;
  onNextLesson: () => void;
  onMarkComplete: () => void;
  onOpenCompletionModal?: () => void;
}

export const LessonNavigation: React.FC<LessonNavigationProps> = ({
  navigation,
  isCompleted,
  isCompleting,
  onPrevLesson,
  onNextLesson,
  onMarkComplete,
  onOpenCompletionModal,
}) => {
  const { prevLesson, nextLesson } = navigation;

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* Previous Button */}
      <Button
        variant="outline"
        size="md"
        disabled={!prevLesson}
        onClick={onPrevLesson}
        leftIcon={<ChevronLeft className="w-4 h-4" />}
        className="w-full sm:w-auto"
      >
        Previous Lesson
      </Button>

      {/* Center Action: Mark as Complete / Completed status */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-center">
        {isCompleted ? (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold font-mono">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Lesson Completed
          </div>
        ) : (
          <Button
            variant="primary"
            size="md"
            onClick={onMarkComplete}
            isLoading={isCompleting}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            Mark as Complete
          </Button>
        )}
      </div>

      {/* Next Button or Course Complete Action */}
      <div className="w-full sm:w-auto flex justify-end">
        {nextLesson ? (
          <Button
            variant="primary"
            size="md"
            onClick={onNextLesson}
            rightIcon={<ChevronRight className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            Next Lesson
          </Button>
        ) : (
          <Button
            variant="primary"
            size="md"
            onClick={onOpenCompletionModal}
            leftIcon={<Trophy className="w-4 h-4 text-amber-300" />}
            className="w-full sm:w-auto bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white"
          >
            View Completion
          </Button>
        )}
      </div>
    </div>
  );
};
