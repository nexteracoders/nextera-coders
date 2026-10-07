import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords,
  Timer,
  Coins,
  ArrowLeft,
  Play,
  CloudUpload,
  RotateCcw,
  Trophy,
  Code2,
  FileText,
  Lightbulb,
  AlertCircle,
  Copy,
  Users,
  Loader2,
  MessageSquare,
  Send,
  ChevronDown,
  Bot,
  Crown,
  Eye,
  Check,
  Terminal,
  Sparkles,
  X,
  LogOut,
  Share2,
  RefreshCw,
} from 'lucide-react';
import { duelService, ICodeDuel, IDuelProblem, IDuelPlayer, IDuelAntiCheat, IDuelAntiCheatLog } from '../../services/duel.service';
import { CodeDuelRulebookModal } from '../../components/duel/CodeDuelRulebookModal';
import { PrimeDuelRulebookModal } from '../../components/duel/PrimeDuelRulebookModal';
import { DuelShareModal } from '../../components/duel/DuelShareModal';
import { PrimePotCollectionOverlay } from '../../components/duel/PrimePotCollectionOverlay';
import { socketService, IDuelChatMessage } from '../../services/socket.service';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/ui/Toast';
import { ProfessionalCodeEditor } from '../../components/code/ProfessionalCodeEditor';
import { ThemeToggle } from '../../components/common/ThemeToggle';
import { cn } from '../../utils/cn';
import { useAutoLandscape } from '../../hooks/useAutoLandscape';
import { MobileLandscapePrompt } from '../../components/common/MobileLandscapePrompt';
import { getCleanStarterCode } from '../../utils/starterCode';
import { OutputWindowDrawer, TestCaseItem } from '../../components/code/OutputWindowDrawer';
import { necAiService } from '../../services/necAi.service';
import Prism from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-java';

