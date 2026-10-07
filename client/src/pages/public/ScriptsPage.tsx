import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../components/ui/Toast';
import {
  SCRIPTS_DOCUMENTATION,
  SubjectTrack,
  ScriptLevel,
} from '../../data/scriptsDocumentation';
import { ROUTES } from '../../constants/routes';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  BookOpen,
  Search,
  Code2,
  Terminal,
  Play,
  Copy,
  Check,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ExternalLink,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { ProfessionalCodeEditor } from '../../components/code/ProfessionalCodeEditor';

export const ScriptsPage: React.FC = () => {
  const { subjectId } = useParams<{ subjectId?: string }>();
  const navigate = useNavigate();
  const { success } = useToast();

  // Selected subject track
  const currentSubjectId = subjectId || 'javascript';
  const currentTrack: SubjectTrack = useMemo(() => {
    return (
      SCRIPTS_DOCUMENTATION.find((t) => t.id.toLowerCase() === currentSubjectId.toLowerCase()) ||
      SCRIPTS_DOCUMENTATION[0]
    );
  }, [currentSubjectId]);

  useDocumentTitle(`${currentTrack.title} — NextEra Coders Scripts`);

  // Flattened topic list for current track
  const allTopicsInTrack = useMemo(() => {
    return currentTrack.sections.flatMap((sec) =>
      sec.topics.map((top) => ({
        ...top,
        sectionTitle: sec.title,
      }))
    );
  }, [currentTrack]);

  // Active topic state
  const [activeTopicId, setActiveTopicId] = useState<string>(
    allTopicsInTrack[0]?.id || ''
  );

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<'all' | ScriptLevel>('all');
  const [completedTopics, setCompletedTopics] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('nec_completed_script_topics');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Interactive Live Runner State
  const [editableCode, setEditableCode] = useState<string>('');
  const [runnerOutput, setRunnerOutput] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Active Topic object
  const activeTopic = useMemo(() => {
    return (
      allTopicsInTrack.find((t) => t.id === activeTopicId) ||
      allTopicsInTrack[0]
    );
  }, [allTopicsInTrack, activeTopicId]);

  // When track or active topic changes, sync code
  useEffect(() => {
    if (allTopicsInTrack.length > 0 && !allTopicsInTrack.some((t) => t.id === activeTopicId)) {
      setActiveTopicId(allTopicsInTrack[0].id);
    }
  }, [allTopicsInTrack, activeTopicId]);

  useEffect(() => {
    if (activeTopic) {
      setEditableCode(activeTopic.codeExample);
      setRunnerOutput(null);
    }
  }, [activeTopic]);

  // Filtered topics list
  const filteredTopics = useMemo(() => {
    return allTopicsInTrack.filter((topic) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.concept.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesLevel = levelFilter === 'all' || topic.level === levelFilter;

      return matchesSearch && matchesLevel;
    });
  }, [allTopicsInTrack, searchQuery, levelFilter]);

  // Toggle Completed Topic
  const toggleTopicCompletion = (id: string) => {
    setCompletedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        success('Topic marked as mastered! 🚀');
      }
      localStorage.setItem('nec_completed_script_topics', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  // Run in-doc interactive script
  const handleRunInDoc = useCallback(() => {
    setIsRunning(true);
    const logs: string[] = [];
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    try {
      console.log = (...args: any[]) => {
        logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' '));
      };
      console.error = (...args: any[]) => {
        logs.push('[Error] ' + args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' '));
      };
      console.warn = (...args: any[]) => {
        logs.push('[Warn] ' + args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' '));
      };

      if (currentTrack.compilerLanguage === 'javascript' || currentTrack.compilerLanguage === 'typescript') {
        const runFn = new Function(editableCode);
        const ret = runFn();
        if (ret !== undefined && logs.length === 0) {
          logs.push(typeof ret === 'object' ? JSON.stringify(ret, null, 2) : String(ret));
        }
        setRunnerOutput(logs.length > 0 ? logs.join('\n') : 'Code executed with return value: undefined');
      } else {
        setRunnerOutput(activeTopic.expectedOutput || 'Execution completed.');
      }
    } catch (err: any) {
      setRunnerOutput(`Runtime Error: ${err.message || err}`);
    } finally {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      setIsRunning(false);
    }
  }, [editableCode, currentTrack.compilerLanguage, activeTopic]);

  // Open in NEC Compiler Pro
  const handleOpenInCompiler = () => {
    navigate(ROUTES.COMPILER, {
      state: {
        language: currentTrack.compilerLanguage,
        code: editableCode,
      },
    });
  };

  // Next and Previous Topic indices
  const currentTopicIndex = allTopicsInTrack.findIndex((t) => t.id === activeTopic?.id);
  const prevTopic = currentTopicIndex > 0 ? allTopicsInTrack[currentTopicIndex - 1] : null;
  const nextTopic = currentTopicIndex < allTopicsInTrack.length - 1 ? allTopicsInTrack[currentTopicIndex + 1] : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* 1. TOP HERO HEADER & SUBJECT TRACK SWITCHER */}
      <section className="border-b border-slate-200/90 dark:border-dark-800 bg-white/80 dark:bg-dark-900/80 backdrop-blur-md sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-brand-50 text-brand-600 dark:bg-brand-950/80 dark:text-brand-400 border border-brand-200 dark:border-brand-800/50">
                  Script Documentation
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {currentTrack.version}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-brand-500" />
                <span>{currentTrack.title}</span>
              </h1>
            </div>

            {/* Subject Track Switcher Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {SCRIPTS_DOCUMENTATION.map((track) => {
                const isActive = track.id === currentTrack.id;
                return (
                  <button
                    key={track.id}
                    onClick={() => {
                      navigate(`/scripts/${track.id}`);
                      setActiveTopicId('');
                    }}
                    className={cn(
                      'px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all duration-150 shrink-0 flex items-center gap-1.5 border',
                      isActive
                        ? 'bg-brand-600 text-white border-brand-500 shadow-md shadow-brand-500/20'
                        : 'bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-300 border-transparent hover:bg-slate-200 dark:hover:bg-dark-750'
                    )}
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>{track.shortTitle}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 2. MAIN 2-COLUMN DOCUMENTATION LAYOUT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 flex flex-col lg:flex-row gap-8">
        {/* LEFT SIDEBAR: TOPIC EXPLORER */}
        <aside className="w-full lg:w-80 shrink-0 space-y-4">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topics, syntax, concepts..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs"
            />
          </div>

          {/* Difficulty Filter Chips */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 dark:bg-dark-900 rounded-xl text-xs font-mono">
            {(['all', 'beginner', 'intermediate', 'advanced'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLevelFilter(lvl)}
                className={cn(
                  'flex-1 py-1 rounded-lg capitalize text-[11px] font-semibold transition-colors',
                  levelFilter === lvl
                    ? 'bg-white dark:bg-dark-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Structured Grouped Topic List */}
          <div className="bg-white dark:bg-dark-900 rounded-2xl border border-slate-200 dark:border-dark-800 shadow-sm p-3 max-h-[75vh] overflow-y-auto space-y-5">
            {currentTrack.sections.map((section) => {
              const sectionTopics = section.topics.filter((t) =>
                filteredTopics.some((ft) => ft.id === t.id)
              );

              if (sectionTopics.length === 0) return null;

              return (
                <div key={section.id} className="space-y-1.5">
                  <div className="px-2.5 py-1">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono block">
                      {section.title}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {sectionTopics.map((topic) => {
                      const isActive = topic.id === activeTopic?.id;
                      const isDone = completedTopics.has(topic.id);

                      return (
                        <button
                          key={topic.id}
                          onClick={() => {
                            setActiveTopicId(topic.id);
                            window.scrollTo({ top: 120, behavior: 'smooth' });
                          }}
                          className={cn(
                            'w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 flex items-center justify-between gap-2 group',
                            isActive
                              ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/70 dark:text-brand-300 font-bold shadow-xs'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-dark-850'
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTopicCompletion(topic.id);
                              }}
                              className={cn(
                                'w-4 h-4 rounded-full flex items-center justify-center border transition-colors shrink-0',
                                isDone
                                  ? 'bg-emerald-500 border-emerald-500 text-white'
                                  : 'border-slate-300 dark:border-dark-700 hover:border-brand-500'
                              )}
                              title={isDone ? 'Mark as incomplete' : 'Mark as mastered'}
                            >
                              {isDone && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </button>
                            <span className="truncate">{topic.title}</span>
                          </div>

                          <Badge
                            variant={
                              topic.level === 'beginner'
                                ? 'success'
                                : topic.level === 'intermediate'
                                ? 'default'
                                : 'warning'
                            }
                            size="sm"
                            className="text-[9px] px-1.5 py-0 uppercase font-mono shrink-0"
                          >
                            {topic.level.slice(0, 3)}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* RIGHT MAIN CONTENT: TOPIC READER & LIVE COMPILER */}
        <main className="flex-1 min-w-0 space-y-6">
          {activeTopic ? (
            <article className="space-y-6">
              {/* Topic Hero Card */}
              <div className="p-6 rounded-3xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        activeTopic.level === 'beginner'
                          ? 'success'
                          : activeTopic.level === 'intermediate'
                          ? 'default'
                          : 'warning'
                      }
                      size="md"
                      className="font-mono capitalize font-bold"
                    >
                      {activeTopic.level} Level
                    </Badge>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {currentTrack.shortTitle}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleTopicCompletion(activeTopic.id)}
                      className={cn(
                        'px-3 py-1.5 rounded-xl text-xs font-semibold font-mono flex items-center gap-1.5 border transition-all',
                        completedTopics.has(activeTopic.id)
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                          : 'bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-300 border-transparent hover:border-slate-300'
                      )}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{completedTopics.has(activeTopic.id) ? 'Mastered ✓' : 'Mark as Done'}</span>
                    </button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOpenInCompiler}
                      leftIcon={<Terminal className="w-3.5 h-3.5 text-brand-500" />}
                      rightIcon={<ExternalLink className="w-3 h-3" />}
                      className="text-xs font-mono"
                    >
                      Open in NEC Compiler
                    </Button>
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {activeTopic.title}
                  </h2>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                    {activeTopic.summary}
                  </p>
                </div>
              </div>

              {/* Conceptual Deep Dive */}
              <div className="p-6 rounded-3xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shadow-sm space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Conceptual Architecture & Rules
                </h3>
                <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-3 whitespace-pre-line font-sans">
                  {activeTopic.concept}
                </div>

                {activeTopic.syntax && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-dark-800 space-y-2">
                    <span className="text-xs font-mono font-bold text-slate-400 uppercase">
                      Syntax Blueprint:
                    </span>
                    <pre className="p-3 rounded-xl bg-slate-900 text-brand-300 font-mono text-xs overflow-x-auto">
                      {activeTopic.syntax}
                    </pre>
                  </div>
                )}
              </div>

              {/* 3. INTERACTIVE LIVE CODE RUNNER & MINI-COMPILER */}
              <div className="rounded-3xl bg-slate-950 border border-slate-800 shadow-xl overflow-hidden text-slate-100">
                {/* Runner Top Bar */}
                <div className="px-5 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold font-mono text-white">
                      Live Interactive Script Sandbox
                    </span>
                    <Badge variant="success" size="sm" className="py-0 px-1 text-[9px]">
                      RUNNABLE
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditableCode(activeTopic.codeExample);
                        setRunnerOutput(null);
                        success('Reset code to example boilerplate.');
                      }}
                      title="Reset code to original example"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-mono flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Reset</span>
                    </button>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(editableCode);
                        setCopied(true);
                        success('Code copied!');
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      title="Copy script code"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-mono flex items-center gap-1"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
                    </button>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleRunInDoc}
                      isLoading={isRunning}
                      leftIcon={<Play className="w-3.5 h-3.5 fill-current" />}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold px-3 py-1"
                    >
                      Run Script
                    </Button>
                  </div>
                </div>

                {/* Editable Code Area with Syntax Highlighting */}
                <div className="h-64 sm:h-72 overflow-hidden relative">
                  <ProfessionalCodeEditor
                    value={editableCode}
                    onChange={setEditableCode}
                    language={currentTrack.compilerLanguage}
                    theme="vs-dark"
                    fontSize={13}
                    onRun={handleRunInDoc}
                    className="h-full border-none"
                  />
                </div>

                {/* Live Output Console Area */}
                {runnerOutput !== null ? (
                  <div className="border-t border-slate-800 bg-slate-900/90 p-4 font-mono text-xs space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <Terminal className="w-3.5 h-3.5" /> Console Output:
                      </span>
                      <button
                        onClick={() => setRunnerOutput(null)}
                        className="text-slate-500 hover:text-slate-300 text-xs font-mono"
                      >
                        Clear
                      </button>
                    </div>
                    <pre className="p-3 rounded-xl bg-slate-950 text-slate-200 whitespace-pre-wrap leading-relaxed border border-slate-800">
                      {runnerOutput}
                    </pre>
                  </div>
                ) : (
                  activeTopic.expectedOutput && (
                    <div className="border-t border-slate-800/60 bg-slate-900/50 p-4 font-mono text-xs space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Expected Output:
                      </span>
                      <pre className="text-slate-400 leading-relaxed whitespace-pre-wrap">
                        {activeTopic.expectedOutput}
                      </pre>
                    </div>
                  )
                )}

                {/* Footer CTA: Fullscreen Compiler Transfer */}
                <div className="px-5 py-2.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Want full multi-file IDE features?</span>
                  <button
                    onClick={handleOpenInCompiler}
                    className="text-brand-400 hover:text-brand-300 font-bold flex items-center gap-1 hover:underline"
                  >
                    Open in Full-Screen NEC Compiler <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Key Takeaways & Best Practices Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Key Takeaways */}
                <div className="p-5 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shadow-sm space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Key Architectural Takeaways
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                    {activeTopic.keyTakeaways.map((takeaway, i) => (
                      <li key={i} className="flex items-start gap-2 leading-relaxed">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Best Practices & Pitfalls */}
                <div className="p-5 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shadow-sm space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Best Practices & Pitfalls
                  </h4>
                  <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                    {activeTopic.bestPractices.map((bp, i) => (
                      <div key={i} className="flex items-start gap-2 leading-relaxed">
                        <span className="text-blue-500 font-bold font-mono">✓</span>
                        <span>{bp}</span>
                      </div>
                    ))}
                    {activeTopic.commonPitfalls.map((pitfall, i) => (
                      <div key={i} className="flex items-start gap-2 leading-relaxed text-amber-600 dark:text-amber-400">
                        <span className="font-bold font-mono">⚠</span>
                        <span>{pitfall}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Next / Previous Topic Navigation */}
              <div className="pt-6 border-t border-slate-200 dark:border-dark-800 flex items-center justify-between gap-4">
                {prevTopic ? (
                  <button
                    onClick={() => {
                      setActiveTopicId(prevTopic.id);
                      window.scrollTo({ top: 120, behavior: 'smooth' });
                    }}
                    className="p-3 rounded-2xl border border-slate-200 dark:border-dark-800 hover:bg-slate-100 dark:hover:bg-dark-900 text-left transition-colors flex items-center gap-3"
                  >
                    <ChevronLeft className="w-5 h-5 text-slate-400" />
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase block">Previous Topic</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                        {prevTopic.title}
                      </span>
                    </div>
                  </button>
                ) : <div />}

                {nextTopic ? (
                  <button
                    onClick={() => {
                      setActiveTopicId(nextTopic.id);
                      window.scrollTo({ top: 120, behavior: 'smooth' });
                    }}
                    className="p-3 rounded-2xl border border-brand-500/40 bg-brand-50/50 dark:bg-brand-950/20 hover:bg-brand-100/50 dark:hover:bg-brand-950/40 text-right transition-colors flex items-center gap-3 ml-auto"
                  >
                    <div>
                      <span className="text-[10px] font-mono text-brand-600 dark:text-brand-400 uppercase block font-bold">
                        Next Topic
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                        {nextTopic.title}
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-brand-500" />
                  </button>
                ) : <div />}
              </div>
            </article>
          ) : (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 space-y-3">
              <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                No matching documentation topics found
              </h3>
              <p className="text-xs text-slate-500">
                Try adjusting your search query or difficulty filters.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
