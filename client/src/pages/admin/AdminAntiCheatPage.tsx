import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Users,
  Search,
  RefreshCw,
  Eye,
  CheckCircle,
  Clock,
  Copy,
  Filter,
  Trophy,
  Award,
  Swords,
  Crown,
  Check,
  X,
  AlertOctagon,
} from 'lucide-react';
import {
  adminAntiCheatService,
  UnifiedAntiCheatRecord,
  ArenaType,
  AntiCheatStatus,
} from '../../services/adminAntiCheat.service';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';
import { cn } from '../../utils/cn';

export const AdminAntiCheatPage: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [records, setRecords] = useState<UnifiedAntiCheatRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search
  const [selectedArena, setSelectedArena] = useState<ArenaType>('all');
  const [selectedStatus, setSelectedStatus] = useState<AntiCheatStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Inspect Modal
  const [inspectRecord, setInspectRecord] = useState<UnifiedAntiCheatRecord | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Load all anti-cheat records
  const fetchRecords = async () => {
    try {
      setRefreshing(true);
      const data = await adminAntiCheatService.getAllAntiCheatRecords();
      setRecords(data);
    } catch (err: any) {
      toastError('Failed to load anti-cheat data', err?.message || 'Network error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // Filtered list
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Arena filter
      if (selectedArena !== 'all' && r.arenaType !== selectedArena) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'all' && r.status !== selectedStatus) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = r.name.toLowerCase().includes(query);
        const matchUsername = r.username.toLowerCase().includes(query);
        const matchRoom = (r.roomCode || '').toLowerCase().includes(query);
        const matchProblem = (r.problemTitle || '').toLowerCase().includes(query);
        const matchEmail = (r.email || '').toLowerCase().includes(query);
        const matchCollege = (r.college || '').toLowerCase().includes(query);
        if (!matchName && !matchUsername && !matchRoom && !matchProblem && !matchEmail && !matchCollege) {
          return false;
        }
      }

      return true;
    });
  }, [records, selectedArena, selectedStatus, searchQuery]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = records.length;
    const clean = records.filter((r) => r.status === 'clean').length;
    const suspicious = records.filter((r) => r.status === 'suspicious').length;
    const flagged = records.filter((r) => r.status === 'flagged').length;
    const disqualified = records.filter((r) => r.status === 'disqualified').length;
    return {
      total,
      clean,
      suspicious,
      flagged,
      disqualified,
      highRisk: flagged + disqualified,
    };
  }, [records]);

  // Handle verdict override
  const handleOverrideVerdict = async (
    record: UnifiedAntiCheatRecord,
    newStatus: 'clean' | 'suspicious' | 'flagged' | 'disqualified'
  ) => {
    try {
      setIsUpdating(true);
      await adminAntiCheatService.overrideVerdict(record, newStatus, overrideReason);
      success(
        'Verdict Updated',
        `${record.name}'s status changed to ${newStatus.toUpperCase()}`
      );

      // Update local state immediately
      setRecords((prev) =>
        prev.map((r) =>
          r.id === record.id
            ? {
                ...r,
                status: newStatus,
                adminOverridden: true,
                reason: overrideReason || `Admin manual override to ${newStatus.toUpperCase()}`,
              }
            : r
        )
      );

      if (inspectRecord && inspectRecord.id === record.id) {
        setInspectRecord({
          ...inspectRecord,
          status: newStatus,
          adminOverridden: true,
          reason: overrideReason || `Admin manual override to ${newStatus.toUpperCase()}`,
        });
      }

      setOverrideReason('');
    } catch (err: any) {
      toastError('Update Failed', err?.message || 'Could not update verdict');
    } finally {
      setIsUpdating(false);
    }
  };

  const getArenaIcon = (type: ArenaType) => {
    switch (type) {
      case 'weekly':
        return <Trophy className="w-3.5 h-3.5 text-blue-500" />;
      case 'monthly':
        return <Award className="w-3.5 h-3.5 text-purple-500" />;
      case 'duel':
        return <Swords className="w-3.5 h-3.5 text-cyan-500" />;
      case 'prime':
        return <Crown className="w-3.5 h-3.5 text-amber-500" />;
      default:
        return <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getArenaBadgeStyle = (type: ArenaType) => {
    switch (type) {
      case 'weekly':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
      case 'monthly':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/30';
      case 'duel':
        return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30';
      case 'prime':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'clean':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            CLEAN 🟢
          </span>
        );
      case 'suspicious':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            SUSPICIOUS ⚠️
          </span>
        );
      case 'flagged':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 animate-pulse">
            <ShieldAlert className="w-3 h-3 text-rose-500" />
            FLAGGED 🚨
          </span>
        );
      case 'disqualified':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-red-600/20 text-red-500 border border-red-600/40">
            <AlertOctagon className="w-3 h-3 text-red-500" />
            DISQUALIFIED ⛔
          </span>
        );
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. HERO HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-[#16192b] to-slate-900 border border-slate-800 text-white shadow-xl relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              INTEGRITY & PROCTORING
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              CROSS-PLATFORM LIVE
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <span>Anti-Cheat Surveillance & Review Center</span>
          </h1>

          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Centralized automated proctoring telemetry across <strong>Weekly Contests</strong>, <strong>Monthly Grand Championships</strong>, <strong>NEC Code Battles</strong>, and <strong>NEC Prime Battles</strong>. Inspect tab switches, clipboard pastes, solve times, and administer instant verdicts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 z-10">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRecords}
            disabled={refreshing}
            leftIcon={<RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />}
            className="border-slate-700 hover:bg-slate-800 text-white font-mono text-xs"
          >
            {refreshing ? 'Syncing...' : 'Sync Telemetry'}
          </Button>

          <Link to="/admin/contest">
            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white text-xs font-mono">
              Weekly Contest ↗
            </Button>
          </Link>
          <Link to="/admin/monthly-contest">
            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white text-xs font-mono">
              Monthly Grand ↗
            </Button>
          </Link>
          <Link to="/admin/prime-duels">
            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white text-xs font-mono">
              Prime Battles ↗
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. TOP 4 METRICS KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        {/* Card 1: Total Audited */}
        <Card variant="elevated" className="border-slate-200 dark:border-dark-800 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-500 shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white block">
                {stats.total}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-sans">
                Total Competitors Audited
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Clean Verified */}
        <Card variant="elevated" className="border-emerald-500/30 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 block">
                {stats.clean}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-sans">
                Clean Verified (🟢)
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Suspicious */}
        <Card variant="elevated" className="border-amber-500/30 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 block">
                {stats.suspicious}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-sans">
                Suspicious Activity (⚠️)
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: High Violations / Disqualified */}
        <Card variant="elevated" className="border-rose-500/30 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 block">
                {stats.highRisk}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-sans">
                Flagged / Disqualified (🚨)
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. FILTER BAR: ARENA TABS + VERDICT STATUS + SEARCH */}
      <div className="p-4 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shadow-sm space-y-4">
        {/* Arena Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mr-1">
              <Filter className="w-3.5 h-3.5" /> Arena:
            </span>
            {(
              [
                { id: 'all', label: 'All Arenas', count: stats.total },
                { id: 'weekly', label: 'Weekly Contest', icon: Trophy },
                { id: 'monthly', label: 'Monthly Grand', icon: Award },
                { id: 'duel', label: '1vs1 Battles', icon: Swords },
                { id: 'prime', label: 'Prime Battles (🪙)', icon: Crown },
              ] as Array<{ id: ArenaType; label: string; icon?: any; count?: number }>
            ).map((tab) => {
              const isActive = selectedArena === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedArena(tab.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 border',
                    isActive
                      ? 'bg-cyan-500 text-white border-cyan-500 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-dark-700 hover:border-slate-300 dark:hover:border-dark-600'
                  )}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student, room, problem..."
              className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-slate-50 dark:bg-dark-950 border border-slate-300 dark:border-dark-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Verdict Status Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-dark-800/80">
          <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 mr-1">
            Status:
          </span>
          {(
            [
              { id: 'all', label: 'All Statuses' },
              { id: 'flagged', label: '🚨 Flagged', count: stats.flagged },
              { id: 'suspicious', label: '⚠️ Suspicious', count: stats.suspicious },
              { id: 'clean', label: '🟢 Clean', count: stats.clean },
              { id: 'disqualified', label: '⛔ Disqualified', count: stats.disqualified },
            ] as Array<{ id: AntiCheatStatus; label: string; count?: number }>
          ).map((s) => {
            const isActive = selectedStatus === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedStatus(s.id)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border',
                  isActive
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm'
                    : 'bg-transparent text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-dark-800'
                )}
              >
                <span>{s.label}</span>
                {typeof s.count === 'number' && s.count > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-dark-700">
                    {s.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. AUDIT PARTICIPANTS TABLE */}
      <div className="rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-dark-950/80 text-slate-500 dark:text-slate-400 font-mono uppercase text-[11px] border-b border-slate-200 dark:border-dark-800">
              <tr>
                <th className="py-3.5 px-4 font-bold">Contestant / Student</th>
                <th className="py-3.5 px-4 font-bold">Competitive Arena</th>
                <th className="py-3.5 px-4 font-bold">Telemetry Metrics</th>
                <th className="py-3.5 px-4 font-bold">Integrity Verdict</th>
                <th className="py-3.5 px-4 font-bold">Observations & Notes</th>
                <th className="py-3.5 px-4 font-bold text-right">Administrative Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-800/80">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-500 mb-2" />
                    <span>Aggregating proctoring records from all modules...</span>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <ShieldCheck className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-80" />
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      No matching records found
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Try adjusting your arena or status filters above.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-dark-800/40 transition-colors group"
                  >
                    {/* Contestant */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-dark-700 overflow-hidden flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300 shrink-0 border border-slate-300 dark:border-dark-600">
                          {record.avatar ? (
                            <img src={record.avatar} alt={record.name} className="w-full h-full object-cover" />
                          ) : (
                            record.name.substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{record.name}</span>
                            {record.adminOverridden && (
                              <span
                                className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-500 font-mono font-bold"
                                title="Admin manual override applied"
                              >
                                OVERRIDDEN
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            @{record.username} {record.college ? `• ${record.college}` : ''}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Arena */}
                    <td className="py-3.5 px-4 font-mono">
                      <div className="space-y-1">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border',
                            getArenaBadgeStyle(record.arenaType)
                          )}
                        >
                          {getArenaIcon(record.arenaType)}
                          <span>{record.arenaBadge}</span>
                        </span>
                        <div className="text-xs text-slate-800 dark:text-slate-200 font-semibold truncate max-w-xs" title={record.arenaTitle}>
                          {record.arenaTitle}
                        </div>
                        {record.problemTitle && (
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-xs" title={record.problemTitle}>
                            Challenge: {record.problemTitle}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Telemetry Metrics */}
                    <td className="py-3.5 px-4 font-mono">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 dark:text-slate-400 text-[11px]">Tab Switches:</span>
                          <span
                            className={cn(
                              'px-1.5 py-0.2 rounded font-bold text-xs',
                              record.tabSwitchesCount >= 5
                                ? 'bg-rose-500/20 text-rose-500'
                                : record.tabSwitchesCount >= 2
                                ? 'bg-amber-500/20 text-amber-500'
                                : 'bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300'
                            )}
                          >
                            {record.tabSwitchesCount} switches
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 dark:text-slate-400 text-[11px]">Pastes:</span>
                          <span
                            className={cn(
                              'px-1.5 py-0.2 rounded font-bold text-xs',
                              record.pasteCount >= 5
                                ? 'bg-rose-500/20 text-rose-500'
                                : record.pasteCount >= 2
                                ? 'bg-amber-500/20 text-amber-500'
                                : 'bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300'
                            )}
                          >
                            {record.pasteCount} pastes
                          </span>
                        </div>

                        {record.timeTakenSeconds ? (
                          <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <Clock className="w-3 h-3" />
                            <span>{Math.round(record.timeTakenSeconds)}s duration</span>
                          </div>
                        ) : null}
                      </div>
                    </td>

                    {/* Verdict */}
                    <td className="py-3.5 px-4">{getStatusBadge(record.status)}</td>

                    {/* Reason */}
                    <td className="py-3.5 px-4">
                      <div className="text-xs text-slate-700 dark:text-slate-300 max-w-xs truncate" title={record.reason}>
                        {record.reason}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {record.logs?.length || 0} telemetry audit logs
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setInspectRecord(record);
                            setOverrideReason(record.reason || '');
                          }}
                          leftIcon={<Eye className="w-3.5 h-3.5 text-cyan-500" />}
                          className="text-xs font-mono py-1 px-2.5 border-slate-300 dark:border-dark-700 hover:border-cyan-500"
                        >
                          Inspect Log
                        </Button>

                        {/* Quick Clean Action */}
                        {record.status !== 'clean' && (
                          <button
                            type="button"
                            onClick={() => handleOverrideVerdict(record, 'clean')}
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition-colors cursor-pointer"
                            title="Mark Clean"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Quick Flag Action */}
                        {record.status !== 'flagged' && record.status !== 'disqualified' && (
                          <button
                            type="button"
                            onClick={() => handleOverrideVerdict(record, 'flagged')}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 transition-colors cursor-pointer"
                            title="Flag as Violation"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. INSPECT AUDIT PLAYBACK & ACTION MODAL */}
      <AnimatePresence>
        {inspectRecord && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl max-h-[90vh] bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-white"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-200 dark:border-dark-800 flex items-center justify-between bg-slate-50/50 dark:bg-dark-950/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-500">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold flex items-center gap-2">
                      <span>{inspectRecord.name}</span>
                      {getStatusBadge(inspectRecord.status)}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {inspectRecord.arenaBadge} • {inspectRecord.arenaTitle}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setInspectRecord(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-dark-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 text-xs font-mono">
                {/* 3 Metric Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 text-center">
                    <span className="text-slate-500 dark:text-slate-400 text-[10px] block">TAB SWITCHES</span>
                    <span className="text-xl font-black text-rose-500">{inspectRecord.tabSwitchesCount}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 text-center">
                    <span className="text-slate-500 dark:text-slate-400 text-[10px] block">CODE PASTES</span>
                    <span className="text-xl font-black text-amber-500">{inspectRecord.pasteCount}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 text-center">
                    <span className="text-slate-500 dark:text-slate-400 text-[10px] block">TIME RECORDED</span>
                    <span className="text-xl font-black text-cyan-500">{Math.round(inspectRecord.timeTakenSeconds || 0)}s</span>
                  </div>
                </div>

                {/* Violation Observation */}
                <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 space-y-1.5">
                  <div className="font-bold text-slate-700 dark:text-slate-300 text-[11px] flex items-center justify-between">
                    <span>Heuristic Diagnostic & Observation:</span>
                    {inspectRecord.adminOverridden && (
                      <span className="text-cyan-500 font-bold text-[10px]">Overridden by Admin</span>
                    )}
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-xs">
                    {inspectRecord.reason}
                  </p>
                </div>

                {/* Playback Chronological Events Timeline */}
                <div className="space-y-2">
                  <div className="font-bold text-slate-700 dark:text-slate-300 text-[11px] flex items-center justify-between">
                    <span>Proctoring Event Timeline ({inspectRecord.logs?.length || 0} events)</span>
                    <span className="text-slate-400 text-[10px]">Chronological Playback</span>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800">
                    {inspectRecord.logs && inspectRecord.logs.length > 0 ? (
                      inspectRecord.logs.map((log, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-[11px] py-1 border-b border-slate-200/50 dark:border-dark-800/50 last:border-none">
                          <span className="text-slate-400 text-[10px] shrink-0 font-mono mt-0.5">
                            {log.timestamp}
                          </span>
                          <span
                            className={cn(
                              'px-1.5 py-0.2 rounded text-[10px] font-bold uppercase shrink-0',
                              log.eventType === 'paste'
                                ? 'bg-amber-500/20 text-amber-400'
                                : log.eventType === 'tab_hidden' || log.eventType === 'window_blur'
                                ? 'bg-rose-500/20 text-rose-400'
                                : 'bg-cyan-500/20 text-cyan-400'
                            )}
                          >
                            {log.eventType || 'event'}
                          </span>
                          <span className="text-slate-600 dark:text-slate-300 flex-1">
                            {log.details}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="py-4 text-center text-slate-400">
                        No critical focus loss or clipboard violations logged during session.
                      </div>
                    )}
                  </div>
                </div>

                {/* Submitted Code View (if available) */}
                {inspectRecord.submittedCode && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                      <span>Submitted Solution ({inspectRecord.submittedLanguage || 'Code'})</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(inspectRecord.submittedCode || '');
                          setCopiedCode(true);
                          setTimeout(() => setCopiedCode(false), 2000);
                        }}
                        className="flex items-center gap-1 text-cyan-500 hover:text-cyan-400"
                      >
                        {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                      </button>
                    </div>

                    <pre className="p-3.5 rounded-xl bg-slate-900 text-slate-100 text-[11px] font-mono overflow-x-auto max-h-40 border border-slate-800">
                      <code>{inspectRecord.submittedCode}</code>
                    </pre>
                  </div>
                )}

                {/* Administrative Verdict Override Form */}
                <div className="p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 space-y-3">
                  <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                    Administrative Integrity Ruling:
                  </div>

                  <input
                    type="text"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="Enter reason or explanation for this administrative ruling..."
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-dark-950 border border-slate-300 dark:border-dark-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-500"
                  />

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isUpdating}
                      onClick={() => handleOverrideVerdict(inspectRecord, 'clean')}
                      className="border-emerald-500/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 text-xs font-mono"
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                      Mark Clean 🟢
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isUpdating}
                      onClick={() => handleOverrideVerdict(inspectRecord, 'suspicious')}
                      className="border-amber-500/50 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 text-xs font-mono"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
                      Mark Suspicious ⚠️
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isUpdating}
                      onClick={() => handleOverrideVerdict(inspectRecord, 'flagged')}
                      className="border-rose-500/50 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-xs font-mono"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 mr-1.5" />
                      Flag Violation 🚨
                    </Button>

                    <Button
                      size="sm"
                      variant="danger"
                      disabled={isUpdating}
                      onClick={() => handleOverrideVerdict(inspectRecord, 'disqualified')}
                      className="text-xs font-mono"
                    >
                      <AlertOctagon className="w-3.5 h-3.5 mr-1.5" />
                      Disqualify ⛔
                    </Button>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-200 dark:border-dark-800 bg-slate-50 dark:bg-dark-950 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  Participant ID: {inspectRecord.userId}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInspectRecord(null)}
                  className="font-mono text-xs"
                >
                  Close Inspection
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