export const DuelArenaPage: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: toastError, info } = useToast();

  // Automatic landscape optimization on mobile for 1v1 battle coding
  const { showPrompt, dismissPrompt, lockLandscape } = useAutoLandscape();

  const cleanRoomCode = (roomCode || '').toUpperCase();
  const currentUserId = (user?._id || user?.id || '').toString();

  // Duel State
  const [duel, setDuel] = useState<ICodeDuel | null>(null);
  const [showPrimeStakingIntro, setShowPrimeStakingIntro] = useState<boolean>(false);
  const [isRulebookOpen, setIsRulebookOpen] = useState(false);
  const [showLeaveConfirmModal, setShowLeaveConfirmModal] = useState(false);
  const [problem, setProblem] = useState<IDuelProblem | null>(null);
  const [loading, setLoading] = useState(true);

  // 15-Minute Countdown Timer (in seconds)
  const [timeRemaining, setTimeRemaining] = useState<number>(900);

  // Editor State
  const [selectedLanguage, setSelectedLanguage] = useState<string>('java');
  const [code, setCode] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStartingNow, setIsStartingNow] = useState(false);

  // Real-Time Opponent & My Code Written Percentage (0 - 100%)
  const [opponentCodePercent, setOpponentCodePercent] = useState<number>(0);
  const [myCodePercent, setMyCodePercent] = useState<number>(0);

  // Anti-Cheat Tracking State
  const [tabSwitchesCount, setTabSwitchesCount] = useState<number>(0);
  const [pasteCount, setPasteCount] = useState<number>(0);
  const duelStartTimeRef = useRef<number>(Date.now());
  const antiCheatLogsRef = useRef<IDuelAntiCheatLog[]>([]);

  // Sliding OutputWindowDrawer Compiler Popup on Run Tests & Submit
  const [isOutputDrawerOpen, setIsOutputDrawerOpen] = useState<boolean>(false);
  const [isOutputDrawerMinimized, setIsOutputDrawerMinimized] = useState<boolean>(false);
  const [outputDrawerTab, setOutputDrawerTab] = useState<'results' | 'custom' | 'arena-ai' | 'yogi'>('results');
  const [selectedCaseIdx, setSelectedCaseIdx] = useState<number>(0);
  const [customInput, setCustomInput] = useState<string>('');
  const [runResult, setRunResult] = useState<{
    output?: string;
    error?: string;
    executionTime?: number;
    memory?: number;
    passed?: boolean;
  } | null>(null);
  const [submissionResult, setSubmissionResult] = useState<{
    status: string;
    testCasesPassed: number;
    totalTestCases: number;
    executionTime?: number;
    memory?: number;
    error?: string;
    errorMessage?: string;
    coinsAwarded?: number;
  } | null>(null);
  const [runTestCaseDetails, setRunTestCaseDetails] = useState<
    Array<{
      input: string;
      expectedOutput: string;
      actualOutput?: string;
      passed?: boolean;
      status?: string;
      executionTime?: number;
      error?: string;
    }>
  >([]);

  // Post-Battle Solution Code Viewer Modal
  const [inspectingPlayerCode, setInspectingPlayerCode] = useState<{
    name: string;
    profileImage?: string;
    college?: string;
    userId: string;
    isMe: boolean;
    isWinner: boolean;
    passedTests: number;
    totalTests: number;
    status: string;
    code: string;
    language: string;
    isAi?: boolean;
    executionTime?: number;
    submittedAt?: string;
    explanation?: string;
  } | null>(null);
  const [hasCopiedCode, setHasCopiedCode] = useState<boolean>(false);

  // Evaluation & Results
  const [myPassedTests, setMyPassedTests] = useState<number>(0);
  const [totalTests, setTotalTests] = useState<number>(3);
  const [lastOutput, setLastOutput] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  // Multi-Player Competitor Status Dictionary
  const [competitorsProgress, setCompetitorsProgress] = useState<
    Record<string, { passed: number; total: number; isTyping: boolean; codePercent?: number }>
  >({});

  // Opponent Live Status (Legacy 1v1 helper)
  const [opponentTyping, setOpponentTyping] = useState<boolean>(false);
  const [opponentProgress, setOpponentProgress] = useState<{ passed: number; total: number }>({ passed: 0, total: 3 });
  const [opponentLeftNotice, setOpponentLeftNotice] = useState<boolean>(false);

  // Active vs Left Members Tracking (Multiplayer & 1v1)
  const [leftPlayerIds, setLeftPlayerIds] = useState<string[]>([]);

  // Initialize left players from duel state (excluding current user)
  useEffect(() => {
    if (duel?.players) {
      const forfeited = duel.players
        .filter((p) => p.status === 'forfeited' && p.userId.toString() !== currentUserId)
        .map((p) => p.userId.toString());
      setLeftPlayerIds(forfeited);
    }
  }, [duel, currentUserId]);

  // Ensure starter boilerplate code is initialized and never blank
  useEffect(() => {
    if (problem) {
      setCode((prev) => {
        if (!prev || !prev.trim()) {
          return getCleanStarterCode(problem, selectedLanguage);
        }
        return prev;
      });
    }
  }, [problem, selectedLanguage]);

  // Game Over Modal State
  const [gameOverResult, setGameOverResult] = useState<{
    status: string;
    isWinner: boolean;
    winnerId?: string;
    winnerName: string;
    winningReason?: string;
    coinsAwarded: number;
    timeTakenSeconds?: number;
  } | null>(null);
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState<boolean>(true);

  // Room Share Modal States
  const [showShareModal, setShowShareModal] = useState<boolean>(false);

  // 10-Second Simple Left/Join/Rejoin Alert Banner State
  const [arenaAlert, setArenaAlert] = useState<{
    id: string;
    message: string;
    type: 'left' | 'join' | 'rejoin';
    timestamp: number;
  } | null>(null);
  const arenaAlertTimerRef = useRef<any>(null);

  const triggerArenaAlert = (message: string, type: 'left' | 'join' | 'rejoin' = 'left') => {
    if (arenaAlertTimerRef.current) clearTimeout(arenaAlertTimerRef.current);
    const id = `alert_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setArenaAlert({ id, message, type, timestamp: Date.now() });
    // Strictly 10 seconds auto-dismiss
    arenaAlertTimerRef.current = setTimeout(() => {
      setArenaAlert(null);
    }, 10000);
  };

  // Rematch / Replay States (Replacing Return to Lobby)
  const [rematchStatus, setRematchStatus] = useState<'idle' | 'requesting' | 'incoming' | 'declined'>('idle');
  const [rematchRequesterName, setRematchRequesterName] = useState<string>('');
  const [rematchCountdown, setRematchCountdown] = useState<number>(30);
  const rematchCountdownTimerRef = useRef<any>(null);

  // Left Pane Active Tab (Includes Competitors Leaderboard)
  const [activeTab, setActiveTab] = useState<'description' | 'hints' | 'results' | 'competitors'>('description');

  // Live In-Battle Chat State
  const [chatMessages, setChatMessages] = useState<IDuelChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const isChatOpenRef = useRef(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Floating Chat Notification Popover State
  const [chatNotification, setChatNotification] = useState<{
    id: string;
    senderName: string;
    message: string;
    isAi: boolean;
    isExiting?: boolean;
  } | null>(null);
  const notifDismissTimerRef = useRef<any>(null);
  const notifExitTimerRef = useRef<any>(null);

  // Chat Typing Indicator State
  const [chatTypingUsers, setChatTypingUsers] = useState<Record<string, boolean>>({});
  const chatTypingTimeoutRef = useRef<any>(null);

  // Sync ref with isChatOpen
  useEffect(() => {
    isChatOpenRef.current = isChatOpen;
    if (isChatOpen) {
      setUnreadChatCount(0);
    }
  }, [isChatOpen]);

  // Scroll chat to bottom on new message
  useEffect(() => {
    if (isChatOpen && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, isChatOpen]);

  // Append in-battle chat message with strict deduplication guard
  const appendChatMessage = (msg: IDuelChatMessage) => {
    setChatMessages((prev) => {
      // Deduplicate by message ID
      if (prev.some((m) => m.id === msg.id)) return prev;
      // Deduplicate consecutive identical messages from the same sender (prevents 2x join/left bug)
      const last = prev[prev.length - 1];
      if (last && last.senderName === msg.senderName && last.message.trim() === msg.message.trim()) {
        return prev;
      }
      return [...prev, msg];
    });
  };

  // 30-Second Rematch Countdown Engine
  useEffect(() => {
    if (rematchStatus === 'requesting' || rematchStatus === 'incoming') {
      if (rematchCountdownTimerRef.current) clearInterval(rematchCountdownTimerRef.current);
      rematchCountdownTimerRef.current = setInterval(() => {
        setRematchCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(rematchCountdownTimerRef.current);
            if (rematchStatus === 'requesting') {
              setRematchStatus('declined');
            } else {
              setRematchStatus('idle');
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (rematchCountdownTimerRef.current) clearInterval(rematchCountdownTimerRef.current);
    }
    return () => {
      if (rematchCountdownTimerRef.current) clearInterval(rematchCountdownTimerRef.current);
    };
  }, [rematchStatus]);

  // Interactive Conversational AI response when chatting in battle
  const handleAiChatResponse = async (userMsg: string) => {
    // Show AI typing briefly for both code and chat
    setCompetitorsProgress((prev) => {
      if (!aiPlayer) return prev;
      return {
        ...prev,
        [aiPlayer.userId.toString()]: {
          ...(prev[aiPlayer.userId.toString()] || { passed: opponentProgress.passed, total: totalTests }),
          isTyping: true,
        },
      };
    });
    setChatTypingUsers((prev) => ({ ...prev, 'NEC AI (Grandmaster)': true }));

    const lower = userMsg.toLowerCase();
    let replyText = '';

    try {
      // Attempt live Gemini mentor chat
      const aiRes = await necAiService.chatWithMentor({
        problemTitle: problem?.title || 'Coding Problem',
        problemDescription: problem?.description,
        code,
        language: selectedLanguage,
        message: userMsg,
      });

      if (aiRes && aiRes.message) {
        // Keep it punchy for in-battle duel chat
        replyText = aiRes.message.split('\n')[0].substring(0, 160);
      }
    } catch {
      // Fallback heuristics if backend mentor route times out
    }

    if (!replyText) {
      if (lower.includes('hint') || lower.includes('help') || lower.includes('kaise') || lower.includes('logic') || lower.includes('approach')) {
        replyText = 'Hint: Focus on input constraints! If N <= 10^5, aim for an O(N) single-pass with HashMap or two-pointers! 💡';
      } else if (lower.includes('edge') || lower.includes('corner') || lower.includes('test')) {
        replyText = 'Watch out for boundary inputs: empty arrays, single elements, negative values, and duplicate keys! ⚠️';
      } else if (lower.includes('complexity') || lower.includes('time') || lower.includes('space')) {
        replyText = 'An optimal algorithm achieves O(N) time and O(1) or O(N) space. Avoid O(N²) nested loops! ⏱️';
      } else if (lower.includes('hi') || lower.includes('hello') || lower.includes('hey') || lower.includes('namaste')) {
        replyText = "Hello! I am NEC AI. May the most optimal algorithm win this battle! 🤖⚡";
      } else if (lower.includes('win') || lower.includes('jeet') || lower.includes('lose') || lower.includes('har')) {
        replyText = 'Speed and accuracy both count! Whoever passes all test cases first takes the crown! 🏆';
      } else {
        replyText = "My algorithm is currently running at peak efficiency. Keep coding, you've got this! 🚀";
      }
    }

    setTimeout(() => {
      socketService.sendDuelChatMessage(cleanRoomCode, replyText, 'NEC AI (Grandmaster)');
      setCompetitorsProgress((prev) => {
        if (!aiPlayer) return prev;
        return {
          ...prev,
          [aiPlayer.userId.toString()]: {
            ...(prev[aiPlayer.userId.toString()] || { passed: opponentProgress.passed, total: totalTests }),
            isTyping: false,
          },
        };
      });
      setChatTypingUsers((prev) => ({ ...prev, 'NEC AI (Grandmaster)': false }));
    }, 1400);
  };

  const handleChatInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setChatInput(val);

    if (chatTypingTimeoutRef.current) clearTimeout(chatTypingTimeoutRef.current);
    socketService.sendDuelChatTyping(cleanRoomCode, true, user?.name || 'Opponent');

    chatTypingTimeoutRef.current = setTimeout(() => {
      socketService.sendDuelChatTyping(cleanRoomCode, false, user?.name || 'Opponent');
    }, 1500);
  };

  const handleSendChat = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const userMsg = chatInput.trim();
    if (!userMsg) return;

    if (chatTypingTimeoutRef.current) clearTimeout(chatTypingTimeoutRef.current);
    socketService.sendDuelChatTyping(cleanRoomCode, false, user?.name || 'Opponent');

    socketService.sendDuelChatMessage(cleanRoomCode, userMsg, user?.name || 'You');
    setChatInput('');

    // If battling against NEC AI, have the bot respond dynamically
    if (hasAiPlayer) {
      handleAiChatResponse(userMsg);
    }
  };

  // User Forfeits / Leaves the duel
  const handleConfirmLeave = () => {
    setShowLeaveConfirmModal(false);
    const effectiveTeamSize = duel?.maxParticipants || duel?.players?.length || 2;
    // socketService.leaveDuel broadcasts duel:opponent_left to all remaining players
    socketService.leaveDuel(cleanRoomCode, currentUserId, user?.name, effectiveTeamSize);
    // Explicitly record leftAt on backend to start 2-minute rejoin window
    duelService.leaveDuel(cleanRoomCode).catch(() => {});
    info('You have left the battle arena.');
    navigate(duel?.duelType === 'prime' ? '/practice/prime-duels' : '/practice/duels');
  };

  // If player navigates away / unmounts during an active unfinished battle
  const duelUnmountStateRef = useRef({ duel, gameOverResult, cleanRoomCode, currentUserId, userName: user?.name });
  useEffect(() => {
    duelUnmountStateRef.current = { duel, gameOverResult, cleanRoomCode, currentUserId, userName: user?.name };
  });

  useEffect(() => {
    return () => {
      const state = duelUnmountStateRef.current;
      if (state.duel && (state.duel.status === 'in-progress' || state.duel.status === 'waiting') && !state.gameOverResult) {
        socketService.leaveDuel(state.cleanRoomCode, state.currentUserId, state.userName);
        duelService.leaveDuel(state.cleanRoomCode).catch(() => {});
      }
    };
  }, []);



  // Rematch / Replay Handlers
  const handleRequestRematch = () => {
    if (rematchStatus === 'requesting') return;
    setRematchStatus('requesting');
    setRematchCountdown(30);
    socketService.sendDuelRematchRequest(cleanRoomCode, user?.name || 'You', currentUserId);
    info('Rematch request sent! Waiting for opponent to respond (30s)...');
  };

  const handleAcceptRematch = async () => {
    try {
      info('Accepting rematch! Starting new battle...');
      await duelService.rematchDuel(cleanRoomCode);
      setRematchStatus('idle');
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to start rematch');
      setRematchStatus('idle');
    }
  };

  const handleDeclineRematch = () => {
    socketService.sendDuelRematchDecline(cleanRoomCode, user?.name || 'Opponent');
    setRematchStatus('idle');
  };

  // Active chat typing users (excluding self)
  const activeChatTypers = useMemo(() => {
    return Object.entries(chatTypingUsers)
      .filter(([name, isTyping]) => isTyping && name !== (user?.name || 'You'))
      .map(([name]) => name);
  }, [chatTypingUsers, user?.name]);

  const myTypingTimeoutRef = useRef<any>(null);
  const opponentTypingTimeoutRef = useRef<any>(null);

  // Identify Opponent Player & AI presence
  const opponentPlayer = duel?.players.find((p) => p.userId.toString() !== currentUserId) || duel?.players[1];
  const isHost = duel?.players[0]?.userId?.toString() === currentUserId;
  const aiPlayer = duel?.players.find((p) => p.isAi || p.name.includes('NEC AI'));
  const hasAiPlayer = Boolean(aiPlayer);

  // An opponent is left if they are in leftPlayerIds OR their status is 'forfeited'
  // Note: currentUserId is NEVER considered left on their own active workstation
  const isPlayerLeft = (p: IDuelPlayer): boolean => {
    const pid = p.userId.toString();
    if (pid === currentUserId) {
      return false;
    }
    return leftPlayerIds.includes(pid) || p.status === 'forfeited';
  };

  const leftMembersCount = useMemo(() => {
    if (!duel) return 0;
    return duel.players.filter(isPlayerLeft).length;
  }, [duel, leftPlayerIds, currentUserId]);

  const activeMembersCount = useMemo(() => {
    if (!duel) return 1;
    const count = duel.players.filter((p) => !isPlayerLeft(p)).length;
    return count;
  }, [duel, leftPlayerIds, currentUserId]);

  // Opponent player left check
  const isOpponentLeft = Boolean(opponentPlayer && (isPlayerLeft(opponentPlayer) || opponentLeftNotice));

  // Sorted Performance Standings for Game Over Modal
  const sortedStandings = useMemo(() => {
    if (!duel) return [];

    // Determine the definitive winner ID from result or duel state
    const trueWinnerId = (gameOverResult?.winnerId || duel.winnerId)?.toString();

    const list = [...duel.players].map((p, idx) => {
      const isMe = p.userId.toString() === currentUserId;
      let passed = isMe
        ? myPassedTests
        : competitorsProgress[p.userId.toString()]?.passed ?? p.testCasesPassed ?? (p.isAi ? opponentProgress.passed : 0);

      // Accurate winner check: Prioritize unique userId matching
      let isWinner = false;
      if (trueWinnerId) {
        isWinner = p.userId.toString() === trueWinnerId;
      } else if (gameOverResult) {
        if (gameOverResult.isWinner) {
          isWinner = isMe;
        } else if (duel.players.length === 2) {
          isWinner = !isMe;
        } else if (gameOverResult.winnerName && gameOverResult.winnerName !== 'Opponent') {
          isWinner = p.name.trim().toLowerCase() === gameOverResult.winnerName.trim().toLowerCase();
        }
      }

      // Ensure winner and submitted players reflect 100% tests passed
      if (isWinner || p.status === 'submitted') {
        passed = Math.max(passed, totalTests);
      }

      return {
        player: p,
        idx,
        isMe,
        passed,
        total: totalTests,
        isWinner,
      };
    });

    // Rank 1: Winner, followed by higher passed test cases
    list.sort((a, b) => {
      if (a.isWinner && !b.isWinner) return -1;
      if (!a.isWinner && b.isWinner) return 1;
      return b.passed - a.passed;
    });

    return list;
  }, [duel, myPassedTests, competitorsProgress, opponentProgress.passed, totalTests, gameOverResult, currentUserId]);

  // NEC AI Simulation Engine (High Level Grandmaster Bot)
  useEffect(() => {
    if (!hasAiPlayer || !duel || duel.status !== 'in-progress' || Boolean(gameOverResult)) return;

    // Difficulty-based target solve time in seconds
    const diff = problem?.difficulty || 'Medium';
    const targetSolveSeconds = diff === 'Easy' ? 240 : diff === 'Hard' ? 480 : 360;

    let aiPassed = 0;
    const aiTotal = totalTests || 3;
    let elapsedSeconds = 0;

    // Welcome message from NEC AI at start
    const welcomeTimeout = setTimeout(() => {
      socketService.sendDuelChatMessage(
        cleanRoomCode,
        'Hello! I am NEC AI. May the most optimal algorithm win! 🤖⚡',
        'NEC AI (Grandmaster)'
      );
    }, 4000);

    // AI periodic cycle
    const aiInterval = setInterval(() => {
      elapsedSeconds += 2;

      // 1. Periodic Typing Bursts
      if (elapsedSeconds % 16 === 0) {
        setOpponentTyping(true);
        setTimeout(() => setOpponentTyping(false), 3500);
      }

      // 2. Incremental Test Cases Passed & Code Written %
      const progressFraction = elapsedSeconds / targetSolveSeconds;
      const aiPercent = Math.min(100, Math.max(10, Math.round(progressFraction * 100)));
      setOpponentCodePercent(aiPercent);

      if (progressFraction >= 0.3 && aiPassed < 1) {
        aiPassed = 1;
        setOpponentProgress({ passed: 1, total: aiTotal });
        if (aiPlayer) {
          setCompetitorsProgress((prev) => ({
            ...prev,
            [aiPlayer.userId.toString()]: { passed: 1, total: aiTotal, isTyping: false, codePercent: aiPercent },
          }));
        }
      } else if (progressFraction >= 0.65 && aiPassed < 2) {
        aiPassed = 2;
        setOpponentProgress({ passed: 2, total: aiTotal });
        if (aiPlayer) {
          setCompetitorsProgress((prev) => ({
            ...prev,
            [aiPlayer.userId.toString()]: { passed: 2, total: aiTotal, isTyping: false, codePercent: aiPercent },
          }));
        }
        // AI Mid-game Chat
        socketService.sendDuelChatMessage(
          cleanRoomCode,
          'Testing edge cases and boundary inputs... 2/3 passed on my end! 💻',
          'NEC AI (Grandmaster)'
        );
      } else if (progressFraction >= 1.0 && aiPassed < aiTotal) {
        // AI Solved All Test Cases First!
        aiPassed = aiTotal;
        setOpponentProgress({ passed: aiTotal, total: aiTotal });
        setOpponentCodePercent(100);
        clearInterval(aiInterval);

        // Broadcast game over and sync with backend
        setGameOverResult({
          status: 'completed',
          isWinner: false,
          winnerId: aiPlayer?.userId.toString(),
          winnerName: 'NEC AI (Grandmaster)',
          winningReason: 'solved_first',
          coinsAwarded: 0,
        });

        duelService.notifyAiWin(cleanRoomCode).catch((err) => {
          console.warn('AI win sync warning:', err?.message || err);
        });

        socketService.sendDuelChatMessage(
          cleanRoomCode,
          'All test cases passed! Submitting solution now. Good game! 🏆',
          'NEC AI (Grandmaster)'
        );
      } else if (aiPlayer) {
        setCompetitorsProgress((prev) => ({
          ...prev,
          [aiPlayer.userId.toString()]: {
            passed: aiPassed,
            total: aiTotal,
            isTyping: elapsedSeconds % 16 < 4,
            codePercent: aiPercent,
          },
        }));
      }
    }, 2000);

    return () => {
      clearTimeout(welcomeTimeout);
      clearInterval(aiInterval);
    };
  }, [hasAiPlayer, duel?.status, Boolean(gameOverResult), problem?.difficulty, totalTests, cleanRoomCode, aiPlayer]);

  // Host Early Battle Launch
  const handleStartBattleNow = async () => {
    if (isStartingNow) return;
    setIsStartingNow(true);
    try {
      const res = await duelService.startDuelNow(cleanRoomCode);
      success('Battle started early by host!');
      setDuel(res.duel);
      const isPrime = res.duel?.duelType === 'prime' || (res.duel?.entryFee && res.duel.entryFee > 0);
      if (isPrime) {
        sessionStorage.setItem(`prime_staking_${cleanRoomCode}`, 'shown');
        setShowPrimeStakingIntro(true);
      }
      if (res.problem) setProblem(res.problem);
      if (res.timeRemainingSeconds) setTimeRemaining(res.timeRemainingSeconds);
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to start battle');
    } finally {
      setIsStartingNow(false);
    }
  };

  // Canonical optimal solution generator for AI & Post-Battle review
  const getAiSolutionCode = (prob: IDuelProblem | null, lang: string): string => {
    // If backend provided pre-configured solution in DB
    if (prob?.solution && typeof prob.solution === 'string' && prob.solution.trim().length > 20) {
      return prob.solution;
    }

    const slug = (prob?.slug || '').toLowerCase();
    const l = (lang || 'java').toLowerCase();

    // 1. Two Sum
    if (slug.includes('two-sum')) {
      if (l === 'python' || l === 'python3') {
        return `# Optimal Two Sum Solution using Hash Map\n# Time Complexity: O(N) | Space Complexity: O(N)\nclass Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        seen = {}\n        for i, num in enumerate(nums):\n            complement = target - num\n            if complement in seen:\n                return [seen[complement], i]\n            seen[num] = i\n        return []\n`;
      }
      if (l === 'cpp' || l === 'c++') {
        return `// Optimal Two Sum Solution using unordered_map\n// Time Complexity: O(N) | Space Complexity: O(N)\n#include <vector>\n#include <unordered_map>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        unordered_map<int, int> numMap;\n        for (int i = 0; i < nums.size(); i++) {\n            int complement = target - nums[i];\n            if (numMap.count(complement)) {\n                return {numMap[complement], i};\n            }\n            numMap[nums[i]] = i;\n        }\n        return {};\n    }\n};\n`;
      }
      if (l === 'javascript' || l === 'typescript') {
        return `/**\n * Optimal Two Sum Solution using Map\n * Time Complexity: O(N) | Space Complexity: O(N)\n */\nclass Solution {\n    twoSum(nums, target) {\n        const map = new Map();\n        for (let i = 0; i < nums.length; i++) {\n            const complement = target - nums[i];\n            if (map.has(complement)) {\n                return [map.get(complement), i];\n            }\n            map.set(nums[i], i);\n        }\n        return [];\n    }\n}\n`;
      }
      return `// Optimal Two Sum Solution using HashMap\n// Time Complexity: O(N) | Space Complexity: O(N)\nimport java.util.HashMap;\nimport java.util.Map;\n\nclass Solution {\n    public int[] twoSum(int[] nums, int target) {\n        Map<Integer, Integer> map = new HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int complement = target - nums[i];\n            if (map.containsKey(complement)) {\n                return new int[] { map.get(complement), i };\n            }\n            map.put(nums[i], i);\n        }\n        return new int[] {};\n    }\n}\n`;
    }

    // 2. Valid Parentheses
    if (slug.includes('valid-parentheses') || slug.includes('parentheses')) {
      if (l === 'python' || l === 'python3') {
        return `# Optimal Valid Parentheses using Stack\n# Time Complexity: O(N) | Space Complexity: O(N)\nclass Solution:\n    def isValid(self, s: str) -> bool:\n        stack = []\n        mapping = {')': '(', '}': '{', ']': '['}\n        for char in s:\n            if char in mapping:\n                top = stack.pop() if stack else '#'\n                if mapping[char] != top:\n                    return False\n            else:\n                stack.append(char)\n        return not stack\n`;
      }
      if (l === 'cpp' || l === 'c++') {
        return `// Optimal Valid Parentheses using std::stack\n// Time Complexity: O(N) | Space Complexity: O(N)\n#include <string>\n#include <stack>\nusing namespace std;\n\nclass Solution {\npublic:\n    bool isValid(string s) {\n        stack<char> st;\n        for (char c : s) {\n            if (c == '(' || c == '{' || c == '[') st.push(c);\n            else {\n                if (st.empty()) return false;\n                char top = st.top(); st.pop();\n                if ((c == ')' && top != '(') || (c == '}' && top != '{') || (c == ']' && top != '[')) return false;\n            }\n        }\n        return st.empty();\n    }\n};\n`;
      }
      return `// Optimal Valid Parentheses Solution using Stack\n// Time Complexity: O(N) | Space Complexity: O(N)\nimport java.util.Stack;\n\nclass Solution {\n    public boolean isValid(String s) {\n        Stack<Character> stack = new Stack<>();\n        for (char c : s.toCharArray()) {\n            if (c == '(' || c == '{' || c == '[') {\n                stack.push(c);\n            } else {\n                if (stack.isEmpty()) return false;\n                char top = stack.pop();\n                if ((c == ')' && top != '(') || (c == '}' && top != '{') || (c == ']' && top != '[')) {\n                    return false;\n                }\n            }\n        }\n        return stack.isEmpty();\n    }\n}\n`;
    }

    // 3. Maximum Subarray (Kadane's Algorithm)
    if (slug.includes('maximum-subarray') || slug.includes('kadane')) {
      if (l === 'python' || l === 'python3') {
        return `# Kadane's Algorithm for Maximum Subarray\n# Time Complexity: O(N) | Space Complexity: O(1)\nclass Solution:\n    def maxSubArray(self, nums: list[int]) -> int:\n        max_sum = current_sum = nums[0]\n        for num in nums[1:]:\n            current_sum = max(num, current_sum + num)\n            max_sum = max(max_sum, current_sum)\n        return max_sum\n`;
      }
      if (l === 'cpp' || l === 'c++') {
        return `// Kadane's Algorithm for Maximum Subarray\n// Time Complexity: O(N) | Space Complexity: O(1)\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        int maxSum = nums[0];\n        int currentSum = nums[0];\n        for (size_t i = 1; i < nums.size(); i++) {\n            currentSum = max(nums[i], currentSum + nums[i]);\n            maxSum = max(maxSum, currentSum);\n        }\n        return maxSum;\n    }\n};\n`;
      }
      return `// Kadane's Algorithm for Maximum Subarray\n// Time Complexity: O(N) | Space Complexity: O(1)\nclass Solution {\n    public int maxSubArray(int[] nums) {\n        int maxSum = nums[0];\n        int currentSum = nums[0];\n        for (int i = 1; i < nums.length; i++) {\n            currentSum = Math.max(nums[i], currentSum + nums[i]);\n            maxSum = Math.max(maxSum, currentSum);\n        }\n        return maxSum;\n    }\n}\n`;
    }

    // 4. Best Time to Buy and Sell Stock
    if (slug.includes('buy-and-sell') || slug.includes('stock')) {
      if (l === 'python' || l === 'python3') {
        return `# Optimal Single Pass Buy and Sell Stock\n# Time Complexity: O(N) | Space Complexity: O(1)\nclass Solution:\n    def maxProfit(self, prices: list[int]) -> int:\n        min_price = float('inf')\n        max_profit = 0\n        for price in prices:\n            if price < min_price:\n                min_price = price\n            elif price - min_price > max_profit:\n                max_profit = price - min_price\n        return max_profit\n`;
      }
      return `// Optimal Single Pass Buy and Sell Stock\n// Time Complexity: O(N) | Space Complexity: O(1)\nclass Solution {\n    public int maxProfit(int[] prices) {\n        int minPrice = Integer.MAX_VALUE;\n        int maxProfit = 0;\n        for (int price : prices) {\n            if (price < minPrice) minPrice = price;\n            else if (price - minPrice > maxProfit) maxProfit = price - minPrice;\n        }\n        return maxProfit;\n    }\n}\n`;
    }

    // 5. Valid Palindrome
    if (slug.includes('palindrome')) {
      if (l === 'python' || l === 'python3') {
        return `# Optimal Two Pointers Valid Palindrome\n# Time Complexity: O(N) | Space Complexity: O(1)\nclass Solution:\n    def isPalindrome(self, s: str) -> bool:\n        left, right = 0, len(s) - 1\n        while left < right:\n            while left < right and not s[left].isalnum():\n                left += 1\n            while left < right and not s[right].isalnum():\n                right -= 1\n            if s[left].lower() != s[right].lower():\n                return False\n            left += 1\n            right -= 1\n        return True\n`;
      }
      return `// Optimal Two Pointers Valid Palindrome\n// Time Complexity: O(N) | Space Complexity: O(1)\nclass Solution {\n    public boolean isPalindrome(String s) {\n        int left = 0, right = s.length() - 1;\n        while (left < right) {\n            while (left < right && !Character.isLetterOrDigit(s.charAt(left))) left++;\n            while (left < right && !Character.isLetterOrDigit(s.charAt(right))) right--;\n            if (Character.toLowerCase(s.charAt(left)) != Character.toLowerCase(s.charAt(right))) return false;\n            left++;\n            right--;\n        }\n        return true;\n    }\n}\n`;
    }

    // 6. Contains Duplicate
    if (slug.includes('contains-duplicate') || slug.includes('duplicate')) {
      if (l === 'python' || l === 'python3') {
        return `# Optimal Contains Duplicate using Set\n# Time Complexity: O(N) | Space Complexity: O(N)\nclass Solution:\n    def containsDuplicate(self, nums: list[int]) -> bool:\n        return len(nums) != len(set(nums))\n`;
      }
      return `// Optimal Contains Duplicate using HashSet\n// Time Complexity: O(N) | Space Complexity: O(N)\nimport java.util.HashSet;\nimport java.util.Set;\n\nclass Solution {\n    public boolean containsDuplicate(int[] nums) {\n        Set<Integer> set = new HashSet<>();\n        for (int num : nums) {\n            if (!set.add(num)) return true;\n        }\n        return false;\n    }\n}\n`;
    }

    // 7. Move Zeroes
    if (slug.includes('move-zeroes') || slug.includes('zeroes')) {
      if (l === 'python' || l === 'python3') {
        return `# Optimal Move Zeroes in-place\n# Time Complexity: O(N) | Space Complexity: O(1)\nclass Solution:\n    def moveZeroes(self, nums: list[int]) -> None:\n        insert_pos = 0\n        for num in nums:\n            if num != 0:\n                nums[insert_pos] = num\n                insert_pos += 1\n        while insert_pos < len(nums):\n            nums[insert_pos] = 0\n            insert_pos += 1\n`;
      }
      return `// Optimal Move Zeroes in-place\n// Time Complexity: O(N) | Space Complexity: O(1)\nclass Solution {\n    public void moveZeroes(int[] nums) {\n        int insertPos = 0;\n        for (int num : nums) {\n            if (num != 0) nums[insertPos++] = num;\n        }\n        while (insertPos < nums.length) {\n            nums[insertPos++] = 0;\n        }\n    }\n}\n`;
    }

    // Generic Structured Optimal Solution for any other algorithm problem
    const starter = getCleanStarterCode(prob, lang);
    return `// ==========================================================================\n// Verified Optimal Solution by NEC AI Grandmaster\n// Challenge: ${prob?.title || 'Algorithm Duel'} (${prob?.difficulty || 'Medium'})\n// Time Complexity: O(N) Optimal | Space Complexity: O(1) Auxiliary\n// ==========================================================================\n\n${starter}\n`;
  };

  // Inspect any player's solution code post-battle
  const handleInspectSolution = (player: IDuelPlayer) => {
    let solutionCode = player.submittedCode || '';
    let solutionLang = player.submittedLanguage || selectedLanguage;

    const isMe = player.userId.toString() === currentUserId;
    // If reviewing own solution, fallback to current code in editor if not submitted
    if (isMe && (!solutionCode || solutionCode.trim() === '')) {
      solutionCode = code;
      solutionLang = selectedLanguage;
    }

    // If opponent or AI has no submitted code, fetch optimal verified solution
    if (!solutionCode || solutionCode.trim() === '' || player.isAi) {
      solutionCode = getAiSolutionCode(problem, solutionLang);
    }

    const isWinner = Boolean((gameOverResult?.winnerId || duel?.winnerId)?.toString() === player.userId.toString());
    const passed = isWinner || player.status === 'submitted'
      ? totalTests
      : (competitorsProgress[player.userId.toString()]?.passed ?? player.testCasesPassed ?? (isMe ? myPassedTests : 0));

    const avatar = isMe ? (user?.profileImage || player.profileImage) : player.profileImage;

    setInspectingPlayerCode({
      name: player.name,
      profileImage: avatar,
      college: player.college,
      userId: player.userId.toString(),
      isMe,
      isWinner,
      passedTests: passed,
      totalTests: totalTests || player.totalTestCases || 3,
      status: player.status,
      code: solutionCode,
      language: solutionLang,
      isAi: player.isAi,
      executionTime: player.executionTime,
      submittedAt: player.submittedAt ? new Date(player.submittedAt).toLocaleTimeString() : undefined,
      explanation: isWinner
        ? `Official verified winning algorithm solution that passed 100% of test cases first.`
        : `Verified algorithm submission with syntax formatting.`,
    });
  };

  // Default clean starter code fallback wrapper
  const getStarterCode = (lang: string, prob?: IDuelProblem | null): string => {
    return getCleanStarterCode(prob || null, lang);
  };

  // Syntax highlighted lines for post-battle solution inspection
  const highlightedSolutionLines = useMemo(() => {
    if (!inspectingPlayerCode?.code) return [];
    const lang = (inspectingPlayerCode.language || 'javascript').toLowerCase();
    const prismLang =
      lang === 'c' || lang === 'cpp'
        ? 'cpp'
        : lang === 'python' || lang === 'python3'
        ? 'python'
        : lang === 'java'
        ? 'java'
        : lang === 'typescript'
        ? 'typescript'
        : 'javascript';

    let highlighted = inspectingPlayerCode.code;
    try {
      if (Prism.languages[prismLang]) {
        highlighted = Prism.highlight(inspectingPlayerCode.code, Prism.languages[prismLang], prismLang);
      }
    } catch (e) {
      console.warn('Prism highlighting fallback:', e);
    }
    return highlighted.split('\n');
  }, [inspectingPlayerCode]);

  // 1. Initial Data Fetch
  useEffect(() => {
    if (!cleanRoomCode) return;

    duelService
      .getDuelDetails(cleanRoomCode)
      .then((data) => {
        setDuel(data.duel);
        const forfeitedIds = (data.duel?.players || [])
          .filter((p) => p.status === 'forfeited' && p.userId.toString() !== currentUserId)
          .map((p) => p.userId.toString());
        setLeftPlayerIds(forfeitedIds);
        setProblem(data.problem);
        setTimeRemaining(data.timeRemainingSeconds);
        if (data.problem?.sampleTestCases?.length) {
          setTotalTests(data.problem.sampleTestCases.length);
        }

        // Initialize starter code
        const initialCode = getCleanStarterCode(data.problem, selectedLanguage);
        setCode(initialCode);

        // If Prime Duel and in-progress, trigger staking intro animation once per session
        const isPrime = data.duel?.duelType === 'prime' || (data.duel?.entryFee && data.duel.entryFee > 0);
        const hasShownIntro = sessionStorage.getItem(`prime_staking_${cleanRoomCode}`);
        if (!hasShownIntro && isPrime && data.duel?.status === 'in-progress') {
          sessionStorage.setItem(`prime_staking_${cleanRoomCode}`, 'shown');
          setShowPrimeStakingIntro(true);
        }

        // Check if already completed
        if (data.duel.status === 'completed' || data.duel.status === 'timed-out') {
          const winnerIdStr = data.duel.winnerId?.toString();
          const isWinner = Boolean(winnerIdStr && winnerIdStr === currentUserId);
          const winnerPlayer = data.duel.players?.find((p: any) => p.userId?.toString() === winnerIdStr);
          setGameOverResult({
            status: data.duel.status,
            isWinner,
            winnerId: winnerIdStr,
            winnerName: isWinner ? (user?.name || 'You') : (winnerPlayer?.name || opponentPlayer?.name || 'Opponent'),
            winningReason: data.duel.winningReason,
            coinsAwarded: isWinner ? data.duel.coinsReward : 0,
          });
          setIsGameOverModalOpen(true);
        }

        // Auto-join arena if user visited direct link and isn't in players yet
        const isMeInPlayers = (data.duel.players || []).some((p: any) => p.userId.toString() === currentUserId);
        if (!isMeInPlayers && data.duel.status === 'waiting' && data.duel.players.length < (data.duel.maxParticipants ?? 2)) {
          duelService
            .joinDuel(cleanRoomCode)
            .then((joinRes) => {
              setDuel(joinRes.duel);
              info('Joined battle arena successfully!');
            })
            .catch((err) => {
              console.warn('Auto-join failed:', err);
            });
        }
      })
      .catch((err) => {
        toastError(err.response?.data?.message || 'Failed to load duel room');
      })
      .finally(() => setLoading(false));
  }, [cleanRoomCode, currentUserId]);

  // 2. Real-Time Socket.io Connection & Event Listeners
  useEffect(() => {
    if (!cleanRoomCode) return;

    socketService.connect(currentUserId);
    socketService.joinDuel(cleanRoomCode, currentUserId, user?.name);

    // Duel Started (All Players Joined, Host started early, or Rematch started)
    const unsubStart = socketService.onDuelStart((data) => {
      info('Challengers Connected! 15-Minute Duel Started!');
      setDuel((prev) => {
        const updated: ICodeDuel | null = prev ? { ...prev, status: 'in-progress' as const, players: data.players } : null;
        const isPrime = updated?.duelType === 'prime' || (updated?.entryFee && updated.entryFee > 0);
        if (isPrime) {
          sessionStorage.setItem(`prime_staking_${cleanRoomCode}`, 'shown');
          setShowPrimeStakingIntro(true);
        }
        return updated;
      });
      setTimeRemaining(data.durationSeconds || 900);
      setGameOverResult(null);
      setIsGameOverModalOpen(false);
      setRematchStatus('idle');
      setMyPassedTests(0);
      setRunResult(null);
      setOpponentProgress({ passed: 0, total: 3 });
      setCompetitorsProgress({});
      setInspectingPlayerCode(null);
      if (data.problem) {
        setProblem(data.problem);
        if (data.problem.sampleTestCases?.length) {
          setTotalTests(data.problem.sampleTestCases.length);
        }
        setCode(getCleanStarterCode(data.problem, selectedLanguage));
      }
    });

    // New Player Joined Room
    const unsubPlayerJoined = socketService.onDuelPlayerJoined((data: any) => {
      const p = data.player || data.newPlayer;
      const count = data.playersCount || data.totalPlayers || data.players?.length || 2;
      const max = data.maxParticipants || duel?.maxParticipants || 2;
      if (p?.name) {
        info(`${p.name} joined the arena! (${count}/${max})`);
        triggerArenaAlert(`👋 ${p.name} joined the battle`, 'join');
        setDuel((prev) => {
          if (!prev) return null;
          const exists = prev.players.some((pl) => pl.userId.toString() === p.userId.toString());
          if (exists) return prev;
          return {
            ...prev,
            players: [...prev.players, p],
            maxParticipants: max,
          };
        });
      }
    });

    // Player Rejoined Room (After disconnect/refresh)
    const unsubPlayerRejoined = socketService.onDuelPlayerRejoined((data: any) => {
      const rejoinedUserId = (data.userId || data.player?.userId || '').toString();
      const playerName = data.name || data.player?.name || 'Opponent';
      if (rejoinedUserId) {
        setLeftPlayerIds((prev) => prev.filter((id) => id !== rejoinedUserId));
        if (rejoinedUserId !== currentUserId) {
          info(`⚔️ ${playerName} has rejoined the battle!`);
          triggerArenaAlert(`⚔️ ${playerName} rejoined the battle`, 'rejoin');
          setOpponentLeftNotice(false);

          // Deduplicated System message in in-battle chat
          appendChatMessage({
            id: `sys_rejoin_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            userId: 'system',
            senderName: 'SYSTEM',
            message: `⚔️ ${playerName} has rejoined the battle!`,
            timestamp: new Date().toISOString(),
          });
        }
      }
      if (data.players) {
        setDuel((prev) => (prev ? { ...prev, players: data.players } : null));
      } else if (rejoinedUserId) {
        setDuel((prev) => {
          if (!prev) return null;
          const updated = prev.players.map((p) =>
            p.userId.toString() === rejoinedUserId ? { ...p, status: 'coding' as const } : p
          );
          return { ...prev, players: updated };
        });
      }
    });

    // Opponent Typing Indicator & Code Written Percentage
    const unsubTyping = socketService.onDuelOpponentTyping((data) => {
      if (data.userId && data.userId !== currentUserId) {
        const uid = data.userId.toString();
        setLeftPlayerIds((prev) => (prev.includes(uid) ? prev.filter((id) => id !== uid) : prev));
        setOpponentLeftNotice((prev) => (prev ? false : prev));
        setOpponentTyping(data.isTyping);
        if (data.codePercent !== undefined) {
          setOpponentCodePercent(data.codePercent);
        }
        setCompetitorsProgress((prev) => ({
          ...prev,
          [data.userId]: {
            passed: prev[data.userId]?.passed || 0,
            total: prev[data.userId]?.total || totalTests,
            isTyping: data.isTyping,
            codePercent: data.codePercent ?? prev[data.userId]?.codePercent ?? 0,
          },
        }));
        if (opponentTypingTimeoutRef.current) clearTimeout(opponentTypingTimeoutRef.current);
        opponentTypingTimeoutRef.current = setTimeout(() => {
          setOpponentTyping(false);
          setCompetitorsProgress((prev) => ({
            ...prev,
            [data.userId]: {
              ...(prev[data.userId] || { passed: 0, total: totalTests }),
              isTyping: false,
            },
          }));
        }, 2500);
      }
    });

    // Opponent Test Case Progress
    const unsubProgress = socketService.onDuelOpponentProgress((data) => {
      if (data.userId && data.userId !== currentUserId) {
        const uid = data.userId.toString();
        setLeftPlayerIds((prev) => (prev.includes(uid) ? prev.filter((id) => id !== uid) : prev));
        setOpponentLeftNotice((prev) => (prev ? false : prev));
        setOpponentProgress({ passed: data.testCasesPassed, total: data.totalTestCases });
        setCompetitorsProgress((prev) => ({
          ...prev,
          [data.userId]: {
            passed: data.testCasesPassed,
            total: data.totalTestCases,
            isTyping: prev[data.userId]?.isTyping || false,
            codePercent: prev[data.userId]?.codePercent ?? opponentCodePercent,
          },
        }));
      }
    });

    // In-Battle Live Chat Listener (With Deduplication)
    const unsubChat = socketService.onDuelChatMessage((msg) => {
      appendChatMessage(msg);
      if (!isChatOpenRef.current) {
        setUnreadChatCount((prev) => prev + 1);
      }

      // Show floating notification popup above chatbox if message is from an opponent / AI
      const isMe = msg.userId === currentUserId || msg.senderName === (user?.name || 'You');
      if (!isMe && msg.senderName !== 'SYSTEM' && msg.userId !== 'system') {
        if (msg.userId) {
          const uid = msg.userId.toString();
          setLeftPlayerIds((prev) => (prev.includes(uid) ? prev.filter((id) => id !== uid) : prev));
          setOpponentLeftNotice((prev) => (prev ? false : prev));
        }
        if (notifDismissTimerRef.current) clearTimeout(notifDismissTimerRef.current);
        if (notifExitTimerRef.current) clearTimeout(notifExitTimerRef.current);

        setChatNotification({
          id: msg.id,
          senderName: msg.senderName,
          message: msg.message,
          isAi: msg.senderName.includes('NEC AI') || msg.senderName.includes('Bot'),
          isExiting: false,
        });

        // Stay visible for 2 seconds, then trigger exit animation and dismiss
        notifExitTimerRef.current = setTimeout(() => {
          setChatNotification((prev) => (prev ? { ...prev, isExiting: true } : null));
          notifDismissTimerRef.current = setTimeout(() => {
            setChatNotification(null);
          }, 300);
        }, 2000);
      }
    });

    // In-Battle Live Chat Typing Listener
    const unsubChatTyping = socketService.onDuelOpponentChatTyping((data) => {
      if (data.senderName) {
        setChatTypingUsers((prev) => ({
          ...prev,
          [data.senderName]: data.isTyping,
        }));
      }
    });

    // Opponent Forfeited / Left
    const unsubLeft = socketService.onDuelOpponentLeft((data: any) => {
      const leftUserId = (data.userId || '').toString();
      const effectiveTeamSize = data.teamSize || duel?.maxParticipants || duel?.players?.length || 2;
      const playerName =
        data.name ||
        (leftUserId ? duel?.players.find((p) => p.userId.toString() === leftUserId)?.name : null) ||
        'A player';
      const leaveNotice = `${playerName} left from ${effectiveTeamSize} ${duel?.duelType === 'prime' ? 'NEC Prime Battle' : 'NEC Code Battle'}`;

      if (leftUserId && leftUserId !== currentUserId) {
        setLeftPlayerIds((prev) => Array.from(new Set([...prev, leftUserId])));
        setOpponentLeftNotice(true);
        triggerArenaAlert(`⚠️ ${playerName} left the battle`, 'left');
        setDuel((prev) => {
          if (!prev) return null;
          const updated = prev.players.map((p) =>
            p.userId.toString() === leftUserId ? { ...p, status: 'forfeited' as const } : p
          );
          return { ...prev, players: updated };
        });

        // Notification toast
        toastError(leaveNotice);

        // Deduplicated System message in in-battle chat
        appendChatMessage({
          id: `sys_left_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          userId: 'system',
          senderName: 'SYSTEM',
          message: leaveNotice,
          timestamp: new Date().toISOString(),
        });

        // Floating Chat Notification Popover above chatbox (if chat closed)
        if (!isChatOpenRef.current) {
          setUnreadChatCount((prev) => prev + 1);
          if (notifDismissTimerRef.current) clearTimeout(notifDismissTimerRef.current);
          if (notifExitTimerRef.current) clearTimeout(notifExitTimerRef.current);

          setChatNotification({
            id: `notif_left_${Date.now()}`,
            senderName: 'SYSTEM',
            message: leaveNotice,
            isAi: false,
            isExiting: false,
          });

          notifExitTimerRef.current = setTimeout(() => {
            setChatNotification((prev) => (prev ? { ...prev, isExiting: true } : null));
            notifDismissTimerRef.current = setTimeout(() => {
              setChatNotification(null);
            }, 300);
          }, 2500);
        }
      }
    });

    // Game Over / Winner Declared
    const unsubGameOver = socketService.onDuelGameOver((data) => {
      const winnerIdStr = (data.winnerId || data.winningPlayer?.userId)?.toString();
      const isWinner = Boolean(winnerIdStr && winnerIdStr === currentUserId);
      const isPrime = duel?.duelType === 'prime';
      const reward = isPrime ? (data.coinsAwarded || duel?.coinsReward || duel?.netPrizePool || 0) : 0;

      // Update duel state with winnerId and updated players
      setDuel((prev) => {
        if (!prev) return null;
        const basePlayers = data.players?.length ? data.players : prev.players;
        const updatedPlayers = basePlayers.map((p: any) => {
          const isThisWinner = winnerIdStr ? p.userId.toString() === winnerIdStr : (p.name === data.winnerName);
          if (isThisWinner) {
            return {
              ...p,
              status: 'submitted',
              testCasesPassed: totalTests,
              totalTestCases: totalTests,
            };
          }
          return p;
        });
        return {
          ...prev,
          status: 'completed',
          winnerId: winnerIdStr || prev.winnerId,
          players: updatedPlayers,
        };
      });

      // Find winner's actual display name
      let resolvedWinnerName = data.winnerName;
      if (!resolvedWinnerName || resolvedWinnerName === 'Opponent' || resolvedWinnerName === 'You') {
        const found = duel?.players.find((p) => p.userId.toString() === winnerIdStr);
        if (found) resolvedWinnerName = found.name;
      }
      if (!resolvedWinnerName) {
        resolvedWinnerName = isWinner ? (user?.name || 'You') : (opponentPlayer?.name || 'Opponent');
      }

      setGameOverResult({
        status: data.status || 'completed',
        isWinner,
        winnerId: winnerIdStr,
        winnerName: resolvedWinnerName,
        winningReason: data.winningReason,
        coinsAwarded: isWinner ? reward : 0,
      });
      setIsGameOverModalOpen(true);

      if (isWinner) {
        if (isPrime && reward > 0) {
          success(`🏆 VICTORY! You Passed All Test Cases First! +${reward} Coins Awarded!`);
        } else {
          success(`🏆 VICTORY! You Passed All Test Cases First and Won the Battle!`);
        }
      } else {
        info(`Battle Concluded. ${resolvedWinnerName} passed all test cases first.`);
      }
    });

    // Rematch Request Received from Opponent
    const unsubRematchReq = socketService.onDuelRematchRequest((data) => {
      if (data.senderId !== currentUserId) {
        setRematchStatus('incoming');
        setRematchRequesterName(data.senderName || 'Opponent');
        setRematchCountdown(30);
        setIsGameOverModalOpen(true);
        info(`⚔️ ${data.senderName || 'Opponent'} requested a Rematch!`);
      }
    });

    // Rematch Declined by Opponent
    const unsubRematchDecline = socketService.onDuelRematchDecline((data) => {
      setRematchStatus('declined');
      toastError(`${data.senderName || 'Opponent'} is not interested in a rematch right now.`);
    });

    return () => {
      unsubStart();
      unsubPlayerJoined();
      unsubPlayerRejoined();
      unsubTyping();
      unsubProgress();
      unsubChat();
      unsubChatTyping();
      unsubLeft();
      unsubGameOver();
      unsubRematchReq();
      unsubRematchDecline();
      if (notifDismissTimerRef.current) clearTimeout(notifDismissTimerRef.current);
      if (arenaAlertTimerRef.current) clearTimeout(arenaAlertTimerRef.current);
      if (rematchCountdownTimerRef.current) clearInterval(rematchCountdownTimerRef.current);
      if (chatTypingTimeoutRef.current) clearTimeout(chatTypingTimeoutRef.current);
      if (myTypingTimeoutRef.current) clearTimeout(myTypingTimeoutRef.current);
      if (opponentTypingTimeoutRef.current) clearTimeout(opponentTypingTimeoutRef.current);
    };
  }, [cleanRoomCode, currentUserId]);

  // 3. Synchronized 15-Minute Countdown Timer (Server-authoritative, immune to re-renders)
  useEffect(() => {
    if (!duel || duel.status !== 'in-progress' || Boolean(gameOverResult)) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Time Expired -> Explicitly trigger backend settlement
          duelService.timeoutDuel(cleanRoomCode).catch((err) => {
            console.warn('Timeout settlement sync:', err?.message || err);
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [duel?.status, Boolean(gameOverResult), cleanRoomCode]);

  // Anti-Cheat Telemetry Listeners (Tab Switches, Blurs, Pastes)
  useEffect(() => {
    if (!duel || duel.status !== 'in-progress' || Boolean(gameOverResult)) return;

    let lastSwitchTime = 0;
    const registerTabSwitch = (type: 'tab_hidden' | 'window_blur', details: string) => {
      const now = Date.now();
      // Debounce window_blur if visibilitychange already fired within 800ms
      if (now - lastSwitchTime < 800) return;
      lastSwitchTime = now;

      const nowStr = new Date().toLocaleTimeString();
      setTabSwitchesCount((prev) => prev + 1);
      antiCheatLogsRef.current.push({
        timestamp: nowStr,
        eventType: type,
        details,
      });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        registerTabSwitch('tab_hidden', 'Student switched away to another browser tab or external application');
      } else {
        antiCheatLogsRef.current.push({
          timestamp: new Date().toLocaleTimeString(),
          eventType: 'tab_visible',
          details: 'Student returned back to Duel Arena window',
        });
      }
    };

    const handleWindowBlur = () => {
      registerTabSwitch('window_blur', 'Duel Arena lost focus (possible external tool or split screen switch)');
    };

    const handleWindowPaste = (e: ClipboardEvent) => {
      const nowStr = new Date().toLocaleTimeString();
      setPasteCount((prev) => prev + 1);
      const textLen = e.clipboardData?.getData('text')?.length || 0;
      antiCheatLogsRef.current.push({
        timestamp: nowStr,
        eventType: 'paste',
        details: `Code paste event triggered (${textLen} characters pasted)`,
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('paste', handleWindowPaste);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('paste', handleWindowPaste);
    };
  }, [duel?.status, Boolean(gameOverResult)]);

  // Test cases formatted for OutputWindowDrawer compiler popup
  const drawerTestCases: TestCaseItem[] = useMemo(() => {
    const baseCases =
      problem?.sampleTestCases && problem.sampleTestCases.length > 0
        ? problem.sampleTestCases
        : problem?.examples && problem.examples.length > 0
        ? problem.examples.map((ex) => ({ input: ex.input, expectedOutput: ex.output, explanation: ex.explanation }))
        : [
            { input: 'arr = [2, 7, 11, 15], target = 9', expectedOutput: '[0, 1]' },
            { input: 'arr = [3, 2, 4], target = 6', expectedOutput: '[1, 2]' },
            { input: 'arr = [3, 3], target = 6', expectedOutput: '[0, 1]' },
          ];

    return baseCases.map((tc, idx) => {
      const detail = runTestCaseDetails[idx];
      return {
        input: tc.input || '',
        expectedOutput: tc.expectedOutput || '',
        actualOutput: detail?.actualOutput !== undefined ? detail.actualOutput : runResult?.output,
        passed: detail?.passed !== undefined ? detail.passed : runResult ? runResult.passed : undefined,
        explanation: (tc as any).explanation,
      };
    });
  }, [problem, runTestCaseDetails, runResult]);

  // Handle Code Typing with Debounced Socket Event & Code Written %
  const handleCodeChange = (newCode: string) => {
    setCode(newCode);

    // Calculate percentage code written
    const starter = getCleanStarterCode(problem, selectedLanguage);
    const targetLen = Math.max(250, starter.length + 150);
    const myPercent = Math.min(100, Math.max(5, Math.round((newCode.length / targetLen) * 100)));
    setMyCodePercent(myPercent);

    if (myTypingTimeoutRef.current) clearTimeout(myTypingTimeoutRef.current);
    myTypingTimeoutRef.current = setTimeout(() => {
      socketService.sendDuelTyping(cleanRoomCode, false, myPercent, newCode.length);
    }, 1500);

    socketService.sendDuelTyping(cleanRoomCode, true, myPercent, newCode.length);
  };

  // Handle Language Change
  const handleLanguageChange = (newLang: string) => {
    setSelectedLanguage(newLang);
    setCode(getCleanStarterCode(problem, newLang));
  };

  // Handle Run Tests (Sample Cases with OutputWindowDrawer Popup)
  const handleRunTests = async () => {
    if (!code.trim()) {
      toastError('Please enter code before running');
      return;
    }

    setIsRunning(true);
    setIsOutputDrawerOpen(true);
    setIsOutputDrawerMinimized(false);
    setOutputDrawerTab('results');
    setActiveTab('results');

    try {
      const res = await duelService.runTests(cleanRoomCode, code, selectedLanguage);

      const passed = res.evaluation.testCasesPassed;
      const total = res.evaluation.totalTestCases || 3;
      setMyPassedTests(passed);
      setTotalTests(total);
      setLastOutput(`Sample Tests Run: ${res.evaluation.status} (${passed}/${total} passed - ${res.evaluation.executionTime || 0}ms)`);
      setLastError(res.evaluation.errorMessage || null);

      setRunResult({
        output: `Passed ${passed}/${total} sample test cases (${res.evaluation.executionTime || 0}ms)`,
        error: res.evaluation.errorMessage,
        executionTime: res.evaluation.executionTime,
        memory: res.evaluation.memory,
        passed: res.allPassed,
      });

      if (res.evaluation.details && res.evaluation.details.length > 0) {
        setRunTestCaseDetails(res.evaluation.details);
      }

      // Broadcast progress to opponent
      socketService.sendDuelProgress(cleanRoomCode, passed, total);

      if (res.allPassed) {
        info(`All ${passed} sample test cases passed! Submit your solution to claim victory!`);
      } else {
        info(`Sample test run complete: ${passed}/${total} passed.`);
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Execution error';
      setLastError(errMsg);
      setRunResult({
        error: errMsg,
        passed: false,
      });
      toastError(errMsg);
    } finally {
      setIsRunning(false);
    }
  };

  // Handle Submit Duel Solution (Race Condition Check with OutputWindowDrawer)
  const handleSubmitSolution = async () => {
    if (!code.trim()) {
      toastError('Please enter code before submitting');
      return;
    }

    setIsSubmitting(true);
    setIsOutputDrawerOpen(true);
    setIsOutputDrawerMinimized(false);
    setOutputDrawerTab('results');
    setActiveTab('results');

    try {
      const timeTakenSeconds = Math.max(1, Math.round((Date.now() - duelStartTimeRef.current) / 1000));
      const antiCheatData: IDuelAntiCheat = {
        tabSwitchesCount,
        pasteCount,
        timeTakenSeconds,
        status:
          tabSwitchesCount >= 6 || pasteCount >= 6
            ? 'flagged'
            : tabSwitchesCount >= 3 || pasteCount >= 3
            ? 'suspicious'
            : 'clean',
        reason:
          tabSwitchesCount >= 6
            ? `High violations: ${tabSwitchesCount} tab switches detected`
            : tabSwitchesCount >= 3
            ? `Suspicious activity: ${tabSwitchesCount} tab switches detected`
            : 'Normal coding pattern detected',
        logs: [
          ...antiCheatLogsRef.current,
          {
            timestamp: new Date().toLocaleTimeString(),
            eventType: 'submit',
            details: `Solution submitted (${timeTakenSeconds}s elapsed, ${tabSwitchesCount} tab switches, ${pasteCount} pastes)`,
          },
        ],
      };

      const res = await duelService.submitSolution(cleanRoomCode, code, selectedLanguage, antiCheatData);

      const passed = res.evaluation.testCasesPassed;
      const total = res.evaluation.totalTestCases || 3;
      setMyPassedTests(passed);
      setTotalTests(total);
      setLastOutput(`Evaluation Result: ${res.evaluation.status} (${passed}/${total} passed)`);
      setLastError(res.evaluation.errorMessage || null);

      setRunResult({
        output: `Evaluation Result: ${res.evaluation.status} (${passed}/${total} passed)`,
        error: res.evaluation.errorMessage,
        executionTime: res.evaluation.executionTime,
        memory: res.evaluation.memory,
        passed: res.allPassed,
      });

      if (res.evaluation.details && res.evaluation.details.length > 0) {
        setRunTestCaseDetails(res.evaluation.details);
      }

      setSubmissionResult({
        status: res.evaluation.status,
        testCasesPassed: passed,
        totalTestCases: total,
        executionTime: res.evaluation.executionTime,
        memory: res.evaluation.memory,
        errorMessage: res.evaluation.errorMessage,
        coinsAwarded: res.coinsAwarded,
      });

      // Broadcast progress to opponent
      socketService.sendDuelProgress(cleanRoomCode, passed, total);

      if (res.allPassed) {
        // 🏆 VICTORY!
        const isPrime = duel?.duelType === 'prime';
        const reward = isPrime ? (res.coinsAwarded || duel?.coinsReward || duel?.netPrizePool || 0) : 0;
        if (isPrime && reward > 0) {
          success(`🏆 VICTORY! All Test Cases Passed! You Won the Prime Duel! (+${reward} Coins)`);
        } else {
          success(`🏆 VICTORY! All Test Cases Passed! You Won the Battle!`);
        }
        setDuel((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            status: 'completed',
            winnerId: currentUserId,
            players: prev.players.map((p) =>
              p.userId.toString() === currentUserId
                ? { ...p, status: 'submitted', testCasesPassed: totalTests }
                : p
            ),
          };
        });
        setGameOverResult({
          status: 'completed',
          isWinner: true,
          winnerId: currentUserId,
          winnerName: user?.name || 'You',
          winningReason: 'solved_first',
          coinsAwarded: reward,
        });
      } else {
        toastError(`Wrong Answer: ${passed}/${total} test cases passed. Keep coding!`);
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Submission error';
      setLastError(errMsg);
      setRunResult({
        error: errMsg,
        passed: false,
      });
      toastError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format MM:SS for countdown timer
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}`;
  };

  const isTimerLow = timeRemaining < 120; // < 2 mins

  // Staked Prime Duel Information & Candidate Array for Ludo Pot Overlay
  const isPrimeDuel = duel?.duelType === 'prime' || (duel?.entryFee && duel.entryFee > 0);
  const primeEntryFee = duel?.entryFee || 50;
  const primeTotalPot = duel?.totalPot || (primeEntryFee * Math.max(2, duel?.players?.length || 2));
  const primePlatformFee = duel?.platformFeeCollected || Math.round(primeTotalPot * 0.10);
  const primeNetPool = duel?.netPrizePool || (primeTotalPot - primePlatformFee);

  const primeOverlayPlayers = useMemo(() => {
    if (!duel?.players) return [];
    return duel.players.map((p) => ({
      userId: p.userId.toString(),
      name: p.name,
      avatar: p.profileImage,
      profileImage: p.profileImage,
      college: p.college,
      isMe: p.userId.toString() === currentUserId,
      isAi: p.isAi,
    }));
  }, [duel?.players, currentUserId]);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-950 text-white select-none">
        <div className="w-12 h-12 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin mb-4" />
        <p className="font-mono text-xs tracking-wider text-cyan-400 uppercase font-bold">Connecting to Code Duel Arena...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-100 dark:bg-[#0c0d14] text-slate-900 dark:text-neutral-100 font-sans overflow-hidden select-text">
      {/* 0. LUDO-STYLE PRIME POT COLLECTION & STAKING INTRO OVERLAY */}
      <PrimePotCollectionOverlay
        isOpen={showPrimeStakingIntro && Boolean(isPrimeDuel)}
        onComplete={() => setShowPrimeStakingIntro(false)}
        players={primeOverlayPlayers}
        entryFee={primeEntryFee}
        totalPot={primeTotalPot}
        netPrizePool={primeNetPool}
        platformFee={primePlatformFee}
        roomCode={cleanRoomCode}
      />

      {/* 1. TOP 1vs1 BATTLE HEADER BAR */}
      <header className="h-14 px-4 sm:px-6 bg-white dark:bg-[#121422] border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between shrink-0 shadow-xs z-20">
        {/* Left: Back Arrow + Problem Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowLeaveConfirmModal(true)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1a1e32] text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            title="Leave Battle Arena"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
              <Swords className="w-4 h-4 text-cyan-500" />
              <span>{problem ? problem.title : 'Live Code Battle'}</span>
            </span>

            {problem?.difficulty && (
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase',
                  problem.difficulty === 'Easy'
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : problem.difficulty === 'Medium'
                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                    : 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                )}
              >
                {problem.difficulty}
              </span>
            )}
          </div>
        </div>

        {/* Center: Live VS Battle Bar & 15:00 Synchronized Timer */}
        <div className="flex items-center gap-3 sm:gap-6">
          {/* Render Players based on count: <= 3 players shows names & progress, > 3 players shows profile avatars only */}
          {(() => {
            const duelPlayers = duel?.players || [];
            const otherPlayers = duelPlayers.filter((p) => p.userId.toString() !== currentUserId);
            const totalPlayersCount = duelPlayers.length || (opponentPlayer ? 2 : 1);
            const isMultiPlayer = totalPlayersCount > 3;

            const renderAvatar = (
              p: { name?: string; profileImage?: string; userId?: string; isAi?: boolean } | null | undefined,
              isMe: boolean,
              isLeft: boolean = false,
              sizeClass: string = 'w-8 h-8'
            ) => {
              const name = p?.name || (isMe ? (user?.name || 'You') : 'Opponent');
              const initial = name.charAt(0).toUpperCase();
              const avatarUrl = isMe ? (user?.profileImage || p?.profileImage) : p?.profileImage;

              if (avatarUrl) {
                return (
                  <div
                    className={cn(
                      'relative rounded-full overflow-hidden shrink-0 shadow-xs border',
                      sizeClass,
                      isMe
                        ? 'border-cyan-400 ring-2 ring-cyan-500/20'
                        : isLeft
                        ? 'border-rose-500/40 opacity-70 grayscale'
                        : 'border-purple-400/80 ring-1 ring-purple-500/20'
                    )}
                  >
                    <img
                      src={avatarUrl}
                      alt={name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 -z-10 flex items-center justify-center font-bold text-xs text-white bg-slate-700">
                      {initial}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  className={cn(
                    'rounded-full flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0 border',
                    sizeClass,
                    isMe
                      ? 'bg-gradient-to-tr from-cyan-500 to-blue-600 border-cyan-400 ring-2 ring-cyan-500/20'
                      : isLeft
                      ? 'bg-slate-500 dark:bg-neutral-600 border-rose-500/40 opacity-70'
                      : 'bg-gradient-to-tr from-purple-500 to-indigo-600 border-purple-400/80 ring-1 ring-purple-500/20'
                  )}
                >
                  {initial}
                </div>
              );
            };

            // CASE 1: > 3 PLAYERS (SHOW ONLY PROFILE AVATARS TO SAVE SPACE)
            if (isMultiPlayer) {
              return (
                <div className="flex items-center gap-3">
                  {/* Player 1 (You) Profile Avatar */}
                  <div
                    className="relative cursor-pointer group flex items-center gap-1.5"
                    title={`${user?.name || 'You'} (You) • ${myCodePercent}% Code • ${myPassedTests}/${totalTests} Tests`}
                    onClick={() => setActiveTab('competitors')}
                  >
                    <div className="relative">
                      {renderAvatar(
                        { name: user?.name, profileImage: user?.profileImage, userId: currentUserId },
                        true,
                        false,
                        'w-8 h-8 sm:w-9 sm:h-9'
                      )}
                      <span className="absolute -bottom-1 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500 border-2 border-white dark:border-[#121422]" />
                      </span>
                    </div>
                    <span className="hidden md:inline px-1.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-mono text-[10px] font-bold border border-cyan-500/30">
                      {myPassedTests}/{totalTests}
                    </span>
                  </div>

                  {/* VS & Timer */}
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="px-1.5 sm:px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#1a1e32] text-[10px] font-black font-mono text-purple-600 dark:text-purple-400 border border-purple-500/30">
                      VS
                    </div>
                    <div
                      className={cn(
                        'px-2.5 py-1 rounded-xl font-mono text-xs sm:text-sm font-black flex items-center gap-1.5 transition-all shadow-xs border',
                        isTimerLow
                          ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/50 animate-pulse'
                          : 'bg-slate-100 dark:bg-[#1c2033] text-cyan-600 dark:text-cyan-400 border-cyan-500/30'
                      )}
                    >
                      <Timer className="w-3.5 h-3.5" />
                      <span>{formatTime(timeRemaining)}</span>
                    </div>
                  </div>

                  {/* Opponent Profile Avatars List */}
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    {otherPlayers.slice(0, 6).map((opp) => {
                      const pid = opp.userId.toString();
                      const prog = competitorsProgress[pid] || {
                        passed: opp.testCasesPassed || 0,
                        total: totalTests,
                        codePercent: opp.isAi ? opponentCodePercent : 0,
                        isTyping: false,
                      };
                      const thisLeft = isPlayerLeft(opp);

                      return (
                        <div
                          key={pid}
                          className="relative cursor-pointer group transition-transform hover:scale-105"
                          onClick={() => setActiveTab('competitors')}
                          title={`${opp.name} • ${prog.passed}/${totalTests} Tests • ${thisLeft ? 'Left' : prog.isTyping ? 'Typing...' : 'Active'}`}
                        >
                          {renderAvatar(opp, false, thisLeft, 'w-8 h-8 sm:w-9 sm:h-9')}

                          {/* Status Dot */}
                          {thisLeft ? (
                            <span
                              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-rose-500 border-2 border-white dark:border-[#121422] flex items-center justify-center text-[7px] text-white font-bold"
                              title="Left battle"
                            >
                              ✕
                            </span>
                          ) : prog.isTyping ? (
                            <span
                              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-purple-500 border-2 border-white dark:border-[#121422] flex items-center justify-center text-[7px] text-white animate-pulse"
                              title="Typing code..."
                            >
                              ✍️
                            </span>
                          ) : (
                            <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-white dark:border-[#121422]" />
                            </span>
                          )}

                          {/* Mini Test Passed Badge */}
                          <span className="absolute -top-1.5 -right-1 px-1 py-0.2 rounded-full bg-slate-900/90 text-cyan-300 text-[9px] font-mono font-bold border border-cyan-500/40 shadow-xs">
                            {prog.passed}
                          </span>
                        </div>
                      );
                    })}

                    {otherPlayers.length > 6 && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('competitors')}
                        className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30 text-xs font-mono font-bold flex items-center justify-center hover:bg-purple-500/30 transition-colors cursor-pointer"
                        title="View all candidates in Live Radar"
                      >
                        +{otherPlayers.length - 6}
                      </button>
                    )}
                  </div>
                </div>
              );
            }

            // CASE 2: <= 3 PLAYERS (SHOW NAMES & PROGRESS AS BEFORE)
            return (
              <div className="flex items-center gap-4 sm:gap-6">
                {/* Player 1 (You) */}
                <div className="hidden sm:flex items-center gap-2 text-right">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[130px]">
                      {user?.name || 'You'} (You)
                    </div>
                    <div className="flex items-center justify-end gap-2 text-[10px] font-mono">
                      <div className="flex items-center gap-1.5" title="Your live code progress">
                        <span className="text-cyan-600 dark:text-cyan-400 font-bold">
                          {myCodePercent}% Code
                        </span>
                        <div className="w-12 sm:w-14 h-1.5 bg-slate-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${myCodePercent}%` }}
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                          />
                        </div>
                      </div>
                      <span className="text-slate-300 dark:text-neutral-700">•</span>
                      <span className="text-cyan-600 dark:text-cyan-400 font-semibold">
                        {myPassedTests}/{totalTests} Tests
                      </span>
                    </div>
                  </div>
                  {renderAvatar(
                    { name: user?.name, profileImage: user?.profileImage, userId: currentUserId },
                    true,
                    false
                  )}
                </div>

                {/* VS & Synchronized Countdown Clock */}
                <div className="flex items-center gap-2">
                  <div className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#1a1e32] text-[10px] font-black font-mono text-purple-600 dark:text-purple-400 border border-purple-500/30">
                    VS
                  </div>

                  <div
                    className={cn(
                      'px-3 py-1 rounded-xl font-mono text-xs sm:text-sm font-black flex items-center gap-1.5 transition-all shadow-xs border',
                      isTimerLow
                        ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/50 animate-pulse'
                        : 'bg-slate-100 dark:bg-[#1c2033] text-cyan-600 dark:text-cyan-400 border-cyan-500/30'
                    )}
                  >
                    <Timer className="w-3.5 h-3.5" />
                    <span>{formatTime(timeRemaining)}</span>
                  </div>
                </div>

                {/* Opponents (1 or 2 opponents when total <= 3) */}
                {otherPlayers.length <= 1 ? (
                  // Exactly 1 opponent (Classic 1v1)
                  <div className="hidden sm:flex items-center gap-2">
                    {renderAvatar(opponentPlayer, false, isOpponentLeft)}
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span className="truncate max-w-[130px]">{opponentPlayer?.name || 'Challenger'}</span>
                        {isOpponentLeft ? (
                          <span className="text-[10px] text-rose-500 font-mono font-bold flex items-center gap-0.5">
                            • left
                          </span>
                        ) : opponentTyping ? (
                          <span className="text-[10px] text-purple-500 dark:text-purple-400 font-mono animate-pulse">
                            • typing...
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-500 font-mono font-semibold">
                            • active
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-mono">
                        <span className="text-purple-600 dark:text-purple-400 font-semibold">
                          {opponentProgress.passed}/{opponentProgress.total} Tests
                        </span>
                        <span className="text-slate-300 dark:text-neutral-700">•</span>
                        <div className="flex items-center gap-1.5" title="Opponent live code progress">
                          <div className="w-12 sm:w-14 h-1.5 bg-slate-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${opponentCodePercent}%` }}
                              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300"
                            />
                          </div>
                          <span className="text-purple-600 dark:text-purple-400 font-bold">
                            {opponentCodePercent}% Code
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // 2 Opponents (Total 3 players)
                  <div className="hidden sm:flex items-center gap-3">
                    {otherPlayers.slice(0, 2).map((opp) => {
                      const pid = opp.userId.toString();
                      const prog = competitorsProgress[pid] || {
                        passed: opp.testCasesPassed || 0,
                        total: totalTests,
                        codePercent: opp.isAi ? opponentCodePercent : 0,
                        isTyping: false,
                      };
                      const thisLeft = isPlayerLeft(opp);

                      return (
                        <div key={pid} className="flex items-center gap-2">
                          {renderAvatar(opp, false, thisLeft)}
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                              <span className={cn('truncate max-w-[85px]', thisLeft && 'line-through text-slate-400 dark:text-neutral-500')}>
                                {opp.name}
                              </span>
                              {thisLeft ? (
                                <span className="text-[9px] text-rose-500 font-mono font-bold">• left</span>
                              ) : prog.isTyping ? (
                                <span className="text-[9px] text-purple-500 dark:text-purple-400 font-mono animate-pulse">• typing</span>
                              ) : (
                                <span className="text-[9px] text-emerald-500 font-mono font-semibold">• active</span>
                              )}
                            </div>
                            <div className="text-[10px] font-mono text-purple-600 dark:text-purple-400">
                              <span>{prog.passed}/{totalTests} Tests</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Right: Room Code (Clickable Share Modal Trigger), Leave & Theme Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#181b2a] dark:hover:bg-[#22263d] border border-slate-200 dark:border-neutral-800 text-[11px] font-mono cursor-pointer transition-colors shadow-xs group"
            title="Click to share battle invite link & room code"
          >
            {duel?.duelType === 'prime' ? (
              <span className="flex items-center gap-1 text-amber-500 font-bold mr-1">
                <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="bg-amber-500/20 px-1.5 py-0.2 rounded text-[10px]">PRIME</span>
                <span className="text-amber-400 font-bold">🪙 {duel.netPrizePool || duel.totalPot || 0} Pool</span>
              </span>
            ) : (
              <span className="text-slate-500 dark:text-neutral-400">Room:</span>
            )}
            <strong className={duel?.duelType === 'prime' ? 'text-amber-400' : 'text-cyan-600 dark:text-cyan-400'}>
              {cleanRoomCode}
            </strong>
            <Share2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-500 transition-colors ml-0.5" />
          </button>

          <button
            type="button"
            onClick={() => setShowLeaveConfirmModal(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-mono font-bold transition-all cursor-pointer active:scale-95 shadow-xs"
            title="Leave battle and forfeit"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Leave</span>
          </button>

          <ThemeToggle />
        </div>
      </header>

      {/* 2. OPPONENT TYPING / STATUS STRIP FOR MOBILE */}
      <div className="sm:hidden px-4 py-2 bg-slate-200 dark:bg-[#151726] border-b border-slate-300 dark:border-neutral-800 flex items-center justify-between text-[11px] font-mono">
        <div className="flex items-center gap-2">
          <span className="text-cyan-600 dark:text-cyan-400 font-bold">
            You: {myPassedTests}/{totalTests} ({myCodePercent}%)
          </span>
          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1f2338] text-[10px] font-mono font-bold text-cyan-600 dark:text-cyan-400 border border-slate-300 dark:border-neutral-700 cursor-pointer"
          >
            <span>{cleanRoomCode}</span>
            <Share2 className="w-3 h-3" />
          </button>
        </div>
        <div className="text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1.5">
          {isOpponentLeft ? (
            <span className="text-rose-500 font-bold">Opponent Left</span>
          ) : (
            <>
              <span>{opponentPlayer?.name || 'Opponent'}: {opponentProgress.passed}/{opponentProgress.total}</span>
              <span className="text-slate-400">•</span>
              <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-600 dark:text-purple-300 text-[10px]">
                {opponentCodePercent}% Code
              </span>
              {opponentTyping && <span className="animate-pulse">✍️</span>}
            </>
          )}
        </div>
      </div>

      {/* 10-SECOND SIMPLE ARENA ALERT BANNER */}
      <AnimatePresence>
        {arenaAlert && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            className="mx-2 mt-2 relative overflow-hidden rounded-2xl border shrink-0 shadow-md transition-all z-10"
          >
            <div
              className={cn(
                'px-4 py-2 flex items-center justify-between text-xs font-semibold',
                arenaAlert.type === 'left' &&
                  'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300',
                arenaAlert.type === 'rejoin' &&
                  'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-300',
                arenaAlert.type === 'join' &&
                  'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300'
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-base shrink-0">
                  {arenaAlert.type === 'left' ? '⚠️' : arenaAlert.type === 'rejoin' ? '⚔️' : '👋'}
                </span>
                <span className="truncate">{arenaAlert.message}</span>
                <span className="text-[10px] opacity-75 font-mono px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10 shrink-0">
                  10s notice
                </span>
              </div>
              <button
                type="button"
                onClick={() => setArenaAlert(null)}
                className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-current transition-colors cursor-pointer shrink-0 ml-2"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {/* 10s progress indicator */}
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 10, ease: 'linear' }}
              className={cn(
                'h-0.5',
                arenaAlert.type === 'left' && 'bg-rose-500',
                arenaAlert.type === 'rejoin' && 'bg-amber-500',
                arenaAlert.type === 'join' && 'bg-emerald-500'
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. SPLIT MAIN WORKSTATION: PROBLEM DESCRIPTION & CODE EDITOR */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-2 gap-2">
        {/* LEFT PANE: PROBLEM STATEMENT / EXAMPLES / CONSTRAINTS */}
        <div className="w-full lg:w-1/2 flex flex-col rounded-2xl bg-white dark:bg-[#131522] border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden relative">
          {/* Tabs header */}
          <div className="h-10 px-3 bg-slate-50 dark:bg-[#181a2b] border-b border-slate-200 dark:border-neutral-800 flex items-center gap-2 shrink-0 text-xs font-mono">
            <button
              type="button"
              onClick={() => setActiveTab('description')}
              className={cn(
                'px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors flex items-center gap-1.5',
                activeTab === 'description'
                  ? 'bg-white dark:bg-[#202438] text-slate-900 dark:text-white font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white'
              )}
            >
              <FileText className="w-3.5 h-3.5 text-blue-500" />
              <span>Description</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('hints')}
              className={cn(
                'px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors flex items-center gap-1.5',
                activeTab === 'hints'
                  ? 'bg-white dark:bg-[#202438] text-amber-600 dark:text-amber-300 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-amber-600 dark:text-neutral-400 dark:hover:text-amber-300'
              )}
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>Hints</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('results')}
              className={cn(
                'px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors flex items-center gap-1.5',
                activeTab === 'results'
                  ? 'bg-white dark:bg-[#202438] text-cyan-600 dark:text-cyan-300 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-cyan-600 dark:text-neutral-400 dark:hover:text-cyan-300'
              )}
            >
              <Code2 className="w-3.5 h-3.5 text-cyan-500" />
              <span>Test Results ({myPassedTests}/{totalTests})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('competitors')}
              className={cn(
                'px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors flex items-center gap-2',
                activeTab === 'competitors'
                  ? 'bg-white dark:bg-[#202438] text-purple-600 dark:text-purple-300 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-purple-600 dark:text-neutral-400 dark:hover:text-purple-300'
              )}
            >
              <Users className="w-3.5 h-3.5 text-purple-500" />
              <span>Live Radar</span>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/30 shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>{activeMembersCount} Active</span>
              </span>
              {leftMembersCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-500 text-[9px] font-mono font-bold">
                  {leftMembersCount} left
                </span>
              )}
            </button>
          </div>

          {/* Left Pane Scrollable Content */}
          <div className="flex-1 p-5 overflow-y-auto space-y-6 text-sm select-text leading-relaxed">
            {activeTab === 'description' && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {duel?.status === 'waiting' ? 'Classified Arena Problem' : (problem?.title || 'Coding Problem')}
                  </h2>
                  <p className="text-slate-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed">
                    {duel?.status === 'waiting'
                      ? 'The problem statement and test cases are encrypted and locked. They will unlock automatically for all challengers the instant the battle commences.'
                      : (problem?.description || 'Given an array and target, implement an optimal solution.')}
                  </p>
                </div>

                {/* Examples */}
                {duel?.status !== 'waiting' && problem?.examples && problem.examples.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white font-mono uppercase tracking-wider">
                      Examples
                    </h3>
                    {problem.examples.map((ex, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-slate-50 dark:bg-[#191c2e] border border-slate-200 dark:border-neutral-800/90 font-mono text-xs space-y-2"
                      >
                        <div className="text-slate-500 dark:text-neutral-400">
                          <strong className="text-slate-700 dark:text-neutral-300">Input: </strong>
                          {ex.input}
                        </div>
                        <div className="text-slate-500 dark:text-neutral-400">
                          <strong className="text-slate-700 dark:text-neutral-300">Output: </strong>
                          {ex.output}
                        </div>
                        {ex.explanation && (
                          <div className="text-slate-500 dark:text-neutral-400 font-sans text-xs pt-1 border-t border-slate-200 dark:border-neutral-800">
                            <strong>Explanation: </strong> {ex.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Constraints */}
                {duel?.status !== 'waiting' && problem?.constraints && problem.constraints.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white font-mono uppercase tracking-wider">
                      Constraints
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-xs font-mono text-slate-600 dark:text-neutral-400">
                      {problem.constraints.map((c, idx) => (
                        <li key={idx}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'hints' && (
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span>Problem Hints</span>
                </h3>
                {problem?.hints && problem.hints.length > 0 ? (
                  problem.hints.map((hint, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-400/40 text-xs text-amber-900 dark:text-amber-200 leading-relaxed font-sans"
                    >
                      <strong className="block mb-1 font-mono">Hint {idx + 1}:</strong>
                      {hint}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 dark:text-neutral-400">
                    No hints provided for this live battle. Think about edge cases and optimal data structures!
                  </p>
                )}
              </div>
            )}

            {activeTab === 'results' && (
              <div className="space-y-4 font-mono text-xs">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#191c2e] border border-slate-200 dark:border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">Your Progress:</span>
                    <span className="text-cyan-600 dark:text-cyan-400 font-bold">
                      {myPassedTests}/{totalTests} Test Cases
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${totalTests > 0 ? (myPassedTests / totalTests) * 100 : 0}%` }}
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-300"
                    />
                  </div>
                </div>

                {lastOutput && (
                  <div className="p-4 rounded-xl bg-slate-900 text-slate-100 space-y-1.5">
                    <div className="text-[11px] text-slate-400 font-bold">Output:</div>
                    <pre className="whitespace-pre-wrap font-mono text-xs">{lastOutput}</pre>
                  </div>
                )}

                {lastError && (
                  <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 space-y-1.5">
                    <div className="text-[11px] font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Execution Error:</span>
                    </div>
                    <pre className="whitespace-pre-wrap font-mono text-xs">{lastError}</pre>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOutputDrawerOpen(true);
                      setIsOutputDrawerMinimized(false);
                      setOutputDrawerTab('results');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Open Interactive Test Case Drawer</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'competitors' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-500" />
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      Battlefield Competitors ({duel?.players.length || 0} Candidates)
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-mono">
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30 flex items-center gap-1.5 shadow-xs">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      <span>{activeMembersCount} Active</span>
                    </span>
                    {leftMembersCount > 0 && (
                      <span className="px-2 py-0.5 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold border border-rose-500/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        {leftMembersCount} Left
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {duel?.players.map((player, idx) => {
                    const isMe = player.userId.toString() === currentUserId;
                    const thisPlayerLeft = isPlayerLeft(player);
                    const prog = isMe
                      ? { passed: myPassedTests, total: totalTests, isTyping: false, codePercent: myCodePercent }
                      : competitorsProgress[player.userId.toString()] || {
                          passed: player.testCasesPassed || 0,
                          total: totalTests,
                          isTyping: false,
                          codePercent: player.isAi ? opponentCodePercent : 0,
                        };

                    return (
                      <div
                        key={player.userId.toString()}
                        className={cn(
                          'p-3.5 rounded-2xl border transition-all flex flex-col gap-2.5',
                          isMe
                            ? 'bg-cyan-500/5 dark:bg-cyan-950/20 border-cyan-500/30 ring-1 ring-cyan-500/20'
                            : thisPlayerLeft
                            ? 'bg-rose-500/5 dark:bg-rose-950/20 border-rose-500/30 opacity-80'
                            : 'bg-slate-50 dark:bg-[#191c2e] border-slate-200 dark:border-neutral-800'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={cn(
                                'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-xs',
                                isMe
                                  ? 'bg-gradient-to-tr from-cyan-500 to-blue-600'
                                  : thisPlayerLeft
                                  ? 'bg-slate-400 dark:bg-neutral-600'
                                  : 'bg-gradient-to-tr from-purple-500 to-indigo-600'
                              )}
                            >
                              {player.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span className={thisPlayerLeft ? 'line-through text-slate-500 dark:text-neutral-400' : ''}>
                                  {player.name}
                                </span>
                                {isMe && (
                                  <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-[10px] font-mono font-bold">
                                    YOU
                                  </span>
                                )}
                                {player.isAi && (
                                  <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-600 dark:text-purple-300 text-[10px] font-mono font-bold flex items-center gap-1">
                                    <Bot className="w-3 h-3" />
                                    AI BOT
                                  </span>
                                )}
                                {idx === 0 && (
                                  <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-mono font-bold">
                                    HOST
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] font-mono">
                                {thisPlayerLeft ? (
                                  <span className="text-rose-500 font-bold flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
                                    <span>Left Battle (Offline)</span>
                                  </span>
                                ) : prog.isTyping ? (
                                  <span className="text-purple-500 font-semibold animate-pulse flex items-center gap-1">
                                    <span>✍️ typing code...</span>
                                  </span>
                                ) : player.status === 'submitted' ? (
                                  <span className="text-emerald-500 font-semibold flex items-center gap-1">
                                    <span>✓ Submitted Solution</span>
                                  </span>
                                ) : (
                                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                                    <span>Active & Coding</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
                              {prog.passed}/{prog.total}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-neutral-400 block font-mono">
                              Passed
                            </span>
                          </div>
                        </div>

                        {/* Test cases passed progress bar */}
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            style={{
                              width: `${prog.total > 0 ? (prog.passed / prog.total) * 100 : 0}%`,
                            }}
                            className={cn(
                              'h-full transition-all duration-300',
                              isMe
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-600'
                                : thisPlayerLeft
                                ? 'bg-slate-400 dark:bg-neutral-600'
                                : 'bg-gradient-to-r from-purple-500 to-indigo-600'
                            )}
                          />
                        </div>

                        {/* Single-line Code Written Percentage */}
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-neutral-400 pt-1 border-t border-slate-200/60 dark:border-neutral-800/60">
                          <span className="flex items-center gap-1">
                            <Code2 className="w-3 h-3 text-cyan-500" />
                            <span>Code Written:</span>
                          </span>
                          <span className="font-bold text-cyan-600 dark:text-cyan-400">
                            {isMe ? myCodePercent : (prog.codePercent ?? (player.isAi ? opponentCodePercent : 0))}%
                          </span>
                        </div>
                        <div className="w-full h-1 bg-slate-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            style={{
                              width: `${isMe ? myCodePercent : (prog.codePercent ?? (player.isAi ? opponentCodePercent : 0))}%`,
                            }}
                            className={cn(
                              'h-full transition-all duration-300',
                              isMe ? 'bg-cyan-500' : 'bg-purple-500'
                            )}
                          />
                        </div>

                        {/* Post-Battle Solution Review Button */}
                        {Boolean(gameOverResult) && (
                          <div className="pt-1 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleInspectSolution(player)}
                              className="px-2.5 py-1 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 text-[10px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View Solution</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sliding Compiler & Test Results Drawer on Run Tests & Submit */}
          <OutputWindowDrawer
            isOpen={isOutputDrawerOpen}
            onClose={() => setIsOutputDrawerOpen(false)}
            isMinimized={isOutputDrawerMinimized}
            onToggleMinimize={() => setIsOutputDrawerMinimized(!isOutputDrawerMinimized)}
            isRunning={isRunning}
            isSubmitting={isSubmitting}
            activeTab={outputDrawerTab}
            onTabChange={setOutputDrawerTab}
            testCases={drawerTestCases}
            selectedCaseIdx={selectedCaseIdx}
            onSelectCaseIdx={setSelectedCaseIdx}
            customInput={customInput}
            onCustomInputChange={setCustomInput}
            runResult={runResult}
            submissionResult={submissionResult}
            onRunCode={handleRunTests}
            onSubmitCode={handleSubmitSolution}
            problemTitle={problem?.title}
            problemDescription={problem?.description}
            problemHints={problem?.hints}
            code={code}
            language={selectedLanguage}
          />
        </div>

        {/* RIGHT PANE: CODE EDITOR & SUBMIT ACTION BAR */}
        <div className="w-full lg:w-1/2 flex flex-col rounded-2xl bg-white dark:bg-[#131522] border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden">
          {/* Editor Top Bar: Language selector */}
          <div className="h-10 px-3.5 bg-slate-50 dark:bg-[#181a2b] border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between shrink-0 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 dark:text-neutral-400 font-medium">Language:</span>
              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#202438] border border-slate-300 dark:border-neutral-700 text-slate-900 dark:text-white font-bold cursor-pointer focus:outline-none focus:border-cyan-500"
              >
                <option value="java">Java</option>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="c">C</option>
                <option value="javascript">JavaScript</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCode(getStarterCode(selectedLanguage, problem))}
                className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-[#202438] text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                title="Reset to Starter Code"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Professional Monaco/Prism Code Editor */}
          <div className="flex-1 relative overflow-hidden select-text">
            <ProfessionalCodeEditor
              value={code}
              onChange={handleCodeChange}
              language={selectedLanguage}
              theme="system"
              fontSize={13}
              placeholder="// Write your solution here..."
              minHeight="100%"
              className="h-full border-none"
            />
          </div>

          {/* Bottom Action Toolbar: Run Tests + Submit Solution Button */}
          <div className="h-12 px-3.5 bg-slate-50 dark:bg-[#181a2b] border-t border-slate-200 dark:border-neutral-800 flex items-center justify-between shrink-0 text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-500 dark:text-neutral-400 text-[11px]">
              <span>⚔️ Live Battle Mode</span>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Run Tests Button */}
              <button
                type="button"
                disabled={isRunning || isSubmitting}
                onClick={handleRunTests}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#202438] dark:hover:bg-[#2c324c] text-slate-800 dark:text-neutral-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Play className="w-3 h-3 text-cyan-500 fill-cyan-500" />
                <span>{isRunning ? 'Testing...' : 'Run Tests'}</span>
              </button>

              {/* Submit Duel Solution Button (Race to Win!) */}
              <button
                type="button"
                disabled={isRunning || isSubmitting}
                onClick={handleSubmitSolution}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_16px_rgba(16,185,129,0.35)] active:scale-95 disabled:opacity-50"
              >
                <CloudUpload className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Evaluating...' : '⚡ Submit Solution'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. GAME OVER RESULTS & MULTI-PLAYER STANDINGS MODAL */}
      <AnimatePresence>
        {gameOverResult && isGameOverModalOpen && (
          <div className="fixed inset-0 z-[80] isolate bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#141726] border border-cyan-500/40 shadow-2xl text-center space-y-5 relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Explicit Top-Right Close Button (User requested modal does not close on outside click) */}
              <button
                type="button"
                onClick={() => setIsGameOverModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer z-10"
                title="Close results (re-open anytime with bottom-right trophy)"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Winner vs Defeated Graphics */}
              {gameOverResult.isWinner ? (
                <div className="space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-white shadow-[0_0_30px_rgba(245,158,11,0.5)] animate-bounce">
                    <Trophy className="w-8 h-8" />
                  </div>

                  <div className="space-y-1">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold border border-emerald-500/40">
                      BATTLE CHAMPION 🏆
                    </span>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white pt-1">
                      VICTORY!
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-neutral-400">
                      You passed 100% of test cases first and outcoded the battlefield!
                    </p>
                  </div>

                  {/* Victory Banner (Coins only for Prime or actual coinsAwarded > 0) */}
                  {gameOverResult.coinsAwarded > 0 ? (
                    <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center gap-2 text-amber-500 font-mono font-black text-base">
                      <Coins className="w-5 h-5 animate-spin" />
                      <span>+{gameOverResult.coinsAwarded} Coins Added to Wallet!</span>
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 font-mono font-black text-sm">
                      <Trophy className="w-5 h-5 text-amber-500" />
                      <span>Free Arena Victory • Rating Points Boosted!</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-tr from-slate-700 to-slate-800 flex items-center justify-center text-slate-300 shadow-lg">
                    <Swords className="w-8 h-8 text-rose-400" />
                  </div>

                  <div className="space-y-1">
                    <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-mono font-bold border border-rose-500/40">
                      BATTLE CONCLUDED ⚔️
                    </span>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white pt-1">
                      {gameOverResult.winnerName} Solved First
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-neutral-400">
                      Great effort! Review the real-time standings and verified solutions below.
                    </p>
                  </div>
                </div>
              )}

              {/* Standings & Performance Breakdown */}
              <div className="space-y-3 text-left pt-1">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                    Leaderboard & Standings
                  </span>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    ✓ Verified Results
                  </span>
                </div>

                {/* 1st Place Spotlight Card */}
                {sortedStandings[0] && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-400/40 shadow-sm relative overflow-hidden">
                    <div className="flex items-center gap-3">
                      {/* Avatar with Rank 1 Medal */}
                      <div className="relative shrink-0">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 p-0.5 shadow-md">
                          <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-base">
                            {sortedStandings[0].player.isAi ? (
                              <Bot className="w-6 h-6 text-amber-400" />
                            ) : (
                              sortedStandings[0].player.name.charAt(0).toUpperCase()
                            )}
                          </div>
                        </div>
                        <span className="absolute -top-2 -left-2 text-base">🥇</span>
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                            {sortedStandings[0].player.name}
                          </span>
                          {sortedStandings[0].isMe && (
                            <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-mono text-[9px] font-extrabold">
                              YOU
                            </span>
                          )}
                          {sortedStandings[0].isWinner && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-[10px] border border-amber-500/30">
                              Winner 🏆
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1.5 pt-0.5">
                          <span>{sortedStandings[0].passed}/{sortedStandings[0].total} Tests Passed</span>
                          <span>•</span>
                          <span>
                            {sortedStandings[0].total > 0
                              ? Math.round((sortedStandings[0].passed / sortedStandings[0].total) * 100)
                              : 100}% Score
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-neutral-400 pt-0.5">
                          {sortedStandings[0].isWinner ? (
                            <span>
                              Result:{' '}
                              {duel?.duelType === 'prime' ? (
                                <strong className="text-amber-500 font-bold">
                                  +{duel?.coinsReward || 0} Coins 🪙
                                </strong>
                              ) : (
                                <strong className="text-emerald-500 font-bold">
                                  Free Arena Victory 🏆
                                </strong>
                              )}
                            </span>
                          ) : (
                            <span>Rank #1 (Tie / Leader)</span>
                          )}
                        </div>
                      </div>

                      {/* View Solution */}
                      <button
                        type="button"
                        onClick={() => handleInspectSolution(sortedStandings[0].player)}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-sm active:scale-95"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Solution</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 2nd, 3rd, and remaining participants */}
                {sortedStandings.length > 1 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {sortedStandings.slice(1).map((item, idx) => {
                      const rank = idx + 2;
                      return (
                        <div
                          key={item.player.userId.toString()}
                          className={cn(
                            'p-2.5 rounded-2xl border transition-all flex items-center justify-between gap-3',
                            item.isMe
                              ? 'bg-cyan-500/5 dark:bg-cyan-950/20 border-cyan-500/30'
                              : 'bg-slate-50 dark:bg-[#181a2c] border-slate-200 dark:border-neutral-800'
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-[#20243a] flex items-center justify-center font-mono font-bold text-xs shrink-0">
                              {rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                            </div>

                            <div
                              className={cn(
                                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0',
                                item.player.isAi
                                  ? 'bg-gradient-to-tr from-purple-600 to-indigo-600'
                                  : item.isMe
                                  ? 'bg-gradient-to-tr from-cyan-500 to-blue-600'
                                  : 'bg-gradient-to-tr from-purple-500 to-indigo-600'
                              )}
                            >
                              {item.player.isAi ? <Bot className="w-3.5 h-3.5" /> : item.player.name.charAt(0).toUpperCase()}
                            </div>

                            <div className="truncate">
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {item.player.name}
                                </span>
                                {item.isMe && (
                                  <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-mono text-[9px] font-extrabold shrink-0">
                                    YOU
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] font-mono text-slate-500 dark:text-neutral-400 flex items-center gap-1">
                                <span>{item.passed}/{item.total} Passed</span>
                                <span>•</span>
                                <span className={item.player.status === 'forfeited' ? 'text-rose-500' : 'text-slate-400'}>
                                  {item.player.status === 'forfeited' ? 'Left Arena' : 'Completed'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-right shrink-0">
                            <button
                              type="button"
                              onClick={() => handleInspectSolution(item.player)}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 border border-slate-200 dark:border-neutral-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                            >
                              <Eye className="w-3.5 h-3.5 text-amber-500" />
                              <span>View Solution</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Rematch / Replay Status & Actions */}
              {rematchStatus === 'incoming' ? (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 to-purple-500/15 border border-amber-500/40 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-300">
                    <span className="flex items-center gap-1.5">
                      <Swords className="w-4 h-4 animate-bounce text-amber-500" />
                      <span>{rematchRequesterName} requested a Rematch!</span>
                    </span>
                    <span className="font-mono text-[11px] bg-amber-500/20 px-2 py-0.5 rounded-full text-amber-500">
                      ⏱️ {rematchCountdown}s
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAcceptRematch}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <Check className="w-4 h-4" />
                      <span>Accept Rematch</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDeclineRematch}
                      className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <X className="w-4 h-4" />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              ) : rematchStatus === 'requesting' ? (
                <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-xs text-cyan-600 dark:text-cyan-400 font-bold">
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    <span>Waiting for opponent to accept rematch...</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-500 font-bold">
                      {rematchCountdown}s
                    </span>
                    <button
                      type="button"
                      onClick={() => setRematchStatus('idle')}
                      className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : rematchStatus === 'declined' ? (
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-xs text-rose-600 dark:text-rose-400 font-semibold">
                  <span>❌ Opponent is not interested right now.</span>
                  <button
                    type="button"
                    onClick={() => setRematchStatus('idle')}
                    className="text-[11px] underline font-bold cursor-pointer"
                  >
                    Try Again
                  </button>
                </div>
              ) : null}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                {/* Rematch / Replay Button */}
                <button
                  type="button"
                  disabled={rematchStatus === 'requesting'}
                  onClick={handleRequestRematch}
                  className={cn(
                    'flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm',
                    rematchStatus === 'requesting'
                      ? 'bg-slate-100 dark:bg-neutral-800 text-slate-400 border border-slate-200 dark:border-neutral-700 cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black shadow-md shadow-amber-500/20 active:scale-[0.98]'
                  )}
                >
                  <RefreshCw className={cn('w-4 h-4', rematchStatus === 'requesting' && 'animate-spin')} />
                  <span>{rematchStatus === 'requesting' ? 'Request Sent...' : 'Replay / Rematch'}</span>
                </button>

                {/* Find New Duel Button */}
                <button
                  type="button"
                  onClick={() => navigate(duel?.duelType === 'prime' ? '/practice/prime-duels' : '/practice/duels')}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-800 dark:text-neutral-100 border border-slate-300 dark:border-neutral-700 font-bold text-sm transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <Swords className="w-4 h-4 text-slate-500 dark:text-neutral-400" />
                  <span>Find New Duel</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FLOATING ACTION BUTTON TO RE-OPEN RESULTS & REMATCH IF CLOSED */}
      <AnimatePresence>
        {gameOverResult && !isGameOverModalOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-40"
          >
            <button
              type="button"
              onClick={() => setIsGameOverModalOpen(true)}
              className="px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-white font-bold text-xs font-mono shadow-[0_0_25px_rgba(245,158,11,0.5)] flex items-center gap-2 cursor-pointer active:scale-95 border border-amber-300/40 animate-pulse"
            >
              <Trophy className="w-4 h-4 text-amber-100" />
              <span>🏆 View Standings & Rematch</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4b. POST-BATTLE SOLUTION INSPECTION MODAL */}
      <AnimatePresence>
        {inspectingPlayerCode && (
          <div className="fixed inset-0 z-[100] isolate bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto select-text">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-4xl rounded-3xl bg-white dark:bg-[#121422] border border-cyan-500/40 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto relative z-[101]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header: Full Player Profile Details */}
              <div className="px-5 sm:px-6 py-4 bg-slate-50 dark:bg-[#181b2e] border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Player Avatar */}
                  <div className="relative shrink-0">
                    {inspectingPlayerCode.profileImage ? (
                      <img
                        src={inspectingPlayerCode.profileImage}
                        alt={inspectingPlayerCode.name}
                        className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl object-cover border-2 border-cyan-500/50 shadow-md"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div
                        className={cn(
                          'w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-md border-2',
                          inspectingPlayerCode.isAi
                            ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 border-purple-400'
                            : inspectingPlayerCode.isMe
                            ? 'bg-gradient-to-tr from-cyan-500 to-blue-600 border-cyan-400'
                            : 'bg-gradient-to-tr from-amber-500 to-yellow-600 border-amber-400'
                        )}
                      >
                        {inspectingPlayerCode.isAi ? (
                          <Bot className="w-6 h-6 text-amber-300" />
                        ) : (
                          inspectingPlayerCode.name.charAt(0).toUpperCase()
                        )}
                      </div>
                    )}
                    {inspectingPlayerCode.isWinner && (
                      <span className="absolute -top-1.5 -left-1.5 text-base" title="Battle Winner">
                        🥇
                      </span>
                    )}
                  </div>

                  {/* Player Info & Badges */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                        {inspectingPlayerCode.name}'s Solution
                      </h3>
                      {inspectingPlayerCode.isMe && (
                        <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-mono text-[10px] font-extrabold border border-cyan-500/30">
                          YOU
                        </span>
                      )}
                      {inspectingPlayerCode.isWinner && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-xs border border-amber-500/40 flex items-center gap-1 shadow-xs">
                          <Trophy className="w-3 h-3 text-amber-500" />
                          <span>Winner</span>
                        </span>
                      )}
                      {inspectingPlayerCode.isAi && (
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-300 text-xs font-mono font-bold flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-purple-400" />
                          <span>Grandmaster AI</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-neutral-400 pt-0.5 flex items-center gap-2 flex-wrap font-mono">
                      <span>Candidate Submission</span>
                      <span>•</span>
                      <span className="text-cyan-600 dark:text-cyan-400 font-bold uppercase">
                        {inspectingPlayerCode.language}
                      </span>
                      {inspectingPlayerCode.college && (
                        <>
                          <span>•</span>
                          <span className="text-slate-400 truncate max-w-[180px] font-sans">
                            {inspectingPlayerCode.college}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Right Header: Copy Code & Close */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(inspectingPlayerCode.code);
                      setHasCopiedCode(true);
                      success('Solution code copied to clipboard!');
                      setTimeout(() => setHasCopiedCode(false), 2000);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#202438] dark:hover:bg-[#2a304a] text-slate-800 dark:text-neutral-200 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 border border-slate-200 dark:border-neutral-700"
                  >
                    {hasCopiedCode ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-cyan-500" />
                    )}
                    <span>{hasCopiedCode ? 'Copied!' : 'Copy Code'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInspectingPlayerCode(null)}
                    className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-[#202438] text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                    title="Close Solution Viewer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Challenge & Submission Metadata Ribbon */}
              <div className="px-5 sm:px-6 py-2 bg-slate-100/90 dark:bg-[#141624] border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between gap-3 text-xs font-mono flex-wrap">
                <div className="flex items-center gap-2 text-slate-700 dark:text-neutral-300">
                  <Terminal className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                  <span className="font-bold text-slate-900 dark:text-white">{problem?.title || 'Algorithm Duel'}</span>
                  {problem?.difficulty && (
                    <span
                      className={cn(
                        'px-2 py-0.2 rounded-full text-[10px] font-bold uppercase',
                        problem.difficulty === 'Easy'
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : problem.difficulty === 'Medium'
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                      )}
                    >
                      {problem.difficulty}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20 text-[11px] flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span>
                      {inspectingPlayerCode.passedTests}/{inspectingPlayerCode.totalTests} Tests Passed
                    </span>
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 font-bold text-[10px] uppercase tracking-wider">
                    Read-Only
                  </span>
                </div>
              </div>

              {/* Code Viewer Body with Integrated Line Numbers & Syntax Colors */}
              <div className="flex-1 overflow-auto bg-[#0a0c16] p-4 sm:p-5 select-text min-h-[260px] max-h-[58vh]">
                <div className="rounded-2xl border border-neutral-800/90 bg-[#0e111e] overflow-x-auto py-3 shadow-inner">
                  {highlightedSolutionLines.length > 0 ? (
                    highlightedSolutionLines.map((lineHtml, idx) => (
                      <div
                        key={idx}
                        className="flex hover:bg-white/[0.04] transition-colors leading-6 text-xs sm:text-sm font-mono"
                      >
                        <span className="w-12 sm:w-14 pr-3 sm:pr-4 text-right select-none text-slate-500/60 border-r border-neutral-800/80 shrink-0 text-xs">
                          {idx + 1}
                        </span>
                        <span
                          className="pl-3 sm:pl-4 text-slate-100 whitespace-pre overflow-x-visible"
                          dangerouslySetInnerHTML={{ __html: lineHtml || '&nbsp;' }}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-slate-400 text-xs font-mono">No code submitted by candidate.</div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 sm:px-6 py-3.5 bg-slate-50 dark:bg-[#181b2e] border-t border-slate-200 dark:border-neutral-800 flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400 font-sans gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Study this approach to understand edge-case handling and optimal data structure choices.</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(inspectingPlayerCode.code);
                      setHasCopiedCode(true);
                      success('Solution code copied to clipboard!');
                      setTimeout(() => setHasCopiedCode(false), 2000);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 font-bold transition-all cursor-pointer text-xs flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{hasCopiedCode ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectingPlayerCode(null)}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold transition-all cursor-pointer text-xs shadow-md shadow-cyan-500/20 active:scale-95"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. WAITING FOR OPPONENTS LOBBY OVERLAY */}
      {duel?.status === 'waiting' && !gameOverResult && (
        <div className="fixed inset-0 z-40 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#141724] border border-cyan-500/40 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <span className="absolute inset-0 rounded-full border-2 border-cyan-500/40 animate-ping" />
              <span className="absolute inset-2 rounded-full border border-blue-500/30 animate-pulse" />
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg">
                <Swords className="w-7 h-7 animate-bounce" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-mono font-bold border border-amber-500/30">
                <Users className="w-3.5 h-3.5" />
                <span>
                  WAITING FOR CANDIDATES ({duel?.players.length || 1} / {duel?.maxParticipants || 2})
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white pt-1">
                Room Code: {cleanRoomCode}
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed max-w-sm mx-auto">
                Share this room code with up to {duel?.maxParticipants || 2} friends. The 15-minute live coding battle will auto-start once the room is full!
              </p>
            </div>

            {/* Room Code Copy Box */}
            <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-[#1a1d30] border border-slate-200 dark:border-neutral-800 flex items-center justify-between max-w-xs mx-auto">
              <span className="font-mono font-black text-lg tracking-widest text-cyan-600 dark:text-cyan-400">
                {cleanRoomCode}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(cleanRoomCode);
                  success('Room code copied to clipboard!');
                }}
                className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs active:scale-95"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </button>
            </div>

            {/* Candidates Ready Grid */}
            <div className="space-y-2 text-left">
              <div className="text-[11px] font-mono font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider flex items-center justify-between px-1">
                <span>Joined Candidates</span>
                <span>{duel?.players.length || 1} of {duel?.maxParticipants || 2} ready</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {duel?.players.map((p, idx) => (
                  <div
                    key={p.userId.toString()}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#181b2e] border border-slate-200 dark:border-neutral-800 flex items-center gap-2.5"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="truncate flex-1">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {p.name} {p.userId.toString() === currentUserId && '(You)'}
                      </div>
                      <div className="text-[10px] text-emerald-500 font-mono font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        <span>Ready {idx === 0 ? '• Host' : ''}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Host Start Battle Early Button (if >= 2 players ready) */}
            {isHost && (
              <div className="pt-2">
                {(duel?.players.length || 1) >= 2 ? (
                  <button
                    type="button"
                    onClick={handleStartBattleNow}
                    disabled={isStartingNow}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                  >
                    {isStartingNow ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Initiating Duel Arena...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-white" />
                        <span>Start Battle Now ({duel?.players.length} Players Ready)</span>
                      </>
                    )}
                  </button>
                ) : (
                  <p className="text-[11px] text-slate-500 dark:text-neutral-400 font-mono">
                    Waiting for at least 1 more friend to join before starting...
                  </p>
                )}
              </div>
            )}

            <div>
              <Link
                to={duel?.duelType === 'prime' ? '/practice/prime-duels' : '/practice/duels'}
                className="inline-block text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-neutral-200 transition-colors"
              >
                ← Return to {duel?.duelType === 'prime' ? 'Prime Battles Hub' : 'Duels Hub'}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 6. BOTTOM-LEFT IN-BATTLE LIVE CHAT */}
      <div className="fixed bottom-4 left-4 z-30 font-sans">
        {/* Floating Notification Speech Bubble above Chatbox / Chat Button (2s Auto-dismiss & Slide Animation) */}
        {chatNotification && (
          <div
            onClick={() => {
              setIsChatOpen(true);
              setChatNotification(null);
            }}
            className={cn(
              'mb-2 max-w-xs p-2.5 sm:p-3 rounded-2xl bg-slate-900/95 dark:bg-[#131627]/95 text-white border border-cyan-500/40 shadow-2xl backdrop-blur-xl flex items-center gap-3 cursor-pointer transition-all duration-300 transform select-none',
              chatNotification.isExiting
                ? 'translate-y-3 opacity-0 scale-95'
                : 'translate-y-0 opacity-100 scale-100 animate-in fade-in slide-in-from-bottom-3'
            )}
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shrink-0 shadow-md">
              {chatNotification.isAi ? <Bot className="w-4 h-4 text-white" /> : <MessageSquare className="w-4 h-4 text-white" />}
            </div>
            <div className="flex-1 min-w-0 text-xs">
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold text-cyan-400 truncate text-[11px]">
                  {chatNotification.senderName}
                </span>
                <span className="text-[9px] text-slate-400 font-mono shrink-0">just now</span>
              </div>
              <p className="text-slate-200 truncate text-[11px] mt-0.5">
                {chatNotification.message}
              </p>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
          </div>
        )}

        {!isChatOpen ? (
          <button
            type="button"
            onClick={() => setIsChatOpen(true)}
            className="relative px-4 py-2.5 rounded-2xl bg-slate-900/90 dark:bg-[#181a2b]/95 hover:bg-slate-800 dark:hover:bg-[#22253b] text-white border border-cyan-500/40 backdrop-blur-md shadow-2xl flex items-center gap-2.5 transition-all transform hover:scale-105 active:scale-95 cursor-pointer text-xs font-semibold group"
          >
            <div className="relative">
              <MessageSquare className="w-4 h-4 text-cyan-400 group-hover:rotate-6 transition-transform" />
              {unreadChatCount > 0 && (
                <span className="absolute -top-2 -right-2 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-mono font-black animate-bounce shadow-xs">
                  {unreadChatCount}
                </span>
              )}
            </div>
            <span>Battle Chat</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-400 font-mono">
              Live
            </span>
          </button>
        ) : (
          <div className="w-80 sm:w-96 h-88 sm:h-96 rounded-2xl bg-white/95 dark:bg-[#151726]/95 backdrop-blur-xl border border-cyan-500/30 dark:border-cyan-500/40 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
            {/* Header */}
            <div className="h-11 px-3.5 bg-slate-100/90 dark:bg-[#1a1d30]/90 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Battle Chat</span>
                </span>
                <span className="text-[10px] text-slate-500 dark:text-neutral-400 font-mono">
                  ({duel?.players.length || 2} in room)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsChatOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-[#282d4a] text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                title="Minimize chat"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Chat message stream */}
            <div
              ref={chatScrollRef}
              className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs select-text"
            >
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 dark:text-neutral-500 p-4 space-y-1">
                  <MessageSquare className="w-8 h-8 opacity-40 mb-1" />
                  <p className="text-xs font-medium">No messages yet.</p>
                  <p className="text-[11px]">Send a message to your opponents!</p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isMe = msg.userId === currentUserId || msg.senderName === (user?.name || 'You');
                  const isSystem = msg.senderName === 'SYSTEM';
                  const isAi = msg.senderName.includes('NEC AI') || msg.senderName.includes('Bot');

                  if (isSystem) {
                    const isLeftNotice = msg.message.includes('left from');
                    return (
                      <div key={msg.id} className="flex justify-center my-1.5 animate-in fade-in">
                        <div
                          className={cn(
                            'px-3 py-1 rounded-full text-[10px] font-mono border flex items-center gap-1.5 shadow-2xs font-semibold',
                            isLeftNotice
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                              : 'bg-slate-200/70 dark:bg-neutral-800/80 text-slate-600 dark:text-neutral-400 border-slate-300/40 dark:border-neutral-700/50'
                          )}
                        >
                          <span>{isLeftNotice ? '⚠️' : '📢'}</span>
                          <span>{msg.message}</span>
                        </div>
                      </div>
                    );
                  }

                  if (isMe) {
                    return (
                      <div key={msg.id} className="flex justify-end w-full animate-in fade-in duration-150">
                        <div className="max-w-[80%] flex flex-col items-end">
                          <div className="px-3.5 py-2 rounded-2xl rounded-tr-xs bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs leading-relaxed shadow-sm break-words">
                            {msg.message}
                          </div>
                          <span className="text-[9px] text-slate-400 dark:text-neutral-500 font-mono mt-0.5 mr-1">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={msg.id} className="flex justify-start w-full animate-in fade-in duration-150">
                      <div className="max-w-[82%] flex flex-col items-start">
                        <div className="flex items-center gap-1.5 mb-0.5 ml-1 text-[10px] font-mono">
                          {isAi ? (
                            <span className="text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1">
                              <Bot className="w-3 h-3 text-purple-500" />
                              {msg.senderName}
                            </span>
                          ) : (
                            <span className="text-violet-600 dark:text-violet-400 font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                              {msg.senderName}
                            </span>
                          )}
                          <span className="text-[9px] text-slate-400 dark:text-neutral-500">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div
                          className={cn(
                            'px-3.5 py-2 rounded-2xl rounded-tl-xs text-xs leading-relaxed shadow-2xs break-words border',
                            isAi
                              ? 'bg-purple-500/15 dark:bg-purple-950/40 text-purple-950 dark:text-purple-200 border-purple-500/30'
                              : 'bg-slate-100 dark:bg-[#1e2238] text-slate-900 dark:text-neutral-200 border border-slate-200 dark:border-neutral-700/80'
                          )}
                        >
                          {msg.message}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Chat Typing Indicator Bar (User Name + Animated Bouncing Dots) */}
            {activeChatTypers.length > 0 && (
              <div className="px-3 py-1.5 bg-cyan-500/5 dark:bg-cyan-500/10 border-t border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-[11px] flex items-center gap-2 animate-in fade-in duration-150">
                <div className="flex items-center gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="font-bold">{activeChatTypers.join(', ')}</span>
                <span className="text-slate-500 dark:text-neutral-400">typing...</span>
              </div>
            )}

            {/* Input Footer */}
            <form
              onSubmit={handleSendChat}
              className="p-2.5 bg-slate-50 dark:bg-[#121422] border-t border-slate-200 dark:border-neutral-800 flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                value={chatInput}
                onChange={handleChatInputChange}
                placeholder="Type a message to opponents..."
                maxLength={200}
                className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1a1d30] border border-slate-200 dark:border-neutral-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-hidden focus:border-cyan-500"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 disabled:opacity-40 transition-all cursor-pointer shadow-xs active:scale-95"
                title="Send message"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Official Code Duel / Prime Duel Rulebook Modal */}
      {duel?.duelType === 'prime' ? (
        <PrimeDuelRulebookModal
          isOpen={isRulebookOpen}
          onClose={() => setIsRulebookOpen(false)}
        />
      ) : (
        <CodeDuelRulebookModal
          isOpen={isRulebookOpen}
          onClose={() => setIsRulebookOpen(false)}
          adminMaxParticipants={duel?.maxParticipants || 4}
        />
      )}

      {/* Leave Battle Confirmation Modal */}
      <AnimatePresence>
        {showLeaveConfirmModal && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-[#151828] border border-rose-500/30 shadow-2xl space-y-4 relative overflow-hidden"
            >
              <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500">
                <LogOut className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Leave Battle Arena?
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
                  Agar aap abhi battle chhodenge to aapka match <span className="text-rose-500 font-bold">forfeited</span> mark ho jayega aur opponents ko notify kar diya jayega.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-rose-500/5 dark:bg-rose-950/20 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 font-mono text-center">
                "{user?.name || 'You'} left from {duel?.maxParticipants || duel?.players?.length || 2} {duel?.duelType === 'prime' ? 'NEC Prime Battle' : 'NEC Code Battle'}"
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLeaveConfirmModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#1f2338] hover:bg-slate-200 dark:hover:bg-[#282d48] text-slate-700 dark:text-neutral-300 font-bold text-xs transition-all cursor-pointer"
                >
                  Stay in Battle
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLeave}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs shadow-lg shadow-rose-500/25 transition-all cursor-pointer active:scale-95"
                >
                  Yes, Leave
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. ROOM CODE SHARE & DIRECT INVITE MODAL */}
      <DuelShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        roomCode={cleanRoomCode}
        groupSize={duel?.maxParticipants || (duel?.players ? Math.max(duel.players.length, 2) : 2)}
        problemTitle={problem?.title}
        difficulty={problem?.difficulty}
        isStaked={(duel as any)?.isStaked || false}
        stakeAmount={(duel as any)?.stakeAmount || 50}
      />

      {/* MOBILE LANDSCAPE ENHANCEMENT PROMPT */}
      <MobileLandscapePrompt
        isOpen={showPrompt}
        onDismiss={dismissPrompt}
        onRotate={lockLandscape}
      />
    </div>
  );
};
