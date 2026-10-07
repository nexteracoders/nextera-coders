import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Star,
  Users,
  Award,
  BookOpen,
  Briefcase,
  UserPlus,
  UserCheck,
  Share2,
  Linkedin,
  Twitter,
  Github,
  Youtube,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Section } from '../../components/ui/Section';
import { mentorService, MentorItem, MentorCourseItem } from '../../services/mentor.service';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/ui/Toast';
import { ROUTES } from '../../constants/routes';

export const MentorProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [mentor, setMentor] = useState<MentorItem | null>(null);
  const [courses, setCourses] = useState<MentorCourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingActionLoading, setFollowingActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'about' | 'courses' | 'reviews'>('about');

  useEffect(() => {
    if (id) {
      fetchMentor();
    }
  }, [id]);

  const fetchMentor = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await mentorService.getMentorById(id);
      setMentor(res.mentor);
      setCourses(res.courses || []);
      setIsFollowing(Boolean(res.mentor.isFollowing));
      setFollowersCount(res.mentor.followersCount || 0);
    } catch (err) {
      console.error('Failed to load mentor:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN, { state: { from: `/mentors/${id}` } });
      return;
    }

    if (!mentor) return;

    try {
      setFollowingActionLoading(true);
      // Optimistic update
      const nextFollow = !isFollowing;
      setIsFollowing(nextFollow);
      setFollowersCount((prev) => (nextFollow ? prev + 1 : Math.max(0, prev - 1)));

      const res = await mentorService.toggleFollowMentor(mentor.id);
      setIsFollowing(res.isFollowing);
      setFollowersCount(res.followersCount);
      toastSuccess(res.message);
    } catch (err: any) {
      // Revert optimistic update
      setIsFollowing(!isFollowing);
      setFollowersCount((prev) => (!isFollowing ? prev + 1 : Math.max(0, prev - 1)));
      toastError(err.response?.data?.message || 'Failed to update follow status');
    } finally {
      setFollowingActionLoading(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toastSuccess('Mentor profile link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen py-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading mentor profile...</p>
        </div>
      </div>
    );
  }

  if (!mentor || !mentor.name) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mx-auto flex items-center justify-center text-slate-400">
            <Users className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Mentor Not Found</h2>
          <p className="text-xs text-slate-500">
            The mentor profile you are looking for does not exist or may have been unlisted.
          </p>
          <Link
            to={ROUTES.HOME}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Homepage</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 pt-6">
      <Section containerSize="xl">
        {/* Back Link */}
        <div className="mb-4">
          <Link
            to={ROUTES.HOME}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Mentors Directory</span>
          </Link>
        </div>

        {/* Hero Mentor Card Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-6 sm:p-10 mb-8">
          {/* Ambient Studio Lighting Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 dark:bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            {/* Left: Avatar + Details */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
              {/* Mentor Avatar with Gradient Ring */}
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 p-1 shrink-0 shadow-2xl">
                <div className="w-full h-full rounded-[22px] bg-slate-900 overflow-hidden flex items-center justify-center font-black text-4xl text-slate-200">
                  {mentor.image ? (
                    <img
                      src={mentor.image}
                      alt={mentor.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    mentor.name.slice(0, 2).toUpperCase()
                  )}
                </div>
              </div>

              {/* Title & Role Info */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {mentor.name}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verified Mentor</span>
                  </span>
                </div>

                <p className="text-sm sm:text-base font-semibold text-brand-600 dark:text-brand-400">
                  {mentor.role}
                </p>

                {/* Ex-companies pills */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1">
                  {mentor.exCompanies && mentor.exCompanies.length > 0 ? (
                    mentor.exCompanies.map((comp) => (
                      <span
                        key={comp}
                        className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                      >
                        ex-{comp}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">NextEra Engineering Faculty</span>
                  )}
                </div>

                {/* Social Links */}
                <div className="flex items-center justify-center sm:justify-start gap-2 pt-2">
                  {mentor.socialLinks?.linkedin && (
                    <a
                      href={mentor.socialLinks.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-brand-600 transition-colors cursor-pointer"
                      title="LinkedIn"
                    >
                      <Linkedin className="w-4 h-4 text-sky-600" />
                    </a>
                  )}
                  {(mentor.socialLinks?.twitter || mentor.socialLinks?.x) && (
                    <a
                      href={mentor.socialLinks.twitter || mentor.socialLinks.x}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-brand-600 transition-colors cursor-pointer"
                      title="Twitter / X"
                    >
                      <Twitter className="w-4 h-4 text-sky-400" />
                    </a>
                  )}
                  {mentor.socialLinks?.github && (
                    <a
                      href={mentor.socialLinks.github}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-brand-600 transition-colors cursor-pointer"
                      title="GitHub"
                    >
                      <Github className="w-4 h-4" />
                    </a>
                  )}
                  {mentor.socialLinks?.youtube && (
                    <a
                      href={mentor.socialLinks.youtube}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-brand-600 transition-colors cursor-pointer"
                      title="YouTube"
                    >
                      <Youtube className="w-4 h-4 text-rose-600" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Follow & Share Action Buttons */}
            <div className="flex flex-row lg:flex-col items-center lg:items-end justify-center gap-3 shrink-0">
              <button
                onClick={handleToggleFollow}
                disabled={followingActionLoading}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-xs sm:text-sm transition-all duration-300 shadow-md cursor-pointer active:scale-95 ${
                  isFollowing
                    ? 'bg-emerald-600 hover:bg-rose-600 text-white shadow-emerald-500/20'
                    : 'bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white shadow-brand-500/30 hover:scale-105'
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Follow Mentor</span>
                  </>
                )}
              </button>

              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Profile</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs text-center">
            <div className="flex items-center justify-center gap-1 text-amber-500 mb-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider">Rating</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {mentor.rating || '4.98 / 5.0'}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Learner Satisfaction</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs text-center">
            <div className="flex items-center justify-center gap-1 text-indigo-500 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Learners</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {mentor.studentsMentored || '100k+'}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Students Mentored</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs text-center">
            <div className="flex items-center justify-center gap-1 text-sky-500 mb-1">
              <Briefcase className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Experience</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {mentor.experience || '10+ Yrs'}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Industry Background</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs text-center">
            <div className="flex items-center justify-center gap-1 text-purple-500 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Followers</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {followersCount}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Students Following</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 mb-6">
          <button
            onClick={() => setActiveTab('about')}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'about'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            About & Philosophy
          </button>

          <button
            onClick={() => setActiveTab('courses')}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'courses'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Courses Taught ({courses.length})
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'reviews'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Learner Feedback
          </button>
        </div>

        {/* Tab 1: About & Philosophy */}
        {activeTab === 'about' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Extended Biography */}
              <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs space-y-4">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-brand-500" />
                  <span>About {mentor.name}</span>
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {mentor.bio ||
                    'Dedicated to building the next generation of software engineers through first-principles thinking, hands-on architectural problem solving, and personalized mentorship.'}
                </p>
              </div>

              {/* Spotlight Quote */}
              <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20 p-6 sm:p-8 shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Mentorship Philosophy
                </h4>
                <div className="text-lg font-bold text-slate-900 dark:text-white">
                  "{mentor.quoteTitle}"
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed">
                  "{mentor.quoteBody}"
                </p>
                {mentor.signature && (
                  <div className="pt-2 text-xs font-mono font-bold text-brand-600 dark:text-brand-400">
                    ~ {mentor.signature}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Skills & Expertise */}
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs space-y-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-500" />
                  <span>Technical Expertise</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {mentor.skills && mentor.skills.length > 0 ? (
                    mentor.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    ['Data Structures & Algorithms', 'System Design', 'Full Stack Architecture', 'Distributed Systems'].map((s) => (
                      <span
                        key={s}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800"
                      >
                        {s}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Placements & Impact */}
              <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs space-y-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Career Placements
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Students mentored by {mentor.name} have successfully secured software engineering offers at Tier-1 product companies and high-growth venture-backed startups worldwide.
                </p>
                <div className="pt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{mentor.placements || '500+ Tier-1 Offers'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Courses */}
        {activeTab === 'courses' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Courses Taught by {mentor.name}
              </h3>
            </div>

            {courses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((c, idx) => (
                  <div
                    key={c.slug || idx}
                    className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      {c.thumbnail && (
                        <div className="h-44 w-full overflow-hidden bg-slate-900">
                          <img
                            src={c.thumbnail}
                            alt={c.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <div className="p-6 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400">
                            {c.category}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 font-mono">
                            {c.level}
                          </span>
                        </div>
                        <h4 className="font-bold text-base text-slate-900 dark:text-white line-clamp-2">
                          {c.title}
                        </h4>
                        {c.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                            {c.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="p-6 pt-0 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center justify-between">
                      <div className="text-base font-black text-slate-900 dark:text-white">
                        ₹{c.proPrice || c.originalPrice || 0}
                      </div>
                      <Link
                        to={`/courses/${c.slug}`}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white transition-colors cursor-pointer"
                      >
                        <span>View Curriculum</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
                <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className="text-base font-bold text-slate-800 dark:text-slate-200">
                  Curriculum Updating
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  New masterclasses and courses under this instructor will be published soon.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Reviews / Feedback */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  author: 'Aman Sharma',
                  role: 'SDE-1 at Amazon',
                  comment:
                    'The clarity with which algorithmic patterns and time complexity are explained is unmatched. Helped me crack Tier-1 interviews in my final year!',
                  rating: 5,
                },
                {
                  author: 'Priya Patel',
                  role: 'Full Stack Engineer',
                  comment:
                    'Practical, no-fluff mentorship. The live in-browser architecture design and problem sessions made complex distributed systems easy to understand.',
                  rating: 5,
                },
                {
                  author: 'Rahul Verma',
                  role: 'Backend Developer at Zomato',
                  comment:
                    'Hands-down the best instructor I have had. From concurrency patterns to low-level design, every session delivers actionable engineering depth.',
                  rating: 5,
                },
                {
                  author: 'Sneha Roy',
                  role: 'Cloud Architect',
                  comment:
                    'The mentor’s real-world engineering background shines through. You don’t just memorize code; you learn to think like a staff engineer.',
                  rating: 5,
                },
              ].map((rev, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {rev.author}
                      </h4>
                      <p className="text-xs text-brand-600 dark:text-brand-400 font-medium">
                        {rev.role}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                    "{rev.comment}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>
    </div>
  );
};
