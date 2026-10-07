import React, { useState, useEffect } from 'react';
import {
  IHomeTutorialSubject,
  homeTutorialsService,
  ColorThemeKey,
  COLOR_THEMES,
} from '../../services/homeTutorials.service';
import {
  X,
  Plus,
  RotateCcw,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  BookOpen,
  Sparkles,
  Layers,
  Cpu,
  Coffee,
  Cloud,
  Network,
  Binary,
  FileCode2,
  FileCode,
  Database,
  ShieldCheck,
  Terminal,
  Code2,
  Globe,
  Server,
  Zap,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import api from '../../services/api';
import { cn } from '../../utils/cn';

interface ManageHomeTutorialsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ICON_OPTIONS = [
  { id: 'Binary', label: 'Binary / DSA' },
  { id: 'Layers', label: 'Layers / Web Dev' },
  { id: 'FileCode2', label: 'FileCode / Python' },
  { id: 'FileCode', label: 'FileCode / JS' },
  { id: 'Coffee', label: 'Coffee / Java' },
  { id: 'Cpu', label: 'CPU / C++' },
  { id: 'Network', label: 'Network / System Design' },
  { id: 'Cloud', label: 'Cloud / DevOps' },
  { id: 'Sparkles', label: 'Sparkles / AI & ML' },
  { id: 'Database', label: 'Database / SQL' },
  { id: 'ShieldCheck', label: 'Shield / Security' },
  { id: 'Terminal', label: 'Terminal / C' },
  { id: 'Code2', label: 'Code2 / General' },
  { id: 'BookOpen', label: 'Book / Docs' },
  { id: 'Globe', label: 'Globe / Web' },
  { id: 'Server', label: 'Server / Backend' },
  { id: 'Zap', label: 'Zap / Fast' },
];

const THEME_OPTIONS: Array<{ key: ColorThemeKey; label: string; bgClass: string }> = [
  { key: 'purple', label: 'Purple', bgClass: 'bg-purple-500' },
  { key: 'cyan', label: 'Cyan', bgClass: 'bg-cyan-500' },
  { key: 'blue', label: 'Blue', bgClass: 'bg-blue-500' },
  { key: 'red', label: 'Red', bgClass: 'bg-red-500' },
  { key: 'indigo', label: 'Indigo', bgClass: 'bg-indigo-500' },
  { key: 'amber', label: 'Amber', bgClass: 'bg-amber-500' },
  { key: 'sky', label: 'Sky', bgClass: 'bg-sky-500' },
  { key: 'pink', label: 'Pink', bgClass: 'bg-pink-500' },
  { key: 'emerald', label: 'Emerald', bgClass: 'bg-emerald-500' },
  { key: 'rose', label: 'Rose', bgClass: 'bg-rose-500' },
  { key: 'slate', label: 'Slate', bgClass: 'bg-slate-500' },
];

const TRACK_PRESETS = [
  { trackId: 'dsa', title: 'Data Structures & Algorithms', tag: 'DSA & ALGORITHMS', icon: 'Binary', theme: 'purple' },
  { trackId: 'react', title: 'Web & Full-Stack Development', tag: 'REACT & NEXT.JS', icon: 'Layers', theme: 'cyan' },
  { trackId: 'python', title: 'Python Programming', tag: 'PYTHON 3.12', icon: 'FileCode2', theme: 'blue' },
  { trackId: 'java', title: 'Java Enterprise Systems', tag: 'JAVA 21 & SPRING', icon: 'Coffee', theme: 'red' },
  { trackId: 'cpp', title: 'C++ & System Programming', tag: 'C++20 & STL', icon: 'Cpu', theme: 'indigo' },
  { trackId: 'systemdesign', title: 'System Design & Architecture', tag: 'HLD & LLD SYSTEMS', icon: 'Network', theme: 'amber' },
  { trackId: 'devops', title: 'DevOps & Cloud Engineering', tag: 'DOCKER, K8S & CI/CD', icon: 'Cloud', theme: 'sky' },
  { trackId: 'ml', title: 'AI, ML & Generative AI', tag: 'AI & NEURAL NETS', icon: 'Sparkles', theme: 'pink' },
  { trackId: 'sql', title: 'SQL & Database Engineering', tag: 'SQL & POSTGRES', icon: 'Database', theme: 'emerald' },
  { trackId: 'cybersecurity', title: 'Cybersecurity & Ethical Hacking', tag: 'INFOSEC & OWASP', icon: 'ShieldCheck', theme: 'rose' },
  { trackId: 'javascript', title: 'JavaScript & TypeScript Mastery', tag: 'JS ES6+ & TS', icon: 'FileCode', theme: 'amber' },
  { trackId: 'c', title: 'C Programming Fundamentals', tag: 'C LANGUAGE', icon: 'Terminal', theme: 'slate' },
];

const renderIcon = (name: string, className: string = 'w-4 h-4') => {
  switch (name?.toLowerCase()) {
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

export const ManageHomeTutorialsModal: React.FC<ManageHomeTutorialsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [subjects, setSubjects] = useState<IHomeTutorialSubject[]>([]);
  const [backendTutorials, setBackendTutorials] = useState<any[]>([]);
  const [editingSubject, setEditingSubject] = useState<IHomeTutorialSubject | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');

  // Form State
  const [formId, setFormId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formTrackId, setFormTrackId] = useState('');
  const [formTag, setFormTag] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIconName, setFormIconName] = useState('Binary');
  const [formTheme, setFormTheme] = useState<ColorThemeKey>('purple');
  const [formShowOnHome, setFormShowOnHome] = useState(true);
  const [formAutoCount, setFormAutoCount] = useState(true);
  const [formManualCount, setFormManualCount] = useState<number>(10);

  useEffect(() => {
    if (!isOpen) return;
    const unsub = homeTutorialsService.subscribe((list) => {
      setSubjects(list);
    });
    return () => unsub();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const fetchTutorials = async () => {
      try {
        const res = await api.get('/tutorials?limit=100');
        if (res.data?.data?.tutorials) {
          setBackendTutorials(res.data.data.tutorials);
        }
      } catch {
        // Fallback
      }
    };
    fetchTutorials();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOpenCreate = () => {
    setFormId('');
    setFormTitle('');
    setFormTrackId('python');
    setFormTag('PYTHON');
    setFormDescription('Master core programming, OOP architecture, and automated scripting.');
    setFormIconName('FileCode2');
    setFormTheme('blue');
    setFormShowOnHome(true);
    setFormAutoCount(true);
    setFormManualCount(10);
    setEditingSubject(null);
    setViewMode('form');
  };

  const handleOpenEdit = (s: IHomeTutorialSubject) => {
    setFormId(s.id);
    setFormTitle(s.title);
    setFormTrackId(s.trackId);
    setFormTag(s.tag);
    setFormDescription(s.description);
    setFormIconName(s.iconName);
    setFormTheme(s.theme);
    setFormShowOnHome(s.showOnHome);
    setFormAutoCount(s.autoCount);
    setFormManualCount(s.manualChapterCount || 10);
    setEditingSubject(s);
    setViewMode('form');
  };

  const handleApplyTrackPreset = (preset: (typeof TRACK_PRESETS)[0]) => {
    setFormTrackId(preset.trackId);
    setFormTitle(preset.title);
    setFormTag(preset.tag);
    setFormIconName(preset.icon);
    setFormTheme(preset.theme as ColorThemeKey);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formTrackId.trim()) return;

    homeTutorialsService.saveSubject({
      id: formId || undefined,
      title: formTitle.trim(),
      trackId: formTrackId.trim().toLowerCase(),
      tag: formTag.trim(),
      description: formDescription.trim(),
      iconName: formIconName,
      theme: formTheme,
      showOnHome: formShowOnHome,
      autoCount: formAutoCount,
      manualChapterCount: formAutoCount ? undefined : Number(formManualCount),
      order: editingSubject?.order,
    });

    setViewMode('list');
    setEditingSubject(null);
  };

  const handleToggleShow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    homeTutorialsService.toggleHomeVisibility(id);
  };

  const handleMove = (id: string, dir: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    homeTutorialsService.moveSubject(id, dir);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to remove this subject from Home configuration?')) {
      homeTutorialsService.deleteSubject(id);
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all Home page tutorial subjects back to standard default settings?')) {
      homeTutorialsService.resetToDefaults();
    }
  };

  const visibleCount = subjects.filter((s) => s.showOnHome).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden font-sans">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Manage Home Page Tutorial Subjects</span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {visibleCount} Active on Home
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Control which subject tracks appear on the homepage, edit titles & tags, and automatically sync module counts.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {viewMode === 'list' ? (
            <div className="space-y-4">
              {/* Action Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850/50 border border-slate-200/70 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    💡 Cards are shown in a 4-column responsive grid on the Home Page.
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetDefaults}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-mono font-semibold transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Defaults</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenCreate}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono shadow-sm transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Subject Track</span>
                  </button>
                </div>
              </div>

              {/* Subjects List */}
              <div className="space-y-2.5">
                {subjects.map((subject, idx) => {
                  const themeConfig = COLOR_THEMES[subject.theme] || COLOR_THEMES.purple;
                  const calculatedChapters = homeTutorialsService.calculateChapterCount(subject, backendTutorials);

                  return (
                    <div
                      key={subject.id}
                      className={cn(
                        'p-4 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4',
                        subject.showOnHome
                          ? 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-xs'
                          : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/40 opacity-70'
                      )}
                    >
                      {/* Left: Reorder & Icon & Details */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Order Controls */}
                        <div className="flex flex-col gap-0.5 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={(e) => handleMove(subject.id, 'up', e)}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === subjects.length - 1}
                            onClick={(e) => handleMove(subject.id, 'down', e)}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Icon */}
                        <div className={`p-2.5 rounded-xl ${themeConfig.color} shrink-0`}>
                          {renderIcon(subject.iconName, `w-5 h-5 ${themeConfig.textColor}`)}
                        </div>

                        {/* Text */}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                              {subject.title}
                            </h4>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                              {subject.tag}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400">
                              track: <code className="text-amber-600 dark:text-amber-400">{subject.trackId}</code>
                            </span>
                          </div>

                          <div className="flex items-center gap-3 mt-1 text-xs">
                            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
                              <BookOpen className="w-3 h-3 text-slate-400" />
                              <span>{calculatedChapters} Chapters</span>
                              {subject.autoCount ? (
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                                  ⚡ Auto-synced
                                </span>
                              ) : (
                                <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded">
                                  Manual
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Toggle & Action Buttons */}
                      <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                        {/* Toggle Home Visibility */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleShow(subject.id, e)}
                          className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer',
                            subject.showOnHome
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                          )}
                        >
                          {subject.showOnHome ? (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>Home: Visible</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>Hidden</span>
                            </>
                          )}
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(subject)}
                          className="p-2 rounded-xl text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                          title="Edit Subject"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Delete for extra custom subjects */}
                        <button
                          type="button"
                          onClick={(e) => handleDelete(subject.id, e)}
                          className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                          title="Remove Subject"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Form View: Add / Edit Subject */
            <form onSubmit={handleSaveForm} className="space-y-6">
              {/* Preset Track Quick Selectors */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  ⚡ Quick Track Presets (Click to autofill):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {TRACK_PRESETS.map((preset) => (
                    <button
                      key={preset.trackId}
                      type="button"
                      onClick={() => handleApplyTrackPreset(preset)}
                      className={cn(
                        'px-2.5 py-1 rounded-lg text-xs font-mono font-medium border transition-all cursor-pointer',
                        formTrackId === preset.trackId
                          ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/50 font-bold'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      )}
                    >
                      {preset.title.split(' ')[0]} ({preset.trackId})
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    Subject Display Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Data Structures & Algorithms"
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>

                {/* Track ID */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    Tutorial Track Slug * (e.g. dsa, python, react, java, cpp)
                  </label>
                  <input
                    type="text"
                    required
                    value={formTrackId}
                    onChange={(e) => setFormTrackId(e.target.value)}
                    placeholder="e.g. dsa"
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                  <span className="text-[11px] text-slate-400 font-mono">
                    Routes to: <code className="text-amber-500">/tutorials?track={formTrackId || 'track'}</code>
                  </span>
                </div>

                {/* Tag Badge */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    Badge / Tag Pill Text
                  </label>
                  <input
                    type="text"
                    value={formTag}
                    onChange={(e) => setFormTag(e.target.value)}
                    placeholder="e.g. DSA & ALGORITHMS"
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>

                {/* Icon Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    Icon
                  </label>
                  <select
                    value={formIconName}
                    onChange={(e) => setFormIconName(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  >
                    {ICON_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  Card Short Description
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Arrays, Linked Lists, Trees, Graphs, Dynamic Programming with full code examples..."
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              {/* Color Theme Selector */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  Color Theme & Glow Preset:
                </label>
                <div className="flex flex-wrap gap-2">
                  {THEME_OPTIONS.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setFormTheme(t.key)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer',
                        formTheme === t.key
                          ? 'border-amber-500 bg-amber-500/10 text-slate-900 dark:text-white font-bold ring-2 ring-amber-500/30'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      )}
                    >
                      <span className={`w-3 h-3 rounded-full ${t.bgClass}`} />
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Automatic Dynamic Module / Chapter Fetching Section */}
              <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <div>
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                        Automatic Module & Chapter Count Calculation
                      </h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Automatically sums up static curriculum chapters and dynamic admin chapters created in database.
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formAutoCount}
                      onChange={(e) => setFormAutoCount(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                {!formAutoCount && (
                  <div className="pt-2 border-t border-amber-500/20 flex items-center gap-3">
                    <label className="text-xs font-mono text-slate-700 dark:text-slate-300">
                      Manual Chapter Count Override:
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={formManualCount}
                      onChange={(e) => setFormManualCount(Number(e.target.value))}
                      className="w-24 h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Show on Home Page Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Show in Home Page 4-Column Grid
                  </span>
                  <p className="text-[11px] text-slate-400">
                    When enabled, this subject card will be showcased on the Home page.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formShowOnHome}
                    onChange={(e) => setFormShowOnHome(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {/* Live Preview Card */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                  👀 Live Card Preview (As shown on Home Page):
                </label>
                <div className="max-w-xs">
                  {(() => {
                    const themeConfig = COLOR_THEMES[formTheme] || COLOR_THEMES.purple;
                    const previewCount = formAutoCount
                      ? homeTutorialsService.calculateChapterCount(
                          {
                            id: formId || 'preview',
                            title: formTitle || 'Preview Title',
                            trackId: formTrackId || 'python',
                            tag: formTag || 'TAG',
                            description: formDescription || 'Description',
                            iconName: formIconName,
                            theme: formTheme,
                            showOnHome: true,
                            autoCount: true,
                            order: 1,
                          },
                          backendTutorials
                        )
                      : formManualCount;

                    return (
                      <div
                        className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-md ${themeConfig.border} ${themeConfig.glow}`}
                      >
                        <div className="space-y-3.5">
                          <div className="flex items-center justify-between">
                            <div className={`p-3 rounded-xl ${themeConfig.color}`}>
                              {renderIcon(formIconName, `w-5 h-5 ${themeConfig.textColor}`)}
                            </div>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {formTag || 'TAG'}
                            </span>
                          </div>

                          <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                              {formTitle || 'Subject Title'}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1.5 line-clamp-2">
                              {formDescription || 'Short description of the curriculum...'}
                            </p>
                          </div>
                        </div>

                        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                            <span>{previewCount} Chapters</span>
                          </span>
                          <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                            <span>View Docs</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono shadow-md transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Subject Configuration</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
