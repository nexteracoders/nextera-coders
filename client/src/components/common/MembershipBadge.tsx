import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Crown, Sparkles, ShieldCheck, ArrowRight, Calendar } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routes';

interface MembershipBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showDetailsHover?: boolean;
}

export const MembershipBadge: React.FC<MembershipBadgeProps> = ({
  size = 'md',
  className = '',
  showDetailsHover = true,
}) => {
  const { user } = useAuth();
  const [showTooltip, setShowTooltip] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowTooltip(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isProMember = Boolean(
    user &&
    user.isPro &&
    user.subscription?.plan &&
    user.subscription?.status === 'active' &&
    (!user.subscription.endDate || new Date(user.subscription.endDate) > new Date())
  );

  if (!isProMember) return null;

  const planName =
    user?.subscription?.plan === 'lifetime'
      ? 'NEC Pro One 3-Year Pass'
      : user?.subscription?.plan === 'yearly'
      ? 'NEC Pro One Yearly Pass'
      : user?.subscription?.plan === 'monthly'
      ? 'NEC Pro One Monthly Pass'
      : 'NEC Pro Member Pass';

  const expiryDate = user?.subscription?.endDate
    ? new Date(user.subscription.endDate).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Lifetime Extended';

  return (
    <div
      ref={containerRef}
      className={cn('relative inline-flex items-center', className)}
      onMouseEnter={() => showDetailsHover && setShowTooltip(true)}
      onMouseLeave={() => showDetailsHover && setShowTooltip(false)}
    >
      <button
        type="button"
        onClick={() => setShowTooltip(!showTooltip)}
        className={cn(
          'group relative inline-flex items-center gap-1.5 rounded-full font-mono font-extrabold tracking-tight transition-all duration-300 select-none cursor-pointer',
          'bg-gradient-to-r from-amber-500/20 via-orange-500/25 to-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/40 shadow-xs shadow-amber-500/10 hover:border-amber-400 hover:shadow-md hover:shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98]',
          size === 'sm' && 'px-2 py-0.5 text-[10px]',
          size === 'md' && 'px-2.5 py-1 text-xs',
          size === 'lg' && 'px-3.5 py-1.5 text-sm'
        )}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
        <Crown
          className={cn(
            'text-amber-400 shrink-0 transition-transform group-hover:rotate-12',
            size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-3.5 h-3.5' : 'w-4 h-4'
          )}
        />
        <span>PRO MEMBER</span>
        <Sparkles className="w-2.5 h-2.5 text-amber-300 opacity-70 group-hover:opacity-100 transition-opacity" />
      </button>

      {/* Interactive Tooltip / Popover */}
      {showTooltip && (
        <div className="absolute top-full left-0 mt-2 w-64 z-50 rounded-2xl bg-slate-900/95 border border-amber-500/40 p-3.5 shadow-2xl backdrop-blur-md text-left text-white animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-800">
            <div className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Crown className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-400">{planName}</div>
              <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Active & Verified VIP
              </div>
            </div>
          </div>

          <div className="space-y-1.5 text-[11px] text-slate-300">
            <div className="flex items-center justify-between text-slate-400 font-mono text-[10px]">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" /> Validity:
              </span>
              <span className="text-slate-200 font-bold">{expiryDate}</span>
            </div>
            <div className="text-[11px] text-slate-300 leading-snug">
              ✨ 100% HD Videos, SDE Curriculums, Code Repos & Certificates Unlocked.
            </div>
          </div>

          <Link
            to={ROUTES.PROFILE}
            onClick={() => setShowTooltip(false)}
            className="mt-3 flex items-center justify-between p-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-[11px] font-bold text-amber-300 transition-colors"
          >
            <span>Manage My Membership</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
};
