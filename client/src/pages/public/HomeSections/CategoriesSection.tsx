import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { Section } from '../../../components/ui/Section';
import { SectionHeading } from '../../../components/ui/SectionHeading';
import {
  Layers,
  Cpu,
  Coffee,
  Cloud,
  Network,
  Binary,
  FileCode2,
  FileCode,
  Sparkles,
  ArrowRight,
  BookOpen,
  Database,
  ShieldCheck,
  Terminal,
  Code2,
  Globe,
  Server,
  Zap,
} from 'lucide-react';
import {
  homeTutorialsService,
  IHomeTutorialSubject,
  COLOR_THEMES,
} from '../../../services/homeTutorials.service';
import api from '../../../services/api';

const getSubjectIcon = (iconName: string, className: string = 'w-5 h-5') => {
  switch (iconName?.toLowerCase()) {
    case 'binary':
      return <Binary className={className} />;
    case 'layers':
      return <Layers className={className} />;
    case 'filecode2':
      return <FileCode2 className={className} />;
    case 'filecode':
      return <FileCode className={className} />;
    case 'coffee':
      return <Coffee className={className} />;
    case 'cpu':
      return <Cpu className={className} />;
    case 'network':
      return <Network className={className} />;
    case 'cloud':
      return <Cloud className={className} />;
    case 'sparkles':
      return <Sparkles className={className} />;
    case 'database':
      return <Database className={className} />;
    case 'shieldcheck':
      return <ShieldCheck className={className} />;
    case 'terminal':
      return <Terminal className={className} />;
    case 'code2':
      return <Code2 className={className} />;
    case 'globe':
      return <Globe className={className} />;
    case 'server':
      return <Server className={className} />;
    case 'zap':
      return <Zap className={className} />;
    default:
      return <BookOpen className={className} />;
  }
};

export const CategoriesSection: React.FC = () => {
  const [subjects, setSubjects] = useState<IHomeTutorialSubject[]>([]);
  const [backendTutorials, setBackendTutorials] = useState<any[]>([]);

  // 1. Subscribe to Admin home subjects configuration
  useEffect(() => {
    const unsub = homeTutorialsService.subscribe((list) => {
      setSubjects(list.filter((s) => s.showOnHome).sort((a, b) => a.order - b.order));
    });
    return () => unsub();
  }, []);

  // 2. Fetch live tutorials from database to automatically compute chapter/module counts
  useEffect(() => {
    const fetchTutorials = async () => {
      try {
        const res = await api.get('/tutorials?limit=100');
        if (res.data?.data?.tutorials) {
          setBackendTutorials(res.data.data.tutorials);
        }
      } catch {
        // Fallback to static counts
      }
    };
    fetchTutorials();
  }, []);

  return (
    <Section variant="subtle" className="relative overflow-hidden py-8 sm:py-12">
      {/* Decorative background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-gradient-to-r from-amber-500/5 via-indigo-500/5 to-emerald-500/5 blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        <SectionHeading
          badge="Interactive Documentation & Roadmaps"
          title="Explore Structured Learning Tutorials"
          subtitle="Step-by-step documentation, interactive code sandboxes, and structured chapters across top engineering subjects."
          highlightText="Structured Learning Tutorials"
          align="center"
          className="mb-0"
        />

        {/* 4-column responsive grid container */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {subjects.map((subject) => {
            const themeConfig = COLOR_THEMES[subject.theme] || COLOR_THEMES.purple;
            const chapterCount = homeTutorialsService.calculateChapterCount(subject, backendTutorials);
            const tutorialUrl = `${ROUTES.TUTORIALS}?track=${subject.trackId}`;

            return (
              <Link
                key={subject.id}
                to={tutorialUrl}
                className="group block"
              >
                <div
                  className={`h-full flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1.5 ${themeConfig.border} ${themeConfig.glow}`}
                >
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div
                        className={`p-3 rounded-xl ${themeConfig.color} group-hover:scale-110 transition-transform duration-300`}
                      >
                        {getSubjectIcon(subject.iconName, `w-5 h-5 ${themeConfig.textColor}`)}
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {subject.tag}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {subject.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1.5 line-clamp-2">
                        {subject.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                      <span>{chapterCount} Chapters</span>
                    </span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      <span>View Docs</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Explore All Tutorials Link */}
        <div className="text-center pt-2">
          <Link to={ROUTES.TUTORIALS}>
            <button className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-900 dark:text-white font-bold text-xs sm:text-sm border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:border-amber-500/50 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer group">
              <BookOpen className="w-4 h-4 text-amber-500" />
              <span className="hidden sm:inline">Browse All Subjects & Tutorials Documentation</span>
              <span className="sm:hidden">Browse All Tutorials & Docs</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-500 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
        </div>
      </div>
    </Section>
  );
};
