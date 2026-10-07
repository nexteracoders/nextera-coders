import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Prism from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-json';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  Zap,
  CheckCircle2,
  Copy,
  Check,
  Code2,
  ImageIcon,
  Play,
  RotateCcw,
  Edit3,
  Terminal,
  ExternalLink,
  Globe,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { executeRemoteLanguage } from '../../utils/codeEvaluator';
import { ROUTES } from '../../constants/routes';

export interface TutorialContentRendererProps {
  content?: string;
  className?: string;
  fontSize?: 'sm' | 'base' | 'lg';
}

export interface ISliderItem {
  caption: string;
  url: string;
}

export interface IContentBlock {
  type: 'text' | 'slider' | 'quickfact' | 'keypoints' | 'code' | 'image';
  rawText?: string;
  sliderItems?: ISliderItem[];
  quickFactTitle?: string;
  quickFactText?: string;
  keyPoints?: string[];
  keyPointsTitle?: string;
  codeLanguage?: string;
  codeSnippet?: string;
  imageUrl?: string;
  imageCaption?: string;
}

export interface ICodeExecutionOutput {
  text: string;
  isError: boolean;
  time: number;
  status: string;
  htmlCode?: string;
}

// Normalize language names to Prism grammar keys
export const normalizePrismLanguage = (lang?: string): { prismLang: string; display: string } => {
  const clean = (lang || '').toLowerCase().trim();
  switch (clean) {
    case 'cpp':
    case 'c++':
      return { prismLang: 'cpp', display: 'C++' };
    case 'c':
      return { prismLang: 'c', display: 'C' };
    case 'py':
    case 'python':
    case 'python3':
      return { prismLang: 'python', display: 'Python' };
    case 'java':
      return { prismLang: 'java', display: 'Java' };
    case 'js':
    case 'javascript':
      return { prismLang: 'javascript', display: 'JavaScript' };
    case 'ts':
    case 'typescript':
      return { prismLang: 'typescript', display: 'TypeScript' };
    case 'sql':
      return { prismLang: 'sql', display: 'SQL' };
    case 'html':
    case 'htm':
    case 'xml':
    case 'markup':
      return { prismLang: 'markup', display: 'HTML' };
    case 'css':
      return { prismLang: 'css', display: 'CSS' };
    case 'json':
      return { prismLang: 'json', display: 'JSON' };
    default:
      return { prismLang: clean || 'javascript', display: clean ? clean.toUpperCase() : 'CODE' };
  }
};

