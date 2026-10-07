import React, { useState, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  Check,
  Copy,
  AlertTriangle,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { cn } from '../../utils/cn';
import necAiService, { IFixCompilerErrorResponse } from '../../services/necAi.service';
import { sanitizeAiText } from '../../utils/cleanAiText';

export interface AiFixErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  language: string;
  fileName: string;
  errorMessage: string;
  onApplyFix: (newCode: string) => void;
}

export const AiFixErrorModal: React.FC<AiFixErrorModalProps> = ({
  isOpen,
  onClose,
  code,
  language,
  fileName,
  errorMessage,
  onApplyFix,
}) => {
  const { success, error: toastError } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [fixResult, setFixResult] = useState<IFixCompilerErrorResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'fixed' | 'diff'>('fixed');

  // Trigger AI analysis when modal opens
  useEffect(() => {
    if (!isOpen) {
      setFixResult(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    necAiService
      .fixCompilerError({
        code,
        language,
        errorMessage,
        fileName,
      })
      .then((data) => {
        if (isMounted) {
          setFixResult(data);
        }
      })
      .catch((err) => {
        console.error('Failed to get AI compiler fix:', err);
        if (isMounted) {
          toastError('Failed to fetch AI fix. Please check your network.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, code, language, errorMessage, fileName]);

  const handleApply = () => {
    if (!fixResult || !fixResult.fixedCode) return;
    onApplyFix(fixResult.fixedCode);
    success('✨ Code fixed by AI! You can re-run now.');
    onClose();
  };

  const handleCopy = () => {
    if (!fixResult || !fixResult.fixedCode) return;
    navigator.clipboard.writeText(fixResult.fixedCode);
    setCopied(true);
    success('Fixed code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Clean and format AI text into readable points without emojis or raw markdown
  const renderFormattedExplanation = (text: string) => {
    const cleanText = sanitizeAiText(text);
    const lines = cleanText.split('\n');
    return (
      <div className="space-y-2 text-xs leading-relaxed text-slate-200">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-1" />;

          // Header line
          if (trimmed.endsWith(':') || (!trimmed.match(/^\d+\./) && !trimmed.startsWith('-') && trimmed.length < 50 && idx === 0)) {
            return (
              <h4 key={idx} className="text-xs font-bold text-amber-300 font-mono uppercase tracking-wide pt-1">
                <span>{trimmed}</span>
              </h4>
            );
          }
          // Numbered item or bullet point
          if (trimmed.match(/^\d+\./) || trimmed.startsWith('-') || trimmed.startsWith('*')) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="text-amber-400 mt-0.5 shrink-0 font-mono text-[10px]">•</span>
                <span className="flex-1 text-slate-300">{trimmed.replace(/^[-*]\s*/, '')}</span>
              </div>
            );
          }
          // Default line
          return (
            <p key={idx} className="text-slate-300">
              {trimmed}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      maxWidth="2xl"
    >
      <div className="space-y-4 text-slate-200">
        
        {/* Glowing Header Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/80 via-indigo-950/70 to-slate-900 border border-purple-500/30 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30 animate-pulse">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">
                  NEC AI Error Doctor
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  Auto-Doctor
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Root cause analysis in simple Hinglish & 1-click code auto-correction.
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <span className="px-2 py-1 rounded-lg text-xs font-mono bg-slate-900 border border-slate-800 text-slate-300">
              {fileName}
            </span>
            <span className="px-2 py-1 rounded-lg text-xs font-mono font-bold uppercase bg-brand-500/20 text-brand-300 border border-brand-500/30">
              {language}
            </span>
          </div>
        </div>

        {/* Error Details Collapsible Banner */}
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/40 text-xs font-mono space-y-1">
          <div className="flex items-center gap-1.5 text-rose-400 font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>Detected Terminal Error</span>
          </div>
          <div className="text-rose-200/90 whitespace-pre-wrap max-h-24 overflow-y-auto pl-5 leading-relaxed text-[11px]">
            {errorMessage.slice(0, 350)}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="p-10 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full border-2 border-purple-500 border-t-transparent animate-spin flex items-center justify-center">
              <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-200">
                NEC AI is diagnosing your code...
              </p>
              <p className="text-xs text-slate-400 font-mono">
                Checking syntax trees, array bounds, and line errors.
              </p>
            </div>
          </div>
        )}

        {/* Diagnosis & Fixed Code View */}
        {!isLoading && fixResult && (
          <div className="space-y-4">
            
            {/* Explanation Box */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-purple-400" />
                  What Went Wrong & How to Fix
                </span>
                {fixResult.diffSummary && (
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
                    ✓ {fixResult.diffSummary}
                  </span>
                )}
              </div>
              <div className="pt-1">
                {renderFormattedExplanation(fixResult.explanation)}
              </div>
            </div>

            {/* Code Comparison / Solution Box */}
            <div className="rounded-2xl border border-slate-800 bg-[#161616] overflow-hidden">
              <div className="px-3.5 py-2 bg-[#1f1f1f] border-b border-[#2d2d2d] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setViewMode('fixed')}
                    className={cn(
                      'px-2.5 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer',
                      viewMode === 'fixed'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    )}
                  >
                    AI Corrected Code
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('diff')}
                    className={cn(
                      'px-2.5 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer',
                      viewMode === 'diff'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    )}
                  >
                    Side-by-Side View
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  title="Copy Corrected Code"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>

              {/* View 1: Clean Corrected Code */}
              {viewMode === 'fixed' && (
                <div className="p-3 max-h-64 overflow-auto font-mono text-xs bg-[#141414] leading-relaxed select-text">
                  <pre className="text-emerald-300 whitespace-pre">
                    {fixResult.fixedCode}
                  </pre>
                </div>
              )}

              {/* View 2: Side-by-Side Comparison */}
              {viewMode === 'diff' && (
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 font-mono text-xs max-h-64 overflow-auto">
                  <div className="p-3 bg-[#181818] overflow-auto">
                    <span className="text-[10px] text-rose-400 font-bold uppercase block mb-1">
                      ❌ Original (With Error)
                    </span>
                    <pre className="text-rose-200/80 whitespace-pre text-[11px] leading-relaxed">
                      {code}
                    </pre>
                  </div>
                  <div className="p-3 bg-[#141414] overflow-auto">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase block mb-1">
                      ✨ Corrected Code
                    </span>
                    <pre className="text-emerald-300 whitespace-pre text-[11px] leading-relaxed">
                      {fixResult.fixedCode}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
              <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>One-click replace updates your editor active tab directly.</span>
              </p>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="font-mono flex-1 sm:flex-initial"
                >
                  Dismiss
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleApply}
                  leftIcon={<Sparkles className="w-4 h-4 text-amber-300" />}
                  className="font-mono bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-500/25 flex-1 sm:flex-initial"
                >
                  Apply Fix to Editor
                </Button>
              </div>
            </div>

          </div>
        )}

      </div>
    </Modal>
  );
};
