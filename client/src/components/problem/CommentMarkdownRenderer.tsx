import React, { useState, useMemo } from 'react';
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
import { Copy, Check, Terminal, ChevronRight, Hash } from 'lucide-react';
import { cn } from '../../utils/cn';

interface CommentMarkdownRendererProps {
  content: string;
  className?: string;
}

// Normalize language names to Prism grammar keys
const normalizeLanguage = (lang?: string): { prismLang: string; display: string } => {
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
    case 'xml':
      return { prismLang: 'markup', display: 'HTML' };
    case 'css':
      return { prismLang: 'css', display: 'CSS' };
    case 'json':
      return { prismLang: 'json', display: 'JSON' };
    default:
      return { prismLang: clean || 'clike', display: clean ? clean.toUpperCase() : 'CODE' };
  }
};

type BlockType =
  | { type: 'code'; language: string; displayLang: string; code: string }
  | { type: 'h1'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'quote'; lines: string[] }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'paragraph'; text: string };

export const CommentMarkdownRenderer: React.FC<CommentMarkdownRendererProps> = ({
  content,
  className,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };

  // Parse raw text into structured blocks
  const blocks = useMemo<BlockType[]>(() => {
    if (!content) return [];
    const lines = content.split('\n');
    const result: BlockType[] = [];

    let inCode = false;
    let codeLang = '';
    let codeBuffer: string[] = [];

    let quoteBuffer: string[] = [];
    let ulBuffer: string[] = [];
    let olBuffer: string[] = [];

    const flushQuote = () => {
      if (quoteBuffer.length > 0) {
        result.push({ type: 'quote', lines: [...quoteBuffer] });
        quoteBuffer = [];
      }
    };

    const flushUl = () => {
      if (ulBuffer.length > 0) {
        result.push({ type: 'ul', items: [...ulBuffer] });
        ulBuffer = [];
      }
    };

    const flushOl = () => {
      if (olBuffer.length > 0) {
        result.push({ type: 'ol', items: [...olBuffer] });
        olBuffer = [];
      }
    };

    const flushBuffers = () => {
      flushQuote();
      flushUl();
      flushOl();
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Check code block fences
      if (trimmed.startsWith('```')) {
        if (!inCode) {
          flushBuffers();
          inCode = true;
          codeLang = trimmed.slice(3).trim();
          codeBuffer = [];
        } else {
          inCode = false;
          const { prismLang, display } = normalizeLanguage(codeLang);
          result.push({
            type: 'code',
            language: prismLang,
            displayLang: display,
            code: codeBuffer.join('\n'),
          });
          codeBuffer = [];
        }
        continue;
      }

      if (inCode) {
        codeBuffer.push(line);
        continue;
      }

      // Blockquotes
      if (trimmed.startsWith('>')) {
        flushUl();
        flushOl();
        quoteBuffer.push(trimmed.replace(/^>\s?/, ''));
        continue;
      } else {
        flushQuote();
      }

      // Unordered list
      if (/^[-*+]\s+/.test(trimmed)) {
        flushOl();
        ulBuffer.push(trimmed.replace(/^[-*+]\s+/, ''));
        continue;
      } else {
        flushUl();
      }

      // Ordered list
      if (/^\d+\.\s+/.test(trimmed)) {
        flushUl();
        olBuffer.push(trimmed.replace(/^\d+\.\s+/, ''));
        continue;
      } else {
        flushOl();
      }

      // Headings
      if (trimmed.startsWith('### ')) {
        flushBuffers();
        result.push({ type: 'h3', text: trimmed.slice(4).trim() });
        continue;
      }
      if (trimmed.startsWith('## ')) {
        flushBuffers();
        result.push({ type: 'h2', text: trimmed.slice(3).trim() });
        continue;
      }
      if (trimmed.startsWith('# ')) {
        flushBuffers();
        result.push({ type: 'h1', text: trimmed.slice(2).trim() });
        continue;
      }

      // Empty lines
      if (!trimmed) {
        flushBuffers();
        continue;
      }

      // Regular paragraph line
      flushBuffers();
      result.push({ type: 'paragraph', text: line });
    }

    // Flush any trailing code buffer
    if (inCode && codeBuffer.length > 0) {
      const { prismLang, display } = normalizeLanguage(codeLang);
      result.push({
        type: 'code',
        language: prismLang,
        displayLang: display,
        code: codeBuffer.join('\n'),
      });
    }

    flushBuffers();
    return result;
  }, [content]);

  // Inline formatting helper (Bold, Italic, Inline Code, Complexity Badges)
  const renderInline = (text: string) => {
    const parts = [];
    let remaining = text;
    let keyIdx = 0;

    while (remaining.length > 0) {
      // 1. Inline code: `code`
      const codeMatch = remaining.match(/`([^`]+)`/);
      // 2. Bold: **bold**
      const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
      // 3. Complexity: O(1), O(N), O(N log N), O(N^2), etc.
      const complexityMatch = remaining.match(/\bO\([A-Za-z0-9^+\-* /]+\)/);

      const matches = [
        codeMatch ? { type: 'code', index: codeMatch.index!, raw: codeMatch[0], val: codeMatch[1] } : null,
        boldMatch ? { type: 'bold', index: boldMatch.index!, raw: boldMatch[0], val: boldMatch[1] } : null,
        complexityMatch
          ? { type: 'complexity', index: complexityMatch.index!, raw: complexityMatch[0], val: complexityMatch[0] }
          : null,
      ].filter(Boolean) as { type: string; index: number; raw: string; val: string }[];

      if (matches.length === 0) {
        parts.push(<span key={keyIdx++}>{remaining}</span>);
        break;
      }

      matches.sort((a, b) => a.index - b.index);
      const first = matches[0];

      if (first.index > 0) {
        parts.push(<span key={keyIdx++}>{remaining.slice(0, first.index)}</span>);
      }

      if (first.type === 'code') {
        parts.push(
          <code
            key={keyIdx++}
            className="px-1.5 py-0.5 mx-0.5 rounded-md bg-blue-500/10 dark:bg-cyan-500/10 text-blue-600 dark:text-cyan-300 font-mono text-[11px] font-semibold border border-blue-500/20 dark:border-cyan-500/20"
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
      } else if (first.type === 'complexity') {
        parts.push(
          <span
            key={keyIdx++}
            className="inline-flex items-center px-1.5 py-0.2 mx-0.5 rounded bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono text-[10.5px] font-bold border border-emerald-500/25"
          >
            {first.val}
          </span>
        );
      }

      remaining = remaining.slice(first.index + first.raw.length);
    }

    return parts;
  };

  return (
    <div className={cn('space-y-2 text-xs leading-relaxed font-sans text-slate-700 dark:text-neutral-300', className)}>
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'h1':
            return (
              <div
                key={idx}
                className="pt-2 pb-1 border-b border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-white font-extrabold text-sm sm:text-base tracking-tight flex items-center gap-2"
              >
                <div className="w-1.5 h-4 rounded-full bg-gradient-to-b from-blue-500 to-indigo-600" />
                <span>{renderInline(block.text)}</span>
              </div>
            );

          case 'h2':
            return (
              <div
                key={idx}
                className="pt-1.5 pb-0.5 text-blue-600 dark:text-cyan-400 font-bold text-xs sm:text-sm tracking-tight flex items-center gap-1.5"
              >
                <Hash className="w-3.5 h-3.5 opacity-70" />
                <span>{renderInline(block.text)}</span>
              </div>
            );

          case 'h3':
            return (
              <div
                key={idx}
                className="pt-1 text-slate-900 dark:text-neutral-100 font-semibold text-xs tracking-tight flex items-center gap-1.5"
              >
                <ChevronRight className="w-3 h-3 text-blue-500 dark:text-cyan-400 shrink-0" />
                <span>{renderInline(block.text)}</span>
              </div>
            );

          case 'code': {
            const grammar = Prism.languages[block.language] || Prism.languages.clike || Prism.languages.javascript;
            let highlighted = block.code;
            try {
              highlighted = Prism.highlight(block.code, grammar, block.language);
            } catch {
              highlighted = block.code
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
            }

            return (
              <div
                key={idx}
                className="my-2 rounded-xl overflow-hidden border border-slate-300/80 dark:border-neutral-800 bg-slate-900 text-slate-100 shadow-md transition-all group/code"
              >
                {/* Code Block Header */}
                <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/80 border-b border-slate-800 text-[11px] font-mono">
                  <div className="flex items-center gap-2 text-slate-300 font-semibold">
                    <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="uppercase tracking-wider text-[10px] text-cyan-400 font-bold">
                      {block.displayLang}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(block.code, idx)}
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-[10.5px]"
                    title="Copy code to clipboard"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-400 group-hover/code:text-slate-200" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Code Content */}
                <div className="overflow-x-auto p-3 text-[11.5px] leading-relaxed font-mono">
                  <pre className="m-0 p-0 bg-transparent text-slate-100 font-mono">
                    <code
                      className={`language-${block.language}`}
                      dangerouslySetInnerHTML={{ __html: highlighted }}
                    />
                  </pre>
                </div>
              </div>
            );
          }

          case 'quote':
            return (
              <blockquote
                key={idx}
                className="my-1.5 pl-3 py-1 border-l-2 border-blue-500 dark:border-cyan-400 bg-blue-50/50 dark:bg-cyan-950/20 rounded-r-lg text-slate-600 dark:text-neutral-400 italic text-[11.5px]"
              >
                {block.lines.map((line, qIdx) => (
                  <p key={qIdx} className="m-0">
                    {renderInline(line)}
                  </p>
                ))}
              </blockquote>
            );

          case 'ul':
            return (
              <ul key={idx} className="my-1 pl-4 list-disc space-y-0.5">
                {block.items.map((item, uIdx) => (
                  <li key={uIdx} className="text-slate-700 dark:text-neutral-300">
                    {renderInline(item)}
                  </li>
                ))}
              </ul>
            );

          case 'ol':
            return (
              <ol key={idx} className="my-1 pl-4 list-decimal space-y-0.5">
                {block.items.map((item, oIdx) => (
                  <li key={oIdx} className="text-slate-700 dark:text-neutral-300">
                    {renderInline(item)}
                  </li>
                ))}
              </ol>
            );

          case 'paragraph':
          default:
            return (
              <p key={idx} className="leading-relaxed m-0">
                {renderInline(block.text)}
              </p>
            );
        }
      })}
    </div>
  );
};
