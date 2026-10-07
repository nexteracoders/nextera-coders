import React from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { ROUTES } from '../../constants/routes';
import { Badge } from '../../components/ui/Badge';
import {
  Compass,
  HelpCircle,
  FolderGit2,
  Terminal,
  Trophy,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Swords,
} from 'lucide-react';
import { cn } from '../../utils/cn';

const TRACK_CARDS = [
  {
    id: 'compiler',
    title: 'NEC Cloud Compiler',
    badge: 'MULTI-LANGUAGE',
    badgeVariant: 'success' as const,
    icon: <Terminal className="w-6 h-6 text-emerald-500" />,
    description:
      'High-speed browser-based cloud compiler for Python, Java, C++, JavaScript, and SQL with real-time dynamic execution.',
    highlights: [
      'Instant in-browser execution with real-time terminal output',
      'Support for Python 3.12, Java 21, C++20, and Web Stacks',
      'Interactive syntax highlighting and error diagnostics',
    ],
    path: ROUTES.COMPILER,
    actionText: 'Launch NEC Compiler',
    gradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
    borderHover: 'hover:border-emerald-500/50',
    buttonClass: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/35',
    btnIcon: <Terminal className="w-4 h-4" />,
  },
  {
    id: 'quizzes',
    title: 'Interactive Quizzes',
    badge: 'CHALLENGES',
    badgeVariant: 'warning' as const,
    icon: <HelpCircle className="w-6 h-6 text-amber-500" />,
    description:
      'Test your comprehension with structured multiple-choice and conceptual challenges across DSA, Frontend, Backend, and System Design.',
    highlights: [
      'Timed assessment modes with detailed solution explanations',
      'Real-time score tracking and leaderboard standing',
      'Beginner to expert level question ladders',
    ],
    path: ROUTES.QUIZZES,
    actionText: 'Start Quizzes',
    gradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
    borderHover: 'hover:border-amber-500/50',
    buttonClass: 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 bg-[length:200%_auto] hover:bg-right text-slate-950 font-black shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/35',
    btnIcon: <HelpCircle className="w-4 h-4 text-slate-950" />,
  },
  {
    id: 'projects',
    title: 'Production Projects',
    badge: 'PORTFOLIO',
    badgeVariant: 'default' as const,
    icon: <FolderGit2 className="w-6 h-6 text-purple-500" />,
    description:
      'Build real-world full-stack applications with guided specifications, source repositories, and architecture diagrams.',
    highlights: [
      'Enterprise-grade repositories and starter kits',
      'Frontend, Backend & Full-Stack portfolio milestones',
      'Community code reviews and project checklists',
    ],
    path: ROUTES.PROJECTS,
    actionText: 'Browse Projects',
    gradient: 'from-purple-500/10 via-purple-500/5 to-transparent',
    borderHover: 'hover:border-purple-500/50',
    buttonClass: 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/20 hover:shadow-lg hover:shadow-purple-600/35',
    btnIcon: <FolderGit2 className="w-4 h-4" />,
  },
  {
    id: 'contest',
    title: 'Weekly Coding Contest',
    badge: 'LIVE & RANKED',
    badgeVariant: 'success' as const,
    icon: <Trophy className="w-6 h-6 text-brand-500" />,
    description:
      'Compete with developers in weekly ranked algorithmic competitions, earn leaderboard coins, and win exclusive swag.',
    highlights: [
      'Real-time leaderboard & rank rating updates',
      'Earn NextEra Coins for every solved challenge',
      'Redeem coins for physical hoodies, bottles & certificates',
    ],
    path: ROUTES.CONTEST,
    actionText: 'Join Weekly Contest',
    gradient: 'from-brand-500/10 via-brand-500/5 to-transparent',
    borderHover: 'hover:border-brand-500/50',
    buttonClass: 'bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-500 hover:from-brand-500 hover:to-indigo-500 text-white shadow-md shadow-brand-500/20 hover:shadow-lg hover:shadow-brand-500/35',
    btnIcon: <Trophy className="w-4 h-4" />,
  },
  {
    id: 'duels',
    title: 'NEC Code Battle (Free Duel)',
    badge: 'FREE LIVE ARENA',
    badgeVariant: 'warning' as const,
    icon: <Swords className="w-6 h-6 text-rose-500" />,
    description:
      'Enter real-time head-to-head live coding duels with a 15-minute countdown clock. The first coder to pass all test cases wins the battle and claims platform coins!',
    highlights: [
      'Instant real-time matchmaking & custom private room codes',
      'Simultaneous 15-minute algorithmic duel with live progress indicators',
      'Automated referee judge and immediate coin reward payout',
    ],
    path: ROUTES.DUELS,
    actionText: 'Enter NEC Code Battle',
    gradient: 'from-rose-500/10 via-amber-500/5 to-transparent',
    borderHover: 'hover:border-rose-500/50',
    buttonClass: 'bg-gradient-to-r from-rose-600 via-red-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white shadow-md shadow-rose-600/20 hover:shadow-lg hover:shadow-rose-600/35',
    btnIcon: <Swords className="w-4 h-4" />,
  },
];

