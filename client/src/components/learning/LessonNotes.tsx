import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { BookOpen } from 'lucide-react';

interface LessonNotesProps {
  title?: string;
  description?: string;
  notes?: string;
}

export const LessonNotes: React.FC<LessonNotesProps> = ({ description, notes }) => {
  const content = notes || description;
  if (!content || content.trim() === '') {
    return (
      <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-dark-800 text-center text-xs text-slate-400 font-mono">
        No supplementary lecture notes attached to this lesson.
      </div>
    );
  }

  return (
    <Card variant="default">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-slate-900 dark:text-white">
          <BookOpen className="w-4 h-4 text-brand-500" />
          Lesson Notes & Architecture Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {description && (
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {description}
          </p>
        )}
        {notes && (
          <div className="prose prose-sm dark:prose-invert max-w-none text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line pt-2 border-t border-slate-100 dark:border-dark-800">
            {notes}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
