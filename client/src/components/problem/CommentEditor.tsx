import React, { useState, useRef } from 'react';
import {
  Bold,
  Italic,
  Code2,
  Terminal,
  Quote,
  List,
  ListOrdered,
  Eye,
  Edit3,
  Lightbulb,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { CommentMarkdownRenderer } from './CommentMarkdownRenderer';

interface CommentEditorProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  authorName?: string;
  placeholder?: string;
}

const POPULAR_LANGUAGES = [
  { id: 'python', label: 'Python 3', snippet: 'def solve():\n    # your solution\n    pass' },
  { id: 'cpp', label: 'C++', snippet: 'class Solution {\npublic:\n    void solve() {\n        // your solution\n    }\n};' },
  { id: 'java', label: 'Java', snippet: 'class Solution {\n    public void solve() {\n        // your solution\n    }\n}' },
  { id: 'javascript', label: 'JavaScript', snippet: 'function solve() {\n  // your solution\n}' },
  { id: 'typescript', label: 'TypeScript', snippet: 'function solve(): void {\n  // your solution\n}' },
  { id: 'sql', label: 'SQL', snippet: 'SELECT * FROM table_name WHERE condition;' },
];

export const CommentEditor: React.FC<CommentEditorProps> = ({
  value,
  onChange,
  onSubmit,
  isSubmitting = false,
  authorName = 'Student',
  placeholder = 'Share your approach, complexity analysis, or paste your solution code...',
}) => {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Helper to insert or wrap selected text in textarea
  const insertText = (prefix: string, suffix: string = '', defaultText: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(value + prefix + defaultText + suffix);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end);
    const contentToWrap = selected || defaultText;

    const before = value.substring(0, start);
    const after = value.substring(end);

    const newText = `${before}${prefix}${contentToWrap}${suffix}${after}`;
    onChange(newText);

    // Reposition cursor inside wrapped content
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + prefix.length + contentToWrap.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Heading inserters
  const applyHeading = (level: 1 | 2 | 3) => {
    const hashes = '#'.repeat(level);
    const defaultTitle = level === 1 ? 'Main Title' : level === 2 ? 'Approach / Key Idea' : 'Complexity Analysis';
    insertText(`\n${hashes} `, '\n', defaultTitle);
  };

  // Code block inserter
  const insertCodeBlock = (lang: string, snippet: string) => {
    setShowLangMenu(false);
    insertText(`\n\`\`\`${lang}\n`, '\n```\n', snippet);
  };

  // Full solution template
  const insertSolutionTemplate = () => {
    const template = `\n### 💡 Intuition & Approach
Explain your step-by-step logic here...

### ⏱️ Complexity
- **Time Complexity:** \`O(N)\`
- **Space Complexity:** \`O(1)\`

### 💻 Solution (C++)
\`\`\`cpp
class Solution {
public:
    // Write your optimal solution here
};
\`\`\`
`;
    insertText('', '', template);
  };

  return (
    <div className="rounded-xl border border-slate-300 dark:border-neutral-700/80 bg-white dark:bg-[#181926] shadow-xs overflow-hidden transition-all focus-within:border-blue-500 dark:focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-blue-500">
      {/* Editor Header: Tabs & Info */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-[#141520] border-b border-slate-200 dark:border-neutral-800">
        <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-neutral-800/80 p-0.5 rounded-lg text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('write')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer text-xs',
              activeTab === 'write'
                ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <Edit3 className="w-3.5 h-3.5 text-blue-500 dark:text-cyan-400" />
            <span>Write</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer text-xs',
              activeTab === 'preview'
                ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <Eye className="w-3.5 h-3.5 text-blue-500 dark:text-cyan-400" />
            <span>Preview</span>
          </button>
        </div>

        {/* Quick Guide */}
        <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-500 dark:text-neutral-400">
          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
            <Sparkles className="w-3 h-3" />
            <span>Markdown & Code Formatter Active</span>
          </span>
        </div>
      </div>

      {/* Formatting Toolbar (Only in Write Mode) */}
      {activeTab === 'write' && (
        <div className="flex flex-wrap items-center gap-1 px-2.5 py-1.5 bg-slate-100/60 dark:bg-[#1b1c28] border-b border-slate-200/80 dark:border-neutral-800 text-xs">
          {/* Headings */}
          <div className="flex items-center bg-white dark:bg-neutral-800/80 border border-slate-200 dark:border-neutral-700/60 rounded-md p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => applyHeading(1)}
              title="Heading 1 (# Main Title)"
              className="px-1.5 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 font-extrabold text-[11px] transition-colors cursor-pointer"
            >
              H1
            </button>
            <button
              type="button"
              onClick={() => applyHeading(2)}
              title="Heading 2 (## Section Header)"
              className="px-1.5 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 font-bold text-[11px] transition-colors cursor-pointer"
            >
              H2
            </button>
            <button
              type="button"
              onClick={() => applyHeading(3)}
              title="Heading 3 (### Sub-section / Step)"
              className="px-1.5 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 font-semibold text-[11px] transition-colors cursor-pointer"
            >
              H3
            </button>
          </div>

          <div className="w-[1px] h-4 bg-slate-300 dark:bg-neutral-700 mx-1 hidden sm:block" />

          {/* Bold & Italic */}
          <button
            type="button"
            onClick={() => insertText('**', '**', 'bold text')}
            title="Bold (**text**)"
            className="p-1.5 rounded-md hover:bg-white dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-300 transition-colors cursor-pointer"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertText('*', '*', 'italic text')}
            title="Italic (*text*)"
            className="p-1.5 rounded-md hover:bg-white dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-300 transition-colors cursor-pointer"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          {/* Inline Code */}
          <button
            type="button"
            onClick={() => insertText('`', '`', 'O(N)')}
            title="Inline Code (`code`)"
            className="p-1.5 rounded-md hover:bg-white dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-300 transition-colors cursor-pointer flex items-center gap-1 font-mono text-[11px]"
          >
            <Code2 className="w-3.5 h-3.5 text-blue-500 dark:text-cyan-400" />
            <span className="hidden md:inline">Inline</span>
          </button>

          {/* Code Block Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLangMenu(!showLangMenu)}
              title="Insert Code Block with Syntax Highlighting"
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 dark:bg-cyan-950/40 hover:bg-blue-100 dark:hover:bg-cyan-900/40 text-blue-600 dark:text-cyan-400 border border-blue-200 dark:border-cyan-800/60 font-semibold text-[11px] transition-colors cursor-pointer"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Code Block</span>
              <ChevronDown className="w-3 h-3 opacity-80" />
            </button>

            {/* Language Menu Dropdown */}
            {showLangMenu && (
              <div className="absolute top-full left-0 mt-1 w-44 rounded-xl bg-white dark:bg-[#1a1b26] border border-slate-200 dark:border-neutral-700 shadow-xl py-1 z-30 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-2.5 py-1 text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 dark:text-neutral-500 border-b border-slate-100 dark:border-neutral-800">
                  Select Language
                </div>
                {POPULAR_LANGUAGES.map((lang) => (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => insertCodeBlock(lang.id, lang.snippet)}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-neutral-300 hover:bg-blue-50 dark:hover:bg-cyan-950/50 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <span>{lang.label}</span>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-neutral-500">
                      .{lang.id}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-[1px] h-4 bg-slate-300 dark:bg-neutral-700 mx-1 hidden sm:block" />

          {/* Quote & Lists */}
          <button
            type="button"
            onClick={() => insertText('\n> ', '', 'Key observation or note')}
            title="Quote (> quote)"
            className="p-1.5 rounded-md hover:bg-white dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-300 transition-colors cursor-pointer"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertText('\n- ', '', 'Bullet item')}
            title="Bullet List (- item)"
            className="p-1.5 rounded-md hover:bg-white dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-300 transition-colors cursor-pointer"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertText('\n1. ', '', 'Step 1')}
            title="Numbered List (1. item)"
            className="p-1.5 rounded-md hover:bg-white dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-300 transition-colors cursor-pointer"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>

          {/* Quick Solution Template */}
          <div className="ml-auto">
            <button
              type="button"
              onClick={insertSolutionTemplate}
              title="Insert structured LeetCode / Interview Solution Template"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-semibold text-[11px] transition-all cursor-pointer active:scale-95"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>Solution Template</span>
            </button>
          </div>
        </div>
      )}

      {/* Editor Body */}
      {activeTab === 'write' ? (
        <div className="p-2.5">
          <textarea
            ref={textareaRef}
            rows={4}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full text-xs p-2 bg-transparent text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 dark:placeholder:text-neutral-500 font-sans resize-y min-h-[90px] focus:outline-none leading-relaxed"
          />
        </div>
      ) : (
        <div className="p-4 min-h-[120px] max-h-[350px] overflow-y-auto bg-slate-50/50 dark:bg-[#13141f]">
          {value.trim() ? (
            <CommentMarkdownRenderer content={value} />
          ) : (
            <div className="text-center py-8 text-slate-400 dark:text-neutral-500 text-xs font-mono">
              Nothing to preview yet. Write something in markdown or code format!
            </div>
          )}
        </div>
      )}

      {/* Footer: User Identity & Submit */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-[#141520] border-t border-slate-200 dark:border-neutral-800 text-xs">
        <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-mono">
          Posting as <strong className="text-slate-800 dark:text-neutral-200 font-semibold">{authorName}</strong>
        </span>

        <div className="flex items-center gap-2">
          {value.trim().length > 0 && (
            <span className="text-[10px] text-slate-400 dark:text-neutral-500 font-mono">
              {value.trim().length} chars
            </span>
          )}

          <button
            type="button"
            onClick={onSubmit}
            disabled={!value.trim() || isSubmitting}
            className={cn(
              'px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95',
              value.trim() && !isSubmitting
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/20'
                : 'bg-slate-200 dark:bg-neutral-800 text-slate-400 dark:text-neutral-500 cursor-not-allowed'
            )}
          >
            <span>Post Comment</span>
          </button>
        </div>
      </div>
    </div>
  );
};
