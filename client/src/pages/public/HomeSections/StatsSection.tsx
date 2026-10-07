import React from 'react';
import { Section } from '../../../components/ui/Section';
import { SectionHeading } from '../../../components/ui/SectionHeading';
import {
  Users,
  Code2,
  Trophy,
  Zap,
} from 'lucide-react';

const RICH_STATS = [
  {
    icon: <Users className="w-6 h-6 text-amber-400" />,
    value: '50,000+',
    label: 'Engineers Enrolled',
    description: 'Active learners mastering full-stack & DSA pipelines',
    color: 'from-amber-500/20 via-amber-500/5 to-transparent border-amber-500/30',
  },
  {
    icon: <Code2 className="w-6 h-6 text-emerald-400" />,
    value: '1.2M+',
    label: 'Test Submissions',
    description: 'Code executions across Python, C++, Java, & TypeScript',
    color: 'from-emerald-500/20 via-emerald-500/5 to-transparent border-emerald-500/30',
  },
  {
    icon: <Trophy className="w-6 h-6 text-sky-400" />,
    value: '250+',
    label: 'Pattern-Based DSA',
    description: '14 structural categories for FAANG & startup interviews',
    color: 'from-sky-500/20 via-sky-500/5 to-transparent border-sky-500/30',
  },
  {
    icon: <Zap className="w-6 h-6 text-purple-400" />,
    value: '100%',
    label: 'Practical Rigor',
    description: 'Live compiler sandboxes, real projects, zero fluff',
    color: 'from-purple-500/20 via-purple-500/5 to-transparent border-purple-500/30',
  },
];

export const StatsSection: React.FC = () => {
  return (
    <Section variant="dark" className="py-20 sm:py-24 relative overflow-hidden bg-slate-950">
      {/* Background ambient radial lights */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-emerald-500/10 blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto space-y-12">
        <SectionHeading
          badge="Platform Impact & Scale"
          title="Engineered for Continuous Coding Growth"
          subtitle="Designed with scalable curriculums, instant compiler sandboxes, and high-rigor engineering pathways."
          align="center"
          className="text-white"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {RICH_STATS.map((stat, idx) => (
            <div
              key={idx}
              className={`p-6 sm:p-7 rounded-3xl bg-gradient-to-b ${stat.color} bg-slate-900/90 border backdrop-blur-xl text-center space-y-3 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1.5 group`}
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                {stat.icon}
              </div>

              <div className="space-y-1">
                <h3 className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight group-hover:text-amber-400 transition-colors">
                  {stat.value}
                </h3>
                <h4 className="text-sm font-bold text-slate-200">{stat.label}</h4>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                {stat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
};

