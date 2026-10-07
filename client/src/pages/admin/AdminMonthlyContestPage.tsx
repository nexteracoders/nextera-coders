import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/ui/Toast';
import {
  monthlyContestService,
  MonthlyContestConfig,
  MonthlyChallenge,
  MonthlyLeaderboardEntry,
} from '../../services/monthlyContest.service';
import {
  Trophy,
  CheckCircle2,
  RefreshCw,
  Edit3,
  ExternalLink,
  RotateCcw,
  Users,
  Settings,
  Trash2,
  Save,
  Crown,
  ShieldAlert,
  Clock,
  AlertTriangle,
  Check,
  X,
  Search,
} from 'lucide-react';
import { cn } from '../../utils/cn';

export const AdminMonthlyContestPage: React.FC = () => {
  useDocumentTitle('Monthly Contest CMS — NextEra Admin');
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [config, setConfig] = useState<MonthlyContestConfig>(() => monthlyContestService.getConfig());
  const [activeTab, setActiveTab] = useState<'challenges' | 'leaderboard' | 'settings' | 'anticheat'>('challenges');
  const [selectedStageId, setSelectedStageId] = useState<number>(1);
  const [editingChallenge, setEditingChallenge] = useState<MonthlyChallenge | null>(null);
  const [inspectingAntiCheat, setInspectingAntiCheat] = useState<MonthlyLeaderboardEntry | null>(null);
  const [antiCheatSearch, setAntiCheatSearch] = useState<string>('');

  // Leaderboard management state
  const [editingEntry, setEditingEntry] = useState<MonthlyLeaderboardEntry | null>(null);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState({
    title: config.title,
    tagline: config.tagline,
    durationHours: config.durationHours,
    prizeFirst: config.prizePool.first,
    prizeSecond: config.prizePool.second,
    prizeThird: config.prizePool.third,
    prizeTop10: config.prizePool.top10,
  });

  // Fetch live contest configuration from database on mount
  useEffect(() => {
    monthlyContestService.fetchLiveConfig().then((liveConfig) => {
      setConfig(liveConfig);
      setSettingsForm({
        title: liveConfig.title,
        tagline: liveConfig.tagline,
        durationHours: liveConfig.durationHours,
        prizeFirst: liveConfig.prizePool.first,
        prizeSecond: liveConfig.prizePool.second,
        prizeThird: liveConfig.prizePool.third,
        prizeTop10: liveConfig.prizePool.top10,
      });
    }).catch(() => {});
  }, []);

  // Difficulty counts across all 18 questions
  const difficultySummary = useMemo(() => {
    let easy = 0;
    let medium = 0;
    let hard = 0;
    let total = 0;

    config.stages.forEach((stage) => {
      stage.challenges.forEach((c) => {
        total++;
        if (c.difficulty === 'Easy') easy++;
        else if (c.difficulty === 'Medium') medium++;
        else if (c.difficulty === 'Hard') hard++;
      });
    });

    return { easy, medium, hard, total };
  }, [config]);

  // Selected stage object
  const selectedStage = useMemo(() => {
    return config.stages.find((s) => s.id === selectedStageId) || config.stages[0];
  }, [config, selectedStageId]);

  // Handle Regenerate Monthly Problems (5 Easy, 10 Medium, 3 Hard)
  const handleRegenerate = () => {
    if (!window.confirm(`Regenerate all 18 problems for ${config.monthName}? This will pick fresh 5 Easy, 10 Medium, and 3 Hard challenges.`)) {
      return;
    }
    const updated = monthlyContestService.regenerateMonthlyProblems(config.monthKey);
    setConfig(updated);
    success(`🔄 Successfully regenerated 18 contest challenges for ${config.monthName}!`);
  };

  // Handle Reset User Attempt (Testing Tool)
  const handleResetMyAttempt = () => {
    monthlyContestService.resetUserAttempt(user?.id);
    success('🔄 Your test attempt was reset to NOT STARTED. You can now test the 72h start & submission flow again!');
  };

  // Save edited challenge
  const handleSaveChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChallenge) return;
    const updated = monthlyContestService.updateChallenge(editingChallenge);
    setConfig(updated);
    setEditingChallenge(null);
    success(`Saved challenge "${editingChallenge.title}"!`);
  };

  // Save edited leaderboard entry
  const handleSaveLeaderboardEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;

    const currentList = config.leaderboard || [];
    const index = currentList.findIndex((item) => item.userId === editingEntry.userId);
    let newList = [...currentList];

    if (index >= 0) {
      newList[index] = { ...editingEntry };
    } else {
      newList.push({ ...editingEntry });
    }

    const updated = monthlyContestService.updateLeaderboard(newList);
    setConfig(updated);
    setEditingEntry(null);
    success(`Updated leaderboard for "${editingEntry.name}"!`);
  };

  // Disqualify/Remove leaderboard entry
  const handleRemoveEntry = (userId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove/disqualify "${name}" from the official leaderboard?`)) {
      return;
    }
    const updated = monthlyContestService.removeLeaderboardEntry(userId);
    setConfig(updated);
    success(`Removed "${name}" from leaderboard.`);
  };

  // Save settings & prize distribution
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updatedConfig = monthlyContestService.updatePrizePool({
        first: Number(settingsForm.prizeFirst),
        second: Number(settingsForm.prizeSecond),
        third: Number(settingsForm.prizeThird),
        top10: Number(settingsForm.prizeTop10),
      });

      updatedConfig.title = settingsForm.title;
      updatedConfig.tagline = settingsForm.tagline;
      updatedConfig.durationHours = Number(settingsForm.durationHours);

      monthlyContestService.saveConfig(updatedConfig);
      setConfig({ ...updatedConfig });
      success('Contest configuration & prize pool updated successfully!');
    } catch {
      toastError('Failed to update contest settings.');
    }
  };

  // Anti-Cheat Participants list & stats
  const antiCheatParticipants = useMemo(() => {
    return monthlyContestService.getAntiCheatParticipants();
  }, [config.leaderboard]);

  const filteredAntiCheat = useMemo(() => {
    if (!antiCheatSearch.trim()) return antiCheatParticipants;
    const q = antiCheatSearch.toLowerCase().trim();
    return antiCheatParticipants.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.username.toLowerCase().includes(q) ||
        p.college.toLowerCase().includes(q) ||
        (p.antiCheat?.status || '').toLowerCase().includes(q)
    );
  }, [antiCheatParticipants, antiCheatSearch]);

  const antiCheatStats = useMemo(() => {
    const list = antiCheatParticipants;
    return {
      total: list.length,
      clean: list.filter((p) => (p.antiCheat?.status || 'clean') === 'clean').length,
      suspicious: list.filter((p) => p.antiCheat?.status === 'suspicious').length,
      flagged: list.filter((p) => p.antiCheat?.status === 'flagged' || p.antiCheat?.status === 'disqualified').length,
    };
  }, [antiCheatParticipants]);

  const handleOverrideStatus = (
    userId: string,
    status: 'clean' | 'suspicious' | 'flagged' | 'disqualified',
    reason?: string
  ) => {
    const updated = monthlyContestService.overrideMonthlyAntiCheatStatus(userId, status, reason);
    setConfig(updated);
    if (inspectingAntiCheat && inspectingAntiCheat.userId === userId) {
      const updatedUser = updated.leaderboard.find((p) => p.userId === userId);
      if (updatedUser) setInspectingAntiCheat(updatedUser);
    }
    success(`Contestant anti-cheat verdict updated to ${status.toUpperCase()}!`);
  };

  const formatSeconds = (sec?: number) => {
    if (!sec || sec <= 0) return '0s';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s}s`;
    const h = Math.floor(m / 60);
    const remM = m % 60;
    if (h === 0) return `${m}m ${s}s`;
    return `${h}h ${remM}m`;
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-mono font-medium mb-2">
            <Trophy className="w-3.5 h-3.5" />
            <span>Official Monthly Championship CMS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            NEC Grand Coding Championship Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Complete management over 18 challenges, official leaderboard, coin rewards, and anti-cheat parameters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/practice/monthly-contest"
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#16171d] border border-slate-200 dark:border-neutral-800 text-xs font-mono font-semibold text-slate-700 dark:text-neutral-200 hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <span>Live Contest View</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            type="button"
            onClick={handleRegenerate}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Regenerate 18 Problems</span>
          </button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        
        <div className="p-4 rounded-2xl bg-white dark:bg-[#14151b] border border-slate-200/90 dark:border-neutral-800 shadow-xs space-y-1">
          <div className="text-[11px] text-slate-500 dark:text-neutral-400 uppercase font-semibold">Active Edition</div>
          <div className="text-xl font-bold text-slate-900 dark:text-white truncate">{config.monthName}</div>
          <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">Automatic Rotation Active</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#14151b] border border-slate-200/90 dark:border-neutral-800 shadow-xs space-y-1">
          <div className="text-[11px] text-slate-500 dark:text-neutral-400 uppercase font-semibold">Contest Window</div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">{config.durationHours} Hours</div>
          <div className="text-[10px] text-slate-500">Per student on-demand</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#14151b] border border-slate-200/90 dark:border-neutral-800 shadow-xs space-y-1">
          <div className="text-[11px] text-slate-500 dark:text-neutral-400 uppercase font-semibold">Prize Pool Bounties</div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400">3,300+ Coins</div>
          <div className="text-[10px] text-slate-500">1st: {config.prizePool.first} • 2nd: {config.prizePool.second} • 3rd: {config.prizePool.third}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#14151b] border border-slate-200/90 dark:border-neutral-800 shadow-xs space-y-1">
          <div className="text-[11px] text-slate-500 dark:text-neutral-400 uppercase font-semibold">Leaderboard Coders</div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {config.leaderboard?.length || 0} Ranked
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <span>Verified Hashes Audited ✓</span>
          </div>
        </div>

      </div>

      {/* Main Admin Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-neutral-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('challenges')}
          className={cn(
            'px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2',
            activeTab === 'challenges'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 hover:bg-slate-200'
          )}
        >
          <Trophy className="w-4 h-4" />
          <span>18 Stage Challenges</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('leaderboard')}
          className={cn(
            'px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2',
            activeTab === 'leaderboard'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 hover:bg-slate-200'
          )}
        >
          <Users className="w-4 h-4" />
          <span>Leaderboard Control ({config.leaderboard?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={cn(
            'px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2',
            activeTab === 'settings'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 hover:bg-slate-200'
          )}
        >
          <Settings className="w-4 h-4" />
          <span>Prizes & Contest Settings</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('anticheat')}
          className={cn(
            'px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2',
            activeTab === 'anticheat'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 hover:bg-slate-200'
          )}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>🛡️ Anti-Cheat Review</span>
        </button>
      </div>

      {/* TAB 1: 18 Stage Challenges View */}
      {activeTab === 'challenges' && (
        <div className="space-y-6">
          {/* Validation Banner & Test Reset Action Strip */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-[#13141a] border border-slate-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-slate-900 dark:text-white font-mono">
                  Contest Strict Validation: {difficultySummary.easy} Easy / {difficultySummary.medium} Medium / {difficultySummary.hard} Hard
                </div>
                <div className="text-slate-500 dark:text-neutral-400 mt-0.5">
                  Code editor anti-cheat is activated with copy-paste prevention enabled.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetMyAttempt}
                className="py-1.5 px-3 rounded-lg bg-white hover:bg-slate-100 dark:bg-[#1e1f26] dark:hover:bg-[#282932] text-xs font-mono text-slate-700 dark:text-neutral-200 border border-slate-200 dark:border-neutral-700 transition-colors cursor-pointer flex items-center gap-1.5"
                title="Reset your submission so you can test again"
              >
                <RotateCcw className="w-3.5 h-3.5 text-blue-500" />
                <span>Reset My Test Attempt</span>
              </button>
            </div>
          </div>

          {/* 4 Stages Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {config.stages.map((stage) => {
              const isSelected = stage.id === selectedStageId;
              const easyCount = stage.challenges.filter((c) => c.difficulty === 'Easy').length;
              const medCount = stage.challenges.filter((c) => c.difficulty === 'Medium').length;
              const hardCount = stage.challenges.filter((c) => c.difficulty === 'Hard').length;

              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => setSelectedStageId(stage.id)}
                  className={cn(
                    'p-4 rounded-2xl border text-left transition-all cursor-pointer relative',
                    isSelected
                      ? 'bg-white dark:bg-[#161720] border-blue-500 shadow-md shadow-blue-500/10'
                      : 'bg-white dark:bg-[#131419] border-slate-200/90 dark:border-neutral-800 hover:border-slate-300'
                  )}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                    <span className="font-bold text-slate-500 uppercase">{stage.badge}</span>
                    <span className="text-blue-600 dark:text-blue-400 font-bold">{stage.challenges.length} Qs</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{stage.name}</h3>
                  <div className="flex items-center gap-1.5 mt-2 font-mono text-[10px] text-slate-500">
                    {easyCount > 0 && <span className="text-emerald-600">{easyCount} Easy</span>}
                    {medCount > 0 && <span className="text-amber-600">{medCount} Med</span>}
                    {hardCount > 0 && <span className="text-rose-600">{hardCount} Hard</span>}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Questions Table inside Selected Stage */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#131419] border border-slate-200/90 dark:border-neutral-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-neutral-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-mono">
                  {selectedStage.name} ({selectedStage.challenges.length} Challenges)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedStage.subtitle}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-neutral-800 text-slate-500 uppercase text-[10px]">
                    <th className="py-3 px-3">#</th>
                    <th className="py-3 px-3">Title & Category</th>
                    <th className="py-3 px-3">Difficulty</th>
                    <th className="py-3 px-3">Slug</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/80">
                  {selectedStage.challenges.map((c, index) => (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-[#1a1b22] transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-500">
                        #{String(index + 1).padStart(2, '0')}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-white">{c.title}</div>
                        <div className="text-[11px] text-slate-500">{c.category}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-md text-[10px] font-bold',
                            c.difficulty === 'Easy'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                              : c.difficulty === 'Medium'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
                          )}
                        >
                          {c.difficulty}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 text-[11px]">
                        /dsa/{c.slug}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/dsa/${c.slug}?contest=monthly`}
                            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-neutral-800 text-slate-600 dark:text-neutral-300"
                            title="Preview Problem with Anti-Cheat"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setEditingChallenge(c)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 cursor-pointer"
                            title="Edit Question"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Leaderboard Control & Coin Distribution */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-6 font-mono text-xs">
          
          {/* Top Leaderboard Summary Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-transparent border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
                <Crown className="w-4 h-4 text-amber-500" />
                <span>Official Leaderboard Management & Coin Distribution</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">
                Admin can edit contestant scores, adjust coins won, verify submission hashes, or disqualify suspicious submissions.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold">
                🥇 1st: {config.prizePool.first} 🪙
              </span>
              <span className="px-3 py-1 rounded-xl bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-slate-300 font-bold">
                🥈 2nd: {config.prizePool.second} 🪙
              </span>
              <span className="px-3 py-1 rounded-xl bg-amber-800/20 text-amber-800 dark:text-amber-400 font-bold">
                🥉 3rd: {config.prizePool.third} 🪙
              </span>
            </div>
          </div>

          {/* Leaderboard Table */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#131419] border border-slate-200/90 dark:border-neutral-800 shadow-sm overflow-hidden space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-neutral-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Contestants Ranking ({config.leaderboard?.length || 0} Registered)
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-neutral-800 text-slate-500 uppercase text-[10px]">
                    <th className="py-3 px-3">Rank</th>
                    <th className="py-3 px-3">Candidate</th>
                    <th className="py-3 px-3">College</th>
                    <th className="py-3 px-3">Solved</th>
                    <th className="py-3 px-3">Score</th>
                    <th className="py-3 px-3">Time</th>
                    <th className="py-3 px-3">Coins Won</th>
                    <th className="py-3 px-3">Integrity</th>
                    <th className="py-3 px-3">Submission Hash</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/80">
                  {config.leaderboard?.map((entry) => (
                    <tr key={entry.userId} className="hover:bg-slate-50 dark:hover:bg-[#1a1b22] transition-colors">
                      <td className="py-3 px-3 font-bold">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-[11px]',
                            entry.rank === 1
                              ? 'bg-amber-400/20 text-amber-500 font-black'
                              : entry.rank === 2
                              ? 'bg-slate-400/20 text-slate-400 font-bold'
                              : entry.rank === 3
                              ? 'bg-amber-700/20 text-amber-600 font-bold'
                              : 'text-slate-500'
                          )}
                        >
                          #{entry.rank}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={entry.avatar}
                            alt={entry.name}
                            className="w-7 h-7 rounded-full object-cover border border-slate-300 dark:border-neutral-700"
                          />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white truncate">{entry.name}</div>
                            <div className="text-[10px] text-slate-500">@{entry.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-500 truncate max-w-[140px]">{entry.college}</td>
                      <td className="py-3 px-3 font-bold text-blue-600 dark:text-blue-400">{entry.problemsSolved}/18</td>
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{entry.score} pts</td>
                      <td className="py-3 px-3 text-slate-500">{entry.finishTime}</td>
                      <td className="py-3 px-3 font-bold text-amber-500">
                        {entry.coinsWon > 0 ? `${entry.coinsWon} 🪙` : '0 🪙'}
                      </td>
                      <td className="py-3 px-3">
                        <span className={cn(
                          'px-2 py-0.5 rounded text-[10px] font-bold',
                          entry.integrityScore >= 95 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        )}>
                          {entry.integrityScore}% Clean
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[10px] text-slate-400">{entry.verifiedSubmissionHash}</td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingEntry(entry)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 cursor-pointer"
                            title="Edit Entry"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveEntry(entry.userId, entry.name)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 cursor-pointer"
                            title="Disqualify Contestant"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: Prizes & Contest Settings */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="p-6 rounded-2xl bg-white dark:bg-[#131419] border border-slate-200/90 dark:border-neutral-800 shadow-sm space-y-6 font-mono text-xs max-w-3xl">
          <div className="border-b border-slate-100 dark:border-neutral-800 pb-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Championship Configuration & Prize Distribution
            </h3>
            <p className="text-slate-500 mt-0.5">
              Control the contest titles, personal countdown sprint duration, and coin prizes.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-slate-500 mb-1">Contest Title</label>
              <input
                type="text"
                value={settingsForm.title}
                onChange={(e) => setSettingsForm({ ...settingsForm, title: e.target.value })}
                className="w-full py-2 px-3 rounded-lg bg-slate-50 dark:bg-[#1f202a] border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-slate-500 mb-1">Tagline</label>
              <input
                type="text"
                value={settingsForm.tagline}
                onChange={(e) => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                className="w-full py-2 px-3 rounded-lg bg-slate-50 dark:bg-[#1f202a] border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-500 mb-1">Duration (Hours)</label>
                <input
                  type="number"
                  value={settingsForm.durationHours}
                  onChange={(e) => setSettingsForm({ ...settingsForm, durationHours: Number(e.target.value) })}
                  className="w-full py-2 px-3 rounded-lg bg-slate-50 dark:bg-[#1f202a] border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-amber-500 font-bold mb-1">🥇 1st Place Coins</label>
                <input
                  type="number"
                  value={settingsForm.prizeFirst}
                  onChange={(e) => setSettingsForm({ ...settingsForm, prizeFirst: Number(e.target.value) })}
                  className="w-full py-2 px-3 rounded-lg bg-slate-50 dark:bg-[#1f202a] border border-amber-500/40 text-amber-500 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">🥈 2nd Place Coins</label>
                <input
                  type="number"
                  value={settingsForm.prizeSecond}
                  onChange={(e) => setSettingsForm({ ...settingsForm, prizeSecond: Number(e.target.value) })}
                  className="w-full py-2 px-3 rounded-lg bg-slate-50 dark:bg-[#1f202a] border border-slate-400/40 text-slate-400 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-amber-600 font-bold mb-1">🥉 3rd Place Coins</label>
                <input
                  type="number"
                  value={settingsForm.prizeThird}
                  onChange={(e) => setSettingsForm({ ...settingsForm, prizeThird: Number(e.target.value) })}
                  className="w-full py-2 px-3 rounded-lg bg-slate-50 dark:bg-[#1f202a] border border-amber-600/40 text-amber-600 font-bold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-500 mb-1">Ranks 4 to 10 Consolation Coins (Each)</label>
              <input
                type="number"
                value={settingsForm.prizeTop10}
                onChange={(e) => setSettingsForm({ ...settingsForm, prizeTop10: Number(e.target.value) })}
                className="w-full py-2 px-3 rounded-lg bg-slate-50 dark:bg-[#1f202a] border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white"
                required
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end">
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-colors cursor-pointer flex items-center gap-2 shadow-md shadow-purple-500/20"
            >
              <Save className="w-4 h-4" />
              <span>Save Configuration</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: Anti-Cheat & Plagiarism Review */}
      {activeTab === 'anticheat' && (
        <div className="space-y-6 font-mono">
          {/* Header & KPI Summary Cards */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-[#13141a] border border-slate-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Monthly Grand Contest Anti-Cheat & Plagiarism Audit
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  Inspect contestant solve times (seconds), tab switch counts, clipboard paste operations, and chronological session event replays.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search contestant or college..."
                  value={antiCheatSearch}
                  onChange={(e) => setAntiCheatSearch(e.target.value)}
                  className="py-1.5 pl-8 pr-3 rounded-xl bg-white dark:bg-[#1a1b23] border border-slate-200 dark:border-neutral-700 text-xs text-slate-900 dark:text-white w-52 sm:w-64 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                />
              </div>
            </div>
          </div>

          {/* KPI Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#14151b] border border-slate-200 dark:border-neutral-800 shadow-xs space-y-1">
              <div className="text-[11px] text-slate-500 uppercase font-semibold">Total Audited</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{antiCheatStats.total}</div>
              <div className="text-[10px] text-slate-400">Contestants with telemetry</div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#14151b] border border-emerald-500/20 dark:border-emerald-500/20 shadow-xs space-y-1">
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 uppercase font-semibold">Verified Clean</div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{antiCheatStats.clean}</div>
              <div className="text-[10px] text-emerald-600/80">0-1 Tab switches, clean</div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#14151b] border border-amber-500/20 dark:border-amber-500/20 shadow-xs space-y-1">
              <div className="text-[11px] text-amber-600 dark:text-amber-400 uppercase font-semibold">Suspicious Activity</div>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{antiCheatStats.suspicious}</div>
              <div className="text-[10px] text-amber-600/80">2-3 Tab switches or pastes</div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#14151b] border border-rose-500/20 dark:border-rose-500/20 shadow-xs space-y-1">
              <div className="text-[11px] text-rose-600 dark:text-rose-400 uppercase font-semibold">Flagged / Disqualified</div>
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{antiCheatStats.flagged}</div>
              <div className="text-[10px] text-rose-600/80">High infractions detected</div>
            </div>
          </div>

          {/* Anti-Cheat Participants Audit Table */}
          <div className="rounded-2xl bg-white dark:bg-[#14151b] border border-slate-200 dark:border-neutral-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#1a1b24] border-b border-slate-200 dark:border-neutral-800 text-slate-500 uppercase text-[10.5px]">
                    <th className="py-3 px-4 font-bold">Rank & Contestant</th>
                    <th className="py-3 px-4 font-bold">Score & Solved</th>
                    <th className="py-3 px-4 font-bold">Solve Duration</th>
                    <th className="py-3 px-4 font-bold">Tab Switches</th>
                    <th className="py-3 px-4 font-bold">Pastes</th>
                    <th className="py-3 px-4 font-bold">Anti-Cheat Verdict</th>
                    <th className="py-3 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/60">
                  {filteredAntiCheat.map((p) => {
                    const ac = p.antiCheat || {
                      tabSwitchesCount: 0,
                      pasteCount: 0,
                      timeTakenSeconds: 3600,
                      status: 'clean' as const,
                      reason: 'Verified',
                      logs: [],
                    };
                    const status = ac.status || 'clean';

                    return (
                      <tr key={p.userId} className="hover:bg-slate-50/70 dark:hover:bg-neutral-800/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              'w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 font-mono',
                              p.rank === 1 ? 'bg-amber-500 text-white shadow-xs' : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400'
                            )}>
                              {p.rank}
                            </span>
                            <img
                              src={p.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                              alt={p.name}
                              className="w-8 h-8 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-neutral-700"
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                                <span>{p.name}</span>
                                {p.rank === 1 && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                              </div>
                              <div className="text-[11px] text-slate-500 truncate">
                                @{p.username} • {p.college || 'Engineering College'}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">{p.problemsSolved} / 18 Solved</div>
                          <div className="text-[11px] text-blue-600 dark:text-blue-400">{p.score} Points</div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {ac.timeTakenSeconds.toLocaleString()}s
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{p.finishTime || formatSeconds(ac.timeTakenSeconds)}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] border',
                              ac.tabSwitchesCount === 0
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                : ac.tabSwitchesCount < 3
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                            )}
                          >
                            <span>{ac.tabSwitchesCount} Switches</span>
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] border',
                              ac.pasteCount === 0
                                ? 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 border-slate-200 dark:border-neutral-700'
                                : ac.pasteCount < 3
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                            )}
                          >
                            <span>{ac.pasteCount} Pastes</span>
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] border uppercase',
                              status === 'clean'
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                                : status === 'suspicious'
                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30'
                                : status === 'flagged'
                                ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30'
                                : 'bg-red-500/20 text-red-800 dark:text-red-300 border-red-500/40'
                            )}
                          >
                            <span className={cn(
                              'w-1.5 h-1.5 rounded-full',
                              status === 'clean' ? 'bg-emerald-500' : status === 'suspicious' ? 'bg-amber-500' : 'bg-rose-500'
                            )} />
                            <span>{status}</span>
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setInspectingAntiCheat(p)}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-neutral-800 hover:bg-rose-600 hover:text-white text-slate-700 dark:text-neutral-200 font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>Inspect Playback</span>
                          </button>
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

      {/* INSPECT ANTI-CHEAT PLAYBACK MODAL */}
      {inspectingAntiCheat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-mono">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-[#15161e] border border-slate-200 dark:border-neutral-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between bg-slate-50 dark:bg-[#1a1b24] shrink-0">
              <div className="flex items-center gap-3">
                <img
                  src={inspectingAntiCheat.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt={inspectingAntiCheat.name}
                  className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-neutral-700"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {inspectingAntiCheat.name}
                    </h3>
                    <span className="text-xs text-slate-500">(@{inspectingAntiCheat.username})</span>
                    <span className={cn(
                      'px-2 py-0.5 rounded text-[10px] uppercase font-bold border',
                      (inspectingAntiCheat.antiCheat?.status || 'clean') === 'clean'
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                        : (inspectingAntiCheat.antiCheat?.status || 'clean') === 'suspicious'
                        ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                    )}>
                      {inspectingAntiCheat.antiCheat?.status || 'CLEAN'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {inspectingAntiCheat.college} • Rank #{inspectingAntiCheat.rank} • {inspectingAntiCheat.problemsSolved}/18 Solved
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectingAntiCheat(null)}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-neutral-800 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-100/60 dark:bg-[#121319] border-b border-slate-200 dark:border-neutral-800 text-center text-xs shrink-0">
              <div className="p-2 rounded-xl bg-white dark:bg-[#1a1b24] border border-slate-200/60 dark:border-neutral-800/80">
                <div className="text-[10.5px] text-slate-500 uppercase">Solve Time</div>
                <div className="font-bold text-slate-900 dark:text-white text-sm">
                  {inspectingAntiCheat.antiCheat?.timeTakenSeconds.toLocaleString()}s
                </div>
                <div className="text-[10px] text-slate-400">{inspectingAntiCheat.finishTime}</div>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-[#1a1b24] border border-slate-200/60 dark:border-neutral-800/80">
                <div className="text-[10.5px] text-slate-500 uppercase">Tab Switches</div>
                <div className="font-bold text-amber-600 dark:text-amber-400 text-sm">
                  {inspectingAntiCheat.antiCheat?.tabSwitchesCount ?? 0}
                </div>
                <div className="text-[10px] text-slate-400">Focus loss events</div>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-[#1a1b24] border border-slate-200/60 dark:border-neutral-800/80">
                <div className="text-[10.5px] text-slate-500 uppercase">Pastes</div>
                <div className="font-bold text-slate-900 dark:text-white text-sm">
                  {inspectingAntiCheat.antiCheat?.pasteCount ?? 0}
                </div>
                <div className="text-[10px] text-slate-400">Clipboard inserts</div>
              </div>
            </div>

            {/* Modal Body: Playback Timeline */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
              {inspectingAntiCheat.antiCheat?.reason && (
                <div className={cn(
                  'p-3 rounded-xl border text-xs',
                  (inspectingAntiCheat.antiCheat?.status || 'clean') === 'clean'
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300'
                    : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/40 text-rose-800 dark:text-rose-300'
                )}>
                  <strong>Anti-Cheat Verdict Note:</strong> {inspectingAntiCheat.antiCheat?.reason}
                </div>
              )}

              <div>
                <h4 className="text-xs uppercase font-bold text-slate-500 mb-3 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Chronological Session Telemetry Playback</span>
                </h4>

                <div className="relative pl-6 space-y-4 border-l border-slate-200 dark:border-neutral-800 ml-3">
                  {(inspectingAntiCheat.antiCheat?.logs || []).map((log, idx) => (
                    <div key={idx} className="relative">
                      <span className={cn(
                        'absolute -left-[31px] top-1 w-3 h-3 rounded-full border-2 border-white dark:border-[#15161e]',
                        log.severity === 'danger'
                          ? 'bg-rose-500 ring-2 ring-rose-500/20'
                          : log.severity === 'warning'
                          ? 'bg-amber-500 ring-2 ring-amber-500/20'
                          : 'bg-blue-500'
                      )} />
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1a1b24] border border-slate-200/80 dark:border-neutral-800 space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300">
                            {(log.type || log.event || 'EVENT').replace('_', ' ')}
                          </span>
                          <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-xs text-slate-800 dark:text-neutral-200 font-sans">
                          {log.detail || log.details}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer: Admin Override Actions */}
            <div className="p-4 border-t border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-[#1a1b24] flex items-center justify-between shrink-0">
              <div className="text-xs text-slate-500 font-sans">
                Admin Discretion: You can override flags or disqualify participants anytime.
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOverrideStatus(inspectingAntiCheat.userId, 'clean', 'Manually verified as clean by administrator')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-xs transition-colors flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Mark Clean</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOverrideStatus(inspectingAntiCheat.userId, 'suspicious', 'Marked suspicious for further code review')}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs cursor-pointer shadow-xs transition-colors flex items-center gap-1"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Flag Suspicious</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOverrideStatus(inspectingAntiCheat.userId, 'disqualified', 'Disqualified by administrator for plagiarism')}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer shadow-xs transition-colors flex items-center gap-1"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Disqualify</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Challenge Modal */}
      {editingChallenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-white dark:bg-[#161720] border border-slate-200 dark:border-neutral-800 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-mono">
              Edit Stage Challenge: {editingChallenge.title}
            </h3>

            <form onSubmit={handleSaveChallenge} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-slate-500 mb-1">Title</label>
                <input
                  type="text"
                  value={editingChallenge.title}
                  onChange={(e) => setEditingChallenge({ ...editingChallenge, title: e.target.value })}
                  className="w-full py-2 px-3 rounded-lg bg-slate-50 dark:bg-[#1f202a] border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Difficulty</label>
                  <select
                    value={editingChallenge.difficulty}
                    onChange={(e) => setEditingChallenge({ ...editingChallenge, difficulty: e.target.value as any })}
                    className="w-full py-2 px-3 rounded-lg bg-slate-50 dark:bg-[#1f202a] border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">Category</label>
                  <input
                    type="text"
                    value={editingChallenge.category}
                    onChange={(e) => setEditingChallenge({ ...editingChallenge, category: e.target.value })}
                    className="w-full py-2 px-3 rounded-lg bg-slate-50 dark:bg-[#1f202a] border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Slug</label>
                <input
                  type="text"
                  value={editingChallenge.slug}
                  onChange={(e) => setEditingChallenge({ ...editingChallenge, slug: e.target.value })}
                  className="w-full py-2 px-3 rounded-lg bg-slate-50 dark:bg-[#1f202a] border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingChallenge(null)}
                  className="py-2 px-4 rounded-lg border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Leaderboard Entry Modal */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-white dark:bg-[#161720] border border-slate-200 dark:border-neutral-800 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-mono">
              Edit Leaderboard Entry: {editingEntry.name}
            </h3>

            <form onSubmit={handleSaveLeaderboardEntry} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-slate-500 mb-1">Name</label>
                <input
                  type="text"
                  value={editingEntry.name}
                  onChange={(e) => setEditingEntry({ ...editingEntry, name: e.target.value })}
                  className="w-full py-2 px-3 rounded-lg bg-slate-50 dark:bg-[#1f202a] border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Score (Points)</label>
                  <input
                    type="number"
                    value={editingEntry.score}
                    onChange={(e) => setEditingEntry({ ...editingEntry, score: Number(e.target.value) })}
                    className="w-full py-2 px-3 rounded-lg bg-slate-50 dark:bg-[#1f202a] border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">Problems Solved (Max 18)</label>
                  <input
                    type="number"
                    max={18}
                    min={0}
                    value={editingEntry.problemsSolved}
                    onChange={(e) => setEditingEntry({ ...editingEntry, problemsSolved: Number(e.target.value) })}
                    className="w-full py-2 px-3 rounded-lg bg-slate-50 dark:bg-[#1f202a] border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">College</label>
                  <input
                    type="text"
                    value={editingEntry.college}
                    onChange={(e) => setEditingEntry({ ...editingEntry, college: e.target.value })}
                    className="w-full py-2 px-3 rounded-lg bg-slate-50 dark:bg-[#1f202a] border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">Integrity Score (%)</label>
                  <input
                    type="number"
                    max={100}
                    min={0}
                    value={editingEntry.integrityScore}
                    onChange={(e) => setEditingEntry({ ...editingEntry, integrityScore: Number(e.target.value) })}
                    className="w-full py-2 px-3 rounded-lg bg-slate-50 dark:bg-[#1f202a] border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingEntry(null)}
                  className="py-2 px-4 rounded-lg border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold cursor-pointer"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