// Highlight helper using Prism
export const highlightSnippet = (code: string, language?: string): string => {
  if (!code) return '';
  const { prismLang } = normalizePrismLanguage(language);
  const grammar = Prism.languages[prismLang] || Prism.languages.clike || Prism.languages.javascript;
  try {
    return Prism.highlight(code, grammar, prismLang);
  } catch {
    return code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
};

// =========================================================================
// Real-Time Syntax-Highlighted Practice Code Editor
// Guarantees:
// 1. Dark background (#0d1117) - NEVER white in practice mode.
// 2. Full multi-color Prism syntax highlighting while typing.
// 3. Synchronized line numbers gutter.
// 4. Tab indentation support (2 spaces).
// =========================================================================
export interface TutorialLiveEditorProps {
  code: string;
  onChange: (newCode: string) => void;
  language: string;
  isPractice: boolean;
  minHeight?: string;
}

export const TutorialLiveEditor: React.FC<TutorialLiveEditorProps> = ({
  code,
  onChange,
  language,
  isPractice,
  minHeight = '180px',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const { prismLang } = normalizePrismLanguage(language);

  // Synchronize scroll between textarea overlay and highlighted pre layer
  const handleScroll = () => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  // Support Tab key (2 spaces) and Enter auto-indent
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const val = textarea.value;
      const newVal = val.substring(0, start) + '  ' + val.substring(end);
      onChange(newVal);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  const lines = (code || '').split('\n');
  const highlightedHtml = highlightSnippet(code, language);

  return (
    <div
      className="flex font-mono text-xs sm:text-sm bg-[#0d1117] text-[#cdd6f4] overflow-hidden"
      style={{ minHeight }}
    >
      {/* Line Numbers Gutter */}
      <div
        className="select-none py-4 px-3 text-right text-slate-500 font-mono text-xs border-r border-slate-800 bg-[#090d13] shrink-0"
        style={{ minWidth: '42px' }}
      >
        {lines.map((_, i) => (
          <div key={i} style={{ height: '22px', lineHeight: '22px' }}>
            {i + 1}
          </div>
        ))}
      </div>

      {/* Editor Main Canvas */}
      <div className="relative flex-1 bg-[#0d1117] overflow-hidden">
        {/* Layer 1: Syntax Highlighted Rendering (Always colorful and crisp) */}
        <pre
          ref={preRef}
          aria-hidden="true"
          className="editor-theme-vs-dark absolute inset-0 p-4 m-0 font-mono text-xs sm:text-sm leading-[22px] overflow-hidden pointer-events-none select-none whitespace-pre text-[#cdd6f4] bg-[#0d1117]"
          style={{ lineHeight: '22px' }}
        >
          <code
            className={`language-${prismLang}`}
            dangerouslySetInnerHTML={{
              __html: highlightedHtml + (code.endsWith('\n') ? ' ' : ''),
            }}
          />
        </pre>

        {/* Layer 2: Real Editable Textarea (Only active in Practice Mode) */}
        {isPractice && (
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            className="absolute inset-0 p-4 m-0 font-mono text-xs sm:text-sm leading-[22px] bg-transparent caret-emerald-400 selection:bg-brand-500/40 resize-none focus:outline-hidden overflow-auto whitespace-pre z-10"
            style={{
              lineHeight: '22px',
              color: 'transparent',
              WebkitTextFillColor: 'transparent',
              caretColor: '#34d399',
              backgroundColor: 'transparent',
            }}
            placeholder="Type or modify code here..."
          />
        )}
      </div>
    </div>
  );
};

// Interactive Carousel / Slider Component for 2+ Images
const ContentImageSlider: React.FC<{ items: ISliderItem[] }> = ({ items }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!items || items.length === 0) return null;

  const currentItem = items[currentIndex] || items[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="my-6 rounded-2xl border border-slate-200 dark:border-dark-800 bg-slate-50/70 dark:bg-dark-900/80 shadow-md overflow-hidden transition-all">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/80 dark:bg-dark-850/80 border-b border-slate-200/80 dark:border-dark-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-md bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400">
            <ImageIcon className="w-3.5 h-3.5" />
          </span>
          <span className="font-bold text-slate-800 dark:text-slate-200">
            Visual Comparison & Architecture Slides
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
            Slide {currentIndex + 1} of {items.length}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:hover:text-white px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-dark-750 transition-colors cursor-pointer"
          title="Zoom Fullscreen"
        >
          <Maximize2 className="w-3 h-3" />
          <span className="hidden sm:inline">Expand View</span>
        </button>
      </div>

      {/* Main Slide Stage */}
      <div className="relative group bg-slate-900/5 dark:bg-black/40 min-h-[280px] sm:min-h-[360px] flex items-center justify-center p-3 sm:p-6 overflow-hidden">
        <img
          src={currentItem.url}
          alt={currentItem.caption || `Slide ${currentIndex + 1}`}
          className="max-h-[440px] w-auto max-w-full object-contain rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-[1.01] cursor-pointer"
          onClick={() => setLightboxOpen(true)}
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://placehold.co/800x450/1e293b/94a3b8?text=Image+Unavailable';
          }}
        />

        {/* Previous Button */}
        {items.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous Slide"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer backdrop-blur-sm z-10"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Next Button */}
        {items.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next Slide"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer backdrop-blur-sm z-10"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Caption & Indicator Bar */}
      <div className="p-3.5 bg-white dark:bg-dark-900 border-t border-slate-200/80 dark:border-dark-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <p className="text-slate-700 dark:text-slate-300 font-medium text-center sm:text-left">
          <span className="font-bold text-slate-900 dark:text-white mr-1.5 font-mono">
            Figure {currentIndex + 1}:
          </span>
          {currentItem.caption || `Visual Architecture Diagram ${currentIndex + 1}`}
        </p>

        {/* Dot Indicators */}
        {items.length > 1 && (
          <div className="flex items-center gap-1.5 shrink-0">
            {items.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Jump to slide ${idx + 1}`}
                className={cn(
                  'h-2 rounded-full transition-all cursor-pointer',
                  idx === currentIndex
                    ? 'w-6 bg-purple-600 dark:bg-purple-500'
                    : 'w-2 bg-slate-300 dark:bg-dark-700 hover:bg-slate-400'
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox Modal */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="w-full max-w-5xl flex items-center justify-between mb-3 text-white">
            <span className="text-sm font-semibold flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-purple-400" />
              <span>{currentItem.caption || `Slide ${currentIndex + 1}`}</span>
              <span className="text-xs text-slate-400 font-mono">
                ({currentIndex + 1} / {items.length})
              </span>
            </span>
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div
            className="relative max-w-5xl max-h-[85vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentItem.url}
              alt={currentItem.caption}
              className="max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl"
            />

            {items.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute -left-4 sm:-left-12 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute -right-4 sm:-right-12 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Inline Quick Fact Callout Box
const QuickFactCallout: React.FC<{ title?: string; text: string }> = ({ title, text }) => {
  return (
    <div className="my-5 p-4 sm:p-5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/25 border border-amber-500/30 dark:border-amber-700/40 space-y-2">
      <div className="flex items-center gap-2">
        <span className="p-1 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-400">
          <Zap className="w-4 h-4 fill-amber-500 text-amber-500" />
        </span>
        <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 font-mono">
          {title || 'QUICK FACT / REVISION NOTE'}
        </span>
      </div>
      <p className="text-xs sm:text-sm text-slate-800 dark:text-amber-100/90 leading-relaxed font-normal">
        {text}
      </p>
    </div>
  );
};

// Inline Key Points / Takeaway Checklist
const KeyPointsCallout: React.FC<{ title?: string; points: string[] }> = ({ title, points }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = points.map((p, i) => `${i + 1}. ${p}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-5 p-4 sm:p-5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/25 border border-emerald-500/30 dark:border-emerald-700/40 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 font-mono">
            {title || 'KEY TAKEAWAYS & HIGHLIGHTS'}
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      <ul className="space-y-2 text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-normal">
        {points.map((pt, i) => (
          <li key={i} className="flex items-start gap-2.5 font-normal">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0 mt-0.5">•</span>
            <span className="leading-relaxed font-normal">{pt}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Inline Code Snippet Block with Prism Multi-Color Highlight, Real-Time Practice Mode & Live HTML Web Preview
const CodeSnippetBox: React.FC<{ language?: string; code: string; title?: string }> = ({
  language = 'javascript',
  code: initialCode,
  title,
}) => {
  const [code, setCode] = useState(initialCode);
  const [isPractice, setIsPractice] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [outputConsole, setOutputConsole] = useState<ICodeExecutionOutput | null>(null);
  const [outputTab, setOutputTab] = useState<'preview' | 'console'>('preview');
  const navigate = useNavigate();

  useEffect(() => {
    setCode(initialCode);
    setIsPractice(false);
    setOutputConsole(null);
  }, [initialCode]);

  const { prismLang, display } = normalizePrismLanguage(language);
  const isHtml = prismLang === 'markup' || language.toLowerCase() === 'html' || language.toLowerCase() === 'htm';

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setCode(initialCode);
    setOutputConsole(null);
  };

  const handleRun = async () => {
    setIsRunning(true);
    setOutputConsole(null);
    setOutputTab(isHtml ? 'preview' : 'console');
    const start = performance.now();
    try {
      const res = await executeRemoteLanguage(language, code);
      setIsRunning(false);
      const elapsed = res.executionTime || Math.round(performance.now() - start);
      if (res.error) {
        setOutputConsole({
          text: res.error,
          isError: true,
          time: elapsed,
          status: res.status || 'Runtime Error',
          htmlCode: isHtml ? code : undefined,
        });
      } else {
        setOutputConsole({
          text: res.output || '[Program executed with exit code 0 and no output]',
          isError: false,
          time: elapsed,
          status: res.status || 'Success (Exit 0)',
          htmlCode: isHtml ? code : undefined,
        });
      }
    } catch (err: any) {
      setIsRunning(false);
      setOutputConsole({
        text: `Execution failed: ${err?.message || 'Unknown network error'}`,
        isError: true,
        time: Math.round(performance.now() - start),
        status: 'Error',
      });
    }
  };

  const handleOpenInCompiler = () => {
    try {
      localStorage.setItem(
        'nec_compiler_preload_code',
        JSON.stringify({
          language,
          code,
        })
      );
    } catch {
      // ignore
    }
    navigate(ROUTES.COMPILER);
  };

  return (
    <div className="my-6 rounded-2xl border border-slate-800 bg-[#0d1117] text-slate-100 overflow-hidden shadow-xl space-y-0">
      {/* Code Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-[#161b22] border-b border-slate-800 text-xs font-mono">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-slate-200">
            {title || `${display.toLowerCase()}_snippet`}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-slate-800 text-slate-300 uppercase tracking-wider">
            {display}
          </span>
          {isPractice && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 font-semibold border border-brand-500/30 animate-pulse">
              ● Practice Mode
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {isPractice && (
            <button
              type="button"
              onClick={handleReset}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition-colors cursor-pointer"
              title="Reset code to original"
            >
              <RotateCcw className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition-colors cursor-pointer"
            title="Copy Code"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {/* Practice Button (Read & Write in-place) */}
          <button
            type="button"
            onClick={() => setIsPractice(!isPractice)}
            className={cn(
              'px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border',
              isPractice
                ? 'bg-brand-600 text-white border-brand-500 shadow-xs'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            )}
            title="Practice code: read, write and test changes in-place with real-time colors"
          >
            <Edit3 className="w-3.5 h-3.5 text-brand-400" />
            <span>{isPractice ? 'Editing' : 'Practice'}</span>
          </button>

          {/* Run Button */}
          <button
            type="button"
            onClick={handleRun}
            disabled={isRunning}
            className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
            title="Execute Code"
          >
            <Play className={cn('w-3.5 h-3.5 fill-current', isRunning && 'animate-spin')} />
            <span>{isRunning ? 'Executing...' : 'Run'}</span>
          </button>

          {/* Open in full compiler */}
          <button
            type="button"
            onClick={handleOpenInCompiler}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs transition-colors cursor-pointer"
            title="Open in Full NEC Compiler IDE"
          >
            <ExternalLink className="w-3 h-3 text-brand-400" />
            <span>IDE</span>
          </button>
        </div>
      </div>

      {/* Practice Mode Banner */}
      {isPractice && (
        <div className="px-4 py-2 bg-brand-950/60 border-b border-brand-800/40 text-[11px] text-brand-200 flex items-center justify-between">
          <span>
            ✏️ <strong>Practice Mode Active:</strong> Edit and experiment with full syntax highlighting. Click <strong>Run</strong> to test your edits.
          </span>
          <span className="font-mono text-[10px] text-brand-300/80">In-Place Playground</span>
        </div>
      )}

      {/* Code Body: Real-Time Multi-Color Syntax Highlighted Editor */}
      <TutorialLiveEditor
        code={code}
        onChange={setCode}
        language={language}
        isPractice={isPractice}
        minHeight="180px"
      />

      {/* Interactive Terminal Output Console Drawer with Live Web Preview */}
      {outputConsole && (
        <div className="border-t border-slate-800 bg-[#090d13] p-4 space-y-3 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
            {/* Left: Indicator or Tabs */}
            {isHtml ? (
              <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setOutputTab('preview')}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer',
                    outputTab === 'preview'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  )}
                >
                  <Globe className="w-3.5 h-3.5 text-blue-300" />
                  <span>Live Web Preview</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOutputTab('console')}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer',
                    outputTab === 'console'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  )}
                >
                  <Terminal className="w-3.5 h-3.5 text-emerald-300" />
                  <span>DOM & Output</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <Terminal className="w-3.5 h-3.5" /> Output Terminal
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">{outputConsole.time}ms</span>
              </div>
            )}

            {/* Right: Status badge & close */}
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'text-[10px] px-2 py-0.5 rounded font-mono font-bold',
                  outputConsole.isError
                    ? 'bg-rose-950/80 text-rose-400 border border-rose-800/40'
                    : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                )}
              >
                {outputConsole.status}
              </span>
              <button
                type="button"
                onClick={() => setOutputConsole(null)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Close output"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Body: Live Web Preview iframe OR Console pre */}
          {isHtml && outputTab === 'preview' ? (
            <div className="rounded-xl border border-slate-700 bg-white overflow-hidden shadow-inner">
              <div className="bg-slate-100 border-b border-slate-200 px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-600 font-mono">
                <span className="flex items-center gap-1.5 font-bold text-blue-600">
                  <Globe className="w-3.5 h-3.5" /> HTML5 Live Web Document
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-bold">
                  Rendered View
                </span>
              </div>
              <iframe
                title="Live HTML Web Preview"
                srcDoc={code}
                className="w-full min-h-[220px] max-h-[380px] bg-white border-0"
                sandbox="allow-scripts allow-modals"
              />
            </div>
          ) : (
            <pre
              className={cn(
                'm-0 text-xs font-mono p-3 rounded-lg border whitespace-pre-wrap leading-relaxed max-h-[240px] overflow-y-auto',
                outputConsole.isError
                  ? 'bg-[#1a0f12] text-rose-300 border-rose-900/50'
                  : 'bg-[#121820] text-slate-100 border-slate-800'
              )}
            >
              {outputConsole.text}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

// Parser to split raw content string into typed blocks
export function parseTutorialContent(content: string): IContentBlock[] {
  if (!content) return [];

  const blocks: IContentBlock[] = [];
  const lines = content.split('\n');
  let currentTextBuffer: string[] = [];

  const flushText = () => {
    if (currentTextBuffer.length > 0) {
      const text = currentTextBuffer.join('\n').trim();
      if (text) {
        blocks.push({ type: 'text', rawText: text });
      }
      currentTextBuffer = [];
    }
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Check for :::slider or :::carousel
    if (trimmed.startsWith(':::slider') || trimmed.startsWith(':::carousel')) {
      flushText();
      const sliderItems: ISliderItem[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(':::')) {
        const sLine = lines[i].trim();
        if (sLine) {
          // Parse ![caption](url) or [caption](url)
          const imgMatch = sLine.match(/!?\[(.*?)\]\((.*?)\)/);
          if (imgMatch) {
            sliderItems.push({
              caption: imgMatch[1].trim(),
              url: imgMatch[2].trim(),
            });
          } else if (sLine.startsWith('http://') || sLine.startsWith('https://') || sLine.startsWith('data:image')) {
            sliderItems.push({
              caption: `Slide ${sliderItems.length + 1}`,
              url: sLine,
            });
          }
        }
        i++;
      }
      // Skip closing :::
      if (i < lines.length && lines[i].trim().startsWith(':::')) i++;
      if (sliderItems.length > 0) {
        blocks.push({ type: 'slider', sliderItems });
      }
      continue;
    }

    // 2. Check for :::quickfact or :::fact
    if (trimmed.startsWith(':::quickfact') || trimmed.startsWith(':::fact')) {
      flushText();
      let factText = '';
      let factTitle = 'QUICK FACT';
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(':::')) {
        const fLine = lines[i];
        const matchTitle = fLine.match(/^\*\*(.*?)\*\*:\s*(.*)/);
        if (matchTitle) {
          factTitle = matchTitle[1].trim();
          factText += matchTitle[2] + '\n';
        } else {
          factText += fLine + '\n';
        }
        i++;
      }
      if (i < lines.length && lines[i].trim().startsWith(':::')) i++;
      if (factText.trim()) {
        blocks.push({
          type: 'quickfact',
          quickFactTitle: factTitle,
          quickFactText: factText.trim(),
        });
      }
      continue;
    }

    // 3. Check for :::keypoints or :::takeaways
    if (trimmed.startsWith(':::keypoints') || trimmed.startsWith(':::takeaways')) {
      flushText();
      const points: string[] = [];
      let kpTitle = 'KEY TAKEAWAYS';
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(':::')) {
        const kLine = lines[i].trim();
        if (kLine.startsWith('#')) {
          kpTitle = kLine.replace(/^#+\s*/, '');
        } else if (kLine.startsWith('-') || kLine.startsWith('*') || kLine.match(/^\d+\./)) {
          points.push(kLine.replace(/^[-*]|\d+\.\s*/, '').trim());
        } else if (kLine) {
          points.push(kLine);
        }
        i++;
      }
      if (i < lines.length && lines[i].trim().startsWith(':::')) i++;
      if (points.length > 0) {
        blocks.push({
          type: 'keypoints',
          keyPointsTitle: kpTitle,
          keyPoints: points,
        });
      }
      continue;
    }

    // 4. Check for code block ```
    if (trimmed.startsWith('```')) {
      flushText();
      const lang = trimmed.replace(/^```/, '').trim() || 'code';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length && lines[i].trim().startsWith('```')) i++;
      blocks.push({
        type: 'code',
        codeLanguage: lang,
        codeSnippet: codeLines.join('\n'),
      });
      continue;
    }

    // Regular line
    currentTextBuffer.push(line);
    i++;
  }

  flushText();
  return blocks;
}

// Inline formatting helper for Bold, Italic, and Inline Code
export const renderInlineMarkdown = (text: string): React.ReactNode => {
  if (!text) return null;
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  while (remaining.length > 0) {
    const codeMatch = remaining.match(/`([^`]+)`/);
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
    const italicMatch = remaining.match(/(?<!\*)\*([^*]+)\*(?!\*)/);

    const matches = [
      codeMatch ? { type: 'code', index: codeMatch.index!, raw: codeMatch[0], val: codeMatch[1] } : null,
      boldMatch ? { type: 'bold', index: boldMatch.index!, raw: boldMatch[0], val: boldMatch[1] } : null,
      italicMatch ? { type: 'italic', index: italicMatch.index!, raw: italicMatch[0], val: italicMatch[1] } : null,
    ].filter(Boolean) as { type: string; index: number; raw: string; val: string }[];

    if (matches.length === 0) {
      parts.push(<span key={keyIdx++} className="font-normal">{remaining}</span>);
      break;
    }

    matches.sort((a, b) => a.index - b.index);
    const first = matches[0];

    if (first.index > 0) {
      parts.push(<span key={keyIdx++} className="font-normal">{remaining.slice(0, first.index)}</span>);
    }

    if (first.type === 'code') {
      parts.push(
        <code
          key={keyIdx++}
          className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-dark-800 text-purple-600 dark:text-purple-400 font-mono text-[0.88em] font-medium border border-slate-200 dark:border-dark-700 mx-0.5"
        >
          {first.val}
        </code>
      );
    } else if (first.type === 'bold') {
      parts.push(
        <strong key={keyIdx++} className="font-bold text-slate-900 dark:text-white">
          {first.val}
        </strong>
      );
    } else if (first.type === 'italic') {
      parts.push(
        <em key={keyIdx++} className="italic text-slate-800 dark:text-slate-200 font-normal">
          {first.val}
        </em>
      );
    }

    remaining = remaining.slice(first.index + first.raw.length);
  }

  return <>{parts}</>;
};

// Render regular markdown text with basic headings & strictly font-normal paragraphs
const SimpleMarkdownText: React.FC<{ text: string; fontSize?: 'sm' | 'base' | 'lg' }> = ({
  text,
  fontSize = 'base',
}) => {
  const paragraphs = text.split('\n\n');

  const pFontSizeClass =
    fontSize === 'sm'
      ? 'text-xs sm:text-sm'
      : fontSize === 'lg'
      ? 'text-base sm:text-lg'
      : 'text-sm sm:text-base';

  return (
    <div className="space-y-4">
      {paragraphs.map((p, idx) => {
        const trimmed = p.trim();
        if (!trimmed) return null;

        // Headings without # tags (e.g. **1. What is HTML?**)
        if (
          trimmed.startsWith('**') &&
          trimmed.endsWith('**') &&
          !trimmed.slice(2, -2).includes('\n') &&
          trimmed.length < 140
        ) {
          return (
            <h3 key={idx} className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white pt-3 pb-1 tracking-tight">
              {trimmed.slice(2, -2)}
            </h3>
          );
        }

        // Headings (must be bold)
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={idx} className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white pt-3 pb-1 tracking-tight">
              {renderInlineMarkdown(trimmed.replace(/^###\s+/, ''))}
            </h3>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={idx} className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white pt-4 pb-1 tracking-tight border-b border-slate-200/60 dark:border-dark-800 pb-2">
              {renderInlineMarkdown(trimmed.replace(/^##\s+/, ''))}
            </h2>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h1 key={idx} className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white pt-4 pb-2 tracking-tight">
              {renderInlineMarkdown(trimmed.replace(/^#\s+/, ''))}
            </h1>
          );
        }

        // Bullet lists (strictly font-normal)
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const items = trimmed.split('\n').filter((l) => l.trim().startsWith('- ') || l.trim().startsWith('* '));
          return (
            <ul key={idx} className={cn('space-y-1.5 pl-5 list-disc text-slate-700 dark:text-slate-300 font-normal leading-relaxed', pFontSizeClass)}>
              {items.map((item, iIdx) => (
                <li key={iIdx} className="font-normal">
                  {renderInlineMarkdown(item.replace(/^[-*]\s+/, ''))}
                </li>
              ))}
            </ul>
          );
        }

        // Numbered lists (strictly font-normal)
        if (/^\d+\.\s+/.test(trimmed)) {
          const items = trimmed.split('\n').filter((l) => /^\d+\.\s+/.test(l.trim()));
          return (
            <ol key={idx} className={cn('space-y-1.5 pl-5 list-decimal text-slate-700 dark:text-slate-300 font-normal leading-relaxed', pFontSizeClass)}>
              {items.map((item, iIdx) => (
                <li key={iIdx} className="font-normal">
                  {renderInlineMarkdown(item.replace(/^\d+\.\s+/, ''))}
                </li>
              ))}
            </ol>
          );
        }

        // Standard paragraph (strictly font-normal, dynamic font size)
        return (
          <p key={idx} className={cn('text-slate-700 dark:text-slate-300 font-normal leading-relaxed whitespace-pre-line', pFontSizeClass)}>
            {renderInlineMarkdown(trimmed)}
          </p>
        );
      })}
    </div>
  );
};

export const TutorialContentRenderer: React.FC<TutorialContentRendererProps> = ({
  content = '',
  className = '',
  fontSize = 'base',
}) => {
  if (!content) return null;

  const blocks = parseTutorialContent(content);

  return (
    <div className={cn('tutorial-rich-content space-y-6', className)}>
      {blocks.map((block, idx) => {
        if (block.type === 'slider' && block.sliderItems) {
          return <ContentImageSlider key={idx} items={block.sliderItems} />;
        }
        if (block.type === 'quickfact' && block.quickFactText) {
          return (
            <QuickFactCallout
              key={idx}
              title={block.quickFactTitle}
              text={block.quickFactText}
            />
          );
        }
        if (block.type === 'keypoints' && block.keyPoints) {
          return (
            <KeyPointsCallout
              key={idx}
              title={block.keyPointsTitle}
              points={block.keyPoints}
            />
          );
        }
        if (block.type === 'code' && block.codeSnippet) {
          return (
            <CodeSnippetBox
              key={idx}
              language={block.codeLanguage}
              code={block.codeSnippet}
            />
          );
        }
        if (block.type === 'text' && block.rawText) {
          return <SimpleMarkdownText key={idx} text={block.rawText} fontSize={fontSize} />;
        }
        return null;
      })}
    </div>
  );
};

export default TutorialContentRenderer;
