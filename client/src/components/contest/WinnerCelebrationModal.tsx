import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import {
  Trophy,
  Sparkles,
  ArrowRight,
  X,
  Gift,
  Coins,
} from 'lucide-react';

interface WinnerCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  contestTitle?: string;
  rank?: number;
  coinsAwarded?: number;
}

export const WinnerCelebrationModal: React.FC<WinnerCelebrationModalProps> = ({
  isOpen,
  onClose,
  contestTitle = 'NEC Weekly Contest #42',
  rank = 1,
  coinsAwarded = 100,
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      {/* Dynamic Animated Particles / Fireworks Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Shimmering Golden Rays */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-r from-amber-500/20 via-yellow-400/25 to-amber-600/20 rounded-full blur-3xl animate-pulse" />
        
        {/* Floating Confetti / Coin Sprinkles */}
        {Array.from({ length: 28 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full pointer-events-none animate-bounce"
            style={{
              top: `${Math.random() * 90}%`,
              left: `${Math.random() * 90}%`,
              width: `${Math.random() * 10 + 6}px`,
              height: `${Math.random() * 10 + 6}px`,
              backgroundColor: ['#f59e0b', '#eab308', '#10b981', '#6366f1', '#ec4899', '#38bdf8'][i % 6],
              animationDuration: `${Math.random() * 2 + 1.5}s`,
              animationDelay: `${Math.random() * 1.5}s`,
              opacity: 0.85,
            }}
          />
        ))}
      </div>

      {/* Main Celebration Dialog Box */}
      <div className="relative w-full max-w-sm sm:max-w-md rounded-3xl bg-slate-900/95 border border-amber-500/50 shadow-[0_0_80px_rgba(245,158,11,0.35)] p-6 sm:p-7 text-center text-slate-100 z-10 animate-in zoom-in-95 duration-300 overflow-hidden backdrop-blur-xl">
        
        {/* Subtle Background Radial Mesh */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Winner Badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 font-mono text-[11px] font-bold uppercase tracking-wider mb-2 shadow-inner">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>RANK #{rank} • GRAND CHAMPION BOUNTY</span>
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-[26px] font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-yellow-300 to-amber-400 tracking-tight">
          CONTEST COMPLETED!
        </h2>
        <p className="text-xs text-slate-300 max-w-xs mx-auto mt-1 mb-3 leading-relaxed">
          Both problems solved with 100% test cases passed in <span className="text-amber-300 font-semibold">{contestTitle}</span>!
        </p>

        {/* CENTER ANIMATED 3D GOLDEN COIN */}
        <div className="relative my-3 flex items-center justify-center cursor-pointer group">
          {/* Outer Pulsing Glow Rings */}
          <div className="absolute w-32 h-32 rounded-full bg-amber-500/20 blur-xl group-hover:bg-amber-500/35 transition-all" />
          <div className="absolute w-28 h-28 rounded-full border border-dashed border-amber-400/50 animate-spin" style={{ animationDuration: '8s' }} />

          {/* 3D Golden Coin Element */}
          <div className="relative w-22 h-22 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-yellow-100 via-amber-400 to-amber-600 p-1 shadow-[0_8px_30px_rgba(245,158,11,0.6)] flex items-center justify-center transition-transform duration-300 animate-coin-3d group-hover:scale-110">
            <div className="w-full h-full rounded-full bg-gradient-to-tr from-amber-600 via-yellow-500 to-yellow-300 border-2 border-yellow-100 flex flex-col items-center justify-center shadow-inner text-slate-950 font-black select-none">
              <span className="text-2xl sm:text-3xl filter drop-shadow">🪙</span>
              <span className="text-[9.5px] font-mono tracking-widest uppercase font-black text-amber-950 -mt-0.5">NEC</span>
            </div>
          </div>
        </div>

        {/* Coin Award Banner */}
        <div className="mt-2 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-center space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Prize Credited to Wallet</span>
          </div>
          <div className="text-3xl font-black text-amber-300 tracking-tight font-mono">
            +{coinsAwarded} NEC Coins
          </div>
          <div className="pt-0.5 flex items-center justify-center gap-1 text-xs text-slate-300 font-mono">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>Ready to redeem for swag & courses</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4.5 pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate(ROUTES.REWARDS);
            }}
            className="group relative w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:via-yellow-300 hover:to-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 overflow-hidden"
          >
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />
            <Gift className="w-4 h-4 text-slate-950 group-hover:rotate-12 transition-transform" />
            <span className="tracking-wide">Redeem NEC Coins</span>
            <ArrowRight className="w-4 h-4 text-slate-950 group-hover:translate-x-0.5 transition-transform" />
          </button>

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
