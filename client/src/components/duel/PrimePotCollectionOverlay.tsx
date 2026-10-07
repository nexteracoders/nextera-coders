import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Coins, Sparkles, Shield, User, Trophy, ArrowRight, Zap } from 'lucide-react';

export interface PrimePlayerInfo {
  userId: string;
  name: string;
  avatar?: string;
  profileImage?: string;
  college?: string;
  rating?: number;
  isMe?: boolean;
  isAi?: boolean;
}

export interface PrimePotCollectionOverlayProps {
  isOpen: boolean;
  onComplete: () => void;
  players: PrimePlayerInfo[];
  entryFee: number;
  totalPot: number;
  netPrizePool: number;
  platformFee: number;
  roomCode: string;
}

// Gentle Web Audio API synthesizer for coin collection chimes
const playCoinChime = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, ctx.currentTime); // B5 note
    osc.frequency.exponentialRampToValueAtTime(1318.51, ctx.currentTime + 0.12); // E6 note
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    // AudioContext blocked or not supported
  }
};

export const PrimePotCollectionOverlay: React.FC<PrimePotCollectionOverlayProps> = ({
  isOpen,
  onComplete,
  players,
  entryFee,
  totalPot,
  netPrizePool,
  platformFee,
  roomCode,
}) => {
  // Animation phases: 'intro' -> 'collecting' -> 'locked' -> 'countdown'
  const [phase, setPhase] = useState<'intro' | 'collecting' | 'locked' | 'countdown'>('intro');
  const [displayedPot, setDisplayedPot] = useState(0);
  const [countdownNum, setCountdownNum] = useState(3);

  // Sound and animation orchestration
  useEffect(() => {
    if (!isOpen) {
      setPhase('intro');
      setDisplayedPot(0);
      setCountdownNum(3);
      return;
    }

    // Step 1: 800ms Intro -> Switch to 'collecting'
    const t1 = setTimeout(() => {
      setPhase('collecting');
      playCoinChime();
    }, 800);

    // Step 2: Animate pot counter counting up
    const t2 = setTimeout(() => {
      const stepTime = 1200 / Math.max(1, totalPot);
      let current = 0;
      const interval = setInterval(() => {
        current += Math.ceil(totalPot / 15);
        if (current >= totalPot) {
          current = totalPot;
          clearInterval(interval);
          playCoinChime();
        }
        setDisplayedPot(current);
      }, Math.max(30, stepTime));
    }, 1100);

    // Step 3: Pot Locked (at 3.2s)
    const t3 = setTimeout(() => {
      setPhase('locked');
      setDisplayedPot(totalPot);
      playCoinChime();
    }, 3200);

    // Step 4: Countdown (at 4.4s)
    const t4 = setTimeout(() => {
      setPhase('countdown');
      setCountdownNum(3);

      const cInterval = setInterval(() => {
        setCountdownNum((prev) => {
          if (prev <= 1) {
            clearInterval(cInterval);
            // Complete and transition to battle
            setTimeout(() => {
              onComplete();
            }, 800);
            return 1;
          }
          playCoinChime();
          return prev - 1;
        });
      }, 700);
    }, 4400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [isOpen, totalPot, onComplete]);

  if (!isOpen) return null;

  const validPlayers = players.length > 0 ? players : [
    { userId: '1', name: 'You', isMe: true },
    { userId: '2', name: 'Opponent' },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-stone-950/95 backdrop-blur-xl flex flex-col items-center justify-between p-4 sm:p-6 select-none overflow-hidden"
      >
        {/* Animated Cyber Background Glows */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Bar */}
        <div className="w-full max-w-4xl flex items-center justify-between z-10 pt-2">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold">
            <Crown className="w-4 h-4 text-amber-400" />
            <span>NEC Prime Battle • Room {roomCode}</span>
          </div>

          <button
            type="button"
            onClick={onComplete}
            className="text-xs font-mono font-bold text-stone-400 hover:text-white bg-stone-900/80 hover:bg-stone-800 border border-stone-800 px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>Skip Animation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Center Arena Content */}
        <div className="w-full max-w-4xl flex-1 flex flex-col items-center justify-center space-y-8 z-10 my-auto py-4">
          {/* Main Title Badge */}
          <div className="text-center space-y-1.5">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border border-amber-400/40 text-amber-300 text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg"
            >
              <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>Staking & Prize Pool Allocation</span>
            </motion.div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Collecting Competitor Stakes
            </h2>
            <p className="text-xs sm:text-sm text-stone-400">
              Each coder commits <strong className="text-amber-400 font-mono">{entryFee} Coins</strong> to the central battle vault
            </p>
          </div>

          {/* PLAYERS ROW */}
          <div className="w-full flex items-center justify-center gap-4 sm:gap-8 flex-wrap">
            {validPlayers.map((player, idx) => {
              const displayName = player.name || `Player ${idx + 1}`;
              const avatarImg = player.avatar || player.profileImage;

              return (
                <motion.div
                  key={player.userId || idx}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.15, duration: 0.35 }}
                  className="relative flex flex-col items-center text-center p-4 rounded-2xl bg-stone-900/90 border border-amber-500/30 shadow-xl min-w-[130px] sm:min-w-[160px]"
                >
                  {/* Avatar with Golden Ring */}
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl p-1 bg-gradient-to-tr from-amber-500 to-yellow-300 shadow-md">
                    <div className="w-full h-full rounded-xl bg-stone-950 overflow-hidden flex items-center justify-center">
                      {avatarImg ? (
                        <img src={avatarImg} alt={displayName} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-8 h-8 text-amber-400" />
                      )}
                    </div>

                    {/* Me Indicator */}
                    {player.isMe && (
                      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-amber-500 text-stone-950 font-black text-[10px] uppercase shadow-md">
                        You
                      </span>
                    )}
                  </div>

                  {/* Player Details */}
                  <div className="mt-3">
                    <div className="text-xs sm:text-sm font-bold text-white truncate max-w-[120px] sm:max-w-[140px]">
                      {displayName}
                    </div>
                    <div className="text-[11px] font-mono text-amber-400 font-semibold">
                      Stake: {entryFee} Coins
                    </div>
                  </div>

                  {/* LUDO-STYLE FLOATING COIN DEDUCTION (Animates upward during collecting phase) */}
                  <AnimatePresence>
                    {phase === 'collecting' && (
                      <motion.div
                        initial={{ opacity: 0, y: 0, scale: 0.7 }}
                        animate={{ opacity: 1, y: -45, scale: 1.15 }}
                        exit={{ opacity: 0, y: -70 }}
                        transition={{ duration: 1.2, repeat: 1, repeatType: 'reverse' }}
                        className="absolute -top-3 px-2.5 py-1 rounded-full bg-rose-500 text-white font-mono font-black text-xs shadow-lg shadow-rose-500/30 flex items-center gap-1 z-30"
                      >
                        <span>-{entryFee}</span>
                        <Coins className="w-3.5 h-3.5 text-yellow-200" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* FLYING GOLD COINS (Towards Center Pot) */}
                  {phase === 'collecting' && (
                    <motion.div
                      initial={{ scale: 0.5, opacity: 1, x: 0, y: 0 }}
                      animate={{
                        scale: [0.8, 1.2, 0.4],
                        opacity: [1, 1, 0],
                        x: idx === 0 ? 80 : -80,
                        y: 110,
                      }}
                      transition={{ duration: 1.4, ease: 'easeInOut' }}
                      className="absolute top-10 pointer-events-none z-20 flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-stone-950 shadow-md shadow-amber-400/50"
                    >
                      <Coins className="w-4 h-4" />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* CENTRAL GRAND VAULT / PRIZE POOL CONTAINER */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: phase === 'locked' ? [1, 1.05, 1] : 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-stone-900 via-stone-900 to-[#1b1509] border-2 border-amber-500/50 shadow-[0_0_50px_rgba(245,158,11,0.2)] text-center space-y-4 relative"
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-stone-950 font-black text-xs tracking-wider uppercase shadow-md flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5" />
              <span>NEC Prime Prize Vault</span>
            </div>

            <div className="pt-2">
              <span className="text-xs font-mono uppercase font-bold text-stone-400 tracking-wider">
                Total Staked Pot
              </span>
              <div className="text-3xl sm:text-5xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-200 tracking-wider">
                {displayedPot} 🪙
              </div>
            </div>

            {/* Platform Cut & Net Prize Pool Breakdown */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-800 text-xs">
              <div className="p-2.5 rounded-xl bg-stone-950/80 border border-stone-800 text-left">
                <span className="text-[10px] text-stone-500 uppercase font-bold block">10% Platform Fee</span>
                <span className="text-amber-500/90 font-mono font-bold">-{platformFee} Coins</span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-right">
                <span className="text-[10px] text-amber-400 uppercase font-bold block">Net Prize Pool</span>
                <span className="text-emerald-400 font-mono font-black text-sm">+{netPrizePool} Coins</span>
              </div>
            </div>

            {/* Live Status Ticker / 3-2-1 Countdown */}
            <div className="pt-2">
              {phase === 'countdown' ? (
                <div className="space-y-1 animate-pulse">
                  <span className="text-xs font-mono font-bold text-amber-300">
                    BATTLE LAUNCHING IN
                  </span>
                  <div className="text-4xl font-mono font-black text-white">
                    {countdownNum}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-xs font-mono text-stone-400">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  <span>
                    {phase === 'collecting'
                      ? 'Collecting stakes from all players...'
                      : 'All stakes locked into Prize Pool!'}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Bottom Status Guarantee */}
        <div className="w-full max-w-md text-center text-[11px] text-stone-500 pb-2 flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-amber-500/80" />
          <span>Fair Play Guaranteed • Prize automatically awarded upon verified battle completion</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
