import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import {
  Swords,
  Users,
  Timer,
  Trophy,
  Coins,
  Shield,
  ShieldCheck,
  AlertTriangle,
  Zap,
  MessageSquare,
  Bot,
  Sparkles,
  CheckCircle2,
  Crown,
  Wifi,
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface CodeDuelRulebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminMaxParticipants?: number;
}

export const CodeDuelRulebookModal: React.FC<CodeDuelRulebookModalProps> = ({
  isOpen,
  onClose,
  adminMaxParticipants = 4,
}) => {
  const [activeTab, setActiveTab] = useState<
    'formats' | 'arena' | 'connectivity' | 'scoring' | 'fairplay'
  >('formats');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official Code Duel Rulebook"
      maxWidth="xl"
      className="max-w-2xl sm:max-w-3xl"
    >
      <div className="space-y-5 text-slate-800 dark:text-neutral-200 max-h-[75vh] overflow-y-auto pr-1">
        {/* Top Header Banner */}
        <div className="relative p-5 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-violet-900/40 border border-blue-500/30 overflow-hidden">
          <div className="absolute -right-8 -top-8 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-start gap-3.5 relative z-10">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white flex items-center justify-center font-black shrink-0 shadow-lg shadow-cyan-500/25">
              <Swords className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-700 dark:text-cyan-300 font-mono text-[10.5px] font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>NextEra Coders • Official Arena Regulations</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                NEC Code Battle: Official Rulebook & Guidelines
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                Everything you need to know about 1vs1 free duels, squad battles, matchmaking queues, live radar, and rewards.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#151722] border border-slate-200 dark:border-neutral-800 overflow-x-auto text-xs font-mono scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('formats')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap',
              activeTab === 'formats'
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/25'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <Users className="w-3.5 h-3.5" />
            <span>1. Match Formats</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('arena')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap',
              activeTab === 'arena'
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/25'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <Timer className="w-3.5 h-3.5" />
            <span>2. Arena Mechanics</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('connectivity')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap',
              activeTab === 'connectivity'
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/25'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>3. Rejoin & Disconnects</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('scoring')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap',
              activeTab === 'scoring'
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/25'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>4. Scoring & Victory</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('fairplay')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap',
              activeTab === 'fairplay'
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/25'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>5. Chat & Fair Play</span>
          </button>
        </div>

        {/* Tab Content 1: MATCH FORMATS & TEAM SIZES */}
        {activeTab === 'formats' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#151828] border border-slate-200 dark:border-neutral-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-cyan-400 flex items-center justify-center font-mono font-black text-xs">
                    1v1
                  </div>
                  <span>Quick Match (1-Click Pairing)</span>
                </div>
                <p className="text-slate-600 dark:text-neutral-400 leading-relaxed">
                  Join a live pool of competitive programmers. The platform searches for an available online opponent with comparable rating for exactly <strong>30 seconds</strong>.
                </p>
                <div className="flex items-center gap-1 text-[11px] text-cyan-600 dark:text-cyan-400 font-mono font-semibold">
                  <Zap className="w-3.5 h-3.5 shrink-0" />
                  <span>Immediate start once matched</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#151828] border border-slate-200 dark:border-neutral-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-mono font-black text-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                  <span>NEC AI Challenger (Timeout Fallback)</span>
                </div>
                <p className="text-slate-600 dark:text-neutral-400 leading-relaxed">
                  If no human opponent joins within 30 seconds, you can choose <strong>"Join with NEC AI"</strong>. NEC AI acts as a high-skill sparring partner that codes in real-time, passes test cases, and offers stiff competition.
                </p>
                <div className="flex items-center gap-1 text-[11px] text-purple-600 dark:text-purple-400 font-mono font-semibold">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>Never wait indefinitely for a match</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#151828] border border-slate-200 dark:border-neutral-800 space-y-2 sm:col-span-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    <div className="w-7 h-7 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center font-mono font-black text-xs">
                      <Users className="w-4 h-4" />
                    </div>
                    <span>Private Duel Rooms & Squad Battles (Team Size Selection)</span>
                  </div>
                  <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-full bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30 font-extrabold flex items-center gap-1">
                    <Shield className="w-3 h-3 text-violet-500" />
                    <span>Admin Cap: Up to {adminMaxParticipants} Players</span>
                  </span>
                </div>
                <p className="text-slate-600 dark:text-neutral-400 leading-relaxed">
                  Create a custom room and select your battle group size via the <strong>Team Size dropdown (&lt;select&gt;)</strong> or quick option buttons.
                  Options strictly respect the platform administrator limit (e.g., 2 for 1vs1, 3 for Trio, 4 for Squad, up to {adminMaxParticipants} maximum).
                  Share the generated <strong>6-digit Room Code</strong> (e.g. <code>DUEL-9K4P</code>) with your college friends to launch a synchronized squad clash!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 2: ARENA MECHANICS */}
        {activeTab === 'arena' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 border border-violet-500/25 space-y-1.5 text-xs">
              <span className="font-bold text-violet-900 dark:text-violet-200 flex items-center gap-2">
                <Timer className="w-4 h-4 text-violet-500" />
                Synchronized 15:00 Countdown Clock
              </span>
              <p className="text-slate-700 dark:text-neutral-300 leading-relaxed">
                Once the required number of competitors enter the arena (or the host triggers start), the 15-minute countdown clock begins simultaneously for all screens.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#151828] border border-slate-200 dark:border-neutral-800 space-y-1.5">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Identical DSA Challenge
                </span>
                <p className="text-slate-600 dark:text-neutral-400 leading-relaxed">
                  All competitors receive the exact same problem statement, sample test cases, hidden evaluation criteria, and starter boilerplate.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#151828] border border-slate-200 dark:border-neutral-800 space-y-1.5">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-cyan-500" />
                  Live Opponent Radar
                </span>
                <p className="text-slate-600 dark:text-neutral-400 leading-relaxed">
                  The arena broadcasts live typing indicator pulses (<code>✍️ typing</code>) and passed test counts (<code>X/Y Passed</code>) in real-time.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#151828] border border-slate-200 dark:border-neutral-800 space-y-1.5 sm:col-span-2">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-500" />
                  Source Code Privacy During Match
                </span>
                <p className="text-slate-600 dark:text-neutral-400 leading-relaxed">
                  To ensure complete competitive integrity, you can observe an opponent's test case passing speed, but you cannot view their raw code editor until the match has officially concluded.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 3: CONNECTIVITY, REJOIN & DISCONNECTS */}
        {activeTab === 'connectivity' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-amber-500/30 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                <Wifi className="w-4 h-4 text-amber-500" />
                <span>Seamless Rejoin Protection (Browser Crash / Disconnects)</span>
              </div>
              <p className="text-slate-700 dark:text-neutral-300 leading-relaxed">
                Accidentally closed your tab? Laptop battery died? Don't worry! As long as the 15-minute battle is active, your room slot is protected.
                Simply open the <strong>Code Duels Hub</strong> and click the glowing <strong>"⚡ Rejoin Battle Now"</strong> banner, or enter your 6-digit room code to re-enter with your progress and code restored.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#151828] border border-slate-200 dark:border-neutral-800 space-y-1.5">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Active vs Left Member Tracking
                </span>
                <p className="text-slate-600 dark:text-neutral-400 leading-relaxed">
                  The arena displays a live status badge: <code>🟢 X Active • 🔴 Y Left</code>.
                  If an opponent disconnects or leaves, a system warning is instantly broadcast into the in-battle chat stream and radar telemetry.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#151828] border border-slate-200 dark:border-neutral-800 space-y-1.5">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-amber-500" />
                  "Last Coder Standing" Rule
                </span>
                <p className="text-slate-600 dark:text-neutral-400 leading-relaxed">
                  If all other competitors leave the room or surrender, the battle is <strong>NOT</strong> voided.
                  You are crowned the last coder standing and can solve the problem to claim your full <strong>Match Victory</strong>!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 4: SCORING & REWARDS */}
        {activeTab === 'scoring' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/30 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300">
                <Trophy className="w-4 h-4 text-emerald-500" />
                <span>Instant Knockout Victory (100% Free Arena)</span>
              </div>
              <p className="text-slate-700 dark:text-neutral-300 leading-relaxed">
                The first coder to pass <strong>100% of test cases (Sample + Hidden)</strong> instantly triggers victory!
                The battle concludes immediately and the winner is crowned on the leaderboard. NEC Code Battle is completely free with zero coin entry fee and zero coin deduction. (Coin stakes are exclusively reserved for <strong>NEC Prime Battles</strong>).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#151828] border border-slate-200 dark:border-neutral-800 space-y-2 text-xs">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Timer className="w-4 h-4 text-amber-500" />
                What Happens if the 15:00 Clock Expires? (Tiebreaker Protocol)
              </span>
              <p className="text-slate-600 dark:text-neutral-400 leading-relaxed">
                If no coder achieves 100% test pass before 15:00, the server ranks participants according to:
              </p>
              <ol className="list-decimal pl-5 space-y-1 text-slate-700 dark:text-neutral-300 font-medium">
                <li><strong>Highest Test Case Count</strong>: Competitor who passed the most test cases (e.g. 2/3 vs 1/3).</li>
                <li><strong>Speed / Timestamp</strong>: The coder who submitted the earliest working solution.</li>
                <li><strong>Match Outcome</strong>: The top-ranked coder is awarded the match victory and rating boost.</li>
              </ol>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#151828] border border-slate-200 dark:border-neutral-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-500" />
                <span className="font-semibold text-slate-800 dark:text-neutral-200">Public Profile Record:</span>
              </div>
              <span className="text-slate-600 dark:text-neutral-400 text-right">
                Matches fought, total victories, and win rates are permanently recorded on student profiles.
              </span>
            </div>
          </div>
        )}

        {/* Tab Content 5: CHAT & FAIR PLAY CHARTER */}
        {activeTab === 'fairplay' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-500/10 to-red-500/10 border border-rose-500/30 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-rose-800 dark:text-rose-300">
                <ShieldCheck className="w-4 h-4 text-rose-500" />
                <span>NextEra Fair Play & Integrity Charter</span>
              </div>
              <p className="text-slate-700 dark:text-neutral-300 leading-relaxed">
                Code Duels is built for healthy competitive coding. Violations of integrity charter will lead to immediate coin forfeiture and temporary matchmaking bans.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#151828] border border-slate-200 dark:border-neutral-800 space-y-1.5">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                  In-Battle Live Chat Etiquette
                </span>
                <p className="text-slate-600 dark:text-neutral-400 leading-relaxed">
                  Use the bottom-left live chat widget for friendly banter and discussion. Abusive language, hate speech, or harassment results in chat suspension and rating deduction.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#151828] border border-slate-200 dark:border-neutral-800 space-y-1.5">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Anti-Cheat & Tab Monitoring
                </span>
                <p className="text-slate-600 dark:text-neutral-400 leading-relaxed">
                  Excessive tab blurring, switching windows, or pasting large unverified blocks from external sources triggers automated inspection flags.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer Button */}
        <div className="pt-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-[11px] text-slate-500 dark:text-neutral-400 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-violet-500" />
            <span>Platform rules are enforced in real-time by NextEra automated battle engine.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs font-mono transition-all cursor-pointer shadow-md shadow-blue-500/25 active:scale-95 ml-auto"
          >
            Understood &bull; Ready to Battle!
          </button>
        </div>
      </div>
    </Modal>
  );
};
