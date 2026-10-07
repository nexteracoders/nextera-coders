import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Terminal as TerminalIcon,
  Trash2,
  X,
  Plus,
  ChevronDown,
  ChevronUp,
  Columns2,
  MoreHorizontal,
  Copy,
  Check,
  CheckCircle2,
  Globe,
  Radio,
  ExternalLink,
  RotateCw,
  Palette,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useToast } from '../ui/Toast';
import { ITestCaseItem } from '../../services/necAi.service';

export interface IntegratedTerminalProps {
  isOpen: boolean;
  height: number;
  onResizeStart: () => void;
  onClose: () => void;
  terminalTab: 'problems' | 'output' | 'debug-console' | 'terminal' | 'ports';
  onTabChange: (tab: 'problems' | 'output' | 'debug-console' | 'terminal' | 'ports') => void;
  terminalOutput: string;
  onAppendOutput: (text: string) => void;
  onClearTerminal: () => void;
  executionStats: {
    timeMs: number;
    memoryMb: number;
    status: 'idle' | 'success' | 'error';
    exitCode: number;
  };
  hasCompilerError: boolean;
  onFixWithAi: () => void;
  onRunActiveFile: () => void;
  onDownloadZip: () => void;
  onLoadReactTemplate: () => void;
  onScaffoldViteProject?: (targetDir: string, appName: string) => void;
  onCreateFolder?: (folderName: string, parentDir?: string) => void;
  onCreateFile?: (fileName: string, content: string, language?: string, folderName?: string) => void;
  onDeleteFileOrFolder?: (name: string) => boolean;
  onToggleWebPreview: () => void;
  workspaceFiles: Array<{
    name: string;
    content: string;
    language: string;
    folderId?: string | null;
  }>;
  workspaceFolders: Array<{
    id: string;
    name: string;
  }>;
  onLiveStdinSubmit: (inputVal: string) => void;
  customStdin: string;
  onCustomStdinChange: (val: string) => void;
  onGenerateTestCases: () => void;
  isGeneratingTestCases: boolean;
  generatedEdgeCases: ITestCaseItem[];
  activeFileName?: string;
  lastDownloadedPath?: string | null;
  newTerminalTrigger?: number;
}

export type ShellType = 'powershell' | 'bash' | 'cmd' | 'node';

export interface TerminalSession {
  id: string;
  name: string;
  shellType: ShellType;
  currentDir: string;
  output: string;
  commandInput: string;
  commandHistory: string[];
  historyIndex: number;
  isSplit: boolean;
  splitOutput: string;
  splitCommandInput: string;
  createdAt: number;
}

export interface TerminalColorTheme {
  id: string;
  name: string;
  promptColor: string;
  pathColor: string;
  commandColor: string;
  caretColor: string;
  successColor: string;
  errorColor: string;
  infoColor: string;
  bgTint?: string;
}

export const TERMINAL_COLOR_THEMES: Record<string, TerminalColorTheme> = {
  vscode: {
    id: 'vscode',
    name: 'VS Code Modern',
    promptColor: '#4ec9b0',   // teal
    pathColor: '#dcdcaa',     // yellow
    commandColor: '#ffffff',  // bright white
    caretColor: '#58a6ff',    // electric blue
    successColor: '#4ec9b0',  // mint
    errorColor: '#f87171',    // red
    infoColor: '#9cdcfe',     // sky blue
  },
  dracula: {
    id: 'dracula',
    name: 'Dracula Neon',
    promptColor: '#bd93f9',   // purple
    pathColor: '#8be9fd',     // cyan
    commandColor: '#f8f8f2',  // cream white
    caretColor: '#ff79c6',    // neon pink
    successColor: '#50fa7b',  // neon green
    errorColor: '#ff5555',    // coral red
    infoColor: '#ffb86c',     // orange
  },
  onedark: {
    id: 'onedark',
    name: 'One Dark Pro',
    promptColor: '#e06c75',   // soft coral
    pathColor: '#e5c07b',     // warm amber
    commandColor: '#abb2bf',  // light gray
    caretColor: '#61afef',    // cerulean
    successColor: '#98c379',  // sage green
    errorColor: '#e06c75',    // red
    infoColor: '#56b6c2',     // cyan
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk 2077',
    promptColor: '#fcee0a',   // neon yellow
    pathColor: '#00ff9f',     // neon spring
    commandColor: '#00f0ff',  // cyber cyan
    caretColor: '#ff003c',    // electric crimson
    successColor: '#00ff9f',  // matrix green
    errorColor: '#ff003c',    // crimson red
    infoColor: '#a855f7',     // purple
  },
  tokyonight: {
    id: 'tokyonight',
    name: 'Tokyo Night',
    promptColor: '#bb9af7',   // soft violet
    pathColor: '#7aa2f7',     // soft blue
    commandColor: '#c0caf5',  // silvery lavender
    caretColor: '#7dcfff',    // cyan
    successColor: '#9ece6a',  // lime green
    errorColor: '#f7768e',    // rose red
    infoColor: '#e0af68',    // gold
  },
  amber: {
    id: 'amber',
    name: 'Retro Phosphor Amber',
    promptColor: '#ffb000',   // deep amber
    pathColor: '#ffcc00',     // bright gold
    commandColor: '#ffe57f',  // light amber
    caretColor: '#ff9100',    // vivid amber
    successColor: '#69f0ae',  // neon mint
    errorColor: '#ff5252',    // orange red
    infoColor: '#ffd740',     // light gold
  },
};

