import React, { useState, useRef, useMemo } from 'react';
import html2canvas from 'html2canvas';
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
  Download,
  Copy,
  Check,
  Code2,
  Palette,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { cn } from '../../utils/cn';

export interface CodeSnippetExporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  language: string;
  fileName: string;
}

// Preset Background Themes
export const SNIPPET_THEMES = [
  {
    id: 'cosmic',
    name: 'Cosmic Indigo',
    gradient: 'bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500',
  },
  {
    id: 'sunset',
    name: 'Sunset Amber',
    gradient: 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600',
  },
  {
    id: 'matrix',
    name: 'Emerald Matrix',
    gradient: 'bg-gradient-to-tr from-emerald-500 via-teal-600 to-cyan-600',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    gradient: 'bg-gradient-to-tr from-[#ff007f] via-[#7928ca] to-[#00dfd8]',
  },
  {
    id: 'deep-space',
    name: 'Deep Space',
    gradient: 'bg-gradient-to-tr from-slate-900 via-slate-950 to-black',
  },
  {
    id: 'ocean',
    name: 'Oceanic Blue',
    gradient: 'bg-gradient-to-tr from-blue-600 via-sky-500 to-teal-400',
  },
];

export const CodeSnippetExporterModal: React.FC<CodeSnippetExporterModalProps> = ({
  isOpen,
  onClose,
  code,
  language,
  fileName,
}) => {
  const { success, error: toastError } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);

  const [selectedTheme, setSelectedTheme] = useState<string>('cosmic');
  const [paddingSize, setPaddingSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [showLineNumbers, setShowLineNumbers] = useState<boolean>(true);
  const [showWatermark, setShowWatermark] = useState<boolean>(true);
  const [customTitle, setCustomTitle] = useState<string>(fileName);

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [copiedImage, setCopiedImage] = useState<boolean>(false);

  // Map language to Prism grammar
  const prismLang = useMemo(() => {
    const l = (language || 'javascript').toLowerCase();
    if (l === 'js' || l === 'javascript') return 'javascript';
    if (l === 'ts' || l === 'typescript') return 'typescript';
    if (l === 'py' || l === 'python') return 'python';
    if (l === 'cpp' || l === 'c++') return 'cpp';
    if (l === 'c') return 'c';
    if (l === 'java') return 'java';
    if (l === 'html') return 'markup';
    if (l === 'css') return 'css';
    if (l === 'sql') return 'sql';
    if (l === 'json') return 'json';
    return 'javascript';
  }, [language]);

  // Syntax highlight generated HTML
  const highlightedCode = useMemo(() => {
    const grammar = Prism.languages[prismLang] || Prism.languages.javascript;
    const safeCode = (code || '').trim() || '// Write code here...';
    try {
      return Prism.highlight(safeCode, grammar, prismLang);
    } catch {
      return safeCode
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }
  }, [code, prismLang]);

  const activeThemeConfig = useMemo(() => {
    return SNIPPET_THEMES.find((t) => t.id === selectedTheme) || SNIPPET_THEMES[0];
  }, [selectedTheme]);

  const codeLines = (code || '').trim().split('\n');

  // Padding styles
  const paddingClass = {
    sm: 'p-4 sm:p-6',
    md: 'p-6 sm:p-10',
    lg: 'p-8 sm:p-14',
  }[paddingSize];

  // Export as High-Res PNG
  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    try {
      setIsExporting(true);
      const canvas = await html2canvas(cardRef.current, {
        scale: 2.5, // 2.5x retina quality
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${(customTitle || 'code-snippet').replace(/[^a-z0-9_-]/gi, '-')}.png`;
      link.click();
      success('Snippet exported as high-res PNG image!');
    } catch (err: any) {
      console.error('Failed to export code image', err);
      toastError('Failed to generate image. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Copy Image to Clipboard directly
  const handleCopyImage = async () => {
    if (!cardRef.current) return;
    try {
      setIsExporting(true);
      const canvas = await html2canvas(cardRef.current, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) {
          toastError('Failed to copy image to clipboard.');
          setIsExporting(false);
          return;
        }

        try {
          if (navigator.clipboard && navigator.clipboard.write) {
            await navigator.clipboard.write([
              new ClipboardItem({
                'image/png': blob,
              }),
            ]);
            setCopiedImage(true);
            success('Code snapshot copied to clipboard! Paste directly in LinkedIn or Discord.');
            setTimeout(() => setCopiedImage(false), 2500);
          } else {
            // Fallback download if clipboard.write not supported
            handleDownloadImage();
          }
        } catch (clipErr) {
          console.warn('Clipboard write failed, downloading image instead', clipErr);
          handleDownloadImage();
        } finally {
          setIsExporting(false);
        }
      }, 'image/png');
    } catch (err: any) {
      console.error('Failed to copy code snippet image', err);
      toastError('Failed to copy image.');
      setIsExporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Export Beautiful Code Snapshot"
      maxWidth="2xl"
    >
      <div className="space-y-6 text-slate-200">
        
        {/* Controls Bar */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            {/* Theme Presets */}
            <div className="flex items-center gap-2">
              <Palette className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-slate-400">Backdrop:</span>
              <div className="flex items-center gap-1.5">
                {SNIPPET_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setSelectedTheme(theme.id)}
                    title={theme.name}
                    className={cn(
                      'w-5 h-5 rounded-full border transition-all cursor-pointer',
                      theme.gradient,
                      selectedTheme === theme.id
                        ? 'border-white scale-110 shadow-md ring-2 ring-brand-500/50'
                        : 'border-transparent opacity-70 hover:opacity-100 hover:scale-105'
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Padding Controls */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Padding:</span>
              {(['sm', 'md', 'lg'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPaddingSize(p)}
                  className={cn(
                    'px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer',
                    paddingSize === p
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  )}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={showLineNumbers}
                  onChange={(e) => setShowLineNumbers(e.target.checked)}
                  className="rounded border-slate-700 text-brand-500 focus:ring-brand-500"
                />
                <span>Line numbers</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={showWatermark}
                  onChange={(e) => setShowWatermark(e.target.checked)}
                  className="rounded border-slate-700 text-brand-500 focus:ring-brand-500"
                />
                <span>Watermark</span>
              </label>
            </div>
          </div>

          {/* Editable File Title */}
          <div className="flex items-center gap-2 pt-1 border-t border-slate-850">
            <span className="text-slate-400 text-xs font-mono">Title:</span>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="e.g. Solution.cpp"
              className="flex-1 px-3 py-1 text-xs rounded-lg bg-slate-900 border border-slate-800 text-slate-200 font-mono focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {/* PREVIEW CANVAS CONTAINER (Rendered by html2canvas) */}
        <div className="max-h-[460px] overflow-auto rounded-2xl border border-slate-800 bg-slate-950 p-2 flex items-center justify-center">
          <div
            ref={cardRef}
            className={cn(
              'w-full max-w-xl rounded-2xl transition-all shadow-2xl relative overflow-hidden',
              activeThemeConfig.gradient,
              paddingClass
            )}
          >
            {/* macOS Code Card Frame */}
            <div className="rounded-xl bg-[#1e1e1e] border border-white/10 shadow-2xl shadow-black/80 overflow-hidden font-mono text-left">
              
              {/* Card Window Header */}
              <div className="h-9 px-3.5 bg-[#181818] border-b border-[#2d2d2d] flex items-center justify-between select-none">
                {/* Traffic lights */}
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#ff5f56] inline-block shadow-sm" />
                  <span className="w-3 h-3 rounded-full bg-[#ffbd2e] inline-block shadow-sm" />
                  <span className="w-3 h-3 rounded-full bg-[#27c93f] inline-block shadow-sm" />
                </div>

                {/* Title */}
                <span className="text-[11px] font-bold text-neutral-300 truncate max-w-[200px]">
                  {customTitle || fileName}
                </span>

                {/* Language Tag */}
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-800 text-slate-400 border border-slate-700">
                  {language}
                </span>
              </div>

              {/* Code Snippet Body */}
              <div className="p-4 overflow-x-auto text-[12.5px] leading-relaxed select-text">
                <div className="flex">
                  {/* Line numbers column */}
                  {showLineNumbers && (
                    <div className="pr-3 text-right text-[#555] select-none font-mono text-[11px] leading-[1.625rem] border-r border-[#333] mr-3">
                      {codeLines.map((_, idx) => (
                        <div key={idx}>{idx + 1}</div>
                      ))}
                    </div>
                  )}

                  {/* Code body with Prism syntax highlight */}
                  <pre className="font-mono text-[#d4d4d4] flex-1 overflow-x-auto whitespace-pre leading-[1.625rem] m-0">
                    <code
                      dangerouslySetInnerHTML={{ __html: highlightedCode }}
                      className="font-mono"
                    />
                  </pre>
                </div>
              </div>

              {/* NextEra Coders Watermark Badge */}
              {showWatermark && (
                <div className="px-4 py-2 bg-[#141414] border-t border-[#262626] flex items-center justify-between text-[10px] text-neutral-500 font-mono">
                  <div className="flex items-center gap-1.5 text-neutral-400">
                    <Code2 className="w-3 h-3 text-amber-400" />
                    <span className="font-bold text-neutral-300">NextEra Coders</span>
                    <span>&bull;</span>
                    <span className="text-amber-400/90 font-semibold">Compiler Pro</span>
                  </div>
                  <span className="text-neutral-500">nexteracoders.com</span>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <p className="text-xs text-slate-400 font-mono">
            📸 Ready to post on LinkedIn, WhatsApp, or Twitter.
          </p>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyImage}
              disabled={isExporting}
              leftIcon={copiedImage ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              className="flex-1 sm:flex-initial font-mono"
            >
              {copiedImage ? 'Copied Image!' : 'Copy to Clipboard'}
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleDownloadImage}
              disabled={isExporting}
              leftIcon={<Download className="w-4 h-4" />}
              className="flex-1 sm:flex-initial font-mono shadow-lg shadow-brand-500/25"
            >
              {isExporting ? 'Exporting...' : 'Download PNG'}
            </Button>
          </div>
        </div>

      </div>
    </Modal>
  );
};
