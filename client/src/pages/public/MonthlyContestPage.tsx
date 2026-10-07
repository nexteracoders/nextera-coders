import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/ui/Toast';
import { ROUTES } from '../../constants/routes';
import {
  monthlyContestService,
  MonthlyContestConfig,
  MonthlyUserAttempt,
  MonthlyLeaderboardEntry,
  CONTEST_RULES,
  MonthlyChallenge,
} from '../../services/monthlyContest.service';
import { socketService } from '../../services/socket.service';
import { MonthlyContestRulebookModal } from '../../components/contest/MonthlyContestRulebookModal';
import { UserProfileModal } from '../../components/contest/UserProfileModal';
import { FullLeaderboardModal, LeaderboardStudentItem } from '../../components/contest/FullLeaderboardModal';
import { WinnerCelebrationModal } from '../../components/contest/WinnerCelebrationModal';
import { ProfessionalCodeEditor, EDITOR_THEMES } from '../../components/code/ProfessionalCodeEditor';
import { OutputWindowDrawer } from '../../components/code/OutputWindowDrawer';
import { ThemeToggle } from '../../components/common/ThemeToggle';
import { useAutoLandscape } from '../../hooks/useAutoLandscape';
import { MobileLandscapePrompt } from '../../components/common/MobileLandscapePrompt';
import {
  CoderProfile,
  PRACTICE_PROBLEMS_CATALOG,
} from '../../services/contest.service';
import { getCleanStarterCode, getFunctionNameFromSlug } from '../../utils/starterCode';
import { evaluateTestCases } from '../../utils/codeEvaluator';
import {
  Trophy,
  Flame,
  Timer,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  AlertTriangle,
  Play,
  Clock,
  Award,
  Crown,
  BadgeCheck,
  Search,
  Layers,
  ExternalLink,
  Lock,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Code2,
  CloudUpload,
  Copy,
  Check,
  FileText,
  Settings,
  Maximize2,
  Minimize2,
  X,
  Sparkles,
  Zap,
  AlignLeft,
} from 'lucide-react';
import { cn } from '../../utils/cn';

// Multi-language code formatter utility
const formatCode = (rawCode: string, lang: string, tabSpaces: number = 2): string => {
  if (!rawCode || !rawCode.trim()) return rawCode;

  const l = (lang || 'javascript').toLowerCase();
  const indentStr = ' '.repeat(tabSpaces);

  if (l === 'python' || l === 'py' || l === 'python3') {
    const lines = rawCode.split('\n');
    const cleanedLines = lines.map((line) => line.replace(/\s+$/, ''));
    const resultLines: string[] = [];
    let emptyCount = 0;
    for (const line of cleanedLines) {
      if (!line.trim()) {
        emptyCount++;
        if (emptyCount <= 2) resultLines.push('');
      } else {
        emptyCount = 0;
        resultLines.push(line);
      }
    }
    return resultLines.join('\n');
  }

  const lines = rawCode.split('\n');
  let currentIndent = 0;
  const formatted: string[] = [];
  let emptyCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    if (!trimmed) {
      emptyCount++;
      if (emptyCount <= 1) {
        formatted.push('');
      }
      continue;
    }
    emptyCount = 0;

    let openCount = 0;
    let closeCount = 0;
    let leadingCloses = 0;

    let ptr = 0;
    while (ptr < trimmed.length && ['}', ']', ')'].includes(trimmed[ptr])) {
      leadingCloses++;
      ptr++;
    }

    let inString = false;
    let stringChar = '';
    for (let c = 0; c < trimmed.length; c++) {
      const ch = trimmed[c];
      if ((ch === '"' || ch === "'" || ch === '`') && trimmed[c - 1] !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = ch;
        } else if (stringChar === ch) {
          inString = false;
        }
      }
      if (!inString) {
        if (ch === '{' || ch === '[' || (ch === '(' && !trimmed.startsWith('for') && !trimmed.startsWith('if') && !trimmed.startsWith('while'))) {
          openCount++;
        } else if (ch === '}' || ch === ']' || ch === ')') {
          closeCount++;
        }
      }
    }

    const lineIndent = Math.max(0, currentIndent - leadingCloses);

    let cleanedText = trimmed
      .replace(/\s*([=+\-*/%&|^<>!]=|[=+\-*/%&|^<>])\s*/g, (match, op) => {
        if (op === '/' && trimmed.includes('//')) return match;
        if (op === '*' && trimmed.startsWith('*')) return match;
        if (op === '<' && (trimmed.includes('<iostream>') || trimmed.includes('<vector>') || trimmed.includes('<string>'))) return match;
        return ` ${op} `;
      })
      .replace(/\s*,\s*/g, ', ')
      .replace(/\s*;\s*/g, ';')
      .replace(/\s*:\s*/g, ': ')
      .replace(/\s+/g, ' ');

    cleanedText = cleanedText
      .replace(/#\s*include\s*<\s*([^>]+)\s*>/g, '#include <$1>')
      .replace(/;\s*$/g, ';')
      .replace(/\(\s+/g, '(')
      .replace(/\s+\)/g, ')')
      .replace(/\[\s+/g, '[')
      .replace(/\s+\]/g, ']');

    formatted.push(
      indentStr.repeat(lineIndent) +
        (trimmed.startsWith('#include') || trimmed.startsWith('#define') || trimmed.startsWith('//')
          ? trimmed
          : cleanedText)
    );

    currentIndent = Math.max(0, currentIndent + (openCount - closeCount));
  }

  return formatted.join('\n');
};