export const IntegratedTerminal: React.FC<IntegratedTerminalProps> = ({
  isOpen,
  height,
  onResizeStart,
  onClose,
  terminalTab,
  onTabChange,
  terminalOutput,
  onAppendOutput,
  onClearTerminal,
  hasCompilerError,
  onFixWithAi,
  onRunActiveFile,
  onDownloadZip,
  onLoadReactTemplate,
  onScaffoldViteProject,
  onCreateFolder,
  onCreateFile,
  onDeleteFileOrFolder,
  onToggleWebPreview,
  workspaceFiles,
  workspaceFolders,
  onLiveStdinSubmit,
  lastDownloadedPath,
  newTerminalTrigger = 0,
}) => {
  const { success } = useToast();
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  // Shell Switcher & More Menu Dropdown States
  const [isShellDropdownOpen, setIsShellDropdownOpen] = useState<boolean>(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState<boolean>(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState<boolean>(false);

  // Terminal Appearance & Multi-Color Theme Customization State
  const [isAppearanceModalOpen, setIsAppearanceModalOpen] = useState<boolean>(false);
  const [terminalFontSize, setTerminalFontSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('nec_terminal_appearance');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.fontSize) return parsed.fontSize;
      }
    } catch {}
    return 12;
  });

  const [themeKey, setThemeKey] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('nec_terminal_appearance');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.themeKey) return parsed.themeKey;
      }
    } catch {}
    return 'vscode';
  });

  const [customColors, setCustomColors] = useState<{
    prompt: string;
    path: string;
    command: string;
    caret: string;
  }>(() => {
    try {
      const saved = localStorage.getItem('nec_terminal_appearance');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.customColors) return parsed.customColors;
      }
    } catch {}
    return {
      prompt: '#4ec9b0',
      path: '#dcdcaa',
      command: '#ffffff',
      caret: '#58a6ff',
    };
  });

  // Effective Active Theme with Multi-Color Token Mapping
  const activeTheme: TerminalColorTheme = useMemo(() => {
    if (themeKey === 'custom') {
      return {
        id: 'custom',
        name: 'Custom Multi-Color',
        promptColor: customColors.prompt,
        pathColor: customColors.path,
        commandColor: customColors.command,
        caretColor: customColors.caret,
        successColor: '#4ec9b0',
        errorColor: '#f87171',
        infoColor: '#9cdcfe',
      };
    }
    return TERMINAL_COLOR_THEMES[themeKey] || TERMINAL_COLOR_THEMES.vscode;
  }, [themeKey, customColors]);

  // Save terminal appearance preferences
  const saveAppearance = useCallback((size: number, key: string, custom?: typeof customColors) => {
    try {
      localStorage.setItem(
        'nec_terminal_appearance',
        JSON.stringify({
          fontSize: size,
          themeKey: key,
          customColors: custom || customColors,
        })
      );
    } catch {}
  }, [customColors]);

  // Initial Default Session
  const defaultInitialSession: TerminalSession = useMemo(() => ({
    id: 'term-1',
    name: '1: powershell',
    shellType: 'powershell',
    currentDir: 'C:\\Users\\Sandip\\workspace',
    output:
      'Windows PowerShell\nCopyright (C) Microsoft Corporation. All rights reserved.\n\nTry the new cross-platform PowerShell https://aka.ms/pscore6\n\nPS C:\\Users\\Sandip\\workspace> \n',
    commandInput: '',
    commandHistory: [
      'npm create vite@latest my-app',
      'cd my-app',
      'npm run dev',
    ],
    historyIndex: -1,
    isSplit: false,
    splitOutput:
      'Windows PowerShell\nCopyright (C) Microsoft Corporation. All rights reserved.\n\nPS C:\\Users\\Sandip\\workspace> \n',
    splitCommandInput: '',
    createdAt: Date.now(),
  }), []);

  // Multi-Terminal Sessions Collection
  const [sessions, setSessions] = useState<TerminalSession[]>([defaultInitialSession]);
  const [activeSessionId, setActiveSessionId] = useState<string>('term-1');

  // Currently Active Session
  const activeSession: TerminalSession = useMemo(() => {
    return sessions.find((s) => s.id === activeSessionId) || sessions[0] || defaultInitialSession;
  }, [sessions, activeSessionId, defaultInitialSession]);

  // Update Active Session attributes helper
  const updateActiveSession = useCallback((updates: Partial<TerminalSession>) => {
    setSessions((prev) =>
      prev.map((sess) => (sess.id === activeSessionId ? { ...sess, ...updates } : sess))
    );
  }, [activeSessionId]);

  // Sync external terminal output (e.g. from compiler execution or zip export) to active session
  const lastSyncedOutputRef = useRef<string>(terminalOutput);
  useEffect(() => {
    if (terminalOutput !== lastSyncedOutputRef.current) {
      const addedText = terminalOutput.startsWith(lastSyncedOutputRef.current)
        ? terminalOutput.slice(lastSyncedOutputRef.current.length)
        : terminalOutput;

      lastSyncedOutputRef.current = terminalOutput;
      if (addedText) {
        setSessions((prev) =>
          prev.map((sess) =>
            sess.id === activeSessionId
              ? { ...sess, output: sess.output + addedText }
              : sess
          )
        );
      }
    }
  }, [terminalOutput, activeSessionId]);

  // Listen to external new terminal trigger from page header/status bar
  const prevTriggerRef = useRef<number>(newTerminalTrigger);
  useEffect(() => {
    if (newTerminalTrigger > 0 && newTerminalTrigger !== prevTriggerRef.current) {
      prevTriggerRef.current = newTerminalTrigger;
      handleNewTerminal('powershell');
    }
  }, [newTerminalTrigger]);

  // Debug Console REPL State
  const [debugLogs, setDebugLogs] = useState<Array<{ id: string; type: 'input' | 'output' | 'error'; text: string }>>([
    { id: '1', type: 'output', text: 'NextEra Debugger attached. Ready to evaluate JavaScript expressions.' },
  ]);
  const [debugInput, setDebugInput] = useState<string>('');

  // Output Tab Channel State
  const [outputChannel, setOutputChannel] = useState<'tasks' | 'engine' | 'git'>('tasks');

  const terminalBodyRef = useRef<HTMLDivElement>(null);
  const splitTerminalBodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const splitInputRef = useRef<HTMLInputElement>(null);
  const debugBodyRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal output on changes
  useEffect(() => {
    if (terminalBodyRef.current) {
      terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight;
    }
  }, [activeSession?.output]);

  useEffect(() => {
    if (splitTerminalBodyRef.current) {
      splitTerminalBodyRef.current.scrollTop = splitTerminalBodyRef.current.scrollHeight;
    }
  }, [activeSession?.splitOutput]);

  useEffect(() => {
    if (debugBodyRef.current) {
      debugBodyRef.current.scrollTop = debugBodyRef.current.scrollHeight;
    }
  }, [debugLogs]);

  // Auto-focus input when terminal tab is active or opened
  useEffect(() => {
    if (isOpen && terminalTab === 'terminal') {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, terminalTab, activeSessionId]);

  // Robust Path Navigation Engine (supports cd .., cd.., cd <folder>, cd ~, cd /, etc.)
  const navigateDirectory = (target: string, fromDir: string): string => {
    const trimmed = target.trim();
    if (!trimmed || trimmed === '.') return fromDir;
    if (trimmed === '~') return 'C:\\Users\\Sandip';
    if (trimmed === '/' || trimmed === '\\') return 'C:\\';

    // Full Windows drive path
    if (/^[a-zA-Z]:[\\\/]/.test(trimmed)) {
      return trimmed.replace(/\//g, '\\');
    }

    const parts = fromDir.replace(/[\\\/]$/, '').split(/[\\\/]/);
    const subSegments = trimmed.replace(/\//g, '\\').split('\\');

    for (const seg of subSegments) {
      if (seg === '..') {
        if (parts.length > 1) {
          parts.pop();
        }
      } else if (seg && seg !== '.') {
        parts.push(seg);
      }
    }

    let newPath = parts.join('\\');
    if (/^[a-zA-Z]:$/.test(newPath)) {
      newPath += '\\';
    }
    return newPath;
  };

  // Get Prompt Prefix and Path for Active Shell
  const getPromptDetails = (shell: ShellType, dir: string) => {
    switch (shell) {
      case 'powershell':
        return { prefix: 'PS ', path: dir, suffix: '>' };
      case 'cmd':
        return { prefix: '', path: dir, suffix: '>' };
      case 'bash': {
        let bashPath = dir.replace(/^C:\\Users\\Sandip/i, '~').replace(/\\/g, '/');
        if (!bashPath.startsWith('~') && !bashPath.startsWith('/')) bashPath = '/' + bashPath;
        return { prefix: 'guest@nextera-ide:', path: bashPath, suffix: '$' };
      }
      case 'node':
        return { prefix: '>', path: '', suffix: '' };
      default:
        return { prefix: 'PS ', path: dir, suffix: '>' };
    }
  };

  const currentPrompt = useMemo(() => {
    return getPromptDetails(activeSession.shellType, activeSession.currentDir);
  }, [activeSession.shellType, activeSession.currentDir]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPath(text);
    success('Path copied to clipboard!');
    setTimeout(() => setCopiedPath(null), 2000);
  };

  // Create / Spawn a Brand New Terminal Session (Multiple Terminals)
  const handleNewTerminal = (requestedShell?: ShellType) => {
    const nextShell: ShellType = requestedShell || activeSession.shellType || 'powershell';
    const nextIndex = sessions.length + 1;
    const newId = `term-${Date.now()}`;
    const newName = `${nextIndex}: ${nextShell}`;

    let initialBanner = '';
    if (nextShell === 'powershell') {
      initialBanner = `Windows PowerShell\nCopyright (C) Microsoft Corporation. All rights reserved.\n\nPS ${activeSession.currentDir}> \n`;
    } else if (nextShell === 'bash') {
      initialBanner = `Welcome to NextEra Bash Subsystem (GNU bash, version 5.2.15-release)\nguest@nextera-ide:~$ \n`;
    } else if (nextShell === 'cmd') {
      initialBanner = `Microsoft Windows [Version 10.0.22631.3296]\n(c) Microsoft Corporation. All rights reserved.\n\n${activeSession.currentDir}> \n`;
    } else {
      initialBanner = `Welcome to Node.js v20.11.0.\nType ".help" for more information.\n> \n`;
    }

    const newSession: TerminalSession = {
      id: newId,
      name: newName,
      shellType: nextShell,
      currentDir: activeSession.currentDir,
      output: initialBanner,
      commandInput: '',
      commandHistory: [],
      historyIndex: -1,
      isSplit: false,
      splitOutput: initialBanner,
      splitCommandInput: '',
      createdAt: Date.now(),
    };

    setSessions((prev) => [...prev, newSession]);
    setActiveSessionId(newId);
    success(`Opened new terminal: ${newName}`);
  };

  // Kill / Close a Specific Terminal Session
  const handleKillSession = (sessionId: string) => {
    if (sessions.length <= 1) {
      // If only 1 terminal remains, reset its buffer to fresh state
      updateActiveSession({
        output: `${currentPrompt.prefix}${currentPrompt.path}${currentPrompt.suffix} \n`,
        commandInput: '',
      });
      onClearTerminal();
      success('Terminal buffer cleared');
      return;
    }

    const sessionToKill = sessions.find((s) => s.id === sessionId);
    const updated = sessions.filter((s) => s.id !== sessionId);

    if (activeSessionId === sessionId) {
      const idx = sessions.findIndex((s) => s.id === sessionId);
      const nextActive = updated[Math.max(0, idx - 1)] || updated[0];
      setActiveSessionId(nextActive.id);
    }

    setSessions(updated);
    success(`Closed ${sessionToKill?.name || 'terminal'}`);
  };

  // Toggle Split Pane for a Session
  const handleToggleSplitSession = (sessionId: string) => {
    setSessions((prev) =>
      prev.map((sess) => {
        if (sess.id === sessionId) {
          const nextSplit = !sess.isSplit;
          return {
            ...sess,
            isSplit: nextSplit,
            splitOutput: sess.splitOutput || sess.output,
          };
        }
        return sess;
      })
    );
    success(activeSession.isSplit ? 'Closed split terminal' : 'Split terminal activated');
  };

  // Append text to active session output
  const appendSessionOutput = (text: string, isSplit: boolean = false) => {
    if (isSplit) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, splitOutput: s.splitOutput + text }
            : s
        )
      );
    } else {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, output: s.output + text }
            : s
        )
      );
      onAppendOutput(text);
    }
  };

  // Execute Simulated Vite Project Setup (npm create vite@latest)
  const handleExecuteCreateViteApp = (appName: string = 'my-vite-app') => {
    const cleanName = appName === '.' ? 'vite-project' : appName;
    const targetPath = appName === '.' ? activeSession.currentDir : `${activeSession.currentDir}\\${cleanName}`;
    const promptStr = `${currentPrompt.prefix}${currentPrompt.path}${currentPrompt.suffix}`;

    appendSessionOutput(
      `\n${promptStr} npm create vite@latest ${appName}\n` +
      `Need to install the following packages:\n` +
      `  create-vite@5.4.1\n` +
      `Ok to proceed? (y) y\n\n` +
      `✔ Project name: ... ${cleanName}\n` +
      `✔ Select a framework: › React\n` +
      `✔ Select a variant: › TypeScript + SWC\n\n` +
      `Scaffolding project in ${targetPath}...\n\n` +
      `[████████████████████████████████] 100%\n` +
      `+ vite@5.4.1\n` +
      `+ @vitejs/plugin-react@4.3.1\n` +
      `+ react@18.3.1\n` +
      `+ react-dom@18.3.1\n` +
      `+ typescript@5.5.3\n\n` +
      `Done. Now run:\n\n` +
      (appName !== '.' ? `  cd ${cleanName}\n` : '') +
      `  npm install\n` +
      `  npm run dev\n\n` +
      `⚡ NextEra IDE: Project files generated and loaded into Explorer!\n`
    );

    if (onScaffoldViteProject) {
      onScaffoldViteProject(activeSession.currentDir, cleanName);
    } else {
      onLoadReactTemplate();
    }
  };

  // Execute Simulated React Project Setup (npx create-react-app)
  const handleExecuteCreateReactApp = (appName: string = 'nextera-react-app') => {
    const cleanName = appName === '.' ? 'react-app' : appName;
    const targetPath = appName === '.' ? activeSession.currentDir : `${activeSession.currentDir}\\${cleanName}`;
    const promptStr = `${currentPrompt.prefix}${currentPrompt.path}${currentPrompt.suffix}`;

    appendSessionOutput(
      `\n${promptStr} npx create-react-app ${cleanName}\n` +
      `Creating a new React app in ${targetPath}.\n\n` +
      `Installing packages. This might take a couple of minutes.\n` +
      `Installing react, react-dom, and react-scripts with cra-template...\n\n` +
      `[████████████████████████████████] 100%\n` +
      `+ react@18.3.1\n` +
      `+ react-dom@18.3.1\n` +
      `+ react-scripts@5.0.1\n` +
      `Added 1,342 packages from 658 contributors in 3.4s.\n\n` +
      `Initialized git repository in ${targetPath}\\.git\n\n` +
      `✔ Success! Created ${cleanName} at ${targetPath}\n` +
      `Inside that directory, you can run several commands:\n\n` +
      `  npm start\n` +
      `    Starts the development server.\n\n` +
      `  npm run build\n` +
      `    Bundles the app into static files for production.\n\n` +
      `  export-project / zip\n` +
      `    Downloads ZIP archive to C:\\Users\\Sandip\\Downloads\\nextera-code-project.zip\n\n` +
      `We suggest that you begin by typing:\n\n` +
      (cleanName !== 'nextera-react-app' ? `  cd ${cleanName}\n` : '') +
      `  npm start\n\n` +
      `Happy hacking!\n`
    );
    onLoadReactTemplate();
  };

  // Execute Simulated Dev Server Start (Vite / CRA)
  const handleExecuteNpmStart = () => {
    const promptStr = `${currentPrompt.prefix}${currentPrompt.path}${currentPrompt.suffix}`;
    appendSessionOutput(
      `\n${promptStr} npm run dev\n\n` +
      `  VITE v5.4.14  ready in 218 ms\n\n` +
      `  ➜  Local:   http://localhost:5173/\n` +
      `  ➜  Network: use --host to expose\n` +
      `  ➜  press h + enter to show help\n\n` +
      `[HMR] Dev server running for ${activeSession.currentDir}\n`
    );
    onToggleWebPreview();
  };

  // Execute Simulated Npm Install
  const handleExecuteNpmInstall = (pkg?: string) => {
    const pkgName = pkg || '';
    const promptStr = `${currentPrompt.prefix}${currentPrompt.path}${currentPrompt.suffix}`;
    appendSessionOutput(
      `\n${promptStr} npm install ${pkgName}\n` +
      (pkgName ? `fetching ${pkgName}...\n` : `auditing workspace dependencies in ${activeSession.currentDir}...\n`) +
      `[████████████████████████████████] 100%\n` +
      `added ${pkgName ? '1' : '84'} packages in 1.1s\n` +
      `found 0 vulnerabilities\n`
    );
  };

  // Execute Export Project ZIP with exact Windows Downloads path
  const handleExecuteExportZip = () => {
    const downloadPath = `C:\\Users\\Sandip\\Downloads\\nextera-code-project.zip`;
    const promptStr = `${currentPrompt.prefix}${currentPrompt.path}${currentPrompt.suffix}`;
    appendSessionOutput(
      `\n${promptStr} export-project --zip\n` +
      `Packaging workspace files from ${activeSession.currentDir}...\n` +
      workspaceFiles.map((f) => `  ✔ ${f.name} (${Math.max(120, f.content.length)} bytes)`).join('\n') +
      `\n✔ Validating PKZIP 2.0 checksum integrity (CRC-32 verified)\n\n` +
      `======================================================================\n` +
      `  FILE ARCHIVE CREATED SUCCESSFULLY\n` +
      `  Target Location:\n` +
      `  ${downloadPath}\n` +
      `======================================================================\n` +
      `Status: Archive delivered to your local Downloads folder.\n`
    );
    onDownloadZip();
  };

  // Handle Directory Listing (ls / dir)
  const handleExecuteDir = (targetArg?: string) => {
    const listDir = targetArg ? navigateDirectory(targetArg, activeSession.currentDir) : activeSession.currentDir;
    const now = new Date();
    const dateStr = now.toLocaleDateString() + '  ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const header =
      `\n    Directory: ${listDir}\n\n` +
      `Mode                 LastWriteTime         Length Name\n` +
      `----                 -------------         ------ ----\n`;

    const folderLines = workspaceFolders
      .map((f) => `d-----         ${dateStr}              0 ${f.name}`)
      .join('\n');

    const fileLines = workspaceFiles
      .map((f) => {
        const len = f.content.length.toString().padStart(10, ' ');
        return `-a----         ${dateStr}     ${len} ${f.name}`;
      })
      .join('\n');

    const promptStr = `${currentPrompt.prefix}${currentPrompt.path}${currentPrompt.suffix}`;
    appendSessionOutput(
      `\n${promptStr} ${activeSession.shellType === 'bash' ? 'ls -la' : 'dir'}\n` +
      header +
      (folderLines ? folderLines + '\n' : '') +
      fileLines +
      '\n'
    );
  };

  // Primary Command Execution Router
  const runCommandLogic = (rawCmd: string, isSplit: boolean = false) => {
    const promptStr = `${currentPrompt.prefix}${currentPrompt.path}${currentPrompt.suffix}`;
    const trimmedRaw = rawCmd.trim();
    if (!trimmedRaw) return;

    // Handle cd.. without space (e.g. "cd..", "cd..\subfolder")
    if (
      trimmedRaw.toLowerCase() === 'cd..' ||
      trimmedRaw.toLowerCase().startsWith('cd..\\') ||
      trimmedRaw.toLowerCase().startsWith('cd../')
    ) {
      const remainder = trimmedRaw.slice(4).trim();
      const target = remainder ? `..\\${remainder}` : '..';
      const nextDir = navigateDirectory(target, activeSession.currentDir);
      updateActiveSession({ currentDir: nextDir });
      return;
    }

    const tokens = trimmedRaw.split(/\s+/);
    const command = tokens[0]?.toLowerCase();
    const args = tokens.slice(1);

    // npm create vite@latest
    if (trimmedRaw.toLowerCase().startsWith('npm create vite') || trimmedRaw.toLowerCase().startsWith('npm init vite')) {
      const appName = args[args.length - 1]?.startsWith('-') ? 'my-vite-app' : (args[args.length - 1] || 'my-vite-app');
      handleExecuteCreateViteApp(appName);
      return;
    }

    // npx create-react-app
    if (trimmedRaw.toLowerCase().startsWith('npx create-react-app')) {
      const appName = args[1] || 'nextera-react-app';
      handleExecuteCreateReactApp(appName);
      return;
    }

    switch (command) {
      case 'cls':
      case 'clear':
        if (isSplit) {
          updateActiveSession({ splitOutput: `${promptStr} \n` });
        } else {
          updateActiveSession({ output: `${promptStr} \n` });
          onClearTerminal();
        }
        return;

      case 'cd': {
        const target = args.join(' ').trim();
        if (!target) {
          appendSessionOutput(`\n${promptStr} cd\n${activeSession.currentDir}\n`, isSplit);
          return;
        }
        const nextDir = navigateDirectory(target, activeSession.currentDir);
        updateActiveSession({ currentDir: nextDir });
        return;
      }

      case 'pwd':
        appendSessionOutput(`\n${promptStr} pwd\n${activeSession.currentDir}\n`, isSplit);
        return;

      case 'mkdir':
      case 'md': {
        const folderName = args.join(' ').trim();
        if (!folderName) {
          appendSessionOutput(`\n${promptStr} ${rawCmd}\nError: Missing folder name argument.\n`, isSplit);
          return;
        }
        if (onCreateFolder) {
          onCreateFolder(folderName, activeSession.currentDir);
          appendSessionOutput(`\n${promptStr} ${rawCmd}\nCreated directory: ${activeSession.currentDir}\\${folderName}\n`, isSplit);
          success(`Created folder: ${folderName}`);
        } else {
          appendSessionOutput(`\n${promptStr} ${rawCmd}\nCreated directory: ${activeSession.currentDir}\\${folderName}\n`, isSplit);
        }
        return;
      }

      case 'touch':
      case 'ni':
      case 'new-item': {
        const fileName = args.join(' ').trim();
        if (!fileName) {
          appendSessionOutput(`\n${promptStr} ${rawCmd}\nError: Missing file name argument.\n`, isSplit);
          return;
        }
        if (onCreateFile) {
          onCreateFile(fileName, `// ${fileName}\n`, undefined, activeSession.currentDir);
          appendSessionOutput(`\n${promptStr} ${rawCmd}\nCreated file: ${activeSession.currentDir}\\${fileName}\n`, isSplit);
          success(`Created file: ${fileName}`);
        } else {
          appendSessionOutput(`\n${promptStr} ${rawCmd}\nCreated file: ${activeSession.currentDir}\\${fileName}\n`, isSplit);
        }
        return;
      }

      case 'rm':
      case 'del':
      case 'rmdir': {
        const targetName = args.join(' ').trim();
        if (!targetName) {
          appendSessionOutput(`\n${promptStr} ${rawCmd}\nError: Missing target name.\n`, isSplit);
          return;
        }
        if (onDeleteFileOrFolder) {
          const removed = onDeleteFileOrFolder(targetName);
          if (removed) {
            appendSessionOutput(`\n${promptStr} ${rawCmd}\nRemoved: ${targetName}\n`, isSplit);
            success(`Removed: ${targetName}`);
          } else {
            appendSessionOutput(`\n${promptStr} ${rawCmd}\nItem not found: ${targetName}\n`, isSplit);
          }
        }
        return;
      }

      case 'npm':
        if (args[0] === 'start' || (args[0] === 'run' && (args[1] === 'dev' || args[1] === 'start'))) {
          handleExecuteNpmStart();
          return;
        }
        if (args[0] === 'i' || args[0] === 'install') {
          handleExecuteNpmInstall(args[1]);
          return;
        }
        if (args[0] === 'run' && args[1] === 'build') {
          handleExecuteExportZip();
          return;
        }
        if (args[0] === 'create' && (args[1] === 'react' || args[1] === 'react-app')) {
          handleExecuteCreateReactApp(args[2] || 'nextera-react-app');
          return;
        }
        appendSessionOutput(
          `\n${promptStr} ${rawCmd}\nSupported commands: npm create vite@latest [name], npm run dev, npm install [pkg], npm run build\n`,
          isSplit
        );
        return;

      case 'dir':
      case 'ls':
        handleExecuteDir(args[0]);
        return;

      case 'cat':
      case 'type':
        if (args[0]) {
          const target = workspaceFiles.find((f) => f.name.toLowerCase() === args[0].toLowerCase());
          if (target) {
            appendSessionOutput(`\n${promptStr} ${rawCmd}\n${target.content}\n`, isSplit);
          } else {
            appendSessionOutput(`\n${promptStr} ${rawCmd}\nFile not found in ${activeSession.currentDir}: ${args[0]}\n`, isSplit);
          }
        } else {
          appendSessionOutput(`\n${promptStr} ${rawCmd}\nUsage: cat <filename>\n`, isSplit);
        }
        return;

      case 'echo':
        appendSessionOutput(`\n${promptStr} ${rawCmd}\n${args.join(' ')}\n`, isSplit);
        return;

      case 'export-project':
      case 'zip':
      case 'export':
      case 'download':
        handleExecuteExportZip();
        return;

      case 'run':
      case 'node':
      case 'python':
      case 'python3':
        appendSessionOutput(`\n${promptStr} ${rawCmd}\n`, isSplit);
        onRunActiveFile();
        return;

      case 'git':
        if (args[0] === 'status') {
          appendSessionOutput(
            `\n${promptStr} git status\nOn branch main\nYour branch is up to date with 'origin/main'.\n\nnothing to commit, working tree clean\n`,
            isSplit
          );
          return;
        }
        if (args[0] === 'branch') {
          appendSessionOutput(`\n${promptStr} git branch\n* main\n`, isSplit);
          return;
        }
        appendSessionOutput(`\n${promptStr} git ${args.join(' ')}\nGit v2.43.0 initialized for workspace.\n`, isSplit);
        return;

      case 'help':
        appendSessionOutput(
          `\n${promptStr} help\n` +
          `NextEra Multi-Terminal Engine — VS Code Power Edition\n` +
          `-----------------------------------------------------------------\n` +
          `  cd <dir>                      Change directory (e.g. cd my-app, cd .., cd~)\n` +
          `  cd..                          Quick parent directory jump\n` +
          `  pwd                           Print current working directory\n` +
          `  npm create vite@latest [name] Scaffold complete Vite + React + TypeScript app\n` +
          `  npx create-react-app [name]   Bootstrap complete React 1 CRA application\n` +
          `  npm run dev / npm start       Start Vite / React dev server with live preview\n` +
          `  npm install [pkg]             Install npm packages with audit report\n` +
          `  mkdir <name> / md <name>      Create new folder in active directory\n` +
          `  touch <name>                  Create new file in active directory\n` +
          `  rm <name> / del <name>        Delete file or folder from workspace\n` +
          `  dir / ls                      List files & folders in active directory\n` +
          `  cat <file> / type <file>      Display contents of a file\n` +
          `  export-project / zip          Export & download ZIP archive to Downloads\n` +
          `  run                           Execute active code file through compiler\n` +
          `  cls / clear                   Clear terminal buffer\n` +
          `-----------------------------------------------------------------\n`,
          isSplit
        );
        return;

      default:
        onLiveStdinSubmit(rawCmd);
        return;
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawCmd = activeSession.commandInput.trim();
    if (!rawCmd) return;

    const newHistory = [...activeSession.commandHistory.filter((c) => c !== rawCmd), rawCmd];
    updateActiveSession({
      commandInput: '',
      commandHistory: newHistory,
      historyIndex: -1,
    });

    runCommandLogic(rawCmd, false);
  };

  const handleSplitFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawCmd = activeSession.splitCommandInput.trim();
    if (!rawCmd) return;

    updateActiveSession({ splitCommandInput: '' });
    runCommandLogic(rawCmd, true);
  };

  // Keyboard navigation for Command History
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (activeSession.commandHistory.length === 0) return;
      const nextIndex =
        activeSession.historyIndex === -1
          ? activeSession.commandHistory.length - 1
          : Math.max(0, activeSession.historyIndex - 1);
      updateActiveSession({
        historyIndex: nextIndex,
        commandInput: activeSession.commandHistory[nextIndex] || '',
      });
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (activeSession.historyIndex === -1) return;
      const nextIndex = activeSession.historyIndex + 1;
      if (nextIndex >= activeSession.commandHistory.length) {
        updateActiveSession({
          historyIndex: -1,
          commandInput: '',
        });
      } else {
        updateActiveSession({
          historyIndex: nextIndex,
          commandInput: activeSession.commandHistory[nextIndex] || '',
        });
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      updateActiveSession({ output: `${currentPrompt.prefix}${currentPrompt.path}${currentPrompt.suffix} \n` });
      onClearTerminal();
    }
  };

  // Debug Console Evaluator Handler
  const handleDebugSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!debugInput.trim()) return;
    const expr = debugInput.trim();
    setDebugInput('');

    const newLogs = [...debugLogs, { id: String(Date.now()), type: 'input' as const, text: expr }];

    try {
      // Safe client-side eval for expressions
      // eslint-disable-next-line no-eval
      const result = window.eval(expr);
      newLogs.push({
        id: String(Date.now() + 1),
        type: 'output' as const,
        text: typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result),
      });
    } catch (err: unknown) {
      newLogs.push({
        id: String(Date.now() + 1),
        type: 'error' as const,
        text: err instanceof Error ? err.message : String(err),
      });
    }
    setDebugLogs(newLogs);
  };

  // Render formatted lines with Multi-Color Syntax Highlighting
  const renderFormattedLine = (line: string, idx: number) => {
    const targetAddress = 'C:\\Users\\Sandip\\Downloads\\nextera-code-project.zip';
    if (line.includes(targetAddress)) {
      return (
        <div
          key={idx}
          className="my-2 p-2 rounded bg-[#252526] border border-[#3c3c3c] flex flex-col sm:flex-row sm:items-center justify-between gap-2 select-text"
        >
          <div className="font-mono text-xs text-[#cccccc]">
            <span className="text-[#9cdcfe] font-bold block text-[10px] uppercase">
              Archive Download Location:
            </span>
            <span className="text-[#dcdcaa] font-bold select-all">
              {targetAddress}
            </span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(targetAddress);
            }}
            className="px-2 py-1 rounded text-[11px] bg-[#333333] hover:bg-[#3c3c3c] text-[#cccccc] hover:text-white flex items-center gap-1 transition-colors self-start sm:self-auto cursor-pointer border border-[#454545]"
            title="Copy file path"
          >
            {copiedPath === targetAddress ? (
              <>
                <Check className="w-3 h-3 text-[#4ec9b0]" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy Path</span>
              </>
            )}
          </button>
        </div>
      );
    }

    // Dynamic Multi-Color Syntax
    const isError = /error|failed|fatal:|uncaught|exception/i.test(line);
    const isSuccess = /✔|success|\+ vite|\+ react|100%|Done\.|ready in/i.test(line);
    const isInfo = /➜|Directory:|Mode|LastWriteTime|Initialized|VITE v|PS C:/i.test(line);

    let textColor = '#cccccc';
    if (isError) textColor = activeTheme.errorColor;
    else if (isSuccess) textColor = activeTheme.successColor;
    else if (isInfo) textColor = activeTheme.infoColor;

    return (
      <div key={idx} className="leading-relaxed" style={{ color: textColor }}>
        {line}
      </div>
    );
  };

  if (!isOpen) return null;

  const currentHeight = isMaximized ? 500 : height;

  return (
    <div
      style={{ height: `${currentHeight}px` }}
      className="bg-[#181818] border-t border-[#2d2d2d] flex flex-col shrink-0 z-10 select-none relative font-mono transition-[height] duration-150 text-[#cccccc]"
    >
      {/* DRAGGABLE RESIZE HANDLE */}
      <div
        onMouseDown={onResizeStart}
        className="h-1 w-full bg-[#181818] hover:bg-[#007acc] cursor-ns-resize flex items-center justify-center transition-colors group"
        title="Drag to resize panel"
      />

      {/* VS CODE TERMINAL TAB HEADER BAR */}
      <div className="h-9 px-3 bg-[#181818] border-b border-[#2d2d2d] flex items-center justify-between text-[11px] select-none font-sans">
        
        {/* LEFT: EXACT VS CODE TABS */}
        <div className="flex items-center gap-1 sm:gap-2">
          
          {/* Problems Tab */}
          <button
            type="button"
            onClick={() => onTabChange('problems')}
            className={cn(
              'px-2 py-1 transition-colors cursor-pointer flex items-center gap-1.5 uppercase tracking-wide text-xs font-medium',
              terminalTab === 'problems'
                ? 'text-white border-b-2 border-amber-400 font-semibold'
                : 'text-[#969696] hover:text-[#e0e0e0]'
            )}
          >
            <span>Problems</span>
            <span
              className={cn(
                'px-1.5 py-0.2 rounded-full text-[10px] font-mono',
                hasCompilerError ? 'bg-rose-500/20 text-rose-300' : 'bg-[#2a2d2e] text-[#858585]'
              )}
            >
              {hasCompilerError ? '1' : '0'}
            </span>
          </button>

          {/* Output Tab */}
          <button
            type="button"
            onClick={() => onTabChange('output')}
            className={cn(
              'px-2 py-1 transition-colors cursor-pointer uppercase tracking-wide text-xs font-medium',
              terminalTab === 'output'
                ? 'text-white border-b-2 border-amber-400 font-semibold'
                : 'text-[#969696] hover:text-[#e0e0e0]'
            )}
          >
            Output
          </button>

          {/* Debug Console Tab */}
          <button
            type="button"
            onClick={() => onTabChange('debug-console')}
            className={cn(
              'px-2 py-1 transition-colors cursor-pointer uppercase tracking-wide text-xs font-medium',
              terminalTab === 'debug-console'
                ? 'text-white border-b-2 border-amber-400 font-semibold'
                : 'text-[#969696] hover:text-[#e0e0e0]'
            )}
          >
            Debug Console
          </button>

          {/* Terminal Tab (Active by Default) */}
          <button
            type="button"
            onClick={() => onTabChange('terminal')}
            className={cn(
              'px-2 py-1 transition-colors cursor-pointer uppercase tracking-wide text-xs font-medium flex items-center gap-1',
              terminalTab === 'terminal'
                ? 'text-white border-b-2 border-amber-400 font-semibold'
                : 'text-[#969696] hover:text-[#e0e0e0]'
            )}
          >
            <span>Terminal</span>
            {sessions.length > 1 && (
              <span className="px-1 py-0.2 rounded text-[10px] bg-[#2a2d2e] text-[#4ec9b0] font-mono font-bold">
                {sessions.length}
              </span>
            )}
          </button>

          {/* Ports Tab */}
          <button
            type="button"
            onClick={() => onTabChange('ports')}
            className={cn(
              'px-2 py-1 transition-colors cursor-pointer uppercase tracking-wide text-xs font-medium',
              terminalTab === 'ports'
                ? 'text-white border-b-2 border-amber-400 font-semibold'
                : 'text-[#969696] hover:text-[#e0e0e0]'
            )}
          >
            Ports
          </button>

        </div>

        {/* RIGHT: EXACT VS CODE TERMINAL ICONS & ACTIONS */}
        <div className="flex items-center gap-1 text-[#cccccc]">
          
          {/* Shell Selector Dropdown Button */}
          {terminalTab === 'terminal' && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsShellDropdownOpen((prev) => !prev)}
                className="px-2 py-1 rounded hover:bg-[#2a2d2e] text-xs font-sans flex items-center gap-1.5 text-[#cccccc] hover:text-white cursor-pointer transition-colors"
                title="Select Active Shell"
              >
                <TerminalIcon className="w-3.5 h-3.5 text-[#4ec9b0]" />
                <span className="font-mono text-xs">{activeSession.shellType}</span>
                <ChevronDown className="w-3 h-3 text-[#969696]" />
              </button>

              {isShellDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-[#1e1e1e] border border-[#333333] rounded-lg shadow-2xl z-50 py-1 font-sans text-xs">
                  <div className="px-3 py-1 text-[10px] text-[#858585] uppercase tracking-wider font-bold">
                    Switch Shell For Current Session
                  </div>
                  {(['powershell', 'bash', 'cmd', 'node'] as ShellType[]).map((sh) => (
                    <button
                      key={sh}
                      type="button"
                      onClick={() => {
                        updateActiveSession({ shellType: sh });
                        setIsShellDropdownOpen(false);
                        success(`Switched shell to ${sh}`);
                      }}
                      className={cn(
                        'w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[#2a2d2e] cursor-pointer',
                        activeSession.shellType === sh && 'text-[#4ec9b0] font-bold bg-[#262626]'
                      )}
                    >
                      <TerminalIcon className="w-3.5 h-3.5" />
                      <span className="capitalize">{sh === 'powershell' ? 'PowerShell (pwsh)' : sh === 'cmd' ? 'Command Prompt' : sh}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* New Terminal (+) */}
          {terminalTab === 'terminal' && (
            <button
              type="button"
              onClick={() => handleNewTerminal()}
              className="p-1 rounded hover:bg-[#2a2d2e] text-[#cccccc] hover:text-white cursor-pointer transition-colors"
              title="New Terminal Session (Ctrl+Shift+`)"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
            </button>
          )}

          {/* Profile Dropdown (⌄) */}
          {terminalTab === 'terminal' && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProfileDropdownOpen((prev) => !prev)}
                className="p-1 rounded hover:bg-[#2a2d2e] text-[#cccccc] hover:text-white cursor-pointer transition-colors"
                title="Launch New Terminal with Profile..."
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {isProfileDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 w-52 bg-[#1e1e1e] border border-[#333333] rounded-lg shadow-2xl z-50 py-1 font-sans text-xs">
                  <div className="px-3 py-1 text-[10px] text-[#858585] uppercase tracking-wider font-bold">
                    Launch New Session As
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      handleNewTerminal('powershell');
                      setIsProfileDropdownOpen(false);
                    }}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#2a2d2e] flex items-center gap-2 cursor-pointer"
                  >
                    <span>PowerShell (Default)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleNewTerminal('bash');
                      setIsProfileDropdownOpen(false);
                    }}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#2a2d2e] flex items-center gap-2 cursor-pointer"
                  >
                    <span>Git Bash / WSL</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleNewTerminal('cmd');
                      setIsProfileDropdownOpen(false);
                    }}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#2a2d2e] flex items-center gap-2 cursor-pointer"
                  >
                    <span>Command Prompt (cmd.exe)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleNewTerminal('node');
                      setIsProfileDropdownOpen(false);
                    }}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#2a2d2e] flex items-center gap-2 cursor-pointer"
                  >
                    <span>Node.js REPL</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Split Terminal Icon (Columns2) */}
          {terminalTab === 'terminal' && (
            <button
              type="button"
              onClick={() => handleToggleSplitSession(activeSession.id)}
              className={cn(
                'p-1 rounded hover:bg-[#2a2d2e] cursor-pointer transition-colors',
                activeSession.isSplit ? 'text-[#007acc] bg-[#2a2d2e]' : 'text-[#cccccc] hover:text-white'
              )}
              title={activeSession.isSplit ? 'Unsplit Terminal' : 'Split Terminal (Ctrl+Shift+5)'}
            >
              <Columns2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Terminal Appearance Settings (Palette / Sliders) */}
          <button
            type="button"
            onClick={() => setIsAppearanceModalOpen((prev) => !prev)}
            className={cn(
              'p-1 rounded hover:bg-[#2a2d2e] cursor-pointer transition-colors',
              isAppearanceModalOpen ? 'text-amber-400 bg-[#2a2d2e]' : 'text-[#cccccc] hover:text-white'
            )}
            title="Terminal Font Size & Color Themes"
          >
            <Palette className="w-3.5 h-3.5" />
          </button>

          {/* Kill / Clear Terminal (Trash2) */}
          <button
            type="button"
            onClick={() => handleKillSession(activeSession.id)}
            className="p-1 rounded hover:bg-[#2a2d2e] text-[#cccccc] hover:text-rose-400 cursor-pointer transition-colors"
            title="Kill Active Terminal Session"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* More Actions (...) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMoreMenuOpen((prev) => !prev)}
              className="p-1 rounded hover:bg-[#2a2d2e] text-[#cccccc] hover:text-white cursor-pointer transition-colors"
              title="More Actions"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>

            {isMoreMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-[#1e1e1e] border border-[#333333] rounded-lg shadow-2xl z-50 py-1 font-sans text-xs">
                <button
                  type="button"
                  onClick={() => {
                    handleExecuteCreateViteApp('my-vite-app');
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-[#2a2d2e] flex items-center gap-2 text-violet-300 cursor-pointer"
                >
                  <span>⚡ Install Vite + React Project</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleExecuteCreateReactApp('nextera-react-app');
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-[#2a2d2e] flex items-center gap-2 text-cyan-300 cursor-pointer"
                >
                  <span>⚛️ Install React App (CRA)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleExecuteNpmStart();
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-[#2a2d2e] flex items-center gap-2 text-emerald-300 cursor-pointer"
                >
                  <span>▶️ Run Development Server</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleExecuteExportZip();
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-[#2a2d2e] flex items-center gap-2 text-amber-300 cursor-pointer"
                >
                  <span>💾 Export Project ZIP</span>
                </button>
                <div className="my-1 border-t border-[#333333]" />
                <button
                  type="button"
                  onClick={() => {
                    setIsAppearanceModalOpen(true);
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-[#2a2d2e] flex items-center gap-2 cursor-pointer text-[#4ec9b0]"
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Customize Colors & Font Size</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onRunActiveFile();
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-[#2a2d2e] flex items-center gap-2 cursor-pointer"
                >
                  <span>Run Active Code File</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateActiveSession({
                      output: `${currentPrompt.prefix}${currentPrompt.path}${currentPrompt.suffix} \n`,
                    });
                    onClearTerminal();
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-[#2a2d2e] flex items-center gap-2 cursor-pointer text-rose-300"
                >
                  <span>Clear Buffer</span>
                </button>
              </div>
            )}
          </div>

          {/* Chevron Maximize / Restore Toggle (^) */}
          <button
            type="button"
            onClick={() => setIsMaximized((prev) => !prev)}
            className="p-1 rounded hover:bg-[#2a2d2e] text-[#cccccc] hover:text-white cursor-pointer transition-colors"
            title={isMaximized ? 'Restore Panel Size' : 'Maximize Panel Size'}
          >
            <ChevronUp className={cn('w-3.5 h-3.5 transition-transform', isMaximized && 'rotate-180')} />
          </button>

          {/* Close Panel (✕) */}
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-[#2a2d2e] hover:text-white cursor-pointer transition-colors ml-0.5"
            title="Close Panel (Ctrl+`)"
          >
            <X className="w-3.5 h-3.5" />
          </button>

        </div>
      </div>

      {/* TERMINAL CONTENT AREA */}
      <div className="flex-1 overflow-hidden flex flex-col bg-[#181818] relative">

        {/* TERMINAL APPEARANCE & MULTI-COLOR SETTINGS POPOVER */}
        {isAppearanceModalOpen && (
          <div className="absolute right-4 top-2 z-50 w-80 sm:w-96 bg-[#1e1e1e] border border-[#3c3c3c] rounded-xl shadow-2xl p-4 font-sans text-xs text-[#cccccc] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#2d2d2d]">
              <div className="flex items-center gap-2 font-bold text-white">
                <Palette className="w-4 h-4 text-amber-400" />
                <span>Terminal Appearance & Colors</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAppearanceModalOpen(false)}
                className="p-1 rounded hover:bg-[#2d2d2d] text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-3 space-y-4 max-h-[380px] overflow-y-auto pr-1">
              {/* 1. Font Size Controller */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-neutral-400 font-bold">Font Size</span>
                  <span className="text-amber-400 font-bold">{terminalFontSize}px</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="11"
                    max="18"
                    step="1"
                    value={terminalFontSize}
                    onChange={(e) => {
                      const next = Number(e.target.value);
                      setTerminalFontSize(next);
                      saveAppearance(next, themeKey, customColors);
                    }}
                    className="flex-1 accent-amber-500 cursor-pointer"
                  />
                </div>
                <div className="flex gap-1.5 pt-1">
                  {[11, 12, 13, 14, 16].map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => {
                        setTerminalFontSize(sz);
                        saveAppearance(sz, themeKey, customColors);
                      }}
                      className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-mono border transition-all cursor-pointer',
                        terminalFontSize === sz
                          ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                          : 'bg-[#252526] text-[#969696] border-[#333] hover:text-white'
                      )}
                    >
                      {sz}px
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Color Combinations Preset Themes */}
              <div className="space-y-1.5">
                <span className="text-neutral-400 font-bold block text-[11px]">
                  Multi-Color Combination Themes
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.values(TERMINAL_COLOR_THEMES).map((theme) => {
                    const isSelected = themeKey === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => {
                          setThemeKey(theme.id);
                          saveAppearance(terminalFontSize, theme.id, customColors);
                          success(`Applied ${theme.name}`);
                        }}
                        className={cn(
                          'p-2 rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer',
                          isSelected
                            ? 'bg-[#252526] border-amber-400 ring-1 ring-amber-400'
                            : 'bg-[#181818] border-[#333] hover:border-[#444] hover:bg-[#202020]'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className={cn('text-[11px] font-semibold', isSelected ? 'text-white' : 'text-[#cccccc]')}>
                            {theme.name}
                          </span>
                          {isSelected && <Check className="w-3 h-3 text-amber-400" />}
                        </div>
                        {/* Swatches representation */}
                        <div className="flex items-center gap-1">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.promptColor }} title="Prompt" />
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.pathColor }} title="Path" />
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.commandColor }} title="Text" />
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.caretColor }} title="Caret" />
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.successColor }} title="Success" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Custom Color Pickers */}
              <div className="space-y-2 pt-2 border-t border-[#2d2d2d]">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400 font-bold text-[11px]">Custom Multi-Color Palette</span>
                  <button
                    type="button"
                    onClick={() => {
                      setThemeKey('custom');
                      saveAppearance(terminalFontSize, 'custom', customColors);
                    }}
                    className={cn(
                      'px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer',
                      themeKey === 'custom'
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-[#252526] text-amber-400 border-[#3c3c3c]'
                    )}
                  >
                    {themeKey === 'custom' ? 'Active' : 'Enable Custom'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  {/* Prompt Color */}
                  <label className="flex items-center justify-between p-1.5 rounded bg-[#181818] border border-[#2d2d2d]">
                    <span className="text-[#969696]">Prompt:</span>
                    <input
                      type="color"
                      value={customColors.prompt}
                      onChange={(e) => {
                        const next = { ...customColors, prompt: e.target.value };
                        setCustomColors(next);
                        setThemeKey('custom');
                        saveAppearance(terminalFontSize, 'custom', next);
                      }}
                      className="w-5 h-5 rounded cursor-pointer border-none bg-transparent"
                    />
                  </label>

                  {/* Path Color */}
                  <label className="flex items-center justify-between p-1.5 rounded bg-[#181818] border border-[#2d2d2d]">
                    <span className="text-[#969696]">Path:</span>
                    <input
                      type="color"
                      value={customColors.path}
                      onChange={(e) => {
                        const next = { ...customColors, path: e.target.value };
                        setCustomColors(next);
                        setThemeKey('custom');
                        saveAppearance(terminalFontSize, 'custom', next);
                      }}
                      className="w-5 h-5 rounded cursor-pointer border-none bg-transparent"
                    />
                  </label>

                  {/* Command Text Color */}
                  <label className="flex items-center justify-between p-1.5 rounded bg-[#181818] border border-[#2d2d2d]">
                    <span className="text-[#969696]">Text:</span>
                    <input
                      type="color"
                      value={customColors.command}
                      onChange={(e) => {
                        const next = { ...customColors, command: e.target.value };
                        setCustomColors(next);
                        setThemeKey('custom');
                        saveAppearance(terminalFontSize, 'custom', next);
                      }}
                      className="w-5 h-5 rounded cursor-pointer border-none bg-transparent"
                    />
                  </label>

                  {/* Caret Cursor Color */}
                  <label className="flex items-center justify-between p-1.5 rounded bg-[#181818] border border-[#2d2d2d]">
                    <span className="text-[#969696]">Caret:</span>
                    <input
                      type="color"
                      value={customColors.caret}
                      onChange={(e) => {
                        const next = { ...customColors, caret: e.target.value };
                        setCustomColors(next);
                        setThemeKey('custom');
                        saveAppearance(terminalFontSize, 'custom', next);
                      }}
                      className="w-5 h-5 rounded cursor-pointer border-none bg-transparent"
                    />
                  </label>
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="p-2.5 rounded-lg bg-[#141414] border border-[#2d2d2d] font-mono text-[11px] space-y-1">
                <div className="text-[10px] text-neutral-500 font-sans uppercase font-bold">Theme Preview:</div>
                <div className="flex items-center gap-1">
                  <span style={{ color: activeTheme.promptColor }}>PS </span>
                  <span style={{ color: activeTheme.pathColor }}>C:\workspace&gt;</span>
                  <span style={{ color: activeTheme.commandColor }}>npm create vite@latest</span>
                  <span className="w-1.5 h-3.5 inline-block animate-pulse" style={{ backgroundColor: activeTheme.caretColor }} />
                </div>
                <div style={{ color: activeTheme.successColor }}>✔ Success! Project scaffolded.</div>
              </div>

              {/* Reset to Defaults */}
              <button
                type="button"
                onClick={() => {
                  setTerminalFontSize(12);
                  setThemeKey('vscode');
                  setCustomColors({
                    prompt: '#4ec9b0',
                    path: '#dcdcaa',
                    command: '#ffffff',
                    caret: '#58a6ff',
                  });
                  saveAppearance(12, 'vscode');
                  success('Reset terminal appearance to default.');
                }}
                className="w-full py-1.5 rounded bg-[#2a2d2e] hover:bg-[#333] text-neutral-300 text-[11px] font-bold transition-colors cursor-pointer"
              >
                Reset to VS Code Defaults
              </button>
            </div>
          </div>
        )}

        {/* 1. TERMINAL VIEW (WITH VS CODE RIGHT-SIDE MULTI-TERMINAL DRAWER) */}
        {terminalTab === 'terminal' && (
          <div className="flex-1 flex overflow-hidden">
            
            {/* Primary Terminal Active Canvas */}
            <div
              ref={terminalBodyRef}
              onClick={() => inputRef.current?.focus()}
              className="flex-1 p-3 overflow-y-auto font-mono text-[#cccccc] cursor-text flex flex-col min-w-0"
              style={{ fontSize: `${terminalFontSize}px` }}
            >
              {/* Output lines */}
              <div className="whitespace-pre-wrap leading-relaxed space-y-0.5">
                {activeSession.output.split('\n').map((line, idx) => renderFormattedLine(line, idx))}
              </div>

              {/* Multi-Color Dynamic Prompt Line */}
              <form onSubmit={handleFormSubmit} className="mt-1 flex items-center gap-1.5 w-full flex-wrap sm:flex-nowrap">
                <span
                  className="font-mono select-none shrink-0 font-bold"
                  style={{ color: activeTheme.promptColor }}
                >
                  {currentPrompt.prefix}
                </span>
                {currentPrompt.path && (
                  <span
                    className="font-mono select-none shrink-0 font-semibold"
                    style={{ color: activeTheme.pathColor }}
                  >
                    {currentPrompt.path}{currentPrompt.suffix}
                  </span>
                )}
                <div className="relative flex-1 flex items-center min-w-[180px]">
                  <input
                    ref={inputRef}
                    type="text"
                    value={activeSession.commandInput}
                    onChange={(e) => updateActiveSession({ commandInput: e.target.value })}
                    onKeyDown={handleKeyDown}
                    className="terminal-cli-input w-full font-mono"
                    style={{
                      backgroundColor: 'transparent',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      boxShadow: 'none',
                      color: activeTheme.commandColor,
                      caretColor: activeTheme.caretColor,
                      fontSize: `${terminalFontSize}px`,
                      padding: 0,
                      margin: 0,
                    }}
                    autoComplete="off"
                    spellCheck="false"
                    autoFocus
                  />
                </div>
              </form>
            </div>

            {/* Split Terminal Pane (If Activated for this session) */}
            {activeSession.isSplit && (
              <div
                ref={splitTerminalBodyRef}
                onClick={() => splitInputRef.current?.focus()}
                className="flex-1 p-3 overflow-y-auto font-mono text-[#cccccc] cursor-text border-l border-[#2d2d2d] flex flex-col bg-[#181818] min-w-0"
                style={{ fontSize: `${terminalFontSize}px` }}
              >
                <div className="flex items-center justify-between text-[10px] text-[#858585] mb-2 pb-1 border-b border-[#2d2d2d] select-none">
                  <span className="font-bold text-[#4ec9b0]">{activeSession.name} (split)</span>
                  <button
                    type="button"
                    onClick={() => updateActiveSession({ isSplit: false })}
                    className="hover:text-white cursor-pointer"
                    title="Close Split Terminal"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                <div className="whitespace-pre-wrap leading-relaxed space-y-0.5">
                  {activeSession.splitOutput.split('\n').map((line, idx) => renderFormattedLine(line, idx))}
                </div>

                <form onSubmit={handleSplitFormSubmit} className="mt-1 flex items-center gap-1.5 w-full">
                  <span
                    className="font-mono select-none shrink-0 font-bold"
                    style={{ color: activeTheme.promptColor }}
                  >
                    {currentPrompt.prefix}
                  </span>
                  {currentPrompt.path && (
                    <span
                      className="font-mono select-none shrink-0 font-semibold"
                      style={{ color: activeTheme.pathColor }}
                    >
                      {currentPrompt.path}{currentPrompt.suffix}
                    </span>
                  )}
                  <input
                    ref={splitInputRef}
                    type="text"
                    value={activeSession.splitCommandInput}
                    onChange={(e) => updateActiveSession({ splitCommandInput: e.target.value })}
                    className="terminal-cli-input w-full font-mono"
                    style={{
                      backgroundColor: 'transparent',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      boxShadow: 'none',
                      color: activeTheme.commandColor,
                      caretColor: activeTheme.caretColor,
                      fontSize: `${terminalFontSize}px`,
                      padding: 0,
                      margin: 0,
                    }}
                    autoComplete="off"
                    spellCheck="false"
                  />
                </form>
              </div>
            )}

            {/* VS CODE RIGHT-SIDE VERTICAL MULTI-TERMINAL LIST PANEL (Exactly matching user screenshot) */}
            <div className="w-40 sm:w-48 bg-[#1e1e1e] border-l border-[#2d2d2d] flex flex-col shrink-0 select-none z-10">
              
              {/* Right Sidebar Header Bar */}
              <div className="h-7 px-2.5 bg-[#181818] border-b border-[#2d2d2d] flex items-center justify-between text-[10px] text-[#858585] font-sans uppercase font-bold tracking-wider">
                <span>Terminals ({sessions.length})</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleNewTerminal()}
                    className="p-0.5 rounded hover:bg-[#2a2d2e] text-[#cccccc] hover:text-white cursor-pointer"
                    title="New Terminal Session (+)"
                  >
                    <Plus className="w-3 h-3 text-emerald-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleSplitSession(activeSession.id)}
                    className="p-0.5 rounded hover:bg-[#2a2d2e] text-[#cccccc] hover:text-white cursor-pointer"
                    title="Split Terminal"
                  >
                    <Columns2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Vertical Scrollable List of Open Sessions */}
              <div className="flex-1 overflow-y-auto py-1 space-y-0.5">
                {sessions.map((sess) => {
                  const isActive = sess.id === activeSessionId;
                  return (
                    <div
                      key={sess.id}
                      onClick={() => setActiveSessionId(sess.id)}
                      className={cn(
                        'group px-2.5 py-1.5 flex items-center justify-between text-xs cursor-pointer border-l-2 transition-colors select-none',
                        isActive
                          ? 'bg-[#2a2d2e] text-white border-amber-400 font-semibold shadow-sm'
                          : 'text-[#969696] hover:text-[#e0e0e0] hover:bg-[#222222] border-transparent'
                      )}
                    >
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <TerminalIcon
                          className={cn(
                            'w-3.5 h-3.5 shrink-0',
                            isActive ? 'text-[#4ec9b0]' : 'text-[#858585] group-hover:text-[#cccccc]'
                          )}
                        />
                        <span className="truncate font-mono text-[11px]">{sess.name}</span>
                      </div>

                      {/* Session Action Buttons (Split & Kill) */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSplitSession(sess.id);
                          }}
                          className="p-1 rounded hover:bg-[#3c3c3c] text-[#cccccc] hover:text-white cursor-pointer"
                          title="Split Terminal"
                        >
                          <Columns2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleKillSession(sess.id);
                          }}
                          className="p-1 rounded hover:bg-[#3c3c3c] text-[#cccccc] hover:text-rose-400 cursor-pointer"
                          title="Kill Terminal"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Sidebar Footer */}
              <div className="p-2 bg-[#181818] border-t border-[#2d2d2d] flex items-center justify-between text-[10px] text-[#858585] font-sans">
                <span className="truncate">Active: {activeSession.shellType}</span>
                <button
                  type="button"
                  onClick={() => setIsAppearanceModalOpen(true)}
                  className="hover:text-amber-400 cursor-pointer flex items-center gap-1 text-[10px]"
                  title="Configure Appearance"
                >
                  <Palette className="w-3 h-3 text-amber-400" />
                  <span>Colors</span>
                </button>
              </div>

            </div>

          </div>
        )}

        {/* 2. PROBLEMS VIEW */}
        {terminalTab === 'problems' && (
          <div className="flex-1 p-4 overflow-y-auto font-sans text-xs">
            {hasCompilerError ? (
              <div className="p-3 rounded bg-[#252526] border border-rose-500/40 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">● Error:</span>
                  <div>
                    <div className="text-white font-medium">Compilation / Runtime Error Detected</div>
                    <div className="text-[#969696] text-[11px] font-mono mt-0.5">
                      Review stack trace in the Terminal tab or use AI auto-fix.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onFixWithAi}
                  className="px-2.5 py-1 rounded text-xs bg-[#007acc] text-white hover:bg-[#0062a3] transition-colors cursor-pointer shrink-0"
                >
                  Fix with AI
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-[#858585] space-y-1 select-none">
                <CheckCircle2 className="w-5 h-5 text-[#4ec9b0]" />
                <span>No problems have been detected in the workspace.</span>
              </div>
            )}
          </div>
        )}

        {/* 3. OUTPUT VIEW */}
        {terminalTab === 'output' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="h-7 px-3 bg-[#1e1e1e] border-b border-[#2d2d2d] flex items-center justify-between text-xs select-none">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#858585]">Channel:</span>
                <select
                  value={outputChannel}
                  onChange={(e) => setOutputChannel(e.target.value as 'tasks' | 'engine' | 'git')}
                  className="bg-[#252526] text-white text-xs border border-[#3c3c3c] rounded px-1.5 py-0.5 outline-none cursor-pointer"
                >
                  <option value="tasks">Tasks (Compiler Build)</option>
                  <option value="engine">NextEra Sandboxed Engine</option>
                  <option value="git">Git Output</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => onAppendOutput('\n[Output Channel Refreshed]\n')}
                className="text-[#969696] hover:text-white cursor-pointer"
                title="Refresh Output"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1 p-3 overflow-y-auto font-mono text-xs text-[#cccccc] whitespace-pre-wrap leading-relaxed">
              {outputChannel === 'tasks' && (
                <div>
                  [NextEra Tasks] Initialized execution environment.\n
                  [Build] TypeScript v5.7.2 check passed.\n
                  [Sandbox] Ready for browser rendering and code execution.\n
                  {lastDownloadedPath && `[ZipExporter] Target: ${lastDownloadedPath}\n`}
                </div>
              )}
              {outputChannel === 'engine' && (
                <div>
                  [Engine: WebAssembly Sandbox]\n
                  Memory Allocated: 128 MB\n
                  Active Runtime: V8 / Node.js in-browser evaluator\n
                  Security Sandbox: Enforced isolation\n
                </div>
              )}
              {outputChannel === 'git' && (
                <div>
                  [Git] On branch main\n
                  Working tree clean. Nothing to commit.\n
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. DEBUG CONSOLE VIEW (INTERACTIVE REPL) */}
        {terminalTab === 'debug-console' && (
          <div
            ref={debugBodyRef}
            className="flex-1 p-3 overflow-y-auto font-mono text-xs text-[#cccccc] flex flex-col justify-between"
          >
            <div className="space-y-1 whitespace-pre-wrap">
              {debugLogs.map((log) => (
                <div
                  key={log.id}
                  className={cn(
                    'leading-relaxed',
                    log.type === 'input' && 'text-[#9cdcfe]',
                    log.type === 'output' && 'text-[#4ec9b0]',
                    log.type === 'error' && 'text-rose-400'
                  )}
                >
                  {log.type === 'input' ? `> ${log.text}` : log.text}
                </div>
              ))}
            </div>

            {/* Interactive Debug Input */}
            <form onSubmit={handleDebugSubmit} className="mt-2 pt-2 border-t border-[#2d2d2d] flex items-center gap-1.5">
              <span className="text-[#9cdcfe] font-bold select-none">&gt;</span>
              <input
                type="text"
                value={debugInput}
                onChange={(e) => setDebugInput(e.target.value)}
                placeholder="Evaluate JavaScript expression in debug console..."
                className="terminal-cli-input flex-1 text-xs font-mono"
                style={{
                  backgroundColor: 'transparent',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  boxShadow: 'none',
                  color: '#ffffff',
                  caretColor: '#58a6ff',
                }}
              />
            </form>
          </div>
        )}

        {/* 5. PORTS VIEW (VS CODE FORWARDED PORTS TABLE) */}
        {terminalTab === 'ports' && (
          <div className="flex-1 p-3 overflow-y-auto font-sans text-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-[#858585] text-[11px]">
                <Radio className="w-3.5 h-3.5 text-[#4ec9b0] animate-pulse" />
                <span>Forwarded Web Ports (2 Active)</span>
              </div>
              <button
                type="button"
                onClick={onToggleWebPreview}
                className="px-2.5 py-1 rounded bg-[#007acc] text-white hover:bg-[#0062a3] text-xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Open Web Preview</span>
              </button>
            </div>

            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#2d2d2d] text-[#858585] text-[10px] uppercase">
                  <th className="pb-2 font-medium">Port</th>
                  <th className="pb-2 font-medium">Forwarded Address</th>
                  <th className="pb-2 font-medium">Visibility</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#242424]">
                <tr className="hover:bg-[#202020] transition-colors">
                  <td className="py-2.5 text-[#9cdcfe] font-bold">3000</td>
                  <td className="py-2.5 text-white">http://localhost:3000</td>
                  <td className="py-2.5 text-[#858585]">Local / In-Browser</td>
                  <td className="py-2.5">
                    <span className="inline-flex items-center gap-1 text-[#4ec9b0] text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4ec9b0]"></span>
                      Running (React Dev Server)
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      type="button"
                      onClick={onToggleWebPreview}
                      className="px-2 py-0.5 rounded bg-[#2a2d2e] hover:bg-[#333333] text-xs text-[#cccccc] hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1"
                    >
                      <span>Preview</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </td>
                </tr>

                <tr className="hover:bg-[#202020] transition-colors">
                  <td className="py-2.5 text-[#9cdcfe] font-bold">5173</td>
                  <td className="py-2.5 text-white">http://localhost:5173</td>
                  <td className="py-2.5 text-[#858585]">Local</td>
                  <td className="py-2.5">
                    <span className="inline-flex items-center gap-1 text-[#4ec9b0] text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4ec9b0]"></span>
                      Active (NextEra IDE)
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    <span className="text-[#858585] text-[11px]">Connected</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
};
