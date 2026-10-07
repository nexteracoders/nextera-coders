import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { ILessonResource } from '../../types/course.types';
import { FileText, Code2, Link as LinkIcon, ExternalLink, Paperclip } from 'lucide-react';

interface LessonResourcesProps {
  resources?: ILessonResource[];
}

export const LessonResources: React.FC<LessonResourcesProps> = ({ resources }) => {
  if (!resources || resources.length === 0) {
    return null;
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'PDF':
        return <FileText className="w-4 h-4 text-rose-500" />;
      case 'Code':
        return <Code2 className="w-4 h-4 text-brand-500" />;
      case 'Link':
        return <LinkIcon className="w-4 h-4 text-cyan-500" />;
      default:
        return <Paperclip className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <Card variant="default">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-slate-900 dark:text-white">
          <Paperclip className="w-4 h-4 text-brand-500" />
          Supplementary Materials & Resources
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {resources.map((res, i) => (
            <a
              key={i}
              href={res.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl border border-slate-200 dark:border-dark-800 bg-slate-50/60 dark:bg-dark-850/40 hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors flex items-center justify-between gap-3 group focus:outline-none"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shrink-0">
                  {getIcon(res.type)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {res.title}
                  </p>
                  <span className="text-[10px] font-mono text-slate-400">{res.type}</span>
                </div>
              </div>

              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-500 shrink-0" />
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