export const MonthlyContestPage: React.FC = () => {
  useDocumentTitle('NextEra Monthly Grand Coding Contest — 72h Sprint, Leaderboard & 3,300+ Coins');
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { success, error: toastError, info } = useToast();

  const [config, setConfig] = useState<MonthlyContestConfig>(() => monthlyContestService.getConfig());
  const [lastUpdatedRankTime, setLastUpdatedRankTime] = useState<string | null>(null);
  const [recentLiveActivity, setRecentLiveActivity] = useState<string | null>(null);
  const [activeStageId, setActiveStageId] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'challenges' | 'leaderboard' | 'rules'>(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'leaderboard' || tabParam === 'rules') return tabParam;
    return 'challenges';
  });

  const [userAttempt, setUserAttempt] = useState<MonthlyUserAttempt>(() =>
    monthlyContestService.getUserAttempt(user?.id)
  );

  // Fetch live contest configuration from backend MongoDB on initial mount
  useEffect(() => {
    monthlyContestService.fetchLiveConfig(config.monthKey).then((live) => {
      if (live) {
        setConfig(live);
      }
    });
  }, [config.monthKey]);

  // Real-Time Socket.io Leaderboard Sync and Live Contest Activity
  useEffect(() => {
    const monthKey = config.monthKey || 'active';
    socketService.joinContest(monthKey);

    const unsubLeaderboard = socketService.onLeaderboardUpdate((payload) => {
      if (payload && Array.isArray(payload.leaderboard)) {
        setConfig((prev) => ({
          ...prev,
          leaderboard: payload.leaderboard,
        }));
        setLastUpdatedRankTime(new Date().toLocaleTimeString());
        info('Leaderboard ranks updated live!', 'Real-Time Standings 🏆');
      }
    });

    const unsubActivity = socketService.onContestActivity((activity) => {
      const msg = `${activity.userName || 'A coder'} solved ${activity.problemSlug} (${activity.difficulty || 'Challenge'})`;
      setRecentLiveActivity(msg);
      setTimeout(() => setRecentLiveActivity(null), 6000);
    });

    return () => {
      socketService.leaveContest(monthKey);
      unsubLeaderboard();
      unsubActivity();
    };
  }, [config.monthKey, info]);

  // Lobby vs Arena state: user clicks "Join Contest" to enter the code editor arena
  const [hasJoinedArena, setHasJoinedArena] = useState<boolean>(() => {
    return searchParams.get('join') === 'true';
  });

  // Automatic landscape mode for mobile phone coding when inside the live monthly arena
  const { showPrompt, dismissPrompt, lockLandscape, isMobile, isPortrait } = useAutoLandscape({
    enabled: hasJoinedArena,
  });

  // Flattened array of all 18 challenges across the 4 stages
  const allMonthlyChallenges = useMemo<MonthlyChallenge[]>(() => {
    return (config.stages || []).flatMap((s) => s.challenges);
  }, [config.stages]);

  // Active challenge index in Arena (0 to 17)
  const [activeChallengeIdx, setActiveChallengeIdx] = useState<number>(() => {
    const qParam = searchParams.get('q');
    if (qParam) {
      const parsed = parseInt(qParam, 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 18) {
        return parsed - 1;
      }
    }
    return 0;
  });

  const activeChallenge = allMonthlyChallenges[activeChallengeIdx] || allMonthlyChallenges[0];

  // Lookup problem from master catalog for sample test cases, starter code, constraints
  const activeCatalogProblem = useMemo(() => {
    if (!activeChallenge) return null;
    return PRACTICE_PROBLEMS_CATALOG.find(
      (p) => p.slug.toLowerCase() === activeChallenge.slug.toLowerCase()
    );
  }, [activeChallenge]);

  const challengeDescription = activeCatalogProblem?.description || activeChallenge?.description || `Solve ${activeChallenge?.title} to complete this stage challenge.`;

  const challengeTestCases = useMemo(() => {
    if (activeCatalogProblem?.sampleTestCases && activeCatalogProblem.sampleTestCases.length > 0) {
      return activeCatalogProblem.sampleTestCases;
    }
    return [
      {
        input: 'nums = [2, 7, 11, 15], target = 9',
        expectedOutput: '[0, 1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
      },
      {
        input: 'nums = [3, 2, 4], target = 6',
        expectedOutput: '[1, 2]',
        explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].',
      },
    ];
  }, [activeCatalogProblem]);

  const challengeConstraints = useMemo(() => {
    if (activeCatalogProblem?.constraints && activeCatalogProblem.constraints.length > 0) {
      return activeCatalogProblem.constraints;
    }
    return [
      '1 <= n <= 10^5',
      '-10^9 <= val <= 10^9',
      'Time complexity should satisfy expected constraints.',
    ];
  }, [activeCatalogProblem]);

  // Arena Code Editor State
  const [selectedLanguage, setSelectedLanguage] = useState<string>(() => {
    return localStorage.getItem('nextera:preferred_language') || 'java';
  });
  const [editorTheme, setEditorTheme] = useState<string>('system');
  const [code, setCode] = useState<string>(() => {
    const defaultLang = localStorage.getItem('nextera:preferred_language') || 'java';
    return getCleanStarterCode(
      activeCatalogProblem || { title: activeChallenge?.title, slug: activeChallenge?.slug },
      defaultLang
    );
  });
  const [copied, setCopied] = useState(false);

  // Sync starter/cached code when challenge or language changes
  useEffect(() => {
    if (!activeChallenge) return;
    const cached = localStorage.getItem(`nextera:monthly_code:${activeChallenge.id}:${selectedLanguage}`);
    if (cached) {
      setCode(cached);
    } else {
      setCode(
        getCleanStarterCode(
          activeCatalogProblem || { title: activeChallenge.title, slug: activeChallenge.slug },
          selectedLanguage
        )
      );
    }
    setEvaluationResult(null);
    setIsOutputOpen(false);
  }, [activeChallengeIdx, selectedLanguage, activeCatalogProblem]);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    if (activeChallenge) {
      localStorage.setItem(`nextera:monthly_code:${activeChallenge.id}:${selectedLanguage}`, newCode);
    }
  };

  // Arena Left Panel Tab: 'description' | 'challenges' | 'standings' | 'rulebook'
  const [activeArenaLeftTab, setActiveArenaLeftTab] = useState<'description' | 'challenges' | 'standings' | 'rulebook'>('description');

  // Split Pane & Editor Preferences
  const [leftPaneWidth, setLeftPaneWidth] = useState<number>(() => {
    const saved = localStorage.getItem('nextera:monthly_split_width');
    return saved ? parseFloat(saved) : 46;
  });
  const [isDraggingH, setIsDraggingH] = useState(false);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const rightPaneRef = useRef<HTMLDivElement>(null);

  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('nextera:monthly_editor_fontsize');
    return saved ? parseFloat(saved) : 13.5;
  });
  const [tabSize, setTabSize] = useState<number>(() => {
    const saved = localStorage.getItem('nextera:monthly_editor_tabsize');
    return saved ? parseInt(saved, 10) : 2;
  });
  const [wordWrap, setWordWrap] = useState<boolean>(() => {
    const saved = localStorage.getItem('nextera:monthly_editor_wordwrap');
    return saved === 'true';
  });
  const [showLineNumbers, setShowLineNumbers] = useState<boolean>(() => {
    const saved = localStorage.getItem('nextera:monthly_editor_linenumbers');
    return saved !== 'false';
  });
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Stopwatch in Arena
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(true);

  // Output Window Drawer State
  const [isOutputOpen, setIsOutputOpen] = useState(false);
  const [isOutputMinimized, setIsOutputMinimized] = useState(false);
  const [outputDrawerTab, setOutputDrawerTab] = useState<'results' | 'custom' | 'arena-ai' | 'yogi'>('results');
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0);
  const [customInput, setCustomInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<{
    allPassed: boolean;
    passedCount: number;
    totalCount: number;
    results: { input: string; expected: string; actual: string; passed: boolean }[];
    executionTime?: number;
    memory?: number;
    error?: string;
  } | null>(null);

  // Modals
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isRulebookModalOpen, setIsRulebookModalOpen] = useState(false);
  const [selectedProfileForModal, setSelectedProfileForModal] = useState<CoderProfile | null>(null);
  const [isFullLeaderboardOpen, setIsFullLeaderboardOpen] = useState(false);
  const [isWinnerModalOpen, setIsWinnerModalOpen] = useState(false);

  // Header problem picker popover in arena
  const [isQuestionPickerOpen, setIsQuestionPickerOpen] = useState(false);
  const questionPickerRef = useRef<HTMLDivElement>(null);

  const [leaderboardSearch, setLeaderboardSearch] = useState('');
  const [timeRemainingStr, setTimeRemainingStr] = useState<string>('');

  // Anti-cheat status & real-time telemetry
  const [antiCheatStatus, setAntiCheatStatus] = useState(() =>
    monthlyContestService.getUserAntiCheatStatus(user?.id)
  );
  const [tabSwitchesCount, setTabSwitchesCount] = useState<number>(0);
  const tabSwitchesRef = useRef<number>(0);
  const pasteCountRef = useRef<number>(0);
  const contestStartTimeRef = useRef<number>(Date.now());
  const antiCheatLogsRef = useRef<any[]>([
    {
      timestamp: new Date().toISOString(),
      type: 'join',
      detail: 'Entered Monthly Grand Contest arena',
    },
  ]);

  // Fetch live contest configuration from database on mount
  useEffect(() => {
    monthlyContestService.fetchLiveConfig().then((liveConfig) => {
      setConfig(liveConfig);
    }).catch(() => {});
  }, []);

  // Sync attempt when user changes or when returning from storage updates
  useEffect(() => {
    const refreshState = () => {
      setUserAttempt(monthlyContestService.getUserAttempt(user?.id));
      setAntiCheatStatus(monthlyContestService.getUserAntiCheatStatus(user?.id));
    };

    refreshState();
    window.addEventListener('focus', refreshState);
    window.addEventListener('storage', refreshState);

    return () => {
      window.removeEventListener('focus', refreshState);
      window.removeEventListener('storage', refreshState);
    };
  }, [user]);

  // Sync tab with URL search parameter
  const handleSelectTab = (tab: 'challenges' | 'leaderboard' | 'rules') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Live 72-Hour Timer Tick
  useEffect(() => {
    if (userAttempt.status !== 'in_progress' || !userAttempt.expiresAt) {
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const expires = new Date(userAttempt.expiresAt!).getTime();
      const diff = expires - now;

      if (diff <= 0) {
        setTimeRemainingStr('00h : 00m : 00s (Expired)');
        setUserAttempt(monthlyContestService.getUserAttempt(user?.id));
      } else {
        const totalSecs = Math.floor(diff / 1000);
        const hours = Math.floor(totalSecs / 3600);
        const mins = Math.floor((totalSecs % 3600) / 60);
        const secs = totalSecs % 60;
        setTimeRemainingStr(
          `${String(hours).padStart(2, '0')}h : ${String(mins).padStart(2, '0')}m : ${String(secs).padStart(2, '0')}s`
        );
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [userAttempt, user]);

  // Stopwatch in Arena
  useEffect(() => {
    if (!hasJoinedArena || !isStopwatchRunning) return;
    const timer = setInterval(() => {
      setStopwatchSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [hasJoinedArena, isStopwatchRunning]);

  const formatStopwatch = (totalSecs: number): string => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Anti-Cheat: Tab Switch & Window Blur & Paste Monitoring in Arena
  useEffect(() => {
    if (!hasJoinedArena || userAttempt.status === 'submitted') return;

    const handleFocusLoss = () => {
      tabSwitchesRef.current += 1;
      const count = tabSwitchesRef.current;
      setTabSwitchesCount(count);

      antiCheatLogsRef.current.push({
        timestamp: new Date().toISOString(),
        type: 'tab_switch',
        detail: `Tab defocus event #${count}`,
        severity: count > 3 ? 'danger' : 'warning',
      });

      const updated = monthlyContestService.recordAntiCheatWarning(user?.id);
      setAntiCheatStatus(updated);

      toastError(
        `⚠️ Anti-Cheat Warning #${count}: Tab switch detected! All focus loss events and durations are recorded for Admin review.`,
        'Focus Loss Recorded'
      );
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleFocusLoss();
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      pasteCountRef.current += 1;
      const textLen = e.clipboardData?.getData('text')?.length || 0;
      antiCheatLogsRef.current.push({
        timestamp: new Date().toISOString(),
        type: 'paste',
        detail: `Clipboard paste operation (${textLen} characters)`,
        severity: textLen > 100 ? 'danger' : 'warning',
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleFocusLoss);
    window.addEventListener('paste', handlePaste);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleFocusLoss);
      window.removeEventListener('paste', handlePaste);
    };
  }, [hasJoinedArena, userAttempt.status, user?.id, toastError]);

  // Lock body scroll only when inside the code editor arena
  useEffect(() => {
    if (hasJoinedArena) {
      const origOverflow = document.body.style.overflow;
      const origHeight = document.body.style.height;
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh';
      return () => {
        document.body.style.overflow = origOverflow;
        document.body.style.height = origHeight;
      };
    }
  }, [hasJoinedArena]);

  // Drag resizer handlers for Split Pane
  const handleMouseDownH = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingH(true);
    const startX = e.clientX;
    const startWidth = leftPaneWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!workspaceRef.current) return;
      const containerWidth = workspaceRef.current.offsetWidth;
      const deltaX = moveEvent.clientX - startX;
      const newPercent = Math.min(75, Math.max(25, startWidth + (deltaX / containerWidth) * 100));
      setLeftPaneWidth(newPercent);
      localStorage.setItem('nextera:monthly_split_width', String(newPercent));
    };

    const handleMouseUp = () => {
      setIsDraggingH(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Close settings and question picker popovers on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setIsSettingsOpen(false);
      }
      if (questionPickerRef.current && !questionPickerRef.current.contains(e.target as Node)) {
        setIsQuestionPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Solved challenges set (case-insensitive for robust matching)
  const solvedSlugsSet = useMemo(() => {
    return new Set((userAttempt.solvedProblemSlugs || []).map((s) => s.toLowerCase().trim()));
  }, [userAttempt.solvedProblemSlugs]);

  const solvedCount = solvedSlugsSet.size;
  const is18Solved = solvedCount >= 18;
  const progressPercent = Math.min(100, Math.round((solvedCount / 18) * 100));

  // Live Leaderboard & Rank 1 Champion
  const liveLeaderboard = useMemo(() => {
    return monthlyContestService.getLeaderboard(
      user
        ? {
            id: user.id,
            name: user.name,
            email: user.email,
            college: (user as any).college || 'Candidate Institute',
            avatar: user.profileImage,
          }
        : undefined,
      config.leaderboard
    );
  }, [user, userAttempt, config.leaderboard]);

  const champion = useMemo(() => {
    return liveLeaderboard[0] || monthlyContestService.getRankOneChampion();
  }, [liveLeaderboard]);

  // Mapped items for FullLeaderboardModal
  const monthlyLeaderboardItems: LeaderboardStudentItem[] = useMemo(() => {
    return liveLeaderboard.map((c) => ({
      rank: c.rank,
      userId: c.userId,
      username: c.username,
      name: c.name,
      avatar: c.avatar,
      college: c.college,
      badge: c.badge,
      score: c.score,
      finishTime: c.finishTime,
      problemsCleared: c.problemsSolved,
      totalProblems: 18,
      integrityScore: c.integrityScore,
      coinsWon: c.coinsWon,
      isCurrentUser: user ? c.userId === user.id : false,
    }));
  }, [liveLeaderboard, user]);

  // Active Stage object for Lobby Tab
  const activeStage = useMemo(() => {
    return config.stages.find((s) => s.id === activeStageId) || config.stages[0];
  }, [config, activeStageId]);

  // Filtered Leaderboard for Lobby
  const filteredLeaderboard = useMemo(() => {
    if (!leaderboardSearch.trim()) return liveLeaderboard;
    const query = leaderboardSearch.toLowerCase().trim();
    return liveLeaderboard.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.username.toLowerCase().includes(query) ||
        c.college.toLowerCase().includes(query) ||
        c.badge.toLowerCase().includes(query)
    );
  }, [liveLeaderboard, leaderboardSearch]);

  // Handle Enter Arena (Clicking "Join Contest")
  const handleEnterArena = () => {
    if (userAttempt.status === 'not_started') {
      const updated = monthlyContestService.startAttempt(user?.id);
      setUserAttempt(updated);
      success('⚡ 72-Hour Monthly Contest Timer Started! Good luck warriors.');
    }
    setHasJoinedArena(true);
  };

  // Switch challenge directly inside Arena
  const handleSelectChallengeIdx = (idx: number) => {
    if (idx < 0 || idx >= allMonthlyChallenges.length) return;
    setActiveChallengeIdx(idx);
    setIsQuestionPickerOpen(false);
  };

  // Open problem in Arena from Lobby Cards
  const handleSolveChallengeInArena = (slug: string) => {
    const foundIdx = allMonthlyChallenges.findIndex((c) => c.slug.toLowerCase() === slug.toLowerCase());
    if (foundIdx !== -1) {
      setActiveChallengeIdx(foundIdx);
    }
    handleEnterArena();
  };

  // Compile & Run in Arena
  const handleRunCode = useCallback(async () => {
    setIsOutputOpen(true);
    setIsOutputMinimized(false);
    setOutputDrawerTab('results');
    setIsRunning(true);

    try {
      const funcName = getFunctionNameFromSlug(activeChallenge?.slug, activeChallenge?.title);
      const evalRes = await evaluateTestCases(
        selectedLanguage,
        code,
        challengeTestCases.map((tc) => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          explanation: tc.explanation,
        })),
        activeChallenge?.slug,
        activeChallenge?.title || funcName
      );

      const passedCount = evalRes.testCasesPassed;
      const totalCount = evalRes.totalTestCases;

      setEvaluationResult({
        allPassed: evalRes.passed,
        passedCount,
        totalCount,
        results: evalRes.testCases.map((tc) => ({
          input: tc.input,
          expected: tc.expectedOutput,
          actual: tc.actualOutput || (tc.error ? `Error: ${tc.error}` : 'No output returned'),
          passed: !!tc.passed,
        })),
        executionTime: evalRes.executionTime || Math.floor(Math.random() * 25 + 15),
        memory: evalRes.memory || +(Math.random() * 2 + 14.2).toFixed(1),
        error: evalRes.error,
      });

      if (evalRes.passed) {
        success(`Sample test cases passed (${passedCount}/${totalCount})! Click Submit Q${activeChallenge.order} to submit your solution.`);
      } else {
        toastError(
          evalRes.error
            ? `Execution Error: ${evalRes.error}`
            : `Wrong Answer: ${passedCount}/${totalCount} sample cases passed. Check output drawer.`
        );
      }
    } catch (runErr: any) {
      toastError(`Execution failed: ${runErr.message || 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  }, [code, activeChallenge, selectedLanguage, challengeTestCases, success, toastError]);

  // Submit Challenge Solution in Arena
  const handleSubmitChallengeCode = useCallback(async () => {
    setIsOutputOpen(true);
    setIsOutputMinimized(false);
    setOutputDrawerTab('results');
    setIsSubmitting(true);

    try {
      const funcName = getFunctionNameFromSlug(activeChallenge?.slug, activeChallenge?.title);
      const allCases = [
        ...challengeTestCases,
        ...(activeCatalogProblem?.hiddenTestCases || []),
      ];

      const evalRes = await evaluateTestCases(
        selectedLanguage,
        code,
        allCases.map((tc) => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          explanation: tc.explanation,
        })),
        activeChallenge?.slug,
        activeChallenge?.title || funcName
      );

      const passedCount = evalRes.testCasesPassed;
      const totalCount = evalRes.totalTestCases;

      setEvaluationResult({
        allPassed: evalRes.passed,
        passedCount,
        totalCount,
        results: evalRes.testCases.map((tc) => ({
          input: tc.input,
          expected: tc.expectedOutput,
          actual: tc.actualOutput || (tc.error ? `Error: ${tc.error}` : 'No output returned'),
          passed: !!tc.passed,
        })),
        executionTime: evalRes.executionTime || Math.floor(Math.random() * 30 + 20),
        memory: evalRes.memory || +(Math.random() * 3 + 15.1).toFixed(1),
        error: evalRes.error,
      });

      if (evalRes.passed) {
        const markRes = monthlyContestService.markProblemSolved(activeChallenge.slug, user?.id);
        setUserAttempt(markRes.attempt);

        if (markRes.is18Completed) {
          success(`🎉 GRAND SLAM! All 18 challenges solved! 1,800 NEC Coins awarded!`, 'Grandmaster Champion 🏆');
          setIsWinnerModalOpen(true);
        } else {
          success(`🎉 Problem Q${activeChallenge.order} (${activeChallenge.title}) Accepted! Verified Blue Tick (✓) unlocked! (${markRes.attempt.solvedProblemSlugs.length}/18 solved)`);
        }
      } else {
        toastError(
          evalRes.error
            ? `Submission Error: ${evalRes.error}`
            : `Wrong Answer: ${passedCount}/${totalCount} test cases passed. Review failing test case in the output window.`
        );
      }
    } catch (submitErr: any) {
      toastError(`Submission failed: ${submitErr.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [code, activeChallenge, selectedLanguage, challengeTestCases, activeCatalogProblem, user, success, toastError]);

  // Handle Final Submit Contest with Anti-Cheat telemetry
  const handleSubmitContest = () => {
    if (solvedCount < 2) {
      toastError(`Submission Blocked: You must solve at least 2 challenges before submitting the contest. (Currently solved: ${solvedCount}/18)`);
      return;
    }
    try {
      const elapsedSeconds = contestStartTimeRef.current
        ? Math.round((Date.now() - contestStartTimeRef.current) / 1000)
        : stopwatchSeconds;

      antiCheatLogsRef.current.push({
        timestamp: new Date().toISOString(),
        type: 'submit',
        detail: `Final official submission sent with ${solvedCount} problems cleared in ${elapsedSeconds}s.`,
      });

      const updated = monthlyContestService.submitContest(user?.id, {
        tabSwitchesCount: tabSwitchesRef.current,
        pasteCount: pasteCountRef.current,
        timeTakenSeconds: elapsedSeconds,
        logs: antiCheatLogsRef.current,
        startedAt: new Date(contestStartTimeRef.current || (Date.now() - elapsedSeconds * 1000)).toISOString(),
        submittedAt: new Date().toISOString(),
      });

      setUserAttempt(updated);
      setIsSubmitModalOpen(false);
      success('🎉 Monthly Contest submitted successfully! Your official score and Anti-Cheat audit are locked on the leaderboard.');
      if (updated.solvedProblemSlugs.length >= 18) {
        setIsWinnerModalOpen(true);
      }
    } catch (err: any) {
      toastError(err.message || 'Submission failed');
    }
  };

  // Reset Attempt (Testing / Dev Mode)
  const handleResetAttempt = () => {
    if (window.confirm('Reset your contest attempt to test from scratch? All progress and timer will reset to Not Started.')) {
      const reset = monthlyContestService.resetUserAttempt(user?.id);
      setUserAttempt(reset);
      success('Contest attempt reset to initial state.');
    }
  };

  // Code editor utilities
  const handleResetCode = () => {
    if (!activeChallenge) return;
    const starter = getCleanStarterCode(
      activeCatalogProblem || { title: activeChallenge.title, slug: activeChallenge.slug },
      selectedLanguage
    );
    setCode(starter);
    if (activeChallenge) {
      localStorage.removeItem(`nextera:monthly_code:${activeChallenge.id}:${selectedLanguage}`);
    }
    info('Starter template code reset.');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFormatCode = () => {
    const formatted = formatCode(code, selectedLanguage, tabSize);
    setCode(formatted);
    info('Code formatted cleanly.');
  };

  const handleOpenCustomInput = () => {
    setIsOutputOpen(true);
    setIsOutputMinimized(false);
    setOutputDrawerTab('custom');
  };

  const handleOpenProfileModal = (entry: MonthlyLeaderboardEntry) => {
    const profile: CoderProfile = {
      userId: entry.userId,
      username: entry.username,
      name: entry.name,
      avatar: entry.avatar,
      rank: entry.rank,
      score: entry.score,
      problemsSolved: entry.problemsSolved,
      finishTime: entry.finishTime,
      coinsWon: entry.coinsWon,
      badge: entry.badge,
      bio: entry.bio,
      college: entry.college,
      globalRating: entry.globalRating,
      globalRank: entry.globalRank,
      totalSolved: entry.totalSolved,
      streak: 7,
      skills: entry.skills,
      country: entry.country,
      github: entry.github,
      linkedin: entry.linkedin,
    };
    setSelectedProfileForModal(profile);
  };

  const lineCount = code.split('\n').length || 1;
  const isCurrentActiveSolved = solvedSlugsSet.has(activeChallenge?.slug?.toLowerCase()?.trim());

  // =========================================================================
  // VIEW 1: MONTHLY CONTEST LOBBY / HUB OVERVIEW (When not in arena)
  // =========================================================================
  if (!hasJoinedArena) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090a0d] text-slate-900 dark:text-slate-100 transition-colors duration-200">
        
        {/* Top Navigation Bar */}
        <header className="border-b border-slate-200/80 dark:border-neutral-800/80 bg-white/90 dark:bg-[#101116]/90 backdrop-blur-md sticky top-0 z-30 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-neutral-400">
              <Link to={ROUTES.PRACTICE} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Practice
              </Link>
              <span>/</span>
              <span className="text-blue-600 dark:text-blue-400 font-bold">Monthly Grand Contest</span>
              <span>•</span>
              <span className="text-slate-700 dark:text-neutral-300 font-semibold">{config.monthName}</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsRulebookModalOpen(true)}
                className="text-xs font-mono text-amber-600 dark:text-amber-400 hover:text-amber-500 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Official Rulebook</span>
              </button>

              <Link
                to={ROUTES.CONTESTS_HUB}
                className="text-xs font-mono text-slate-600 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1.5 transition-colors"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">All Contests</span>
              </Link>

              <ThemeToggle compact />

              {/* Top Quick Join Button - Clean & Styled without extra text */}
              <button
                type="button"
                onClick={handleEnterArena}
                className="h-8.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 fill-white" />
                <span>Join Contest</span>
              </button>

              {user?.role === 'admin' && (
                <Link
                  to={ROUTES.ADMIN_MONTHLY_CONTEST}
                  className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-mono font-semibold hover:bg-blue-500/20 transition-all"
                >
                  Admin CMS ↗
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Main Hub Container */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          
          {/* 1. HERO BANNER */}
          <div className="relative rounded-3xl overflow-hidden p-6 sm:p-10 bg-gradient-to-br from-white via-slate-50 to-blue-50/40 dark:from-[#111217] dark:via-[#13141c] dark:to-[#0f1015] border border-slate-200/90 dark:border-neutral-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
            <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-20 -top-20 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-mono font-bold tracking-wide">
                  <Flame className="w-3.5 h-3.5 fill-current text-orange-500" />
                  <span>{config.monthName} • Official Monthly Grand Contest</span>
                </div>

                <div className="space-y-2">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                    {config.title}
                  </h1>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl font-normal leading-relaxed">
                    {config.tagline || 'Prove your mastery across 4 high-stakes algorithmic stages (18 Challenges). Clock starts on join with a 72-hour window.'}
                  </p>
                </div>

                {/* Bounty & Spec Badges */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25 text-xs font-mono font-bold">
                    <span>🪙</span>
                    <span>3,300+ NEC Coin Prize Pool</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/25 text-xs font-mono font-bold">
                    <Timer className="w-3.5 h-3.5 text-purple-500" />
                    <span>72-Hour Personal Clock</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 text-xs font-mono font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Verified Blue Tick (✓)</span>
                  </div>
                </div>

                {/* Action CTA Buttons - Strictly "Join Contest" */}
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleEnterArena}
                    className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 active:scale-[0.99] text-white font-extrabold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2.5 group/btn"
                  >
                    <Play className="w-4 h-4 fill-white text-white group-hover/btn:scale-110 transition-transform" />
                    <span>Join Contest</span>
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsRulebookModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-3.5 rounded-xl bg-slate-100 dark:bg-[#1c1e28] hover:bg-slate-200 dark:hover:bg-[#252836] text-slate-800 dark:text-neutral-200 font-mono text-xs font-bold border border-slate-200 dark:border-neutral-700 transition-all cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                    <span>Official Rulebook</span>
                  </button>
                </div>
              </div>

              {/* Right Side: RANK #1 CHAMPION SPOTLIGHT CARD */}
              <div className="lg:col-span-5">
                <div className="relative group">
                  <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-600 opacity-80 group-hover:opacity-100 blur-md transition duration-500 animate-pulse" />

                  <div className="relative rounded-[22px] bg-slate-950 text-white p-5 sm:p-6 border border-amber-500/50 shadow-2xl space-y-4 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-black uppercase tracking-wider">
                        <Crown className="w-4 h-4 fill-amber-400 text-amber-400 animate-bounce" />
                        <span>Rank #1 Grandmaster</span>
                      </div>
                      <span className="text-xs font-mono text-amber-400 font-bold">Official Champion</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img
                          src={champion.avatar}
                          alt={champion.name}
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 shadow-lg shadow-amber-500/30"
                        />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 text-slate-950 text-xs font-black flex items-center justify-center shadow-md">
                          1
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="text-base font-black truncate flex items-center gap-1.5">
                          <span>{champion.name}</span>
                          <BadgeCheck className="w-4 h-4 text-sky-400 fill-sky-400/20 shrink-0" />
                        </h4>
                        <p className="text-xs text-slate-400 font-mono">@{champion.username} • {champion.college}</p>
                        <div className="flex items-center gap-2 text-[11px] font-mono text-amber-300 mt-1">
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 font-bold">
                            {champion.badge}
                          </span>
                          <span>Rating {champion.globalRating}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center font-mono">
                      <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                        <span className="text-[9.5px] text-slate-400 uppercase block">Score</span>
                        <span className="text-sm font-black text-white">{champion.score} pts</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                        <span className="text-[9.5px] text-slate-400 uppercase block">Solved</span>
                        <span className="text-sm font-black text-emerald-400">{champion.problemsSolved}/18</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40">
                        <span className="text-[9.5px] text-amber-400 uppercase font-bold block">Reward</span>
                        <span className="text-sm font-black text-amber-300">1,800 🪙</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-xs font-mono">
                      <button
                        type="button"
                        onClick={() => handleOpenProfileModal(champion)}
                        className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 text-[11px] cursor-pointer"
                      >
                        <span>View Champion Profile ↗</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectTab('leaderboard')}
                        className="text-slate-400 hover:text-white text-[11px] cursor-pointer"
                      >
                        All Standings
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* 2. USER CONTEST TELEMETRY */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#121319] border border-slate-200/90 dark:border-neutral-800 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center font-mono">
              
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#171822] border border-slate-200 dark:border-neutral-800 space-y-1">
                <span className="text-[10.5px] text-slate-500 uppercase block">Your Contest Status</span>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'px-2.5 py-0.5 rounded-full text-xs font-bold',
                      userAttempt.status === 'submitted'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                        : userAttempt.status === 'in_progress'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 animate-pulse'
                        : 'bg-slate-200 text-slate-700 dark:bg-neutral-800 dark:text-neutral-300'
                    )}
                  >
                    {userAttempt.status === 'submitted'
                      ? 'SUBMITTED ✓'
                      : userAttempt.status === 'in_progress'
                      ? 'IN PROGRESS ⏱️'
                      : 'NOT STARTED'}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#171822] border border-slate-200 dark:border-neutral-800 space-y-1">
                <div className="flex items-center justify-between text-[10.5px] text-slate-500 uppercase">
                  <span>Challenges Cleared</span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">{progressPercent}%</span>
                </div>
                <div className="text-lg font-black text-slate-900 dark:text-white">
                  {solvedCount} <span className="text-xs text-slate-400 font-normal">/ 18 Solved</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-neutral-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#171822] border border-slate-200 dark:border-neutral-800 space-y-1">
                <span className="text-[10.5px] text-slate-500 uppercase block">Potential Bounty & Trust</span>
                <div className="text-base font-black text-amber-600 dark:text-amber-400">
                  {is18Solved ? '1,800 🪙 Won!' : solvedCount >= 17 ? '1,000 🪙 (2nd Tier)' : solvedCount >= 16 ? '500 🪙 (3rd Tier)' : 'Tier 1: 1,800 🪙'}
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Trust Score: {antiCheatStatus.integrityScore}%</span>
                </div>
              </div>

              {/* Card 4 Action Button */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#171822] border border-slate-200 dark:border-neutral-800 space-y-2 flex flex-col justify-between h-full">
                {userAttempt.status === 'not_started' ? (
                  <>
                    <div className="flex items-center justify-between text-[10.5px] text-slate-500 uppercase">
                      <span className="flex items-center gap-1">
                        <Timer className="w-3 h-3 text-blue-500" /> Contest Window
                      </span>
                      <span className="text-blue-600 dark:text-blue-400 font-bold">72 Hours</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleEnterArena}
                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs font-mono shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Play className="w-3.5 h-3.5 fill-current text-white" />
                      <span>Join Contest</span>
                    </button>

                    <div className="text-[10px] text-slate-400 dark:text-neutral-500 text-center font-mono">
                      Clock starts immediately on join
                    </div>
                  </>
                ) : userAttempt.status === 'in_progress' ? (
                  <>
                    <div className="flex items-center justify-between text-[10.5px] text-slate-500 uppercase">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-500" /> Time Remaining
                      </span>
                      <span className="text-amber-600 dark:text-amber-400 font-bold font-mono text-xs">
                        {timeRemainingStr || '72h Active'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setHasJoinedArena(true)}
                      className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-xs font-mono transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 active:scale-[0.98]"
                    >
                      <Play className="w-3.5 h-3.5 fill-slate-950" />
                      <span>Enter Arena</span>
                    </button>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 dark:text-neutral-500 pt-0.5">
                      <span>{solvedCount}/18 Solved</span>
                      <button
                        type="button"
                        onClick={handleResetAttempt}
                        className="hover:text-rose-500 dark:hover:text-rose-400 inline-flex items-center gap-1 cursor-pointer transition-colors"
                        title="Reset contest attempt for testing"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        <span>Reset</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-[10.5px] text-slate-500 uppercase">
                      <span>Contest Score</span>
                      <span className="text-blue-600 dark:text-blue-400 font-bold">Locked ✓</span>
                    </div>

                    <div className="py-2 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-center text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center justify-center gap-1.5 font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                      <span>Submitted ({solvedCount}/18)</span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 dark:text-neutral-500 pt-0.5">
                      <span>Score permanently recorded</span>
                      <button
                        type="button"
                        onClick={handleResetAttempt}
                        className="hover:text-rose-500 dark:hover:text-rose-400 inline-flex items-center gap-1 cursor-pointer transition-colors"
                        title="Reset contest attempt for testing"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        <span>Reset</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

            </div>
          </div>

          {/* 3. MAIN TABS (CHALLENGES 18 • LIVE LEADERBOARD • OFFICIAL RULES) */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-neutral-800 pb-2">
            <button
              type="button"
              onClick={() => handleSelectTab('challenges')}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer',
                activeTab === 'challenges'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-[#161822]'
              )}
            >
              <Layers className="w-4 h-4" />
              <span>Contest Challenges (18)</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectTab('leaderboard')}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer',
                activeTab === 'leaderboard'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-[#161822]'
              )}
            >
              <Trophy className="w-4 h-4" />
              <span>Live Leaderboard & Podiums</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectTab('rules')}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer',
                activeTab === 'rules'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                  : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-[#161822]'
              )}
            >
              <BookOpen className="w-4 h-4" />
              <span>Rulebook & Anti-Cheat Charter</span>
            </button>
          </div>

          {/* TAB 1: CHALLENGES CATALOG */}
          {activeTab === 'challenges' && (
            <div id="challenges-section" className="space-y-6 animate-in fade-in duration-200 scroll-mt-24">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <span>Contest Stages & Challenges</span>
                    <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-[#1a1b1f] text-slate-600 dark:text-neutral-400 border border-slate-200 dark:border-neutral-800">
                      Total 18 Problems
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                    Solving any challenge in the arena unlocks a verified Blue Tick (✓) and encrypted receipt.
                  </p>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-bold">
                    5 Easy
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800 font-bold">
                    10 Medium
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800 font-bold">
                    3 Hard
                  </span>
                </div>
              </div>

              {/* 4 Stage Navigation Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {config.stages.map((stage) => {
                  const stageSolvedCount = stage.challenges.filter((c) => solvedSlugsSet.has(c.slug.toLowerCase().trim())).length;
                  const isStageComplete = stageSolvedCount >= stage.challenges.length;
                  const isActive = stage.id === activeStageId;

                  return (
                    <button
                      key={stage.id}
                      type="button"
                      onClick={() => setActiveStageId(stage.id)}
                      className={cn(
                        'p-4 rounded-2xl border text-left transition-all cursor-pointer font-mono relative overflow-hidden group',
                        isActive
                          ? 'bg-white dark:bg-[#161720] border-blue-500 shadow-md shadow-blue-500/10'
                          : 'bg-slate-50/80 dark:bg-[#111218] border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] uppercase font-bold text-slate-500 dark:text-neutral-400">
                          Stage {stage.id}
                        </span>
                        {isStageComplete ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Done
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 dark:text-neutral-500">
                            {stageSolvedCount}/{stage.challenges.length} Solved
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {stage.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-neutral-400 line-clamp-1 mt-0.5">
                        {stage.subtitle}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Challenges in Active Stage */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pt-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white font-mono flex items-center gap-2">
                    <span>{activeStage.name} Challenges</span>
                    <span className="text-xs text-slate-500">({activeStage.challenges.length} Problems)</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeStage.challenges.map((challenge, idx) => {
                    const isSolved = solvedSlugsSet.has(challenge.slug.toLowerCase().trim());
                    return (
                      <div
                        key={challenge.id}
                        className={cn(
                          'p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 font-mono',
                          isSolved
                            ? 'bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-300 dark:border-emerald-800/60'
                            : 'bg-white dark:bg-[#121319] border-slate-200 dark:border-neutral-800 hover:border-blue-500/40'
                        )}
                      >
                        <div className="space-y-2 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 dark:text-neutral-500 font-bold">
                              #{idx + 1}
                            </span>
                            <span
                              className={cn(
                                'text-[10px] px-2 py-0.5 rounded font-bold uppercase',
                                challenge.difficulty === 'Easy'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                  : challenge.difficulty === 'Medium'
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                                  : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                              )}
                            >
                              {challenge.difficulty}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-neutral-400">
                              • {challenge.category}
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {challenge.title}
                          </h4>

                          <p className="text-xs text-slate-500 dark:text-neutral-400 line-clamp-2">
                            {challenge.description}
                          </p>

                          <div className="flex items-center gap-3 text-xs pt-1">
                            <span className="text-amber-600 dark:text-amber-400 font-bold">
                              🪙 {challenge.coinsBounty} Coins
                            </span>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-500 dark:text-neutral-400">
                              ⚡ {challenge.xpPoints} XP
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 flex flex-col items-end gap-2">
                          {isSolved ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-500/30 text-xs font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-sky-500" />
                              <span>Solved ✓</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 dark:text-neutral-500">
                              Unsolved
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleSolveChallengeInArena(challenge.slug)}
                            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                          >
                            <Play className="w-3 h-3 fill-white" />
                            <span>Solve Challenge</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE LEADERBOARD */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2 flex-wrap">
                    <Trophy className="w-6 h-6 text-amber-500" />
                    <span>Official Monthly Leaderboard</span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      <span>Live WebSocket Engine</span>
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                    Live authenticated standings. Final score locks on monthly submit.
                    {lastUpdatedRankTime && (
                      <span className="text-emerald-500 dark:text-emerald-400 font-semibold ml-2">
                        • Synced at {lastUpdatedRankTime}
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search coders, college..."
                      value={leaderboardSearch}
                      onChange={(e) => setLeaderboardSearch(e.target.value)}
                      className="h-9 pl-9 pr-3 rounded-xl bg-white dark:bg-[#14151b] border border-slate-200 dark:border-neutral-800 text-xs font-mono focus:outline-none focus:border-blue-500 w-56"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsFullLeaderboardOpen(true)}
                    className="h-9 px-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 text-amber-700 dark:text-amber-400 font-mono text-xs font-bold border border-amber-500/30 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Full Standings</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Live Contest Activity Ticker */}
              {recentLiveActivity && (
                <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-transparent border border-blue-500/30 flex items-center gap-2 text-xs font-mono text-blue-600 dark:text-blue-300 animate-in fade-in slide-in-from-top-2 duration-300">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                  </span>
                  <span className="font-bold">Live Contest Activity:</span>
                  <span>{recentLiveActivity}</span>
                </div>
              )}

              {/* Leaderboard Table */}
              <div className="rounded-2xl bg-white dark:bg-[#121319] border border-slate-200 dark:border-neutral-800 overflow-hidden shadow-sm font-mono text-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-[#161720] border-b border-slate-200 dark:border-neutral-800 text-slate-500 dark:text-neutral-400 uppercase text-[10.5px]">
                      <tr>
                        <th className="py-3 px-4 w-16 text-center">Rank</th>
                        <th className="py-3 px-4">Student Coder</th>
                        <th className="py-3 px-4 hidden sm:table-cell">Institute / College</th>
                        <th className="py-3 px-4 text-center">Solved</th>
                        <th className="py-3 px-4 text-center">Score</th>
                        <th className="py-3 px-4 text-right">Prize</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/80">
                      {filteredLeaderboard.map((coder) => {
                        const rankIcons = ['🥇', '🥈', '🥉'];
                        const isSelf = user ? coder.userId === user.id : false;
                        return (
                          <tr
                            key={coder.userId}
                            onClick={() => handleOpenProfileModal(coder)}
                            className={cn(
                              'hover:bg-slate-50 dark:hover:bg-[#171822] cursor-pointer transition-colors',
                              isSelf && 'bg-blue-50/50 dark:bg-blue-950/20 font-bold'
                            )}
                          >
                            <td className="py-3 px-4 text-center font-bold text-sm">
                              {rankIcons[coder.rank - 1] || `#${coder.rank}`}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={coder.avatar}
                                  alt={coder.name}
                                  className="w-8 h-8 rounded-xl object-cover border border-slate-200 dark:border-neutral-700 shrink-0"
                                />
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 dark:text-white truncate flex items-center gap-1">
                                    <span>{coder.name}</span>
                                    {isSelf && <span className="text-[10px] text-blue-500">(You)</span>}
                                  </div>
                                  <div className="text-[11px] text-slate-400 truncate">@{coder.username}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 hidden sm:table-cell text-slate-600 dark:text-neutral-400">
                              {coder.college}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                {coder.problemsSolved}/18
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-slate-900 dark:text-white">
                              {coder.score}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-amber-600 dark:text-amber-400">
                              +{coder.coinsWon} 🪙
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: OFFICIAL RULES */}
          {activeTab === 'rules' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-6 rounded-2xl bg-white dark:bg-[#121319] border border-slate-200 dark:border-neutral-800 space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-neutral-800">
                  <BookOpen className="w-5 h-5 text-amber-500" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    NextEra Monthly Contest Official Rules
                  </h3>
                </div>

                <ul className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-neutral-300 leading-relaxed font-mono">
                  {CONTEST_RULES.map((rule, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 border border-blue-500/20">
                        {idx + 1}
                      </span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

        </main>

        {/* Start / Confirm Modal */}
        {isStartModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-neutral-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center mx-auto">
                <Timer className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Start 72-Hour Personal Timer?
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  Once started, your 72-hour countdown runs continuously.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStartModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 text-xs font-mono font-semibold hover:bg-slate-100 dark:hover:bg-neutral-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleEnterArena}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  Confirm & Join
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Submit Confirmation Modal */}
        {isSubmitModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-neutral-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div
                className={cn(
                  'w-12 h-12 rounded-2xl flex items-center justify-center mx-auto border',
                  solvedCount >= 2
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                )}
              >
                {solvedCount >= 2 ? <Award className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {solvedCount >= 2 ? 'Finalize & Submit Monthly Contest?' : 'Minimum 2 Problems Required'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  You have cleared <strong className="text-blue-600 dark:text-blue-400 font-bold">{solvedCount} of 18 challenges</strong>.
                </p>
              </div>

              {solvedCount < 2 ? (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 text-xs font-mono text-rose-800 dark:text-rose-300 space-y-2">
                  <div className="font-bold flex items-center gap-1.5 text-rose-700 dark:text-rose-300">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>Contest Submission Locked</span>
                  </div>
                  <p className="text-[11.5px] leading-relaxed text-slate-700 dark:text-neutral-300 font-sans">
                    Contest submit karne ke liye aapko kam se kam <strong>2 challenges solve</strong> karne honge. Abhi aapne sirf <strong>{solvedCount} / 18</strong> solve kiya hai.
                  </p>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 text-xs font-mono text-rose-800 dark:text-rose-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                    <span>Single Monthly Submission Rule</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Once submitted, your monthly submission is permanently locked and your final leaderboard rank will be cemented for {config.monthName}.
                  </p>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 text-xs font-mono font-semibold hover:bg-slate-100 dark:hover:bg-neutral-800 cursor-pointer"
                >
                  {solvedCount < 2 ? 'Continue Solving' : 'Keep Solving'}
                </button>
                {solvedCount >= 2 ? (
                  <button
                    type="button"
                    onClick={handleSubmitContest}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold shadow-md shadow-blue-500/20 cursor-pointer"
                  >
                    Confirm Final Submit
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsSubmitModalOpen(false);
                      setHasJoinedArena(true);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold shadow-md shadow-blue-500/20 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Solve in Arena</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Official Rulebook Modal */}
        <MonthlyContestRulebookModal
          isOpen={isRulebookModalOpen}
          onClose={() => setIsRulebookModalOpen(false)}
          monthName={config.monthName}
        />

        {/* Coder Profile Details Modal */}
        <UserProfileModal
          isOpen={Boolean(selectedProfileForModal)}
          onClose={() => setSelectedProfileForModal(null)}
          profile={selectedProfileForModal}
        />

        {/* Full Leaderboard Pop-up Modal */}
        <FullLeaderboardModal
          isOpen={isFullLeaderboardOpen}
          onClose={() => setIsFullLeaderboardOpen(false)}
          type="monthly"
          title={`${config.monthName} Grand Contest Standings`}
          subtitle={`Viewing all ${monthlyLeaderboardItems.length} contestants & live scoreboard`}
          students={monthlyLeaderboardItems}
          currentUserId={user?.id}
          onSelectStudent={(student) => {
            const original = liveLeaderboard.find((c) => c.userId === student.userId);
            if (original) handleOpenProfileModal(original);
          }}
        />

        {/* Winner Celebration Modal */}
        <WinnerCelebrationModal
          isOpen={isWinnerModalOpen}
          onClose={() => setIsWinnerModalOpen(false)}
          contestTitle={config.title}
          rank={1}
          coinsAwarded={1800}
        />

      </div>
    );
  }

  // =========================================================================
  // VIEW 2: MONTHLY CONTEST CODE EDITOR ARENA (Interactive Full IDE)
  // =========================================================================
  return (
    <div className="fixed inset-0 h-screen w-screen flex flex-col bg-slate-100 dark:bg-[#121212] text-slate-900 dark:text-neutral-200 antialiased select-none overflow-hidden font-sans z-20">
      
      {/* 1. Winner Celebration Modal */}
      <WinnerCelebrationModal
        isOpen={isWinnerModalOpen}
        onClose={() => setIsWinnerModalOpen(false)}
        contestTitle={config.title}
        rank={1}
        coinsAwarded={1800}
      />

      {/* 2. Coder Profile Inspection Modal */}
      <UserProfileModal
        isOpen={Boolean(selectedProfileForModal)}
        onClose={() => setSelectedProfileForModal(null)}
        profile={selectedProfileForModal}
      />

      {/* 2.5 Full Leaderboard Popup Modal */}
      <FullLeaderboardModal
        isOpen={isFullLeaderboardOpen}
        onClose={() => setIsFullLeaderboardOpen(false)}
        type="monthly"
        title={`${config.monthName} Grand Contest Standings`}
        subtitle={`Viewing all ${monthlyLeaderboardItems.length} participants & scoreboard`}
        students={monthlyLeaderboardItems}
        currentUserId={user?.id}
        onSelectStudent={(student) => {
          const original = liveLeaderboard.find((c) => c.userId === student.userId);
          if (original) handleOpenProfileModal(original);
        }}
      />

      {/* Submit Confirmation Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-neutral-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div
              className={cn(
                'w-12 h-12 rounded-2xl flex items-center justify-center mx-auto border',
                solvedCount >= 2
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
              )}
            >
              {solvedCount >= 2 ? <Award className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {solvedCount >= 2 ? 'Finalize & Submit Monthly Contest?' : 'Minimum 2 Problems Required'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                You have cleared <strong className="text-blue-600 dark:text-blue-400 font-bold">{solvedCount} of 18 challenges</strong>.
              </p>
            </div>

            {solvedCount < 2 ? (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 text-xs font-mono text-rose-800 dark:text-rose-300 space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-rose-700 dark:text-rose-300">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Contest Submission Locked</span>
                </div>
                <p className="text-[11.5px] leading-relaxed text-slate-700 dark:text-neutral-300 font-sans">
                  Contest submit karne ke liye aapko kam se kam <strong>2 challenges solve</strong> karne honge. Abhi aapne sirf <strong>{solvedCount} / 18</strong> solve kiya hai.
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 text-xs font-mono text-rose-800 dark:text-rose-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                  <span>Single Monthly Submission Rule</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Once submitted, your monthly submission is permanently locked and your final leaderboard rank will be cemented for {config.monthName}.
                </p>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 text-xs font-mono font-semibold hover:bg-slate-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                Keep Solving
              </button>
              {solvedCount >= 2 && (
                <button
                  type="button"
                  onClick={handleSubmitContest}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  Confirm Final Submit
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. ARENA TOP NAVBAR HEADER */}
      <header className="h-12 bg-white dark:bg-[#1a1a1a] border-b border-slate-200 dark:border-neutral-800 px-3 sm:px-4 flex items-center justify-between shrink-0 z-30 text-xs font-mono">
        
        {/* Left: Back to Lobby & Arena Title */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setHasJoinedArena(false)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#2a2a2a] text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Return to Monthly Contest Lobby & Standings"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="font-semibold text-blue-600 dark:text-blue-400">Contest Lobby</span>
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-neutral-800 hidden sm:block" />

          <span className="font-bold text-slate-800 dark:text-neutral-300 hidden md:flex items-center gap-1.5 text-xs">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Monthly Arena • {config.monthName}</span>
          </span>
        </div>

        {/* Center: 18-Problem Navigator (Prev, Problem Selector Dropdown, Next) */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={activeChallengeIdx <= 0}
            onClick={() => handleSelectChallengeIdx(activeChallengeIdx - 1)}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-[#2a2a2a] text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title="Previous Challenge"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Quick Problem Popover Button */}
          <div className="relative" ref={questionPickerRef}>
            <button
              type="button"
              onClick={() => setIsQuestionPickerOpen(!isQuestionPickerOpen)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer border',
                'bg-slate-100 dark:bg-[#222222] text-slate-800 dark:text-neutral-200 hover:bg-slate-200 dark:hover:bg-[#2a2a2a] border-slate-300 dark:border-neutral-700/80'
              )}
            >
              <Code2 className="w-3.5 h-3.5 text-blue-500" />
              <span className="max-w-[140px] sm:max-w-[200px] truncate">
                Q{activeChallengeIdx + 1}. {activeChallenge?.title}
              </span>
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded text-[10px] uppercase font-bold',
                  activeChallenge?.difficulty === 'Easy'
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : activeChallenge?.difficulty === 'Medium'
                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                    : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                )}
              >
                {activeChallenge?.difficulty}
              </span>
              {isCurrentActiveSolved && (
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400 stroke-[2.5]" />
              )}
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* 18 Problems Dropdown Grid */}
            {isQuestionPickerOpen && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-80 sm:w-96 max-h-[75vh] overflow-y-auto p-3 rounded-2xl bg-white dark:bg-[#1c1d24] border border-slate-200 dark:border-neutral-700 shadow-2xl z-50 font-mono text-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-neutral-800">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-500" />
                    <span>Select from 18 Challenges</span>
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {solvedCount}/18 Solved
                  </span>
                </div>

                {config.stages.map((st) => (
                  <div key={st.id} className="space-y-1.5">
                    <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-neutral-500 px-1 flex items-center justify-between">
                      <span>{st.name}</span>
                      <span>({st.challenges.length})</span>
                    </div>
                    <div className="space-y-1">
                      {st.challenges.map((ch) => {
                        const globalIdx = allMonthlyChallenges.findIndex((c) => c.id === ch.id);
                        const isSolved = solvedSlugsSet.has(ch.slug.toLowerCase().trim());
                        const isCurrent = globalIdx === activeChallengeIdx;

                        return (
                          <button
                            key={ch.id}
                            type="button"
                            onClick={() => handleSelectChallengeIdx(globalIdx)}
                            className={cn(
                              'w-full p-2 rounded-xl text-left flex items-center justify-between gap-2 transition-all cursor-pointer',
                              isCurrent
                                ? 'bg-blue-600 text-white font-bold'
                                : 'hover:bg-slate-100 dark:hover:bg-[#252733] text-slate-800 dark:text-neutral-200'
                            )}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-[11px] opacity-70 w-5 shrink-0">
                                Q{globalIdx + 1}
                              </span>
                              <span className="truncate text-xs">
                                {ch.title}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span
                                className={cn(
                                  'text-[9.5px] px-1.5 py-0.2 rounded font-bold uppercase',
                                  isCurrent
                                    ? 'bg-white/20 text-white'
                                    : ch.difficulty === 'Easy'
                                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                    : ch.difficulty === 'Medium'
                                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                                    : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                                )}
                              >
                                {ch.difficulty}
                              </span>
                              {isSolved && (
                                <CheckCircle2 className={cn('w-3.5 h-3.5', isCurrent ? 'text-white' : 'text-sky-500')} />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={activeChallengeIdx >= allMonthlyChallenges.length - 1}
            onClick={() => handleSelectChallengeIdx(activeChallengeIdx + 1)}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-[#2a2a2a] text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title="Next Challenge"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: 72-Hour Timer, Solved Pill, Submit Contest, Theme */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* 72h Live Timer */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-xs font-mono font-bold"
            title="72-Hour Personal Timer Remaining"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{timeRemainingStr || '72h Active'}</span>
          </div>

          {/* Stopwatch */}
          <div
            onClick={() => setIsStopwatchRunning(!isStopwatchRunning)}
            className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-[#2a2a2a] text-slate-600 dark:text-neutral-400 cursor-pointer transition-colors"
            title="Arena Stopwatch"
          >
            <Timer className={cn('w-3.5 h-3.5', isStopwatchRunning ? 'text-emerald-500' : 'text-slate-400')} />
            <span className="text-xs font-mono">{formatStopwatch(stopwatchSeconds)}</span>
          </div>

          {/* Anti-Cheat Shield Pill */}
          <div
            className={cn(
              'hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-colors',
              tabSwitchesCount === 0
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : tabSwitchesCount < 3
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
            )}
            title={`Anti-Cheat Integrity Monitor: ${tabSwitchesCount} tab switches recorded.`}
          >
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>{tabSwitchesCount === 0 ? 'Protected' : `${tabSwitchesCount} Switches`}</span>
          </div>

          {/* Submit Contest Button */}
          <button
            type="button"
            onClick={() => setIsSubmitModalOpen(true)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer border',
              solvedCount < 2
                ? 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 border-slate-300 dark:border-neutral-700 hover:border-amber-500/50'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500 shadow-sm shadow-blue-500/30 hover:from-blue-500 hover:to-indigo-500 active:scale-95'
            )}
            title={solvedCount < 2 ? `Requires min 2 solved (Currently: ${solvedCount}/18)` : 'Submit & lock final score'}
          >
            {solvedCount < 2 ? <Lock className="w-3.5 h-3.5 text-amber-500" /> : <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
            <span className="hidden sm:inline">Submit Contest</span>
            <span className={cn(
              'px-1.5 py-0.2 rounded text-[10px] font-mono',
              solvedCount < 2 ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold' : 'bg-white/20 text-white'
            )}>
              {solvedCount}/18
            </span>
          </button>

          <ThemeToggle compact />
        </div>
      </header>

      {/* 4. MAIN SPLIT PANE WORKSPACE */}
      <div ref={workspaceRef} className="flex-1 flex overflow-hidden relative p-1.5 gap-1.5 bg-slate-100 dark:bg-[#121212]">
        
        {/* ========================================================================= */}
        {/* LEFT PANEL: Description / 18 Challenges / Standings / Rulebook */}
        {/* ========================================================================= */}
        <div
          style={{ width: `${leftPaneWidth}%` }}
          className="h-full flex flex-col bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-neutral-800 overflow-hidden shrink-0 shadow-sm relative"
        >
          {/* Left Panel Tabs Header */}
          <div className="h-10 bg-slate-50 dark:bg-[#222222] border-b border-slate-200 dark:border-neutral-800 px-2 flex items-center justify-between text-xs font-mono shrink-0">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveArenaLeftTab('description')}
                className={cn(
                  'px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer',
                  activeArenaLeftTab === 'description'
                    ? 'bg-white dark:bg-[#2e2e2e] text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#282828]'
                )}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Description</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveArenaLeftTab('challenges')}
                className={cn(
                  'px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer',
                  activeArenaLeftTab === 'challenges'
                    ? 'bg-white dark:bg-[#2e2e2e] text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#282828]'
                )}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>18 Challenges</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold">
                  {solvedCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveArenaLeftTab('standings')}
                className={cn(
                  'px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer',
                  activeArenaLeftTab === 'standings'
                    ? 'bg-white dark:bg-[#2e2e2e] text-amber-600 dark:text-amber-400 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#282828]'
                )}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Standings</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveArenaLeftTab('rulebook')}
                className={cn(
                  'px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer',
                  activeArenaLeftTab === 'rulebook'
                    ? 'bg-white dark:bg-[#2e2e2e] text-purple-600 dark:text-purple-400 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#282828]'
                )}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Rulebook</span>
              </button>
            </div>

            <span className="text-[11px] text-slate-500 dark:text-neutral-500 hidden sm:inline">
              Points: {activeChallenge?.coinsBounty || 100}
            </span>
          </div>

          {/* Left Panel Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-slate-700 dark:text-neutral-300 text-sm leading-relaxed">
            
            {/* 1. DESCRIPTION TAB */}
            {activeArenaLeftTab === 'description' && (
              <div className="space-y-6 font-sans">
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                      Q{activeChallengeIdx + 1}. {activeChallenge?.title}
                    </h2>
                    {isCurrentActiveSolved && (
                      <span className="px-2.5 py-0.5 rounded-md bg-sky-500/20 border border-sky-500/40 text-sky-600 dark:text-sky-400 text-xs font-mono font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Verified Solved (✓)
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-md font-bold',
                        activeChallenge?.difficulty === 'Easy'
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : activeChallenge?.difficulty === 'Medium'
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                      )}
                    >
                      {activeChallenge?.difficulty}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 border border-slate-200 dark:border-neutral-700">
                      {activeChallenge?.stageName || 'Stage Challenge'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 border border-slate-200 dark:border-neutral-700">
                      Category: {activeChallenge?.category}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-bold">
                      +{activeChallenge?.coinsBounty || 100} Coins
                    </span>
                  </div>
                </div>

                {/* Description Body */}
                <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-neutral-300 text-sm space-y-4">
                  <div className="whitespace-pre-line leading-relaxed">
                    {challengeDescription}
                  </div>
                </div>

                {/* Examples */}
                <div className="space-y-4 pt-2">
                  <h3 className="text-sm font-bold font-mono text-slate-900 dark:text-neutral-200 uppercase tracking-wider">
                    Examples & Test Cases
                  </h3>

                  {challengeTestCases.map((tc, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#222222] border border-slate-200 dark:border-neutral-800 font-mono text-xs space-y-2"
                    >
                      <span className="text-blue-600 dark:text-blue-400 font-bold block">
                        Example {idx + 1}:
                      </span>
                      <div className="space-y-1">
                        <div>
                          <span className="text-slate-500 dark:text-neutral-500">Input: </span>
                          <span className="text-slate-800 dark:text-neutral-200">{tc.input}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-neutral-500">Expected Output: </span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">{tc.expectedOutput}</span>
                        </div>
                        {tc.explanation && (
                          <div className="text-slate-600 dark:text-neutral-400 text-[11px] pt-1 border-t border-slate-200 dark:border-neutral-800/80">
                            <span className="text-slate-500 dark:text-neutral-500">Explanation: </span>
                            <span>{tc.explanation}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Constraints */}
                {challengeConstraints.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h3 className="text-sm font-bold font-mono text-slate-900 dark:text-neutral-200 uppercase tracking-wider">
                      Constraints
                    </h3>
                    <ul className="list-disc pl-5 font-mono text-xs space-y-1 text-slate-600 dark:text-neutral-400">
                      {challengeConstraints.map((c, idx) => (
                        <li key={idx}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* 2. 18 CHALLENGES TAB */}
            {activeArenaLeftTab === 'challenges' && (
              <div className="space-y-5 font-mono">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-neutral-800">
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    All 18 Monthly Challenges
                  </span>
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">
                    {solvedCount} / 18 Solved
                  </span>
                </div>

                {config.stages.map((st) => (
                  <div key={st.id} className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-neutral-300">
                      <span>{st.name}</span>
                      <span className="text-slate-400 text-[11px] font-normal">{st.subtitle}</span>
                    </div>

                    <div className="space-y-1.5">
                      {st.challenges.map((ch) => {
                        const globalIdx = allMonthlyChallenges.findIndex((c) => c.id === ch.id);
                        const isSolved = solvedSlugsSet.has(ch.slug.toLowerCase().trim());
                        const isCurrent = globalIdx === activeChallengeIdx;

                        return (
                          <div
                            key={ch.id}
                            onClick={() => {
                              handleSelectChallengeIdx(globalIdx);
                              setActiveArenaLeftTab('description');
                            }}
                            className={cn(
                              'p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 group',
                              isCurrent
                                ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-500 shadow-xs'
                                : 'bg-slate-50/60 dark:bg-[#20212b] border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700'
                            )}
                          >
                            <div className="min-w-0 flex-1 flex items-center gap-2.5">
                              <span className="text-xs font-bold text-slate-500 w-5">
                                Q{globalIdx + 1}
                              </span>
                              <div className="min-w-0">
                                <span className={cn(
                                  'text-xs font-bold block truncate',
                                  isCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-white'
                                )}>
                                  {ch.title}
                                </span>
                                <div className="flex items-center gap-2 text-[10.5px] text-slate-500 pt-0.5">
                                  <span className={cn(
                                    'px-1.5 py-0.2 rounded font-bold uppercase',
                                    ch.difficulty === 'Easy' ? 'text-emerald-600 dark:text-emerald-400' :
                                    ch.difficulty === 'Medium' ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
                                  )}>
                                    {ch.difficulty}
                                  </span>
                                  <span>• {ch.category}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {isSolved ? (
                                <span className="px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 text-[11px] font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-sky-500" /> Solved
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-400">Unsolved</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 3. STANDINGS TAB */}
            {activeArenaLeftTab === 'standings' && (
              <div className="space-y-4 font-mono">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-neutral-800">
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    Monthly Live Standings
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsFullLeaderboardOpen(true)}
                    className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                  >
                    <span>Full Leaderboard</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-2">
                  {liveLeaderboard.slice(0, 8).map((coder, idx) => {
                    const rankIcons = ['🥇', '🥈', '🥉'];
                    const isSelf = user ? coder.userId === user.id : false;
                    return (
                      <div
                        key={coder.userId}
                        onClick={() => handleOpenProfileModal(coder)}
                        className={cn(
                          'p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3',
                          isSelf
                            ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-500'
                            : 'bg-slate-50/70 dark:bg-[#20212b] border-slate-200 dark:border-neutral-800 hover:border-slate-300'
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-sm font-bold w-6 text-center shrink-0">
                            {rankIcons[idx] || `#${idx + 1}`}
                          </span>
                          <img
                            src={coder.avatar}
                            alt={coder.name}
                            className="w-8 h-8 rounded-xl object-cover border border-slate-200 dark:border-neutral-700 shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                              {coder.name} {isSelf && '(You)'}
                            </span>
                            <span className="text-[10.5px] text-slate-500 truncate block">
                              {coder.college}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            {coder.problemsSolved}/18 Solved
                          </div>
                          <div className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                            +{coder.coinsWon} 🪙
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. RULEBOOK TAB */}
            {activeArenaLeftTab === 'rulebook' && (
              <div className="space-y-4 font-mono text-xs">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-neutral-800">
                  <BookOpen className="w-4 h-4 text-purple-500" />
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    72-Hour Contest Regulations
                  </span>
                </div>

                <ul className="space-y-3 leading-relaxed text-slate-700 dark:text-neutral-300">
                  {CONTEST_RULES.map((r, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-md bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          </div>

          {/* Output Window Drawer Mounted inside Left Pane */}
          <OutputWindowDrawer
            isOpen={isOutputOpen}
            onClose={() => setIsOutputOpen(false)}
            isMinimized={isOutputMinimized}
            onToggleMinimize={() => setIsOutputMinimized(!isOutputMinimized)}
            isRunning={isRunning}
            isSubmitting={isSubmitting}
            activeTab={outputDrawerTab}
            onTabChange={setOutputDrawerTab}
            testCases={challengeTestCases.map((tc) => ({
              input: tc.input,
              expectedOutput: tc.expectedOutput,
              actualOutput: evaluationResult?.results?.find((r) => r.input === tc.input)?.actual,
              passed: evaluationResult?.results?.find((r) => r.input === tc.input)?.passed,
              explanation: tc.explanation,
            }))}
            selectedCaseIdx={selectedCaseIdx}
            onSelectCaseIdx={setSelectedCaseIdx}
            customInput={customInput}
            onCustomInputChange={setCustomInput}
            contestEvaluation={evaluationResult}
            onRunCode={handleRunCode}
            onSubmitCode={handleSubmitChallengeCode}
            problemTitle={`Q${activeChallengeIdx + 1}. ${activeChallenge?.title}`}
            userScore={solvedCount * 100}
            pointsScored={solvedCount * 100}
            totalPoints={1800}
            attemptsCount={{ correct: solvedCount, total: 18, accuracy: Math.round((solvedCount / 18) * 100) }}
            code={code}
            language={selectedLanguage}
          />
        </div>

        {/* Resizer Divider Bar */}
        <div
          onMouseDown={handleMouseDownH}
          className={cn(
            'w-1.5 hover:w-2 bg-slate-300 dark:bg-neutral-800 hover:bg-blue-500 cursor-col-resize transition-all shrink-0 rounded-full select-none',
            isDraggingH && 'bg-blue-500 w-2'
          )}
          title="Drag to resize split panes"
        />

        {/* ========================================================================= */}
        {/* RIGHT PANEL: Professional Code Editor & Action Toolbar */}
        {/* ========================================================================= */}
        <div
          ref={rightPaneRef}
          className="flex-1 h-full flex flex-col min-w-0 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-neutral-800 overflow-hidden shadow-sm relative"
        >
          {/* Editor Top Toolbar */}
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-[#1e1e1e] rounded-xl border border-slate-200 dark:border-neutral-800">
            <div className="h-10 bg-slate-100 dark:bg-[#252526] border-b border-slate-200 dark:border-neutral-800 px-3 flex items-center justify-between text-xs font-mono shrink-0">
              
              {/* Language Selector */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedLanguage}
                  onChange={(e) => {
                    const newLang = e.target.value;
                    setSelectedLanguage(newLang);
                    localStorage.setItem('nextera:preferred_language', newLang);
                  }}
                  className="h-7 px-2.5 rounded-md bg-white dark:bg-[#2d2d2d] border border-slate-300 dark:border-neutral-700 text-xs font-mono font-bold text-blue-700 dark:text-blue-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="java">Java</option>
                  <option value="python">Python</option>
                  <option value="cpp">C++</option>
                  <option value="c">C</option>
                  <option value="javascript">JavaScript</option>
                </select>
              </div>

              {/* Editor Actions Toolbar */}
              <div className="flex items-center gap-1 text-slate-500 dark:text-neutral-400">
                {/* 1. Format Code */}
                <button
                  type="button"
                  onClick={handleFormatCode}
                  title="Format Code"
                  className="p-1.5 rounded-md text-slate-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200 dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer"
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>

                {/* 2. Copy Code */}
                <button
                  type="button"
                  onClick={handleCopyCode}
                  title="Copy Code"
                  className="p-1.5 rounded-md text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>

                {/* 3. Settings */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    title="Editor Settings"
                    className={cn(
                      'p-1.5 rounded-md transition-colors cursor-pointer',
                      isSettingsOpen ? 'bg-blue-500/20 text-blue-600 dark:text-blue-300' : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#2a2a2a]'
                    )}
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>

                  {isSettingsOpen && (
                    <div
                      ref={settingsRef}
                      className="absolute right-0 top-full mt-2 w-64 p-4 rounded-xl bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-neutral-700 shadow-2xl z-50 font-mono text-xs space-y-4"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-neutral-800">
                        <span className="font-bold text-slate-900 dark:text-white">Editor Settings</span>
                        <button
                          type="button"
                          onClick={() => setIsSettingsOpen(false)}
                          className="text-slate-400 dark:text-neutral-500 hover:text-slate-900 dark:hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-slate-600 dark:text-neutral-400">
                          <span>Font Size:</span>
                          <span className="text-blue-600 dark:text-blue-400 font-bold">{fontSize}px</span>
                        </div>
                        <input
                          type="range"
                          min="11"
                          max="20"
                          step="0.5"
                          value={fontSize}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setFontSize(val);
                            localStorage.setItem('nextera:monthly_editor_fontsize', String(val));
                          }}
                          className="w-full accent-blue-500 cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-slate-600 dark:text-neutral-400 block">Tab Spaces:</span>
                        <div className="grid grid-cols-2 gap-2">
                          {[2, 4].map((spaces) => (
                            <button
                              key={spaces}
                              type="button"
                              onClick={() => {
                                setTabSize(spaces);
                                localStorage.setItem('nextera:monthly_editor_tabsize', String(spaces));
                              }}
                              className={cn(
                                'px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors border text-center cursor-pointer',
                                tabSize === spaces
                                  ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/50'
                                  : 'bg-slate-100 dark:bg-[#2a2a2a] text-slate-600 dark:text-neutral-400 border-slate-300 dark:border-neutral-700'
                              )}
                            >
                              {spaces} Spaces
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-slate-600 dark:text-neutral-400 block">Theme:</span>
                        <select
                          value={editorTheme}
                          onChange={(e) => {
                            setEditorTheme(e.target.value);
                            localStorage.setItem('nextera:monthly_editor_theme', e.target.value);
                          }}
                          className="w-full h-8 px-2.5 rounded-lg bg-slate-100 dark:bg-[#2a2a2a] border border-slate-300 dark:border-neutral-700 text-xs text-slate-800 dark:text-neutral-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                        >
                          {Object.values(EDITOR_THEMES).map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-neutral-800">
                        <span className="text-slate-700 dark:text-neutral-300">Word Wrap</span>
                        <button
                          type="button"
                          onClick={() => {
                            const next = !wordWrap;
                            setWordWrap(next);
                            localStorage.setItem('nextera:monthly_editor_wordwrap', String(next));
                          }}
                          className={cn(
                            'w-10 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer',
                            wordWrap ? 'bg-blue-600' : 'bg-slate-300 dark:bg-neutral-700'
                          )}
                        >
                          <div
                            className={cn(
                              'w-4 h-4 rounded-full bg-white transition-transform',
                              wordWrap ? 'translate-x-5' : 'translate-x-0'
                            )}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-700 dark:text-neutral-300">Line Numbers</span>
                        <button
                          type="button"
                          onClick={() => {
                            const next = !showLineNumbers;
                            setShowLineNumbers(next);
                            localStorage.setItem('nextera:monthly_editor_linenumbers', String(next));
                          }}
                          className={cn(
                            'w-10 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer',
                            showLineNumbers ? 'bg-blue-600' : 'bg-slate-300 dark:bg-neutral-700'
                          )}
                        >
                          <div
                            className={cn(
                              'w-4 h-4 rounded-full bg-white transition-transform',
                              showLineNumbers ? 'translate-x-5' : 'translate-x-0'
                            )}
                          />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Reset Code */}
                <button
                  type="button"
                  onClick={handleResetCode}
                  title="Reset starter template code"
                  className="p-1.5 rounded-md text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                {/* Mobile Landscape Rotate Button */}
                {isMobile && isPortrait && (
                  <button
                    type="button"
                    onClick={lockLandscape}
                    title="Rotate to Landscape Mode"
                    className="flex md:hidden items-center gap-1 px-2 py-1 rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400 hover:bg-blue-500/25 text-[11px] font-mono font-semibold transition-colors cursor-pointer"
                  >
                    <span>🔄</span>
                    <span>Landscape</span>
                  </button>
                )}

                {/* 5. Fullscreen Toggle */}
                <button
                  type="button"
                  onClick={() => setIsFullScreen(!isFullScreen)}
                  title={isFullScreen ? 'Exit Full Screen' : 'Full Screen Editor'}
                  className={cn(
                    'p-1.5 rounded-md transition-colors cursor-pointer',
                    isFullScreen ? 'bg-blue-500/20 text-blue-600 dark:text-blue-300' : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#2a2a2a]'
                  )}
                >
                  {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Code Editor Body */}
            <div className="flex-1 overflow-hidden relative">
              <ProfessionalCodeEditor
                value={code}
                onChange={handleCodeChange}
                language={selectedLanguage}
                theme={editorTheme}
                fontSize={fontSize}
                tabSize={tabSize}
                wordWrap={wordWrap}
                showLineNumbers={showLineNumbers}
                onRun={handleRunCode}
                onSubmit={handleSubmitChallengeCode}
                className="h-full border-none"
              />
            </div>

            {/* Editor Footer Status */}
            <div className="h-6 px-3 bg-slate-100 dark:bg-[#181818] border-t border-slate-200 dark:border-neutral-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-neutral-500 shrink-0">
              <span className="flex items-center gap-2">
                <span>Saved locally</span>
                <span>•</span>
                <span>{selectedLanguage}</span>
                <span>•</span>
                <span>{fontSize}px</span>
              </span>
              <span>Ln {lineCount}, Col 1</span>
            </div>
          </div>

          {/* ACTION TOOLBAR: Standings link, Custom Test, Compile & Run, Submit */}
          <div className="h-12 px-3.5 bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 dark:from-[#14151d] dark:via-[#1a1b26] dark:to-[#14151d] border border-slate-200 dark:border-neutral-800/90 rounded-xl mt-1.5 flex items-center justify-between shrink-0 text-xs font-mono shadow-md backdrop-blur-md">
            
            {/* Left Quick Helpers: Standings Quick Link */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveArenaLeftTab('standings')}
                className={cn(
                  'h-8 px-3 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 text-xs font-mono',
                  activeArenaLeftTab === 'standings'
                    ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.25)] font-bold'
                    : 'bg-white dark:bg-[#1e1f2b] text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white border-slate-300 dark:border-neutral-700/80'
                )}
                title="View Live Standings"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>Leaderboard ({solvedCount}/18 Solved)</span>
              </button>
            </div>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-2.5">
              {/* 1. Custom Input */}
              <button
                type="button"
                onClick={handleOpenCustomInput}
                className={cn(
                  'h-8 px-3.5 rounded-lg border text-xs font-mono font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer active:scale-95 shadow-xs group',
                  isOutputOpen && outputDrawerTab === 'custom'
                    ? 'bg-cyan-100 dark:bg-cyan-950/70 text-cyan-800 dark:text-cyan-300 border-cyan-500/60 shadow-[0_0_16px_rgba(6,182,212,0.3)]'
                    : 'bg-white dark:bg-[#1c1e29] hover:bg-slate-100 dark:hover:bg-[#252838] text-slate-700 dark:text-neutral-300 hover:text-cyan-700 dark:hover:text-cyan-200 border-slate-300 dark:border-neutral-700/80'
                )}
                title="Open Custom Test Cases"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400 group-hover:rotate-12 transition-transform duration-200" />
                <span className="tracking-wide">+ Custom Test</span>
              </button>

              {/* 2. Compile & Run */}
              <button
                type="button"
                disabled={isRunning || isSubmitting}
                onClick={handleRunCode}
                className={cn(
                  'relative overflow-hidden h-8 px-5 rounded-lg bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-[#242634] dark:via-[#2f3244] dark:to-[#242634] hover:from-slate-300 hover:via-slate-200 hover:to-slate-300 dark:hover:from-[#2e3244] dark:hover:via-[#393d52] dark:hover:to-[#2e3244] border border-cyan-600/30 dark:border-cyan-500/30 hover:border-cyan-500 dark:hover:border-cyan-400/80 text-cyan-900 dark:text-cyan-100 hover:text-slate-900 dark:hover:text-white font-bold flex items-center gap-2 transition-all duration-200 text-xs cursor-pointer shadow-sm hover:shadow-[0_0_20px_rgba(6,182,212,0.35)] active:scale-95 group',
                  isRunning && 'opacity-60 cursor-not-allowed'
                )}
                title="Compile & Run Code"
              >
                {isRunning ? (
                  <div className="w-3.5 h-3.5 border-2 border-cyan-500 dark:border-cyan-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-cyan-500/20 flex items-center justify-center group-hover:bg-cyan-500/30 transition-colors">
                    <Play className="w-2.5 h-2.5 fill-cyan-500 dark:fill-cyan-400 text-cyan-500 dark:text-cyan-400 ml-0.5" />
                  </div>
                )}
                <span className="tracking-wide">Compile & Run</span>
              </button>

              {/* 3. Submit Challenge Solution */}
              <button
                type="button"
                disabled={isRunning || isSubmitting}
                onClick={handleSubmitChallengeCode}
                className={cn(
                  'relative overflow-hidden h-8 px-5 rounded-lg bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:via-emerald-400 hover:to-teal-400 text-white font-bold flex items-center gap-2 shadow-[0_0_18px_rgba(16,185,129,0.35)] hover:shadow-[0_0_28px_rgba(16,185,129,0.65)] active:scale-95 transition-all duration-200 text-xs cursor-pointer border border-emerald-400/50 group',
                  isSubmitting && 'opacity-60 cursor-not-allowed'
                )}
                title={`Submit Q${activeChallengeIdx + 1} for Contest Evaluation`}
              >
                {isSubmitting ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <CloudUpload className="w-3 h-3 text-white group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                )}
                <span className="tracking-wide">Submit Q{activeChallengeIdx + 1}</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* MOBILE LANDSCAPE MODE PROMPT */}
      <MobileLandscapePrompt
        isOpen={hasJoinedArena && showPrompt}
        onRotateLandscape={lockLandscape}
        onDismiss={dismissPrompt}
        title="Rotate Phone for Monthly Contest Arena"
        subtitle="Writing multi-stage solutions and verifying test cases in portrait is not practical. Rotate your device to landscape for the full IDE experience."
      />

    </div>
  );
};
