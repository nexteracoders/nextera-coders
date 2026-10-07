import React from 'react';
import { sanitizeAiText } from '../../utils/cleanAiText';

interface CleanAiResponseViewProps {
  text: string;
  className?: string;
}

/**
 * Renders AI responses in a clean, simple, and well-ordered layout.
 * Removes all raw markdown symbols (###, **, @) and emojis,
 * and formats content into clear headers, numbered points, and clean paragraphs.
 */
export const CleanAiResponseView: React.FC<CleanAiResponseViewProps> = ({
  text,
  className = '',
}) => {
  const sanitized = sanitizeAiText(text);
  if (!sanitized) return null;

  // Split into paragraphs / sections
  const sections = sanitized.split(/\n\n+/);

  return (
    <div className={`space-y-3 font-sans text-xs text-slate-800 dark:text-neutral-200 leading-relaxed ${className}`}>
      {sections.map((section, sIdx) => {
        const lines = section.split('\n').map((l) => l.trim()).filter(Boolean);
        if (lines.length === 0) return null;

        const firstLine = lines[0];

        // Check if first line looks like a section header (ends with colon or all caps or short title)
        const isHeader =
          firstLine.endsWith(':') ||
          (lines.length > 1 && !firstLine.match(/^\d+\./) && !firstLine.startsWith('-') && firstLine.length < 60);

        if (isHeader && lines.length === 1) {
          return (
            <div
              key={sIdx}
              className="font-bold text-amber-600 dark:text-amber-400 font-mono tracking-wide text-[11px] uppercase pt-1 border-b border-slate-200 dark:border-[#2d2d2d] pb-1.5"
            >
              {firstLine.replace(/:$/, '')}
            </div>
          );
        }

        // Check for numbered list items (1. Item Title ...)
        const isNumbered = firstLine.match(/^(\d+)\.\s*(.*)/);
        if (isNumbered) {
          const num = isNumbered[1];
          const title = isNumbered[2];
          const remainingLines = lines.slice(1).join(' ');

          return (
            <div
              key={sIdx}
              className="p-2.5 rounded-lg bg-slate-100/70 dark:bg-[#252526] border border-slate-200 dark:border-[#333] space-y-1 transition-colors"
            >
              <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 border border-amber-500/40">
                  {num}
                </span>
                <span>{title}</span>
              </div>
              {remainingLines && (
                <p className="text-slate-600 dark:text-neutral-300 text-[11px] pl-6 leading-normal font-sans">
                  {remainingLines}
                </p>
              )}
            </div>
          );
        }

        // Regular paragraph or bullets
        return (
          <div key={sIdx} className="space-y-1">
            {lines.map((line, lIdx) => {
              const bulletMatch = line.match(/^[-*•]\s*(.*)/);
              if (bulletMatch) {
                return (
                  <div key={lIdx} className="flex items-start gap-2 pl-1 text-slate-600 dark:text-neutral-300 text-[11px]">
                    <span className="text-amber-500 dark:text-amber-400 mt-1 font-mono text-[9px]">•</span>
                    <span className="flex-1">{bulletMatch[1]}</span>
                  </div>
                );
              }

              return (
                <p key={lIdx} className="text-slate-700 dark:text-neutral-300 text-[11px] leading-relaxed">
                  {line}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
