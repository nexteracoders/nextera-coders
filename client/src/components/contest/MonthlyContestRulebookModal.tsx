import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import {
  Trophy,
  ShieldCheck,
  Timer,
  Award,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Zap,
  BookOpen,
  Sparkles,
  Layers,
  Flame,
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface MonthlyContestRulebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthName?: string;
}

export const MonthlyContestRulebookModal: React.FC<MonthlyContestRulebookModalProps> = ({
  isOpen,
  onClose,
  monthName = 'Current Month',
}) => {
  const [activeTab, setActiveTab] = useState<'rewards' | 'format' | 'anticheat' | 'scoring'>('rewards');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official Contest Rulebook"
      maxWidth="xl"
    >
      <div className="space-y-6 text-slate-800 dark:text-slate-200">
        
        {/* Header Banner */}
        <div className="relative p-5 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border border-blue-500/30 overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-start gap-3.5 relative z-10">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-lg shadow-amber-500/20">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 font-mono text-[10.5px] font-bold uppercase tracking-wider mb-1">
                <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span>NextEra Grand Coding Championship • {monthName}</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                Official Regulations, Rewards & Integrity Charter
              </h3>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                Please review all competition rules thoroughly before initiating your 72-hour window.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#151722] border border-slate-200 dark:border-neutral-800 overflow-x-auto text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveTab('rewards')}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap',
              activeTab === 'rewards'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Leaderboard Rewards</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('format')}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap',
              activeTab === 'format'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <Timer className="w-3.5 h-3.5" />
            <span>72h Timer & Stages</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('anticheat')}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap',
              activeTab === 'anticheat'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Anti-Cheat & Trust</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('scoring')}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap',
              activeTab === 'scoring'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Scoring Rules</span>
          </button>
        </div>

        {/* Tab 1: Leaderboard Coin Rewards */}
        {activeTab === 'rewards' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase font-mono tracking-wider">
              Podium Bounties & Prize Distribution
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Rank 1 */}
              <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-500/15 to-amber-500/5 border-2 border-amber-500/50 relative overflow-hidden text-center space-y-2">
                <div className="absolute top-2 right-2 text-lg">👑</div>
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 font-black text-sm flex items-center justify-center mx-auto shadow-md shadow-amber-500/30">
                  #1
                </div>
                <div>
                  <div className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">1st Place Champion</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">1,800 🪙</div>
                  <div className="text-[10px] text-slate-500 dark:text-neutral-400 font-mono">NEC Coins Credited</div>
                </div>
                <ul className="text-[11px] text-left text-slate-600 dark:text-neutral-300 space-y-1 pt-1 border-t border-amber-500/20">
                  <li className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                    <span>Home Page Winner Spotlight</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Award className="w-3 h-3 text-amber-500 shrink-0" />
                    <span>Grandmaster Gold Badge</span>
                  </li>
                </ul>
              </div>

              {/* Rank 2 */}
              <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-300/15 to-slate-400/5 border-2 border-slate-300/60 dark:border-slate-600/50 text-center space-y-2">
                <div className="w-9 h-9 rounded-xl bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-white font-black text-sm flex items-center justify-center mx-auto shadow-sm">
                  #2
                </div>
                <div>
                  <div className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">2nd Place Runner-Up</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">1,000 🪙</div>
                  <div className="text-[10px] text-slate-500 dark:text-neutral-400 font-mono">NEC Coins Credited</div>
                </div>
                <ul className="text-[11px] text-left text-slate-600 dark:text-neutral-300 space-y-1 pt-1 border-t border-slate-300/30">
                  <li className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>Leaderboard Silver Podium</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Award className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>Master Elite Badge</span>
                  </li>
                </ul>
              </div>

              {/* Rank 3 */}
              <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-700/15 to-amber-800/5 border-2 border-amber-700/40 dark:border-amber-700/50 text-center space-y-2">
                <div className="w-9 h-9 rounded-xl bg-amber-700 text-white font-black text-sm flex items-center justify-center mx-auto shadow-sm">
                  #3
                </div>
                <div>
                  <div className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400">3rd Place Podium</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">500 🪙</div>
                  <div className="text-[10px] text-slate-500 dark:text-neutral-400 font-mono">NEC Coins Credited</div>
                </div>
                <ul className="text-[11px] text-left text-slate-600 dark:text-neutral-300 space-y-1 pt-1 border-t border-amber-700/20">
                  <li className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
                    <span>Bronze Medalist Profile</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Award className="w-3 h-3 text-amber-600 shrink-0" />
                    <span>Expert Challenger Badge</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Guaranteed 100% Completion Callout */}
            <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-blue-700 dark:text-blue-300">100% Grand Completion Guarantee: </span>
                <span className="text-slate-600 dark:text-neutral-300">
                  Any participant who conquers all 18 challenges within their 72-hour window unlocks the guaranteed 1,800 NEC Coins completion bounty into their wallet!
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: 72h Timer & Stages */}
        {activeTab === 'format' && (
          <div className="space-y-4 animate-in fade-in duration-200 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#14161f] border border-slate-200 dark:border-neutral-800 space-y-1">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold">
                  <Timer className="w-4 h-4" />
                  <span>Personal 72-Hour Window</span>
                </div>
                <p className="text-slate-600 dark:text-neutral-300 font-sans text-[11.5px] leading-relaxed">
                  The contest does not require everyone to code at the same exact second. Your 72-hour timer begins on-demand when you click "Start Contest".
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#14161f] border border-slate-200 dark:border-neutral-800 space-y-1">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold">
                  <Lock className="w-4 h-4" />
                  <span>Single Monthly Submission</span>
                </div>
                <p className="text-slate-600 dark:text-neutral-300 font-sans text-[11.5px] leading-relaxed">
                  Each coder is allowed exactly <strong>one official submission</strong> per calendar month. Once finalized, your official score cannot be changed.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-mono font-bold text-slate-700 dark:text-neutral-300 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-500" />
                <span>4 Progressive Stages Breakdown (18 Questions Total)</span>
              </div>

              <div className="space-y-2 font-mono text-[11.5px]">
                <div className="p-2.5 rounded-xl bg-white dark:bg-[#11131a] border border-slate-200 dark:border-neutral-800 flex items-center justify-between">
                  <span className="font-bold text-amber-500">Stage 1: Foundation Sprint</span>
                  <span className="text-slate-500">5 Problems (3 Easy, 2 Medium)</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-[#11131a] border border-slate-200 dark:border-neutral-800 flex items-center justify-between">
                  <span className="font-bold text-blue-500">Stage 2: Algorithmic Core</span>
                  <span className="text-slate-500">5 Problems (1 Easy, 4 Medium)</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-[#11131a] border border-slate-200 dark:border-neutral-800 flex items-center justify-between">
                  <span className="font-bold text-purple-500">Stage 3: Advanced Optimization</span>
                  <span className="text-slate-500">4 Problems (1 Easy, 2 Med, 1 Hard)</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-[#11131a] border border-slate-200 dark:border-neutral-800 flex items-center justify-between">
                  <span className="font-bold text-rose-500">Stage 4: Grandmaster Summit</span>
                  <span className="text-slate-500">4 Problems (2 Medium, 2 Hard)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Anti-Cheat & Trust */}
        {activeTab === 'anticheat' && (
          <div className="space-y-3.5 animate-in fade-in duration-200 text-xs">
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300 space-y-2">
              <div className="flex items-center gap-2 font-bold font-mono text-sm">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>Zero-Tolerance Integrity Charter</span>
              </div>
              <p className="leading-relaxed text-[11.5px]">
                NextEra Coders maintains a strict anti-cheat proctoring protocol to protect legitimate student effort, ensure authentic recruitment benchmarking, and validate authentic leaderboard rewards.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#14161f] border border-slate-200 dark:border-neutral-800 space-y-1">
                <div className="font-bold font-mono text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-500" />
                  <span>Copy-Paste Prohibited</span>
                </div>
                <p className="text-slate-600 dark:text-neutral-300 text-[11px] leading-relaxed">
                  The contest code editor has native clipboard pasting locked. All code logic must be hand-typed by the candidate.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#14161f] border border-slate-200 dark:border-neutral-800 space-y-1">
                <div className="font-bold font-mono text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Tab Switch & Focus Logging</span>
                </div>
                <p className="text-slate-600 dark:text-neutral-300 text-[11px] leading-relaxed">
                  Window focus loss and tab switching are monitored in real time. Excessive strikes reduce your Proctoring Trust Score.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#14161f] border border-slate-200 dark:border-neutral-800 space-y-1">
                <div className="font-bold font-mono text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Cryptographic Hash Receipt</span>
                </div>
                <p className="text-slate-600 dark:text-neutral-300 text-[11px] leading-relaxed">
                  Each solved problem generates an immutable verification hash (e.g. <code>NEC-MGC-88A1F</code>) confirming timestamp and test pass authenticity.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#14161f] border border-slate-200 dark:border-neutral-800 space-y-1">
                <div className="font-bold font-mono text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-500" />
                  <span>Automatic Blue Tick</span>
                </div>
                <p className="text-slate-600 dark:text-neutral-300 text-[11px] leading-relaxed">
                  Problems verified by the cloud compiler immediately display the official verified Blue Tick on the stage dashboard.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Scoring Rules */}
        {activeTab === 'scoring' && (
          <div className="space-y-3.5 animate-in fade-in duration-200 text-xs leading-relaxed">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#14161f] border border-slate-200 dark:border-neutral-800 space-y-2">
              <h4 className="font-bold font-mono text-slate-900 dark:text-white">
                Leaderboard Ranking Hierarchy:
              </h4>
              <ol className="list-decimal pl-5 space-y-1.5 text-slate-600 dark:text-neutral-300 text-[11.5px]">
                <li>
                  <strong>Challenges Solved (Primary Criterion):</strong> Coders with more solved problems always rank above coders with fewer solves (e.g., 18/18 &gt; 17/18).
                </li>
                <li>
                  <strong>Score Points (Secondary):</strong> Easy = 100 pts, Medium = 250 pts, Hard = 500 pts.
                </li>
                <li>
                  <strong>Time Taken (Tie-Breaker):</strong> If two coders solve the same count with equal score, the coder who finished in less cumulative time takes the higher rank.
                </li>
                <li>
                  <strong>Integrity Trust Score:</strong> Submissions with 100% clean audit pass are prioritized in final award validation.
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-neutral-800 font-mono text-xs">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer"
          >
            I Understand & Agree
          </button>
        </div>

      </div>
    </Modal>
  );
};
