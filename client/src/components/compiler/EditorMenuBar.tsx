import React, { useState, useEffect, useRef } from 'react';
import {
  FolderPlus,
  FolderOpen,
  FilePlus,
  Plus,
  Save,
  Download,
  FolderArchive,
  Share2,
  RotateCcw,
  X,
  Undo,
  Redo,
  AlignLeft,
  Search,
  Copy,
  CheckSquare,
  Folder,
  GitBranch,
  Bot,
  Terminal,
  Globe,
  Maximize2,
  Play,
  Sparkles,
  Trash2,
  HelpCircle,
  Camera,
  Code2,
} from 'lucide-react';
import { cn } from '../../utils/cn';

export interface EditorMenuBarProps {
  onNewFile: () => void;
  onOpenFile?: () => void;
  onNewFolder: () => void;
  onOpenTemplates: () => void;
  onSaveFile: () => void;
  onDownloadFile: () => void;
  onExportZip: () => void;
  onShareProject: () => void;
  onResetFile: () => void;
  onCloseActiveTab: () => void;
  onFormatCode: () => void;
  onFindInFiles: () => void;
  onCopyCode: () => void;
  onToggleExplorer: () => void;
  onToggleSearch: () => void;
  onToggleGit: () => void;
  onToggleCopilot: () => void;
  onToggleTerminal: () => void;
  onNewTerminal?: () => void;
  onToggleWebPreview: () => void;
  onToggleWordWrap: () => void;
  onToggleFullscreen: () => void;
  onOpenCommandPalette: () => void;
  onRunCode: () => void;
  onFixWithAi: () => void;
  onGenerateTestCases: () => void;
  onClearTerminal: () => void;
  onOpenSnapshot: () => void;
  onOpenShortcutsHelp: () => void;
  wordWrap: boolean;
  hasCompilerError: boolean;
}

interface MenuItemDef {
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  action?: () => void;
  isSeparator?: boolean;
  highlight?: boolean;
  disabled?: boolean;
}

