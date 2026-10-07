import React from 'react';
import { Section } from '../../../components/ui/Section';
import { SectionHeading } from '../../../components/ui/SectionHeading';
import { WHY_US_DATA } from '../../../data/whyUs.data';
import {
  Terminal,
  Compass,
  Cpu,
  FolderGit2,
  Flame,
  Award,
  Sparkles,
} from 'lucide-react';

const ICON_CONFIG: Record<
  string,
  { icon: React.ReactNode; bg: string; border: string; glow: string }
> = {
  Terminal: {
    icon: <Terminal className="w-5 h-5 text-indigo-500" />,
    bg: 'bg-indigo-500/10',
    border: 'hover:border-indigo-500/40',
    glow: 'group-hover:shadow-indigo-500/15',
  },
  Compass: {
    icon: <Compass className="w-5 h-5 text-cyan-500" />,
    bg: 'bg-cyan-500/10',
    border: 'hover:border-cyan-500/40',
    glow: 'group-hover:shadow-cyan-500/15',
  },
  Cpu: {
    icon: <Cpu className="w-5 h-5 text-emerald-500" />,
    bg: 'bg-emerald-500/10',
    border: 'hover:border-emerald-500/40',
    glow: 'group-hover:shadow-emerald-500/15',
  },
  FolderGit2: {
    icon: <FolderGit2 className="w-5 h-5 text-violet-500" />,
    bg: 'bg-violet-500/10',
    border: 'hover:border-violet-500/40',
    glow: 'group-hover:shadow-violet-500/15',
  },
  Flame: {
    icon: <Flame className="w-5 h-5 text-amber-500" />,
    bg: 'bg-amber-500/10',
    border: 'hover:border-amber-500/40',
    glow: 'group-hover:shadow-amber-500/15',
  },
  Award: {
    icon: <Award className="w-5 h-5 text-pink-500" />,
    bg: 'bg-pink-500/10',
    border: 'hover:border-pink-500/40',
    glow: 'group-hover:shadow-pink-500/15',
  },
};

export const WhyUsSection: React.FC = () => {
  return (
    <Section variant="subtle" className="py-16 sm:py-20 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 right-10 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto space-y-10">
        <SectionHeading
          badge="Why NextEra Coders"
          title="Engineered for Software Mastery"
          subtitle="Everything you need to break into high-impact software engineering without fluff or wasted hours."
          highlightText="Software Mastery"
          align="center"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {WHY_US_DATA.map((item, idx) => {
            const config = ICON_CONFIG[item.iconName] || {
              icon: <Sparkles className="w-5 h-5 text-amber-500" />,
              bg: 'bg-amber-500/10',
              border: 'hover:border-amber-500/40',
              glow: 'group-hover:shadow-amber-500/15',
            };

            return (
              <div
                key={idx}
                className={`p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1.5 group ${config.border} ${config.glow}`}
              >
                <div
                  className={`w-12 h-12 rounded-2xl ${config.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  {config.icon}
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {item.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-2">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
};

