import React, { useState, useRef, useMemo, useCallback } from 'react';
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
import { useTheme } from '../../hooks/useTheme';
import { cn } from '../../utils/cn';
import {
  EditorSuggestions,
  LANGUAGE_SUGGESTIONS,
  extractIdentifiersFromCode,
  SuggestionItem,
} from './EditorSuggestions';

export interface EditorTheme {
  id: string;
  name: string;
  className: string;
  bg: string;
  gutterBg: string;
  textColor: string;
  borderColor: string;
  activeLineBg: string;
}

export const EDITOR_THEMES: Record<string, EditorTheme> = {
  system: {
    id: 'system',
    name: 'NextEra Dark (Recommended)',
    className: 'editor-theme-vs-dark',
    bg: 'bg-[#1e1e2e]',
    gutterBg: 'bg-[#181825]',
    textColor: 'text-[#cdd6f4]',
    borderColor: 'border-[#313244]',
    activeLineBg: 'bg-[#313244]/40',
  },
  'vs-dark': {
    id: 'vs-dark',
    name: 'VS Code Dark Pro',
    className: 'editor-theme-vs-dark',
    bg: 'bg-[#1e1e2e]',
    gutterBg: 'bg-[#181825]',
    textColor: 'text-[#cdd6f4]',
    borderColor: 'border-[#313244]',
    activeLineBg: 'bg-[#313244]/40',
  },
  'one-dark': {
    id: 'one-dark',
    name: 'One Dark Pro',
    className: 'editor-theme-one-dark',
    bg: 'bg-[#282c34]',
    gutterBg: 'bg-[#21252b]',
    textColor: 'text-[#abb2bf]',
    borderColor: 'border-[#3a3f4b]',
    activeLineBg: 'bg-[#2c313a]/60',
  },
  dracula: {
    id: 'dracula',
    name: 'Dracula Dark',
    className: 'editor-theme-dracula',
    bg: 'bg-[#282a36]',
    gutterBg: 'bg-[#21222c]',
    textColor: 'text-[#f8f8f2]',
    borderColor: 'border-[#44475a]',
    activeLineBg: 'bg-[#44475a]/30',
  },
  monokai: {
    id: 'monokai',
    name: 'Monokai Pro',
    className: 'editor-theme-monokai',
    bg: 'bg-[#272822]',
    gutterBg: 'bg-[#1e1f1c]',
    textColor: 'text-[#f8f8f2]',
    borderColor: 'border-[#3e3d32]',
    activeLineBg: 'bg-[#3e3d32]/40',
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    className: 'editor-theme-cyberpunk',
    bg: 'bg-[#0d0f18]',
    gutterBg: 'bg-[#08090f]',
    textColor: 'text-[#00ffcc]',
    borderColor: 'border-[#ff007f]/40',
    activeLineBg: 'bg-[#ff007f]/10',
  },
  light: {
    id: 'light',
    name: 'GitHub Light',
    className: 'editor-theme-light',
    bg: 'bg-[#ffffff]',
    gutterBg: 'bg-[#f6f8fa]',
    textColor: 'text-[#24292e]',
    borderColor: 'border-[#d0d7de]',
    activeLineBg: 'bg-[#f1f3f5]',
  },
};

export interface ProfessionalCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  fileName?: string;
  theme?: string;
  fontSize?: number;
  tabSize?: number;
  wordWrap?: boolean;
  readOnly?: boolean;
  minHeight?: string;
  placeholder?: string;
  onRun?: () => void;
  onSubmit?: () => void;
  className?: string;
  showLineNumbers?: boolean;
  disableCopyPaste?: boolean;
  onCopyPasteBlocked?: () => void;
}

