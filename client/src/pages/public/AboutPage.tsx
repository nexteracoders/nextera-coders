import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { ROUTES } from '../../constants/routes';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { SectionHeading } from '../../components/ui/SectionHeading';
import {
  Target,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Star,
  Quote,
  Briefcase,
  ChevronRight,
  Rocket,
  Zap,
  GraduationCap,
  MessageSquare,
} from 'lucide-react';
import {
  XIcon,
  LinkedInIcon,
  GitHubIcon,
  YouTubeIcon,
} from '../../components/common/SocialIcons';
import { mentorService, MentorItem } from '../../services/mentor.service';

const DEFAULT_MENTORS: MentorItem[] = [
  {
    id: 'mentor-1',
    name: 'Lakshay Kumar',
    role: 'Founder & Principal Engineering Mentor',
    exCompanies: ['Amazon', 'Microsoft'],
    image: '/images/mentor_lead.jpg',
    quoteTitle: 'Transforming Learners into Industry Leaders.',
    quoteBody:
      'From startups to tech giants, "We bridge the gap between learning and doing". Through real-world challenges, personalized mentorship, and a thriving community, we empower developers to ship products that matter. Excellence is the only standard.',
    signature: 'Lakshay Kumar',
    experience: '10+ Yrs Tech Lead',
    studentsMentored: '1M+ Learners',
    placements: '500+ Tier-1 Offers',
    rating: '4.98 / 5.0',
    socialLinks: {
      linkedin: 'https://linkedin.com',
      youtube: 'https://youtube.com',
      github: 'https://github.com',
    },
  },
  {
    id: 'mentor-2',
    name: 'Dr. Shanti Rao',
    role: 'Staff Architect & AI/Systems Coach',
    exCompanies: ['Google', 'Meta'],
    image: '/images/mentor_lead_2.jpg',
    quoteTitle: 'From Syntax Confusion to High-Scale Mastery.',
    quoteBody:
      'True engineering maturity comes from solving hard algorithmic problems and designing resilient distributed backends. We break down complex computer science concepts into clear, memorable mental models that last a lifetime.',
    signature: 'Dr. Shanti Rao',
    experience: '12+ Yrs Systems Eng',
    studentsMentored: '650k+ Engineers',
    placements: 'Top MAANG Offers',
    rating: '4.95 / 5.0',
    socialLinks: {
      linkedin: 'https://linkedin.com',
      twitter: 'https://twitter.com',
      github: 'https://github.com',
    },
  },
];

