import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { coinService, CoinWalletState } from '../../services/coin.service';
import {
  Flame,
  ArrowRight,
  X,
  CheckCircle2,
  Zap,
  Gift,
  Coins,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../utils/cn';

export interface AnimatedCoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins?: number;
  dailyCoins?: number;
  extraCoins?: number;
  title?: string;
  subtitle?: string;
  badgeText?: string;
  streakCount?: number;
  isBonus?: boolean;
  isDailyStreak?: boolean;
}

export const AnimatedCoinModal: React.FC<AnimatedCoinModalProps> = ({
  isOpen,
  onClose,
  coins = 1,
  dailyCoins = 1,
  extraCoins = 0,
  title = '⚡ DAILY STREAK CLAIMED!',
  subtitle = 'Daily challenge solved & streak secured!',
  badgeText = 'DAILY STREAK REWARD',
  streakCount = 1,
  isBonus = false,
  isDailyStreak = true,
}) => {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<CoinWalletState>(() => coinService.getState());
  const [coinCount, setCoinCount] = useState(0);
  const [showSparkles, setShowSparkles] = useState(false);
  const [isCoinHovered, setIsCoinHovered] = useState(false);

  // Determine bonus state
  const effectiveExtraCoins = extraCoins > 0 ? extraCoins : isBonus ? Math.max(0, coins - 1) : 0;
  const isStreakBonus = isBonus || effectiveExtraCoins > 0 || (isDailyStreak && streakCount % 7 === 0 && streakCount > 0);

  useEffect(() => {
    const unsub = coinService.subscribe(setWallet);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (isOpen) {
      setCoinCount(0);
      setShowSparkles(true);

      // Smooth count-up animation for coins
      const target = coins;
      const stepTime = Math.max(30, Math.floor(500 / target));
      let current = 0;

      const timer = setInterval(() => {
        current += 1;
        if (current >= target) {
          setCoinCount(target);
          clearInterval(timer);
        } else {
          setCoinCount(current);
        }
      }, stepTime);

      return () => {
        clearInterval(timer);
        setShowSparkles(false);
      };
    }
  }, [isOpen, coins]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      
      {/* 1. Golden Aura Glow & Confetti Atmosphere */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-r from-amber-500/20 via-yellow-400/25 to-amber-600/20 rounded-full blur-3xl animate-pulse" />
        
        {showSparkles &&
          Array.from({ length: 26 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full pointer-events-none animate-bounce"
              style={{
                top: `${(i * 19) % 92}%`,
                left: `${(i * 29) % 94}%`,
                width: `${(i % 3) * 3 + 6}px`,
                height: `${(i % 3) * 3 + 6}px`,
                backgroundColor: ['#f59e0b', '#fbbf24', '#10b981', '#6366f1', '#f43f5e', '#38bdf8'][i % 6],
                animationDuration: `${(i % 3) * 0.8 + 1.2}s`,
                animationDelay: `${(i % 5) * 0.15}s`,
                opacity: 0.85,
              }}
            />
          ))}
      </div>

      {/* 2. Main Dialog Box */}
      <div className="relative w-full max-w-sm sm:max-w-md rounded-3xl bg-slate-900/95 border border-amber-500/50 shadow-[0_0_60px_rgba(245,158,11,0.3)] p-6 sm:p-7 text-center text-slate-100 z-10 animate-in zoom-in-95 duration-300 overflow-hidden backdrop-blur-xl">
        
        {/* Subtle Background Radial Mesh */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header Badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 font-mono text-[11px] font-bold uppercase tracking-wider mb-2 shadow-inner">
          {isStreakBonus ? (
            <>
              <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400 animate-bounce" />
              <span>🔥 7-DAY STREAK MEGA BONUS</span>
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>{badgeText}</span>
            </>
          )}
        </div>

        {/* Headline & Subtitle */}
        <h2 className="text-2xl sm:text-[26px] font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-yellow-300 to-amber-400 tracking-tight">
          {isStreakBonus ? '🔥 7-DAY STREAK ACHIEVED!' : title}
        </h2>
        <p className="text-xs text-slate-300 max-w-xs mx-auto mt-1 mb-3 leading-relaxed">
          {isStreakBonus
            ? '🎉 Congratulations on maintaining your 7-Day Daily Streak!'
            : subtitle}
        </p>

        {/* 3. Interactive 3D Spinning Golden NEC Coin */}
        <div
          className="relative my-3 flex items-center justify-center cursor-pointer group"
          onMouseEnter={() => setIsCoinHovered(true)}
          onMouseLeave={() => setIsCoinHovered(false)}
        >
          {/* Orbit rings & pulsating aura */}
          <div className="absolute w-32 h-32 rounded-full bg-amber-500/20 blur-xl group-hover:bg-amber-500/35 transition-all" />
          <div
            className="absolute w-28 h-28 rounded-full border border-dashed border-amber-400/50 animate-spin"
            style={{ animationDuration: '8s' }}
          />

          {/* 3D Realistic Coin Body */}
          <div
            className={cn(
              'relative w-22 h-22 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-yellow-100 via-amber-400 to-amber-600 p-1 shadow-[0_8px_30px_rgba(245,158,11,0.6)] flex items-center justify-center transition-transform duration-300 animate-coin-3d',
              isCoinHovered && 'scale-110 shadow-[0_12px_40px_rgba(245,158,11,0.8)]'
            )}
          >
            {/* Inner Metallic Bevel */}
            <div className="w-full h-full rounded-full bg-gradient-to-tr from-amber-600 via-yellow-500 to-yellow-300 border-2 border-yellow-100 flex flex-col items-center justify-center shadow-inner text-slate-950 font-black select-none">
              <span className="text-2xl sm:text-3xl filter drop-shadow">🪙</span>
              <span className="text-[9.5px] font-mono tracking-widest uppercase font-black text-amber-950 -mt-0.5">NEC</span>
            </div>
          </div>
        </div>

        {/* 4. Reward & Live Balance Card */}
        <div className="mt-2 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-center space-y-1.5">
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider">
            {isStreakBonus ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" style={{ animationDuration: '4s' }} />
                <span>7-Day Mega Reward Credited</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Reward Added to Wallet</span>
              </>
            )}
          </div>

          {/* Large Coin Count */}
          <div className="text-3xl sm:text-4xl font-black text-amber-300 tracking-tight font-mono">
            +{coinCount} NEC {coinCount === 1 ? 'Coin' : 'Coins'}
          </div>

          {/* 7-Day Streak Coins Breakdown: 1 Daily Coin + Extra Bonus Coins */}
          {isStreakBonus && (
            <div className="pt-1 space-y-1">
              <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-200 text-[11.5px] font-mono font-bold shadow-inner">
                <span className="text-yellow-300">{dailyCoins || 1} Daily Coin</span>
                <span className="text-amber-400">+</span>
                <span className="text-orange-300 font-extrabold">{effectiveExtraCoins || 7} Extra Bonus Coins</span>
              </div>
              <p className="text-[11px] text-amber-200 font-medium">
                🎉 Congratulations on maintaining your 7-Day Daily Streak!
              </p>
            </div>
          )}

          {/* Live Wallet Balance */}
          <div className="pt-1 flex items-center justify-center gap-1.5 text-xs text-slate-300 font-mono">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>Wallet Balance:</span>
            <span className="font-bold text-amber-300">{wallet.coins} Coins</span>
          </div>
        </div>

        {/* 5. 7-Day Streak Progress Track Indicator */}
        {isDailyStreak && (
          <div className="mt-3.5 pt-3 border-t border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" /> Coding Streak
              </span>
              <span className="text-orange-300 font-bold">Day {streakCount} of 7</span>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 7 }).map((_, i) => {
                const dayNum = i + 1;
                const isPastOrCurrent = dayNum <= streakCount;
                const isDay7 = dayNum === 7;
                return (
                  <div
                    key={dayNum}
                    className={cn(
                      'py-1 rounded-lg border text-center font-mono text-[9.5px] transition-all flex flex-col items-center justify-center',
                      isPastOrCurrent
                        ? isDay7
                          ? 'bg-amber-500/30 border-amber-400 text-amber-300 font-bold shadow-[0_0_10px_rgba(245,158,11,0.4)] ring-1 ring-amber-400/50'
                          : 'bg-orange-500/20 border-orange-500/50 text-orange-300 font-bold'
                        : 'bg-slate-800/40 border-slate-800/60 text-slate-500'
                    )}
                  >
                    <span>D{dayNum}</span>
                    <span className="text-[11px]">{isDay7 ? '🎁' : isPastOrCurrent ? '✓' : '🪙'}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 6. Action CTA Buttons */}
        <div className="mt-4.5 pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          {/* Primary: Redeem NEC Coins */}
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate(ROUTES.REWARDS);
            }}
            className="group relative w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:via-yellow-300 hover:to-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 overflow-hidden"
          >
            {/* Shimmer sweep */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />
            <Gift className="w-4 h-4 text-slate-950 group-hover:rotate-12 transition-transform" />
            <span className="tracking-wide">Redeem NEC Coins</span>
            <ArrowRight className="w-4 h-4 text-slate-950 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Secondary: Keep Coding */}
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/70 text-slate-300 hover:text-white font-semibold text-sm transition-colors cursor-pointer"
          >
            Keep Coding
          </button>
        </div>

      </div>
    </div>
  );
};