export const ProfessionalCodeEditor: React.FC<ProfessionalCodeEditorProps> = ({
  value,
  onChange,
  language,
  fileName,
  theme = 'system',
  fontSize = 13.5,
  tabSize = 2,
  wordWrap = false,
  readOnly = false,
  minHeight = '100%',
  placeholder = '// Write your code here...',
  onRun,
  onSubmit,
  className,
  showLineNumbers = true,
  disableCopyPaste = false,
  onCopyPasteBlocked,
}) => {
  const { isDark } = useTheme();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const lineGutterRef = useRef<HTMLDivElement>(null);
  const [activeLine, setActiveLine] = useState<number>(1);

  // Auto-Suggestion (IntelliSense) state
  const [suggestionState, setSuggestionState] = useState<{
    visible: boolean;
    items: SuggestionItem[];
    selectedIndex: number;
    prefix: string;
    position: { top: number; left: number };
    replaceRange: { start: number; end: number };
  }>({
    visible: false,
    items: [],
    selectedIndex: 0,
    prefix: '',
    position: { top: 0, left: 0 },
    replaceRange: { start: 0, end: 0 },
  });

  // Resolve exact programming language from fileName extension or language prop
  const currentLanguage = useMemo(() => {
    if (fileName) {
      const ext = fileName.split('.').pop()?.toLowerCase();
      if (ext === 'html' || ext === 'htm') return 'html';
      if (ext === 'css' || ext === 'scss' || ext === 'sass' || ext === 'less') return 'css';
      if (ext === 'py' || ext === 'py3' || ext === 'python') return 'python';
      if (ext === 'js' || ext === 'jsx' || ext === 'mjs' || ext === 'cjs') return 'javascript';
      if (ext === 'ts' || ext === 'tsx') return 'typescript';
      if (ext === 'cpp' || ext === 'cxx' || ext === 'cc' || ext === 'h' || ext === 'hpp') return 'cpp';
      if (ext === 'c') return 'c';
      if (ext === 'java') return 'java';
      if (ext === 'sql') return 'sql';
      if (ext === 'json') return 'json';
    }
    const l = (language || 'javascript').toLowerCase();
    if (l === 'html' || l === 'htm') return 'html';
    if (l === 'css' || l === 'scss' || l === 'sass') return 'css';
    if (l === 'py' || l === 'python' || l === 'python3') return 'python';
    if (l === 'cpp' || l === 'c++') return 'cpp';
    if (l === 'c') return 'c';
    if (l === 'java') return 'java';
    if (l === 'sql') return 'sql';
    if (l === 'ts' || l === 'typescript') return 'typescript';
    if (l === 'json') return 'json';
    return 'javascript';
  }, [fileName, language]);

  // Map language aliases to Prism supported grammar names
  const prismLang = useMemo(() => {
    if (currentLanguage === 'html') return 'markup';
    return currentLanguage;
  }, [currentLanguage]);

  // Syntax highlight generated HTML
  const highlightedCode = useMemo(() => {
    const grammar = Prism.languages[prismLang] || Prism.languages.javascript;
    const safeCode = value || '';
    try {
      return Prism.highlight(safeCode, grammar, prismLang);
    } catch {
      return safeCode
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }
  }, [value, prismLang]);

  // Resolve theme styles
  const resolvedThemeConfig = useMemo(() => {
    if (theme === 'system') {
      return isDark ? EDITOR_THEMES['vs-dark'] : EDITOR_THEMES['light'];
    }
    return EDITOR_THEMES[theme] || (isDark ? EDITOR_THEMES['vs-dark'] : EDITOR_THEMES['light']);
  }, [theme, isDark]);

  // Synchronize scrolling between textarea, highlighted pre, and line numbers
  const handleScroll = () => {
    if (!textareaRef.current) return;
    const { scrollTop, scrollLeft } = textareaRef.current;

    if (preRef.current) {
      preRef.current.scrollTop = scrollTop;
      preRef.current.scrollLeft = scrollLeft;
    }
    if (lineGutterRef.current) {
      lineGutterRef.current.scrollTop = scrollTop;
    }
  };

  // Update active line and trigger auto suggestions
  const updateActiveLine = (_e?: React.SyntheticEvent<HTMLTextAreaElement>) => {
    if (!textareaRef.current) return;
    const pos = textareaRef.current.selectionStart;
    const textBefore = value.substring(0, pos);
    const line = textBefore.split('\n').length;
    setActiveLine(line);
  };

  // Inspect current token and show/hide IntelliSense suggestions (strictly language-isolated)
  const updateSuggestions = useCallback((currentVal: string, caretPos: number) => {
    if (readOnly || !textareaRef.current) {
      setSuggestionState((prev) => ({ ...prev, visible: false }));
      return;
    }

    const textBefore = currentVal.substring(0, caretPos);
    let prefix = '';
    let prefixStart = caretPos;

    if (currentLanguage === 'html') {
      // In HTML, match tag prefix with optional '<', e.g. "<div", "<", or "div"
      const match = textBefore.match(/(<)?([a-zA-Z0-9_-]*)$/);
      if (!match) {
        setSuggestionState((prev) => ({ ...prev, visible: false }));
        return;
      }
      const hasBracket = match[1] === '<';
      const tagPrefix = match[2];

      // If user hasn't typed '<' and hasn't typed at least 1 character, don't show
      if (!hasBracket && tagPrefix.length < 1) {
        setSuggestionState((prev) => ({ ...prev, visible: false }));
        return;
      }

      prefix = tagPrefix;
      prefixStart = caretPos - match[0].length; // includes '<' if user typed it so snippet replaces both cleanly
    } else if (currentLanguage === 'css') {
      // In CSS, match property names like "align-items", "font-size", "color"
      const match = textBefore.match(/([a-zA-Z-][a-zA-Z0-9-]*)$/);
      if (!match || match[1].length < 1) {
        setSuggestionState((prev) => ({ ...prev, visible: false }));
        return;
      }
      prefix = match[1];
      prefixStart = caretPos - prefix.length;
    } else {
      // In programming languages: Python, C++, Java, JS, SQL
      const match = textBefore.match(/([a-zA-Z_$][a-zA-Z0-9_$.]*)$/);
      if (!match || match[1].length < 1) {
        setSuggestionState((prev) => ({ ...prev, visible: false }));
        return;
      }
      prefix = match[1];
      prefixStart = caretPos - prefix.length;
    }

    // Resolve dictionary STRICTLY for currentLanguage
    const baseDict = LANGUAGE_SUGGESTIONS[currentLanguage] || LANGUAGE_SUGGESTIONS.javascript || [];
    const fileIdentifiers = extractIdentifiersFromCode(currentVal, currentLanguage);

    const merged = [...baseDict, ...fileIdentifiers];
    const seen = new Set<string>();
    const exactMatches: SuggestionItem[] = [];
    const prefixMatches: SuggestionItem[] = [];

    const cleanPrefix = prefix.toLowerCase();
    for (const item of merged) {
      if (seen.has(item.label)) continue;
      seen.add(item.label);

      const itemLower = item.label.toLowerCase();
      if (itemLower === cleanPrefix) {
        exactMatches.push(item);
      } else if (cleanPrefix === '' || itemLower.startsWith(cleanPrefix)) {
        prefixMatches.push(item);
      }
    }

    // Prioritize exact matches (so typing "p" or "div" or "def" keeps them at top of suggestions list)
    const filtered = [...exactMatches, ...prefixMatches].slice(0, 10);

    if (filtered.length === 0) {
      setSuggestionState((prev) => ({ ...prev, visible: false }));
      return;
    }

    // Calculate cursor coordinates (24px line height, mono char width)
    const linesBefore = textBefore.split('\n');
    const currentLineIdx = linesBefore.length - 1;
    const currentLineText = linesBefore[currentLineIdx];
    const column = currentLineText.length;

    const textarea = textareaRef.current;
    const LINE_HEIGHT_PX = 24;
    const CHAR_WIDTH_ESTIMATE = fontSize * 0.6;

    const top = Math.max(10, (currentLineIdx + 1) * LINE_HEIGHT_PX + 16 - textarea.scrollTop + 4);
    const left = Math.max(16, Math.min(column * CHAR_WIDTH_ESTIMATE + 16 - textarea.scrollLeft, textarea.clientWidth - 260));

    setSuggestionState({
      visible: true,
      items: filtered,
      selectedIndex: 0,
      prefix,
      position: { top, left },
      replaceRange: { start: prefixStart, end: caretPos },
    });
  }, [readOnly, currentLanguage, fontSize]);

  // Apply selected auto-suggestion into code
  const handleApplySuggestion = useCallback((item: SuggestionItem) => {
    if (!textareaRef.current) return;
    const { start, end } = suggestionState.replaceRange;
    const newValue = value.substring(0, start) + item.insertText + value.substring(end);
    onChange(newValue);
    setSuggestionState((prev) => ({ ...prev, visible: false }));

    // Position cursor intelligently: inside tags or quotes if appropriate
    let newCursor = start + item.insertText.length;
    const tagMatch = item.insertText.match(/^<([a-zA-Z0-9]+)[^>]*>(.*)<\/\1>$/s);
    if (tagMatch && item.insertText.includes('\n')) {
      // multiline tag like <div>\n  \n</div> -> place cursor on indented middle line
      const firstLineEnd = item.insertText.indexOf('\n');
      newCursor = start + firstLineEnd + 3;
    } else if (tagMatch) {
      // inline tag like <p></p> -> place cursor between <p> and </p>
      const openTagEnd = item.insertText.indexOf('>') + 1;
      newCursor = start + openTagEnd;
    } else if (item.insertText.endsWith('();')) {
      newCursor = start + item.insertText.length - 2;
    } else if (item.insertText.endsWith('()')) {
      newCursor = start + item.insertText.length - 1;
    } else if (item.insertText.endsWith('""')) {
      newCursor = start + item.insertText.length - 1;
    } else if (item.insertText.endsWith("''")) {
      newCursor = start + item.insertText.length - 1;
    }

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = newCursor;
        updateActiveLine();
      }
    }, 0);
  }, [value, onChange, suggestionState.replaceRange]);

  // Smart keyboard handling
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (readOnly) return;

    // Anti-cheat: Block copy / paste / cut shortcuts
    if (disableCopyPaste) {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      const keyLower = e.key.toLowerCase();
      if (
        (isCtrlOrCmd && (keyLower === 'v' || keyLower === 'c' || keyLower === 'x')) ||
        (e.shiftKey && e.key === 'Insert') ||
        (isCtrlOrCmd && e.key === 'Insert')
      ) {
        e.preventDefault();
        onCopyPasteBlocked?.();
        return;
      }
    }

    // IntelliSense Auto-Suggestion Keyboard Navigation
    if (suggestionState.visible && suggestionState.items.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSuggestionState((prev) => ({
          ...prev,
          selectedIndex: (prev.selectedIndex + 1) % prev.items.length,
        }));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSuggestionState((prev) => ({
          ...prev,
          selectedIndex: (prev.selectedIndex - 1 + prev.items.length) % prev.items.length,
        }));
        return;
      }
      if (e.key === 'Tab' || (e.key === 'Enter' && !e.ctrlKey && !e.metaKey)) {
        e.preventDefault();
        const selected = suggestionState.items[suggestionState.selectedIndex];
        if (selected) {
          handleApplySuggestion(selected);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setSuggestionState((prev) => ({ ...prev, visible: false }));
        return;
      }
    }

    // Run / Submit Shortcuts
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey && onSubmit) {
        onSubmit();
      } else if (onRun) {
        onRun();
      }
      return;
    }

    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // Tab key indent
    if (e.key === 'Tab') {
      e.preventDefault();
      const spaces = ' '.repeat(tabSize);

      if (e.shiftKey) {
        // Shift+Tab: Outdent line
        const beforeCursor = value.substring(0, start);
        const lastNewLine = beforeCursor.lastIndexOf('\n');
        const lineStart = lastNewLine === -1 ? 0 : lastNewLine + 1;
        const linePrefix = value.substring(lineStart, lineStart + tabSize);

        if (linePrefix === spaces) {
          const newValue = value.substring(0, lineStart) + value.substring(lineStart + tabSize);
          onChange(newValue);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = Math.max(lineStart, start - tabSize);
            updateActiveLine();
          }, 0);
        }
      } else {
        // Tab: Insert spaces
        const newValue = value.substring(0, start) + spaces + value.substring(end);
        onChange(newValue);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + tabSize;
          updateActiveLine();
        }, 0);
      }
      return;
    }

    // Auto-closing brackets and quotes
    const pairs: Record<string, string> = {
      '(': ')',
      '[': ']',
      '{': '}',
      '"': '"',
      "'": "'",
      '`': '`',
    };

    if (pairs[e.key] && start === end) {
      e.preventDefault();
      const openChar = e.key;
      const closeChar = pairs[openChar];
      const newValue = value.substring(0, start) + openChar + closeChar + value.substring(end);
      onChange(newValue);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1;
        updateActiveLine();
      }, 0);
      return;
    }

    // Auto-indent on Enter key
    if (e.key === 'Enter') {
      const beforeCursor = value.substring(0, start);
      const currentLine = beforeCursor.split('\n').pop() || '';
      const match = currentLine.match(/^(\s+)/);
      const indent = match ? match[1] : '';
      const extraIndent = currentLine.trim().endsWith('{') || currentLine.trim().endsWith(':') ? ' '.repeat(tabSize) : '';

      if (indent || extraIndent) {
        e.preventDefault();
        const nextIndent = indent + extraIndent;
        const newValue = value.substring(0, start) + '\n' + nextIndent + value.substring(end);
        onChange(newValue);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 1 + nextIndent.length;
          updateActiveLine();
        }, 0);
        return;
      }
    }
  };

  const lines = useMemo(() => {
    const split = value.split('\n');
    return split.length > 0 ? split : [''];
  }, [value]);

  const lineCount = lines.length;

  return (
    <div
      onClick={(e) => {
        if (e.target !== textareaRef.current) {
          textareaRef.current?.focus();
        }
      }}
      className={cn(
        'relative flex w-full overflow-hidden font-mono border transition-colors',
        resolvedThemeConfig.bg,
        resolvedThemeConfig.borderColor,
        resolvedThemeConfig.className,
        className
      )}
      style={{ minHeight }}
    >
      {/* Line Numbers Gutter */}
      {showLineNumbers && (
        <div
          ref={lineGutterRef}
          className={cn(
            'py-4 select-none text-right font-mono overflow-hidden shrink-0 border-r z-10 transition-colors',
            resolvedThemeConfig.gutterBg,
            resolvedThemeConfig.borderColor
          )}
          style={{
            width: `${Math.max(String(lineCount).length * 10 + 26, 44)}px`,
            fontSize: `${fontSize - 1.5}px`,
            lineHeight: '24px',
          }}
        >
          {lines.map((_, i) => {
            const lineNum = i + 1;
            const isCurrent = lineNum === activeLine;
            return (
              <div
                key={lineNum}
                className={cn(
                  'pr-3 pl-2 transition-colors',
                  isCurrent
                    ? 'text-brand-600 dark:text-brand-400 font-bold bg-brand-500/10'
                    : 'text-slate-500/80 dark:text-slate-600'
                )}
                style={{ height: '24px', lineHeight: '24px' }}
              >
                {lineNum}
              </div>
            );
          })}
        </div>
      )}

      {/* Editor Content Area */}
      <div className="relative flex-1 h-full overflow-hidden">
        {/* Syntax-Highlighted Render Layer (Behind textarea) */}
        <pre
          ref={preRef}
          aria-hidden="true"
          className={cn(
            'code-editor-pre absolute inset-0 p-4 m-0 font-mono pointer-events-none overflow-hidden select-none whitespace-pre',
            wordWrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre',
            resolvedThemeConfig.textColor
          )}
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: '24px',
            tabSize,
            MozTabSize: tabSize,
            whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
            wordBreak: wordWrap ? 'break-word' : 'normal',
            overflowWrap: wordWrap ? 'break-word' : 'normal',
          }}
        >
          <code
            className={`language-${prismLang}`}
            style={{
              fontFamily: 'inherit',
              fontSize: 'inherit',
              lineHeight: 'inherit',
              letterSpacing: 'inherit',
              wordSpacing: 'inherit',
              whiteSpace: 'inherit',
              padding: 0,
              margin: 0,
            }}
            dangerouslySetInnerHTML={{
              __html: highlightedCode + (value.endsWith('\n') ? ' ' : ''),
            }}
          />
        </pre>

        {/* Real Editable Textarea Layer (Transparent Text Overlay with Visible Caret) */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            updateActiveLine(e);
            updateSuggestions(e.target.value, e.target.selectionStart);
          }}
          onKeyDown={handleKeyDown}
          onClick={(e) => {
            updateActiveLine(e);
            setSuggestionState((prev) => ({ ...prev, visible: false }));
          }}
          onKeyUp={(e) => {
            updateActiveLine(e);
          }}
          onSelect={(e) => {
            updateActiveLine(e);
          }}
          onScroll={handleScroll}
          onPaste={(e) => {
            if (disableCopyPaste) {
              e.preventDefault();
              onCopyPasteBlocked?.();
            }
          }}
          onCopy={(e) => {
            if (disableCopyPaste) {
              e.preventDefault();
              onCopyPasteBlocked?.();
            }
          }}
          onCut={(e) => {
            if (disableCopyPaste) {
              e.preventDefault();
              onCopyPasteBlocked?.();
            }
          }}
          onContextMenu={(e) => {
            if (disableCopyPaste) {
              e.preventDefault();
              onCopyPasteBlocked?.();
            }
          }}
          readOnly={readOnly}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          placeholder={placeholder}
          wrap={wordWrap ? 'on' : 'off'}
          className="code-editor-textarea no-scrollbar scrollbar-none absolute inset-0 w-full h-full p-4 m-0 font-mono overflow-auto z-10 bg-transparent"
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: '24px',
            tabSize,
            MozTabSize: tabSize,
            whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
            wordBreak: wordWrap ? 'break-word' : 'normal',
            overflowWrap: wordWrap ? 'break-word' : 'normal',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            colorScheme: resolvedThemeConfig.id === 'light' ? 'light' : 'dark',
          }}
        />

        {/* IntelliSense Auto-Suggestions Popup */}
        {suggestionState.visible && (
          <EditorSuggestions
            suggestions={suggestionState.items}
            selectedIndex={suggestionState.selectedIndex}
            position={suggestionState.position}
            onSelect={handleApplySuggestion}
            prefix={suggestionState.prefix}
          />
        )}
      </div>
    </div>
  );
};
