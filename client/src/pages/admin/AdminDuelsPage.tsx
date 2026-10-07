import React, { useState, useEffect } from 'react';
import {
  Swords,
  Trophy,
  Coins,
  Search,
  Filter,
  RefreshCw,
  Eye,
  AlertTriangle,
  Trash2,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  Clock,
  Settings,
  Save,
  StopCircle,
  FileText,
  Zap,
  Users,
  ShieldAlert,
} from 'lucide-react';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../components/ui/Toast';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import {
  adminDuelService,
  AdminDuelItem,
  AdminDuelMetrics,
  AdminDuelSettings,
} from '../../services/adminDuel.service';
import { cn } from '../../utils/cn';

export const AdminDuelsPage: React.FC = () => {
  useDocumentTitle('1vs1 Code Duels — NextEra Admin');
  const { success, error: toastError, info } = useToast();

  // Active Main Tab: 'duels' | 'settings'
  const [activeTab, setActiveTab] = useState<'duels' | 'settings'>('duels');

  // Duels List & Metrics State
  const [duels, setDuels] = useState<AdminDuelItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [metrics, setMetrics] = useState<AdminDuelMetrics>({
    totalDuels: 0,
    inProgressDuels: 0,
    waitingDuels: 0,
    completedDuels: 0,
    timedOutDuels: 0,
    cancelledDuels: 0,
    totalCoinsAwarded: 0,
  });

  // Filters & Pagination
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);

  // Copied code feedback
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Inspect Modal State
  const [inspectDuel, setInspectDuel] = useState<AdminDuelItem | null>(null);
  const [inspectTab, setInspectTab] = useState<'player1' | 'player2' | 'problem'>('player1');

  // Cancel Duel Modal State
  const [duelToCancel, setDuelToCancel] = useState<AdminDuelItem | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('Terminated by administrator');
  const [cancelling, setCancelling] = useState<boolean>(false);

  // Delete Duel Modal State
  const [duelToDelete, setDuelToDelete] = useState<AdminDuelItem | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  // Settings State
  const [settingsLoading, setSettingsLoading] = useState<boolean>(false);
  const [settingsSaving, setSettingsSaving] = useState<boolean>(false);
  const [settings, setSettings] = useState<AdminDuelSettings>({
    coinsReward: 50,
    durationSeconds: 900,
    isEnabled: true,
    maxParticipantsPerRoom: 4,
  });

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch duels on filter/page change
  useEffect(() => {
    if (activeTab === 'duels') {
      fetchDuels(currentPage);
    } else {
      fetchSettings();
    }
  }, [activeTab, statusFilter, difficultyFilter, debouncedSearch, currentPage]);

  const fetchDuels = async (page = 1) => {
    try {
      setLoading(true);
      const res = await adminDuelService.getDuels({
        page,
        limit: 15,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        difficulty: difficultyFilter !== 'all' ? difficultyFilter : undefined,
        search: debouncedSearch || undefined,
      });

      setDuels(res.duels || []);
      setMetrics(res.metrics || metrics);
      setCurrentPage(res.pagination.page);
      setTotalPages(res.pagination.totalPages);
      setTotalItems(res.pagination.total);
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to load duels data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      setSettingsLoading(true);
      const data = await adminDuelService.getSettings();
      setSettings(data);
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to fetch duel settings');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSettingsSaving(true);
      const updated = await adminDuelService.updateSettings(settings);
      setSettings(updated);
      success('Code Duel configuration updated successfully!');
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to update duel settings');
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    success(`Copied room code "${code}" to clipboard`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleConfirmCancel = async () => {
    if (!duelToCancel) return;
    try {
      setCancelling(true);
      await adminDuelService.cancelDuel(duelToCancel._id, cancelReason);
      success(`Duel room ${duelToCancel.roomCode} has been cancelled.`);
      setDuelToCancel(null);
      fetchDuels(currentPage);
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to cancel duel');
    } finally {
      setCancelling(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!duelToDelete) return;
    try {
      setDeleting(true);
      await adminDuelService.deleteDuel(duelToDelete._id);
      success(`Duel record ${duelToDelete.roomCode} permanently deleted.`);
      setDuelToDelete(null);
      fetchDuels(currentPage);
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to delete duel');
    } finally {
      setDeleting(false);
    }
  };

  const handleOverrideAntiCheat = async (
    duelId: string,
    player: any,
    status: 'clean' | 'suspicious' | 'flagged' | 'disqualified'
  ) => {
    try {
      const playerId = typeof player.userId === 'object' ? (player.userId._id || player.userId.id) : player.userId;
      await adminDuelService.overridePlayerAntiCheat(
        duelId,
        playerId,
        status,
        `Admin manual verdict override to ${status}`
      );
      success(`Player anti-cheat verdict updated to ${status.toUpperCase()}!`);
      if (inspectDuel && inspectDuel._id === duelId) {
        const updatedPlayers = inspectDuel.players.map((p) => {
          const pId = typeof p.userId === 'object' ? (p.userId._id || p.userId.id) : p.userId;
          if (pId === playerId) {
            return {
              ...p,
              antiCheat: {
                ...(p.antiCheat || { tabSwitchesCount: 0, pasteCount: 0, timeTakenSeconds: 0, logs: [] }),
                status,
                reason: `Admin manual override to ${status}`,
                adminOverridden: true,
              },
            };
          }
          return p;
        });
        setInspectDuel({ ...inspectDuel, players: updatedPlayers });
      }
      fetchDuels(currentPage);
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to update anti-cheat status');
    }
  };
  void handleOverrideAntiCheat;

  // Helper: format duration mm:ss
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs > 0 ? `${secs}s` : ''}`;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* 1. PAGE HEADER */}
      <AdminPageHeader
        title="1vs1 Live Coding Battles (Code Duels)"
        description="Monitor real-time algorithmic duels, inspect submitted solutions, supervise active match lobbies, and manage platform battle stakes."
        action={
          <button
            onClick={() => (activeTab === 'duels' ? fetchDuels(currentPage) : fetchSettings())}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 shadow-xs cursor-pointer transition-colors"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading || settingsLoading ? 'animate-spin' : '')} />
            <span>Refresh Data</span>
          </button>
        }
      />

      {/* 2. KPI METRICS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Metric 1: Total Duels */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Total Matches</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Swords className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            {metrics.totalDuels}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            All-time duels registered
          </div>
        </div>

        {/* Metric 2: Live In-Progress */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-emerald-500/30 dark:border-emerald-500/20 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Live In-Progress
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            {metrics.inProgressDuels}
          </div>
          <div className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-1 font-medium">
            Active battles right now
          </div>
        </div>

        {/* Metric 3: Waiting Rooms */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-amber-500/30 dark:border-amber-500/20 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Waiting Lobbies
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
            {metrics.waitingDuels}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Awaiting 2nd contestant
          </div>
        </div>

        {/* Metric 4: Completed Battles */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Completed</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            {metrics.completedDuels}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Finished with a victor
          </div>
        </div>

        {/* Metric 5: Total Coins Awarded */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-amber-500/30 dark:border-amber-500/20 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Bounty Distributed</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-amber-500 flex items-center gap-1">
            <span>+{metrics.totalCoinsAwarded}</span>
            <Coins className="w-4 h-4" />
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Coins won in battles
          </div>
        </div>
      </div>

      {/* 3. TABS NAVIGATION */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-4">
        <button
          onClick={() => setActiveTab('duels')}
          className={cn(
            'pb-3 px-1 text-sm font-bold flex items-center gap-2 border-b-2 cursor-pointer transition-all',
            activeTab === 'duels'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          )}
        >
          <Swords className="w-4 h-4" />
          <span>Live Battles & History</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {metrics.totalDuels}
          </span>
          {metrics.inProgressDuels > 0 && (
            <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/30">
              {metrics.inProgressDuels} Live
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={cn(
            'pb-3 px-1 text-sm font-bold flex items-center gap-2 border-b-2 cursor-pointer transition-all',
            activeTab === 'settings'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          )}
        >
          <Settings className="w-4 h-4" />
          <span>Duel Settings & Governance</span>
        </button>
      </div>

      {/* 4. TAB 1: DUELS LIST & MONITOR */}
      {activeTab === 'duels' && (
        <div className="space-y-4">
          {/* SEARCH & FILTER BAR */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search room code, problem, or student..."
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              />
            </div>

            {/* Status & Difficulty Filters */}
            <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto justify-end">
              {/* Status Select */}
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <Filter className="w-3.5 h-3.5" />
                <span>Status:</span>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="in-progress">In-Progress (Live ⚔️)</option>
                <option value="waiting">Waiting Lobbies</option>
                <option value="completed">Completed</option>
                <option value="timed-out">Timed-Out</option>
                <option value="cancelled">Cancelled</option>
              </select>

              {/* Difficulty Select */}
              <select
                value={difficultyFilter}
                onChange={(e) => {
                  setDifficultyFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="all">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          {/* DUELS DATA TABLE */}
          <div className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none">
                  <tr>
                    <th className="px-4 py-3.5">Room Code</th>
                    <th className="px-4 py-3.5">Problem</th>
                    <th className="px-4 py-3.5">Competitors (Player 1 vs Player 2)</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Winner / Result</th>
                    <th className="px-4 py-3.5">Date & Stake</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
                        <span>Loading duel battles...</span>
                      </td>
                    </tr>
                  ) : duels.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                        <Swords className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                        <span className="font-semibold block text-slate-700 dark:text-slate-300">
                          No Code Duels Found
                        </span>
                        <span className="text-xs">Try adjusting your search query or status filter.</span>
                      </td>
                    </tr>
                  ) : (
                    duels.map((duel) => {
                      const p1 = duel.players[0];
                      const p2 = duel.players[1];
                      const isWinner = (winnerIdStr?: string) =>
                        winnerIdStr && duel.winnerId && duel.winnerId.toString() === winnerIdStr;

                      return (
                        <tr
                          key={duel._id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          {/* Room Code */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-xs text-slate-900 dark:text-white px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60">
                                {duel.roomCode}
                              </span>
                              <button
                                onClick={() => handleCopy(duel.roomCode)}
                                title="Copy Room Code"
                                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                              >
                                {copiedCode === duel.roomCode ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                            {duel.isPrivate && (
                              <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 block mt-0.5">
                                • Private Match
                              </span>
                            )}
                          </td>

                          {/* Problem Title & Difficulty */}
                          <td className="px-4 py-3.5 max-w-[200px]">
                            <span className="font-bold text-slate-900 dark:text-white block truncate">
                              {duel.problemTitle}
                            </span>
                            <span
                              className={cn(
                                'inline-block px-1.5 py-0.2 rounded-md font-mono text-[10px] font-bold mt-0.5 border',
                                duel.difficulty === 'Easy'
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                  : duel.difficulty === 'Medium'
                                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                              )}
                            >
                              {duel.difficulty}
                            </span>
                          </td>

                          {/* Competitors (P1 vs P2) */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              {/* Player 1 */}
                              {p1 ? (
                                <div className="flex items-center gap-1.5 max-w-[140px]">
                                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                                    {p1.name.charAt(0)}
                                  </div>
                                  <div className="min-w-0">
                                    <span className="font-semibold text-xs text-slate-900 dark:text-white block truncate">
                                      {p1.name}
                                    </span>
                                    <span className="font-mono text-[10px] text-cyan-600 dark:text-cyan-400 block">
                                      {p1.testCasesPassed}/{p1.totalTestCases || 3} tests
                                    </span>
                                    {p1.antiCheat && (
                                      <span
                                        className={cn(
                                          'px-1.5 py-0.2 rounded text-[9px] font-mono font-bold inline-flex items-center gap-0.5 mt-0.5 border',
                                          p1.antiCheat.status === 'clean'
                                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                            : p1.antiCheat.status === 'suspicious'
                                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                            : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                                        )}
                                        title={`${p1.antiCheat.tabSwitchesCount} tab switches, ${p1.antiCheat.pasteCount} pastes, ${p1.antiCheat.timeTakenSeconds}s`}
                                      >
                                        🛡️ {p1.antiCheat.tabSwitchesCount} sw • {p1.antiCheat.timeTakenSeconds}s
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-400 text-xs italic">Waiting</span>
                              )}

                              <span className="text-[10px] font-mono font-black text-slate-400 px-1">
                                VS
                              </span>

                              {/* Player 2 */}
                              {p2 ? (
                                <div className="flex items-center gap-1.5 max-w-[140px]">
                                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                                    {p2.name.charAt(0)}
                                  </div>
                                  <div className="min-w-0">
                                    <span className="font-semibold text-xs text-slate-900 dark:text-white block truncate">
                                      {p2.name}
                                    </span>
                                    <span className="font-mono text-[10px] text-purple-600 dark:text-purple-400 block">
                                      {p2.testCasesPassed}/{p2.totalTestCases || 3} tests
                                    </span>
                                    {p2.antiCheat && (
                                      <span
                                        className={cn(
                                          'px-1.5 py-0.2 rounded text-[9px] font-mono font-bold inline-flex items-center gap-0.5 mt-0.5 border',
                                          p2.antiCheat.status === 'clean'
                                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                            : p2.antiCheat.status === 'suspicious'
                                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                            : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                                        )}
                                        title={`${p2.antiCheat.tabSwitchesCount} tab switches, ${p2.antiCheat.pasteCount} pastes, ${p2.antiCheat.timeTakenSeconds}s`}
                                      >
                                        🛡️ {p2.antiCheat.tabSwitchesCount} sw • {p2.antiCheat.timeTakenSeconds}s
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-amber-500 font-mono text-[11px] italic">
                                  Waiting for Player 2...
                                </span>
                              )}

                              {duel.players.length > 2 && (
                                <span className="px-1.5 py-0.5 rounded-md font-mono text-[9px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
                                  +{duel.players.length - 2} more
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3.5">
                            {duel.status === 'in-progress' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                                IN-PROGRESS
                              </span>
                            ) : duel.status === 'waiting' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                WAITING
                              </span>
                            ) : duel.status === 'completed' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                                <CheckCircle2 className="w-3 h-3" />
                                COMPLETED
                              </span>
                            ) : duel.status === 'timed-out' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30">
                                <Clock className="w-3 h-3" />
                                TIMED-OUT
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                                <XCircle className="w-3 h-3" />
                                CANCELLED
                              </span>
                            )}
                          </td>

                          {/* Winner / Result */}
                          <td className="px-4 py-3.5">
                            {duel.status === 'completed' ? (
                              <div>
                                <span className="font-bold text-amber-500 flex items-center gap-1">
                                  <Trophy className="w-3.5 h-3.5" />
                                  <span>
                                    {typeof duel.winnerId === 'object' && duel.winnerId
                                      ? duel.winnerId.name
                                      : p1 && isWinner(p1.userId.toString())
                                      ? p1.name
                                      : p2 && isWinner(p2.userId.toString())
                                      ? p2.name
                                      : 'Victor'}
                                  </span>
                                </span>
                                <span className="text-[10px] font-mono text-slate-400 block">
                                  {duel.winningReason === 'solved_first'
                                    ? '100% Solved First'
                                    : duel.winningReason === 'most_test_cases'
                                    ? 'Most Test Cases'
                                    : 'Opponent Forfeit'}
                                </span>
                              </div>
                            ) : duel.status === 'timed-out' ? (
                              <span className="font-mono text-slate-500 text-xs">
                                {duel.winnerId ? 'Decided by Tests' : 'Draw'}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs font-mono">—</span>
                            )}
                          </td>

                          {/* Date & Stake */}
                          <td className="px-4 py-3.5 font-mono text-[11px]">
                            <div className="text-slate-700 dark:text-slate-300 font-semibold">
                              {new Date(duel.createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </div>
                            <div className="text-amber-500 font-bold flex items-center gap-0.5">
                              <span>+{duel.coinsReward}</span>
                              <Coins className="w-3 h-3" />
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Inspect Code Button */}
                              <button
                                onClick={() => setInspectDuel(duel)}
                                title="Inspect Match & Code Submissions"
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Force Cancel (Enabled for waiting or in-progress) */}
                              {duel.status === 'in-progress' || duel.status === 'waiting' ? (
                                <button
                                  onClick={() => setDuelToCancel(duel)}
                                  title="Force Terminate / Cancel Battle"
                                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                                >
                                  <StopCircle className="w-3.5 h-3.5" />
                                </button>
                              ) : null}

                              {/* Delete Duel Record */}
                              <button
                                onClick={() => setDuelToDelete(duel)}
                                title="Delete Duel Record"
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 dark:bg-slate-800 dark:hover:bg-rose-950/50 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION BAR */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 font-mono">
                <div>
                  Showing page {currentPage} of {totalPages} ({totalItems} duels)
                </div>
                <div className="flex items-center gap-1">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    Prev
                  </button>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. TAB 2: DUEL SETTINGS & GOVERNANCE */}
      {activeTab === 'settings' && (
        <div className="max-w-3xl space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-amber-500" />
                <span>1vs1 Code Duel Parameters & Rewards</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Configure standard match duration, winning coin bounty, and global availability of the 1vs1 Live Coding Arena.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-5">
              {/* Setting 1: Coins Reward */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-500" />
                  <span>Winner Bounty (Coins Awarded per Victory 🪙)</span>
                </label>
                <input
                  type="number"
                  min={0}
                  max={1000}
                  value={settings.coinsReward}
                  onChange={(e) =>
                    setSettings({ ...settings, coinsReward: parseInt(e.target.value) || 0 })
                  }
                  className="w-full max-w-sm px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-amber-500"
                />
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  Automatically credited to the winning participant's wallet upon passing all test cases.
                </span>
              </div>

              {/* Setting 2: Duration in Seconds */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span>Battle Duration (Minutes)</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={2}
                    max={60}
                    value={Math.round(settings.durationSeconds / 60)}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        durationSeconds: (parseInt(e.target.value) || 15) * 60,
                      })
                    }
                    className="w-32 px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-xs font-mono text-slate-500">
                    = {settings.durationSeconds} seconds ({formatDuration(settings.durationSeconds)})
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  Standard countdown timer synchronised between both coders.
                </span>
              </div>

              {/* Setting 3: Max Candidates Per Room */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-500" />
                  <span>Max Candidates Per Room (Group Battle Cap)</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={2}
                    max={10}
                    value={settings.maxParticipantsPerRoom ?? 4}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        maxParticipantsPerRoom: Math.min(10, Math.max(2, parseInt(e.target.value) || 2)),
                      })
                    }
                    className="w-32 px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-xs font-mono text-slate-500">
                    Max: {settings.maxParticipantsPerRoom ?? 4} candidates per battle room
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  Governs the maximum number of students who can join and compete together in a single battle room (e.g., 2 for 1vs1 duels, 3 for tri-duels, 4-5 for friend groups).
                </span>
              </div>

              {/* Setting 4: Feature Active Switch */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 cursor-pointer">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Enable 1vs1 Code Duels
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      When disabled, students cannot create or queue up for new duels (useful during platform maintenance).
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.isEnabled}
                    onChange={(e) => setSettings({ ...settings, isEnabled: e.target.checked })}
                    className="w-5 h-5 text-amber-500 rounded-md border-slate-300 focus:ring-amber-500 cursor-pointer"
                  />
                </label>
              </div>

              {/* Submit Button */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={settingsSaving}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>{settingsSaving ? 'Saving Configurations...' : 'Save Configuration'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSettings({ coinsReward: 50, durationSeconds: 900, isEnabled: true });
                    info('Reset form to system defaults (50 coins, 15 minutes)');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-all cursor-pointer"
                >
                  Reset Defaults
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. INSPECT CODE SUBMISSION MODAL */}
      {inspectDuel && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold">
                  <Swords className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Duel Inspection:</span>
                    <span className="font-mono text-cyan-600 dark:text-cyan-400">
                      {inspectDuel.roomCode}
                    </span>
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {inspectDuel.problemTitle} ({inspectDuel.difficulty})
                  </span>
                </div>
              </div>

              <button
                onClick={() => setInspectDuel(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Subtabs (Player 1 Code vs Player 2 Code vs Problem Statement) */}
            <div className="px-6 pt-3 bg-slate-50/50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 text-xs font-mono font-bold">
              <button
                onClick={() => setInspectTab('player1')}
                className={cn(
                  'pb-2.5 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5',
                  inspectTab === 'player1'
                    ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
                )}
              >
                <span>Player 1: {inspectDuel.players[0]?.name || 'Player 1'}</span>
                <span className="text-[10px] px-1 rounded bg-slate-200 dark:bg-slate-800">
                  {inspectDuel.players[0]?.testCasesPassed || 0}/
                  {inspectDuel.players[0]?.totalTestCases || 3}
                </span>
              </button>

              <button
                onClick={() => setInspectTab('player2')}
                className={cn(
                  'pb-2.5 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5',
                  inspectTab === 'player2'
                    ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
                )}
              >
                <span>Player 2: {inspectDuel.players[1]?.name || 'Player 2'}</span>
                <span className="text-[10px] px-1 rounded bg-slate-200 dark:bg-slate-800">
                  {inspectDuel.players[1]?.testCasesPassed || 0}/
                  {inspectDuel.players[1]?.totalTestCases || 3}
                </span>
              </button>

              <button
                onClick={() => setInspectTab('problem')}
                className={cn(
                  'pb-2.5 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5',
                  inspectTab === 'problem'
                    ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
                )}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Problem Statement</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* PLAYER 1 CODE INSPECTION */}
              {inspectTab === 'player1' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-mono">
                    <div>
                      <strong className="text-slate-900 dark:text-white">
                        {inspectDuel.players[0]?.name}
                      </strong>
                      <span className="text-slate-500 ml-2">
                        ({inspectDuel.players[0]?.college || 'Student'})
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span>Language: <strong>{inspectDuel.players[0]?.submittedLanguage || 'N/A'}</strong></span>
                      <span>Passed: <strong>{inspectDuel.players[0]?.testCasesPassed || 0}/{inspectDuel.players[0]?.totalTestCases || 3}</strong></span>
                      {inspectDuel.players[0]?.executionTime ? (
                        <span>Time: <strong>{inspectDuel.players[0]?.executionTime}ms</strong></span>
                      ) : null}
                    </div>
                  </div>

                  {/* ANTI-CHEAT TELEMETRY & PLAYBACK CARD FOR PLAYER 1 */}
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-amber-400" />
                        <span className="font-bold text-xs text-white">Anti-Cheat Playback & Telemetry</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border",
                          inspectDuel.players[0]?.antiCheat?.status === 'flagged' || inspectDuel.players[0]?.antiCheat?.status === 'disqualified'
                            ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                            : inspectDuel.players[0]?.antiCheat?.status === 'suspicious'
                            ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                            : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        )}>
                          {inspectDuel.players[0]?.antiCheat?.status || 'clean'}
                        </span>
                        {inspectDuel.players[0]?.antiCheat?.adminOverridden && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-cyan-500/20 text-cyan-300 font-mono">
                            Admin Overridden
                          </span>
                        )}
                      </div>

                      {/* Admin Override Action Buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOverrideAntiCheat(inspectDuel._id, inspectDuel.players[0], 'clean')}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition-all cursor-pointer"
                          title="Override to Clean"
                        >
                          Mark Clean
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOverrideAntiCheat(inspectDuel._id, inspectDuel.players[0], 'suspicious')}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 transition-all cursor-pointer"
                          title="Override to Suspicious"
                        >
                          Flag Suspicious
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOverrideAntiCheat(inspectDuel._id, inspectDuel.players[0], 'disqualified')}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 transition-all cursor-pointer"
                          title="Disqualify for plagiarism/cheating"
                        >
                          Disqualify
                        </button>
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                      <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/80">
                        <span className="text-[10px] text-slate-400 block">Seconds Taken</span>
                        <strong className="text-white text-sm">{inspectDuel.players[0]?.antiCheat?.timeTakenSeconds ?? 0}s</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/80">
                        <span className="text-[10px] text-slate-400 block">Tab Switches</span>
                        <strong className={cn("text-sm", (inspectDuel.players[0]?.antiCheat?.tabSwitchesCount ?? 0) > 0 ? "text-amber-400" : "text-emerald-400")}>
                          {inspectDuel.players[0]?.antiCheat?.tabSwitchesCount ?? 0}
                        </strong>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/80">
                        <span className="text-[10px] text-slate-400 block">Code Pastes</span>
                        <strong className={cn("text-sm", (inspectDuel.players[0]?.antiCheat?.pasteCount ?? 0) > 0 ? "text-amber-400" : "text-emerald-400")}>
                          {inspectDuel.players[0]?.antiCheat?.pasteCount ?? 0}
                        </strong>
                      </div>
                    </div>

                    {/* Event Playback Timeline */}
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 max-h-32 overflow-y-auto space-y-1">
                      <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block mb-1">Telemetry Event Timeline</span>
                      {inspectDuel.players[0]?.antiCheat?.logs && inspectDuel.players[0].antiCheat.logs.length > 0 ? (
                        inspectDuel.players[0].antiCheat.logs.map((log: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between text-[11px] font-mono text-slate-300">
                            <span className="text-slate-500 shrink-0 mr-2">{log.timestamp}</span>
                            <span className="truncate">{log.details}</span>
                            <span className={cn(
                              "ml-2 px-1.5 py-0.2 rounded text-[9px] uppercase font-bold shrink-0",
                              log.eventType === 'paste' ? 'bg-amber-500/20 text-amber-300' :
                              log.eventType === 'tab_hidden' ? 'bg-rose-500/20 text-rose-300' :
                              'bg-slate-800 text-slate-400'
                            )}>
                              {log.eventType}
                            </span>
                          </div>
                        ))
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">No abnormal events recorded during this session.</span>
                      )}
                    </div>
                  </div>

                  {inspectDuel.players[0]?.submittedCode ? (
                    <div className="p-4 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed select-text">
                      <pre>{inspectDuel.players[0].submittedCode}</pre>
                    </div>
                  ) : (
                    <div className="p-12 text-center text-slate-400 italic bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800">
                      No code submitted yet by Player 1.
                    </div>
                  )}
                </div>
              )}

              {/* PLAYER 2 CODE INSPECTION */}
              {inspectTab === 'player2' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-mono">
                    <div>
                      <strong className="text-slate-900 dark:text-white">
                        {inspectDuel.players[1]?.name || 'Player 2'}
                      </strong>
                      <span className="text-slate-500 ml-2">
                        ({inspectDuel.players[1]?.college || 'Awaiting connection'})
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span>Language: <strong>{inspectDuel.players[1]?.submittedLanguage || 'N/A'}</strong></span>
                      <span>Passed: <strong>{inspectDuel.players[1]?.testCasesPassed || 0}/{inspectDuel.players[1]?.totalTestCases || 3}</strong></span>
                      {inspectDuel.players[1]?.executionTime ? (
                        <span>Time: <strong>{inspectDuel.players[1]?.executionTime}ms</strong></span>
                      ) : null}
                    </div>
                  </div>

                  {/* ANTI-CHEAT TELEMETRY & PLAYBACK CARD FOR PLAYER 2 */}
                  {inspectDuel.players[1] && (
                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-amber-400" />
                          <span className="font-bold text-xs text-white">Anti-Cheat Playback & Telemetry</span>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border",
                            inspectDuel.players[1]?.antiCheat?.status === 'flagged' || inspectDuel.players[1]?.antiCheat?.status === 'disqualified'
                              ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                              : inspectDuel.players[1]?.antiCheat?.status === 'suspicious'
                              ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                              : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          )}>
                            {inspectDuel.players[1]?.antiCheat?.status || 'clean'}
                          </span>
                          {inspectDuel.players[1]?.antiCheat?.adminOverridden && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-cyan-500/20 text-cyan-300 font-mono">
                              Admin Overridden
                            </span>
                          )}
                        </div>

                        {/* Admin Override Action Buttons */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOverrideAntiCheat(inspectDuel._id, inspectDuel.players[1], 'clean')}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition-all cursor-pointer"
                            title="Override to Clean"
                          >
                            Mark Clean
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOverrideAntiCheat(inspectDuel._id, inspectDuel.players[1], 'suspicious')}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 transition-all cursor-pointer"
                            title="Override to Suspicious"
                          >
                            Flag Suspicious
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOverrideAntiCheat(inspectDuel._id, inspectDuel.players[1], 'disqualified')}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 transition-all cursor-pointer"
                            title="Disqualify for plagiarism/cheating"
                          >
                            Disqualify
                          </button>
                        </div>
                      </div>

                      {/* Metrics Grid */}
                      <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                        <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/80">
                          <span className="text-[10px] text-slate-400 block">Seconds Taken</span>
                          <strong className="text-white text-sm">{inspectDuel.players[1]?.antiCheat?.timeTakenSeconds ?? 0}s</strong>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/80">
                          <span className="text-[10px] text-slate-400 block">Tab Switches</span>
                          <strong className={cn("text-sm", (inspectDuel.players[1]?.antiCheat?.tabSwitchesCount ?? 0) > 0 ? "text-amber-400" : "text-emerald-400")}>
                            {inspectDuel.players[1]?.antiCheat?.tabSwitchesCount ?? 0}
                          </strong>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/80">
                          <span className="text-[10px] text-slate-400 block">Code Pastes</span>
                          <strong className={cn("text-sm", (inspectDuel.players[1]?.antiCheat?.pasteCount ?? 0) > 0 ? "text-amber-400" : "text-emerald-400")}>
                            {inspectDuel.players[1]?.antiCheat?.pasteCount ?? 0}
                          </strong>
                        </div>
                      </div>

                      {/* Event Playback Timeline */}
                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 max-h-32 overflow-y-auto space-y-1">
                        <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block mb-1">Telemetry Event Timeline</span>
                        {inspectDuel.players[1]?.antiCheat?.logs && inspectDuel.players[1].antiCheat.logs.length > 0 ? (
                          inspectDuel.players[1].antiCheat.logs.map((log: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between text-[11px] font-mono text-slate-300">
                              <span className="text-slate-500 shrink-0 mr-2">{log.timestamp}</span>
                              <span className="truncate">{log.details}</span>
                              <span className={cn(
                                "ml-2 px-1.5 py-0.2 rounded text-[9px] uppercase font-bold shrink-0",
                                log.eventType === 'paste' ? 'bg-amber-500/20 text-amber-300' :
                                log.eventType === 'tab_hidden' ? 'bg-rose-500/20 text-rose-300' :
                                'bg-slate-800 text-slate-400'
                              )}>
                                {log.eventType}
                              </span>
                            </div>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">No abnormal events recorded during this session.</span>
                        )}
                      </div>
                    </div>
                  )}

                  {inspectDuel.players[1]?.submittedCode ? (
                    <div className="p-4 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed select-text">
                      <pre>{inspectDuel.players[1].submittedCode}</pre>
                    </div>
                  ) : (
                    <div className="p-12 text-center text-slate-400 italic bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800">
                      No code submitted yet by Player 2.
                    </div>
                  )}
                </div>
              )}

              {/* PROBLEM DETAILS */}
              {inspectTab === 'problem' && (
                <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {inspectDuel.problemTitle}
                    </h4>
                    <span className="px-2 py-0.5 rounded font-mono font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      {inspectDuel.difficulty}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 leading-relaxed whitespace-pre-wrap">
                    {typeof inspectDuel.problemId === 'object' && inspectDuel.problemId?.description
                      ? inspectDuel.problemId.description
                      : 'Algorithmic DSA Challenge loaded for this 1vs1 coding battle.'}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
              <div className="text-xs font-mono text-slate-500">
                Created: {new Date(inspectDuel.createdAt).toLocaleString()}
              </div>
              <button
                onClick={() => setInspectDuel(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. FORCE CANCEL CONFIRMATION MODAL */}
      {duelToCancel && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-rose-500/30 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Terminate Active Code Duel
                </h3>
                <span className="font-mono text-xs">Room: {duelToCancel.roomCode}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to force terminate this duel battle? Any connected participants will be notified via Socket.io and the match status will become <strong>CANCELLED</strong>.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Administrative Reason:
              </label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for match cancellation..."
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDuelToCancel(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
              >
                Go Back
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleConfirmCancel}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-sm"
              >
                {cancelling ? 'Cancelling...' : 'Force Cancel Duel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. DELETE CONFIRMATION MODAL */}
      {duelToDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Delete Duel Record
                </h3>
                <span className="font-mono text-xs text-slate-500">
                  Room: {duelToDelete.roomCode}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              This action will permanently delete the duel record for{' '}
              <strong>{duelToDelete.roomCode} ({duelToDelete.problemTitle})</strong> from the database. This action cannot be undone.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDuelToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-sm"
              >
                {deleting ? 'Deleting...' : 'Delete Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
