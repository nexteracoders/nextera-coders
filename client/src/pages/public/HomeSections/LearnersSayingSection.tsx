import React, { useMemo, useState } from 'react';
import { Section } from '../../../components/ui/Section';
import { SectionHeading } from '../../../components/ui/SectionHeading';
import {
  LEARNERS_FEEDBACK_DATA,
  LearnerReview,
} from '../../../data/learnersFeedback.data';
import {
  CheckCircle2,
} from 'lucide-react';
import { cn } from '../../../utils/cn';

export const LearnersSayingSection: React.FC = () => {
  const [isPaused, setIsPaused] = useState(false);

  // Split reviews into 2 rows
  const midPoint = Math.ceil(LEARNERS_FEEDBACK_DATA.length / 2);
  const row1 = useMemo(() => LEARNERS_FEEDBACK_DATA.slice(0, midPoint), [midPoint]);
  const row2 = useMemo(() => LEARNERS_FEEDBACK_DATA.slice(midPoint), [midPoint]);

  // Duplicate for seamless infinite loop
  const row1Duplicated = useMemo(() => [...row1, ...row1, ...row1], [row1]);
  const row2Duplicated = useMemo(() => [...row2, ...row2, ...row2], [row2]);

  const renderCard = (learner: LearnerReview, keySuffix: string | number) => (
    <div
      key={`${learner.id}-${keySuffix}`}
      className="w-[270px] sm:w-[360px] max-w-[82vw] shrink-0 p-4 sm:p-5 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-dark-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between select-none active:scale-[0.98] cursor-pointer"
    >
      <div>
        {/* Normal, Clean, Highly-Readable Quote */}
        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
          "{learner.quote}"
        </p>
      </div>

      {/* Clean User Profile, Company & Date */}
      <div className="pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-slate-100 dark:border-dark-800 flex items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-bold text-[11px] sm:text-xs flex items-center justify-center shrink-0 border border-brand-200/60 dark:border-brand-800/60 shadow-2xs">
            {learner.avatarText}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
              <span className="truncate">{learner.name}</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 fill-emerald-500/20" />
            </h4>
            <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-mono block truncate">
              {learner.company ? `${learner.role} @ ${learner.company}` : learner.role}
            </span>
          </div>
        </div>

        <span className="text-[10px] sm:text-xs text-slate-400 font-mono shrink-0">{learner.date}</span>
      </div>
    </div>
  );

  return (
    <Section variant="subtle" className="pt-6 sm:pt-8 pb-8 sm:pb-12 overflow-hidden relative">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Section Heading */}
        <SectionHeading
          title="What Learners Are Saying"
          subtitle="Real feedback and career breakthroughs from engineers who learned and built with NextEra Coders."
          highlightText="Learners Are Saying"
          align="center"
          className="mb-2 sm:mb-4"
        />

        {/* 2 ROWS STREAMING IN OPPOSITE DIRECTIONS WITH TOUCH PAUSE & INDEPENDENT HOVER */}
        <div
          className="relative w-full overflow-hidden space-y-3 sm:space-y-4 pt-1"
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
          onTouchCancel={() => setIsPaused(false)}
        >
          {/* Gradient Masks for Clean Edge Fading */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-12 sm:w-28 bg-gradient-to-r from-slate-100/90 dark:from-dark-950/90 to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-12 sm:w-28 bg-gradient-to-l from-slate-100/90 dark:from-dark-950/90 to-transparent z-10" />

          {/* ROW 1: Slides Right to Left (Moving Left). Pauses on hover/touch */}
          <div className={cn("flex overflow-hidden marquee-row", isPaused && "is-paused")}>
            <div
              className="animate-marquee-left flex gap-3 sm:gap-4"
              style={{ animationPlayState: isPaused ? 'paused' : undefined }}
            >
              {row1Duplicated.map((learner, idx) => renderCard(learner, `r1-${idx}`))}
            </div>
          </div>

          {/* ROW 2: Slides Left to Right (Moving Right). Pauses on hover/touch */}
          <div className={cn("flex overflow-hidden marquee-row", isPaused && "is-paused")}>
            <div
              className="animate-marquee-right flex gap-3 sm:gap-4"
              style={{ animationPlayState: isPaused ? 'paused' : undefined }}
            >
              {row2Duplicated.map((learner, idx) => renderCard(learner, `r2-${idx}`))}
            </div>
          </div>
        </div>

        {/* Subtle helper caption on mobile */}
        <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 font-mono sm:hidden flex items-center justify-center gap-1.5 pt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Tap & hold any review to pause and read
        </p>
      </div>
    </Section>
  );
};

