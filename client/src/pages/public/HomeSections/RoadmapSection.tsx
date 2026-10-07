import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { Section } from '../../../components/ui/Section';
import { SectionHeading } from '../../../components/ui/SectionHeading';
import { ROADMAP_DATA } from '../../../data/roadmap.data';
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Code2,
  Trophy,
  Briefcase,
  Flame,
  Zap,
} from 'lucide-react';

const STEP_ICONS = [
  <Code2 className="w-5 h-5 text-amber-500" />,
  <Sparkles className="w-5 h-5 text-indigo-500" />,
  <Zap className="w-5 h-5 text-sky-500" />,
  <Flame className="w-5 h-5 text-emerald-500" />,
  <Trophy className="w-5 h-5 text-violet-500" />,
  <Briefcase className="w-5 h-5 text-pink-500" />,
];

export const RoadmapSection: React.FC = () => {
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const activeStep = ROADMAP_DATA[activeStepIdx];

  return (
    <Section variant="default" className="py-8 sm:py-12 overflow-hidden relative">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        <SectionHeading
          title="From First Line of Code to Senior Placement"
          subtitle="Follow our tested step-by-step career milestones engineered to eliminate tutorial paralysis and build production muscle."
          highlightText="Senior Placement"
          align="center"
          className="mb-6 sm:mb-8"
        />

        {/* Interactive Milestone Rail Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          {ROADMAP_DATA.map((step, idx) => {
            const isActive = activeStepIdx === idx;
            return (
              <button
                key={step.stepNumber}
                onClick={() => setActiveStepIdx(idx)}
                className={`p-3 sm:p-4 rounded-2xl border text-left transition-all duration-300 cursor-pointer flex flex-col justify-between gap-3 ${
                  isActive
                    ? 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/40 shadow-lg shadow-amber-500/15 ring-2 ring-amber-500/20 scale-102'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-mono font-black ${
                      isActive ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'
                    }`}
                  >
                    PHASE {step.stepNumber}
                  </span>
                  <div className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                    {STEP_ICONS[idx]}
                  </div>
                </div>

                <div>
                  <h4
                    className={`text-xs font-bold truncate ${
                      isActive ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {step.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-mono truncate">{step.subtitle}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Milestone Deep-Dive Card */}
        <div className="p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
            
            {/* Left: Phase Details */}
            <div className="lg:col-span-7 space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-mono font-black bg-amber-500 text-slate-950 shadow-xs">
                  PHASE {activeStep.stepNumber}
                </span>
                <span className="text-[11px] sm:text-xs font-mono text-slate-500 dark:text-slate-400">
                  {activeStep.subtitle}
                </span>
              </div>

              <h3 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {activeStep.title}
              </h3>

              <p className="text-xs sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                {activeStep.description}
              </p>

              <div className="pt-2 space-y-1.5 sm:space-y-2">
                <span className="text-[11px] sm:text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Core Competencies & Tooling:
                </span>
                <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-1">
                  {activeStep.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] sm:text-xs font-mono font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Milestone CTA & Practice Action */}
            <div className="lg:col-span-5 p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-50 to-indigo-50/40 dark:from-amber-500/10 dark:via-slate-850 dark:to-slate-900 border border-amber-500/20 space-y-3 sm:space-y-4 text-center lg:text-left">
              <div className="space-y-1">
                <span className="text-[10px] sm:text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase">
                  Accelerate this phase
                </span>
                <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Ready to conquer {activeStep.title}?
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Access guided video lessons, hands-on terminal sandbox drills, and graded project repos.
                </p>
              </div>

              <div className="pt-1 sm:pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-2.5 sm:gap-3">
                <Link to={ROUTES.COURSES}>
                  <button className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 text-xs font-mono font-bold transition-all shadow-md flex items-center gap-1.5 sm:gap-2 cursor-pointer">
                    <span>Explore Track Modules</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </Link>
                
                <Link to={ROUTES.DSA}>
                  <button className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-mono font-semibold transition-all cursor-pointer">
                    DSA Ladder
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};

