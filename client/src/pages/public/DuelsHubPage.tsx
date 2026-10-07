import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords,
  Zap,
  Users,
  Timer,
  Trophy,
  Copy,
  Check,
  ArrowRight,
  Plus,
  Loader2,
  Play,
  Bot,
  ChevronDown,
  Sparkles,
  Shield,
  BookOpen,
  Search,
  X,
  FileCode,
  Crown,
  Clock,
  Wallet,
  Share2,
} from 'lucide-react';
import { duelService, IDuelUserStats, ICodeDuel } from '../../services/duel.service';
import { problemService } from '../../services/problem.service';
import { IProblemListItem } from '../../types/problem.types';
import { CodeDuelRulebookModal } from '../../components/duel/CodeDuelRulebookModal';
import { DuelShareModal } from '../../components/duel/DuelShareModal';
import { socketService } from '../../services/socket.service';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/ui/Toast';
import { openCoinPassbook } from '../../components/common/CoinPassbookModal';
import { cn } from '../../utils/cn';

export const DuelsHubPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { success, error: toastError, info } = useToast();

  const currentUserId = (user?._id || user?.id || '').toString();
  const userCoins = user?.points ?? 0;
  const socketUnsubRef = useRef<(() => void) | null>(null);

  const [stats, setStats] = useState<IDuelUserStats | null>(null);
  const [activeDuel, setActiveDuel] = useState<ICodeDuel | null>(null);
  const [rejoinSecondsRemaining, setRejoinSecondsRemaining] = useState<number>(0);
  const [isRulebookOpen, setIsRulebookOpen] = useState(false);

  // Quick Match State
  const [isQuickMatching, setIsQuickMatching] = useState(false);
  const [matchmakingTime, setMatchmakingTime] = useState(0);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'Any' | 'Easy' | 'Medium' | 'Hard'>('Any');
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const [waitingRoomCode, setWaitingRoomCode] = useState<string | null>(null);
  const [isJoiningAi, setIsJoiningAi] = useState(false);
  const pollIntervalRef = useRef<any>(null);
  const timeoutTimerRef = useRef<any>(null);

  // Private Room State
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [createdRoomCode, setCreatedRoomCode] = useState<string | null>(null);
  const [groupSize, setGroupSize] = useState<number>(2);
  const [copied, setCopied] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Custom Problem Selection for Private Battle
  const [problemMode, setProblemMode] = useState<'random' | 'specific'>('random');
  const [problemSearchQuery, setProblemSearchQuery] = useState('');
  const [isSearchingProblems, setIsSearchingProblems] = useState(false);
  const [searchedProblems, setSearchedProblems] = useState<IProblemListItem[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<IProblemListItem | null>(null);
  const [showProblemDropdown, setShowProblemDropdown] = useState(false);
  const problemSearchDebounceRef = useRef<any>(null);
  const problemDropdownRef = useRef<HTMLDivElement>(null);

  // Admin-governed maximum squad size
  const adminMaxParticipants = stats?.maxParticipantsPerRoom ?? 4;

  // Allowed team sizes dynamically generated up to admin limit
  const allowedGroupSizes = useMemo(() => {
    const max = Math.max(2, Math.min(10, adminMaxParticipants));
    return Array.from({ length: max - 1 }, (_, i) => i + 2); // [2, 3, ..., max]
  }, [adminMaxParticipants]);

  // Adjust groupSize if it exceeds admin limit
  useEffect(() => {
    if (groupSize > adminMaxParticipants) {
      setGroupSize(adminMaxParticipants);
    }
  }, [adminMaxParticipants, groupSize]);

  // Fetch student stats & detect active battle (only within 2-minute rejoin window)
  useEffect(() => {
    if (isAuthenticated) {
      duelService
        .getMyStats()
        .then((data) => setStats(data))
        .catch(() => {});

      duelService
        .getMyActiveDuel()
        .then((res) => {
          if (res?.activeDuel && (res?.rejoinSecondsRemaining ?? 0) > 0) {
            setActiveDuel(res.activeDuel);
            setRejoinSecondsRemaining(res.rejoinSecondsRemaining ?? 0);
          } else {
            setActiveDuel(null);
            setRejoinSecondsRemaining(0);
          }
        })
        .catch(() => {
          setActiveDuel(null);
          setRejoinSecondsRemaining(0);
        });
    }
  }, [isAuthenticated]);

  // Real-time 2-minute rejoin countdown ticker (auto-dismisses when time expires)
  useEffect(() => {
    if (!activeDuel || rejoinSecondsRemaining <= 0) return;
    const timer = setInterval(() => {
      setRejoinSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setActiveDuel(null); // Instantly dismiss rejoin banner after 2 minutes!
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeDuel, rejoinSecondsRemaining]);

  const formatRejoinTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
      if (socketUnsubRef.current) {
        socketUnsubRef.current();
        socketUnsubRef.current = null;
      }
    };
  }, []);

  // Matchmaking timer ticker (0 up to 30s)
  useEffect(() => {
    let interval: any;
    if (isQuickMatching) {
      interval = setInterval(() => {
        setMatchmakingTime((prev) => {
          if (prev >= 30) {
            clearInterval(interval);
            setIsQuickMatching(false);
            setShowTimeoutModal(true);
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setMatchmakingTime(0);
    }
    return () => clearInterval(interval);
  }, [isQuickMatching]);

  // Debounced search for coding problems
  useEffect(() => {
    if (problemMode !== 'specific') return;
    const query = problemSearchQuery.trim();
    if (!query) {
      setSearchedProblems([]);
      setIsSearchingProblems(false);
      return;
    }

    if (problemSearchDebounceRef.current) clearTimeout(problemSearchDebounceRef.current);
    setIsSearchingProblems(true);

    problemSearchDebounceRef.current = setTimeout(async () => {
      try {
        const res = await problemService.getProblems({
          search: query,
          limit: 8,
        });
        setSearchedProblems(res.problems || []);
      } catch (err) {
        console.error('Failed to search problems for duel:', err);
      } finally {
        setIsSearchingProblems(false);
      }
    }, 300);
  }, [problemSearchQuery, problemMode]);

  // Click outside problem search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (problemDropdownRef.current && !problemDropdownRef.current.contains(e.target as Node)) {
        setShowProblemDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle Quick Match (Max 30s queue)
  const handleQuickMatch = async () => {
    if (!isAuthenticated) {
      toastError('Please log in to join 1vs1 Live Coding Battles');
      navigate('/login');
      return;
    }

    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
    if (socketUnsubRef.current) {
      socketUnsubRef.current();
      socketUnsubRef.current = null;
    }

    setIsQuickMatching(true);
    setShowTimeoutModal(false);
    setMatchmakingTime(0);

    try {
      const res = await duelService.quickMatch(
        selectedDifficulty === 'Any' ? undefined : selectedDifficulty
      );

      const targetRoomCode = (res.roomCode || res.duel?.roomCode || '').toUpperCase();
      const targetStatus = res.status || res.duel?.status;
      const isStarted =
        targetStatus === 'in-progress' ||
        res.started === true ||
        (res.duel?.players?.length ?? 0) >= 2;

      if (isStarted && targetRoomCode) {
        // Matched immediately with an active human opponent!
        success('Opponent Found! Entering Battle Arena...');
        setIsQuickMatching(false);
        navigate(`/practice/duels/${targetRoomCode}`);
        return;
      }

      if (!targetRoomCode) {
        throw new Error('Failed to retrieve room code for matchmaking');
      }

      // Room created and waiting for another player (30s limit)
      setWaitingRoomCode(targetRoomCode);
      info(`Searching for challengers in room ${targetRoomCode}... (Max 30s)`);

      // 1. Join Real-Time Socket Room & Listen for instant start
      socketService.connect(currentUserId);
      socketService.joinDuel(targetRoomCode, currentUserId, user?.name);

      const cleanupSubscriptions = () => {
        if (socketUnsubRef.current) {
          socketUnsubRef.current();
          socketUnsubRef.current = null;
        }
      };

      const unsubStart = socketService.onDuelStart(() => {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
        cleanupSubscriptions();
        setIsQuickMatching(false);
        success('Challenger Connected! Starting Duel...');
        navigate(`/practice/duels/${targetRoomCode}`);
      });
      socketUnsubRef.current = unsubStart;

      // 2. Poll every 1.5 seconds as robust fallback
      pollIntervalRef.current = setInterval(async () => {
        try {
          const check = await duelService.getDuelDetails(targetRoomCode);
          if (check.duel.status === 'in-progress' || check.duel.players.length >= 2) {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
            cleanupSubscriptions();
            setIsQuickMatching(false);
            success('Challenger Connected! Starting Duel...');
            navigate(`/practice/duels/${targetRoomCode}`);
          }
        } catch {
          // Ignore polling errors
        }
      }, 1500);

      // 30-Second Matchmaking Timeout
      timeoutTimerRef.current = setTimeout(() => {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        cleanupSubscriptions();
        setIsQuickMatching(false);
        setShowTimeoutModal(true);
      }, 30000);
    } catch (err: any) {
      setIsQuickMatching(false);
      toastError(err.response?.data?.message || 'Failed to start matchmaking');
    }
  };

  // Handle Join with NEC AI (High Level Challenge)
  const handleJoinWithAi = async () => {
    if (!waitingRoomCode) {
      toastError('No active room found to join with AI');
      return;
    }

    setIsJoiningAi(true);
    try {
      const res = await duelService.joinAiDuel(waitingRoomCode);
      success('🤖 NEC AI (Grandmaster) has entered the arena! Battle started!');
      setShowTimeoutModal(false);
      navigate(`/practice/duels/${res.duel.roomCode}`);
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to connect with NEC AI');
    } finally {
      setIsJoiningAi(false);
    }
  };

  const handleCreatePrivateRoom = async () => {
    if (!isAuthenticated) {
      toastError('Please log in to create a duel room');
      navigate('/login');
      return;
    }

    setIsCreatingRoom(true);
    try {
      const problemId = problemMode === 'specific' && selectedProblem ? selectedProblem.id : undefined;
      const res = await duelService.createDuel({
        difficulty: selectedDifficulty === 'Any' ? undefined : selectedDifficulty,
        isPrivate: true,
        maxParticipants: groupSize,
        problemId,
      });
      setCreatedRoomCode(res.roomCode);
      const problemNameText = selectedProblem ? ` with "${res.problemTitle}"` : '';
      const inviteMsg =
        groupSize === 2
          ? `Private 1vs1 room ${res.roomCode} created${problemNameText}! Share the code with your friend.`
          : `Private group battle ${res.roomCode} created${problemNameText}! Invite up to ${groupSize} friends to battle together.`;
      success(inviteMsg);
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to create room');
    } finally {
      setIsCreatingRoom(false);
    }
  };

  // Handle Join Room via Code
  const handleJoinRoom = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isAuthenticated) {
      toastError('Please log in to join a duel');
      navigate('/login');
      return;
    }

    const cleanCode = joinCodeInput.trim().toUpperCase();
    if (!cleanCode) {
      toastError('Please enter a 6-digit room code');
      return;
    }

    setIsJoining(true);
    try {
      const res = await duelService.joinDuel(cleanCode);
      if (res.rejoined) {
        success(`Welcome back! Rejoining battle in room ${cleanCode}...`);
      } else if (res.started) {
        success(`Joined battle ${cleanCode}! All competitors ready, entering arena...`);
      } else {
        info(`Joined room ${cleanCode}! Waiting in lobby for all competitors...`);
      }
      navigate(`/practice/duels/${res.duel.roomCode}`);
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Invalid or full duel room');
    } finally {
      setIsJoining(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    success('Room code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0c0d14] text-slate-900 dark:text-neutral-100 font-sans transition-colors duration-200">
      {/* 1. HERO CYBER ARENA BANNER */}
      <div className="relative overflow-hidden border-b border-slate-200 dark:border-neutral-800/80 bg-gradient-to-b from-blue-50/50 via-slate-50 to-white dark:from-[#101328] dark:via-[#0c0d14] dark:to-[#0c0d14] pt-8 pb-12 px-4 sm:px-6">
        {/* Glowing Background Orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10 space-y-4">
          {/* Navigation Mode Switcher (Standard vs Prime) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2.5 rounded-2xl bg-white/80 dark:bg-[#141724]/80 border border-slate-200 dark:border-cyan-500/30 backdrop-blur-md shadow-md dark:shadow-2xl transition-colors">
            <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-[#0c0d14] border border-slate-200 dark:border-neutral-800 w-full sm:w-auto">
              <button
                type="button"
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-black bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 transition-all cursor-default"
              >
                <Swords className="w-4 h-4" />
                <span>NEC Code Battle (Free)</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/practice/prime-duels')}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:text-amber-600 hover:bg-white dark:text-slate-400 dark:hover:text-amber-400 dark:hover:bg-neutral-800/60 transition-all cursor-pointer"
              >
                <Crown className="w-4 h-4 text-amber-500" />
                <span>NEC Prime Battle (🪙 Staked)</span>
              </button>
            </div>

            {/* User Wallet Balance & Rulebook trigger */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={openCoinPassbook}
                title="Click to view full Coins Passbook & History"
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-300/80 dark:border-cyan-500/40 text-xs hover:border-cyan-400 dark:hover:border-cyan-400 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-2xs"
              >
                <Wallet className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span className="text-slate-600 dark:text-slate-400 font-medium">Your Wallet:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-cyan-300 underline decoration-cyan-400/50 underline-offset-2">
                  {userCoins.toLocaleString()} Coins 🪙
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsRulebookOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-neutral-800 hover:border-cyan-400 dark:hover:border-cyan-500/50 bg-white dark:bg-[#0c0d14] text-xs text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Official Rulebook</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl text-center md:text-left">
              <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 text-xs font-mono font-bold shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <Swords className="w-3.5 h-3.5" />
                  <span>NEC CODE BATTLE • LIVE ARENA</span>
                </div>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-blue-600 to-cyan-500 dark:from-white dark:via-cyan-300 dark:to-indigo-400 bg-clip-text text-transparent">
                NEC Code Battle
              </h1>

              <p className="text-sm sm:text-base text-slate-600 dark:text-neutral-300 leading-relaxed">
                Enter the room with a challenger, receive <strong>1 random DSA challenge</strong> simultaneously, and race against the <strong>15-minute countdown clock</strong>. The first coder to pass all test cases claims victory and climbs the <strong>Competitive Leaderboard</strong> in this 100% Free Arena!
              </p>
            </div>

            {/* Live Stats Pill Cards */}
            <div className="flex items-center gap-3 shrink-0 flex-wrap justify-center">
              <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#151828]/80 border border-slate-200 dark:border-neutral-800 shadow-lg text-center min-w-[120px]">
                <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400 font-mono">
                  {stats ? stats.totalMatches : '0'}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium">
                  Duels Fought
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#151828]/80 border border-slate-200 dark:border-neutral-800 shadow-lg text-center min-w-[120px]">
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {stats ? stats.wins : '0'}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium">
                  Victories 🏆
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#151828]/80 border border-slate-200 dark:border-neutral-800 shadow-lg text-center min-w-[120px]">
                <div className="text-2xl font-black text-amber-500 dark:text-amber-400 font-mono flex items-center justify-center gap-1">
                  <span>{stats ? stats.winRate : 0}%</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium">
                  Win Rate 🔥
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN BATTLE ARENA LOBBY */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* ACTIVE DUEL REJOIN ALERT BANNER (Strict 2-Minute Window for Left/Disconnected Players) */}
        {activeDuel && rejoinSecondsRemaining > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-3xl bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-rose-500/20 border-2 border-amber-500/50 dark:border-amber-400/60 shadow-xl shadow-amber-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 font-black flex items-center justify-center shadow-lg shadow-orange-500/30 shrink-0 animate-bounce">
                <Swords className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-500/25 text-amber-800 dark:text-amber-200 border border-amber-500/40 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-amber-600 dark:text-amber-300 animate-spin" />
                    <span>REJOIN WINDOW: {formatRejoinTimer(rejoinSecondsRemaining)}</span>
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                    Room: <span className="text-amber-600 dark:text-amber-400 font-extrabold">{activeDuel.roomCode}</span>
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white mt-1">
                  Problem: {activeDuel.problemTitle}
                </h3>
                <p className="text-xs text-slate-600 dark:text-neutral-300">
                  You left this battle room. Rejoin window closes in <strong className="text-amber-600 dark:text-amber-400 font-mono font-bold">{formatRejoinTimer(rejoinSecondsRemaining)}</strong> (Auto-expires after 2 minutes).
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate(`/practice/duels/${activeDuel.roomCode}`)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black text-xs font-mono shadow-lg shadow-amber-500/30 active:scale-95 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>Rejoin Battle ({formatRejoinTimer(rejoinSecondsRemaining)}) &rarr;</span>
            </button>
          </motion.div>
        )}

        {/* MATCH CONFIGURATION BAR: DIFFICULTY & BATTLE TEAM SIZE */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#141724] border border-slate-200 dark:border-neutral-800 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
          {/* SECTION 1: MATCHMAKING DIFFICULTY */}
          <div className="flex items-center justify-between sm:justify-start gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-neutral-300 shrink-0">
              <Sparkles className="w-4 h-4 text-cyan-500" />
              <span>Matchmaking Difficulty:</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Select Dropdown for Difficulty */}
              <div className="relative">
                <label htmlFor="standard-difficulty-select" className="sr-only">
                  Select Difficulty
                </label>
                <select
                  id="standard-difficulty-select"
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value as any)}
                  className="pl-3 pr-8 py-1.5 rounded-xl bg-slate-100 dark:bg-[#1a182e] border-2 border-cyan-500/30 hover:border-cyan-500 text-slate-900 dark:text-white font-bold text-xs focus:outline-hidden focus:ring-2 focus:ring-cyan-500/40 transition-all cursor-pointer appearance-none shadow-xs"
                >
                  <option value="Any" className="bg-white dark:bg-[#1a182e] text-slate-900 dark:text-white font-medium">
                    Any Difficulty
                  </option>
                  <option value="Easy" className="bg-white dark:bg-[#1a182e] text-slate-900 dark:text-white font-medium">
                    Easy
                  </option>
                  <option value="Medium" className="bg-white dark:bg-[#1a182e] text-slate-900 dark:text-white font-medium">
                    Medium
                  </option>
                  <option value="Hard" className="bg-white dark:bg-[#1a182e] text-slate-900 dark:text-white font-medium">
                    Hard
                  </option>
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-neutral-400">
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Quick Select Buttons for Difficulty */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {(['Any', 'Easy', 'Medium', 'Hard'] as const).map((diff) => {
                  const isActive = selectedDifficulty === diff;
                  return (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setSelectedDifficulty(diff)}
                      className={cn(
                        'px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border shadow-xs',
                        isActive
                          ? diff === 'Easy'
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white border-transparent shadow-md shadow-emerald-500/25 scale-105'
                            : diff === 'Medium'
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 border-transparent shadow-md shadow-amber-500/25 scale-105 font-black'
                            : diff === 'Hard'
                            ? 'bg-gradient-to-r from-rose-600 to-red-500 text-white border-transparent shadow-md shadow-rose-500/25 scale-105'
                            : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black border-transparent shadow-md shadow-blue-500/25 scale-105'
                          : 'bg-slate-100 dark:bg-[#1c2033] text-slate-600 dark:text-neutral-400 border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 hover:scale-102'
                      )}
                    >
                      {diff}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* DIVIDER FOR LARGE SCREENS */}
          <div className="hidden lg:block w-px h-8 bg-slate-200 dark:border-neutral-800 shrink-0" />

          {/* SECTION 2: BATTLE TEAM SIZE SELECTOR */}
          <div className="flex items-center justify-between sm:justify-start gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-neutral-300 shrink-0">
              <Users className="w-4 h-4 text-blue-500" />
              <span>Team size:</span>
              <span className="font-mono text-[10px] px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-extrabold flex items-center gap-1">
                <Shield className="w-3 h-3 text-blue-500 shrink-0" />
                <span>Admin Limit: Max {adminMaxParticipants}</span>
              </span>
            </div>

            {/* Select & Option Dropdown + Quick Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <label htmlFor="team-size-select" className="sr-only">
                  Select Team Size
                </label>
                <select
                  id="team-size-select"
                  value={groupSize}
                  onChange={(e) => setGroupSize(Number(e.target.value))}
                  className="pl-3 pr-8 py-1.5 rounded-xl bg-slate-100 dark:bg-[#1a182e] border-2 border-blue-500/30 hover:border-blue-500 text-slate-900 dark:text-white font-bold text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/40 transition-all cursor-pointer appearance-none shadow-xs"
                >
                  {allowedGroupSizes.map((size) => (
                    <option
                      key={size}
                      value={size}
                      className="bg-white dark:bg-[#1a182e] text-slate-900 dark:text-white font-medium"
                    >
                      {size === 2
                        ? '2 Players (1vs1)'
                        : size === 3
                        ? '3 Players (Trio)'
                        : size === 4
                        ? '4 Players (Squad)'
                        : `${size} Players`}
                    </option>
                  ))}
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-neutral-400">
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Quick Select Buttons - strictly 2, 3, 4 */}
              <div className="flex items-center gap-1.5">
                {[2, 3, 4].filter((size) => allowedGroupSizes.includes(size)).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setGroupSize(size)}
                    className={cn(
                      'py-1.5 px-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border shadow-xs flex items-center gap-1',
                      groupSize === size
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold border-transparent shadow-md shadow-blue-500/25 scale-105 ring-2 ring-blue-400/40'
                        : 'bg-slate-100 dark:bg-[#1c2033] text-slate-600 dark:text-neutral-400 border-slate-200 dark:border-neutral-800 hover:border-blue-400 hover:scale-102'
                    )}
                  >
                    <span>{size === 2 ? '1v1 (2)' : `${size} Squad`}</span>
                    {groupSize === size && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 2 MATCH CARDS: QUICK MATCH vs PRIVATE ROOM */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CARD 1: QUICK MATCH (FIND OPPONENT) */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-white via-slate-50 to-blue-50/30 dark:from-[#141724] dark:via-[#161a2c] dark:to-[#121422] border border-cyan-500/30 dark:border-cyan-500/40 shadow-xl space-y-6 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30">
                <Zap className="w-6 h-6 animate-pulse" />
              </div>
              <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 text-xs font-mono font-bold border border-cyan-500/30">
                1-Click Match
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Quick Match (Live Online)
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
                Instantly match with any coder active on the platform. The server pairs you with a challenger and launches the 15-minute duel immediately.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-100/80 dark:bg-[#1a1e30]/80 border border-slate-200 dark:border-neutral-800 text-xs space-y-1.5 font-mono">
              <div className="flex items-center justify-between text-slate-600 dark:text-neutral-300">
                <span>⏱️ Duel Time Limit:</span>
                <strong className="text-cyan-600 dark:text-cyan-400">15:00 Minutes</strong>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-neutral-300">
                <span>🏆 Match Format:</span>
                <strong className="text-emerald-500 flex items-center gap-1">100% Free Arena ⚡</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={handleQuickMatch}
              disabled={isQuickMatching}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 hover:shadow-cyan-500/25 active:scale-98 transition-all cursor-pointer"
            >
              {isQuickMatching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Searching for Challenger ({30 - matchmakingTime}s remaining)...</span>
                </>
              ) : (
                <>
                  <Swords className="w-4 h-4" />
                  <span>Find Live Opponent</span>
                </>
              )}
            </button>
          </div>

          {/* CARD 2: PRIVATE DUEL (CREATE / JOIN WITH CODE) */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 dark:from-[#141628] dark:via-[#15192c] dark:to-[#111220] border-2 border-blue-500/30 dark:border-blue-500/40 shadow-xl hover:shadow-2xl hover:border-blue-500/60 transition-all duration-300 space-y-6 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                <Users className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 text-xs font-mono font-bold border border-blue-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-blue-500" />
                <span>Play With Friends</span>
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Private Duel Room
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
                Create a private room to invite college friends or enter a 6-digit room code to jump directly into the battle.
              </p>
            </div>

            {/* BATTLE PROBLEM SELECTION: RANDOM vs SPECIFIC SEARCH */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-neutral-300 flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-blue-500" />
                  <span>Battle Problem:</span>
                </label>
                <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-[#1b1e32] border border-slate-200 dark:border-neutral-800 text-[11px] font-mono">
                  <button
                    type="button"
                    onClick={() => {
                      setProblemMode('random');
                      setSelectedProblem(null);
                    }}
                    className={cn(
                      'px-2 py-0.5 rounded-md transition-all cursor-pointer font-semibold',
                      problemMode === 'random'
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    )}
                  >
                    Random
                  </button>
                  <button
                    type="button"
                    onClick={() => setProblemMode('specific')}
                    className={cn(
                      'px-2 py-0.5 rounded-md transition-all cursor-pointer font-semibold',
                      problemMode === 'specific'
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    )}
                  >
                    Search Problem
                  </button>
                </div>
              </div>

              {problemMode === 'random' ? (
                <div className="p-2.5 rounded-xl bg-blue-500/5 dark:bg-blue-950/20 border border-blue-500/20 text-xs text-slate-600 dark:text-neutral-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span>Random DSA challenge matching difficulty</span>
                  </span>
                  <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400">
                    {selectedDifficulty}
                  </span>
                </div>
              ) : selectedProblem ? (
                <div className="p-2.5 rounded-xl bg-blue-500/10 dark:bg-blue-950/30 border border-blue-500/40 text-xs flex items-center justify-between animate-in fade-in">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white flex items-center justify-center shrink-0 font-bold text-xs">
                      ✓
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 dark:text-white truncate">
                        {selectedProblem.title}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                        <span
                          className={cn(
                            'font-bold',
                            selectedProblem.difficulty === 'Easy'
                              ? 'text-emerald-500'
                              : selectedProblem.difficulty === 'Medium'
                              ? 'text-amber-500'
                              : 'text-rose-500'
                          )}
                        >
                          {selectedProblem.difficulty}
                        </span>
                        {selectedProblem.category && <span>• {selectedProblem.category}</span>}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedProblem(null)}
                    className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer shrink-0 ml-2"
                    title="Choose a different problem"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative" ref={problemDropdownRef}>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={problemSearchQuery}
                      onChange={(e) => {
                        setProblemSearchQuery(e.target.value);
                        setShowProblemDropdown(true);
                      }}
                      onFocus={() => setShowProblemDropdown(true)}
                      placeholder="Search DSA problem (e.g. Two Sum, Palindrome...)"
                      className="w-full pl-9 pr-8 py-2 rounded-xl bg-white dark:bg-[#1a182e] border border-blue-500/30 dark:border-neutral-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-hidden focus:border-blue-500"
                    />
                    {isSearchingProblems ? (
                      <Loader2 className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" />
                    ) : problemSearchQuery ? (
                      <button
                        type="button"
                        onClick={() => {
                          setProblemSearchQuery('');
                          setSearchedProblems([]);
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    ) : null}
                  </div>

                  {/* Search Results Dropdown */}
                  {showProblemDropdown && searchedProblems.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl bg-white dark:bg-[#1a182e] border border-blue-500/30 shadow-2xl z-20 py-1 divide-y divide-slate-100 dark:divide-neutral-800">
                      {searchedProblems.map((prob) => (
                        <button
                          key={prob.id}
                          type="button"
                          onClick={() => {
                            setSelectedProblem(prob);
                            setShowProblemDropdown(false);
                            setProblemSearchQuery('');
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-blue-50 dark:hover:bg-[#1a233a] flex items-center justify-between gap-2 transition-colors cursor-pointer text-xs group"
                        >
                          <span className="font-semibold text-slate-800 dark:text-neutral-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                            {prob.title}
                          </span>
                          <span
                            className={cn(
                              'text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0',
                              prob.difficulty === 'Easy'
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : prob.difficulty === 'Medium'
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                            )}
                          >
                            {prob.difficulty}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {showProblemDropdown && !isSearchingProblems && problemSearchQuery.trim() && searchedProblems.length === 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 p-3 rounded-xl bg-white dark:bg-[#1a182e] border border-blue-500/30 shadow-2xl z-20 text-center text-xs text-slate-400">
                      No problems found matching "{problemSearchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Room Code Created Alert OR Generate Room Code Button */}
            {createdRoomCode ? (
              <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-400/40 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-800 dark:text-blue-200">
                    Your Room Code ({groupSize} Players):
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyCode(createdRoomCode)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-[#1a182e] text-blue-700 dark:text-blue-300 border border-blue-300/80 dark:border-blue-700/60 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-xs font-bold transition-all cursor-pointer shadow-xs"
                      title="Copy 6-digit Code"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsShareModalOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-xs hover:shadow-blue-500/25 transition-all cursor-pointer active:scale-95"
                      title="Share Room Invite"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share</span>
                    </button>
                  </div>
                </div>
                <div className="text-2xl font-mono font-black text-blue-700 dark:text-blue-300 text-center tracking-widest py-2 bg-white dark:bg-[#1a182e] rounded-xl border border-blue-500/30 shadow-inner">
                  {createdRoomCode}
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/practice/duels/${createdRoomCode}`)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/25 transition-all active:scale-98"
                >
                  <span>Enter Room Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleCreatePrivateRoom}
                disabled={isCreatingRoom}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-600/30 hover:shadow-cyan-500/25 active:scale-98"
              >
                {isCreatingRoom ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>
                  Generate Room Code
                </span>
              </button>
            )}

            {/* JOIN VIA CODE FORM */}
            <form onSubmit={handleJoinRoom} className="space-y-2 pt-3 border-t border-slate-200 dark:border-neutral-800">
              <label className="text-xs font-bold text-slate-700 dark:text-neutral-300 block">
                Have a friend's room code?
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. NEC2K742"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  maxLength={16}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#1a182e] border border-blue-500/30 dark:border-neutral-700 text-slate-900 dark:text-white font-mono text-xs uppercase tracking-wider focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  type="submit"
                  disabled={isJoining || !joinCodeInput.trim()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-blue-500/25 active:scale-95 shrink-0"
                >
                  {isJoining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  <span>Join</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* 3. HOW LIVE DUELS WORK (RULES BREAKDOWN) */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#141724] border border-slate-200 dark:border-neutral-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg flex items-center gap-2">
              <Timer className="w-5 h-5 text-cyan-500" />
              <span>Official NEC Code Battle Rules & Mechanics</span>
            </h3>

            <button
              type="button"
              onClick={() => setIsRulebookOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white text-xs font-mono font-bold shadow-md shadow-blue-500/25 transition-all cursor-pointer active:scale-95 shrink-0"
            >
              <BookOpen className="w-4 h-4" />
              <span>View Full Official Rulebook &rarr;</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs leading-relaxed text-slate-600 dark:text-neutral-300">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#181b2a] border border-slate-200 dark:border-neutral-800 space-y-1.5">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-mono flex items-center justify-center text-[10px]">1</span>
                Synchronized Start
              </span>
              <p>Both coders receive the exact same random problem and starter code with a live 15:00 countdown clock.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#181b2a] border border-slate-200 dark:border-neutral-800 space-y-1.5">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-mono flex items-center justify-center text-[10px]">2</span>
                Real-Time Opponent Radar
              </span>
              <p>Watch your opponent's typing indicators and test case progress live on screen without seeing their raw code.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#181b2a] border border-slate-200 dark:border-neutral-800 space-y-1.5">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-mono flex items-center justify-center text-[10px]">3</span>
                Instant Victory & Glory
              </span>
              <p>The first participant to pass 100% of sample and hidden test cases instantly wins the duel and boosts their <strong>DSA Leaderboard Standing 🏆</strong> (100% Free Practice).</p>
            </div>
          </div>
        </div>

        {/* 4. RECENT DUEL BATTLES HISTORY */}
        {stats && stats.recentDuels.length > 0 && (
          <div className="p-6 rounded-3xl bg-white dark:bg-[#141724] border border-slate-200 dark:border-neutral-800 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Your Recent Code Battles</span>
            </h3>

            <div className="divide-y divide-slate-100 dark:divide-neutral-800">
              {stats.recentDuels.slice(0, 5).map((battle) => (
                <div key={battle.id} className="py-3 flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full font-mono font-bold text-[10px]',
                        battle.isWinner
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                      )}
                    >
                      {battle.isWinner ? 'VICTORY' : 'DEFEAT'}
                    </span>
                    <div>
                      <strong className="text-slate-900 dark:text-white">{battle.problemTitle}</strong>
                      <span className="text-slate-500 dark:text-neutral-500 ml-2 font-mono">
                        vs {battle.opponentName}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 font-mono text-slate-500 dark:text-neutral-400">
                    <span className="text-[11px]">{new Date(battle.date).toLocaleDateString()}</span>
                    {battle.isWinner && (
                      <span className="text-emerald-500 font-bold flex items-center gap-1">
                        🏆 Winner
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* QUICK MATCH MODAL OVERLAY */}
      <AnimatePresence>
        {isQuickMatching && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md p-8 rounded-3xl bg-white dark:bg-[#141724] border border-cyan-500/40 shadow-2xl text-center space-y-6"
            >
              {/* Pulsing Radar Animation */}
              <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                <span className="absolute inset-0 rounded-full border-2 border-cyan-500/40 animate-ping" />
                <span className="absolute inset-2 rounded-full border border-blue-500/30 animate-pulse" />
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg">
                  <Swords className="w-8 h-8 animate-bounce" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Searching for a Challenger...
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  Scanning active coders across universities for a balanced match ({30 - matchmakingTime}s remaining).
                </p>
                <div className="w-full bg-slate-100 dark:bg-[#1a1d30] rounded-full h-1.5 overflow-hidden mt-3">
                  <div
                    style={{ width: `${(matchmakingTime / 30) * 100}%` }}
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-1000"
                  />
                </div>
              </div>

              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                    if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
                    if (socketUnsubRef.current) {
                      socketUnsubRef.current();
                      socketUnsubRef.current = null;
                    }
                    if (waitingRoomCode) {
                      duelService.cancelDuel(waitingRoomCode).catch(() => {});
                      socketService.leaveDuel(waitingRoomCode, currentUserId, user?.name);
                      setWaitingRoomCode(null);
                    }
                    setIsQuickMatching(false);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#202438] dark:hover:bg-[#2c324c] text-slate-700 dark:text-neutral-200 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel Matchmaking
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 30-SECOND MATCHMAKING TIMEOUT MODAL (NO MATCH FOUND) */}
      <AnimatePresence>
        {showTimeoutModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#141724] border border-cyan-500/40 shadow-2xl text-center space-y-6 animate-in fade-in"
            >
              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-lg">
                <Timer className="w-8 h-8 animate-pulse" />
              </div>

              <div className="space-y-2">
                <span className="px-3 py-1 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 text-xs font-mono font-bold border border-rose-500/30">
                  NO OPPONENT FOUND (30s LIMIT)
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white pt-1">
                  Queue Timed Out
                </h2>
                <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed max-w-sm mx-auto">
                  No live student matched within 30 seconds. You can retry the search or challenge our high-level <strong>NEC AI</strong> in an intense contest!
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                {/* Featured: Join with NEC AI */}
                <button
                  type="button"
                  disabled={isJoiningAi}
                  onClick={handleJoinWithAi}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-600/25 active:scale-95 disabled:opacity-50"
                >
                  {isJoiningAi ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Connecting NEC AI Grandmaster...</span>
                    </>
                  ) : (
                    <>
                      <Bot className="w-4 h-4" />
                      <span>⚡ Join with NEC AI (High Level Challenge)</span>
                    </>
                  )}
                </button>

                {/* Try Again Button */}
                <button
                  type="button"
                  onClick={() => {
                    setShowTimeoutModal(false);
                    handleQuickMatch();
                  }}
                  className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1e2238] dark:hover:bg-[#282d4a] text-slate-800 dark:text-neutral-200 font-bold text-xs transition-all cursor-pointer"
                >
                  Try Again (Search Next 30s)
                </button>

                {/* Cancel */}
                <button
                  type="button"
                  onClick={() => setShowTimeoutModal(false)}
                  className="text-xs font-mono text-slate-500 hover:text-slate-700 dark:hover:text-neutral-300 transition-colors block mx-auto pt-1 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Official Code Duel Rulebook Modal */}
      <CodeDuelRulebookModal
        isOpen={isRulebookOpen}
        onClose={() => setIsRulebookOpen(false)}
        adminMaxParticipants={adminMaxParticipants}
      />

      {/* Code Duel Room Share Modal */}
      <DuelShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        roomCode={createdRoomCode || ''}
        groupSize={groupSize}
        problemTitle={selectedProblem?.title}
        difficulty={selectedProblem?.difficulty || selectedDifficulty}
        isStaked={false}
        stakeAmount={50}
      />
    </div>
  );
};
