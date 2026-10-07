import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { Button } from '../../../components/ui/Button';
import { monthlyContestService, MonthlyLeaderboardEntry } from '../../../services/monthlyContest.service';
import { MonthlyContestRulebookModal } from '../../../components/contest/MonthlyContestRulebookModal';
import {
  Trophy,
  Flame,
  ArrowRight,
  BookOpen,
  Crown,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export const MonthlyGrandContestSection: React.FC = () => {
  const [config] = useState(() => monthlyContestService.getConfig());
  const [champion] = useState<MonthlyLeaderboardEntry>(() => monthlyContestService.getRankOneChampion());
  const [isRulebookOpen, setIsRulebookOpen] = useState(false);

  return (
    <section className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Compact High-Aesthetic Cyberpunk Banner */}
      <div className="relative p-[1.5px] rounded-3xl bg-gradient-to-r from-amber-500/40 via-purple-500/30 to-blue-500/40 shadow-xl overflow-hidden">
        
        {/* Subtle Ambient Background Blob */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative rounded-[22px] bg-white/95 dark:bg-[#0f1117]/95 backdrop-blur-xl p-4 sm:p-7 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-center">
            
            {/* Left Column: Title, Quick Prize Summary & CTAs */}
            <div className="lg:col-span-7 space-y-3 sm:space-y-3.5 text-center lg:text-left">
              
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[11px] sm:text-xs font-mono font-bold uppercase">
                <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>Monthly Championship • {config.monthName}</span>
              </div>

              {/* Main Title */}
              <h2 className="text-xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                <span>NEC Grand</span>{' '}
                <span className="bg-gradient-to-r from-amber-500 via-rose-500 to-blue-600 bg-clip-text text-transparent">
                  Coding Championship
                </span>
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-300 font-sans max-w-xl">
                Solve 18 curated challenges in a 72-hour personal window. Top performers conquer the leaderboard and win real NEC Coins!
              </p>

              {/* In-Short Prize Strip */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-1.5 sm:gap-2 pt-1 font-mono text-[11px] sm:text-xs">
                <div className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold flex items-center gap-1">
                  <span>🥇 1st:</span>
                  <span className="underline decoration-amber-500/50">1,800 🪙</span>
                </div>

                <div className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-xl bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1">
                  <span>🥈 2nd:</span>
                  <span>1,000 🪙</span>
                </div>

                <div className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-xl bg-amber-700/10 dark:bg-amber-700/20 border border-amber-700/30 text-amber-800 dark:text-amber-400 font-bold flex items-center gap-1">
                  <span>🥉 3rd:</span>
                  <span>500 🪙</span>
                </div>
              </div>

              {/* In-Short Action CTAs */}
              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-3">
                <Link to={ROUTES.MONTHLY_CONTEST}>
                  <Button
                    variant="primary"
                    size="sm"
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    className="font-mono text-[11px] sm:text-xs font-bold shadow-md shadow-blue-500/20 px-3 sm:px-4 py-1.5 sm:py-2"
                  >
                    Enter Contest →
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<BookOpen className="w-3.5 h-3.5 text-amber-500" />}
                  onClick={() => setIsRulebookOpen(true)}
                  className="font-mono text-[11px] sm:text-xs px-3 sm:px-4 py-1.5 sm:py-2"
                >
                  Rulebook 📖
                </Button>

                <Link to={`${ROUTES.MONTHLY_CONTEST}?tab=leaderboard`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Trophy className="w-3.5 h-3.5 text-blue-500" />}
                    className="font-mono text-[11px] sm:text-xs text-blue-600 dark:text-blue-400 px-2.5 sm:px-3 py-1.5 sm:py-2"
                  >
                    Leaderboard 🏆
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Column: Compact Winner Showcase Card */}
            <div className="lg:col-span-5">
              <div className="relative p-[1.5px] rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-600 shadow-lg shadow-amber-500/10">
                <div className="rounded-[15px] bg-slate-950 text-white p-4 space-y-3">
                  
                  {/* Top Header of Card */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-amber-400">
                      <Crown className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                      <span>Current #1 Champion</span>
                    </div>

                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold">
                      1,800 🪙 Won
                    </span>
                  </div>

                  {/* Champion Profile Details */}
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <img
                        src={champion.avatar}
                        alt={champion.name}
                        className="w-12 h-12 rounded-xl object-cover border border-amber-400 shadow-md ring-2 ring-amber-500/30"
                      />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded bg-amber-500 text-slate-950 font-black text-[9px] flex items-center justify-center">
                        #1
                      </div>
                    </div>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-1">
                        <span className="font-black text-sm text-white truncate">
                          {champion.name}
                        </span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 fill-blue-400 text-slate-950 shrink-0" />
                      </div>

                      <p className="text-[11px] text-amber-400/90 font-mono truncate">
                        {champion.college}
                      </p>

                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                        <span>18/18 Cleared</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-semibold">100% Anti-Cheat Clean ✓</span>
                      </div>
                    </div>

                    <Link
                      to={`${ROUTES.MONTHLY_CONTEST}?tab=leaderboard`}
                      className="text-amber-400 hover:text-amber-300 p-1.5 rounded-lg hover:bg-slate-900 transition-colors"
                      title="View on Leaderboard"
                    >
                      <Sparkles className="w-4 h-4" />
                    </Link>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Official Rulebook Modal */}
      <MonthlyContestRulebookModal
        isOpen={isRulebookOpen}
        onClose={() => setIsRulebookOpen(false)}
        monthName={config.monthName}
      />
    </section>
  );
};
