import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Section } from '../../../components/ui/Section';
import { SectionHeading } from '../../../components/ui/SectionHeading';
import { ROUTES } from '../../../constants/routes';
import {
  Star,
  Sparkles,
  Briefcase,
  ArrowRight,
  Award,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { mentorService, MentorItem } from '../../../services/mentor.service';

const DEFAULT_MENTORS: MentorItem[] = [
  {
    id: 'mentor-1',
    name: 'Sandip Kr Verma',
    role: 'Founder & Principal Engineering Mentor',
    exCompanies: ['NextEra Coders', 'Tech Forward'],
    image: '/images/sandip_verma.jpg',
    quoteTitle: 'Transforming Learners into Industry Leaders.',
    quoteBody:
      'Practical, industry-focused mentorship on Core DSA, System Design, and full-stack architecture to help you crack Tier-1 tech roles.',
    signature: 'Sandip Kr Verma',
    experience: 'Tech Lead & Mentor',
    studentsMentored: '100k+ Learners',
    placements: '500+ Tech Offers',
    rating: '4.98 / 5.0',
  },
  {
    id: 'mentor-2',
    name: 'Naveen Kumar',
    role: 'Co-Founder & Technical Architect',
    exCompanies: ['NextEra Coders', 'Tech Forward'],
    image: '/images/naveen_kumar.jpg',
    quoteTitle: 'High-Scale Engineering & Algorithmic Mastery.',
    quoteBody:
      'Mastering advanced algorithmic patterns, distributed computing, and mental models that stay with you across your engineering career.',
    signature: 'Naveen Kumar',
    experience: 'Systems Architect',
    studentsMentored: '80k+ Engineers',
    placements: 'Top Tech Placements',
    rating: '4.95 / 5.0',
  },
];

export const MentorsSection: React.FC = () => {
  const [mentors, setMentors] = useState<MentorItem[]>(DEFAULT_MENTORS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    mentorService
      .getPublicMentors()
      .then((res) => {
        if (res.mentors && res.mentors.length > 0) {
          setMentors(res.mentors);
        }
      })
      .catch((err) => {
        console.error('Failed to load dynamic mentors, using fallback:', err);
      });
  }, []);

  // Auto-slide every 6 seconds
  useEffect(() => {
    if (mentors.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % mentors.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [mentors.length, isPaused]);

  const navigate = useNavigate();
  const safeIndex = currentIndex < mentors.length ? currentIndex : 0;
  const currentMentor = mentors[safeIndex] || DEFAULT_MENTORS[0];
  const mentorProfileUrl = `/mentors/${currentMentor.id || (currentMentor as any)._id || 'mentor-1'}`;

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % mentors.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + mentors.length) % mentors.length);
  };

  // Clean summary text
  const cleanSummary = currentMentor.quoteBody?.length > 175
    ? `${currentMentor.quoteBody.substring(0, 165).trim()}...`
    : currentMentor.quoteBody || 'Practical, industry-focused mentorship on Core DSA & System Design.';

  return (
    <Section containerSize="xl" noPadding className="py-8 sm:py-12 overflow-hidden relative">
      {/* Dynamic ambient studio backdrop lighting */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-brand-500/10 dark:bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[450px] h-[450px] bg-purple-500/10 dark:bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[600px] h-40 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="space-y-6 sm:space-y-8 w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* 1. SECTION HEADER */}
        <SectionHeading
          title="Meet Your Mentors"
          subtitle="Guided by top educators & ex-Amazon & Microsoft engineers who have mentored 1M+ learners."
          highlightText="Your Mentors"
          align="center"
          className="!mb-0 max-w-3xl"
        />

        {/* 2. EXPANDED MAIN MENTOR SHOWCASE CARD */}
        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="relative p-4 sm:p-10 lg:p-12 xl:p-14 rounded-3xl sm:rounded-[36px] bg-white/80 dark:bg-[#0f121d]/85 backdrop-blur-2xl border border-slate-200/90 dark:border-white/10 shadow-2xl shadow-indigo-950/5 dark:shadow-black/50 overflow-hidden"
        >
          {/* Subtle Cyber Horizon Accents */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-brand-500/60 via-purple-500/60 to-transparent pointer-events-none" />
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 xl:gap-16 items-center">
            
            {/* LEFT: HIGH-TECH MENTOR PORTRAIT WITH ANIMATED GLOW & FLOATING DEPTH */}
            <div className="lg:col-span-5 flex items-center justify-center relative min-h-[300px] sm:min-h-[440px]">
              
              {/* Dynamic Studio Halo Glow */}
              <div className="absolute w-64 h-64 sm:w-96 sm:h-96 rounded-full bg-gradient-to-tr from-brand-500/25 via-indigo-500/20 to-cyan-400/25 blur-3xl pointer-events-none animate-pulse-glow" />

              {/* Decorative Tech Orbital Ring SVG (Behind Portrait) */}
              <div className="absolute w-72 h-72 sm:w-[410px] sm:h-[410px] pointer-events-none opacity-30 dark:opacity-40 animate-spin [animation-duration:35s] flex items-center justify-center">
                <svg viewBox="0 0 400 400" className="w-full h-full text-brand-500/40 dark:text-brand-400/30">
                  <circle
                    cx="200"
                    cy="200"
                    r="190"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeDasharray="8 12"
                  />
                  <circle
                    cx="200"
                    cy="200"
                    r="170"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeDasharray="4 8"
                  />
                </svg>
              </div>

              {/* Floating Container (Applies smooth vertical bobbing) */}
              <div className="relative animate-mentor-float z-10">
                
                {/* Gradient Neon Border Frame */}
                <div className="p-[2px] rounded-[30px] bg-gradient-to-tr from-brand-500 via-indigo-500/70 to-cyan-400 shadow-2xl shadow-brand-500/25 transition-transform duration-500 hover:shadow-brand-500/40">
                  
                  {/* Inner Card & Photo Viewport */}
                  <div
                    onClick={() => navigate(mentorProfileUrl)}
                    title={`Click to view ${currentMentor.name}'s profile & follow`}
                    className="relative w-60 sm:w-80 md:w-[340px] max-w-[calc(100vw-3rem)] h-76 sm:h-96 md:h-[420px] rounded-[28px] overflow-hidden bg-slate-950 flex items-center justify-center group cursor-pointer"
                  >
                    
                    {/* Animated Transitions between mentors */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentMentor.id || safeIndex}
                        initial={{ opacity: 0, scale: 0.95, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97, y: -12 }}
                        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                        className="relative w-full h-full"
                      >
                        <img
                          src={currentMentor.image || '/images/mentor_lead.jpg'}
                          alt={currentMentor.name}
                          className="w-full h-full object-cover object-top sm:object-center select-none transition-transform duration-700 ease-out group-hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/mentor_lead.jpg';
                          }}
                        />

                        {/* High-End Tech Laser Vignette & Shimmer */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/30 to-transparent pointer-events-none" />
                        
                        {/* Interactive Sheen Sweep on Hover */}
                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none -skew-x-12" />

                        {/* Frosted Glass Nameplate on Image Bottom */}
                        <div className="absolute bottom-3 inset-x-3 p-3.5 rounded-2xl bg-slate-900/85 backdrop-blur-xl border border-white/10 shadow-xl flex items-center justify-between z-10 font-mono">
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm sm:text-base font-bold text-white truncate block">
                                {currentMentor.name}
                              </span>
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            </div>
                            <span className="text-xs text-slate-300 truncate block max-w-[170px] sm:max-w-[190px]">
                              {currentMentor.role}
                            </span>
                          </div>

                          <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-bold">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                            <span>Lead</span>
                          </div>
                        </div>
                      </motion.div>
                    </AnimatePresence>

                  </div>
                </div>

                {/* Floating Glassmorphic Badge: Rating (Top Left) */}
                <div className="absolute -top-3.5 -left-3 sm:-left-4 z-20 shadow-xl">
                  <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/95 dark:bg-[#151824]/95 backdrop-blur-md border border-amber-400/40 text-amber-500 font-bold text-xs font-mono shadow-md">
                    <Star className="w-3.5 h-3.5 fill-current text-amber-400" />
                    <span className="text-slate-900 dark:text-slate-100 font-extrabold">
                      {currentMentor.rating?.split(' ')[0] || '4.98'}
                    </span>
                    <span className="text-[10px] text-amber-500/90 font-medium">★ Top 1%</span>
                  </div>
                </div>

                {/* Floating Glassmorphic Badge: ex-Companies (Top Right) */}
                {currentMentor.exCompanies && currentMentor.exCompanies.length > 0 && (
                  <div className="absolute -top-3.5 -right-3 sm:-right-4 z-20 shadow-xl">
                    <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/95 dark:bg-[#151824]/95 backdrop-blur-md border border-indigo-500/30 dark:border-indigo-400/20 shadow-md">
                      <Briefcase className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100 font-mono">
                        {currentMentor.exCompanies.map((c) => `ex-${c}`).join(' & ')}
                      </span>
                    </div>
                  </div>
                )}

                {/* Floating Accent Pill: 100% Industry Vetted (Bottom Right Offset) */}
                <div className="absolute -bottom-3 -right-2 sm:-right-4 z-20 shadow-lg">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-brand-600 to-indigo-600 text-white font-mono text-[10px] sm:text-[11px] font-bold shadow-md shadow-brand-500/30">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Industry Vetted</span>
                  </div>
                </div>

              </div>
            </div>

            {/* RIGHT: CONCISE, IMPACTFUL CONTENT & METRICS */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Tagline & Core Focus */}
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-500/10 dark:bg-brand-500/20 border border-brand-500/20 text-brand-600 dark:text-brand-400 text-xs font-mono font-bold">
                  <Award className="w-3.5 h-3.5" />
                  <span>Industry Leadership Mentorship</span>
                </div>

                <h3 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
                  {currentMentor.quoteTitle || 'Transforming Learners into Top Industry Leaders.'}
                </h3>

                <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                  {cleanSummary}
                </p>
              </div>

              {/* Compact 3 Metric Stat Cards */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-1 font-mono">
                <div className="p-3.5 sm:p-5 rounded-2xl bg-slate-50/90 dark:bg-white/5 border border-slate-200/80 dark:border-white/5 text-center shadow-xs transition-transform hover:-translate-y-0.5">
                  <span className="text-lg sm:text-2xl font-extrabold text-brand-600 dark:text-brand-400 block">
                    {currentMentor.studentsMentored}
                  </span>
                  <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block mt-0.5">
                    Learners
                  </span>
                </div>

                <div className="p-3.5 sm:p-5 rounded-2xl bg-slate-50/90 dark:bg-white/5 border border-slate-200/80 dark:border-white/5 text-center shadow-xs transition-transform hover:-translate-y-0.5">
                  <span className="text-lg sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 block">
                    {currentMentor.experience}
                  </span>
                  <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block mt-0.5">
                    Tech Lead
                  </span>
                </div>

                <div className="p-3.5 sm:p-5 rounded-2xl bg-slate-50/90 dark:bg-white/5 border border-slate-200/80 dark:border-white/5 text-center shadow-xs transition-transform hover:-translate-y-0.5">
                  <span className="text-lg sm:text-2xl font-extrabold text-purple-600 dark:text-purple-400 block">
                    {currentMentor.placements}
                  </span>
                  <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block mt-0.5">
                    Placements
                  </span>
                </div>
              </div>

              {/* Action Buttons & Carousel Controls */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5">
                  <Link to={mentorProfileUrl}>
                    <button className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-700 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-brand-500/25 transition-all cursor-pointer active:scale-95">
                      <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 fill-amber-300/30" />
                      <span>View Profile & Follow</span>
                      <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </Link>

                  <Link to={ROUTES.COURSES}>
                    <button className="px-3.5 sm:px-5 py-2 sm:py-3 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-95">
                      <span>Explore Courses</span>
                    </button>
                  </Link>
                </div>

                {/* Slider Controls: Prev/Next & Dots */}
                {mentors.length > 1 && (
                  <div className="flex items-center gap-2.5 sm:gap-3 ml-auto sm:ml-0">
                    {/* Prev Arrow */}
                    <button
                      onClick={handlePrev}
                      aria-label="Previous mentor"
                      className="p-2 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/15 transition-all cursor-pointer active:scale-90"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {/* Dots */}
                    <div className="flex items-center gap-1.5">
                      {mentors.map((m, idx) => (
                        <button
                          key={m.id || idx}
                          onClick={() => setCurrentIndex(idx)}
                          aria-label={`View mentor ${m.name}`}
                          className={cn(
                            'h-2.5 rounded-full transition-all duration-300 cursor-pointer',
                            safeIndex === idx
                              ? 'w-7 bg-brand-600 dark:bg-brand-400 shadow-xs'
                              : 'w-2.5 bg-slate-300 dark:bg-white/20 hover:bg-slate-400 dark:hover:bg-white/40'
                          )}
                        />
                      ))}
                    </div>

                    {/* Next Arrow */}
                    <button
                      onClick={handleNext}
                      aria-label="Next mentor"
                      className="p-2 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/15 transition-all cursor-pointer active:scale-90"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};