export const AboutPage: React.FC = () => {
  useDocumentTitle('About NextEra Coders — Learn. Code. Build. Grow.');
  const [mentors, setMentors] = useState<MentorItem[]>(DEFAULT_MENTORS);
  const [selectedMentor, setSelectedMentor] = useState<MentorItem | null>(null);

  useEffect(() => {
    mentorService
      .getPublicMentors()
      .then((res) => {
        if (res.mentors && res.mentors.length > 0) {
          setMentors(res.mentors);
        }
      })
      .catch((err) => {
        console.error('Failed to load mentors on about page:', err);
      });
  }, []);

  return (
    <div>
      {/* INTERACTIVE HERO CONTAINER: About NextEra Coders */}
      <div className="pt-6 sm:pt-8 pb-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Hero Container with Mix RGB Accent Rim */}
          <div className="relative rounded-3xl p-[1.5px] bg-gradient-to-r from-brand-500/40 via-purple-500/30 to-emerald-500/40 shadow-xl shadow-brand-500/5 dark:shadow-black/40">
            <div className="relative rounded-[22px] bg-white/95 dark:bg-dark-900/95 backdrop-blur-2xl p-6 sm:p-8 lg:p-10 overflow-hidden">
              {/* Top Accent Strip in RGB Gradient */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-500 via-purple-500 to-emerald-500" />

              {/* Ambient Background Glows */}
              <div className="absolute -top-24 -left-24 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Breadcrumbs */}
              <nav className="relative z-10 flex items-center gap-1.5 text-xs font-mono text-slate-500 dark:text-slate-400 mb-4">
                <Link to={ROUTES.HOME} className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Home
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-900 dark:text-slate-100 font-bold">About</span>
              </nav>

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left Column: Mission Content */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono bg-slate-100 dark:bg-dark-800 border border-slate-200/90 dark:border-dark-700 text-slate-800 dark:text-slate-200 shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5 text-brand-500 animate-pulse" />
                    <span>Platform Mission & Vision</span>
                  </div>

                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                    About <span className="bg-gradient-to-r from-brand-600 via-purple-600 to-emerald-500 dark:from-brand-400 dark:via-purple-400 dark:to-emerald-400 bg-clip-text text-transparent">NextEra Coders</span>
                  </h1>

                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-normal leading-relaxed max-w-2xl">
                    We are building the developer learning platform that bridges the gap between introductory syntax and real-world production engineering.
                  </p>

                  {/* Interactive Feature Badges */}
                  <div className="pt-2 flex flex-wrap gap-2.5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-dark-800/80 border border-slate-200/80 dark:border-dark-700 text-slate-700 dark:text-slate-300 shadow-2xs hover:border-brand-500/40 hover:text-brand-600 dark:hover:text-brand-400 transition-all cursor-default">
                      <Rocket className="w-3.5 h-3.5 text-brand-500" />
                      Production-Grade Curriculum
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-dark-800/80 border border-slate-200/80 dark:border-dark-700 text-slate-700 dark:text-slate-300 shadow-2xs hover:border-brand-500/40 hover:text-brand-600 dark:hover:text-brand-400 transition-all cursor-default">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      Pattern-First DSA
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-dark-800/80 border border-slate-200/80 dark:border-dark-700 text-slate-700 dark:text-slate-300 shadow-2xs hover:border-brand-500/40 hover:text-brand-600 dark:hover:text-brand-400 transition-all cursor-default">
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />
                      Staff-Level Mentorship
                    </span>
                  </div>
                </div>

                {/* Right Column: Telemetry Cards & CTAs */}
                <div className="lg:col-span-5 flex flex-col gap-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-slate-50/90 dark:bg-dark-850/80 border border-slate-200/80 dark:border-dark-750 backdrop-blur-md shadow-2xs hover:border-brand-500/40 hover:-translate-y-0.5 transition-all group/stat">
                      <p className="text-2xl sm:text-3xl font-black text-brand-600 dark:text-brand-400 font-mono">1M+</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Learners Empowered</p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50/90 dark:bg-dark-850/80 border border-slate-200/80 dark:border-dark-750 backdrop-blur-md shadow-2xs hover:border-emerald-500/40 hover:-translate-y-0.5 transition-all group/stat">
                      <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">500+</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Tier-1 Placements</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <Link
                      to={ROUTES.COURSES}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 shadow-md shadow-brand-500/20 hover:shadow-brand-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <span>Explore Courses</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      to={ROUTES.CAREERS}
                      className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs sm:text-sm bg-slate-50 dark:bg-dark-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-dark-700 hover:border-brand-500/40 shadow-2xs hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <Briefcase className="w-4 h-4 text-brand-500" />
                      <span>Careers</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20 pb-20">
        {/* 1. Mission Statement */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-4">
          <div className="space-y-4">
            <Badge variant="info">Our Core Mission</Badge>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              Empowering Engineers to Build Real Software
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              Traditional coding education often falls into two extremes: trivial syntax exercises with zero context, or chaotic video courses where you blindly copy code without understanding trade-offs.
            </p>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              <strong>NextEra Coders</strong> was founded on a simple principle: <em>Learn by engineering</em>. We provide pattern-based DSA instruction, strict TypeScript code standards, and production SaaS architectures that prepare you for top-tier engineering roles.
            </p>
          </div>

          <div className="p-7 sm:p-8 rounded-3xl bg-gradient-to-br from-brand-600 via-indigo-600 to-emerald-600 text-white shadow-2xl space-y-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700 pointer-events-none" />
            <div className="w-[78px] h-12 rounded-xl bg-slate-950/80 border border-white/30 flex items-center justify-center backdrop-blur-md shadow-inner overflow-hidden shrink-0">
              <video
                src="/favicon-video.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="text-xl sm:text-2xl font-black">The NextEra Coders Creed</h3>
            <blockquote className="text-sm sm:text-base text-indigo-100 italic leading-relaxed">
              "We believe software development is a craft of clarity, testing, and continuous problem-solving. We do not memorize code; we architect systems."
            </blockquote>
            <div className="pt-2 text-xs font-mono text-white/90 font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Learn. Code. Build. Grow.</span>
            </div>
          </div>
        </div>

        {/* 2. MEET OUR MENTORS & LEADERSHIP */}
        <div className="space-y-10 pt-4">
          <SectionHeading
            badge="Engineering Mentorship"
            title="Meet Our Industry Mentors & Leadership"
            subtitle="Learn directly from seasoned staff engineers and tech leaders with decades of experience at top global product companies."
            highlightText="Industry Mentors & Leadership"
            align="center"
          />

          {/* Mentors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {mentors.map((mentor) => (
              <div
                key={mentor.id}
                className="rounded-3xl bg-white dark:bg-dark-900 border border-slate-200/90 dark:border-dark-800 shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col justify-between group"
              >
                {/* Top Image & Role Showcase */}
                <div>
                  <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-slate-900">
                    <img
                      src={mentor.image || '/images/mentor_lead.jpg'}
                      alt={mentor.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/mentor_lead.jpg';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent" />

                    {/* Ex-Companies Badges */}
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10 flex-wrap justify-end">
                      {mentor.exCompanies &&
                        mentor.exCompanies.map((comp) => (
                          <span
                            key={comp}
                            className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white shadow-md backdrop-blur-md border border-white/20"
                          >
                            ex-{comp}
                          </span>
                        ))}
                    </div>

                    {/* Bottom details on image */}
                    <div className="absolute bottom-4 left-4 right-4 z-10 flex items-end justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          <span>{mentor.name}</span>
                          <ShieldCheck className="w-5 h-5 text-brand-400 fill-brand-400/20" />
                        </h3>
                        <p className="text-xs text-slate-300 font-mono mt-0.5">
                          {mentor.role}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 bg-amber-400/20 backdrop-blur-md border border-amber-400/30 px-2.5 py-1 rounded-full text-amber-300 text-xs font-bold font-mono">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{mentor.rating || '4.98'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 sm:p-7 space-y-4">
                    {/* Quote Headline */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
                        <Quote className="w-4 h-4 rotate-180 shrink-0" />
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">
                          {mentor.quoteTitle}
                        </h4>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic line-clamp-3">
                        "{mentor.quoteBody}"
                      </p>
                    </div>

                    {/* Metrics Row */}
                    <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-slate-100 dark:border-dark-800 text-center">
                      <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-dark-950 border border-slate-200/70 dark:border-dark-800">
                        <span className="text-xs sm:text-sm font-black text-brand-600 dark:text-brand-400 font-mono block">
                          {mentor.studentsMentored}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          Mentored
                        </span>
                      </div>
                      <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-dark-950 border border-slate-200/70 dark:border-dark-800">
                        <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono block">
                          {mentor.experience}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          Experience
                        </span>
                      </div>
                      <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-dark-950 border border-slate-200/70 dark:border-dark-800">
                        <span className="text-xs sm:text-sm font-black text-purple-600 dark:text-purple-400 font-mono block">
                          {mentor.placements}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          Placements
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Socials & Interactive Action */}
                <div className="px-6 sm:px-7 pb-6 pt-2 flex items-center justify-between border-t border-slate-100 dark:border-dark-800/80 gap-3">
                  {/* Social links with brand color styling */}
                  <div className="flex items-center gap-2">
                    {mentor.socialLinks?.linkedin && (
                      <a
                        href={mentor.socialLinks.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`${mentor.name} LinkedIn`}
                        title="LinkedIn"
                        className="p-2 rounded-xl bg-[#0A66C2] text-white shadow-md shadow-[#0A66C2]/20 hover:scale-110 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#0A66C2]/40 transition-all"
                      >
                        <LinkedInIcon className="w-4 h-4" />
                      </a>
                    )}
                    {(mentor.socialLinks?.x || mentor.socialLinks?.twitter) && (
                      <a
                        href={mentor.socialLinks?.x || mentor.socialLinks?.twitter}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`${mentor.name} X`}
                        title="X (formerly Twitter)"
                        className="p-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-md shadow-slate-900/20 hover:scale-110 hover:-translate-y-0.5 hover:shadow-lg transition-all"
                      >
                        <XIcon className="w-4 h-4" />
                      </a>
                    )}
                    {mentor.socialLinks?.github && (
                      <a
                        href={mentor.socialLinks.github}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`${mentor.name} GitHub`}
                        title="GitHub"
                        className="p-2 rounded-xl bg-[#24292e] dark:bg-slate-800 text-white shadow-md hover:scale-110 hover:-translate-y-0.5 hover:shadow-lg transition-all"
                      >
                        <GitHubIcon className="w-4 h-4" />
                      </a>
                    )}
                    {mentor.socialLinks?.youtube && (
                      <a
                        href={mentor.socialLinks.youtube}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`${mentor.name} YouTube`}
                        title="YouTube"
                        className="p-2 rounded-xl bg-[#FF0000] text-white shadow-md shadow-red-500/20 hover:scale-110 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-500/40 transition-all"
                      >
                        <YouTubeIcon className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedMentor(mentor)}
                    className="font-bold rounded-xl text-xs"
                  >
                    Read Full Message
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2.5 INTERACTIVE CAREERS BANNER (Generous Height & Focused Explore CTA) */}
        <div className="relative group overflow-hidden rounded-2xl sm:rounded-3xl border border-brand-500/25 dark:border-brand-500/35 bg-gradient-to-r from-slate-900 via-brand-950/95 to-slate-900 p-6 sm:py-8 sm:px-9 shadow-xl shadow-brand-500/5 hover:shadow-2xl hover:shadow-brand-500/20 hover:border-brand-500/60 transition-all duration-300">
          {/* Ambient Glow Effects */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700 pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700 pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            {/* Left: Icon & Headline */}
            <div className="flex items-start sm:items-center gap-4 sm:gap-5">
              <div className="w-13 h-13 sm:w-14 sm:h-14 p-3.5 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-brand-500 flex items-center justify-center text-white shadow-xl shadow-brand-500/30 shrink-0 group-hover:rotate-6 group-hover:scale-110 transition-all duration-300 border border-white/10">
                <Briefcase className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                    Want to Build the Future of Tech Education?
                  </h3>
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    We're Hiring
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                  Join our team of engineers, mentors, and creators building the premier engineering education platform.
                </p>
              </div>
            </div>

            {/* Right: Only Explore CTA Button */}
            <div className="w-full sm:w-auto flex sm:justify-end shrink-0">
              <Link
                to={ROUTES.CAREERS}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-500 hover:from-brand-500 hover:to-indigo-500 shadow-xl shadow-brand-600/35 hover:shadow-brand-600/60 hover:scale-[1.04] active:scale-[0.98] transition-all duration-200 group/btn border border-brand-400/40"
              >
                <span>Explore Careers</span>
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1.5 transition-transform duration-200" />
              </Link>
            </div>
          </div>
        </div>

        {/* 3. Four Fundamental Pillars */}
        <div className="pt-4">
          <SectionHeading
            badge="Engineering Philosophy"
            title="Our Four Fundamental Pillars"
            subtitle="The core values that govern every curriculum, problem set, and project on our platform."
            highlightText="Four Fundamental Pillars"
            align="center"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card variant="elevated">
              <CardHeader>
                <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-2">
                  <Target className="w-5 h-5" />
                </div>
                <CardTitle className="text-base font-bold">Pattern First</CardTitle>
                <CardDescription className="text-xs">
                  We teach fundamental patterns rather than rote solutions. Understand the mechanics, solve any variant.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <CardTitle className="text-base font-bold">Production Rigor</CardTitle>
                <CardDescription className="text-xs">
                  Every project implements real authentication, strict TypeScript types, error handling, and performance checks.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-2">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <CardTitle className="text-base font-bold">Developer Community</CardTitle>
                <CardDescription className="text-xs">
                  Collaborate, review peer code, solve challenges together, and celebrate engineering breakthroughs.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2">
                  <Sparkles className="w-5 h-5" />
                </div>
                <CardTitle className="text-base font-bold">Measurable Growth</CardTitle>
                <CardDescription className="text-xs">
                  Daily learning streaks, difficulty metrics, and structured progress dashboards keep you accountable.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* 4. Platform Summary Metrics Banner */}
        <div className="p-8 sm:p-10 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-600/20 via-purple-600/10 to-emerald-600/20 pointer-events-none" />
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <span className="text-2xl sm:text-4xl font-black font-mono text-brand-400 block">1M+</span>
              <span className="text-xs sm:text-sm text-slate-300">Active Learners</span>
            </div>
            <div className="space-y-1">
              <span className="text-2xl sm:text-4xl font-black font-mono text-emerald-400 block">500+</span>
              <span className="text-xs sm:text-sm text-slate-300">DSA & System Design Problems</span>
            </div>
            <div className="space-y-1">
              <span className="text-2xl sm:text-4xl font-black font-mono text-cyan-400 block">100+</span>
              <span className="text-xs sm:text-sm text-slate-300">Free Courses & Tutorials</span>
            </div>
            <div className="space-y-1">
              <span className="text-2xl sm:text-4xl font-black font-mono text-amber-400 block">98%</span>
              <span className="text-xs sm:text-sm text-slate-300">Career Placement Rate</span>
            </div>
          </div>
        </div>

        {/* 5. Student Community & Reviews Hub Feature Banner */}
        <div className="relative rounded-3xl p-[1.5px] bg-gradient-to-r from-brand-500/50 via-purple-500/40 to-amber-500/50 shadow-xl overflow-hidden">
          <div className="relative rounded-[22px] bg-white/95 dark:bg-dark-900/95 backdrop-blur-2xl p-6 sm:p-8 lg:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-bold font-mono">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>Real Student Reviews & Community Posts</span>
              </div>
              <h3 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Hear What Real Coders Say & Share
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Explore authentic student reviews, technical doubts with attached screenshots, and project showcases shared by learners across engineering colleges.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <Link to={ROUTES.COMMUNITY}>
                <Button
                  variant="primary"
                  size="lg"
                  leftIcon={<MessageSquare className="w-4 h-4" />}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="w-full sm:w-auto font-bold rounded-2xl shadow-lg shadow-brand-500/20"
                >
                  Explore Student Posts & Reviews
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* 6. Call To Action */}
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-100 dark:bg-dark-900 border border-slate-200 dark:border-dark-800 text-center space-y-5">
          <Badge variant="success">Start Your Journey Today</Badge>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Ready to elevate your engineering career?
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            Join thousands of developers mastering algorithms, full-stack frameworks, and high-scale architectures under top industry guidance.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
            <Link to={ROUTES.REGISTER}>
              <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />} className="rounded-xl font-bold">
                Create Free Student Account
              </Button>
            </Link>
            <Link to={ROUTES.COURSES}>
              <Button variant="outline" size="lg" className="rounded-xl font-bold">
                Explore Mentored Courses
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 6. Interactive Mentor Full Philosophy Modal */}
      {selectedMentor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header with Photo & Title */}
            <div className="flex items-center gap-4">
              <img
                src={selectedMentor.image || '/images/mentor_lead.jpg'}
                alt={selectedMentor.name}
                className="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-dark-700 shadow-md"
              />
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>{selectedMentor.name}</span>
                  <ShieldCheck className="w-4 h-4 text-brand-500" />
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {selectedMentor.role}
                </p>
                <div className="flex items-center gap-1 text-amber-500 text-xs font-bold mt-1 font-mono">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{selectedMentor.rating} Rating</span>
                </div>
              </div>
            </div>

            {/* Message Body */}
            <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-dark-950 border border-slate-100 dark:border-dark-800">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Quote className="w-4 h-4 text-brand-500 rotate-180" />
                <span>{selectedMentor.quoteTitle}</span>
              </h4>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">
                "{selectedMentor.quoteBody}"
              </p>
              <div className="pt-2 text-right">
                <span className="text-xs sm:text-sm font-semibold italic text-brand-600 dark:text-brand-400 font-serif">
                  — {selectedMentor.signature || selectedMentor.name}
                </span>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-dark-850">
                <span className="font-bold text-brand-600 dark:text-brand-400 block">{selectedMentor.studentsMentored}</span>
                <span className="text-[10px] text-slate-400">Mentored</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-dark-850">
                <span className="font-bold text-emerald-600 dark:text-emerald-400 block">{selectedMentor.experience}</span>
                <span className="text-[10px] text-slate-400">Experience</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-dark-850">
                <span className="font-bold text-purple-600 dark:text-purple-400 block">{selectedMentor.placements}</span>
                <span className="text-[10px] text-slate-400">Placements</span>
              </div>
            </div>

            {/* Close Button */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Link to={ROUTES.COURSES} onClick={() => setSelectedMentor(null)}>
                <Button variant="primary" size="sm" className="font-bold rounded-xl">
                  View Mentored Courses
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedMentor(null)}
                className="font-bold rounded-xl"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
