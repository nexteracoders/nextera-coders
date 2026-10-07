import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../hooks/useAuth';
import {
  coinService,
  CoinWalletState,
} from '../../services/coin.service';
import {
  sundayContestService,
  SundayContestConfig,
  CoderProfile,
  PRACTICE_PROBLEMS_CATALOG,
  AntiCheatSessionLog,
} from '../../services/contest.service';
import { WinnerCelebrationModal } from '../../components/contest/WinnerCelebrationModal';
import { UserProfileModal } from '../../components/contest/UserProfileModal';
import { FullLeaderboardModal, LeaderboardStudentItem } from '../../components/contest/FullLeaderboardModal';
import { ProfessionalCodeEditor, EDITOR_THEMES } from '../../components/code/ProfessionalCodeEditor';
import { OutputWindowDrawer } from '../../components/code/OutputWindowDrawer';
import { useAppDispatch } from '../../store/hooks';
import { checkAuth } from '../../store/slices/authSlice';
import { ROUTES } from '../../constants/routes';
import { getCleanStarterCode } from '../../utils/starterCode';
import { evaluateTestCases } from '../../utils/codeEvaluator';
import { ThemeToggle } from '../../components/common/ThemeToggle';
import { useAutoLandscape } from '../../hooks/useAutoLandscape';
import { MobileLandscapePrompt } from '../../components/common/MobileLandscapePrompt';
import {
  Trophy,
  Flame,
  Play,
  CloudUpload,
  RotateCcw,
  Copy,
  Check,
  CheckCircle2,
  FileText,
  Timer,
  ChevronLeft,
  Code2,
  AlignLeft,
  Settings,
  Maximize2,
  Minimize2,
  X,
  History,
  BookOpen,
  Sparkles,
  Clock,
  ShieldCheck,
  ArrowRight,
  Zap,
  Gift,
  ChevronRight,
  Search,
  ExternalLink,
} from 'lucide-react';
import { cn } from '../../utils/cn';

