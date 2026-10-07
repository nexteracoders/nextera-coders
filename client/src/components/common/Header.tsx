import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { EXPLORE_NAV_ITEMS } from '../../constants/navigation';
import { BrandLogo } from './BrandLogo';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';
import { NotificationDropdown } from './NotificationDropdown';
import { CoinPassbookModal } from './CoinPassbookModal';
import { Button } from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { coinService } from '../../services/coin.service';
import {
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  Coins,
  HelpCircle,
  FileText,
  FolderGit2,
  BookOpen,
  Terminal,
  Trophy,
  Sparkles,
  Compass,
  Swords,
  Crown,
  Bookmark,
} from 'lucide-react';
import { cn } from '../../utils/cn';

const ICON_MAP: Record<string, React.ReactNode> = {
  Terminal: <Terminal className="w-4 h-4 text-emerald-500" />,
  HelpCircle: <HelpCircle className="w-4 h-4 text-amber-500" />,
  FolderGit2: <FolderGit2 className="w-4 h-4 text-purple-500" />,
  Trophy: <Trophy className="w-4 h-4 text-brand-500" />,
  BookOpen: <BookOpen className="w-4 h-4 text-emerald-500" />,
  FileText: <FileText className="w-4 h-4 text-blue-500" />,
  Swords: <Swords className="w-4 h-4 text-rose-500" />,
  Crown: <Crown className="w-4 h-4 text-amber-500" />,
  Bookmark: <Bookmark className="w-4 h-4 text-sky-500" />,
};

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [coursesOpen, setCoursesOpen] = useState(false);
  const [tutorialsOpen, setTutorialsOpen] = useState(false);
  const [mobileExploreOpen, setMobileExploreOpen] = useState(true);
  const [mobileCoursesOpen, setMobileCoursesOpen] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [isPassbookOpen, setIsPassbookOpen] = useState(false);

  useEffect(() => {
    const handleOpenPassbook = () => setIsPassbookOpen(true);
    window.addEventListener('open-coin-passbook', handleOpenPassbook);
    return () => window.removeEventListener('open-coin-passbook', handleOpenPassbook);
  }, []);
  const exploreRef = useRef<HTMLDivElement>(null);
  const coursesRef = useRef<HTMLDivElement>(null);
  const tutorialsRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated, isInitialized } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      coinService.syncUserProfile({
        id: user.id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        college: (user as any).college,
        points: user.points,
        learningStreak: user.learningStreak,
        unlockedCoupons: (user as any).unlockedCoupons,
        unlockedCourses: (user as any).unlockedCourses,
        swagOrders: (user as any).swagOrders,
      });
    }
  }, [user]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exploreRef.current && !exploreRef.current.contains(event.target as Node)) {
        setExploreOpen(false);
      }
      if (coursesRef.current && !coursesRef.current.contains(event.target as Node)) {
        setCoursesOpen(false);
      }
      if (tutorialsRef.current && !tutorialsRef.current.contains(event.target as Node)) {
        setTutorialsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setExploreOpen(false);
    setCoursesOpen(false);
    setTutorialsOpen(false);
  }, [location.pathname]);

  const coursesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tutorialsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exploreTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCloseAllDropdowns = () => {
    if (coursesTimer.current) clearTimeout(coursesTimer.current);
    if (tutorialsTimer.current) clearTimeout(tutorialsTimer.current);
    if (exploreTimer.current) clearTimeout(exploreTimer.current);
    setCoursesOpen(false);
    setTutorialsOpen(false);
    setExploreOpen(false);
  };

  const handleOpenDropdown = (menu: 'courses' | 'tutorials' | 'explore') => {
    if (coursesTimer.current) clearTimeout(coursesTimer.current);
    if (tutorialsTimer.current) clearTimeout(tutorialsTimer.current);
    if (exploreTimer.current) clearTimeout(exploreTimer.current);

    setCoursesOpen(menu === 'courses');
    setTutorialsOpen(menu === 'tutorials');
    setExploreOpen(menu === 'explore');
  };

  const handleCloseDropdown = (menu: 'courses' | 'tutorials' | 'explore') => {
    const timer = setTimeout(() => {
      if (menu === 'courses') setCoursesOpen(false);
      if (menu === 'tutorials') setTutorialsOpen(false);
      if (menu === 'explore') setExploreOpen(false);
    }, 150);

    if (menu === 'courses') coursesTimer.current = timer;
    if (menu === 'tutorials') tutorialsTimer.current = timer;
    if (menu === 'explore') exploreTimer.current = timer;
  };

  const isExploreActive =
    location.pathname.startsWith('/explore') ||
    location.pathname.startsWith('/compiler') ||
    location.pathname.startsWith('/quizzes') ||
    location.pathname.startsWith('/projects') ||
    location.pathname.startsWith('/contest');

  const isCoursesActive = location.pathname.startsWith('/courses');
  const isTutorialsActive = location.pathname.startsWith('/tutorials');

  // Pages where circular floating capsule navbar on scroll should be disabled
  // (e.g. documentation reader with its own fixed navigation pane, or full-width IDE)
  const isFullWidthOnlyPage =
    location.pathname.startsWith('/tutorials') ||
    location.pathname.startsWith('/compiler');

  const enablePillNavbar = scrolled && !isFullWidthOnlyPage;

  return (
    <header
      className={cn(
        'w-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
        isTutorialsActive
          ? 'relative z-50 border-b border-slate-200/60 dark:border-dark-800/60 bg-white/90 dark:bg-dark-950/90 backdrop-blur-md shadow-xs'
          : enablePillNavbar
          ? 'sticky top-0 z-50 pt-3 px-3 sm:px-4 lg:px-6 pointer-events-none bg-transparent border-transparent'
          : scrolled
          ? 'sticky top-0 z-50 border-b border-slate-200/80 dark:border-dark-800/80 bg-white/95 dark:bg-dark-950/95 backdrop-blur-xl shadow-xs'
          : 'sticky top-0 z-50 border-b border-slate-200/60 dark:border-dark-800/60 bg-white/80 dark:bg-dark-950/80 backdrop-blur-md shadow-xs'
      )}
    >
      <div
        className={cn(
          'transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center justify-between gap-3 sm:gap-4',
          enablePillNavbar
            ? 'pointer-events-auto max-w-4xl lg:max-w-5xl mx-auto rounded-full bg-white/75 dark:bg-slate-900/75 backdrop-blur-2xl backdrop-saturate-150 border border-slate-200/80 dark:border-white/15 shadow-[0_15px_40px_-5px_rgba(0,0,0,0.12),inset_0_1px_1px_0_rgba(255,255,255,0.9)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.7),inset_0_1px_1px_0_rgba(255,255,255,0.12)] px-4 sm:px-6 py-2 sm:py-2.5'
            : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16'
        )}
      >
        {/* Brand Logo */}
        <div
          onMouseEnter={handleCloseAllDropdowns}
          className="hover:scale-105 active:scale-95 transition-transform duration-200 shrink-0 flex items-center"
        >
          <BrandLogo
            size="md"
            showTagline={!enablePillNavbar}
            className="shrink-0 transition-all flex items-center"
          />
        </div>

        {/* Desktop Navigation */}
        <nav
          onMouseLeave={handleCloseAllDropdowns}
          className="hidden lg:flex items-center gap-1 sm:gap-1.5"
        >
          {/* 1. Courses Dropdown */}
          <div
            ref={coursesRef}
            className="relative"
            onMouseEnter={() => handleOpenDropdown('courses')}
            onMouseLeave={() => handleCloseDropdown('courses')}
          >
            <button
              type="button"
              onClick={() => setCoursesOpen(!coursesOpen)}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 flex items-center gap-1.5 group cursor-pointer hover:scale-105 active:scale-95',
                isCoursesActive
                  ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/70 dark:text-brand-400 font-bold shadow-xs ring-1 ring-brand-500/20'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/90 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/10'
              )}
              aria-expanded={coursesOpen}
            >
              <BookOpen className="w-3.5 h-3.5 text-brand-500 group-hover:rotate-12 transition-transform duration-200" />
              <span>Courses</span>
              <ChevronDown
                className={cn(
                  'w-3.5 h-3.5 transition-transform duration-300 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200',
                  coursesOpen && 'rotate-180 text-brand-500'
                )}
              />
            </button>

            {/* Courses Dropdown Menu */}
            {coursesOpen && (
              <div
                onMouseEnter={() => handleOpenDropdown('courses')}
                onMouseLeave={() => handleCloseDropdown('courses')}
                className="absolute left-0 sm:left-[-15px] top-full pt-1.5 w-[420px] z-50 animate-dropdown-slide"
              >
                <div className="rounded-2xl border border-slate-200/90 dark:border-dark-800 bg-white dark:bg-dark-900 shadow-2xl p-3 space-y-2 ring-1 ring-black/5 dark:ring-white/10">
                  <div className="flex items-center justify-between px-2.5 py-1 border-b border-slate-100 dark:border-dark-800/80">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-brand-500 animate-pulse" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 font-mono">
                        Course Catalog & Tracks
                      </span>
                    </div>
                    <Link
                      to={ROUTES.COURSES}
                      onClick={() => setCoursesOpen(false)}
                      className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 group"
                    >
                      <span>All Courses</span>
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Free Resources Card */}
                    <Link
                      to="/courses?type=free"
                      onClick={() => setCoursesOpen(false)}
                      className="p-3 rounded-xl border border-emerald-500/25 bg-emerald-50/30 dark:bg-emerald-950/20 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/40 hover:border-emerald-500/50 transition-colors duration-200 flex flex-col justify-between group shadow-xs hover:shadow-md select-none"
                    >
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          Free Resources & Courses
                        </div>
                        <p className="text-[11.5px] text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                          Explore all free courses, self-paced reading curriculums, and beginner tutorials.
                        </p>
                      </div>
                      <div className="pt-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <span>Browse Free Track</span>
                        <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </Link>

                    {/* Premium Pro Tracks Card */}
                    <Link
                      to="/courses?type=premium"
                      onClick={() => setCoursesOpen(false)}
                      className="p-3 rounded-xl border border-amber-500/25 bg-amber-50/30 dark:bg-amber-950/20 hover:bg-amber-50/70 dark:hover:bg-amber-950/40 hover:border-amber-500/50 transition-colors duration-200 flex flex-col justify-between group shadow-xs hover:shadow-md select-none"
                    >
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                          Premium Pro Tracks
                        </div>
                        <p className="text-[11.5px] text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                          Master in-demand tech with HD video lessons, mentor doubt assistance, and certificates.
                        </p>
                      </div>
                      <div className="pt-2 text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <span>Explore Pro Tracks</span>
                        <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Tutorials Dropdown */}
          <div
            ref={tutorialsRef}
            className="relative"
            onMouseEnter={() => handleOpenDropdown('tutorials')}
            onMouseLeave={() => handleCloseDropdown('tutorials')}
          >
            <button
              type="button"
              onClick={() => setTutorialsOpen(!tutorialsOpen)}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 flex items-center gap-1.5 group cursor-pointer hover:scale-105 active:scale-95',
                isTutorialsActive
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400 font-bold shadow-xs ring-1 ring-emerald-500/20'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/90 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/10'
              )}
              aria-expanded={tutorialsOpen}
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600 group-hover:rotate-12 transition-transform duration-200" />
              <span>Tutorials</span>
              <ChevronDown
                className={cn(
                  'w-3.5 h-3.5 transition-transform duration-300 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200',
                  tutorialsOpen && 'rotate-180 text-emerald-600'
                )}
              />
            </button>

            {/* Tutorials Dropdown Menu */}
            {tutorialsOpen && (
              <div
                onMouseEnter={() => handleOpenDropdown('tutorials')}
                onMouseLeave={() => handleCloseDropdown('tutorials')}
                className="absolute left-0 sm:left-[-60px] top-full pt-1.5 w-[370px] z-50 animate-dropdown-slide"
              >
                <div className="rounded-2xl border border-slate-200/90 dark:border-dark-800 bg-white dark:bg-dark-900 shadow-2xl p-3 space-y-1.5 ring-1 ring-black/5 dark:ring-white/10">
                  <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 px-2.5 py-1 flex items-center justify-between border-b border-slate-100 dark:border-dark-800/80 mb-1">
                    <span>Tutorials by Subject</span>
                    <Link
                      to={ROUTES.TUTORIALS}
                      onClick={() => setTutorialsOpen(false)}
                      className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                    >
                      <span>All Docs</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 gap-1">
                    {[
                      { name: 'Python', track: 'python' },
                      { name: 'JavaScript & TS', track: 'javascript' },
                      { name: 'React & Next.js', track: 'react' },
                      { name: 'Java', track: 'java' },
                      { name: 'C++ & C', track: 'cpp' },
                      { name: 'DSA Mastery', track: 'dsa' },
                      { name: 'SQL & Databases', track: 'sql' },
                      { name: 'DevOps & Cloud', track: 'devops' },
                      { name: 'System Design', track: 'systemdesign' },
                      { name: 'Cybersecurity', track: 'cybersecurity' },
                      { name: 'Machine Learning & AI', track: 'ml', colSpan: 2 },
                    ].map((item) => (
                      <Link
                        key={item.track}
                        to={`/tutorials?track=${item.track}`}
                        onClick={() => setTutorialsOpen(false)}
                        className={cn(
                          'px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-400 flex items-center justify-between transition-colors group select-none',
                          item.colSpan === 2 && 'col-span-2'
                        )}
                      >
                        <span>{item.name}</span>
                        <ChevronRight className="w-3 h-3 text-emerald-500 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. Practice */}
          <Link
            to={ROUTES.PRACTICE}
            onMouseEnter={handleCloseAllDropdowns}
            className={cn(
              'px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 flex items-center gap-1.5 hover:scale-105 active:scale-95',
              location.pathname === ROUTES.PRACTICE
                ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/70 dark:text-brand-400 font-bold shadow-xs ring-1 ring-brand-500/20'
                : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/90 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/10'
            )}
          >
            <span>Practice</span>
          </Link>

          {/* 4. Explore Dropdown */}
          <div
            ref={exploreRef}
            className="relative"
            onMouseEnter={() => handleOpenDropdown('explore')}
            onMouseLeave={() => handleCloseDropdown('explore')}
          >
            <button
              type="button"
              onClick={() => setExploreOpen(!exploreOpen)}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 flex items-center gap-1.5 group cursor-pointer hover:scale-105 active:scale-95',
                isExploreActive
                  ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/70 dark:text-brand-400 font-bold shadow-xs ring-1 ring-brand-500/20'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/90 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/10'
              )}
              aria-expanded={exploreOpen}
            >
              <Compass className="w-3.5 h-3.5 text-brand-500 group-hover:rotate-45 transition-transform duration-300" />
              <span>Explore</span>
              <ChevronDown
                className={cn(
                  'w-3.5 h-3.5 transition-transform duration-300 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200',
                  exploreOpen && 'rotate-180 text-brand-500'
                )}
              />
            </button>

            {/* Explore Dropdown Menu */}
            {exploreOpen && (
              <div
                onMouseEnter={() => handleOpenDropdown('explore')}
                onMouseLeave={() => handleCloseDropdown('explore')}
                className="absolute right-0 sm:right-[-20px] top-full pt-1.5 w-[410px] z-50 animate-dropdown-slide"
              >
                <div className="rounded-2xl border border-slate-200/90 dark:border-dark-800 bg-white dark:bg-dark-900 shadow-2xl p-3 ring-1 ring-black/5 dark:ring-white/10">
                  <div className="flex items-center justify-between px-2.5 py-1 border-b border-slate-100 dark:border-dark-800/80 mb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-brand-500 animate-pulse" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 font-mono">
                        Explore Learning Tracks
                      </span>
                    </div>
                    <Link
                      to={ROUTES.EXPLORE}
                      onClick={() => setExploreOpen(false)}
                      className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 group"
                    >
                      <span>Explore Hub</span>
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {EXPLORE_NAV_ITEMS.map((subItem) => {
                      const isSubActive = location.pathname.startsWith(subItem.path);
                      return (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          onClick={() => setExploreOpen(false)}
                          className={cn(
                            'group p-2 rounded-xl transition-colors duration-200 flex flex-col justify-between border select-none',
                            isSubActive
                              ? 'bg-brand-50/80 border-brand-200 dark:bg-brand-950/40 dark:border-brand-800/50'
                              : 'border-transparent hover:border-slate-200/80 dark:hover:border-dark-750 hover:bg-slate-50/90 dark:hover:bg-dark-850/80'
                          )}
                        >
                          <div className="flex items-start justify-between gap-1.5 mb-1">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-dark-800 group-hover:scale-105 transition-transform">
                                {subItem.icon && ICON_MAP[subItem.icon]}
                              </div>
                              <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                                {subItem.label}
                              </span>
                            </div>
                            {subItem.badge && (
                              <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-dark-700/60">
                                {subItem.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11.5px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed font-normal">
                            {subItem.description}
                          </p>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 5. About */}
          <Link
            to={ROUTES.ABOUT}
            onMouseEnter={handleCloseAllDropdowns}
            className={cn(
              'px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 flex items-center gap-1.5 hover:scale-105 active:scale-95',
              location.pathname === ROUTES.ABOUT
                ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/70 dark:text-brand-400 font-bold shadow-xs ring-1 ring-brand-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/90 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/10'
            )}
          >
            <span>About</span>
          </Link>
        </nav>

        {/* Right Actions */}
        <div
          onMouseEnter={handleCloseAllDropdowns}
          className="flex items-center gap-2 sm:gap-2.5 shrink-0"
        >
          <ThemeToggle className="rounded-full hover:scale-110 active:scale-95 transition-transform duration-200 shadow-xs hover:border-brand-500/40 dark:hover:border-brand-400/40" />

          {isInitialized && isAuthenticated ? (
            <div className="flex items-center gap-2">
              {/* Live Coin Balance Pill with Center Passbook Modal Trigger */}
              <button
                type="button"
                onClick={() => setIsPassbookOpen(true)}
                title="View NEC Coins Passbook & History"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-mono font-bold text-xs transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-2xs"
              >
                <Coins className="w-3.5 h-3.5 text-amber-500 shrink-0 animate-pulse" />
                <span>{(user?.points ?? 0).toLocaleString()}</span>
              </button>

              <NotificationDropdown />
              <UserMenu />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to={ROUTES.LOGIN}>
                <button
                  type="button"
                  className="relative overflow-hidden px-3 sm:px-5 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-sm font-bold text-white bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-indigo-500 shadow-md shadow-brand-500/30 hover:shadow-lg hover:shadow-brand-500/45 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-1.5 cursor-pointer whitespace-nowrap group"
                >
                  <span className="relative z-10 flex items-center gap-1.5">
                    Get Started
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
                  </span>
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent ease-in-out pointer-events-none" />
                </button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-dark-800 hover:scale-110 active:scale-95 transition-all focus:outline-none cursor-pointer"
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div
          className={cn(
            'pointer-events-auto max-h-[82vh] overflow-y-auto animate-in fade-in slide-in-from-top-3 duration-200 transition-all',
            enablePillNavbar
              ? 'max-w-lg mx-auto mt-2 rounded-3xl border border-slate-200/90 dark:border-dark-800 bg-white/95 dark:bg-dark-900/95 backdrop-blur-2xl px-5 py-4 space-y-4 shadow-2xl ring-1 ring-black/5 dark:ring-white/10'
              : 'border-b border-slate-200 dark:border-dark-800 bg-white dark:bg-dark-900 px-4 pt-3 pb-6 space-y-4 shadow-xl'
          )}
        >
          <nav className="flex flex-col space-y-1">
            <div className="pb-1">
              <button
                type="button"
                onClick={() => setMobileCoursesOpen(!mobileCoursesOpen)}
                className="w-full px-3.5 py-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-brand-500" />
                  <span>Courses</span>
                </div>
                <ChevronDown
                  className={cn('w-4 h-4 transition-transform', mobileCoursesOpen && 'rotate-180')}
                />
              </button>

              {mobileCoursesOpen && (
                <div className="pl-3 pr-1 py-1 space-y-1 border-l-2 border-slate-200 dark:border-dark-800 ml-4 mt-1">
                  <Link
                    to="/courses?type=free"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                  >
                    <span>🎁 Free Resources & Courses</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 font-bold">FREE</span>
                  </Link>

                  <Link
                    to="/courses?type=premium"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                  >
                    <span>👑 Premium Pro Tracks</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 font-bold">PRO</span>
                  </Link>

                  <Link
                    to={ROUTES.COURSES}
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-dark-850 transition-colors"
                  >
                    <span>🌟 All Courses Catalog</span>
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                  </Link>
                </div>
              )}
            </div>

            <div className="pb-1">
              <Link
                to={ROUTES.TUTORIALS}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-colors flex items-center justify-between',
                  location.pathname.startsWith('/tutorials')
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 font-semibold'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-dark-850'
                )}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>Tutorials & Docs</span>
                </div>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold">
                  FREE
                </span>
              </Link>
            </div>

            <Link
              to={ROUTES.PRACTICE}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                'px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-colors',
                location.pathname === ROUTES.PRACTICE
                  ? 'bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400 font-semibold'
                  : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-dark-850'
              )}
            >
              Practice
            </Link>

            <div className="pt-2 pb-1">
              <button
                type="button"
                onClick={() => setMobileExploreOpen(!mobileExploreOpen)}
                className="w-full px-3.5 py-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono"
              >
                <div className="flex items-center gap-2">
                  <Compass className="w-3.5 h-3.5 text-brand-500" />
                  <span>Explore Tracks</span>
                </div>
                <ChevronDown
                  className={cn('w-4 h-4 transition-transform', mobileExploreOpen && 'rotate-180')}
                />
              </button>

              {mobileExploreOpen && (
                <div className="pl-3 pr-1 py-1 space-y-1 border-l-2 border-slate-200 dark:border-dark-800 ml-4 mt-1">
                  {EXPLORE_NAV_ITEMS.map((subItem) => {
                    const isSubActive = location.pathname.startsWith(subItem.path);
                    return (
                      <Link
                        key={subItem.path}
                        to={subItem.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          'px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors',
                          isSubActive
                            ? 'bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400 font-bold'
                            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-dark-850'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {subItem.icon && ICON_MAP[subItem.icon]}
                          <span>{subItem.label}</span>
                        </div>
                        {subItem.badge && (
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-dark-800 text-slate-500 dark:text-slate-400">
                            {subItem.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <Link
              to={ROUTES.ABOUT}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                'px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-colors',
                location.pathname === ROUTES.ABOUT
                  ? 'bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400 font-semibold'
                  : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-dark-850'
              )}
            >
              About
            </Link>
          </nav>

          <div className="pt-3 border-t border-slate-100 dark:border-dark-800 flex flex-col gap-2">
            {isAuthenticated ? (
              <Link to={ROUTES.PROFILE} onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" size="md" className="w-full rounded-full">
                  Profile Settings
                </Button>
              </Link>
            ) : (
              <Link to={ROUTES.LOGIN} onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" size="md" className="w-full rounded-full" rightIcon={<ChevronRight className="w-4 h-4" />}>
                  Get Started
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Center Screen Coin Passbook Modal */}
      <CoinPassbookModal
        isOpen={isPassbookOpen}
        onClose={() => setIsPassbookOpen(false)}
        initialBalance={user?.points}
      />
    </header>
  );
};
