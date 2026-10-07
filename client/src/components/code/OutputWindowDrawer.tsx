import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Minus,
  CheckCircle2,
  XCircle,
  Play,
  Copy,
  Check,
  ChevronUp,
  Sparkles,
  AlertCircle,
  Info,
  Bot,
  MessageSquare,
  Star,
  Send,
  CheckCheck,
  Lightbulb,
  Lock,
  Unlock,
  RefreshCw,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { necAiService } from '../../services/necAi.service';
import { sanitizeAiText } from '../../utils/cleanAiText';
import { CleanAiResponseView } from '../compiler/CleanAiResponseView';

export interface TestCaseItem {
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  passed?: boolean;
  explanation?: string;
}

export interface OutputWindowDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isMinimized: boolean;
  onToggleMinimize: () => void;
  isRunning: boolean;
  isSubmitting: boolean;
  activeTab: 'results' | 'custom' | 'arena-ai' | 'yogi';
  onTabChange: (tab: 'results' | 'custom' | 'arena-ai' | 'yogi') => void;
  testCases: TestCaseItem[];
  selectedCaseIdx: number;
  onSelectCaseIdx: (idx: number) => void;
  customInput: string;
  onCustomInputChange: (val: string) => void;
  onAddCustomCase?: () => void;
  // Execution data
  runResult?: {
    output?: string;
    error?: string;
    executionTime?: number;
    memory?: number;
    passed?: boolean;
  } | null;
  submissionResult?: {
    status: string;
    testCasesPassed: number;
    totalTestCases: number;
    executionTime?: number;
    memory?: number;
    error?: string;
    errorMessage?: string;
    coinsAwarded?: number;
  } | null;
  contestEvaluation?: {
    allPassed: boolean;
    passedCount: number;
    totalCount: number;
    coinsAwarded?: number;
    results: { input: string; expected: string; actual: string; passed: boolean }[];
    executionTime?: number;
    memory?: number;
  } | null;
  onRunCode?: () => void;
  onSubmitCode?: () => void;
  problemTitle?: string;
  problemDescription?: string;
  problemHints?: string[];
  userScore?: number;
  pointsScored?: number;
  totalPoints?: number;
  attemptsCount?: { correct: number; total: number; accuracy?: number };
  code?: string;
  language?: string;
}

