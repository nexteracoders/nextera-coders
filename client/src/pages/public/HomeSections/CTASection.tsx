import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { ROUTES } from '../../../constants/routes';
import { Section } from '../../../components/ui/Section';
import { Button } from '../../../components/ui/Button';
import {
  Sparkles,
  ArrowRight,
  Trophy,
  CheckCircle2,
} from 'lucide-react';

export const CTASection: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Section variant="default" className="py-8 sm:py-14 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-amber-500/15 via-indigo-500/15 to-emerald-500/15 blur-3xl pointer-events-none -z-10" />

      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 text-white p-5 sm:p-14 lg:p-16 text-center space-y-5 sm:space-y-8 shadow-2xl shadow-amber-500/10 max-w-5xl mx-auto relative overflow-hidden ring-1 ring-white/10">
        
        {/* Top Glow & Particle Line */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-emerald-500 to-indigo-500" />
        
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[11px] sm:text-xs font-mono font-bold text-amber-300 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span>Join 50,000+ Software Engineers Today</span>
          </div>

          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Ready to Build Your Engineering Legacy?
          </h2>

          <p className="text-xs sm:text-base text-slate-300 leading-relaxed font-normal">
            Take control of your software career. Master pattern-based algorithms, ship production full-stack architectures, and win coins in Sunday contests.
          </p>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 pt-1 sm:pt-2">
          <Link to={isAuthenticated ? ROUTES.DASHBOARD : ROUTES.LOGIN}>
            <Button
              size="md"
              variant="primary"
              rightIcon={<ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              className="font-mono text-xs sm:text-sm font-bold px-4 sm:px-6 py-2 sm:py-2.5"
            >
              {isAuthenticated ? (
                'Go to Dashboard'
              ) : (
                <>
                  <span className="hidden sm:inline">Get Started For Free</span>
                  <span className="sm:hidden">Get Started Free</span>
                </>
              )}
            </Button>
          </Link>

          <Link to={ROUTES.PRO_ONE}>
            <button className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-300 hover:from-amber-300 hover:to-yellow-300 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-950 fill-current animate-pulse" />
              <span>NEC Pro One</span>
              <span className="text-[9px] sm:text-[10px] uppercase font-mono font-black px-1.5 py-0.2 rounded-md bg-slate-950/90 text-amber-300 border border-amber-400/40 shadow-xs">
                VIP
              </span>
            </button>
          </Link>

          <Link to={ROUTES.CONTEST}>
            <Button
              size="md"
              variant="outline"
              leftIcon={<Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />}
              className="border-slate-700 hover:bg-slate-800 text-white font-mono text-xs sm:text-sm font-bold px-3.5 sm:px-5 py-2 sm:py-2.5"
            >
              Sunday Contest (100🪙)
            </Button>
          </Link>
        </div>

        {/* Trust Badges */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-[11px] sm:text-xs text-slate-400 font-mono">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" /> Free Core Account
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" /> No Credit Card Required
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" /> Instant In-Browser Access
          </span>
        </div>
      </div>
    </Section>
  );
};
