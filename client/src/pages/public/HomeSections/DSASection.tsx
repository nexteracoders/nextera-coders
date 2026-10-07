import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { Section } from '../../../components/ui/Section';
import { Button } from '../../../components/ui/Button';
import { DSA_TOPICS_DATA } from '../../../data/dsa.data';
import {
  CheckCircle2,
  ArrowRight,
  Cpu,
  Layers,
  FileCode,
  GitCommit,
  ListOrdered,
  GitBranch,
  Share2,
  Sparkles,
  Target,
  Code2,
} from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  Layers: <Layers className="w-5 h-5 text-indigo-500" />,
  FileCode: <FileCode className="w-5 h-5 text-emerald-500" />,
  GitCommit: <GitCommit className="w-5 h-5 text-sky-500" />,
  ListOrdered: <ListOrdered className="w-5 h-5 text-amber-500" />,
  GitBranch: <GitBranch className="w-5 h-5 text-violet-500" />,
  Share2: <Share2 className="w-5 h-5 text-pink-500" />,
  Cpu: <Cpu className="w-5 h-5 text-teal-500" />,
  Sparkles: <Sparkles className="w-5 h-5 text-amber-500" />,
};

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  Medium: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
  Hard: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20',
  Mixed: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
};

export const DSASection: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');

  const filteredTopics = DSA_TOPICS_DATA.filter((topic) => {
    if (activeFilter === 'All') return true;
    return topic.difficulty === activeFilter;
  });

  return (
    <Section variant="brand" className="py-16 sm:py-20 overflow-hidden relative">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/4 w-[600px] h-[600px] bg-gradient-to-r from-indigo-500/10 via-amber-500/10 to-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: Value Proposition & Key Metrics */}
          <div className="lg:col-span-5 space-y-5 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-mono font-bold text-amber-700 dark:text-amber-300 shadow-xs">
              <Target className="w-3.5 h-3.5 text-amber-500" />
              <span>Pattern-Oriented DSA Ladder</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              Stop Memorizing. <br />
              <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-500 bg-clip-text text-transparent">
                Master 14 Key Patterns.
              </span>
            </h2>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              Crack top tech coding interviews by grouping 250+ problems into 14 repeatable structural patterns with line-by-line spacetime complexity proofs.
            </p>

            <div className="space-y-2.5 pt-1 text-left">
              <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-mono">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Sliding Window, Monotonic Stacks, DFS/BFS, Dynamic Programming</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-mono">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Multi-language code solutions (Python, C++, Java, JS/TS)</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-mono">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>FAANG & Top Startup curated interview company playlists</span>
              </div>
            </div>

            <div className="pt-3 flex flex-wrap items-center justify-center lg:justify-start gap-3">
              <Link to={ROUTES.DSA}>
                <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Explore Full DSA Ladder
                </Button>
              </Link>

              <Link to={ROUTES.PRACTICE}>
                <Button
                  variant="outline"
                  size="md"
                  leftIcon={<Code2 className="w-4 h-4 text-indigo-500" />}
                  className="font-mono text-xs font-bold"
                >
                  Practice 250+ Problems
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column: Pattern Topics Grid with Filter Bar */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Filter Tabs */}
            <div className="flex items-center justify-between gap-2 flex-wrap pb-1">
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                {(['All', 'Easy', 'Medium', 'Hard'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      activeFilter === filter
                        ? 'bg-amber-500 text-slate-950 shadow-xs scale-105'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              <span className="text-xs font-mono text-slate-500 dark:text-slate-400 font-bold">
                Showing {filteredTopics.length} Patterns
              </span>
            </div>

            {/* Topic Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {filteredTopics.slice(0, 6).map((topic, i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 group-hover:scale-110 transition-transform">
                      {iconMap[topic.iconName] || <Cpu className="w-5 h-5 text-amber-500" />}
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                          {topic.title}
                        </h4>
                        <span
                          className={`px-2 py-0.2 rounded-md text-[9px] font-mono font-bold border shrink-0 ${
                            DIFFICULTY_COLORS[topic.difficulty] || DIFFICULTY_COLORS.Mixed
                          }`}
                        >
                          {topic.difficulty}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">
                        {topic.description}
                      </p>

                      <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span className="text-amber-600 dark:text-amber-400 font-bold">
                          {topic.problemsCount}
                        </span>
                        <span className="group-hover:text-slate-900 dark:group-hover:text-white transition-colors flex items-center gap-0.5">
                          Practice <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};

