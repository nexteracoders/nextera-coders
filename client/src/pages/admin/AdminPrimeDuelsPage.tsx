import React, { useState, useEffect, useMemo } from 'react';
import {
  Crown,
  Coins,
  Swords,
  Trophy,
  Search,
  RefreshCw,
  Eye,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  Settings,
  Save,
  Percent,
  Sliders,
  Users,
  Timer,
} from 'lucide-react';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../components/ui/Toast';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import {
  adminDuelService,
  AdminDuelItem,
  AdminPrimeDuelMetrics,
  AdminPrimeDuelSettings,
} from '../../services/adminDuel.service';
import { cn } from '../../utils/cn';

export const AdminPrimeDuelsPage: React.FC = () => {
  useDocumentTitle('NEC Prime Battles — NextEra Admin');
  const { success, error: toastError } = useToast();

  // Active Main Tab: 'duels' | 'settings'
  const [activeMainTab, setActiveMainTab] = useState<'duels' | 'settings'>('duels');

  // List & Metrics State
  const [duels, setDuels] = useState<AdminDuelItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [metrics, setMetrics] = useState<AdminPrimeDuelMetrics>({
    totalDuels: 0,
    inProgressDuels: 0,
    waitingDuels: 0,
    completedDuels: 0,
    timedOutDuels: 0,
    cancelledDuels: 0,
    totalGrossStaked: 0,
    totalPlatformRevenue: 0,
    totalPrizeDistributed: 0,
  });

  // Filters & Pagination
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);

  // Copied code feedback
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Inspect Modal State
  const [inspectDuel, setInspectDuel] = useState<AdminDuelItem | null>(null);
  const [inspectPlayerIndex, setInspectPlayerIndex] = useState<number>(0);

  // Cancel & Refund Modal State
  const [duelToCancel, setDuelToCancel] = useState<AdminDuelItem | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('Terminated and refunded by administrator');
  const [cancelling, setCancelling] = useState<boolean>(false);

  // Settings State
  const [settingsLoading, setSettingsLoading] = useState<boolean>(false);
  const [settingsSaving, setSettingsSaving] = useState<boolean>(false);
  const [settings, setSettings] = useState<AdminPrimeDuelSettings>({
    minStake: 50,
    maxStake: 5000,
    platformFeePercent: 10,
    durationSeconds: 900,
    isEnabled: true,
    maxParticipantsPerRoom: 10,
    twoPlayerPercentages: { first: 100 },
    squadPercentages: { first: 65, second: 35 },
    grandRoyalePercentages: { first: 50, second: 30, third: 20 },
  });

  // Settings Simulator state
  const [simSquadSize, setSimSquadSize] = useState<number>(5);
  const [simStake, setSimStake] = useState<number>(150);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch Prime Duels
  const fetchPrimeDuels = async () => {
    setLoading(true);
    try {
      const res = await adminDuelService.getPrimeDuels({
        page: currentPage,
        limit: 15,
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: debouncedSearch.trim() || undefined,
      });

      setDuels(res.duels || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotalItems(res.pagination?.total || 0);
      if (res.metrics) {
        setMetrics(res.metrics);
      }
    } catch (err: any) {
      toastError('Failed to fetch Prime Battles', err.response?.data?.message || 'Server error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Prime Settings
  const fetchPrimeSettings = async () => {
    setSettingsLoading(true);
    try {
      const data = await adminDuelService.getPrimeSettings();
      if (data) {
        setSettings(data);
      }
    } catch (err: any) {
      toastError('Settings Error', 'Could not load NEC Prime Battle configurations');
    } finally {
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrimeDuels();
    fetchPrimeSettings();
  }, [currentPage, statusFilter, debouncedSearch]);

  // Copy helper
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    success('Copied!', 'Copied to clipboard');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Force Cancel & 100% Refund
  const handleConfirmCancelRefund = async () => {
    if (!duelToCancel) return;
    setCancelling(true);
    try {
      const res = await adminDuelService.cancelAndRefundPrimeDuel(duelToCancel._id, cancelReason);
      success(
        'Prime Battle Cancelled & Refunded',
        `Successfully returned ${res.totalRefunded} coins back to ${res.refundedCount} participants.`
      );
      setDuelToCancel(null);
      fetchPrimeDuels();
    } catch (err: any) {
      toastError('Cancel & Refund Failed', err.response?.data?.message || 'Could not refund participants');
    } finally {
      setCancelling(false);
    }
  };

  // Save Settings Handler
  const handleSaveSettings = async () => {
    // Validate squad percentages sum to 100
    const squadSum = (settings.squadPercentages?.first || 0) + (settings.squadPercentages?.second || 0);
    if (squadSum !== 100) {
      toastError('Invalid Squad Percentages', `3-5 Player percentages must sum to 100% (currently ${squadSum}%)`);
      return;
    }

    // Validate royale percentages sum to 100
    const royaleSum =
      (settings.grandRoyalePercentages?.first || 0) +
      (settings.grandRoyalePercentages?.second || 0) +
      (settings.grandRoyalePercentages?.third || 0);
    if (royaleSum !== 100) {
      toastError('Invalid Royale Percentages', `6-10 Player percentages must sum to 100% (currently ${royaleSum}%)`);
      return;
    }

    setSettingsSaving(true);
    try {
      const updated = await adminDuelService.updatePrimeSettings(settings);
      setSettings(updated);
      success('Settings Saved Successfully', 'NEC Prime Battle coin staking, cuts & payout rules updated!');
    } catch (err: any) {
      toastError('Failed to Save Settings', err.response?.data?.message || 'Server error occurred');
    } finally {
      setSettingsSaving(false);
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
      success('Status Updated', `Player anti-cheat verdict set to ${status.toUpperCase()}`);
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
      fetchPrimeDuels();
    } catch (err: any) {
      toastError('Update Failed', err.response?.data?.message || 'Failed to update anti-cheat status');
    }
  };

  // Status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in-progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            In-Progress
          </span>
        );
      case 'waiting':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
            <Clock className="w-3 h-3" />
            Waiting for Squad
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            <RotateCcw className="w-3 h-3" />
            Cancelled & Refunded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400">
            {status}
          </span>
        );
    }
  };

  // Real-time simulator calculation for Settings Tab
  const simCalculation = useMemo(() => {
    const gross = simStake * simSquadSize;
    const fee = Math.round(gross * ((settings.platformFeePercent || 10) / 100));
    const net = gross - fee;

    let winners: Array<{ label: string; pct: number; coins: number }> = [];
    if (simSquadSize <= 2) {
      winners = [
        { label: '🥇 1st Place', pct: settings.twoPlayerPercentages?.first || 100, coins: net },
      ];
    } else if (simSquadSize <= 5) {
      const p1 = settings.squadPercentages?.first || 65;
      const p2 = settings.squadPercentages?.second || 35;
      const c1 = Math.round(net * (p1 / 100));
      winners = [
        { label: '🥇 1st Place', pct: p1, coins: c1 },
        { label: '🥈 2nd Place', pct: p2, coins: net - c1 },
      ];
    } else {
      const p1 = settings.grandRoyalePercentages?.first || 50;
      const p2 = settings.grandRoyalePercentages?.second || 30;
      const p3 = settings.grandRoyalePercentages?.third || 20;
      const c1 = Math.round(net * (p1 / 100));
      const c2 = Math.round(net * (p2 / 100));
      winners = [
        { label: '🥇 1st Place', pct: p1, coins: c1 },
        { label: '🥈 2nd Place', pct: p2, coins: c2 },
        { label: '🥉 3rd Place', pct: p3, coins: net - c1 - c2 },
      ];
    }

    return { gross, fee, net, winners };
  }, [simSquadSize, simStake, settings]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto font-sans">
      {/* Header */}
      <AdminPageHeader
        title="👑 NEC Prime Battles Management"
        description="High-stakes coin battles: Monitor gross staked pots, 10% platform revenue, prize distributions & live rules configuration"
      />

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 max-w-fit shadow-sm">
        <button
          type="button"
          onClick={() => setActiveMainTab('duels')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all',
            activeMainTab === 'duels'
              ? 'bg-amber-500 text-stone-950 font-black shadow-md shadow-amber-500/25'
              : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
          )}
        >
          <Swords className="w-4 h-4" />
          <span>Prime Battles List ({metrics.totalDuels})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab('settings')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all',
            activeMainTab === 'settings'
              ? 'bg-amber-500 text-stone-950 font-black shadow-md shadow-amber-500/25'
              : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
          )}
        >
          <Settings className="w-4 h-4" />
          <span>Rules, Coins & Payout Settings</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: BATTLES LIST & FINANCIAL ANALYTICS                                  */}
      {/* ========================================================================= */}
      {activeMainTab === 'duels' && (
        <div className="space-y-6">
          {/* Top Prime Analytics Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Gross Staked */}
            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                  Gross Staked by Students
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
                  <Coins className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono flex items-center gap-1.5">
                <span>{metrics.totalGrossStaked.toLocaleString()}</span>
                <span className="text-base text-amber-500 font-bold">🪙</span>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-neutral-400">Total coin volume staked across all battles</p>
            </div>

            {/* 10% Platform Revenue (Highlighted) */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-amber-600/15 border-2 border-amber-500/40 shadow-md relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  {settings.platformFeePercent || 10}% Platform Cut Treasury
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black shadow-md shadow-amber-500/30">
                  <Crown className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 font-mono flex items-center gap-1.5">
                <span>{metrics.totalPlatformRevenue.toLocaleString()}</span>
                <span className="text-base font-bold">🪙</span>
              </div>
              <p className="mt-1 text-xs text-amber-800 dark:text-amber-200/80 font-medium">
                Platform commission collected for prize pool treasury
              </p>
            </div>

            {/* Net Distributed to Winners */}
            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                  Prize Pools Won
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
                  <Trophy className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1.5">
                <span>{metrics.totalPrizeDistributed.toLocaleString()}</span>
                <span className="text-base font-bold">🪙</span>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-neutral-400">Net prize pools shared among top coders</p>
            </div>

            {/* Active & Waiting */}
            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                  Active / Waiting Rooms
                </span>
                <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black">
                  <Swords className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono flex items-center gap-2">
                <span>{metrics.inProgressDuels}</span>
                <span className="text-xs text-slate-400 font-normal">in-flight / {metrics.waitingDuels} open</span>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-neutral-400">
                {metrics.completedDuels} completed &bull; {metrics.cancelledDuels} refunded
              </p>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Status Filters */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-neutral-800 text-xs font-semibold overflow-x-auto w-full sm:w-auto">
              {['all', 'in-progress', 'waiting', 'completed', 'cancelled'].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => {
                    setStatusFilter(status);
                    setCurrentPage(1);
                  }}
                  className={cn(
                    'px-3 py-1.5 rounded-lg transition-all capitalize whitespace-nowrap',
                    statusFilter === status
                      ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                      : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  {status === 'all' ? 'All Battles' : status}
                </button>
              ))}
            </div>

            {/* Search & Refresh */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <div className="relative flex-1 sm:w-72">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search code, problem, user..."
                  className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-400 pl-9"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>

              <button
                type="button"
                onClick={fetchPrimeDuels}
                disabled={loading}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 transition-colors"
                title="Refresh Prime Battles"
              >
                <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
              </button>
            </div>
          </div>

          {/* Prime Battles Table */}
          <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-neutral-800/80 border-b border-slate-200 dark:border-neutral-800 text-slate-500 dark:text-neutral-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5">Room Code</th>
                    <th className="px-4 py-3.5">Problem</th>
                    <th className="px-4 py-3.5">Squad & Stake</th>
                    <th className="px-4 py-3.5">Pot & Commission</th>
                    <th className="px-4 py-3.5">Net Prize Pool</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Winners & Payouts</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/60 font-medium">
                  {loading && duels.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                          <span>Loading NEC Prime Battles...</span>
                        </div>
                      </td>
                    </tr>
                  ) : duels.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                        No Prime Battles found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    duels.map((duel) => {
                      const entryFee = duel.entryFee || 50;
                      const totalPot = duel.totalPot || entryFee * duel.players.length;
                      const platformCut = duel.platformFeeCollected || Math.round(totalPot * 0.1);
                      const netPool = duel.netPrizePool || totalPot - platformCut;

                      return (
                        <tr key={duel._id} className="hover:bg-slate-50/80 dark:hover:bg-neutral-800/40 transition-colors">
                          {/* Room Code */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 font-mono font-bold text-amber-600 dark:text-amber-400">
                              <span>{duel.roomCode}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(duel.roomCode)}
                                className="p-1 hover:text-white"
                                title="Copy code"
                              >
                                {copiedCode === duel.roomCode ? (
                                  <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3 h-3 text-slate-400" />
                                )}
                              </button>
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {new Date(duel.createdAt).toLocaleDateString()}
                            </span>
                          </td>

                          {/* Problem */}
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-slate-900 dark:text-white max-w-[200px] truncate">
                              {duel.problemTitle}
                            </div>
                            <span
                              className={cn(
                                'inline-block text-[10px] font-bold px-1.5 py-0.2 rounded mt-0.5',
                                duel.difficulty === 'Easy'
                                  ? 'text-emerald-500 bg-emerald-500/10'
                                  : duel.difficulty === 'Medium'
                                  ? 'text-amber-500 bg-amber-500/10'
                                  : 'text-rose-500 bg-rose-500/10'
                              )}
                            >
                              {duel.difficulty}
                            </span>
                          </td>

                          {/* Squad & Stake */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="font-bold text-slate-800 dark:text-neutral-200">
                              {duel.players.length} / {duel.maxParticipants || 2} Players
                            </div>
                            <div className="text-[11px] text-amber-500 font-mono font-semibold">
                              Stake: {entryFee} 🪙 / player
                            </div>
                          </td>

                          {/* Gross Pot & Platform Cut */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="font-mono font-black text-slate-900 dark:text-white">
                              {totalPot} 🪙 Pot
                            </div>
                            <div className="text-[10.5px] text-amber-600 dark:text-amber-400 font-mono font-semibold">
                              Fee: -{platformCut} 🪙
                            </div>
                          </td>

                          {/* Net Prize Pool */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                              {netPool} 🪙
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3.5 whitespace-nowrap">{getStatusBadge(duel.status)}</td>

                          {/* Winners & Payouts */}
                          <td className="px-4 py-3.5 max-w-xs">
                            {duel.primeWinners && duel.primeWinners.length > 0 ? (
                              <div className="space-y-1">
                                {duel.primeWinners.map((pw) => (
                                  <div key={pw.rank} className="text-[11px] text-slate-700 dark:text-neutral-300">
                                    <span className="font-bold text-amber-500">#{pw.rank} {pw.name}</span>: +
                                    <span className="font-mono text-emerald-500 font-bold">{pw.coinsAwarded} 🪙</span>{' '}
                                    <span className="text-[10px] text-slate-400">({pw.percentage}%)</span>
                                  </div>
                                ))}
                              </div>
                            ) : duel.status === 'completed' && duel.winnerId ? (
                              <div className="text-xs text-emerald-500 font-bold">
                                Winner Solved: +{netPool} 🪙
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px]">—</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setInspectDuel(duel);
                                  setInspectPlayerIndex(0);
                                }}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 transition-colors"
                                title="Inspect Battle & Submissions"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {(duel.status === 'in-progress' || duel.status === 'waiting') && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDuelToCancel(duel);
                                    setCancelReason('Administrative cancellation & full refund');
                                  }}
                                  className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 transition-colors"
                                  title="Force Cancel & 100% Refund All"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400 flex-wrap gap-2">
              <span>
                Showing {duels.length} of {totalItems} Prime Battles
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 disabled:opacity-40 transition-colors"
                >
                  Previous
                </button>
                <span className="px-2 font-bold text-slate-700 dark:text-neutral-300">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 disabled:opacity-40 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: RULES, COIN STAKES & WINNER PAYOUT SETTINGS                        */}
      {/* ========================================================================= */}
      {activeMainTab === 'settings' && (
        <div className="space-y-6">
          {/* Top Save & Status Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-500" />
                <span>Prime Battle Rules & Economics Configuration</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Adjust minimum stakes, platform commission cuts, countdown duration, and tiered winner percentages. Changes take effect on all new rooms immediately.
              </p>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <button
                type="button"
                onClick={fetchPrimeSettings}
                disabled={settingsLoading}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 text-xs font-bold transition-all"
              >
                Reset
              </button>

              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={settingsSaving}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              >
                {settingsSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Settings & Rules</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Columns: Form Controls */}
            <div className="lg:col-span-7 space-y-6">
              {/* Card 1: Coin Staking Constraints */}
              <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-neutral-800">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Coins className="w-4 h-4 text-amber-500" />
                    <span>Coin Staking Limits (User Entry Stakes)</span>
                  </h4>
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">NEC Coins (🪙)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-neutral-300 block mb-1">
                      Minimum Entry Stake (🪙)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={settings.minStake || ''}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          minStake: Math.max(1, parseInt(e.target.value) || 1),
                        }))
                      }
                      className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-400"
                    />
                    <p className="text-[10.5px] text-slate-400 mt-1">Default: 50 Coins. Cannot be less than 1.</p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-neutral-300 block mb-1">
                      Maximum Entry Stake Cap (🪙)
                    </label>
                    <input
                      type="number"
                      min={settings.minStake || 50}
                      value={settings.maxStake || ''}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          maxStake: Math.max(prev.minStake || 50, parseInt(e.target.value) || 5000),
                        }))
                      }
                      className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-400"
                    />
                    <p className="text-[10.5px] text-slate-400 mt-1">Default: 5000 Coins.</p>
                  </div>
                </div>
              </div>

              {/* Card 2: Platform Commission Fee Cut */}
              <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-neutral-800">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Percent className="w-4 h-4 text-amber-500" />
                    <span>Platform Commission Cut (From Gross Pot)</span>
                  </h4>
                  <span className="font-mono text-xs font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                    {settings.platformFeePercent || 10}% Commission
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 dark:text-neutral-400">
                      Commission percentage deducted from the total battle pot prior to winner distribution:
                    </span>
                    <span className="text-base font-black text-slate-900 dark:text-white font-mono">
                      {settings.platformFeePercent}%
                    </span>
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={50}
                    step={1}
                    value={settings.platformFeePercent || 10}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        platformFeePercent: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full accent-amber-500 cursor-pointer"
                  />

                  {/* Preset Percentages */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] text-slate-400">Quick Presets:</span>
                    {[0, 5, 10, 15, 20].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setSettings((prev) => ({ ...prev, platformFeePercent: pct }))}
                        className={cn(
                          'px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all',
                          settings.platformFeePercent === pct
                            ? 'bg-amber-500 text-stone-950 font-black'
                            : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 hover:text-white'
                        )}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card 3: Winner Payout Tiers Percentages */}
              <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-sm space-y-5">
                <div className="pb-3 border-b border-slate-100 dark:border-neutral-800">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-emerald-500" />
                    <span>Winner Prize Distribution Tiers</span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                    Configure how the remaining <strong>Net Prize Pool</strong> is distributed among winners across different squad sizes.
                  </p>
                </div>

                {/* Tier 1: 2 Players (1vs1) */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-neutral-800/60 border border-slate-200 dark:border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-blue-500" />
                      2 Players (1vs1 Duel)
                    </span>
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">1 Winner</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-600 dark:text-neutral-400">🥇 1st Place (Sole Winner)</span>
                    <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">100% of Net Pool</span>
                  </div>
                </div>

                {/* Tier 2: 3 to 5 Players */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-neutral-800/60 border border-slate-200 dark:border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-amber-500" />
                      3 to 5 Players (Squad Battle)
                    </span>
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Top 2 Winners</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-slate-500 dark:text-neutral-400 font-bold block mb-1">🥇 1st Place (%)</label>
                      <input
                        type="number"
                        min={1}
                        max={99}
                        value={settings.squadPercentages?.first || ''}
                        onChange={(e) => {
                          const f = Math.max(1, Math.min(99, parseInt(e.target.value) || 65));
                          setSettings((prev) => ({
                            ...prev,
                            squadPercentages: { first: f, second: 100 - f },
                          }));
                        }}
                        className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 font-mono font-bold text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 dark:text-neutral-400 font-bold block mb-1">🥈 2nd Place (%)</label>
                      <input
                        type="number"
                        min={1}
                        max={99}
                        value={settings.squadPercentages?.second || ''}
                        onChange={(e) => {
                          const s = Math.max(1, Math.min(99, parseInt(e.target.value) || 35));
                          setSettings((prev) => ({
                            ...prev,
                            squadPercentages: { first: 100 - s, second: s },
                          }));
                        }}
                        className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 font-mono font-bold text-xs"
                      />
                    </div>
                  </div>
                  <div className="text-[10.5px] text-slate-400 flex items-center justify-between pt-1">
                    <span>Sum: {(settings.squadPercentages?.first || 0) + (settings.squadPercentages?.second || 0)}%</span>
                    <span className="text-emerald-500 font-bold">Auto-balances to 100%</span>
                  </div>
                </div>

                {/* Tier 3: 6 to 10 Players */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-neutral-800/60 border border-slate-200 dark:border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-purple-500" />
                      6 to 10 Players (Prime Grand Royale)
                    </span>
                    <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">Top 3 Winners</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <label className="text-slate-500 dark:text-neutral-400 font-bold block mb-1">🥇 1st (%)</label>
                      <input
                        type="number"
                        min={1}
                        max={98}
                        value={settings.grandRoyalePercentages?.first || ''}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            grandRoyalePercentages: {
                              ...prev.grandRoyalePercentages,
                              first: parseInt(e.target.value) || 50,
                            },
                          }))
                        }
                        className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 font-mono font-bold text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 dark:text-neutral-400 font-bold block mb-1">🥈 2nd (%)</label>
                      <input
                        type="number"
                        min={1}
                        max={98}
                        value={settings.grandRoyalePercentages?.second || ''}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            grandRoyalePercentages: {
                              ...prev.grandRoyalePercentages,
                              second: parseInt(e.target.value) || 30,
                            },
                          }))
                        }
                        className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 font-mono font-bold text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 dark:text-neutral-400 font-bold block mb-1">🥉 3rd (%)</label>
                      <input
                        type="number"
                        min={1}
                        max={98}
                        value={settings.grandRoyalePercentages?.third || ''}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            grandRoyalePercentages: {
                              ...prev.grandRoyalePercentages,
                              third: parseInt(e.target.value) || 20,
                            },
                          }))
                        }
                        className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 font-mono font-bold text-xs"
                      />
                    </div>
                  </div>

                  <div className="text-[10.5px] text-slate-400 flex items-center justify-between pt-1">
                    <span>
                      Sum:{' '}
                      <strong
                        className={
                          (settings.grandRoyalePercentages?.first || 0) +
                            (settings.grandRoyalePercentages?.second || 0) +
                            (settings.grandRoyalePercentages?.third || 0) ===
                          100
                            ? 'text-emerald-500'
                            : 'text-rose-500'
                        }
                      >
                        {(settings.grandRoyalePercentages?.first || 0) +
                          (settings.grandRoyalePercentages?.second || 0) +
                          (settings.grandRoyalePercentages?.third || 0)}
                        %
                      </strong>
                    </span>
                    <span className="text-slate-400">Must equal exactly 100%</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Match Rules & Limits */}
              <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-sm space-y-4">
                <div className="pb-3 border-b border-slate-100 dark:border-neutral-800">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Timer className="w-4 h-4 text-blue-500" />
                    <span>Battle Timer & Squad Capacity</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-neutral-300 block mb-1">
                      Countdown Timer (Minutes)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={Math.round((settings.durationSeconds || 900) / 60)}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          durationSeconds: Math.max(60, (parseInt(e.target.value) || 15) * 60),
                        }))
                      }
                      className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-xs font-mono font-bold"
                    />
                    <p className="text-[10.5px] text-slate-400 mt-1">Default: 15 minutes (900 seconds)</p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-neutral-300 block mb-1">
                      Max Participants Allowed (Squad Cap)
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={10}
                      value={settings.maxParticipantsPerRoom || 10}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          maxParticipantsPerRoom: Math.max(2, Math.min(10, parseInt(e.target.value) || 10)),
                        }))
                      }
                      className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-xs font-mono font-bold"
                    />
                    <p className="text-[10.5px] text-slate-400 mt-1">Max players host can invite (2 to 10)</p>
                  </div>
                </div>

                {/* Platform Enabled Switch */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-neutral-800/60 border border-slate-200 dark:border-neutral-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      NEC Prime Battle Platform Status
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-neutral-400">
                      When disabled, students cannot create or queue for Prime coin battles.
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSettings((prev) => ({ ...prev, isEnabled: !prev.isEnabled }))}
                    className={cn(
                      'px-4 py-1.5 rounded-xl font-bold text-xs transition-all',
                      settings.isEnabled
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-rose-500/20 text-rose-500 border border-rose-500/40'
                    )}
                  >
                    {settings.isEnabled ? 'Active (Enabled)' : 'Paused (Disabled)'}
                  </button>
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Live Interactive Simulator */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border-2 border-amber-500/40 shadow-xl space-y-5 sticky top-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-neutral-800">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Real-Time Payout Simulator</span>
                  </h4>
                  <span className="text-[10.5px] font-bold text-amber-600 dark:text-amber-400">Preview Engine</span>
                </div>

                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  Test your rules live! Adjust the squad size and coin stake below to see how current rules calculate the platform cut and winner payouts:
                </p>

                {/* Simulator Inputs */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-neutral-300 block mb-1">
                      Test Battle Squad Size ({simSquadSize} Players):
                    </label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[2, 3, 4, 5, 8].map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setSimSquadSize(size)}
                          className={cn(
                            'py-1.5 rounded-lg text-xs font-bold font-mono transition-all',
                            simSquadSize === size
                              ? 'bg-amber-500 text-stone-950 font-black shadow-sm'
                              : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400'
                          )}
                        >
                          {size}P
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-neutral-300 block mb-1">
                      Test Coin Stake per Player:
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[50, 100, 150, 500].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setSimStake(c)}
                          className={cn(
                            'py-1.5 rounded-lg text-xs font-bold font-mono transition-all',
                            simStake === c
                              ? 'bg-amber-500 text-stone-950 font-black shadow-sm'
                              : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400'
                          )}
                        >
                          {c}🪙
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Live Math Results Card */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-neutral-800/80 border border-slate-200 dark:border-neutral-800 space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-neutral-700">
                    <span className="text-slate-500 dark:text-neutral-400">Gross Pot ({simSquadSize} × {simStake}):</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{simCalculation.gross} 🪙</span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-neutral-700">
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">
                      Platform Fee Cut ({settings.platformFeePercent || 10}%):
                    </span>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">-{simCalculation.fee} 🪙</span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-neutral-700">
                    <span className="font-black text-emerald-600 dark:text-emerald-400">Net Prize Pool:</span>
                    <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                      {simCalculation.net} 🪙
                    </span>
                  </div>

                  {/* Calculated Winners */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Calculated Payouts:
                    </span>
                    {simCalculation.winners.map((w, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700/70 font-semibold"
                      >
                        <span className="text-slate-700 dark:text-neutral-200">{w.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400 font-mono">({w.pct}%)</span>
                          <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                            +{w.coins} 🪙
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={settingsSaving}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-black text-xs shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {settingsSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save All Settings</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Duel Modal */}
      {inspectDuel && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-4xl w-full max-h-[90vh] bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200 dark:border-neutral-800 shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-amber-500">
                  NEC PRIME BATTLE &bull; {inspectDuel.roomCode}
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {inspectDuel.problemTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectDuel(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Financial Telemetry Banner */}
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-800/40 grid grid-cols-4 gap-3 text-center text-xs">
              <div>
                <span className="text-slate-500 dark:text-neutral-400 text-[10px]">Entry Stake</span>
                <div className="font-bold text-slate-900 dark:text-white font-mono">
                  {inspectDuel.entryFee || 50} 🪙 / player
                </div>
              </div>
              <div>
                <span className="text-slate-500 dark:text-neutral-400 text-[10px]">Total Gross Pot</span>
                <div className="font-bold text-slate-900 dark:text-white font-mono">
                  {inspectDuel.totalPot || 0} 🪙
                </div>
              </div>
              <div>
                <span className="text-amber-600 dark:text-amber-400 text-[10px]">Platform Commission</span>
                <div className="font-bold text-amber-600 dark:text-amber-400 font-mono">
                  -{inspectDuel.platformFeeCollected || 0} 🪙
                </div>
              </div>
              <div>
                <span className="text-emerald-600 dark:text-emerald-400 text-[10px]">Net Prize Pool</span>
                <div className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {inspectDuel.netPrizePool || 0} 🪙
                </div>
              </div>
            </div>

            {/* Player Tabs */}
            <div className="p-2.5 border-b border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/50 flex items-center gap-2 overflow-x-auto">
              {inspectDuel.players.map((pl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setInspectPlayerIndex(idx)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5',
                    inspectPlayerIndex === idx
                      ? 'bg-amber-500 text-stone-950 shadow-sm'
                      : 'text-slate-600 dark:text-neutral-400 hover:text-white'
                  )}
                >
                  <span>{pl.name}</span>
                  <span className="text-[10px] opacity-75">
                    ({pl.testCasesPassed}/{pl.totalTestCases} Tests)
                  </span>
                </button>
              ))}
            </div>

            {/* Player Code & Telemetry Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {inspectDuel.players[inspectPlayerIndex] ? (
                <>
                  <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                    <div>
                      <span className="text-slate-400">Player: </span>
                      <strong className="text-slate-900 dark:text-white">
                        {inspectDuel.players[inspectPlayerIndex].name}
                      </strong>{' '}
                      &bull; Status:{' '}
                      <span className="font-mono text-amber-500 uppercase">
                        {inspectDuel.players[inspectPlayerIndex].status}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Coins Staked: </span>
                      <strong className="font-mono text-amber-400">
                        {inspectDuel.players[inspectPlayerIndex].coinsPaid || inspectDuel.entryFee || 50} 🪙
                      </strong>
                    </div>
                  </div>

                  {/* Anti-Cheat Telemetry Card for Prime Duel Player */}
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-amber-400" />
                        <span className="font-bold text-xs text-white">Anti-Cheat Playback & Telemetry</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border",
                          inspectDuel.players[inspectPlayerIndex]?.antiCheat?.status === 'flagged' || inspectDuel.players[inspectPlayerIndex]?.antiCheat?.status === 'disqualified'
                            ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                            : inspectDuel.players[inspectPlayerIndex]?.antiCheat?.status === 'suspicious'
                            ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                            : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        )}>
                          {inspectDuel.players[inspectPlayerIndex]?.antiCheat?.status || 'clean'}
                        </span>
                        {inspectDuel.players[inspectPlayerIndex]?.antiCheat?.adminOverridden && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-cyan-500/20 text-cyan-300 font-mono">
                            Admin Overridden
                          </span>
                        )}
                      </div>

                      {/* Admin Override Buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOverrideAntiCheat(inspectDuel._id, inspectDuel.players[inspectPlayerIndex], 'clean')}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition-all cursor-pointer"
                        >
                          Mark Clean
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOverrideAntiCheat(inspectDuel._id, inspectDuel.players[inspectPlayerIndex], 'suspicious')}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 transition-all cursor-pointer"
                        >
                          Flag Suspicious
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOverrideAntiCheat(inspectDuel._id, inspectDuel.players[inspectPlayerIndex], 'disqualified')}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 transition-all cursor-pointer"
                        >
                          Disqualify
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                      <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/80">
                        <span className="text-[10px] text-slate-400 block">Seconds Taken</span>
                        <strong className="text-white text-sm">{inspectDuel.players[inspectPlayerIndex]?.antiCheat?.timeTakenSeconds ?? 0}s</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/80">
                        <span className="text-[10px] text-slate-400 block">Tab Switches</span>
                        <strong className={cn("text-sm", (inspectDuel.players[inspectPlayerIndex]?.antiCheat?.tabSwitchesCount ?? 0) > 0 ? "text-amber-400" : "text-emerald-400")}>
                          {inspectDuel.players[inspectPlayerIndex]?.antiCheat?.tabSwitchesCount ?? 0}
                        </strong>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/80">
                        <span className="text-[10px] text-slate-400 block">Code Pastes</span>
                        <strong className={cn("text-sm", (inspectDuel.players[inspectPlayerIndex]?.antiCheat?.pasteCount ?? 0) > 0 ? "text-amber-400" : "text-emerald-400")}>
                          {inspectDuel.players[inspectPlayerIndex]?.antiCheat?.pasteCount ?? 0}
                        </strong>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 max-h-32 overflow-y-auto space-y-1">
                      <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block mb-1">Telemetry Event Timeline</span>
                      {inspectDuel.players[inspectPlayerIndex]?.antiCheat?.logs && inspectDuel.players[inspectPlayerIndex].antiCheat.logs.length > 0 ? (
                        inspectDuel.players[inspectPlayerIndex].antiCheat.logs.map((log: any, idx: number) => (
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

                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-400">Submitted Code:</span>
                    <pre className="p-4 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto max-h-72 border border-slate-800">
                      {inspectDuel.players[inspectPlayerIndex].submittedCode ||
                        '// No solution submitted yet for this battle'}
                    </pre>
                  </div>
                </>
              ) : (
                <p className="text-xs text-slate-400">No participant data available.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Force Cancel & 100% Refund Confirmation Modal */}
      {duelToCancel && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Cancel & 100% Refund Battle?
            </h3>
            <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed">
              This action will immediately cancel Room <strong>{duelToCancel.roomCode}</strong> and return{' '}
              <strong>100% of all staked coins</strong> directly back to each of the {duelToCancel.players.length}{' '}
              participating students' wallets.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Administrative Cancellation Reason:</label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation and refund..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-rose-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDuelToCancel(null)}
                disabled={cancelling}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelRefund}
                disabled={cancelling}
                className="px-4 py-2 rounded-xl text-xs font-black bg-rose-500 hover:bg-rose-600 text-white transition-all shadow-md shadow-rose-500/20"
              >
                {cancelling ? 'Refunding...' : 'Confirm 100% Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