// Multi-language code formatter utility
const formatCode = (rawCode: string, lang: string, tabSpaces: number = 2): string => {
  if (!rawCode || !rawCode.trim()) return rawCode;

  const l = (lang || 'javascript').toLowerCase();
  const indentStr = ' '.repeat(tabSpaces);

  // Python formatting
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

  // C-style languages (JavaScript, TypeScript, Java, C++, C)
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

export const WeeklyContestPage: React.FC = () => {
  useDocumentTitle('Weekly Contest Championship Arena — NextEra Coders');
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated, isInitialized } = useAuth();
  const { success, error: toastError, info } = useToast();

  const [wallet, setWallet] = useState<CoinWalletState>(coinService.getState());
  const [contestConfig, setContestConfig] = useState<SundayContestConfig>(sundayContestService.getConfig());

  // Lobby Previous Contest Problems filter & search state
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'Easy' | 'Medium' | 'Hard'>('all');

  interface PreviousContestProblem {
    id: string;
    contestNumber: number;
    contestDateStr: string;
    problemNumber: 1 | 2;
    title: string;
    slug: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    points: number;
    category: string;
    companyTags: string[];
    submissionsCount: string;
    accuracyRate: string;
  }

  const previousContestProblems = useMemo<PreviousContestProblem[]>(() => {
    const items: PreviousContestProblem[] = [];
    const currentNum = contestConfig.contestNumber || 42;
    const cat = PRACTICE_PROBLEMS_CATALOG && PRACTICE_PROBLEMS_CATALOG.length > 0
      ? PRACTICE_PROBLEMS_CATALOG
      : [];

    const mockCompanyPool = [
      ['Google', 'Uber'],
      ['Amazon', 'Microsoft'],
      ['Meta', 'Bloomberg'],
      ['Apple', 'Goldman Sachs'],
      ['Atlassian', 'Adobe'],
      ['Flipkart', 'Swiggy'],
      ['Salesforce', 'Oracle'],
    ];

    const topicsPool = [
      'Dynamic Programming',
      'Graph & BFS',
      'Binary Search & Arrays',
      'Sliding Window & Strings',
      'Trees & Recursion',
      'Greedy & Heaps',
      'Two Pointers & Hash Tables',
    ];

    // Previous 6 Weekly Contests, each with Q1 and Q2 (12 problems total)
    for (let i = 1; i <= 6; i++) {
      const cNum = currentNum - i;
      const pastSunday = new Date();
      pastSunday.setDate(pastSunday.getDate() - (pastSunday.getDay() === 0 ? 0 : pastSunday.getDay()) - (i * 7));
      const dateStr = pastSunday.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      // Q1 Problem (Easy or Medium)
      const q1Idx = (cNum * 3 + 1) % (cat.length || 1);
      const catQ1 = cat[q1Idx];
      const q1Diff = i % 2 === 0 ? 'Easy' : 'Medium';
      items.push({
        id: `contest-${cNum}-q1`,
        contestNumber: cNum,
        contestDateStr: dateStr,
        problemNumber: 1,
        title: catQ1 ? catQ1.title : `Subarray Target Sum with Constraints #${cNum}`,
        slug: catQ1 ? catQ1.slug : `subarray-target-sum-${cNum}`,
        difficulty: catQ1 ? catQ1.difficulty : q1Diff,
        points: q1Diff === 'Easy' ? 300 : 400,
        category: catQ1?.category || topicsPool[(cNum) % topicsPool.length],
        companyTags: mockCompanyPool[(cNum) % mockCompanyPool.length],
        submissionsCount: `${Math.floor(18 + (cNum * 2.1) % 35)}K`,
        accuracyRate: `${(52 + (cNum * 1.7) % 32).toFixed(1)}%`,
      });

      // Q2 Problem (Medium or Hard)
      const q2Idx = (cNum * 3 + 2) % (cat.length || 1);
      const catQ2 = cat[q2Idx];
      const q2Diff = i % 3 === 0 ? 'Medium' : 'Hard';
      items.push({
        id: `contest-${cNum}-q2`,
        contestNumber: cNum,
        contestDateStr: dateStr,
        problemNumber: 2,
        title: catQ2 ? catQ2.title : `Optimal Flow Network on Directed Graph #${cNum}`,
        slug: catQ2 ? catQ2.slug : `optimal-flow-network-${cNum}`,
        difficulty: catQ2 ? catQ2.difficulty : q2Diff,
        points: q2Diff === 'Hard' ? 600 : 500,
        category: catQ2?.category || topicsPool[(cNum + 3) % topicsPool.length],
        companyTags: mockCompanyPool[(cNum + 2) % mockCompanyPool.length],
        submissionsCount: `${Math.floor(9 + (cNum * 1.3) % 20)}K`,
        accuracyRate: `${(32 + (cNum * 1.5) % 24).toFixed(1)}%`,
      });
    }

    return items;
  }, [contestConfig.contestNumber]);

  const filteredContestProblems = useMemo(() => {
    return previousContestProblems.filter((item) => {
      if (difficultyFilter !== 'all' && item.difficulty !== difficultyFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchContest = `arena #${item.contestNumber}`.toLowerCase().includes(q) || String(item.contestNumber).includes(q);
        const matchTag = item.companyTags.some((c) => c.toLowerCase().includes(q)) || item.category.toLowerCase().includes(q);
        const matchDiff = item.difficulty.toLowerCase().includes(q);
        if (!matchTitle && !matchContest && !matchTag && !matchDiff) return false;
      }
      return true;
    });
  }, [previousContestProblems, difficultyFilter, searchQuery]);

  // Lobby vs Arena state: user must explicitly click "Join Weekly Contest" to enter the code editor arena
  const [hasJoinedArena, setHasJoinedArena] = useState<boolean>(() => {
    return searchParams.get('join') === 'true';
  });

  // Anti-Cheat Tracking State & Live Session Recording
  const [tabSwitchesCount, setTabSwitchesCount] = useState<number>(0);
  const [pasteCount, setPasteCount] = useState<number>(0);
  const tabSwitchesRef = useRef<number>(0);
  const pasteRef = useRef<number>(0);
  const lastSwitchTimeRef = useRef<number>(0);
  const contestStartTimeRef = useRef<number>(Date.now());
  const antiCheatLogsRef = useRef<AntiCheatSessionLog[]>([]);

  // Automatic landscape mode for mobile phone coding when inside the live arena
  const { showPrompt, dismissPrompt, lockLandscape, isMobile, isPortrait } = useAutoLandscape({
    enabled: hasJoinedArena,
  });

  // Anti-Cheat Real-Time Listeners (Tab visibility change, Window blur, Clipboard paste)
  useEffect(() => {
    if (!hasJoinedArena) return;

    // Reset tracking metrics upon entering live arena
    contestStartTimeRef.current = Date.now();
    tabSwitchesRef.current = 0;
    pasteRef.current = 0;
    setTabSwitchesCount(0);
    setPasteCount(0);

    const initialLog: AntiCheatSessionLog = {
      timestamp: new Date().toLocaleTimeString(),
      event: 'join',
      details: 'Participant joined live contest arena',
    };
    antiCheatLogsRef.current = [initialLog];

    // Record session start
    if (user) {
      sundayContestService.recordAntiCheatSession(
        user.id,
        {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.profileImage,
          college: (user as any).college,
        },
        {
          tabSwitchesCount: 0,
          pasteCount: 0,
          timeTakenSeconds: 0,
          startedAt: new Date(contestStartTimeRef.current).toISOString(),
          logs: [initialLog],
        }
      );
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const now = Date.now();
        if (now - lastSwitchTimeRef.current < 800) return;
        lastSwitchTimeRef.current = now;

        tabSwitchesRef.current += 1;
        const count = tabSwitchesRef.current;
        setTabSwitchesCount(count);

        const logItem: AntiCheatSessionLog = {
          timestamp: new Date().toLocaleTimeString(),
          event: 'tab_switch',
          details: `Tab / Window switch detected (#${count})`,
        };
        antiCheatLogsRef.current.push(logItem);

        toastError(
          `⚠️ Anti-Cheat Warning: Tab switch #${count} recorded. All window defocus and navigation events are logged for contest integrity review.`,
          'Contest Integrity Alert'
        );

        // Sync live session log
        if (user) {
          sundayContestService.recordAntiCheatSession(
            user.id,
            {
              id: user.id,
              name: user.name,
              email: user.email,
              avatar: user.profileImage,
              college: (user as any).college,
            },
            {
              tabSwitchesCount: tabSwitchesRef.current,
              pasteCount: pasteRef.current,
              timeTakenSeconds: Math.round((Date.now() - contestStartTimeRef.current) / 1000),
              startedAt: new Date(contestStartTimeRef.current).toISOString(),
              logs: [...antiCheatLogsRef.current],
            }
          );
        }
      }
    };

    const handleWindowBlur = () => {
      const now = Date.now();
      if (now - lastSwitchTimeRef.current < 800) return;
      lastSwitchTimeRef.current = now;

      tabSwitchesRef.current += 1;
      const count = tabSwitchesRef.current;
      setTabSwitchesCount(count);

      const logItem: AntiCheatSessionLog = {
        timestamp: new Date().toLocaleTimeString(),
        event: 'tab_switch',
        details: `Window defocus detected (#${count})`,
      };
      antiCheatLogsRef.current.push(logItem);

      toastError(
        `⚠️ Anti-Cheat Warning: Window defocus #${count} recorded. Keep your contest window active during evaluation.`,
        'Contest Integrity Alert'
      );
    };

    const handlePaste = (e: ClipboardEvent) => {
      pasteRef.current += 1;
      const count = pasteRef.current;
      setPasteCount(count);
      const text = e.clipboardData?.getData('text') || '';
      const lineCount = text.split('\n').length;

      const logItem: AntiCheatSessionLog = {
        timestamp: new Date().toLocaleTimeString(),
        event: 'paste',
        details: `Clipboard paste (#${count}): ${lineCount} lines (${text.length} chars)`,
      };
      antiCheatLogsRef.current.push(logItem);

      if (user) {
        sundayContestService.recordAntiCheatSession(
          user.id,
          {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.profileImage,
            college: (user as any).college,
          },
          {
            tabSwitchesCount: tabSwitchesRef.current,
            pasteCount: pasteRef.current,
            timeTakenSeconds: Math.round((Date.now() - contestStartTimeRef.current) / 1000),
            startedAt: new Date(contestStartTimeRef.current).toISOString(),
            logs: [...antiCheatLogsRef.current],
          }
        );
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('paste', handlePaste);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('paste', handlePaste);
    };
  }, [hasJoinedArena, toastError, user]);

  // Active Question (0 = Q1, 1 = Q2)
  const qParam = searchParams.get('q');
  const initialQ = qParam === '2' ? 1 : 0;
  const [activeProblemIdx, setActiveProblemIdx] = useState<0 | 1>(initialQ);

  const currentProblem = contestConfig.problems[activeProblemIdx] || contestConfig.problems[0];

  // Left Panel Tab: 'description' | 'standings' | 'editorial' | 'submissions'
  const [activeLeftTab, setActiveLeftTab] = useState<'description' | 'standings' | 'editorial' | 'submissions'>('description');

  // Code Editor State
  const [selectedLanguage, setSelectedLanguage] = useState<string>(() => {
    return localStorage.getItem('nextera:preferred_language') || 'java';
  });
  const [editorTheme, setEditorTheme] = useState<string>('system');
  const [code, setCode] = useState<string>(() => {
    const defaultLang = localStorage.getItem('nextera:preferred_language') || 'java';
    return getCleanStarterCode(currentProblem, defaultLang);
  });
  const [copied, setCopied] = useState(false);

  // Sliding Output Window Drawer State
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
    coinsAwarded: number;
    isAlreadySolved: boolean;
    hasCompletedBoth: boolean;
    results: { input: string; expected: string; actual: string; passed: boolean }[];
    executionTime?: number;
    memory?: number;
  } | null>(null);

  // Stopwatch Timer State (Practice & Arena Stopwatch)
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(true);

  // User Profile Inspection Modal
  const [selectedProfile, setSelectedProfile] = useState<CoderProfile | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Winner Celebration Modal
  const [isWinnerModalOpen, setIsWinnerModalOpen] = useState(false);

  // Full Leaderboard Pop-up Modal
  const [isFullLeaderboardOpen, setIsFullLeaderboardOpen] = useState(false);

  // Mapped items for FullLeaderboardModal
  const weeklyLeaderboardItems: LeaderboardStudentItem[] = useMemo(() => {
    return (contestConfig.leaderboard || []).map((coder) => ({
      rank: coder.rank,
      userId: coder.userId,
      username: coder.username,
      name: coder.name,
      avatar: coder.avatar,
      college: coder.college,
      badge: coder.badge,
      score: coder.score,
      finishTime: coder.finishTime,
      problemsCleared: coder.problemsSolved,
      totalProblems: 2,
      coinsWon: coder.coinsWon,
      isCurrentUser: user ? coder.userId === user.id : false,
    }));
  }, [contestConfig.leaderboard, user]);

  // 90-minute Contest Countdown Timer
  const [secondsRemaining, setSecondsRemaining] = useState(90 * 60);

  // Split Pane & Editor Preferences
  const [leftPaneWidth, setLeftPaneWidth] = useState<number>(() => {
    const saved = localStorage.getItem('nextera:contest_split_width');
    return saved ? parseFloat(saved) : 45;
  });
  const [isDraggingH, setIsDraggingH] = useState(false);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const rightPaneRef = useRef<HTMLDivElement>(null);

  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('nextera:contest_editor_fontsize');
    return saved ? parseFloat(saved) : 13.5;
  });
  const [tabSize, setTabSize] = useState<number>(() => {
    const saved = localStorage.getItem('nextera:contest_editor_tabsize');
    return saved ? parseInt(saved, 10) : 2;
  });
  const [wordWrap, setWordWrap] = useState<boolean>(() => {
    const saved = localStorage.getItem('nextera:contest_editor_wordwrap');
    return saved === 'true';
  });
  const [showLineNumbers, setShowLineNumbers] = useState<boolean>(() => {
    const saved = localStorage.getItem('nextera:contest_editor_linenumbers');
    return saved !== 'false';
  });
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  const userKey = user?.id || 'current_user_contest';
  const solvedProblems = sundayContestService.getUserSolvedProblemNumbers(userKey);
  const isCurrentSolved = solvedProblems.includes(currentProblem.number);
  const hasCompletedBothSolved = solvedProblems.length >= 2;

  // Live Sunday Countdown Ticker (updates every second)
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Sunday Live Calculation & Next Sunday Countdown
  const countdownInfo = useMemo(() => {
    // Tick triggers recalculation
    void tick;
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const isSundayToday = day === 0;

    let targetDate: Date;

    if (isSundayToday && !hasCompletedBothSolved) {
      // Live Sunday contest active window: runs until 23:59:59 tonight
      targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else {
      // Countdown to Next Sunday 00:00:00 (Starts exact 12:00 AM Midnight)
      const daysUntilNextSunday = isSundayToday ? 7 : (7 - day);
      targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilNextSunday, 0, 0, 0, 0);
    }

    const diffMs = Math.max(0, targetDate.getTime() - now.getTime());
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    const pad = (n: number) => String(n).padStart(2, '0');

    const formattedTarget = targetDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return {
      isSundayToday,
      isLiveNow: isSundayToday && !hasCompletedBothSolved,
      isCompletedToday: isSundayToday && hasCompletedBothSolved,
      days: pad(days),
      hours: pad(hours),
      minutes: pad(minutes),
      seconds: pad(seconds),
      rawDays: days,
      formattedTarget,
    };
  }, [tick, hasCompletedBothSolved]);

  // Sync logged in user profile to CoinService
  useEffect(() => {
    if (user) {
      coinService.syncUserProfile({
        id: user.id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        college: (user as any).college,
        points: user.points,
        learningStreak: user.learningStreak,
        unlockedCoupons: (user as any).unlockedCoupons,
        unlockedCourses: (user as any).unlockedCourses,
        swagOrders: (user as any).swagOrders,
      });
    }
  }, [user]);

  // Subscriptions
  useEffect(() => {
    const unsubCoin = coinService.subscribe(setWallet);
    const unsubContest = sundayContestService.subscribe((cfg) => {
      setContestConfig(cfg);
      const prob = cfg.problems[activeProblemIdx] || cfg.problems[0];
      setCode(getCleanStarterCode(prob, selectedLanguage));
    });
    return () => {
      unsubCoin();
      unsubContest();
    };
  }, [activeProblemIdx, selectedLanguage]);

  // Arena 90-min Timer Countdown
  useEffect(() => {
    if (!hasJoinedArena) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [hasJoinedArena]);

  // Stopwatch interval
  useEffect(() => {
    if (!hasJoinedArena) return;
    let interval: any = null;
    if (isStopwatchRunning) {
      interval = setInterval(() => {
        setStopwatchSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [hasJoinedArena, isStopwatchRunning]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const formatCountdown = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Switch between Q1 and Q2
  const handleSelectProblem = (idx: 0 | 1) => {
    setActiveProblemIdx(idx);
    setSelectedCaseIdx(0);
    setEvaluationResult(null);
    setSearchParams({ q: String(idx + 1), join: 'true' });
    const prob = contestConfig.problems[idx] || contestConfig.problems[0];
    setCode(getCleanStarterCode(prob, selectedLanguage));
  };

  // Language Change
  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    localStorage.setItem('nextera:preferred_language', lang);
    setCode(getCleanStarterCode(currentProblem, lang));
    setEvaluationResult(null);
  };

  // Reset Code Template
  const handleResetCode = () => {
    setCode(getCleanStarterCode(currentProblem, selectedLanguage));
    setEvaluationResult(null);
    success('Code reset to default starter template.');
  };

  // Copy Code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    success('Code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Format Code
  const handleFormatCode = () => {
    try {
      const formatted = formatCode(code, selectedLanguage, tabSize);
      setCode(formatted);
      success('Code formatted successfully!');
    } catch {
      toastError('Could not format code');
    }
  };

  // Restore Last Submitted Code
  const handleRestoreLastSubmittedCode = () => {
    const saved = localStorage.getItem(`nextera:contest_last_submitted:${currentProblem.id}:${selectedLanguage}`);
    if (saved) {
      setCode(saved);
      success('Restored last submitted solution.');
    } else {
      info('No previous submission found for this language.');
    }
  };

  // Run Sample Test Cases (Opens sliding Output Window)
  const handleRunCode = useCallback(async () => {
    if (!isAuthenticated) {
      toastError('Please log in to test and execute your solution in the arena.', 'Login Required');
      return;
    }

    setIsOutputOpen(true);
    setIsOutputMinimized(false);
    setOutputDrawerTab('results');
    setIsRunning(true);

    try {
      const evalRes = await evaluateTestCases(
        selectedLanguage,
        code,
        currentProblem.sampleTestCases,
        currentProblem.slug,
        currentProblem.title
      );

      const sampleResults = evalRes.testCases.map((tc) => ({
        input: tc.input,
        expected: tc.expectedOutput,
        actual: tc.error ? tc.error : tc.actualOutput || 'undefined',
        passed: Boolean(tc.passed),
      }));

      const passedCount = evalRes.testCasesPassed;

      setEvaluationResult({
        allPassed: evalRes.passed,
        passedCount,
        totalCount: currentProblem.sampleTestCases.length,
        coinsAwarded: 0,
        isAlreadySolved: isCurrentSolved,
        hasCompletedBoth: solvedProblems.length >= 2,
        results: sampleResults,
        executionTime: evalRes.executionTime || Math.floor(Math.random() * 30 + 15),
        memory: evalRes.memory || +(Math.random() * 2 + 14.2).toFixed(1),
      });

      if (evalRes.passed) {
        success(`Sample test cases passed (${passedCount}/${currentProblem.sampleTestCases.length})! Click Submit Q${currentProblem.number} to evaluate all hidden cases.`);
      } else {
        toastError(
          evalRes.error
            ? `Execution Error: ${evalRes.error}`
            : `Wrong Answer: ${passedCount}/${currentProblem.sampleTestCases.length} sample cases passed. Check output drawer.`
        );
      }
    } catch (runErr: any) {
      toastError(`Execution failed: ${runErr.message || 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  }, [code, currentProblem, selectedLanguage, isCurrentSolved, solvedProblems.length, isAuthenticated, success, toastError]);

  // Submit Solution (Opens sliding Output Window & Evaluates Sample + Hidden Test Cases)
  const handleSubmitCode = useCallback(async () => {
    if (!isAuthenticated) {
      toastError('Authentication Required: Please log in or create an account to submit your solution and compete in the contest arena.', 'Login Required');
      return;
    }

    setIsOutputOpen(true);
    setIsOutputMinimized(false);
    setOutputDrawerTab('results');
    const elapsedSeconds = Math.max(1, Math.round((Date.now() - contestStartTimeRef.current) / 1000));
    const antiCheatPayload = {
      tabSwitchesCount: tabSwitchesRef.current,
      pasteCount: pasteRef.current,
      timeTakenSeconds: elapsedSeconds,
      startedAt: new Date(contestStartTimeRef.current).toISOString(),
      submittedAt: new Date().toISOString(),
      logs: [...antiCheatLogsRef.current],
    };

    try {
      const evalRes = await sundayContestService.evaluateProblemSubmission(
        currentProblem.number,
        code,
        selectedLanguage,
        userKey,
        user
          ? {
              id: user.id,
              name: user.name,
              email: user.email,
              avatar: user.profileImage,
              college: (user as any).college,
            }
          : undefined,
        antiCheatPayload
      );

      if (evalRes.antiCheatVerdict?.status === 'Flagged') {
        toastError(
          `⚠️ Integrity Notice: ${evalRes.antiCheatVerdict.reason}. Your submission has been flagged for admin anti-cheat review.`,
          'Plagiarism / Cheat Detection'
        );
      }

      setEvaluationResult({
        ...evalRes,
        executionTime: Math.floor(Math.random() * 35 + 20),
        memory: +(Math.random() * 3 + 15.1).toFixed(1),
      });
      localStorage.setItem(`nextera:contest_last_submitted:${currentProblem.id}:${selectedLanguage}`, code);

      if (evalRes.allPassed) {
        if (evalRes.isAlreadySolved) {
          info(`Accepted! You have already solved Q${currentProblem.number} in this contest.`);
        } else if (evalRes.hasCompletedBoth) {
          // Solved BOTH 2 problems => Grand 100 Coins Bounty Awarded!
          success(`🎉 CONTEST COMPLETED! Both Q1 and Q2 solved with 100% test cases passed! +100 NEC Coins credited to your wallet!`, 'Grand Champion 🏆');
          setIsWinnerModalOpen(true);
          await coinService.fetchLiveWallet();
          dispatch(checkAuth());
        } else {
          // Solved 1 of 2 problems => Prompt to solve the other
          const otherQ = currentProblem.number === 1 ? 2 : 1;
          success(`🎉 Q${currentProblem.number} Accepted! 100% test cases passed! Now solve Q${otherQ} and submit to claim your 100 NEC Coins bounty!`);
          await coinService.fetchLiveWallet();
          dispatch(checkAuth());
        }
      } else {
        toastError(
          `Wrong Answer: ${evalRes.passedCount}/${evalRes.totalCount} test cases passed. You must pass 100% of all test cases and submit your code to earn coins.`,
          'Evaluation Incomplete'
        );
      }
    } catch (e: any) {
      toastError(e.message || 'Submission evaluation failed.');
    } finally {
      setIsSubmitting(false);
    }
  }, [code, currentProblem, selectedLanguage, userKey, user, isAuthenticated, success, toastError, info, dispatch]);

  // Open Custom Input in Output Window
  const handleOpenCustomInput = () => {
    setIsOutputOpen(true);
    setIsOutputMinimized(false);
    setOutputDrawerTab('custom');
  };

  // Open profile modal directly on row/avatar click
  const handleOpenProfile = (profile: CoderProfile) => {
    setSelectedProfile(profile);
    setIsProfileModalOpen(true);
  };

  // Drag resizer handlers
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
      localStorage.setItem('nextera:contest_split_width', String(newPercent));
    };

    const handleMouseUp = () => {
      setIsDraggingH(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Close settings popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    if (isSettingsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSettingsOpen]);

  // Escape key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen]);

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

  const lineCount = code.split('\n').length || 1;

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#121212] flex items-center justify-center text-slate-600 dark:text-neutral-400 font-mono text-sm">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span>Verifying arena session...</span>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 1: WEEKLY CONTEST LOBBY / HUB OVERVIEW (When not joined arena)
  // =========================================================================
  if (!hasJoinedArena) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0d0e14] text-slate-800 dark:text-neutral-200 selection:bg-amber-500/30 selection:text-amber-700 dark:selection:text-amber-200 transition-colors duration-200">
        {/* Modals */}
        <WinnerCelebrationModal
          isOpen={isWinnerModalOpen}
          onClose={() => setIsWinnerModalOpen(false)}
          contestTitle={contestConfig.title}
          rank={1}
          coinsAwarded={contestConfig.coinsPrize}
        />
        <UserProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          profile={selectedProfile}
        />

        {/* FULL LEADERBOARD POPUP MODAL */}
        <FullLeaderboardModal
          isOpen={isFullLeaderboardOpen}
          onClose={() => setIsFullLeaderboardOpen(false)}
          type="weekly"
          title={`Weekly Contest #${contestConfig.contestNumber} Standings`}
          subtitle={`Viewing all ${weeklyLeaderboardItems.length} participants & scoreboard`}
          students={weeklyLeaderboardItems}
          currentUserId={user?.id}
          onSelectStudent={(student) => {
            const original = contestConfig.leaderboard.find((c) => c.userId === student.userId);
            if (original) handleOpenProfile(original);
          }}
        />

        {/* Top Navbar */}
        <header className="h-14 bg-white/95 dark:bg-[#111215]/95 backdrop-blur-md border-b border-slate-200/90 dark:border-neutral-800/90 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 font-mono text-xs shadow-xs">
          <div className="flex items-center gap-3">
            <Link
              to={ROUTES.PRACTICE}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-slate-700 hover:text-slate-900 dark:text-neutral-300 dark:hover:text-white border border-slate-200 dark:border-neutral-800 transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
            >
              <ChevronLeft className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <span className="font-semibold">DSA Practice</span>
            </Link>
            <div className="h-4 w-px bg-slate-200 dark:bg-neutral-800 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold">
              <Trophy className="w-4 h-4" />
              <span>Weekly Contest #{contestConfig.contestNumber}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Wallet Pill */}
            <Link
              to={ROUTES.REWARDS}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-[#16171d] hover:bg-slate-50 dark:hover:bg-[#1d1f26] border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-all shadow-xs active:scale-95"
              title="Your NEC Coins Wallet"
            >
              <span>🪙</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">{wallet.coins} Coins</span>
            </Link>

            {/* Streak */}
            <div
              className="hidden sm:flex items-center gap-1.5 text-orange-600 dark:text-orange-400 bg-white/90 dark:bg-[#16171d] px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs font-semibold shadow-xs"
              title="Daily Coding Streak"
            >
              <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
              <span>{wallet.dailyStreak}d Streak</span>
            </div>

            {/* Theme Toggle */}
            <ThemeToggle compact />

            {/* Top Quick Join Button */}
            <button
              type="button"
              onClick={() => setHasJoinedArena(true)}
              className="h-8.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 active:scale-95 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-sm shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-slate-950" />
              <span>Join Contest</span>
            </button>
          </div>
        </header>

        {/* Main Hub Container (Expanded to max-w-7xl) */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-7">
          
          {/* 1. COMPACT & WIDE HERO BANNER (HORIZONTAL 2-COLUMN LAYOUT) */}
          <div className="relative rounded-3xl p-6 sm:p-8 bg-white/95 dark:bg-[#111319]/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/80 shadow-xl shadow-slate-200/30 dark:shadow-black/50 transition-all overflow-hidden group">
            {/* Top Gradient Accent Line */}
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-400" />

            {/* Ambient Background Glows */}
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-amber-500/10 dark:bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-orange-500/10 dark:bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
              
              {/* Left Column (Span 7): Title, Subtitle & Action */}
              <div className="lg:col-span-7 space-y-4">
                
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500/15 to-orange-500/15 dark:from-amber-500/20 dark:to-orange-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 shadow-xs">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  <span>Sunday Grand Championship • #{contestConfig.contestNumber}</span>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                    NextEra Weekly <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 bg-clip-text text-transparent">Algorithmic Arena</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal max-w-xl">
                    Compete with top developers across India every Sunday. Solve 2 challenging algorithmic problems, pass 100% of test cases, and claim your guaranteed <strong className="text-amber-600 dark:text-amber-400 font-semibold">100 NEC Pure Coins</strong> bounty!
                  </p>
                </div>

                {/* CTA Action & Meta */}
                <div className="pt-1 flex flex-col sm:flex-row sm:items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setHasJoinedArena(true)}
                    className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 active:scale-[0.99] text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:-translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2.5 group/btn"
                  >
                    <Play className="w-4 h-4 fill-slate-950 group-hover/btn:scale-110 transition-transform" />
                    <span>Join Contest</span>
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 font-medium text-slate-700 dark:text-slate-300">
                    <Zap className="w-3.5 h-3.5 text-amber-500" /> Instant Test Runner
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 font-medium text-slate-700 dark:text-slate-300">
                    <Code2 className="w-3.5 h-3.5 text-blue-500" /> 2 Questions
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 font-medium text-slate-700 dark:text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-emerald-500" /> 90 Minutes Time Limit
                  </span>
                </div>
              </div>

              {/* Right Column (Span 5): Live Countdown & Rules Card */}
              <div className="lg:col-span-5">
                <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-50/80 to-orange-500/5 dark:from-amber-500/15 dark:via-[#161820] dark:to-orange-950/30 border border-amber-500/30 dark:border-amber-500/25 p-5 sm:p-6 space-y-4 shadow-md backdrop-blur-sm">
                  
                  {/* Countdown Card Header */}
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-200/80 dark:border-slate-700/60">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        {countdownInfo.isLiveNow ? '🔴 CONTEST IS LIVE NOW' : countdownInfo.isCompletedToday ? '✅ CHALLENGE COMPLETED' : '⏳ CONTEST STARTS IN'}
                      </span>
                    </div>
                    <div className="text-[11px] font-medium text-amber-800 dark:text-amber-300 bg-amber-500/15 px-2.5 py-1 rounded-lg border border-amber-500/30 shadow-2xs">
                      Target: {countdownInfo.formattedTarget}
                    </div>
                  </div>

                  {/* 4 Digit Cards (Days, Hours, Mins, Secs) */}
                  <div className="grid grid-cols-4 gap-2.5">
                    <div className="flex flex-col items-center justify-center py-3 px-2 rounded-xl bg-white dark:bg-[#1a1c24] border border-slate-200/90 dark:border-slate-700/70 shadow-xs">
                      <span className="font-mono text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                        {countdownInfo.days}
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">Days</span>
                    </div>

                    <div className="flex flex-col items-center justify-center py-3 px-2 rounded-xl bg-white dark:bg-[#1a1c24] border border-slate-200/90 dark:border-slate-700/70 shadow-xs">
                      <span className="font-mono text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                        {countdownInfo.hours}
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">Hours</span>
                    </div>

                    <div className="flex flex-col items-center justify-center py-3 px-2 rounded-xl bg-white dark:bg-[#1a1c24] border border-slate-200/90 dark:border-slate-700/70 shadow-xs">
                      <span className="font-mono text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                        {countdownInfo.minutes}
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">Mins</span>
                    </div>

                    <div className="flex flex-col items-center justify-center py-3 px-2 rounded-xl bg-white dark:bg-[#1a1c24] border border-slate-200/90 dark:border-slate-700/70 shadow-xs">
                      <span className="font-mono text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
                        {countdownInfo.seconds}
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">Secs</span>
                    </div>
                  </div>

                  {/* Sunday Special Rules Info */}
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/70 dark:bg-black/30 border border-amber-500/25 text-amber-950 dark:text-amber-200 text-xs leading-relaxed">
                    <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="font-bold text-slate-900 dark:text-white">Sunday Rule:</strong> Coins (+100 🪙) are awarded to coders who solve both questions with 100% test cases passed on Sunday.
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* 2. CONTEST PROBLEM SET & REWARDS BREAKDOWN (3 INTERACTIVE CARDS) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1: Problems Lineup */}
            <div className="p-6 rounded-2xl bg-white/95 dark:bg-[#12141a]/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/80 hover:border-amber-500/40 dark:hover:border-amber-500/30 hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-1 transition-all duration-300 space-y-4 shadow-sm group relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/0 to-transparent group-hover:via-amber-500/50 transition-all duration-500" />
              
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-500/15 dark:from-amber-500/20 dark:to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm shadow-amber-500/10">
                <Code2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Problems Lineup</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold border border-amber-500/25">
                    {contestConfig.problems[0]?.difficulty} + {contestConfig.problems[1]?.difficulty}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Balanced mixed algorithmic challenges (never identical difficulty) for high-stakes competition.
                </p>
              </div>

              <div className="space-y-2.5 pt-1">
                {contestConfig.problems.map((p, idx) => (
                  <div key={p.id} className="p-3 rounded-xl bg-slate-50/90 dark:bg-[#191b22] border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <span className="text-slate-900 dark:text-white font-bold text-xs sm:text-sm block truncate">Q{idx + 1}. {p.title}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn(
                          'text-[10.5px] px-2 py-0.5 rounded-md font-bold',
                          p.difficulty === 'Easy' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30' :
                          p.difficulty === 'Medium' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30' :
                          'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                        )}>
                          {p.difficulty}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">&bull; {p.points || (p.difficulty === 'Easy' ? 300 : p.difficulty === 'Medium' ? 400 : 600)} Points</span>
                      </div>
                    </div>
                    {solvedProblems.includes(p.number) ? (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1 shrink-0 shadow-2xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Solved
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-medium shrink-0 border border-slate-200/80 dark:border-slate-700/60">
                        Unsolved
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Card 2: 100 Pure Coins Bounty */}
            <div className="p-6 rounded-2xl bg-white/95 dark:bg-[#12141a]/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/80 hover:border-amber-500/40 dark:hover:border-amber-500/30 hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-1 transition-all duration-300 space-y-4 shadow-sm group relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/0 to-transparent group-hover:via-amber-500/50 transition-all duration-500" />

              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-500/15 dark:from-amber-500/20 dark:to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm shadow-amber-500/10">
                <Gift className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Grand Coin Rewards</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-bold">+100 🪙</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Pass all test cases on Sunday to trigger instant wallet coin credit.
                </p>
              </div>

              <div className="space-y-2.5 pt-1 text-xs">
                <div className="p-3 rounded-xl bg-slate-50/90 dark:bg-[#191b22] border border-slate-200/80 dark:border-slate-800/80 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-base shrink-0">
                    🪙
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">100 NEC Coins Bounty</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Awarded for solving both Q1 & Q2</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50/90 dark:bg-[#191b22] border border-slate-200/80 dark:border-slate-800/80 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-base shrink-0">
                    🏆
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Championship Certificate</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Official verified credential & badge</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50/90 dark:bg-[#191b22] border border-slate-200/80 dark:border-slate-800/80 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-base shrink-0">
                    🎒
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Swag Store Redemption</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Exchange coins for backpacks & t-shirts</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Rules & Anti-Cheat */}
            <div className="p-6 rounded-2xl bg-white/95 dark:bg-[#12141a]/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/80 hover:border-amber-500/40 dark:hover:border-amber-500/30 hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-1 transition-all duration-300 space-y-4 shadow-sm group relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/0 to-transparent group-hover:via-amber-500/50 transition-all duration-500" />

              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-500/15 dark:from-amber-500/20 dark:to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm shadow-amber-500/10">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Arena Guidelines</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30 font-bold">Fair Play</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Strict evaluation standards with automated hidden test cases.
                </p>
              </div>

              <div className="space-y-2.5 pt-1 text-xs">
                <div className="p-3 rounded-xl bg-slate-50/90 dark:bg-[#191b22] border border-slate-200/80 dark:border-slate-800/80 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Code2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Multi-Language Support</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">C++, Java, Python, JavaScript, TypeScript</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50/90 dark:bg-[#191b22] border border-slate-200/80 dark:border-slate-800/80 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">100% Testcases Pass</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Sample & hidden test cases evaluation</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50/90 dark:bg-[#191b22] border border-slate-200/80 dark:border-slate-800/80 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Live Leaderboard</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Real-time ranking based on solve time & score</div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* 3. PREVIOUS CONTEST PROBLEMS (LEFT 8) & STICKY HALL OF FAME + RULEBOOK (RIGHT 4) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-7 items-start">
            
            {/* Left: Previous Contest Problems */}
            <div className="lg:col-span-8 space-y-4">
              
              {/* Header with Search & Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <span>Previous Contest Problems</span>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-200/80 dark:border-slate-700/60">
                      {filteredContestProblems.length} challenges
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
                    Past Weekly Arena championship challenges. Practice under real competition conditions.
                  </p>
                </div>

                {/* Filter & Search */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <select
                      value={difficultyFilter}
                      onChange={(e) => setDifficultyFilter(e.target.value as any)}
                      className="text-xs font-semibold py-2 px-3 pr-8 rounded-xl bg-white dark:bg-[#15171d] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    >
                      <option value="all">All Difficulties</option>
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search title, tag, Arena #..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="text-xs font-medium py-2 pl-8 pr-3 rounded-xl bg-white dark:bg-[#15171d] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 w-full sm:w-60"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              {/* Problem List Items */}
              <div className="space-y-3.5">
                {filteredContestProblems.map((item) => (
                  <div
                    key={item.id}
                    className="group p-5 sm:p-6 rounded-2xl border bg-white/95 dark:bg-[#12141a]/95 hover:bg-slate-50/90 dark:hover:bg-[#161822] border-slate-200/90 dark:border-slate-800/80 hover:border-amber-500/40 dark:hover:border-amber-500/30 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-2.5 min-w-0 flex-1">
                      <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                        {/* Contest Pill */}
                        <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold text-xs border border-amber-500/25">
                          Weekly Arena #{item.contestNumber}
                        </span>

                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-slate-700">
                          Q{item.problemNumber}
                        </span>

                        <span>&bull;</span>

                        <span className="font-medium text-slate-600 dark:text-slate-300 text-xs">
                          {item.contestDateStr}
                        </span>

                        <span>&bull;</span>

                        <span
                          className={cn(
                            'px-2.5 py-0.5 rounded-lg text-xs font-bold border',
                            item.difficulty === 'Easy'
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                              : item.difficulty === 'Medium'
                              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                              : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30'
                          )}
                        >
                          {item.difficulty}
                        </span>

                        <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold">
                          +{item.points} Pts
                        </span>
                      </div>

                      <h4
                        onClick={() => navigate(`/dsa/${encodeURIComponent(item.slug)}`)}
                        className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors cursor-pointer truncate"
                      >
                        {item.title}
                      </h4>

                      <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                        <span className="text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200/80 dark:border-slate-700/60">
                          {item.category}
                        </span>

                        {item.companyTags.map((company) => (
                          <span
                            key={company}
                            className="text-xs px-2.5 py-1 rounded-lg bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 font-medium"
                          >
                            {company}
                          </span>
                        ))}

                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 ml-auto sm:ml-0 font-medium">
                          <span>{item.submissionsCount} submissions</span>
                          <span>&bull;</span>
                          <span>{item.accuracyRate} accuracy</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/dsa/${encodeURIComponent(item.slug)}`)}
                        className="py-2.5 px-4 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 bg-slate-100 hover:bg-gradient-to-r hover:from-amber-500 hover:to-orange-500 hover:text-slate-950 text-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:text-slate-950 border border-slate-200 dark:border-slate-700 shadow-xs"
                      >
                        <span>Solve Challenge</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {filteredContestProblems.length === 0 && (
                  <div className="p-8 rounded-2xl bg-white dark:bg-[#141518] border border-slate-200 dark:border-neutral-800 text-center space-y-2">
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                      No previous contest problems matched your filter.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setDifficultyFilter('all');
                      }}
                      className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                    >
                      Reset all filters
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Sticky Sidebar (Championship Hall of Fame & NEC Contest Rulebook) */}
            <div className="lg:col-span-4 lg:sticky lg:top-20 space-y-5 self-start max-h-[calc(100vh-5.5rem)] overflow-y-auto pr-1">
              
              {/* 1. Championship Hall of Fame */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white/95 dark:bg-[#12141a]/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/80 shadow-md space-y-4">
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/10">
                      <Trophy className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                        Hall of Fame
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Top Previous Champions
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsFullLeaderboardOpen(true)}
                    className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 flex items-center gap-0.5 cursor-pointer font-bold"
                    title="Open Full Leaderboard Pop-up"
                  >
                    <span>Full Standings</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Top 3 Champions List */}
                <div className="space-y-2.5">
                  {contestConfig.leaderboard.slice(0, 3).map((coder, idx) => {
                    const rankIcons = ['🥇', '🥈', '🥉'];
                    const rankGlows = [
                      'bg-amber-500/10 border-amber-500/30',
                      'bg-slate-100 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700',
                      'bg-orange-500/10 border-orange-500/30',
                    ];

                    return (
                      <div
                        key={coder.userId}
                        onClick={() => handleOpenProfile(coder)}
                        className={cn(
                          'p-3 rounded-xl border hover:border-amber-500/40 transition-all cursor-pointer flex items-center gap-3 group active:scale-98',
                          rankGlows[idx] || 'bg-slate-50/90 dark:bg-[#191b22] border-slate-200/80 dark:border-slate-800/80'
                        )}
                      >
                        {/* Rank Badge */}
                        <span className="text-base shrink-0">
                          {rankIcons[idx] || `#${idx + 1}`}
                        </span>

                        {/* Avatar */}
                        <img
                          src={coder.avatar}
                          alt={coder.name}
                          className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 shadow-xs"
                        />

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-slate-900 dark:text-white text-xs truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                              {coder.name}
                            </span>
                            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 shrink-0">
                              +{coder.coinsWon} 🪙
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                            <span className="truncate max-w-[130px]">{coder.college}</span>
                            <span className="shrink-0 text-slate-500 dark:text-slate-400 font-medium">Score: {coder.score}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Open Full Modal Button */}
                <button
                  type="button"
                  onClick={() => setIsFullLeaderboardOpen(true)}
                  className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 text-amber-700 dark:text-amber-400 font-bold text-xs border border-amber-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>View All {weeklyLeaderboardItems.length} in Pop-up</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              {/* 2. NEC Contest Rulebook */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white/95 dark:bg-[#12141a]/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/80 shadow-md space-y-4">
                
                {/* Header */}
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/10">
                    <BookOpen className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                      NEC Contest Rulebook
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Official rules & scoring system
                    </p>
                  </div>
                </div>

                {/* Rules list */}
                <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold flex items-center justify-center shrink-0 text-xs mt-0.5 border border-amber-500/30">
                      1
                    </span>
                    <span>
                      <strong className="text-slate-900 dark:text-white">Sunday Championship:</strong> Every Sunday at 12:00 AM, 2 fresh problems unlock with a 90-minute arena countdown.
                    </span>
                  </li>

                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold flex items-center justify-center shrink-0 text-xs mt-0.5 border border-amber-500/30">
                      2
                    </span>
                    <span>
                      <strong className="text-slate-900 dark:text-white">+100 Coins Reward:</strong> Submit both solutions with <strong className="text-amber-600 dark:text-amber-400">100% test cases passed</strong> to claim 100 NEC Pure Coins.
                    </span>
                  </li>

                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold flex items-center justify-center shrink-0 text-xs mt-0.5 border border-amber-500/30">
                      3
                    </span>
                    <span>
                      <strong className="text-slate-900 dark:text-white">Zero Plagiarism:</strong> Automated anti-cheat inspects submissions. Unfair means cause disqualification.
                    </span>
                  </li>

                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold flex items-center justify-center shrink-0 text-xs mt-0.5 border border-amber-500/30">
                      4
                    </span>
                    <span>
                      <strong className="text-slate-900 dark:text-white">Streak Safeguard:</strong> Solving Sunday challenges maintains your continuous learning streak.
                    </span>
                  </li>
                </ul>

                {/* Instant Credit Callout Box */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2.5">
                  <span className="text-base">🪙</span>
                  <span>Coins credited automatically to your wallet upon verification.</span>
                </div>

              </div>
            </div>

          </div>

          {/* 4. FOOTER CTA */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-500/10 via-white to-orange-500/10 dark:from-amber-500/15 dark:via-[#13151c] dark:to-orange-950/25 border border-amber-500/30 dark:border-amber-500/25 flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left shadow-lg shadow-amber-500/5">
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">Ready to take on the championship?</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Join the arena, solve both challenges within 90 minutes, and secure your place in the hall of fame.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setHasJoinedArena(true)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-amber-500/20 transition-all cursor-pointer shrink-0"
            >
              <span>Enter Weekly Arena</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </main>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: FULL CODE EDITOR ARENA (When user has clicked Join Contest)
  // =========================================================================
  return (
    <div className="fixed inset-0 h-screen w-screen flex flex-col bg-slate-100 dark:bg-[#121212] text-slate-900 dark:text-neutral-200 antialiased select-none overflow-hidden font-sans z-10">
      
      {/* 1. WINNER CELEBRATION MODAL (3D Golden Coin) */}
      <WinnerCelebrationModal
        isOpen={isWinnerModalOpen}
        onClose={() => setIsWinnerModalOpen(false)}
        contestTitle={contestConfig.title}
        rank={1}
        coinsAwarded={contestConfig.coinsPrize}
      />

      {/* 2. CODER PROFILE INSPECTION MODAL */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={selectedProfile}
      />

      {/* 2.5 FULL LEADERBOARD POPUP MODAL */}
      <FullLeaderboardModal
        isOpen={isFullLeaderboardOpen}
        onClose={() => setIsFullLeaderboardOpen(false)}
        type="weekly"
        title={`Weekly Contest #${contestConfig.contestNumber} Standings`}
        subtitle={`Viewing all ${weeklyLeaderboardItems.length} participants & scoreboard`}
        students={weeklyLeaderboardItems}
        currentUserId={user?.id}
        onSelectStudent={(student) => {
          const original = contestConfig.leaderboard.find((c) => c.userId === student.userId);
          if (original) handleOpenProfile(original);
        }}
      />

      {/* 3. TOP LEETCODE / GFG STYLE NAVBAR HEADER */}
      <header className="h-12 bg-white dark:bg-[#1a1a1a] border-b border-slate-200 dark:border-neutral-800 px-3 sm:px-4 flex items-center justify-between shrink-0 z-20 text-xs font-mono">
        
        {/* Left: Back to Lobby & Arena Title */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setHasJoinedArena(false)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#2a2a2a] text-amber-600 dark:text-amber-400 hover:text-amber-500 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Return to Weekly Contest Lobby & Rules"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="font-semibold text-amber-600 dark:text-amber-400">Contest Lobby</span>
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-neutral-800" />

          <span className="font-bold text-slate-800 dark:text-neutral-300 flex items-center gap-1.5 text-xs">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Weekly Arena #{contestConfig.contestNumber}</span>
          </span>
        </div>

        {/* Center: Q1 / Q2 Switcher with Difficulty & Verified Checkmarks */}
        <div className="flex items-center gap-1.5">
          {contestConfig.problems.map((prob, idx) => {
            const isSolved = solvedProblems.includes(prob.number);
            const isActive = activeProblemIdx === idx;
            return (
              <button
                key={prob.id}
                type="button"
                onClick={() => handleSelectProblem(idx as 0 | 1)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer border',
                  isActive
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm shadow-amber-500/30'
                    : 'bg-slate-100 dark:bg-[#222222] text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#2a2a2a] border-slate-300 dark:border-neutral-700/80'
                )}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Q{prob.number}</span>
                <span
                  className={cn(
                    'px-1.5 py-0.2 rounded text-[10px] uppercase font-bold',
                    isActive
                      ? 'bg-slate-950/30 text-slate-950 font-black'
                      : prob.difficulty === 'Easy'
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      : prob.difficulty === 'Medium'
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                      : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                  )}
                >
                  {prob.difficulty}
                </span>
                {isSolved && (
                  <span title="Solved & Submitted ✓">
                    <CheckCircle2
                      className={cn('w-3.5 h-3.5 stroke-[2.5]', isActive ? 'text-blue-950' : 'text-sky-500 dark:text-sky-400')}
                    />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right: 90-min Live Countdown Timer, Stopwatch & Live Wallet */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live Remaining Contest Timer */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-mono font-bold animate-pulse"
            title="Contest Time Remaining"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{formatCountdown(secondsRemaining)}</span>
          </div>

          {/* Anti-Cheat Real-Time Status Badge */}
          <div
            className={cn(
              'hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium border transition-colors',
              tabSwitchesCount === 0
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                : tabSwitchesCount < 4
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
                : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400 font-bold animate-pulse'
            )}
            title={`Anti-Cheat System Active • Tab Switches: ${tabSwitchesCount} • Code Pastes: ${pasteCount}`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Anti-Cheat:</span>
            <span>
              {tabSwitchesCount === 0 ? 'Protected' : `${tabSwitchesCount} ${tabSwitchesCount === 1 ? 'Switch' : 'Switches'}`}
            </span>
          </div>

          {/* Stopwatch */}
          <div
            onClick={() => setIsStopwatchRunning(!isStopwatchRunning)}
            className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-[#2a2a2a] text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200 cursor-pointer transition-colors"
            title="Stopwatch timer"
          >
            <Timer className={cn('w-3.5 h-3.5', isStopwatchRunning ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400 dark:text-neutral-500')} />
            <span className="text-xs font-mono">{formatTimer(stopwatchSeconds)}</span>
          </div>

          {/* Coins Wallet Pill */}
          <Link
            to={ROUTES.REWARDS}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-mono font-bold transition-all shadow-xs active:scale-95"
            title="Your NEC Coins Wallet"
          >
            <span>🪙</span>
            <span>{wallet.coins}</span>
          </Link>

          {/* Theme Toggle */}
          <ThemeToggle compact />
        </div>
      </header>

      {/* 4. MAIN SPLIT PANE WORKSPACE (Left: Description/Standings/Editorial | Right: Code Editor & Output) */}
      <div ref={workspaceRef} className="flex-1 flex overflow-hidden relative p-1.5 gap-1.5 bg-slate-100 dark:bg-[#121212]">
        
        {/* ========================================================================= */}
        {/* LEFT PANEL: Description / Standings / Editorial / Submissions */}
        {/* ========================================================================= */}
        <div
          style={{ width: `${leftPaneWidth}%` }}
          className="h-full flex flex-col bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-neutral-800 overflow-hidden shrink-0 shadow-sm relative"
        >
          {/* Left Panel Tabs Header */}
          <div className="h-10 bg-slate-50 dark:bg-[#222222] border-b border-slate-200 dark:border-neutral-800 px-2 flex items-center justify-between text-xs font-mono shrink-0">
            <div className="flex items-center gap-1">
              {/* Problem Description Tab */}
              <button
                type="button"
                onClick={() => setActiveLeftTab('description')}
                className={cn(
                  'px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer',
                  activeLeftTab === 'description'
                    ? 'bg-white dark:bg-[#2e2e2e] text-amber-600 dark:text-amber-400 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#282828]'
                )}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Description</span>
              </button>

              {/* Standings / Leaderboard Tab */}
              <button
                type="button"
                onClick={() => setActiveLeftTab('standings')}
                className={cn(
                  'px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer',
                  activeLeftTab === 'standings'
                    ? 'bg-white dark:bg-[#2e2e2e] text-amber-600 dark:text-amber-400 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#282828]'
                )}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Standings</span>
              </button>

              {/* Editorial / Hints Tab */}
              <button
                type="button"
                onClick={() => setActiveLeftTab('editorial')}
                className={cn(
                  'px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer',
                  activeLeftTab === 'editorial'
                    ? 'bg-white dark:bg-[#2e2e2e] text-amber-600 dark:text-amber-400 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#282828]'
                )}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Editorial</span>
              </button>

              {/* Submissions Tab */}
              <button
                type="button"
                onClick={() => setActiveLeftTab('submissions')}
                className={cn(
                  'px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer',
                  activeLeftTab === 'submissions'
                    ? 'bg-white dark:bg-[#2e2e2e] text-amber-600 dark:text-amber-400 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#282828]'
                )}
              >
                <History className="w-3.5 h-3.5" />
                <span>Submissions</span>
              </button>
            </div>

            <span className="text-[11px] text-slate-500 dark:text-neutral-500 hidden sm:inline">
              Points: {currentProblem.points}
            </span>
          </div>

          {/* Left Panel Tab Content (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-slate-700 dark:text-neutral-300 text-sm leading-relaxed">
            
            {/* 1. DESCRIPTION TAB */}
            {activeLeftTab === 'description' && (
              <div className="space-y-6 font-sans">
                {/* Title & Badges */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                      Q{currentProblem.number}. {currentProblem.title}
                    </h2>
                    {isCurrentSolved && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Solved
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-md font-bold',
                        currentProblem.difficulty === 'Easy'
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : currentProblem.difficulty === 'Medium'
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                      )}
                    >
                      {currentProblem.difficulty}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 border border-slate-200 dark:border-neutral-700">
                      Score: {currentProblem.points} pts
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 border border-slate-200 dark:border-neutral-700">
                      Sunday Contest #{contestConfig.contestNumber}
                    </span>
                  </div>
                </div>

                {/* Problem Statement Body */}
                <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-neutral-300 text-sm space-y-4">
                  <div className="whitespace-pre-line leading-relaxed">
                    {currentProblem.description}
                  </div>
                </div>

                {/* Sample Test Cases (Examples) */}
                <div className="space-y-4 pt-2">
                  <h3 className="text-sm font-bold font-mono text-slate-900 dark:text-neutral-200 uppercase tracking-wider">
                    Examples & Test Cases
                  </h3>

                  {currentProblem.sampleTestCases.map((tc, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#222222] border border-slate-200 dark:border-neutral-800 font-mono text-xs space-y-2"
                    >
                      <span className="text-amber-600 dark:text-amber-400 font-bold block">Example {idx + 1}:</span>
                      <div className="space-y-1">
                        <div>
                          <span className="text-slate-500 dark:text-neutral-500">Input: </span>
                          <span className="text-slate-800 dark:text-neutral-200">{tc.input}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-neutral-500">Output: </span>
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
                {currentProblem.constraints && currentProblem.constraints.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h3 className="text-sm font-bold font-mono text-slate-900 dark:text-neutral-200 uppercase tracking-wider">
                      Constraints
                    </h3>
                    <ul className="space-y-1 font-mono text-xs text-slate-600 dark:text-neutral-400 list-disc list-inside">
                      {currentProblem.constraints.map((c, i) => (
                        <li key={i} className="text-slate-700 dark:text-neutral-300">{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* 2. STANDINGS (LEADERBOARD) TAB */}
            {activeLeftTab === 'standings' && (
              <div className="space-y-4 font-mono">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-neutral-800">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      <span>Live Contest Standings</span>
                    </h3>
                    <span className="text-xs text-slate-500 dark:text-neutral-500">
                      Ranked by score and finish time. Click any coder to inspect their full profile.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsFullLeaderboardOpen(true)}
                    className="py-1.5 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs border border-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                    title="Open in center screen popup"
                  >
                    <span>Full Screen Modal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Leaderboard Table */}
                <div className="divide-y divide-slate-200 dark:divide-neutral-800 border border-slate-200 dark:border-neutral-800 rounded-xl bg-slate-50 dark:bg-[#222222] overflow-hidden text-xs">
                  {contestConfig.leaderboard.map((coder) => (
                    <div
                      key={coder.userId}
                      onClick={() => handleOpenProfile(coder)}
                      className="p-3 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            'w-6 h-6 rounded-full font-bold flex items-center justify-center text-xs',
                            coder.rank === 1
                              ? 'bg-amber-500 text-slate-950 font-black'
                              : coder.rank === 2
                              ? 'bg-slate-300 text-slate-950 font-black'
                              : coder.rank === 3
                              ? 'bg-amber-700 text-white font-bold'
                              : 'bg-slate-200 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400'
                          )}
                        >
                          {coder.rank}
                        </span>

                        <img
                          src={coder.avatar}
                          alt={coder.name}
                          className="w-8 h-8 rounded-lg object-cover border border-slate-300 dark:border-neutral-700"
                        />

                        <div>
                          <span className="font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors block">
                            {coder.name}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-neutral-500 block truncate max-w-[180px]">
                            {coder.college}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-amber-600 dark:text-amber-400 font-bold block">{coder.score} pts</span>
                        <span className="text-[11px] text-slate-500 dark:text-neutral-400 block">{coder.finishTime}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. EDITORIAL TAB */}
            {activeLeftTab === 'editorial' && (
              <div className="space-y-4 font-sans text-sm">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-500" />
                  <span>Hints & Algorithmic Clues</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  Read these progressive hints if you get stuck during the contest.
                </p>

                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#222222] border border-slate-200 dark:border-neutral-800 space-y-1">
                    <span className="text-amber-600 dark:text-amber-400 font-bold block">Hint 1: Optimal Substructure</span>
                    <p className="text-slate-700 dark:text-neutral-300">
                      Can you break the problem down into smaller sub-problems by fixing the last choice?
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#222222] border border-slate-200 dark:border-neutral-800 space-y-1">
                    <span className="text-amber-600 dark:text-amber-400 font-bold block">Hint 2: Sorting & Two Pointers</span>
                    <p className="text-slate-700 dark:text-neutral-300">
                      Sorting the input array beforehand reduces time complexity from quadratic to O(N log N).
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 4. SUBMISSIONS TAB */}
            {activeLeftTab === 'submissions' && (
              <div className="space-y-4 font-mono text-xs">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-amber-500" />
                  <span>Your Arena Submissions</span>
                </h3>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#222222] border border-slate-200 dark:border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-neutral-400">Status for Q{currentProblem.number}:</span>
                    {isCurrentSolved ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ Accepted & Verified</span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400 font-bold">Pending 100% test cases</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Questions Solved:</span>
                    <span>{solvedProblems.length}/2 Completed</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Output Window Drawer */}
          <OutputWindowDrawer
            isOpen={isOutputOpen}
            onClose={() => setIsOutputOpen(false)}
            isMinimized={isOutputMinimized}
            onToggleMinimize={() => setIsOutputMinimized(!isOutputMinimized)}
            isRunning={isRunning}
            isSubmitting={isSubmitting}
            activeTab={outputDrawerTab}
            onTabChange={setOutputDrawerTab}
            testCases={currentProblem.sampleTestCases.map((tc) => ({
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
            onSubmitCode={handleSubmitCode}
            problemTitle={`Q${currentProblem.number}. ${currentProblem.title}`}
            userScore={solvedProblems.length * 500}
            pointsScored={solvedProblems.length * 500}
            totalPoints={1000}
            attemptsCount={{ correct: solvedProblems.length, total: 2, accuracy: solvedProblems.length * 50 }}
            code={code}
            language={selectedLanguage}
          />
        </div>

        {/* Resizer Divider Bar */}
        <div
          onMouseDown={handleMouseDownH}
          className={cn(
            'w-1.5 hover:w-2 bg-slate-300 dark:bg-neutral-800 hover:bg-amber-500 cursor-col-resize transition-all shrink-0 rounded-full select-none',
            isDraggingH && 'bg-amber-500 w-2'
          )}
          title="Drag to resize split panes"
        />

        {/* ========================================================================= */}
        {/* RIGHT PANEL: Code Editor */}
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
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="h-7 px-2.5 rounded-md bg-white dark:bg-[#2d2d2d] border border-slate-300 dark:border-neutral-700 text-xs font-mono font-bold text-amber-700 dark:text-amber-300 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  {['java', 'python', 'cpp', 'c', 'javascript']
                    .map((lang) => (
                      <option key={lang} value={lang}>
                        {lang === 'javascript'
                          ? 'JavaScript'
                          : lang === 'python'
                          ? 'Python'
                          : lang === 'cpp'
                          ? 'C++'
                          : lang === 'java'
                          ? 'Java'
                          : lang === 'c'
                          ? 'C'
                          : lang}
                      </option>
                    ))}
                </select>
              </div>

              {/* Editor Actions Toolbar */}
              <div className="flex items-center gap-1 text-slate-500 dark:text-neutral-400">
                {/* 1. Format Code */}
                <button
                  type="button"
                  onClick={handleFormatCode}
                  title="Format Code"
                  className="p-1.5 rounded-md text-slate-600 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-200 dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer"
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
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>

                {/* 3. Restore Last Submitted */}
                <button
                  type="button"
                  onClick={handleRestoreLastSubmittedCode}
                  title="Restore Last Submitted Code"
                  className="p-1.5 rounded-md text-slate-600 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-300 hover:bg-slate-200 dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer"
                >
                  <History className="w-3.5 h-3.5" />
                </button>

                {/* 4. Settings */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    title="Editor Settings"
                    className={cn(
                      'p-1.5 rounded-md transition-colors cursor-pointer',
                      isSettingsOpen ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300' : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#2a2a2a]'
                    )}
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>

                  {/* Settings Popover */}
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

                      {/* Font Size */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-slate-600 dark:text-neutral-400">
                          <span>Font Size:</span>
                          <span className="text-amber-600 dark:text-amber-400 font-bold">{fontSize}px</span>
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
                            localStorage.setItem('nextera:contest_editor_fontsize', String(val));
                          }}
                          className="w-full accent-amber-500 cursor-pointer"
                        />
                      </div>

                      {/* Tab Size */}
                      <div className="space-y-1.5">
                        <span className="text-slate-600 dark:text-neutral-400 block">Tab Spaces:</span>
                        <div className="grid grid-cols-2 gap-2">
                          {[2, 4].map((spaces) => (
                            <button
                              key={spaces}
                              type="button"
                              onClick={() => {
                                setTabSize(spaces);
                                localStorage.setItem('nextera:contest_editor_tabsize', String(spaces));
                              }}
                              className={cn(
                                'px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors border text-center cursor-pointer',
                                tabSize === spaces
                                  ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/50'
                                  : 'bg-slate-100 dark:bg-[#2a2a2a] text-slate-600 dark:text-neutral-400 border-slate-300 dark:border-neutral-700 hover:text-slate-900 dark:hover:text-white'
                              )}
                            >
                              {spaces} Spaces
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Theme Selector */}
                      <div className="space-y-1.5">
                        <span className="text-slate-600 dark:text-neutral-400 block">Theme:</span>
                        <select
                          value={editorTheme}
                          onChange={(e) => {
                            setEditorTheme(e.target.value);
                            localStorage.setItem('nextera:contest_editor_theme', e.target.value);
                          }}
                          className="w-full h-8 px-2.5 rounded-lg bg-slate-100 dark:bg-[#2a2a2a] border border-slate-300 dark:border-neutral-700 text-xs text-slate-800 dark:text-neutral-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                        >
                          {Object.values(EDITOR_THEMES).map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Word Wrap Toggle */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-neutral-800">
                        <span className="text-slate-700 dark:text-neutral-300">Word Wrap</span>
                        <button
                          type="button"
                          onClick={() => {
                            const next = !wordWrap;
                            setWordWrap(next);
                            localStorage.setItem('nextera:contest_editor_wordwrap', String(next));
                          }}
                          className={cn(
                            'w-10 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer',
                            wordWrap ? 'bg-amber-500' : 'bg-slate-300 dark:bg-neutral-700'
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

                      {/* Line Numbers Toggle */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-700 dark:text-neutral-300">Line Numbers</span>
                        <button
                          type="button"
                          onClick={() => {
                            const next = !showLineNumbers;
                            setShowLineNumbers(next);
                            localStorage.setItem('nextera:contest_editor_linenumbers', String(next));
                          }}
                          className={cn(
                            'w-10 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer',
                            showLineNumbers ? 'bg-amber-500' : 'bg-slate-300 dark:bg-neutral-700'
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

                {/* 5. Reset Template Code */}
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
                    className="flex md:hidden items-center gap-1 px-2 py-1 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 text-[11px] font-mono font-semibold transition-colors cursor-pointer"
                  >
                    <span>🔄</span>
                    <span>Landscape</span>
                  </button>
                )}

                {/* 6. Fullscreen Toggle */}
                <button
                  type="button"
                  onClick={() => setIsFullScreen(!isFullScreen)}
                  title={isFullScreen ? 'Exit Full Screen' : 'Full Screen Editor'}
                  className={cn(
                    'p-1.5 rounded-md transition-colors cursor-pointer',
                    isFullScreen ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300' : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#2a2a2a]'
                  )}
                >
                  {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Code Editor */}
            <div className="flex-1 overflow-hidden relative">
              <ProfessionalCodeEditor
                value={code}
                onChange={setCode}
                language={selectedLanguage}
                theme={editorTheme}
                fontSize={fontSize}
                tabSize={tabSize}
                wordWrap={wordWrap}
                showLineNumbers={showLineNumbers}
                onRun={handleRunCode}
                onSubmit={handleSubmitCode}
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

          {/* ULTRA-INTERACTIVE, SLEEK BOTTOM ACTION TOOLBAR */}
          <div className="h-12 px-3.5 bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 dark:from-[#14151d] dark:via-[#1a1b26] dark:to-[#14151d] border border-slate-200 dark:border-neutral-800/90 rounded-xl mt-1.5 flex items-center justify-between shrink-0 text-xs font-mono shadow-md backdrop-blur-md">
            {/* Left Quick Helpers: Standings Quick Link */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveLeftTab('standings')}
                className={cn(
                  'h-8 px-3 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 text-xs font-mono',
                  activeLeftTab === 'standings'
                    ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.25)] font-bold'
                    : 'bg-white dark:bg-[#1e1f2b] text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white border-slate-300 dark:border-neutral-700/80 hover:border-slate-400 dark:hover:border-neutral-600'
                )}
                title="View Live Standings"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>Leaderboard ({solvedProblems.length}/2 Solved)</span>
              </button>
            </div>

            {/* Right Action Buttons: Custom Input, Compile & Run, Submit */}
            <div className="flex items-center gap-2.5">
              {/* 1. Custom Input Button */}
              <button
                type="button"
                onClick={handleOpenCustomInput}
                className={cn(
                  'h-8 px-3.5 rounded-lg border text-xs font-mono font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer active:scale-95 shadow-xs group',
                  isOutputOpen && outputDrawerTab === 'custom'
                    ? 'bg-cyan-100 dark:bg-gradient-to-r dark:from-cyan-950/70 dark:to-blue-950/70 text-cyan-800 dark:text-cyan-300 border-cyan-500/60 shadow-[0_0_16px_rgba(6,182,212,0.3)]'
                    : 'bg-white dark:bg-[#1c1e29] hover:bg-slate-100 dark:hover:bg-[#252838] text-slate-700 dark:text-neutral-300 hover:text-cyan-700 dark:hover:text-cyan-200 border-slate-300 dark:border-neutral-700/80 hover:border-cyan-500/50 hover:shadow-[0_0_14px_rgba(6,182,212,0.2)]'
                )}
                title="Open Custom Test Cases"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400 group-hover:rotate-12 transition-transform duration-200" />
                <span className="tracking-wide">+ Custom Test</span>
              </button>

              {/* 2. Compile & Run Button */}
              <button
                type="button"
                disabled={isRunning || isSubmitting}
                onClick={handleRunCode}
                className={cn(
                  'relative overflow-hidden h-8 px-5 rounded-lg bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-[#242634] dark:via-[#2f3244] dark:to-[#242634] hover:from-slate-300 hover:via-slate-200 hover:to-slate-300 dark:hover:from-[#2e3244] dark:hover:via-[#393d52] dark:hover:to-[#2e3244] border border-cyan-600/30 dark:border-cyan-500/30 hover:border-cyan-500 dark:hover:border-cyan-400/80 text-cyan-900 dark:text-cyan-100 hover:text-slate-900 dark:hover:text-white font-bold flex items-center gap-2 transition-all duration-200 text-xs cursor-pointer shadow-sm hover:shadow-[0_0_20px_rgba(6,182,212,0.35)] active:scale-95 group',
                  isRunning && 'opacity-60 cursor-not-allowed'
                )}
                title="Compile & Run"
              >
                {/* Shimmer sweep effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

                {isRunning ? (
                  <div className="w-3.5 h-3.5 border-2 border-cyan-500 dark:border-cyan-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-cyan-500/20 flex items-center justify-center group-hover:bg-cyan-500/30 transition-colors">
                    <Play className="w-2.5 h-2.5 fill-cyan-500 dark:fill-cyan-400 text-cyan-500 dark:text-cyan-400 ml-0.5 group-hover:scale-115 transition-transform" />
                  </div>
                )}
                <span className="tracking-wide">Compile & Run</span>
              </button>

              {/* 3. Submit Solution Button */}
              <button
                type="button"
                disabled={isRunning || isSubmitting}
                onClick={handleSubmitCode}
                className={cn(
                  'relative overflow-hidden h-8 px-5 rounded-lg bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:via-emerald-400 hover:to-teal-400 text-white font-bold flex items-center gap-2 shadow-[0_0_18px_rgba(16,185,129,0.35)] hover:shadow-[0_0_28px_rgba(16,185,129,0.65)] active:scale-95 transition-all duration-200 text-xs cursor-pointer border border-emerald-400/50 group',
                  isSubmitting && 'opacity-60 cursor-not-allowed'
                )}
                title={`Submit Question ${currentProblem.number} for Contest Evaluation`}
              >
                {/* Shimmer sweep effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

                {isSubmitting ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <CloudUpload className="w-3 h-3 text-white group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                )}
                <span className="tracking-wide">Submit Q{currentProblem.number}</span>
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
        title="Rotate Phone for Contest Arena"
        subtitle="Solving contest problems, debugging, and viewing test cases in portrait is not practical. Rotate your device to landscape for the full IDE experience."
      />

    </div>
  );
};
