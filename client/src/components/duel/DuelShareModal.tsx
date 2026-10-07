import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Copy,
  Check,
  Share2,
  Swords,
  Users,
  Trophy,
  ExternalLink,
  Download,
} from 'lucide-react';
import { useToast } from '../ui/Toast';

export interface DuelShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  groupSize?: number;
  problemTitle?: string;
  difficulty?: string;
  isStaked?: boolean;
  stakeAmount?: number;
}

// Clean SVG WhatsApp Logo (No emoji)
const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
  </svg>
);

export const DuelShareModal: React.FC<DuelShareModalProps> = ({
  isOpen,
  onClose,
  roomCode,
  groupSize = 2,
  problemTitle,
  difficulty = 'Any',
  isStaked = false,
  stakeAmount = 50,
}) => {
  const { success } = useToast();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const cleanRoomCode = (roomCode || '').toUpperCase();
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const duelUrl = `${origin}/practice/duels/${cleanRoomCode}`;

  const modeLabel =
    groupSize === 2
      ? '1vs1 Duel (2 Players)'
      : `${groupSize}-Player Squad Battle`;

  const challengeLabel = problemTitle
    ? `${problemTitle} [${difficulty}]`
    : `Random DSA Challenge [${difficulty}]`;

  const rewardLabel = isStaked
    ? `${stakeAmount} Coins Staked (Winner takes pot)`
    : `+${stakeAmount} Coins & Rating Boost`;

  // Clean professional invite text with NextEra Coders branding (Room Code in WhatsApp monospace)
  const inviteText = `*NextEra Coders — Live Code Battle*

You have been challenged to a live competitive coding battle on NextEra Coders!

BATTLE DETAILS:
• Room Code: \`\`\`${cleanRoomCode}\`\`\`
• Mode: ${modeLabel}
• Challenge: ${challengeLabel}
• Prize: ${rewardLabel}

Join Battle Arena Directly:
${duelUrl}

Click the direct link or paste Room Code [${cleanRoomCode}] on NextEra Coders to enter the arena.`;

  // Fetch the battle poster image as a File object for photo sharing
  const getBannerFile = async (): Promise<File | null> => {
    try {
      const res = await fetch('/images/nec-battle-banner.jpg');
      const blob = await res.blob();
      return new File([blob], `NextEra-Coders-Battle-${cleanRoomCode}.jpg`, { type: 'image/jpeg' });
    } catch {
      return null;
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(cleanRoomCode);
    setCopiedCode(true);
    success('Room code copied!');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(duelUrl);
    setCopiedLink(true);
    success('Direct arena link copied!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadImage = () => {
    const a = document.createElement('a');
    a.href = '/images/nec-battle-banner.jpg';
    a.download = `NextEra-Coders-Battle-${cleanRoomCode}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    success('Battle Poster downloaded!');
  };

  // Helper to share with photo file via Web Share API
  const shareWithBannerFile = async (): Promise<boolean> => {
    setIsSharing(true);
    try {
      const file = await getBannerFile();
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'NextEra Coders — Live Code Battle',
          text: inviteText,
          files: [file],
        });
        setIsSharing(false);
        return true;
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Native share with file failed:', err);
      } else {
        setIsSharing(false);
        return true; // User cancelled
      }
    }
    setIsSharing(false);
    return false;
  };

  // Share via WhatsApp with Photo
  const handleShareWhatsApp = async () => {
    // 1. If device supports native file sharing (mobile WhatsApp), send actual photo file
    const shared = await shareWithBannerFile();
    if (shared) return;

    // 2. Desktop fallback: Copy image to clipboard for easy Ctrl+V in WhatsApp Web
    try {
      const img = new Image();
      img.src = '/images/nec-battle-banner.jpg';
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      canvas.toBlob(async (pngBlob) => {
        if (pngBlob && navigator.clipboard && typeof ClipboardItem !== 'undefined') {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
        }
      }, 'image/png');
    } catch {}

    success('Opening WhatsApp! Photo copied to clipboard — press Ctrl+V in chat to attach.');
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(inviteText)}`;
    window.open(whatsappUrl, '_blank');
  };

  // General Share with Photo
  const handleShare = async () => {
    // 1. Try sharing with photo file directly
    const shared = await shareWithBannerFile();
    if (shared) return;

    // 2. Fallback to native text/url share
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'NextEra Coders — Live Code Battle',
          text: inviteText,
          url: duelUrl,
        });
        return;
      } catch {}
    }

    // 3. Fallback to copying invite text
    navigator.clipboard.writeText(inviteText);
    success('Battle invitation copied to clipboard!');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#13141f] border border-violet-500/30 dark:border-violet-500/30 shadow-[0_10px_40px_rgba(124,58,237,0.25)] overflow-hidden relative my-auto"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-3 z-20 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 transition-all cursor-pointer hover:scale-105"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* 1. ATTRACTIVE NEC BATTLE POSTER (NO EMOJIS) */}
            <div className="relative w-full aspect-16/9 overflow-hidden bg-slate-950">
              <img
                src="/images/nec-battle-banner.jpg"
                alt="NextEra Coders Battle Arena"
                className="w-full h-full object-cover select-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#13141f] via-transparent to-black/40" />

              {/* Badges on Poster (Clean typography, no emojis) */}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600/90 backdrop-blur-md text-white text-[10px] font-black tracking-wider uppercase shadow-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  Live Arena
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-900/80 backdrop-blur-md text-violet-200 border border-violet-400/30 text-[10px] font-bold">
                  <Swords className="w-3 h-3 text-violet-300" />
                  NextEra Coders Battle
                </span>
              </div>

              {/* Bottom Card Title on Image */}
              <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white drop-shadow-md">
                    Live Coding Duel Challenge
                  </h3>
                  <p className="text-xs text-violet-200/90 font-semibold drop-shadow-sm">
                    {modeLabel} • Ready for Battle
                  </p>
                </div>
              </div>
            </div>

            {/* 2. BODY CONTENT */}
            <div className="p-4 sm:p-5 space-y-4">
              {/* Colored Room Code Box (No emojis, bold colored font) */}
              <div className="p-3 sm:p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-500/30 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                    Battle Room Code
                  </span>
                  <div className="text-2xl sm:text-3xl font-mono font-black text-blue-700 dark:text-cyan-400 tracking-wider">
                    {cleanRoomCode}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#1e1f30] hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700/60 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    {copiedCode ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                    title="Copy direct join URL"
                  >
                    {copiedLink ? (
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                    ) : (
                      <ExternalLink className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedLink ? 'Copied Link' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>

              {/* Match Details Cards */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#181928] border border-slate-200 dark:border-neutral-800/80 flex items-center gap-2">
                  <Users className="w-4 h-4 text-violet-500 shrink-0" />
                  <div className="truncate">
                    <span className="text-[10px] text-slate-400 dark:text-neutral-500 block uppercase font-bold">
                      Team Size
                    </span>
                    <span className="font-bold text-slate-800 dark:text-neutral-200 truncate block">
                      {modeLabel}
                    </span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#181928] border border-slate-200 dark:border-neutral-800/80 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                  <div className="truncate">
                    <span className="text-[10px] text-slate-400 dark:text-neutral-500 block uppercase font-bold">
                      Stakes / Reward
                    </span>
                    <span className="font-bold text-slate-800 dark:text-neutral-200 truncate block">
                      +{stakeAmount} Coins
                    </span>
                  </div>
                </div>
              </div>

              {/* Clean Pre-crafted Invite Preview (No copy buttons above, clean NextEra Coders text) */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-700 dark:text-neutral-300 block">
                  Invite Message Preview:
                </span>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#0c0d14] border border-slate-200 dark:border-neutral-800 text-[11px] font-mono text-slate-600 dark:text-neutral-300 max-h-28 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text shadow-inner">
                  {inviteText}
                </div>
              </div>

              {/* Share Actions (Clean SVG logos, NO mobile emoji) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {/* WhatsApp Share with Photo */}
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  disabled={isSharing}
                  className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-600/20 active:scale-98 disabled:opacity-60"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  <span>Share on WhatsApp</span>
                </button>

                {/* Share Button (Renamed to Share with Share2 icon) */}
                <button
                  type="button"
                  onClick={handleShare}
                  disabled={isSharing}
                  className="py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-blue-600/25 active:scale-98 disabled:opacity-60"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>
              </div>

              {/* Secondary Download / Action Bar */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-neutral-800/80 text-[11px]">
                <button
                  type="button"
                  onClick={handleDownloadImage}
                  className="text-slate-500 hover:text-violet-600 dark:text-neutral-400 dark:hover:text-violet-300 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Battle Poster</span>
                </button>
                <span className="text-slate-400 dark:text-neutral-500">
                  Direct invite link included
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