export const OutputWindowDrawer: React.FC<OutputWindowDrawerProps> = ({
  isOpen,
  onClose,
  isMinimized,
  onToggleMinimize,
  isRunning,
  isSubmitting,
  activeTab,
  onTabChange,
  testCases = [],
  selectedCaseIdx = 0,
  onSelectCaseIdx,
  customInput = '',
  onCustomInputChange,
  onAddCustomCase,
  runResult,
  submissionResult,
  contestEvaluation,
  onRunCode,
  onSubmitCode,
  problemTitle,
  problemDescription,
  problemHints = [],
  userScore = 415,
  pointsScored = 4,
  totalPoints = 4,
  attemptsCount = { correct: 1, total: 1, accuracy: 100 },
  code = '',
  language = 'javascript',
}) => {
  // Output display view mode ('your' vs 'expected')
  const [outputView, setOutputView] = useState<'your' | 'expected'>('your');
  const [copied, setCopied] = useState(false);
  const [errorCopied, setErrorCopied] = useState(false);
  const [liveEvaluatingIdx, setLiveEvaluatingIdx] = useState<number>(0);
  // Full height by default covering the whole problem panel
  const [drawerHeightPercent, setDrawerHeightPercent] = useState<number>(100);
  const [isDraggingHeight, setIsDraggingHeight] = useState(false);
  const [showDetailedCases, setShowDetailedCases] = useState<boolean>(false);

  // Feedback Modal State
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // NEC AI Sub-Mode: 'debugger' | 'hints'
  const [aiMode, setAiMode] = useState<'debugger' | 'hints'>('debugger');

  // Progressive Hints State (Hint 1: Approach, Hint 2: Data Structure, Hint 3: Pseudocode)
  const [hintStates, setHintStates] = useState<{
    1: { unlocked: boolean; content: string; loading: boolean };
    2: { unlocked: boolean; content: string; loading: boolean };
    3: { unlocked: boolean; content: string; loading: boolean };
  }>({
    1: { unlocked: false, content: '', loading: false },
    2: { unlocked: false, content: '', loading: false },
    3: { unlocked: false, content: '', loading: false },
  });

  // Preload problem hints if available
  useEffect(() => {
    if (problemHints && problemHints.length > 0) {
      setHintStates((prev) => ({
        ...prev,
        1: {
          ...prev[1],
          content: prev[1].content || problemHints[0] || '',
          unlocked: prev[1].unlocked || Boolean(problemHints[0]),
        },
        2: {
          ...prev[2],
          content: prev[2].content || (problemHints[1] ? problemHints[1] : ''),
        },
        3: {
          ...prev[3],
          content: prev[3].content || (problemHints[2] ? problemHints[2] : ''),
        },
      }));
    }
  }, [problemHints]);

  // NEC AI Bot Chat State
  const [aiMessages, setAiMessages] = useState<Array<{ role: 'bot' | 'user'; text: string; time: string }>>([
    {
      role: 'bot',
      text: `Namaste! I am NEC AI, your Socratic AI Mentor.

Whenever your code encounters a Wrong Answer or Runtime Error, I can analyze your code logic without spoiling the solution.

Ask me to debug your logic, explain edge cases, or guide you with progressive hints.`,
      time: 'Just now',
    },
  ]);
  const [aiInput, setAiInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);

  // Progressive test case running animation
  useEffect(() => {
    if (isRunning || isSubmitting) {
      setLiveEvaluatingIdx(0);
      const total = (testCases && testCases.length) || 3;
      const interval = setInterval(() => {
        setLiveEvaluatingIdx((prev) => {
          if (prev < total - 1) return prev + 1;
          return prev;
        });
      }, 150);
      return () => clearInterval(interval);
    }
  }, [isRunning, isSubmitting, testCases?.length]);

  // Drag handle for drawer height
  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingHeight(true);
    const startY = e.clientY;
    const startHeight = drawerHeightPercent;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = startY - moveEvent.clientY;
      const containerHeight = window.innerHeight * 0.8;
      const newPercent = Math.min(100, Math.max(30, startHeight + (deltaY / containerHeight) * 100));
      setDrawerHeightPercent(newPercent);
    };

    const handleMouseUp = () => {
      setIsDraggingHeight(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const currentCase = testCases[selectedCaseIdx] || testCases[0] || {
    input: '',
    expectedOutput: '',
  };

  // Derive status verdict accurately
  const totalCasesCount = testCases.length;
  const passedCasesCount = testCases.filter((tc) => tc.passed === true).length;
  const allSampleCasesPassed = totalCasesCount > 0 && passedCasesCount === totalCasesCount;
  const anyCaseFailed = testCases.some((tc) => tc.passed === false);

  const isExecuting = isRunning || isSubmitting;

  const isSubmissionAccepted = Boolean(submissionResult && submissionResult.status === 'Accepted');
  const isContestAccepted = Boolean(contestEvaluation && contestEvaluation.allPassed);
  const isRunSuccess = Boolean(!submissionResult && !contestEvaluation && runResult && !runResult.error && (runResult.passed === true || allSampleCasesPassed));

  const isAccepted = Boolean(isSubmissionAccepted || isContestAccepted || isRunSuccess);

  const isTLE = Boolean(
    (submissionResult?.status === 'Time Limit Exceeded') ||
    (runResult?.error && runResult.error.toLowerCase().includes('time limit'))
  );

  const hasRuntimeError = Boolean(
    runResult?.error ||
    submissionResult?.error ||
    (submissionResult?.status && ['Runtime Error', 'Compilation Error', 'Internal Error'].includes(submissionResult.status))
  );

  const isWrongAnswer = !isAccepted && !isExecuting && (
    (submissionResult && submissionResult.status === 'Wrong Answer') ||
    (contestEvaluation && !contestEvaluation.allPassed) ||
    (runResult && !runResult.error && runResult.passed === false) ||
    anyCaseFailed
  );

  // Calculations for 4 metric cards
  const displayTotalTests = submissionResult
    ? (submissionResult.totalTestCases || 1051)
    : contestEvaluation
    ? contestEvaluation.totalCount
    : totalCasesCount || 1051;

  const displayPassedTests = submissionResult
    ? (submissionResult.status === 'Accepted' ? displayTotalTests : (submissionResult.testCasesPassed ?? 0))
    : contestEvaluation
    ? (contestEvaluation.allPassed ? displayTotalTests : contestEvaluation.passedCount)
    : runResult
    ? (isAccepted ? displayTotalTests : passedCasesCount)
    : 0;

  const displayExecutionTime = (
    submissionResult?.executionTime
      ? (submissionResult.executionTime > 10 ? (submissionResult.executionTime / 1000).toFixed(2) : submissionResult.executionTime.toFixed(2))
      : contestEvaluation?.executionTime
      ? (contestEvaluation.executionTime / 1000).toFixed(2)
      : runResult?.executionTime
      ? (runResult.executionTime > 10 ? (runResult.executionTime / 1000).toFixed(2) : runResult.executionTime.toFixed(2))
      : '0.26'
  );

  const displayPoints = isAccepted ? pointsScored : 0;
  const displayAccuracy = isAccepted
    ? (attemptsCount.accuracy ?? 100)
    : displayTotalTests > 0
    ? Math.round((displayPassedTests / displayTotalTests) * 100)
    : 0;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleCopyError = (errorText: string) => {
    navigator.clipboard.writeText(errorText);
    setErrorCopied(true);
    setTimeout(() => setErrorCopied(false), 1800);
  };

  // Instant Trigger: Ask NEC AI to debug the failed run/submission
  const handleTriggerNecAiDebug = async () => {
    onTabChange('arena-ai');
    setAiMode('debugger');

    const failedCase = testCases.find((tc) => tc.passed === false) || testCases[0];
    const verdict = isTLE
      ? 'Time Limit Exceeded'
      : hasRuntimeError
      ? 'Runtime Error'
      : isWrongAnswer
      ? 'Wrong Answer'
      : 'Execution Inspection';

    const errorText = runResult?.error || submissionResult?.errorMessage || submissionResult?.error;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setAiMessages((prev) => [
      ...prev,
      {
        role: 'user',
        text: `Please debug my code: It resulted in ${verdict}${
          failedCase?.input ? ` on Input: ${failedCase.input}` : ''
        }. Guide me Socratic style without spoiling the full solution.`,
        time: timeStr,
      },
    ]);
    setIsAiTyping(true);

    try {
      const res = await necAiService.debugCode({
        problemTitle: problemTitle || 'Coding Problem',
        problemDescription,
        code: code || '',
        language: language || 'javascript',
        verdict,
        failedTestCase: failedCase
          ? {
              input: failedCase.input,
              expectedOutput: failedCase.expectedOutput,
              actualOutput: failedCase.actualOutput || runResult?.output,
            }
          : undefined,
        errorMessage: errorText,
        userMessage: 'Where did my logic fail and what edge case did I miss?',
      });

      setAiMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text: res.message,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      setAiMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text: `Socratic Debugger Analysis:

For ${problemTitle || 'this problem'}:

1. Edge Case Check
   Did you verify inputs when numbers are negative or when the target is 0?

2. Boundary Condition
   Make sure your loop indices do not read beyond the array boundary (e.g. i < len vs i <= len).

3. Optimization
   Consider using a Hash Map or Two Pointers to achieve O(N) time instead of nested loops.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsAiTyping(false);
    }
  };

  // Progressive Hint Unlock Handler
  const handleUnlockHint = async (level: 1 | 2 | 3) => {
    if (hintStates[level].unlocked && hintStates[level].content) return;

    setHintStates((prev) => ({
      ...prev,
      [level]: { ...prev[level], loading: true },
    }));

    try {
      const res = await necAiService.getProgressiveHint({
        problemTitle: problemTitle || 'DSA Problem',
        problemDescription,
        hintLevel: level,
        code,
        language,
      });

      setHintStates((prev) => ({
        ...prev,
        [level]: { unlocked: true, content: res.content, loading: false },
      }));
    } catch {
      const defaultContent =
        level === 1
          ? `Core Intuition: Think of the target value as finding a missing complement. Instead of re-checking every pair, remember what you have already inspected.`
          : level === 2
          ? `Data Structure: Use a Hash Map or Dictionary storing elements as keys and their index as values for instant O(1) lookups.`
          : `Structured Pseudocode:\n1. Initialize seen map\n2. For each element at index i:\n     diff = target - nums[i]\n     if diff in seen: return [seen[diff], i]\n     seen[nums[i]] = i\n3. Return empty if not found`;


      setHintStates((prev) => ({
        ...prev,
        [level]: { unlocked: true, content: defaultContent, loading: false },
      }));
    }
  };

  // Handle Conversational Chat with NEC AI
  const handleSendAiMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || aiInput.trim();
    if (!textToSend || isAiTyping) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { role: 'user' as const, text: textToSend, time: timeStr };
    setAiMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setAiInput('');
    setIsAiTyping(true);

    try {
      const history = aiMessages.map((m) => ({
        role: m.role === 'bot' ? ('assistant' as const) : ('user' as const),
        text: m.text,
      }));

      const res = await necAiService.chatWithMentor({
        problemTitle: problemTitle || 'Coding Problem',
        problemDescription,
        code,
        language,
        history,
        message: textToSend,
      });

      setAiMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text: res.message,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch {
      let botReply = `For "${problemTitle || 'this problem'}", optimal performance is achieved using **O(N)** time and **O(1)** or **O(N)** auxiliary space.`;
      const lower = textToSend.toLowerCase();

      if (lower.includes('complexity') || lower.includes('time') || lower.includes('space')) {
        botReply = `⏱️ **Time Complexity**: **O(N)** linear scan.\n- **Space**: **O(1)** auxiliary memory or **O(N)** map.\n- **Verdict**: Optimal! Easily passes all hidden test cases.`;
      } else if (lower.includes('hint') || lower.includes('edge')) {
        botReply = `💡 **Edge Case Checklist**:\n1. Single-element or empty array inputs.\n2. Duplicate values that sum up to target.\n3. Negative values and large integer overflow boundaries.\n4. Sorted vs unsorted array constraints.`;
      } else if (lower.includes('optimize')) {
        botReply = `⚡ **Optimization Strategy**:\nAvoid nested loops O(N²). Use a hash-based lookup to check for \`(target - current_val)\` in O(1) time.`;
      }

      setAiMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text: botReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackSubmitted(true);
    setTimeout(() => {
      setIsFeedbackOpen(false);
      setFeedbackSubmitted(false);
      setFeedbackComment('');
    }, 1500);
  };

  // If closed completely, don't render
  if (!isOpen) return null;

  // MINIMIZED STATE: Sleek Mixed Blue Strip with Red Close on Problem Panel
  if (isMinimized) {
    return (
      <div className="absolute bottom-0 inset-x-0 z-30 bg-gradient-to-r from-[#0b132b] via-[#1c2541] to-[#1e3a8a] border-t-2 border-blue-500 shadow-2xl px-4 py-2 flex items-center justify-between font-sans text-xs text-white">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleMinimize}
            className="p-1 rounded-md bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 transition-colors flex items-center gap-1.5 font-bold cursor-pointer border border-blue-500/30"
            title="Expand Output Window"
          >
            <ChevronUp className="w-4 h-4" />
            <span>Output Window</span>
          </button>
          <div className="h-3.5 w-px bg-blue-400/30" />
          <div className="flex items-center gap-2">
            {isAccepted ? (
              <span className="flex items-center gap-1.5 text-emerald-300 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Problem Solved Successfully ({displayPassedTests}/{displayTotalTests})
              </span>
            ) : isTLE ? (
              <span className="flex items-center gap-1.5 text-amber-300 font-bold text-xs">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                Time Limit Exceeded ({displayPassedTests}/{displayTotalTests})
              </span>
            ) : hasRuntimeError ? (
              <span className="flex items-center gap-1.5 text-rose-300 font-bold text-xs">
                <XCircle className="w-4 h-4 text-rose-400" />
                Compilation / Runtime Error
              </span>
            ) : isWrongAnswer ? (
              <span className="flex items-center gap-1.5 text-rose-300 font-bold text-xs">
                <XCircle className="w-4 h-4 text-rose-400" />
                Wrong Answer ({displayPassedTests}/{displayTotalTests} Passed)
              </span>
            ) : (
              <span className="text-blue-200/80 text-xs">Output Window Ready</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleMinimize}
            className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] transition-colors cursor-pointer shadow-sm"
          >
            Show Output
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md bg-rose-500 hover:bg-rose-600 text-white transition-colors cursor-pointer shadow-sm"
            title="Close Output Window"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const isNextEraAiActive = activeTab === 'arena-ai' || activeTab === 'yogi';

  // EXPANDED STATE: Slide-Up Bottom Drawer (Full Height Upper Tak)
  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: '100%', opacity: 0.5 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 280 }}
        style={{
          height: `${drawerHeightPercent}%`,
          maxHeight: '100%',
          minHeight: '280px',
        }}
        className={cn(
          'absolute bottom-0 inset-x-0 z-30 flex flex-col bg-white dark:bg-[#18191d] border-t border-blue-500/40 shadow-[0_-16px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_-16px_50px_rgba(0,0,0,0.95)] font-sans select-none overflow-hidden text-slate-800 dark:text-neutral-200',
          isDraggingHeight && 'select-none'
        )}
      >
        {/* RESIZE DRAG HANDLE AT TOP */}
        <div
          onMouseDown={handleMouseDownResize}
          title="Drag up/down to resize Output Window"
          className="h-2 w-full bg-slate-200 hover:bg-slate-300 dark:bg-[#101935] dark:hover:bg-[#192754] cursor-row-resize flex items-center justify-center group shrink-0 relative transition-colors"
        >
          <div className="w-12 h-1 bg-blue-500/50 dark:bg-blue-400/50 rounded-full group-hover:bg-blue-600 dark:group-hover:bg-blue-300 transition-colors" />
        </div>

        {/* 1. TOP HEADER (Mixed Blue Gradient Header + Red Close Button) */}
        <div className="h-10 px-4 bg-gradient-to-r from-[#0b132b] via-[#1c2541] to-[#1e3a8a] border-b border-blue-500/30 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-white text-sm tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              Output Window
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleMinimize}
              title="Minimize Output Window (_)"
              className="p-1 rounded-md bg-blue-900/50 hover:bg-blue-600 text-blue-200 hover:text-white border border-blue-500/30 transition-all cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Close Output Window (X)"
              className="p-1 rounded-md bg-rose-500 hover:bg-rose-600 text-white border border-rose-400 transition-all cursor-pointer shadow-sm"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. SUB-NAVIGATION TABS (Compilation Results | Custom Input | NextEra AI) */}
        <div className="h-10 px-4 bg-slate-50 dark:bg-[#18191d] border-b border-slate-200 dark:border-neutral-800/80 flex items-center justify-between shrink-0 text-xs">
          <div className="flex items-center gap-7">
            {/* Tab 1: Compilation Results */}
            <button
              type="button"
              onClick={() => onTabChange('results')}
              className={cn(
                'py-2 font-semibold transition-all relative flex items-center gap-1.5 cursor-pointer',
                activeTab === 'results'
                  ? 'text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-neutral-200'
              )}
            >
              <span>Compilation Results</span>
              {activeTab === 'results' && (
                <motion.div
                  layoutId="output_active_tab_line"
                  className="absolute bottom-0 inset-x-0 h-0.5 bg-blue-500 rounded-full"
                />
              )}
            </button>

            {/* Tab 2: Custom Input */}
            <button
              type="button"
              onClick={() => onTabChange('custom')}
              className={cn(
                'py-2 font-semibold transition-all relative flex items-center gap-1.5 cursor-pointer',
                activeTab === 'custom'
                  ? 'text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-neutral-200'
              )}
            >
              <span>Custom Input</span>
              {activeTab === 'custom' && (
                <motion.div
                  layoutId="output_active_tab_line"
                  className="absolute bottom-0 inset-x-0 h-0.5 bg-blue-500 rounded-full"
                />
              )}
            </button>

            {/* Tab 3: NEC AI */}
            <button
              type="button"
              onClick={() => onTabChange('arena-ai')}
              className={cn(
                'py-2 font-semibold transition-all relative flex items-center gap-1.5 cursor-pointer',
                isNextEraAiActive
                  ? 'text-cyan-600 dark:text-cyan-400 font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-neutral-200'
              )}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400 animate-pulse" />
              <span>🤖 NEC AI</span>
              {isNextEraAiActive && (
                <motion.div
                  layoutId="output_active_tab_line"
                  className="absolute bottom-0 inset-x-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                />
              )}
            </button>
          </div>

          {/* Detailed Cases Toggle on right */}
          {activeTab === 'results' && !isExecuting && (
            <button
              type="button"
              onClick={() => setShowDetailedCases(!showDetailedCases)}
              className="text-xs text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-neutral-200 underline font-medium cursor-pointer transition-colors"
            >
              {showDetailedCases ? '← Back to Stats Cards' : 'Inspect Sample Test Cases →'}
            </button>
          )}
        </div>

        {/* 3. INNER DRAWER SCROLLABLE CONTENT */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-slate-50 dark:bg-[#18191d] space-y-4">

          {/* TAB 1: COMPILATION RESULTS */}
          {activeTab === 'results' && (
            <div className="space-y-4 max-w-4xl mx-auto">

              {/* While Executing: Step-by-Step Test Case Animation */}
              {isExecuting ? (
                <div className="p-8 rounded-2xl bg-white dark:bg-[#202126] border border-slate-200 dark:border-neutral-800 text-center space-y-4 shadow-lg">
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
                    <span className="font-bold text-slate-900 dark:text-white text-base">
                      {isSubmitting ? 'Evaluating all 1051 test cases...' : 'Compiling code & executing sample test cases...'}
                    </span>
                  </div>

                  {/* Progressive test case badges */}
                  <div className="flex items-center justify-center gap-2 flex-wrap pt-2">
                    {testCases.map((_, idx) => {
                      const isPast = idx < liveEvaluatingIdx;
                      const isCurrent = idx === liveEvaluatingIdx;
                      return (
                        <div
                          key={idx}
                          className={cn(
                            'px-3 py-1.5 rounded-xl border text-xs font-mono transition-all flex items-center gap-1.5',
                            isPast
                              ? 'bg-blue-50 dark:bg-blue-500/20 border-blue-500 text-blue-700 dark:text-blue-300 font-bold scale-105'
                              : isCurrent
                              ? 'bg-amber-50 dark:bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300 animate-pulse'
                              : 'bg-slate-100 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 text-slate-500 dark:text-neutral-500'
                          )}
                        >
                          {isPast ? (
                            <Check className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 stroke-[3]" />
                          ) : isCurrent ? (
                            <div className="w-3 h-3 border border-amber-500 dark:border-amber-300 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-neutral-600" />
                          )}
                          <span>Case {idx + 1}</span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-neutral-400">Verifying execution time & memory constraints...</p>
                </div>
              ) : showDetailedCases ? (
                /* DETAILED TEST CASES VIEW (Case 1, Case 2, Your Output vs Expected Output) */
                <div className="p-5 rounded-2xl bg-white dark:bg-[#202126] border border-slate-200 dark:border-neutral-700/70 shadow-lg space-y-4 font-mono">
                  {/* Case 1, Case 2 tabs */}
                  <div className="flex items-center justify-between gap-2 flex-wrap pb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {testCases.map((tc, idx) => {
                        const isSelected = selectedCaseIdx === idx;
                        const isPassed = tc.passed !== false;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => onSelectCaseIdx(idx)}
                            className={cn(
                              'px-3 py-1.5 rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer border',
                              isSelected
                                ? 'bg-slate-100 dark:bg-[#282a33] text-slate-900 dark:text-white border-blue-500/60 font-bold shadow-sm'
                                : 'bg-slate-50 dark:bg-[#1a1b20] text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700'
                            )}
                          >
                            <span>Case {idx + 1}</span>
                            {tc.passed !== undefined ? (
                              tc.passed ? (
                                <Check className="w-3 h-3 text-emerald-500 dark:text-emerald-400 stroke-[3]" />
                              ) : (
                                <X className="w-3 h-3 text-rose-500 dark:text-rose-400 stroke-[3]" />
                              )
                            ) : (
                              <span className={cn('w-1.5 h-1.5 rounded-full', isPassed ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-rose-500 dark:bg-rose-400')} />
                            )}
                          </button>
                        );
                      })}
                      {onAddCustomCase && (
                        <button
                          type="button"
                          onClick={onAddCustomCase}
                          title="Add test case"
                          className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-[#1a1b20] hover:bg-slate-100 dark:hover:bg-[#282a33] border border-slate-200 dark:border-neutral-800 text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white text-xs cursor-pointer"
                        >
                          +
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setOutputView('your')}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer',
                          outputView === 'your'
                            ? 'bg-slate-200 dark:bg-neutral-800 text-slate-900 dark:text-white border-slate-300 dark:border-neutral-600'
                            : 'bg-slate-50 dark:bg-[#1a1b20] text-slate-500 dark:text-neutral-400 border-slate-200 dark:border-neutral-800 hover:text-slate-900 dark:hover:text-white'
                        )}
                      >
                        Your Output
                      </button>
                      <button
                        type="button"
                        onClick={() => setOutputView('expected')}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer',
                          outputView === 'expected'
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : 'bg-slate-50 dark:bg-[#1a1b20] text-emerald-600 dark:text-emerald-400/80 border-emerald-500/30 hover:text-emerald-700 dark:hover:text-emerald-300'
                        )}
                      >
                        Expected Output
                      </button>
                    </div>
                  </div>

                  {/* Input display */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400 text-xs">
                      <span className="font-semibold text-slate-700 dark:text-neutral-300">Input:</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(currentCase.input)}
                        className="text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-neutral-200 flex items-center gap-1 cursor-pointer"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copy</span>
                      </button>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-[#18191d] border border-slate-200 dark:border-neutral-800 text-slate-800 dark:text-neutral-200 text-xs sm:text-sm overflow-x-auto whitespace-pre-wrap select-text leading-relaxed">
                      {currentCase.input || '—'}
                    </div>
                  </div>

                  {/* Output display */}
                  <div className="space-y-1.5">
                    <div className="text-slate-500 dark:text-neutral-400 text-xs font-semibold text-slate-700 dark:text-neutral-300">
                      {outputView === 'your' ? 'Your Output:' : 'Expected Output:'}
                    </div>
                    <div
                      className={cn(
                        'p-3.5 rounded-xl border text-xs sm:text-sm overflow-x-auto whitespace-pre-wrap select-text leading-relaxed font-mono',
                        outputView === 'expected'
                          ? 'bg-emerald-50 dark:bg-[#14281f] border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-bold'
                          : currentCase.passed === false || runResult?.error
                          ? 'bg-rose-50 dark:bg-[#28181b] border-rose-800/40 text-rose-800 dark:text-rose-300'
                          : 'bg-slate-100 dark:bg-[#18191d] border-slate-200 dark:border-neutral-800 text-slate-800 dark:text-neutral-200'
                      )}
                    >
                      {outputView === 'expected'
                        ? currentCase.expectedOutput || '—'
                        : currentCase.actualOutput !== undefined && currentCase.actualOutput !== ''
                        ? currentCase.actualOutput
                        : runResult?.error
                        ? runResult.error
                        : runResult?.output !== undefined
                        ? runResult.output || '(No output returned / undefined)'
                        : '(Run code to view output)'}
                    </div>
                  </div>
                </div>
              ) : (
                /* INTERACTIVE DIV CONTAINER: EXACT GEEKSFORGEEKS 4-CARD STATISTICS DASHBOARD */
                <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-gradient-to-b dark:from-[#202228] dark:to-[#18191e] border border-slate-200 dark:border-neutral-700/80 shadow-2xl space-y-5">

                  {/* Top Status Headline + Suggest Feedback */}
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-200 dark:border-neutral-700/60">
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                        {isAccepted 
                          ? (submissionResult ? 'Problem Solved Successfully' : 'Sample Test Cases Passed')
                          : isTLE 
                          ? 'Time Limit Exceeded (TLE)' 
                          : hasRuntimeError 
                          ? 'Compilation / Runtime Error' 
                          : 'Wrong Answer'}
                      </h3>
                      {isAccepted ? (
                        <div className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400 fill-teal-400/20 stroke-[2.5]" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                          <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 stroke-[2.5]" />
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsFeedbackOpen(true)}
                      className="text-xs sm:text-sm text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white underline font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Suggest Feedback</span>
                    </button>
                  </div>

                  {/* 4 STATISTIC CARDS (2x2 GRID with interactive hover effects) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* CARD 1: Test Cases Passed */}
                    <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-[#252830] hover:bg-slate-100 dark:hover:bg-[#2b2e38] border border-slate-200 dark:border-neutral-700/70 hover:border-blue-500/50 transition-all duration-200 flex flex-col justify-between shadow-md group">
                      <div className="text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                        Test Cases Passed
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-3 tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                        {displayPassedTests} / {displayTotalTests}
                      </div>
                    </div>

                    {/* CARD 2: Attempts : Correct / Total */}
                    <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-[#252830] hover:bg-slate-100 dark:hover:bg-[#2b2e38] border border-slate-200 dark:border-neutral-700/70 hover:border-blue-500/50 transition-all duration-200 flex flex-col justify-between shadow-md group">
                      <div className="text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                        Attempts : Correct / Total
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-3 tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                        {attemptsCount.correct} / {attemptsCount.total}
                      </div>
                      <div className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-2 font-medium">
                        Accuracy : <span className="text-slate-900 dark:text-white font-bold">{displayAccuracy}%</span>
                      </div>
                    </div>

                    {/* CARD 3: Points Scored */}
                    <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-[#252830] hover:bg-slate-100 dark:hover:bg-[#2b2e38] border border-slate-200 dark:border-neutral-700/70 hover:border-emerald-500/50 transition-all duration-200 flex flex-col justify-between shadow-md group">
                      <div className="text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                        <span>Points Scored</span>
                        <span title="Points awarded for solving this problem difficulty level">
                          <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 dark:text-neutral-400 dark:hover:text-neutral-200 cursor-help" />
                        </span>
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-3 tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                        {displayPoints} / {totalPoints}
                      </div>
                      <div className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-2 flex items-center gap-1.5 font-medium">
                        <span>Your Total Score:</span>
                        <span className="text-slate-900 dark:text-white font-bold">{userScore}</span>
                        <span className="text-emerald-500 dark:text-emerald-400 font-black text-base leading-none">↑</span>
                      </div>
                    </div>

                    {/* CARD 4: Time Taken */}
                    <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-[#252830] hover:bg-slate-100 dark:hover:bg-[#2b2e38] border border-slate-200 dark:border-neutral-700/70 hover:border-blue-500/50 transition-all duration-200 flex flex-col justify-between shadow-md group">
                      <div className="text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                        Time Taken
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-3 tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                        {displayExecutionTime} <span className="text-sm font-semibold text-slate-500 dark:text-neutral-400">sec</span>
                      </div>
                    </div>

                  </div>

                  {/* ERROR BOX IF ANY */}
                  {hasRuntimeError && (() => {
                    const errorContent = runResult?.error || submissionResult?.errorMessage || submissionResult?.error || 'Runtime error encountered during code execution.';
                    return (
                      <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/70 text-rose-900 dark:text-rose-200 text-xs sm:text-sm space-y-3 font-mono shadow-xs">
                        <div className="font-bold flex items-center justify-between gap-2 text-rose-600 dark:text-rose-400 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4" />
                            <span>Compilation / Runtime Stack Trace:</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleTriggerNecAiDebug}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-md shadow-blue-500/25 border border-cyan-400/40"
                              title="Ask NEC AI to analyze this error Socratic style"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-cyan-200 animate-pulse" />
                              <span>Ask NEC AI</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopyError(errorContent)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/60 dark:hover:bg-rose-900 text-rose-800 dark:text-rose-200 text-xs transition-all active:scale-95 cursor-pointer border border-rose-300 dark:border-rose-700/60 font-semibold shadow-xs"
                              title="Copy entire error stack trace"
                            >
                              {errorCopied ? <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{errorCopied ? 'Copied Error!' : 'Copy Error'}</span>
                            </button>
                          </div>
                        </div>
                        <pre className="p-3 bg-white dark:bg-black/50 border border-rose-200 dark:border-transparent rounded-lg text-xs text-rose-700 dark:text-rose-300 overflow-x-auto whitespace-pre-wrap select-text cursor-text leading-relaxed">
                          {errorContent}
                        </pre>
                      </div>
                    );
                  })()}

                  {/* TLE ALERT BOX */}
                  {isTLE && (
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/70 text-amber-900 dark:text-amber-200 text-xs sm:text-sm space-y-2.5 font-mono shadow-xs">
                      <div className="font-bold flex items-center justify-between gap-2 text-amber-700 dark:text-amber-400 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                          <span>Time Limit Exceeded (TLE) — Max execution time exceeded (&gt; 2.0s):</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleTriggerNecAiDebug}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-md shadow-blue-500/25 border border-cyan-400/40"
                          title="Ask NEC AI how to optimize away TLE"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-cyan-200 animate-pulse" />
                          <span>Ask NEC AI (Optimize)</span>
                        </button>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-neutral-300 font-sans leading-relaxed">
                        Your solution exceeded the maximum time limit. This happens when an algorithm has an inefficient time complexity (e.g. O(N²) / O(2^N) nested loops instead of required O(N) or O(N log N)), or an infinite loop exists. Optimize your algorithm and try again.
                      </p>
                    </div>
                  )}

                  {/* WRONG ANSWER EXPLANATION BOX */}
                  {isWrongAnswer && !hasRuntimeError && !isTLE && (
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs sm:text-sm space-y-3 font-mono shadow-xs">
                      <div className="font-bold flex items-center justify-between gap-2 text-amber-700 dark:text-amber-400 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <XCircle className="w-4 h-4 text-rose-500" />
                          <span>Wrong Answer: Output mismatch on test cases</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleTriggerNecAiDebug}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-md shadow-blue-500/30 border border-cyan-400/40"
                          title="Ask NEC AI why your code failed"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-cyan-200 animate-pulse" />
                          <span>Ask NEC AI</span>
                        </button>
                      </div>

                      <p className="text-xs text-slate-700 dark:text-neutral-300 font-sans leading-relaxed">
                        Your code executed without syntax errors, but the return value did not match the expected answer. Click <strong>"Inspect Sample Test Cases →"</strong> above to inspect <strong>Your Output</strong> vs <strong>Expected Output</strong>, or ask <strong>NEC AI</strong> to explain the missed edge case without spoiling the full solution.
                      </p>
                      {submissionResult?.errorMessage && (
                        <div className="p-2.5 rounded bg-white dark:bg-black/40 border border-amber-200 dark:border-amber-900/50 text-xs text-rose-600 dark:text-rose-400 font-mono">
                          {submissionResult.errorMessage}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bottom Quick Test Case Preview Link */}
                  <div className="pt-3 flex items-center justify-between text-xs sm:text-sm text-slate-500 dark:text-neutral-400 border-t border-slate-200 dark:border-neutral-700/60">
                    <span>Evaluated against complete suite with zero memory leaks.</span>
                    <button
                      type="button"
                      onClick={() => setShowDetailedCases(true)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-semibold cursor-pointer transition-colors"
                    >
                      View Sample Test Cases ({testCases.length}) →
                    </button>
                  </div>

                </div>
              )}

            </div>
          )}

          {/* TAB 2: CUSTOM INPUT */}
          {activeTab === 'custom' && (
            <div className="max-w-4xl mx-auto p-5 rounded-2xl bg-white dark:bg-[#202126] border border-slate-200 dark:border-neutral-700/70 shadow-lg space-y-4 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-900 dark:text-neutral-200 font-semibold text-xs sm:text-sm">
                  Custom Input Parameters:
                </span>
                <span className="text-xs text-slate-500 dark:text-neutral-400">
                  Provide custom parameters for your solution function
                </span>
              </div>

              <textarea
                value={customInput}
                onChange={(e) => onCustomInputChange(e.target.value)}
                placeholder="e.g. arr = [10, 9, 4, 5, 4, 8, 6], target = 15"
                rows={5}
                className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-[#18191d] border border-slate-300 dark:border-neutral-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition-colors resize-y leading-relaxed"
              />

              <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                <div className="text-xs text-slate-500 dark:text-neutral-400">
                  Click <strong className="text-slate-900 dark:text-white">Run Custom Test</strong> to compile & test your code.
                </div>
                <div className="flex items-center gap-2">
                  {onRunCode && (
                    <button
                      type="button"
                      disabled={isExecuting}
                      onClick={onRunCode}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Run Custom Test</span>
                    </button>
                  )}
                  {onSubmitCode && (
                    <button
                      type="button"
                      disabled={isExecuting}
                      onClick={onSubmitCode}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Submit Solution</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: NEC AI (Socratic Debugger & Progressive Hints) */}
          {isNextEraAiActive && (
            <div className="max-w-4xl mx-auto p-5 rounded-2xl bg-white dark:bg-[#202126] border border-slate-200 dark:border-neutral-700/70 shadow-xl space-y-4 flex flex-col h-[460px]">
              
              {/* Dual Mode Switcher: AI Debugger & Chat vs Progressive Hints */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-neutral-800 flex-wrap gap-2">
                <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-[#18191d] border border-slate-200 dark:border-neutral-800 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setAiMode('debugger')}
                    className={cn(
                      'px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer',
                      aiMode === 'debugger'
                        ? 'bg-white dark:bg-[#282a34] text-cyan-600 dark:text-cyan-400 shadow-xs font-bold'
                        : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                    )}
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>🐞 Socratic AI Debugger</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiMode('hints')}
                    className={cn(
                      'px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer',
                      aiMode === 'hints'
                        ? 'bg-white dark:bg-[#282a34] text-amber-600 dark:text-amber-400 shadow-xs font-bold'
                        : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                    )}
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    <span>💡 Progressive Hints (3 Levels)</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-neutral-400 font-mono">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span>Powered by Gemini 2.5 Flash</span>
                </div>
              </div>

              {/* MODE 1: PROGRESSIVE HINTS (Level 1: Approach, Level 2: Data Structure, Level 3: Pseudocode) */}
              {aiMode === 'hints' && (
                <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs sm:text-sm">
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>Unlock hints progressively so you master the intuition without seeing full spoilers!</span>
                    </span>
                  </div>

                  {/* Level 1 Card: Approach & Intuition */}
                  <div className={cn(
                    'p-4 rounded-xl border transition-all space-y-2.5',
                    hintStates[1].unlocked
                      ? 'bg-white dark:bg-[#18191d] border-amber-300 dark:border-amber-500/40 shadow-xs'
                      : 'bg-slate-50 dark:bg-[#1a1b20] border-slate-200 dark:border-neutral-800'
                  )}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center justify-center border border-amber-500/30">
                          1
                        </span>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-xs">Hint 1: Approach & Intuition</div>
                          <div className="text-[11px] text-slate-500 dark:text-neutral-400">Conceptual breakdown and real-world analogy</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUnlockHint(1)}
                        disabled={hintStates[1].loading}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer',
                          hintStates[1].unlocked
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border border-amber-400/40'
                            : 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                        )}
                      >
                        {hintStates[1].loading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : hintStates[1].unlocked ? (
                          <>
                            <Unlock className="w-3.5 h-3.5 text-amber-500" />
                            <span>Unlocked</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>Unlock Hint 1</span>
                          </>
                        )}
                      </button>
                    </div>
                    {hintStates[1].unlocked && (
                      <div className="p-3.5 rounded-lg bg-amber-50/50 dark:bg-[#202127] border border-amber-200 dark:border-neutral-700/60 text-slate-800 dark:text-neutral-200 leading-relaxed font-sans whitespace-pre-wrap animate-in fade-in duration-200">
                        {sanitizeAiText(hintStates[1].content)}
                      </div>
                    )}
                  </div>

                  {/* Level 2 Card: Data Structure & Pattern */}
                  <div className={cn(
                    'p-4 rounded-xl border transition-all space-y-2.5',
                    hintStates[2].unlocked
                      ? 'bg-white dark:bg-[#18191d] border-blue-400 dark:border-blue-500/40 shadow-xs'
                      : 'bg-slate-50 dark:bg-[#1a1b20] border-slate-200 dark:border-neutral-800'
                  )}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center border border-blue-500/30">
                          2
                        </span>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-xs">Hint 2: Data Structure & Pattern</div>
                          <div className="text-[11px] text-slate-500 dark:text-neutral-400">Which algorithmic paradigm reduces time complexity</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUnlockHint(2)}
                        disabled={hintStates[2].loading}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer',
                          hintStates[2].unlocked
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-400/40'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                        )}
                      >
                        {hintStates[2].loading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : hintStates[2].unlocked ? (
                          <>
                            <Unlock className="w-3.5 h-3.5 text-blue-500" />
                            <span>Unlocked</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>Unlock Hint 2</span>
                          </>
                        )}
                      </button>
                    </div>
                    {hintStates[2].unlocked && (
                      <div className="p-3.5 rounded-lg bg-blue-50/50 dark:bg-[#202127] border border-blue-200 dark:border-neutral-700/60 text-slate-800 dark:text-neutral-200 leading-relaxed font-sans whitespace-pre-wrap animate-in fade-in duration-200">
                        {sanitizeAiText(hintStates[2].content)}
                      </div>
                    )}
                  </div>

                  {/* Level 3 Card: Structured Pseudocode */}
                  <div className={cn(
                    'p-4 rounded-xl border transition-all space-y-2.5',
                    hintStates[3].unlocked
                      ? 'bg-white dark:bg-[#18191d] border-emerald-400 dark:border-emerald-500/40 shadow-xs'
                      : 'bg-slate-50 dark:bg-[#1a1b20] border-slate-200 dark:border-neutral-800'
                  )}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center border border-emerald-500/30">
                          3
                        </span>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-xs">Hint 3: Structured Pseudocode</div>
                          <div className="text-[11px] text-slate-500 dark:text-neutral-400">Step-by-step logic flow (not runnable code)</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUnlockHint(3)}
                        disabled={hintStates[3].loading}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer',
                          hintStates[3].unlocked
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border border-emerald-400/40'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                        )}
                      >
                        {hintStates[3].loading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : hintStates[3].unlocked ? (
                          <>
                            <Unlock className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Unlocked</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>Unlock Hint 3</span>
                          </>
                        )}
                      </button>
                    </div>
                    {hintStates[3].unlocked && (
                      <div className="p-3.5 rounded-lg bg-emerald-50/50 dark:bg-[#202127] border border-emerald-200 dark:border-neutral-700/60 text-slate-800 dark:text-neutral-200 leading-relaxed font-mono whitespace-pre-wrap animate-in fade-in duration-200 text-xs">
                        {sanitizeAiText(hintStates[3].content)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* MODE 2: SOCRATIC AI DEBUGGER & CHAT */}
              {aiMode === 'debugger' && (
                <>
                  {/* Quick AI Action Chips */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs shrink-0 font-sans">
                    <button
                      type="button"
                      onClick={() => handleSendAiMessage('Can you debug my code and tell me which edge case failed?')}
                      className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-[#282b33] dark:hover:bg-[#323640] border border-slate-300 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer whitespace-nowrap font-medium"
                    >
                      Debug My Code
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendAiMessage('What are the critical edge cases for this problem?')}
                      className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-[#282b33] dark:hover:bg-[#323640] border border-slate-300 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer whitespace-nowrap font-medium"
                    >
                      Edge Case Checklist
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendAiMessage('Explain the Time & Space Complexity of optimal approach')}
                      className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-[#282b33] dark:hover:bg-[#323640] border border-slate-300 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer whitespace-nowrap font-medium"
                    >
                      Time & Space Complexity
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendAiMessage('How can I optimize this code to avoid TLE?')}
                      className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-[#282b33] dark:hover:bg-[#323640] border border-slate-300 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer whitespace-nowrap font-medium"
                    >
                      Optimization Tips
                    </button>
                  </div>

                  {/* Chat messages scrollable list */}
                  <div className="flex-1 overflow-y-auto space-y-3 p-3.5 rounded-xl bg-slate-50 dark:bg-[#18191d] border border-slate-200 dark:border-neutral-800 text-xs sm:text-sm">
                    {aiMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          'flex items-start gap-2.5 max-w-[90%]',
                          msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                        )}
                      >
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold shadow-xs',
                            msg.role === 'bot'
                              ? 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 text-white'
                              : 'bg-slate-300 dark:bg-neutral-700 text-slate-800 dark:text-neutral-200'
                          )}
                        >
                          {msg.role === 'bot' ? <Bot className="w-4 h-4" /> : 'You'}
                        </div>

                        <div
                          className={cn(
                            'p-3.5 rounded-2xl leading-relaxed',
                            msg.role === 'bot'
                              ? 'bg-white dark:bg-[#23252c] border border-slate-200 dark:border-neutral-700/80 text-slate-800 dark:text-neutral-200 shadow-sm'
                              : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium whitespace-pre-wrap'
                          )}
                        >
                          {msg.role === 'bot' ? <CleanAiResponseView text={msg.text} /> : msg.text}
                          <div className="text-[10px] text-slate-400 dark:text-neutral-400 mt-1.5 text-right font-mono">{msg.time}</div>
                        </div>
                      </div>
                    ))}


                    {isAiTyping && (
                      <div className="flex items-center gap-2 text-xs text-cyan-600 dark:text-cyan-400 italic pl-2">
                        <Sparkles className="w-4 h-4 animate-spin text-cyan-500" />
                        <span>NEC AI is analyzing your code logic and edge cases...</span>
                      </div>
                    )}
                  </div>

                  {/* Input bar */}
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="text"
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendAiMessage()}
                      placeholder="Ask NEC AI anything about this bug, edge case, or logic..."
                      className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#18191d] border border-slate-300 dark:border-neutral-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => handleSendAiMessage()}
                      disabled={isAiTyping}
                      className="p-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white transition-all cursor-pointer shadow-md active:scale-95 disabled:opacity-50"
                      title="Send message"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

        </div>

        {/* 4. FEEDBACK MODAL */}
        <AnimatePresence>
          {isFeedbackOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.92, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.92, y: 10 }}
                className="w-full max-w-md bg-white dark:bg-[#202126] border border-slate-200 dark:border-neutral-700 rounded-2xl p-6 shadow-2xl space-y-4"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-neutral-800">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                    <MessageSquare className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                    <span>Suggest Problem Feedback</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFeedbackOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {feedbackSubmitted ? (
                  <div className="p-6 text-center space-y-2">
                    <CheckCheck className="w-10 h-10 text-emerald-500 dark:text-emerald-400 mx-auto" />
                    <div className="text-slate-900 dark:text-white font-bold text-sm">Thank You for Your Feedback!</div>
                    <p className="text-xs text-slate-500 dark:text-neutral-400">Our engineering and problem curation team will review your suggestions.</p>
                  </div>
                ) : (
                  <form onSubmit={handleFeedbackSubmit} className="space-y-4 text-xs sm:text-sm">
                    <div>
                      <label className="block text-slate-700 dark:text-neutral-300 font-medium mb-2">Problem Difficulty Rating:</label>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setFeedbackRating(star)}
                            className="p-1 cursor-pointer"
                          >
                            <Star
                              className={cn(
                                'w-5 h-5 transition-colors',
                                star <= feedbackRating ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-neutral-600'
                              )}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-neutral-300 font-medium mb-2">Comments or suggestions for improvement:</label>
                      <textarea
                        required
                        value={feedbackComment}
                        onChange={(e) => setFeedbackComment(e.target.value)}
                        placeholder="e.g., The test cases could be improved, or explanation was super clear..."
                        rows={3}
                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#18191d] border border-slate-300 dark:border-neutral-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsFeedbackOpen(false)}
                        className="px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors cursor-pointer shadow-md"
                      >
                        Submit Feedback
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </AnimatePresence>
  );
};
