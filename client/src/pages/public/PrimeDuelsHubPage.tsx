import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown,
  Coins,
  Swords,
  Users,
  Trophy,
  Copy,
  Check,
  Plus,
  Loader2,
  Play,
  Bot,
  Sparkles,
  BookOpen,
  Search,
  X,
  FileCode,
  Wallet,
  ShieldCheck,
  Clock,
  Share2,
  Zap,
  Timer,
  ChevronDown,
  ArrowRight,
} from 'lucide-react';
import { duelService, ICodeDuel } from '../../services/duel.service';
import { problemService } from '../../services/problem.service';
import { IProblemListItem } from '../../types/problem.types';
import { PrimeDuelRulebookModal } from '../../components/duel/PrimeDuelRulebookModal';
import { DuelShareModal } from '../../components/duel/DuelShareModal';
import { socketService } from '../../services/socket.service';
import { useAuth } from '../../hooks/useAuth';
import { useAppDispatch } from '../../store/hooks';
import { checkAuth } from '../../store/slices/authSlice';
import { useToast } from '../../components/ui/Toast';
import { openCoinPassbook } from '../../components/common/CoinPassbookModal';
import { cn } from '../../utils/cn';

export const PrimeDuelsHubPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAuth();
  const { success, error: toastError, info } = useToast();

  const currentUserId = (user?._id || user?.id || '').toString();
  const socketUnsubRef = useRef<(() => void) | null>(null);

  const [isRulebookOpen, setIsRulebookOpen] = useState(false);
  const [primeStats, setPrimeStats] = useState<any>(null);
  const [activeDuel, setActiveDuel] = useState<ICodeDuel | null>(null);
  const [rejoinSecondsRemaining, setRejoinSecondsRemaining] = useState<number>(0);

  // Staking State (Min 50 coins)
  const [stakeAmount, setStakeAmount] = useState<number>(50);
  const [teamSize, setTeamSize] = useState<number>(2);

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
  const [copied, setCopied] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Custom Problem Selection
  const [problemMode, setProblemMode] = useState<'random' | 'specific'>('random');
  const [problemSearchQuery, setProblemSearchQuery] = useState('');
  const [isSearchingProblems, setIsSearchingProblems] = useState(false);
  const [searchedProblems, setSearchedProblems] = useState<IProblemListItem[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<IProblemListItem | null>(null);
  const [showProblemDropdown, setShowProblemDropdown] = useState(false);
  const problemSearchDebounceRef = useRef<any>(null);
  const problemDropdownRef = useRef<HTMLDivElement>(null);

  const userCoins = user?.points ?? 0;

  // Real-time Prize Pool & Winner Calculations
  const poolBreakdown = useMemo(() => {
    const validStake = Math.max(50, stakeAmount || 50);
    const size = Math.max(2, Math.min(10, teamSize || 2));
    const gross = validStake * size;
    const fee = Math.round(gross * 0.1);
    const net = gross - fee;

    let winners: Array<{ rank: number; label: string; percent: number; coins: number }> = [];
    if (size === 2) {
      winners = [{ rank: 1, label: '🥇 1st Place (Sole Champion)', percent: 100, coins: net }];
    } else if (size <= 5) {
      winners = [
        { rank: 1, label: '🥇 1st Place', percent: 65, coins: Math.round(net * 0.65) },
        { rank: 2, label: '🥈 2nd Place', percent: 35, coins: net - Math.round(net * 0.65) },
      ];
    } else {
      const first = Math.round(net * 0.5);
      const second = Math.round(net * 0.3);
      const third = net - first - second;
      winners = [
        { rank: 1, label: '🥇 1st Place', percent: 50, coins: first },
        { rank: 2, label: '🥈 2nd Place', percent: 30, coins: second },
        { rank: 3, label: '🥉 3rd Place', percent: 20, coins: third },
      ];
    }

    return {
      gross,
      fee,
      net,
      winners,
    };
  }, [stakeAmount, teamSize]);

  // Fetch stats & active duel (strictly within 2-minute rejoin window)
  useEffect(() => {
    if (isAuthenticated) {
      duelService
        .getMyPrimeStats()
        .then((data) => setPrimeStats(data))
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

  // Matchmaking ticker
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

  // Click outside problem dropdown listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (problemDropdownRef.current && !problemDropdownRef.current.contains(e.target as Node)) {
        setShowProblemDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle specific problem search
  const handleProblemSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setProblemSearchQuery(q);

    if (problemSearchDebounceRef.current) clearTimeout(problemSearchDebounceRef.current);
    if (!q.trim()) {
      setSearchedProblems([]);
      setShowProblemDropdown(false);
      return;
    }

    setIsSearchingProblems(true);
    setShowProblemDropdown(true);

    problemSearchDebounceRef.current = setTimeout(async () => {
      try {
        const res = await problemService.getProblems({
          search: q.trim(),
          limit: 8,
        });
        setSearchedProblems(res.problems || []);
      } catch (err) {
        console.error('Failed to search problems for battle:', err);
      } finally {
        setIsSearchingProblems(false);
      }
    }, 300);
  };

  // Quick Match Handler
  const handleStartQuickMatch = async () => {
    if (!isAuthenticated) {
      toastError('Authentication Required', 'Please log in to participate in NEC Prime Battles');
      navigate('/login');
      return;
    }

    if (stakeAmount < 50) {
      toastError('Minimum Stake Required', 'Minimum entry stake is 50 NEC Coins');
      return;
    }

    if (userCoins < stakeAmount) {
      toastError('Insufficient Coins', `You need at least ${stakeAmount} coins to enter this battle`);
      return;
    }

    try {
      setIsQuickMatching(true);
      setShowTimeoutModal(false);

      const diff = selectedDifficulty === 'Any' ? undefined : selectedDifficulty;
      const res = await duelService.quickMatchPrime({
        entryFee: stakeAmount,
        difficulty: diff,
        maxParticipants: teamSize,
      });

      const targetRoomCode = (res.roomCode || res.duel?.roomCode || '').toUpperCase();
      const targetStatus = res.status || res.duel?.status;
      const isStarted =
        targetStatus === 'matched' ||
        targetStatus === 'in-progress' ||
        res.started === true ||
        (res.duel?.players?.length ?? 0) >= teamSize;

      dispatch(checkAuth());

      // If already matched/started (Student B joining existing waiting room), navigate immediately!
      if (isStarted && targetRoomCode) {
        success('Opponent Found!', 'Staked entry confirmed! Entering Prime Arena...');
        setIsQuickMatching(false);
        navigate(`/practice/prime-duels/${targetRoomCode}`);
        return;
      }

      if (!targetRoomCode) {
        throw new Error('Failed to retrieve room code for Prime matchmaking');
      }

      setWaitingRoomCode(targetRoomCode);

      // Join socket room so Student A receives immediate duel:start notification when Student B matches
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
        success('High-Stakes Duel Ready!', 'Opponent joined! Entering Prime Arena...');
        navigate(`/practice/prime-duels/${targetRoomCode}`);
      });
      socketUnsubRef.current = unsubStart;

      // Fallback Poll in case socket event is missed
      pollIntervalRef.current = setInterval(async () => {
        try {
          const detail = await duelService.getDuelDetails(targetRoomCode);
          if (detail?.duel?.status === 'in-progress' || (detail?.duel?.players?.length ?? 0) >= teamSize) {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
            cleanupSubscriptions();
            setIsQuickMatching(false);
            success('High-Stakes Duel Ready!', 'Opponent joined! Entering Prime Arena...');
            navigate(`/practice/prime-duels/${targetRoomCode}`);
          }
        } catch (e) {
          // keep polling
        }
      }, 1500);

      timeoutTimerRef.current = setTimeout(() => {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        cleanupSubscriptions();
        setIsQuickMatching(false);
        setShowTimeoutModal(true);
      }, 30000);
    } catch (err: any) {
      setIsQuickMatching(false);
      toastError('Matchmaking Failed', err.response?.data?.message || 'Could not queue for Prime Duel');
    }
  };

  // Cancel Matchmaking & 100% Refund
  const handleCancelQuickMatch = async () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
    if (socketUnsubRef.current) {
      socketUnsubRef.current();
      socketUnsubRef.current = null;
    }
    setIsQuickMatching(false);
    setShowTimeoutModal(false);

    if (waitingRoomCode) {
      try {
        socketService.leaveDuel(waitingRoomCode, currentUserId, user?.name);
        await duelService.cancelPrimeDuel(waitingRoomCode);
        info('Matchmaking Cancelled', '100% of your staked coins have been returned to your wallet.');
        dispatch(checkAuth());
      } catch (err) {
        // quiet fail
      }
      setWaitingRoomCode(null);
    }
  };

  // Fallback to Bot Duel
  const handleJoinAi = async () => {
    if (!waitingRoomCode) return;
    try {
      setIsJoiningAi(true);
      await duelService.joinAiDuel(waitingRoomCode);
      setShowTimeoutModal(false);
      success('AI Opponent Summoned', 'Entering Prime Arena against Prime Bot...');
      navigate(`/practice/prime-duels/${waitingRoomCode}`);
    } catch (err: any) {
      toastError('Failed to Summon AI', err.response?.data?.message || 'Could not attach AI bot');
    } finally {
      setIsJoiningAi(false);
    }
  };

  // Create Private Prime Room
  const handleCreateRoom = async () => {
    if (!isAuthenticated) {
      toastError('Authentication Required', 'Please log in to create an NEC Prime Battle');
      navigate('/login');
      return;
    }

    if (stakeAmount < 50) {
      toastError('Minimum Stake Error', 'Minimum entry stake is 50 NEC Coins');
      return;
    }

    if (userCoins < stakeAmount) {
      toastError('Insufficient Coins', `You need at least ${stakeAmount} coins to create this room`);
      return;
    }

    if (problemMode === 'specific' && !selectedProblem) {
      toastError('Problem Required', 'Please search and select a problem, or choose Random Problem');
      return;
    }

    try {
      setIsCreatingRoom(true);
      const res = await duelService.createPrimeDuel({
        entryFee: stakeAmount,
        maxParticipants: teamSize,
        difficulty: selectedDifficulty === 'Any' ? undefined : selectedDifficulty,
        problemId: problemMode === 'specific' ? selectedProblem?.id : undefined,
        isPrivate: true,
      });

      setCreatedRoomCode(res.roomCode);
      dispatch(checkAuth());
      success('Prime Battle Room Created!', `Staked ${stakeAmount} 🪙. Share room code ${res.roomCode} with friends!`);
    } catch (err: any) {
      toastError('Room Creation Failed', err.response?.data?.message || 'Failed to create Prime Battle room');
    } finally {
      setIsCreatingRoom(false);
    }
  };

  // Join Existing Room
  const handleJoinRoom = async () => {
    if (!isAuthenticated) {
      toastError('Authentication Required', 'Please log in to join an NEC Prime Battle');
      navigate('/login');
      return;
    }

    const code = joinCodeInput.trim().toUpperCase();
    if (!code) {
      toastError('Code Required', 'Please enter a valid room code');
      return;
    }

    try {
      setIsJoining(true);
      const res = await duelService.joinPrimeDuel(code);
      dispatch(checkAuth());
      success('Joined Prime Battle!', `Staked ${res.duel.entryFee || 50} 🪙. Entering Prime Arena...`);
      navigate(`/practice/prime-duels/${code}`);
    } catch (err: any) {
      toastError('Failed to Join', err.response?.data?.message || 'Room is invalid, full, or you lack sufficient coins');
    } finally {
      setIsJoining(false);
    }
  };

  // Copy Room Code
  const handleCopyCode = () => {
    if (createdRoomCode) {
      navigator.clipboard.writeText(createdRoomCode);
      setCopied(true);
      success('Copied!', 'Room code copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0c0d14] text-slate-900 dark:text-neutral-100 font-sans transition-colors duration-200">
      {/* 1. HERO CYBER ARENA BANNER (EXACT SAME STRUCTURE AS NEC BATTLE) */}
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
                onClick={() => navigate('/practice/duels')}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-white dark:text-slate-400 dark:hover:text-white dark:hover:bg-neutral-800/60 transition-all cursor-pointer"
              >
                <Swords className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                <span>NEC Code Battle (Free)</span>
              </button>

              <button
                type="button"
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-black bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 transition-all cursor-default"
              >
                <Crown className="w-4 h-4 text-amber-300" />
                <span>NEC Prime Battle (🪙 Staked)</span>
              </button>
            </div>

            {/* User Wallet Balance & Rulebook trigger */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={openCoinPassbook}
                title="Click to view full Coins Passbook & History"
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-500/40 text-xs hover:border-amber-400 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-2xs"
              >
                <Wallet className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-slate-600 dark:text-slate-400 font-medium">Your Wallet:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-amber-300 underline decoration-amber-400/50 underline-offset-2">
                  {userCoins.toLocaleString()} Coins 🪙
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsRulebookOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-neutral-800 hover:border-cyan-400 dark:hover:border-cyan-500/50 bg-white dark:bg-[#0c0d14] text-xs text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span className="hidden sm:inline">Official Rulebook</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl text-center md:text-left">
              <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 text-xs font-mono font-bold shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <Crown className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                  <span>HIGH-STAKES LIVE ARENA • 10% PLATFORM CUT</span>
                </div>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-blue-600 to-cyan-500 dark:from-white dark:via-cyan-300 dark:to-indigo-400 bg-clip-text text-transparent flex items-center gap-3 justify-center md:justify-start">
                <span>NEC Prime Battle</span>
              </h1>

              <p className="text-sm sm:text-base text-slate-600 dark:text-neutral-300 leading-relaxed">
                Stake your NEC Coins against top developers in high-octane 15-minute coding showdowns. A strict <strong>10% platform commission</strong> is deducted from the collective pot, and the remaining <strong>90% net prize pool</strong> is shared among top winners!
              </p>
            </div>

            {/* Live Stats Pill Cards (EXACT MATCH TO NEC BATTLE SCREENSHOT) */}
            <div className="flex items-center gap-3 shrink-0 flex-wrap justify-center">
              <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#151828]/80 border border-slate-200 dark:border-neutral-800 shadow-lg text-center min-w-[120px]">
                <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400 font-mono">
                  {primeStats ? primeStats.totalMatches : '0'}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium">
                  Duels Fought
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#151828]/80 border border-slate-200 dark:border-neutral-800 shadow-lg text-center min-w-[120px]">
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {primeStats ? primeStats.wins : '0'}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium">
                  Victories 🏆
                </div>
              </div>

              <button
                type="button"
                onClick={openCoinPassbook}
                title="Click to view full Coins Passbook & History"
                className="p-4 rounded-2xl bg-white/80 dark:bg-[#151828]/80 border border-slate-200 dark:border-neutral-800 hover:border-amber-400 shadow-lg text-center min-w-[120px] hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <div className="text-2xl font-black text-amber-500 dark:text-amber-400 font-mono flex items-center justify-center gap-1">
                  <span>+{primeStats ? primeStats.totalCoinsWon : 0}</span>
                  <Coins className="w-4 h-4" />
                </div>
                <div className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium flex items-center justify-center gap-1">
                  <span>Coins Claimed</span>
                  <span className="text-[9px] text-amber-500 underline">ledger</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN BATTLE ARENA LOBBY (EXACT SAME MAX-W-6XL PADDING & GAP) */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* ACTIVE DUEL REJOIN ALERT BANNER */}
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
                  Problem: {activeDuel.problemTitle || 'Live Prime Duel'}
                </h3>
                <p className="text-xs text-slate-600 dark:text-neutral-300">
                  You left this battle room. Rejoin window closes in <strong className="text-amber-600 dark:text-amber-400 font-mono font-bold">{formatRejoinTimer(rejoinSecondsRemaining)}</strong> (Auto-expires after 2 minutes).
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate(`/practice/prime-duels/${activeDuel.roomCode}`)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white font-black text-xs font-mono shadow-lg shadow-blue-500/30 active:scale-95 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>Rejoin Prime Arena ({formatRejoinTimer(rejoinSecondsRemaining)}) &rarr;</span>
            </button>
          </motion.div>
        )}

        {/* MATCH CONFIGURATION BAR: DIFFICULTY, BATTLE TEAM SIZE & STAKE SELECTOR */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#141724] border border-slate-200 dark:border-neutral-800 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4 items-center">
            {/* TOP-LEFT: MATCHMAKING DIFFICULTY */}
            <div className="flex items-center justify-between sm:justify-start gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-neutral-300 shrink-0">
                <Sparkles className="w-4 h-4 text-cyan-500" />
                <span>Matchmaking Difficulty:</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Select Dropdown for Difficulty */}
                <div className="relative">
                  <label htmlFor="prime-difficulty-select" className="sr-only">
                    Select Difficulty
                  </label>
                  <select
                    id="prime-difficulty-select"
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
                              ? 'bg-emerald-600 text-white border-transparent shadow-md shadow-emerald-500/25 scale-105'
                              : diff === 'Medium'
                              ? 'bg-amber-500 text-slate-950 border-transparent shadow-md shadow-amber-500/25 scale-105 font-black'
                              : diff === 'Hard'
                              ? 'bg-rose-600 text-white border-transparent shadow-md shadow-rose-500/25 scale-105'
                              : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-transparent shadow-md shadow-blue-500/25 scale-105 font-black'
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

            {/* TOP-RIGHT: BATTLE TEAM SIZE SELECTOR */}
            <div className="flex items-center justify-between sm:justify-start gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-neutral-300 shrink-0">
                <Users className="w-4 h-4 text-blue-500" />
                <span>Team size:</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Select Dropdown without Emojis */}
                <div className="relative">
                  <label htmlFor="prime-team-size-select" className="sr-only">
                    Select Team Size
                  </label>
                  <select
                    id="prime-team-size-select"
                    value={teamSize}
                    onChange={(e) => setTeamSize(Number(e.target.value))}
                    className="pl-3 pr-8 py-1.5 rounded-xl bg-slate-100 dark:bg-[#1a182e] border-2 border-blue-500/30 hover:border-blue-500 text-slate-900 dark:text-white font-bold text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/40 transition-all cursor-pointer appearance-none shadow-xs"
                  >
                    {[2, 3, 4, 5, 8].map((size) => (
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

                {/* Quick Select Buttons - strictly 2, 3, 4 only */}
                <div className="flex items-center gap-1.5">
                  {[2, 3, 4].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setTeamSize(size)}
                      className={cn(
                        'py-1.5 px-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border shadow-xs flex items-center gap-1',
                        teamSize === size
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-transparent shadow-md shadow-blue-500/25 scale-105 ring-2 ring-blue-400/40'
                          : 'bg-slate-100 dark:bg-[#1c2033] text-slate-600 dark:text-neutral-400 border-slate-200 dark:border-neutral-800 hover:border-blue-400 hover:scale-102'
                      )}
                    >
                      <span>{size === 2 ? '1v1 (2)' : `${size} Squad`}</span>
                      {teamSize === size && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* FULL WIDTH DIVIDER */}
            <div className="col-span-1 lg:col-span-2 h-px bg-slate-100 dark:bg-neutral-800/80 -my-1" />

            {/* BOTTOM-LEFT: ENTRY STAKE PER PLAYER */}
            <div className="flex items-center justify-between sm:justify-start gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-neutral-300 shrink-0">
                <Coins className="w-4 h-4 text-amber-500" />
                <span>Entry Stake per Player:</span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {[50, 150, 250, 500].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setStakeAmount(amount)}
                    className={cn(
                      'px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border shadow-xs',
                      stakeAmount === amount
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-transparent font-black shadow-md shadow-blue-500/25 scale-105'
                        : 'bg-slate-100 dark:bg-[#1c2033] text-slate-600 dark:text-neutral-400 border-slate-200 dark:border-neutral-800 hover:border-blue-400 hover:scale-102'
                    )}
                  >
                    {amount} 🪙
                  </button>
                ))}

                <div className="relative w-24">
                  <input
                    type="number"
                    min={50}
                    step={10}
                    value={stakeAmount || ''}
                    onChange={(e) => setStakeAmount(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="Custom"
                    className="w-full pl-7 pr-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-[#1c2033] border border-slate-200 dark:border-neutral-800 focus:border-blue-500 text-xs font-mono font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                  />
                  <Coins className="w-3.5 h-3.5 text-amber-500 absolute left-2 top-2.5" />
                </div>
              </div>
            </div>

            {/* BOTTOM-RIGHT: STAKED POT STATS SUMMARY PILL (Directly below Team size!) */}
            <div className="flex items-center justify-start">
              <div className="flex items-center gap-3 p-2 rounded-2xl bg-slate-50 dark:bg-[#0c0d14] border border-slate-200 dark:border-neutral-800 text-xs shrink-0">
                <div className="px-2">
                  <span className="text-[10px] text-slate-400 dark:text-neutral-500 block uppercase font-bold">Staked Pot</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white">{poolBreakdown.gross} 🪙</span>
                </div>
                <div className="w-px h-6 bg-slate-200 dark:bg-neutral-800" />
                <div className="px-2">
                  <span className="text-[10px] text-blue-600 dark:text-cyan-400 block uppercase font-bold">10% Platform Cut</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-cyan-400">-{poolBreakdown.fee} 🪙</span>
                </div>
                <div className="w-px h-6 bg-slate-200 dark:bg-neutral-800" />
                <div className="px-2">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block uppercase font-bold">Net Prize Pool</span>
                  <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">+{poolBreakdown.net} 🪙</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2 MATCH CARDS: QUICK MATCH vs PRIVATE ROOM (SIDE BY SIDE 2-COLUMNS, EXACTLY LIKE NEC BATTLE) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CARD 1: QUICK MATCH (FIND OPPONENT) */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-white via-slate-50 to-blue-50/30 dark:from-[#141724] dark:via-[#161a2c] dark:to-[#121422] border border-cyan-500/30 dark:border-cyan-500/40 shadow-xl space-y-6 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30">
                <Zap className="w-6 h-6 animate-pulse" />
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-mono text-xs font-bold border border-emerald-500/30">
                Instant Match
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Quick match
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-300 leading-relaxed">
                Instantly match with any coder active on the platform. The server pairs you with a challenger and launches the 15-minute duel immediately.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-100/80 dark:bg-[#1a1e30]/80 border border-slate-200 dark:border-neutral-800 text-xs space-y-1.5 font-mono">
              <div className="flex items-center justify-between text-slate-600 dark:text-neutral-300">
                <span>Duel Time Limit:</span>
                <strong className="text-blue-600 dark:text-cyan-400">15:00 Minutes</strong>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-neutral-300">
                <span>Entry Stake per Participant:</span>
                <strong className="text-amber-500 flex items-center gap-1 font-black">{stakeAmount} Coins 🪙</strong>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-neutral-300">
                <span>Winner Net Prize Pool:</span>
                <strong className="text-emerald-500 flex items-center gap-1 font-black">
                  +{poolBreakdown.winners[0]?.coins ?? poolBreakdown.net} Coins 🪙
                </strong>
              </div>
            </div>

            <button
              type="button"
              onClick={handleStartQuickMatch}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 hover:shadow-cyan-500/25 active:scale-98 transition-all cursor-pointer"
            >
              <Swords className="w-4 h-4" />
              <span>Find Live Opponent</span>
            </button>
          </div>

          {/* CARD 2: PRIVATE DUEL ROOM */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-white via-slate-50 to-blue-50/30 dark:from-[#141724] dark:via-[#161d31] dark:to-[#121422] border border-blue-500/30 dark:border-blue-500/40 shadow-xl space-y-6 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                <Users className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-400 font-mono text-xs font-bold border border-blue-500/30">
                Play With Friends
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Private Duel Room
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-300 leading-relaxed">
                Create a private room to invite college friends or enter a 6-digit room code to jump directly into the battle.
              </p>
            </div>

            {/* Problem Selection Mode */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 dark:text-neutral-300">Problem Selection:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setProblemMode('random');
                    setSelectedProblem(null);
                  }}
                  className={cn(
                    'py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer text-center',
                    problemMode === 'random'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-transparent font-black shadow-md shadow-blue-500/25'
                      : 'bg-slate-100 dark:bg-[#1c2033] text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-neutral-800 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400'
                  )}
                >
                  Random problem
                </button>
                <button
                  type="button"
                  onClick={() => setProblemMode('specific')}
                  className={cn(
                    'py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer text-center',
                    problemMode === 'specific'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-transparent font-black shadow-md shadow-blue-500/25'
                      : 'bg-slate-100 dark:bg-[#1c2033] text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-neutral-800 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400'
                  )}
                >
                  Search Problem
                </button>
              </div>

              {/* Problem Search Dropdown */}
              {problemMode === 'specific' && (
                <div className="space-y-2 pt-1 relative" ref={problemDropdownRef}>
                  <div className="relative">
                    <input
                      type="text"
                      value={problemSearchQuery}
                      onChange={handleProblemSearchChange}
                      onFocus={() => {
                        if (searchedProblems.length > 0) setShowProblemDropdown(true);
                      }}
                      placeholder="Search DSA problem by title..."
                      className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0c0d14] border border-slate-200 dark:border-neutral-800 focus:border-indigo-500 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white focus:outline-none transition-all"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    {isSearchingProblems && (
                      <Loader2 className="w-4 h-4 text-indigo-500 animate-spin absolute right-3 top-3" />
                    )}
                  </div>

                  {selectedProblem && (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-500/15 border border-indigo-400/40 text-xs">
                      <div className="flex items-center gap-2">
                        <FileCode className="w-4 h-4 text-indigo-600 dark:text-purple-400" />
                        <span className="font-bold text-slate-900 dark:text-white">{selectedProblem.title}</span>
                        <span
                          className={cn(
                            'text-[10px] font-mono px-1.5 py-0.5 rounded font-bold',
                            selectedProblem.difficulty === 'Easy'
                              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                              : selectedProblem.difficulty === 'Medium'
                              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                              : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                          )}
                        >
                          {selectedProblem.difficulty}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedProblem(null)}
                        className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {showProblemDropdown && searchedProblems.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-30 mt-1 max-h-48 overflow-y-auto rounded-2xl bg-white dark:bg-[#141724] border border-slate-200 dark:border-neutral-800 shadow-xl divide-y divide-slate-100 dark:divide-neutral-800">
                      {searchedProblems.map((prob) => (
                        <button
                          key={prob.id || prob.slug}
                          type="button"
                          onClick={() => {
                            setSelectedProblem(prob);
                            setProblemSearchQuery(prob.title);
                            setShowProblemDropdown(false);
                          }}
                          className="w-full px-3.5 py-2 text-left flex items-center justify-between hover:bg-blue-50 dark:hover:bg-[#1a1e30] transition-colors"
                        >
                          <span className="text-xs font-semibold text-slate-900 dark:text-white">{prob.title}</span>
                          <span
                            className={cn(
                              'text-[10px] font-mono px-1.5 py-0.5 rounded',
                              prob.difficulty === 'Easy'
                                ? 'bg-emerald-500/20 text-emerald-600'
                                : prob.difficulty === 'Medium'
                                ? 'bg-amber-500/20 text-amber-600'
                                : 'bg-rose-500/20 text-rose-600'
                            )}
                          >
                            {prob.difficulty}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Generate Room Code Action */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleCreateRoom}
                disabled={isCreatingRoom}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-blue-600/30 hover:shadow-cyan-500/25 cursor-pointer disabled:opacity-50 active:scale-98"
              >
                {isCreatingRoom ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>Generate room code</span>
              </button>

              {createdRoomCode && (
                <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-[#161d31] border border-blue-400/40 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 dark:text-neutral-400 font-bold">Room Code:</span>
                      <span className="font-mono font-black text-sm text-blue-600 dark:text-blue-400 tracking-wider">
                        {createdRoomCode}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#141724] border border-slate-200 dark:border-neutral-700 text-xs font-bold text-slate-700 dark:text-neutral-200 hover:border-blue-400 flex items-center gap-1 transition-all cursor-pointer"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsShareModalOpen(true)}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1 shadow-sm shadow-blue-500/25 transition-all cursor-pointer active:scale-95"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share</span>
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/practice/prime-duels/${createdRoomCode}`)}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/25 transition-all active:scale-98"
                  >
                    <span>Enter Room Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Join Code Input Form */}
            <div className="pt-3 border-t border-slate-100 dark:border-neutral-800 space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-neutral-300 block">
                Have a friend's room code?
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. PRIME882"
                  maxLength={16}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0c0d14] border border-slate-200 dark:border-neutral-800 focus:border-blue-500 text-xs font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider placeholder:text-slate-400 focus:bg-white focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={handleJoinRoom}
                  disabled={isJoining || !joinCodeInput.trim()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white font-black text-xs flex items-center gap-1.5 transition-all disabled:opacity-50 shadow-md shadow-blue-500/25 cursor-pointer shrink-0 active:scale-95"
                >
                  {isJoining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  <span>Stake & Join</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3. HOW LIVE DUELS WORK (RULES BREAKDOWN - EXACT MATCH TO NEC BATTLE) */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#141724] border border-slate-200 dark:border-neutral-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg flex items-center gap-2">
              <Timer className="w-5 h-5 text-cyan-500" />
              <span>Official Code Duel Rules & Mechanics</span>
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
                Staked Synchronized Start
              </span>
              <p>Each coder locks in their coin stake. Everyone receives the exact same challenge with a synchronized 15:00 clock.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#181b2a] border border-slate-200 dark:border-neutral-800 space-y-1.5">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-mono flex items-center justify-center text-[10px]">2</span>
                Real-Time Opponent Radar
              </span>
              <p>Watch opponent test cases passed live without seeing their raw code. Every second counts in high-stakes duels.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#181b2a] border border-slate-200 dark:border-neutral-800 space-y-1.5">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-mono flex items-center justify-center text-[10px]">3</span>
                90% Net Pot Distribution
              </span>
              <p>Platform takes a flat 10% fee. The entire remaining 90% net prize pool is instantly paid to the top finishers!</p>
            </div>
          </div>
        </div>

        {/* 3. YOUR RECENT CODE BATTLES (LAST 5 SHOWDOWNS) */}
        {primeStats?.recentDuels && primeStats.recentDuels.length > 0 && (
          <div className="p-6 rounded-3xl bg-white dark:bg-[#141724] border border-slate-200 dark:border-neutral-800 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Your Recent Code Battles</span>
            </h3>

            <div className="divide-y divide-slate-100 dark:divide-neutral-800">
              {primeStats.recentDuels.slice(0, 5).map((duel: any) => (
                <div key={duel.id} className="py-3 flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full font-mono font-bold text-[10px]',
                        duel.isWinner
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                      )}
                    >
                      {duel.isWinner ? 'VICTORY' : 'DEFEAT'}
                    </span>
                    <div>
                      <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 mr-2">
                        {duel.roomCode}
                      </span>
                      <strong className="text-slate-900 dark:text-white">{duel.problemTitle}</strong>
                      <span className="text-[11px] text-slate-500 dark:text-neutral-400 ml-2">
                        • Staked: {duel.entryFee} 🪙 • Pot: {duel.totalPot} 🪙
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 font-mono text-slate-500 dark:text-neutral-400">
                    <span className="text-[11px]">{new Date(duel.date).toLocaleDateString()}</span>
                    {duel.isWinner && (
                      <span className="text-amber-500 font-bold flex items-center gap-1">
                        +{duel.coinsAwarded} 🪙
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Live Matchmaking Pop Up Screen (Modal) */}
      <AnimatePresence>
        {isQuickMatching && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative max-w-md w-full p-6 sm:p-8 rounded-3xl bg-white dark:bg-stone-900 border-2 border-blue-500/40 shadow-2xl shadow-blue-500/20 text-center space-y-5 overflow-hidden"
            >
              {/* Glowing decorative backdrop orbs */}
              <div className="absolute -top-16 -left-16 w-44 h-44 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 -right-16 w-44 h-44 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

              {/* Close Button Top Right */}
              <button
                type="button"
                onClick={handleCancelQuickMatch}
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-stone-800 transition-all cursor-pointer"
                title="Cancel & Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Radar Pulsing Rings Animation */}
              <div className="relative w-28 h-28 mx-auto flex items-center justify-center pt-2">
                <motion.div
                  animate={{ scale: [1, 2.2], opacity: [0.7, 0] }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: 'easeOut' }}
                  className="absolute inset-0 rounded-full border-2 border-blue-500"
                />
                <motion.div
                  animate={{ scale: [1, 2.7], opacity: [0.4, 0] }}
                  transition={{ repeat: Infinity, duration: 2.2, delay: 0.7, ease: 'easeOut' }}
                  className="absolute inset-0 rounded-full border border-cyan-400"
                />
                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-xl shadow-blue-500/40">
                  <Swords className="w-8 h-8 animate-pulse text-white" />
                </div>
              </div>

              {/* Live Matchmaking Status Badge */}
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 text-blue-700 dark:text-cyan-300 font-mono text-[11px] font-extrabold uppercase border border-blue-500/30">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                  <span>Searching Live Arena</span>
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Searching for Opponent...
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xs mx-auto">
                  Matching you with an active developer of similar DSA rating in high-stakes Prime Battle.
                </p>
              </div>

              {/* Match Parameters Summary Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 grid grid-cols-3 divide-x divide-slate-200 dark:divide-stone-800 text-center text-xs">
                <div className="px-2">
                  <div className="text-[10.5px] text-slate-500 dark:text-slate-400 font-bold">Difficulty</div>
                  <div className="font-black text-blue-600 dark:text-cyan-400 mt-0.5">{selectedDifficulty}</div>
                </div>
                <div className="px-2">
                  <div className="text-[10.5px] text-slate-500 dark:text-slate-400 font-bold">Staked</div>
                  <div className="font-black text-amber-600 dark:text-amber-400 mt-0.5 flex items-center justify-center gap-0.5">
                    <Coins className="w-3 h-3" />
                    <span>{stakeAmount} 🪙</span>
                  </div>
                </div>
                <div className="px-2">
                  <div className="text-[10.5px] text-slate-500 dark:text-slate-400 font-bold">Time Elapsed</div>
                  <div className="font-mono font-black text-blue-600 dark:text-cyan-400 mt-0.5">{matchmakingTime}s / 30s</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 dark:bg-stone-800 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-600"
                  style={{ width: `${Math.min(100, (matchmakingTime / 30) * 100)}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* 100% Refund Guarantee Badge & Cancel Button */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleCancelQuickMatch}
                  className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-stone-700 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer hover:border-blue-400"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel Match & 100% Refund ({stakeAmount} 🪙)</span>
                </button>
                <div className="flex items-center justify-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>100% refund guarantee if no opponent matches in 30s</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Matchmaking Timeout Modal with AI Summon */}
      <AnimatePresence>
        {showTimeoutModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-md w-full p-6 rounded-3xl bg-white dark:bg-stone-900 border border-blue-400/40 dark:border-blue-500/40 shadow-2xl text-center space-y-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-500/20 text-blue-600 dark:text-cyan-400 flex items-center justify-center mx-auto">
                <Bot className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">No Opponent Found in Time</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                All players seem to be busy coding! You can summon the <strong>NEC Prime Grandmaster Bot</strong> to duel right now, or cancel to receive an instant <strong>100% refund</strong> of your staked coins.
              </p>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleJoinAi}
                  disabled={isJoiningAi}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-600/25 cursor-pointer"
                >
                  {isJoiningAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                  <span>Duel NEC Grandmaster AI Bot</span>
                </button>

                <button
                  type="button"
                  onClick={handleCancelQuickMatch}
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel & 100% Refund ({stakeAmount} 🪙)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Prime Rulebook Modal */}
      <PrimeDuelRulebookModal isOpen={isRulebookOpen} onClose={() => setIsRulebookOpen(false)} />

      {/* Duel Room Share Modal */}
      <DuelShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        roomCode={createdRoomCode || ''}
        groupSize={teamSize}
        problemTitle={selectedProblem?.title}
        difficulty={selectedProblem?.difficulty || selectedDifficulty}
        isStaked={true}
        stakeAmount={stakeAmount}
      />
    </div>
  );
};
