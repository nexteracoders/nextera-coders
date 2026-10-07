import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import {
  Crown,
  Coins,
  ShieldCheck,
  Percent,
  AlertTriangle,
  Sparkles,
  Trophy,
  Users,
  RefreshCw,
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface PrimeDuelRulebookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrimeDuelRulebookModal: React.FC<PrimeDuelRulebookModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'staking' | 'tiers' | 'refunds' | 'fairplay'>('staking');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="NEC Prime Battle • Official Staking & Prize Rules"
      maxWidth="xl"
      className="max-w-2xl sm:max-w-3xl"
    >
      <div className="space-y-5 text-slate-800 dark:text-neutral-200 max-h-[75vh] overflow-y-auto pr-1">
        {/* Top Header Banner */}
        <div className="relative p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-yellow-950/30 to-amber-900/40 border border-amber-500/40 overflow-hidden">
          <div className="absolute -right-8 -top-8 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-start gap-3.5 relative z-10">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 text-stone-950 flex items-center justify-center font-black shrink-0 shadow-lg shadow-amber-500/25">
              <Crown className="w-6 h-6 fill-stone-950/20" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-700 dark:text-amber-300 font-mono text-[10.5px] font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>NextEra Coders • Prime VIP Arena</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                NEC Prime Battles: Staked Coins & Winner Tier Distribution
              </h3>
              <p className="text-xs text-slate-600 dark:text-neutral-300 mt-1">
                High-stakes competitive coding where students stake NEC Coins, pass tests under pressure, and take home the collective prize pool.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-100 dark:bg-neutral-900/80 border border-slate-200 dark:border-neutral-800 text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('staking')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap',
              activeTab === 'staking'
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/25'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Coin Staking & 10% Cut</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tiers')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap',
              activeTab === 'tiers'
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/25'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>Winner Payout Tiers</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('refunds')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap',
              activeTab === 'refunds'
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/25'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>100% Cancellation Refunds</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('fairplay')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap',
              activeTab === 'fairplay'
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/25'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Fair Play & Anti-Cheat</span>
          </button>
        </div>

        {/* Tab 1: Staking & 10% Cut */}
        {activeTab === 'staking' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50">
              <h4 className="font-bold text-amber-900 dark:text-amber-300 text-sm flex items-center gap-2 mb-2">
                <Coins className="w-4 h-4 text-amber-500" />
                Minimum Stake & Pot Calculation
              </h4>
              <ul className="space-y-2 text-slate-700 dark:text-neutral-300 leading-relaxed list-disc pl-4">
                <li>
                  <strong>Minimum Stake:</strong> Every player must stake at least <span className="text-amber-600 dark:text-amber-400 font-bold">50 NEC Coins</span> to join or create a battle.
                </li>
                <li>
                  <strong>Equal Entry:</strong> All battle participants stake the identical coin amount chosen by the host.
                </li>
                <li>
                  <strong>Total Gross Pot:</strong> Computed as <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-neutral-800 font-mono">EntryFee × ParticipantCount</code>.
                </li>
                <li>
                  <strong>10% Platform Commission:</strong> Exactly 10% is deducted from the gross pot for platform hosting, security & prize bounties.
                </li>
                <li>
                  <strong>Net Prize Pool (90%):</strong> The entire remaining 90% is shared directly among top finishers according to official payout tiers.
                </li>
              </ul>
            </div>

            {/* Example Calculation Box */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Real Example (5 Players @ 150 Coins Each)
              </span>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2.5 rounded-lg bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700">
                  <div className="text-slate-500 dark:text-neutral-400 text-[10px]">Gross Pot</div>
                  <div className="text-sm font-black text-slate-900 dark:text-white">750 🪙</div>
                  <div className="text-[9px] text-slate-400">5 × 150</div>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-neutral-800 border border-amber-300 dark:border-amber-700/50">
                  <div className="text-amber-600 dark:text-amber-400 text-[10px]">10% Platform Fee</div>
                  <div className="text-sm font-black text-amber-600 dark:text-amber-400">-75 🪙</div>
                  <div className="text-[9px] text-slate-400">10% of 750</div>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-700/50">
                  <div className="text-emerald-700 dark:text-emerald-400 text-[10px]">Net Prize Pool</div>
                  <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">675 🪙</div>
                  <div className="text-[9px] text-slate-400">Shared among winners</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Winner Payout Tiers */}
        {activeTab === 'tiers' && (
          <div className="space-y-4 text-xs">
            <p className="text-slate-600 dark:text-neutral-400">
              Prize distribution is strictly determined by the number of battle participants:
            </p>

            <div className="space-y-3">
              {/* 2 Players */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-blue-500" />
                    2 Players (1vs1 Duel)
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold text-[10px]">
                    1 Winner
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                    <Trophy className="w-4 h-4" /> 1st Place (Champion)
                  </span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">100% of Net Pool</span>
                </div>
              </div>

              {/* 3 to 5 Players */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-amber-500" />
                    3 to 5 Players (Squad Battle)
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-bold text-[10px]">
                    Top 2 Winners
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 font-semibold">
                    <span className="text-amber-600 dark:text-amber-400">🥇 1st Place</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400">65% of Net Pool</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 font-semibold">
                    <span className="text-slate-600 dark:text-neutral-300">🥈 2nd Place</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400">35% of Net Pool</span>
                  </div>
                </div>
              </div>

              {/* 6 to 10 Players */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-purple-500" />
                    6 to 10 Players (Prime Grand Royale)
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold text-[10px]">
                    Top 3 Winners
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 rounded-lg bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 font-semibold text-center">
                    <div className="text-amber-600 dark:text-amber-400 text-[11px]">🥇 1st Place</div>
                    <div className="font-black text-emerald-600 dark:text-emerald-400 text-xs">50%</div>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 font-semibold text-center">
                    <div className="text-slate-600 dark:text-neutral-300 text-[11px]">🥈 2nd Place</div>
                    <div className="font-black text-emerald-600 dark:text-emerald-400 text-xs">30%</div>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 font-semibold text-center">
                    <div className="text-amber-700 dark:text-amber-600 text-[11px]">🥉 3rd Place</div>
                    <div className="font-black text-emerald-600 dark:text-emerald-400 text-xs">20%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: 100% Cancellation Refunds */}
        {activeTab === 'refunds' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50">
              <h4 className="font-bold text-emerald-900 dark:text-emerald-300 text-sm flex items-center gap-2 mb-2">
                <RefreshCw className="w-4 h-4 text-emerald-500" />
                Guaranteed 100% Refund Protection
              </h4>
              <ul className="space-y-2 text-slate-700 dark:text-neutral-300 leading-relaxed list-disc pl-4">
                <li>
                  <strong>Lobby Cancellation:</strong> If the room creator cancels a waiting lobby before the countdown starts, all participants instantly receive 100% of their staked coins back into their wallet.
                </li>
                <li>
                  <strong>Leaving Waiting Lobby:</strong> Any player who chooses to leave a waiting room before the battle begins receives a full 100% refund.
                </li>
                <li>
                  <strong>Matchmaking Timeout:</strong> If matchmaking cannot find opponents within the queue window, your stake is returned immediately.
                </li>
                <li>
                  <strong>Admin Cancel & Refund:</strong> If a technical issue occurs, Platform Admins can cancel the battle from the Admin Panel, triggering atomic 100% coin refunds to every participant's account.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Tab 4: Fair Play */}
        {activeTab === 'fairplay' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/50">
              <h4 className="font-bold text-rose-900 dark:text-rose-300 text-sm flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                Strict Integrity & Zero Tolerance
              </h4>
              <ul className="space-y-2 text-slate-700 dark:text-neutral-300 leading-relaxed list-disc pl-4">
                <li>
                  <strong>In-Battle Forfeit:</strong> Once the timer begins, leaving or closing your browser tab forfeits your entry stake. The battle continues for the remaining competitors.
                </li>
                <li>
                  <strong>Sandboxed Real-Time Execution:</strong> All submissions are compiled and judged against private unit tests with strict execution timeouts (3s) and memory caps.
                </li>
                <li>
                  <strong>Automated Audit Logs:</strong> All coin deductions, refunds, and payouts are logged on the server ledger with immutable transaction IDs.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="pt-2 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-neutral-400">
          <span>Stakes are final once the battle countdown reaches 00:00.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-sm shadow-blue-500/25 cursor-pointer"
          >
            I Understand
          </button>
        </div>
      </div>
    </Modal>
  );
};