export const ExplorePage: React.FC = () => {
  useDocumentTitle('Explore Learning Tracks — NextEra Coders');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* 1. HERO BANNER */}
      <section className="relative overflow-hidden py-16 sm:py-20 border-b border-slate-200/80 dark:border-dark-800 bg-white dark:bg-dark-900">
        <div className="absolute inset-0 bg-radial-gradient from-brand-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/80 border border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400 text-xs font-mono font-semibold">
            <Compass className="w-3.5 h-3.5" />
            <span>NextEra Learning Ecosystem</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white max-w-3xl mx-auto leading-tight">
            Explore Curated Tracks & Interactive Tools
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Boost your problem solving and engineering skills with our Cloud Compiler, interactive quizzes, production portfolio projects, and weekly live coding contests.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link to={ROUTES.COMPILER}>
              <button className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 hover:shadow-emerald-600/35 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 cursor-pointer border-none group">
                <Terminal className="w-4 h-4" />
                <span>Launch NEC Compiler</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </Link>
            <Link to={ROUTES.CONTEST}>
              <button className="px-5 py-2.5 rounded-xl bg-white dark:bg-dark-800 hover:bg-slate-100 dark:hover:bg-dark-750 text-slate-800 dark:text-slate-100 font-bold text-xs sm:text-sm border border-slate-200 dark:border-dark-700 shadow-2xs hover:border-brand-500/50 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 cursor-pointer group">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>Weekly Contest</span>
                <ArrowRight className="w-3.5 h-3.5 text-brand-500 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. EXPLORATION CARDS GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-1 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TRACK_CARDS.map((card) => (
            <div
              key={card.id}
              className={cn(
                'group relative rounded-3xl p-7 bg-white dark:bg-dark-900 border border-slate-200/90 dark:border-dark-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden',
                card.borderHover
              )}
            >
              <div className={cn('absolute inset-0 bg-gradient-to-br opacity-50 pointer-events-none', card.gradient)} />

              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="p-3 rounded-2xl bg-slate-100 dark:bg-dark-800 group-hover:scale-110 transition-transform">
                    {card.icon}
                  </div>
                  <Badge variant={card.badgeVariant} size="sm" className="font-mono text-[10px] font-bold">
                    {card.badge}
                  </Badge>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {card.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                    {card.description}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-dark-800">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Track Highlights
                  </span>
                  <ul className="space-y-1.5">
                    {card.highlights.map((h, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="relative z-10 pt-6 mt-4 border-t border-slate-100 dark:border-dark-800">
                <Link to={card.path} className="block w-full">
                  <button
                    className={cn(
                      'w-full group/btn relative overflow-hidden py-3 px-5 rounded-2xl font-bold text-xs sm:text-sm shadow-md hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer border-none',
                      card.buttonClass
                    )}
                  >
                    {card.btnIcon}
                    <span>{card.actionText}</span>
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-200" />
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* 3. PRO CALLOUT */}
        <div className="relative rounded-3xl p-8 bg-gradient-to-r from-dark-900 via-dark-950 to-brand-950 border border-brand-500/30 text-white overflow-hidden shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-mono font-semibold border border-brand-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>NextEra PRO Pass</span>
              </div>
              <h3 className="text-2xl font-extrabold tracking-tight">
                Unlock Full Access to All Advanced Projects & Contests
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
                Get unlimited access to premium full-stack architectures, interactive assessments, real-world portfolio reviews, and exclusive merchandise store claims.
              </p>
            </div>

            <Link to={ROUTES.PRO_ONE} className="shrink-0">
              <button className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-[1.03] active:scale-95 transition-all duration-300 flex items-center gap-2 cursor-pointer border-none group">
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>Explore Pro One</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