export const EditorMenuBar: React.FC<EditorMenuBarProps> = ({
  onNewFile,
  onOpenFile,
  onNewFolder,
  onOpenTemplates,
  onSaveFile,
  onDownloadFile,
  onExportZip,
  onShareProject,
  onResetFile,
  onCloseActiveTab,
  onFormatCode,
  onFindInFiles,
  onCopyCode,
  onToggleExplorer,
  onToggleSearch,
  onToggleGit,
  onToggleCopilot,
  onToggleTerminal,
  onNewTerminal,
  onToggleWebPreview,
  onToggleWordWrap,
  onToggleFullscreen,
  onOpenCommandPalette,
  onRunCode,
  onFixWithAi,
  onGenerateTestCases,
  onClearTerminal,
  onOpenSnapshot,
  onOpenShortcutsHelp,
  wordWrap,
  hasCompilerError,
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuBarRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveMenu(null);
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []);

  const handleMenuClick = (menuKey: string) => {
    setActiveMenu((prev) => (prev === menuKey ? null : menuKey));
  };

  const handleMenuHover = (menuKey: string) => {
    if (activeMenu !== null) {
      setActiveMenu(menuKey);
    }
  };

  const handleExecuteAction = (action?: () => void) => {
    setActiveMenu(null);
    if (action) action();
  };

  // 1. FILE MENU
  const fileItems: MenuItemDef[] = [
    { label: 'New File...', icon: <FilePlus className="w-3.5 h-3.5" />, shortcut: 'Ctrl+N', action: onNewFile },
    { label: 'Open File...', icon: <FolderOpen className="w-3.5 h-3.5 text-amber-400" />, shortcut: 'Ctrl+O', action: onOpenFile },
    { label: 'New Folder...', icon: <FolderPlus className="w-3.5 h-3.5" />, action: onNewFolder },
    { isSeparator: true, label: 'sep-1' },
    { label: 'Starter Templates...', icon: <Sparkles className="w-3.5 h-3.5 text-cyan-400" />, highlight: true, action: onOpenTemplates },
    { label: 'Save File', icon: <Save className="w-3.5 h-3.5" />, shortcut: 'Ctrl+S', action: onSaveFile },
    { isSeparator: true, label: 'sep-2' },
    { label: 'Download File', icon: <Download className="w-3.5 h-3.5" />, action: onDownloadFile },
    { label: 'Export Project as ZIP', icon: <FolderArchive className="w-3.5 h-3.5 text-emerald-400" />, action: onExportZip },
    { label: 'Share Project Link...', icon: <Share2 className="w-3.5 h-3.5 text-indigo-400" />, action: onShareProject },
    { isSeparator: true, label: 'sep-3' },
    { label: 'Reset File to Default', icon: <RotateCcw className="w-3.5 h-3.5 text-amber-400" />, action: onResetFile },
    { label: 'Close Active Tab', icon: <X className="w-3.5 h-3.5" />, shortcut: 'Ctrl+W', action: onCloseActiveTab },
  ];

  // 2. EDIT MENU
  const editItems: MenuItemDef[] = [
    { label: 'Undo', icon: <Undo className="w-3.5 h-3.5" />, shortcut: 'Ctrl+Z', action: () => document.execCommand('undo') },
    { label: 'Redo', icon: <Redo className="w-3.5 h-3.5" />, shortcut: 'Ctrl+Y', action: () => document.execCommand('redo') },
    { isSeparator: true, label: 'sep-1' },
    { label: 'Format Document', icon: <AlignLeft className="w-3.5 h-3.5 text-blue-400" />, shortcut: 'Shift+Alt+F', action: onFormatCode },
    { isSeparator: true, label: 'sep-2' },
    { label: 'Find in Files...', icon: <Search className="w-3.5 h-3.5" />, shortcut: 'Ctrl+F', action: onFindInFiles },
    { label: 'Copy All Code', icon: <Copy className="w-3.5 h-3.5" />, shortcut: 'Ctrl+A + C', action: onCopyCode },
  ];

  // 3. SELECTION MENU
  const selectionItems: MenuItemDef[] = [
    { label: 'Select All', icon: <CheckSquare className="w-3.5 h-3.5" />, shortcut: 'Ctrl+A', action: () => document.execCommand('selectAll') },
    { label: 'Format Code', icon: <AlignLeft className="w-3.5 h-3.5" />, shortcut: 'Shift+Alt+F', action: onFormatCode },
    { isSeparator: true, label: 'sep-1' },
    { label: 'Command Palette', icon: <Code2 className="w-3.5 h-3.5" />, shortcut: 'F1', action: onOpenCommandPalette },
  ];

  // 4. VIEW MENU
  const viewItems: MenuItemDef[] = [
    { label: 'File Explorer', icon: <Folder className="w-3.5 h-3.5 text-amber-400" />, shortcut: 'Ctrl+Shift+E', action: onToggleExplorer },
    { label: 'Search Workspace', icon: <Search className="w-3.5 h-3.5 text-cyan-400" />, shortcut: 'Ctrl+Shift+F', action: onToggleSearch },
    { label: 'Source Control (Git)', icon: <GitBranch className="w-3.5 h-3.5 text-orange-400" />, shortcut: 'Ctrl+Shift+G', action: onToggleGit },
    { label: 'Ask NEC AI', icon: <Bot className="w-3.5 h-3.5 text-amber-400" />, action: onToggleCopilot },
    { isSeparator: true, label: 'sep-1' },
    { label: 'Toggle Terminal', icon: <Terminal className="w-3.5 h-3.5 text-emerald-400" />, shortcut: 'Ctrl+`', action: onToggleTerminal },
    { label: 'Toggle Live Web Preview', icon: <Globe className="w-3.5 h-3.5 text-sky-400" />, action: onToggleWebPreview },
    { label: wordWrap ? 'Disable Word Wrap' : 'Enable Word Wrap', icon: <AlignLeft className="w-3.5 h-3.5" />, shortcut: 'Alt+Z', action: onToggleWordWrap },
    { label: 'Toggle Fullscreen', icon: <Maximize2 className="w-3.5 h-3.5" />, shortcut: 'F11', action: onToggleFullscreen },
    { isSeparator: true, label: 'sep-2' },
    { label: 'Command Palette...', icon: <Code2 className="w-3.5 h-3.5 text-brand-400" />, shortcut: 'Ctrl+P', action: onOpenCommandPalette },
  ];

  // 5. TERMINAL / RUN MENU
  const terminalItems: MenuItemDef[] = [
    { label: 'New Terminal', icon: <Plus className="w-3.5 h-3.5 text-emerald-400" />, shortcut: 'Ctrl+Shift+`', highlight: true, action: onNewTerminal },
    { label: 'Run Active File', icon: <Play className="w-3.5 h-3.5 text-emerald-400" />, shortcut: 'Ctrl+Enter', action: onRunCode },
    { label: 'Fix Error with AI Doctor', icon: <Bot className="w-3.5 h-3.5 text-purple-400" />, disabled: !hasCompilerError, action: onFixWithAi },
    { label: 'Generate Test Cases (AI)', icon: <Sparkles className="w-3.5 h-3.5 text-indigo-400" />, action: onGenerateTestCases },
    { isSeparator: true, label: 'sep-1' },
    { label: 'Clear Console Output', icon: <Trash2 className="w-3.5 h-3.5" />, action: onClearTerminal },
    { label: 'Toggle Terminal Drawer', icon: <Terminal className="w-3.5 h-3.5" />, shortcut: 'Ctrl+`', action: onToggleTerminal },
  ];

  // 6. HELP MENU
  const helpItems: MenuItemDef[] = [
    { label: 'Keyboard Shortcuts Reference', icon: <HelpCircle className="w-3.5 h-3.5 text-amber-400" />, shortcut: 'F1', action: onOpenShortcutsHelp },
    { label: 'Export Code Snapshot (Ray.so)', icon: <Camera className="w-3.5 h-3.5 text-pink-400" />, action: onOpenSnapshot },
    { label: 'Starter Projects Gallery', icon: <Sparkles className="w-3.5 h-3.5 text-cyan-400" />, action: onOpenTemplates },
    { isSeparator: true, label: 'sep-1' },
    { label: 'About NextEra IDE Pro v3.0', icon: <Code2 className="w-3.5 h-3.5 text-brand-400" />, action: () => alert('NextEra IDE Pro — Cloud Multi-file Compiler & Web Sandbox powered by NextEra Coders.') },
  ];

  const menuList = [
    { id: 'file', name: 'File', items: fileItems },
    { id: 'edit', name: 'Edit', items: editItems },
    { id: 'selection', name: 'Selection', items: selectionItems },
    { id: 'view', name: 'View', items: viewItems },
    { id: 'terminal', name: 'Terminal', items: terminalItems },
    { id: 'help', name: 'Help', items: helpItems },
  ];

  return (
    <div ref={menuBarRef} className="flex items-center text-xs font-mono select-none">
      {menuList.map((m) => {
        const isOpen = activeMenu === m.id;

        return (
          <div key={m.id} className="relative">
            <button
              type="button"
              onClick={() => handleMenuClick(m.id)}
              onMouseEnter={() => handleMenuHover(m.id)}
              className={cn(
                'px-2.5 py-1 rounded transition-colors cursor-pointer text-xs',
                isOpen
                  ? 'bg-[#333333] text-white font-medium'
                  : 'text-neutral-300 hover:text-white hover:bg-[#2a2a2a]'
              )}
            >
              {m.name}
            </button>

            {/* Dropdown Menu Container */}
            {isOpen && (
              <div className="absolute top-full left-0 mt-0.5 min-w-[240px] max-w-[320px] rounded-md bg-[#1f1f1f] border border-[#3c3c3c] shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 backdrop-blur-md">
                {m.items.map((item, idx) => {
                  if (item.isSeparator) {
                    return <div key={`sep-${idx}`} className="my-1 border-t border-[#333333]" />;
                  }

                  return (
                    <button
                      key={item.label}
                      type="button"
                      disabled={item.disabled}
                      onClick={() => handleExecuteAction(item.action)}
                      className={cn(
                        'w-full px-3 py-1.5 flex items-center justify-between text-left text-xs transition-colors cursor-pointer',
                        item.disabled
                          ? 'opacity-40 cursor-not-allowed text-neutral-500'
                          : 'hover:bg-[#04395e] hover:text-white text-neutral-200',
                        item.highlight && !item.disabled && 'text-cyan-300 font-medium'
                      )}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        {item.icon ? (
                          <span className="shrink-0">{item.icon}</span>
                        ) : (
                          <span className="w-3.5 shrink-0" />
                        )}
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.shortcut && (
                        <span className="text-[10px] text-neutral-400 font-mono tracking-wider ml-4 shrink-0">
                          {item.shortcut}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
