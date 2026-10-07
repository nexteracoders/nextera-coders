import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface AccordionItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

export interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({
  items,
  allowMultiple = false,
  className,
}) => {
  const [openIds, setOpenIds] = useState<string[]>([items[0]?.id || '']);

  const toggleItem = (id: string) => {
    if (allowMultiple) {
      setOpenIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    } else {
      setOpenIds((prev) => (prev.includes(id) ? [] : [id]));
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {items.map((item) => {
        const isOpen = openIds.includes(item.id);
        return (
          <div
            key={item.id}
            className={cn(
              'rounded-xl border transition-all duration-200 bg-white dark:bg-dark-900 overflow-hidden',
              isOpen
                ? 'border-brand-500/40 shadow-sm dark:border-brand-800/60'
                : 'border-slate-200/80 dark:border-dark-800 hover:border-slate-300 dark:hover:border-slate-700'
            )}
          >
            <button
              type="button"
              onClick={() => toggleItem(item.id)}
              className="w-full px-5 py-4 flex items-center justify-between text-left gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              aria-expanded={isOpen}
            >
              <span className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
                {item.question}
              </span>
              <ChevronDown
                className={cn(
                  'w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200',
                  isOpen && 'rotate-180 text-brand-600 dark:text-brand-400'
                )}
              />
            </button>

            {isOpen && (
              <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-dark-800/80 mt-1">
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
