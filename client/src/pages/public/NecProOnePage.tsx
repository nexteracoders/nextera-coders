import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routes';
import { POPULAR_COURSES_DATA } from '../../data/courses.data';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { ProOnePaymentModal, PRO_ONE_PLANS } from '../../components/pro-one/ProOnePaymentModal';
import { paymentService } from '../../services/payment.service';
import {
  Crown,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Code2,
  Video,
  Users,
  FileCheck,
  Briefcase,
  Terminal,
  ChevronDown,
  Layers,
  Target,
  BarChart2,
  BookOpen,
  Trophy,
  Laptop,
  Play,
  Code,
  Headphones,
  PhoneCall,
  Newspaper,
} from 'lucide-react';
import { cn } from '../../utils/cn';

const getFeatureIcon = (feature: string) => {
  if (feature.includes('All Course Access')) {
    return <BarChart2 className="w-4 h-4 text-slate-800 dark:text-slate-200 shrink-0 stroke-[1.75]" />;
  }
  if (feature.includes('Core CS Subjects')) {
    return <BookOpen className="w-4 h-4 text-slate-800 dark:text-slate-200 shrink-0 stroke-[1.75]" />;
  }
  if (feature.includes('Mock Tests')) {
    return <FileCheck className="w-4 h-4 text-slate-800 dark:text-slate-200 shrink-0 stroke-[1.75]" />;
  }
  if (feature.includes('Coding Contest')) {
    return <Trophy className="w-4 h-4 text-slate-800 dark:text-slate-200 shrink-0 stroke-[1.75]" />;
  }
  if (feature.includes('AI Support')) {
    return <Sparkles className="w-4 h-4 text-slate-800 dark:text-slate-200 shrink-0 stroke-[1.75]" />;
  }
  if (feature.includes('Quick Compiler')) {
    return <Laptop className="w-4 h-4 text-slate-800 dark:text-slate-200 shrink-0 stroke-[1.75]" />;
  }
  if (feature.includes('Run/Submit')) {
    return <Play className="w-4 h-4 text-slate-800 dark:text-slate-200 shrink-0 stroke-[1.75]" />;
  }
  if (feature.includes('DSA Sheet')) {
    return <Code className="w-4 h-4 text-slate-800 dark:text-slate-200 shrink-0 stroke-[1.75]" />;
  }
  if (feature.includes('400+ Coding Problem')) {
    return <Terminal className="w-4 h-4 text-slate-800 dark:text-slate-200 shrink-0 stroke-[1.75]" />;
  }
  if (feature.includes('Live Group Sessions')) {
    return <Headphones className="w-4 h-4 text-slate-800 dark:text-slate-200 shrink-0 stroke-[1.75]" />;
  }
  if (feature.includes('Interview Experience')) {
    return <PhoneCall className="w-4 h-4 text-slate-800 dark:text-slate-200 shrink-0 stroke-[1.75]" />;
  }
  if (feature.includes('Article & Tutorials')) {
    return <Newspaper className="w-4 h-4 text-slate-800 dark:text-slate-200 shrink-0 stroke-[1.75]" />;
  }
  return <CheckCircle2 className="w-4 h-4 text-slate-800 dark:text-slate-200 shrink-0 stroke-[1.75]" />;
};

const renderFeatureContent = (feature: string) => {
  const match = feature.match(/^(.*?)\s*(\([^)]+\))$/);
  if (match) {
    return (
      <>
        <span>{match[1]}</span>{' '}
        <span className="text-slate-400 dark:text-slate-500 font-normal">{match[2]}</span>
      </>
    );
  }
  return feature;
};

export const NecProOnePage: React.FC = () => {
  useDocumentTitle('NEC Pro One — All-Access Developer Pass & Interview Suite');
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isProMember = Boolean(
    user &&
    user.isPro &&
    user.subscription?.plan &&
    user.subscription?.status === 'active' &&
    (!user.subscription.endDate || new Date(user.subscription.endDate) > new Date())
  );

  const [selectedPlanId, setSelectedPlanId] = useState<'monthly' | 'yearly' | 'lifetime'>('yearly');
  const [plans, setPlans] = useState(PRO_ONE_PLANS);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(0);

  useEffect(() => {
    paymentService
      .getPublicPaymentConfig()
      .then((data) => {
        if (data.proOnePlans && data.proOnePlans.length > 0) {
          setPlans(data.proOnePlans);
        }
      })
      .catch(() => {});
  }, []);

  const handleOpenPayment = (planId: 'monthly' | 'yearly' | 'lifetime') => {
    if (!isAuthenticated || !user) {
      navigate(ROUTES.LOGIN, { state: { from: location } });
      return;
    }
    if (isProMember) return;
    setSelectedPlanId(planId);
    setPaymentModalOpen(true);
  };

  const toggleFaq = (index: number) => {
    setActiveFaqIndex(activeFaqIndex === index ? null : index);
  };

  const INTERVIEW_SUITE_FEATURES = [
    {
      icon: <Target className="w-6 h-6 text-amber-500" />,
      title: '500+ Curated SDE Problem Sheet',
      desc: 'Pattern-based progression across Arrays, Trees, Graphs, DP, Tries with full step-by-step HD video solutions and editorial approaches.',
      badge: 'DSA Mastery',
    },
    {
      icon: <Layers className="w-6 h-6 text-indigo-500" />,
      title: 'System Design (HLD & LLD) Blueprints',
      desc: 'Real-world scalable architecture deep dives: Uber Ride Matcher, Netflix Video Streaming, Distributed Cache, Rate Limiter, and TinyURL.',
      badge: 'Architect Track',
    },
    {
      icon: <Terminal className="w-6 h-6 text-emerald-500" />,
      title: 'Live Whiteboard Mock Interview Simulator',
      desc: 'Interactive live coding whiteboard with real-time test runner, edge-case validator, and timed technical screening questions.',
      badge: 'FAANG Ready',
    },
    {
      icon: <Users className="w-6 h-6 text-blue-500" />,
      title: '1-on-1 Senior Tech Mentorship & Code Reviews',
      desc: 'Weekly live cohort AMA sessions, direct doubt-solving channels, and PR code reviews from Staff & Principal Software Engineers.',
      badge: 'Mentorship',
    },
    {
      icon: <FileCheck className="w-6 h-6 text-violet-500" />,
      title: 'ATS Resume & GitHub Portfolio Roast',
      desc: 'Get your resume optimized for automated screening filters and your GitHub repos reviewed to stand out to top hiring managers.',
      badge: 'Career Boost',
    },
    {
      icon: <Briefcase className="w-6 h-6 text-orange-500" />,
      title: 'Exclusive Hiring Portal & Startup Referrals',
      desc: 'Fast-track your job applications with direct interview referrals to 200+ partner tech companies and hyper-growth product startups.',
      badge: 'Job Fast-Track',
    },
  ];

  const COMPARISON_ROWS = [
    { feature: 'Text Curriculum & Reading Notes', free: true, proCourse: true, proOne: true },
    { feature: 'In-Browser Multi-Language Compiler', free: true, proCourse: true, proOne: true },
    { feature: 'Basic Practice Questions & Quizzes', free: true, proCourse: true, proOne: true },
    { feature: 'HD Video Lectures for Enrolled Track', free: 'Preview Only', proCourse: '1 Course Only', proOne: 'All Current & Future Courses' },
    { feature: 'Official Verified Career Certificates', free: false, proCourse: '1 Certificate', proOne: 'Unlimited Verifiable Credentials' },
    { feature: '500+ SDE Pattern-Based Problem Sheet', free: false, proCourse: false, proOne: 'Full Access + Video Solutions' },
    { feature: 'System Design HLD & LLD Masterclass', free: false, proCourse: false, proOne: 'Complete Blueprints & Diagrams' },
    { feature: '1-on-1 Senior Tech Mentorship', free: false, proCourse: false, proOne: 'Weekly Live AMAs & Code Reviews' },
    { feature: 'Resume & GitHub Portfolio Roast', free: false, proCourse: false, proOne: 'Personalized 1-on-1 Feedback' },
    { feature: 'Exclusive Hiring Referral Network', free: false, proCourse: false, proOne: '200+ Partner Startups & Tech Roles' },
  ];

  const FAQS = [
    {
      q: 'What is included with NEC Pro One Membership?',
      a: 'NEC Pro One gives you 100% unlimited access to every single course on NextEra Coders, all HD video lectures, downloadable production source codes, our 500+ SDE interview sheet, System Design blueprints, 1-on-1 senior mentorship, resume optimization, and exclusive hiring referrals.',
    },
    {
      q: 'How does the Yearly Plan compare to individual courses?',
      a: 'Buying courses individually at ₹1,999 each would cost over ₹24,000+ for all tracks. The NEC Pro One Yearly Plan costs only ₹4,999/year (80% OFF) and includes all current courses, all future courses released during your year, plus the entire interview preparation and mentorship suite.',
    },
    {
      q: 'How does the 1-on-1 mentorship and doubt solving work?',
      a: 'As a Pro One member, you get access to private mentor discussion channels, weekly live cohort office hours, and monthly code review slots where senior engineers review your architecture and code.',
    },
    {
      q: 'What payment methods are supported?',
      a: 'We support all major Indian and international payment options including Instant UPI (Google Pay, PhonePe, Paytm, BHIM, Cred with QR code), Credit/Debit cards (Visa, Mastercard, RuPay), Net Banking (top 20+ banks), and No-Cost EMI.',
    },
    {
      q: 'Can I cancel or get a refund if it is not right for me?',
      a: 'Yes, we offer a 100% risk-free 7-day money-back guarantee. If you are not satisfied with the content and mentorship within 7 days, simply reach out to support for an unconditional refund.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* 1. Hero Section */}
      <section className="relative pt-12 sm:pt-20 pb-20 overflow-hidden">
        {/* Ambient Glowing Blobs */}
        <div className="absolute top-10 left-1/3 w-[600px] h-[600px] bg-gradient-to-tr from-amber-500/15 via-orange-500/10 to-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-1/2 right-10 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          {/* Glowing Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-mono font-bold shadow-lg shadow-amber-500/10">
            <Crown className="w-4 h-4 fill-current text-amber-500" />
            <span>NEC PRO ONE — THE ULTIMATE ALL-ACCESS PASS</span>
          </div>

          <div className="space-y-4 max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.08]">
              One Pass. <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 bg-clip-text text-transparent">
                Unlimited Tech Mastery.
              </span>{' '}
              <br className="hidden sm:inline" />
              Get Hired Faster.
            </h1>

            <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
              Unlock every single Pro course, our comprehensive FAANG & SDE interview preparation suite, system design masterclasses, 1-on-1 mentorship, and exclusive hiring referrals.
            </p>
          </div>

          {/* Hero Quick CTA */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            {isProMember ? (
              <Link to={ROUTES.DASHBOARD}>
                <button className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-extrabold text-base text-slate-950 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300 hover:from-amber-300 hover:to-orange-300 shadow-xl shadow-amber-500/25 transition-all duration-200 cursor-pointer">
                  <Crown className="w-5 h-5 fill-current" />
                  <span>NEC Pro Member</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            ) : (
              <button
                onClick={() => handleOpenPayment('lifetime')}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-extrabold text-base text-slate-950 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300 hover:from-amber-300 hover:to-orange-300 shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <Crown className="w-5 h-5 fill-current" />
                <span>Activate Membership</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <a href="#plans">
              <Button size="lg" variant="outline">
                {isProMember ? 'Review Your Included Benefits' : 'Compare All Plans'}
              </Button>
            </a>
          </div>

          {/* Quick Metrics Bar */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            {[
              { label: 'All Courses Included', value: '100% Full Access', icon: <Video className="w-4 h-4 text-amber-500" /> },
              { label: 'SDE Problem Sheet', value: '500+ Curated DSA', icon: <Code2 className="w-4 h-4 text-emerald-500" /> },
              { label: 'System Design', value: 'HLD & LLD Blueprints', icon: <Layers className="w-4 h-4 text-indigo-500" /> },
              { label: 'Senior Mentorship', value: '1-on-1 Code Reviews', icon: <Users className="w-4 h-4 text-blue-500" /> },
            ].map((stat) => (
              <div
                key={stat.label}
                className="p-4 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shadow-xs space-y-1"
              >
                <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                  {stat.icon}
                  <span>{stat.label}</span>
                </div>
                <div className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white font-mono">
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Membership Plans & Pricing Cards */}
      <section id="plans" className="py-16 sm:py-24 bg-slate-50 dark:bg-dark-950 border-y border-slate-200/80 dark:border-dark-800 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-200/60 dark:border-indigo-800/60">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Transparent Membership Plans</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              Choose Your Membership Plan
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Invest in your engineering career. Backed by our 7-day unconditional money-back guarantee.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto items-stretch">
            {plans.map((plan) => {
              const isProPlan = plan.id === 'lifetime';
              const isPlusPlan = plan.id === 'yearly';
              const isBasicPlan = plan.id === 'monthly';

              return (
                <div
                  key={plan.id}
                  className={cn(
                    'rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 relative',
                    isProPlan
                      ? 'bg-white dark:bg-dark-900 border-2 border-[#8b5cf6] dark:border-[#a855f7] shadow-xl shadow-purple-500/5'
                      : 'bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shadow-xs hover:border-slate-300 dark:hover:border-dark-700'
                  )}
                >
                  <div>
                    {/* Header: Title, Subtitle, and Popular Badge */}
                    <div className="flex items-start justify-between min-h-[46px]">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                          {plan.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {plan.subtitle}
                        </p>
                      </div>

                      {plan.badge && (
                        <span className="px-3 py-0.5 rounded-full text-xs font-medium bg-[#f3e8ff] dark:bg-purple-950/70 text-[#7c3aed] dark:text-purple-300">
                          {plan.badge}
                        </span>
                      )}
                    </div>

                    {/* Price Block */}
                    <div className="mt-5 h-[62px] flex flex-col justify-end">
                      {isBasicPlan ? (
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-sans tracking-tight">
                            ₹{plan.price.toLocaleString()}
                          </span>
                          <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal">
                            {plan.durationLabel}
                          </span>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-sans tracking-tight">
                              ₹{(plan.perMonthPrice || (isPlusPlan ? 250 : 167)).toLocaleString()}
                            </span>
                            <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal">
                              /month
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
                            {plan.subPriceText || (isPlusPlan ? '₹2,999 for 1 year' : '₹5,999 for 3 years')}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    {isProMember ? (
                      <Link to={ROUTES.DASHBOARD} className="block mt-5">
                        <button
                          type="button"
                          className="w-full py-2.5 px-4 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer text-slate-950 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300 hover:from-amber-300 hover:to-orange-300 shadow-md shadow-amber-500/25 active:scale-[0.99]"
                        >
                          <Crown className="w-4 h-4 fill-current text-slate-950" />
                          <span>Active Membership</span>
                        </button>
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenPayment(plan.id)}
                        className={cn(
                          'w-full py-2.5 px-4 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer text-center mt-5 active:scale-[0.99]',
                          isProPlan
                            ? 'bg-[#6366f1] hover:bg-[#4f46e5] text-white shadow-md shadow-indigo-600/25'
                            : 'bg-[#e5e7eb] hover:bg-[#d1d5db] text-slate-900 dark:bg-dark-800 dark:hover:bg-dark-750 dark:text-slate-100'
                        )}
                      >
                        Activate Membership
                      </button>
                    )}

                    {/* "This plan includes:" Section */}
                    <div className="mt-6 pt-1">
                      <div className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3.5">
                        This plan includes:
                      </div>

                      <div className="space-y-2.5">
                        {plan.features.map((feature, fIdx) => (
                          <div
                            key={fIdx}
                            className="flex items-center gap-2.5 text-xs sm:text-[13px] text-slate-700 dark:text-slate-300 font-normal leading-snug"
                          >
                            {getFeatureIcon(feature)}
                            <span>{renderFeatureContent(feature)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center text-xs text-slate-500 font-mono flex items-center justify-center gap-4 pt-4">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" /> 7-Day Money-Back Guarantee
            </span>
            <span>•</span>
            <span>Instant Access</span>
            <span>•</span>
            <span>Cancel Anytime</span>
          </div>
        </div>
      </section>

      {/* 3. Comprehensive Developer & FAANG Interview Preparation Suite */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 text-xs font-mono font-bold">
              <Target className="w-3.5 h-3.5" /> DEVELOPER CAREER ACCELERATION
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              Everything You Need to Crack Top Tech Roles
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Structured step-by-step interview preparation designed by Staff Engineers from Google, Amazon, and Uber.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {INTERVIEW_SUITE_FEATURES.map((feat) => (
              <Card key={feat.title} variant="elevated" className="p-6 flex flex-col justify-between hover:border-amber-500/40 transition-all">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-dark-850 flex items-center justify-center">
                      {feat.icon}
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-dark-850 text-slate-600 dark:text-slate-300">
                      {feat.badge}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{feat.title}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{feat.desc}</p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-dark-800 flex items-center text-xs text-amber-600 dark:text-amber-400 font-bold font-mono">
                  <span>Included in Pro One</span>
                  <CheckCircle2 className="w-3.5 h-3.5 ml-1.5" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 4. All Premium Courses Included in Pro One */}
      <section className="py-16 sm:py-24 bg-slate-100/60 dark:bg-dark-900/40 border-y border-slate-200 dark:border-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-mono font-bold mb-2">
                <Video className="w-3.5 h-3.5" /> ALL FLAGSHIP TRACKS
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
                All Pro Courses Included at ₹0 Extra
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                No per-course paywalls. Learn any track anytime with all HD video lectures and source codes.
              </p>
            </div>

            <Link to={ROUTES.COURSES}>
              <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                View Full Course Catalog
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {POPULAR_COURSES_DATA.map((course) => (
              <Card key={course.id} variant="elevated" className="overflow-hidden flex flex-col justify-between hover:border-amber-500/50 transition-all group">
                <div>
                  <div className="p-5 bg-gradient-to-br from-slate-900 via-dark-850 to-slate-900 border-b border-slate-200 dark:border-dark-800 relative overflow-hidden">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-brand-500/20 text-brand-400 border border-brand-500/30">
                        {course.category}
                      </span>
                      <div className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-extrabold text-[10px] font-mono shadow-md flex items-center gap-1">
                        <Crown className="w-3 h-3 fill-current" />
                        <span>PRO ONE UNLOCKED</span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-400 font-mono">
                      <span>{course.duration}</span>
                      <span>•</span>
                      <span>{course.lessonsCount || 40} Lessons</span>
                    </div>
                  </div>

                  <CardHeader>
                    <CardTitle className="text-base font-bold line-clamp-1 group-hover:text-amber-500 transition-colors">
                      {course.title}
                    </CardTitle>
                    <CardDescription className="text-xs line-clamp-2 mt-1">{course.description}</CardDescription>
                  </CardHeader>
                </div>

                <CardContent className="space-y-4 pt-0">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-dark-850 border border-slate-200 dark:border-dark-800 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400 line-through">₹{course.originalPrice || 9999}</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                      Included with Pro One
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-dark-800 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{course.instructor?.name}</span>
                    <Link to={`/courses/${course.slug}`}>
                      <Button variant="outline" size="sm">
                        View Track
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Detailed Feature Comparison Table */}
      <section className="py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
              Compare Learning Tiers
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              See why NEC Pro One is the highest ROI investment for developers.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 dark:border-dark-800 overflow-hidden bg-white dark:bg-dark-900 shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-dark-800 bg-slate-50 dark:bg-dark-850">
                    <th className="p-4 sm:p-5 font-bold text-slate-900 dark:text-white w-1/2">Features & Benefits</th>
                    <th className="p-4 sm:p-5 font-semibold text-slate-600 dark:text-slate-400 text-center">NEC Free (₹0)</th>
                    <th className="p-4 sm:p-5 font-semibold text-slate-600 dark:text-slate-400 text-center">Per Course Pro (₹1,999)</th>
                    <th className="p-4 sm:p-5 font-extrabold text-amber-600 dark:text-amber-400 bg-amber-50/70 dark:bg-amber-950/30 text-center">
                      NEC Pro One (₹4,999/yr)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-800">
                  {COMPARISON_ROWS.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-dark-850/50 transition-colors">
                      <td className="p-4 font-medium text-slate-800 dark:text-slate-200">{row.feature}</td>
                      <td className="p-4 text-center text-slate-600 dark:text-slate-400">
                        {typeof row.free === 'boolean' ? (
                          row.free ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                          ) : (
                            <span className="text-slate-300 dark:text-dark-700">—</span>
                          )
                        ) : (
                          <span className="text-[11px] font-mono">{row.free}</span>
                        )}
                      </td>
                      <td className="p-4 text-center text-slate-600 dark:text-slate-400">
                        {typeof row.proCourse === 'boolean' ? (
                          row.proCourse ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                          ) : (
                            <span className="text-slate-300 dark:text-dark-700">—</span>
                          )
                        ) : (
                          <span className="text-[11px] font-mono">{row.proCourse}</span>
                        )}
                      </td>
                      <td className="p-4 text-center font-bold text-slate-900 dark:text-white bg-amber-50/40 dark:bg-amber-950/20">
                        {typeof row.proOne === 'boolean' ? (
                          row.proOne ? (
                            <CheckCircle2 className="w-4 h-4 text-amber-500 mx-auto" />
                          ) : (
                            <span className="text-slate-300">—</span>
                          )
                        ) : (
                          <span className="text-xs font-mono text-amber-600 dark:text-amber-400">{row.proOne}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Interactive FAQs Accordion */}
      <section className="py-16 sm:py-24 bg-slate-100/60 dark:bg-dark-900/40 border-t border-slate-200 dark:border-dark-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Frequently Asked Questions</h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Have questions about NEC Pro One? We are here to help.
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = activeFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 dark:border-dark-800 bg-white dark:bg-dark-900 overflow-hidden shadow-xs"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-5 text-left font-bold text-sm sm:text-base flex items-center justify-between gap-4 text-slate-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={cn('w-4 h-4 shrink-0 transition-transform duration-200', isOpen && 'rotate-180 text-amber-500')} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-dark-800 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. Bottom High-Converting CTA Banner */}
      <section className="py-16 bg-gradient-to-r from-slate-900 via-dark-900 to-slate-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-radial-gradient from-amber-500/10 to-transparent pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg">
            <Crown className="w-6 h-6 fill-current" />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Ready to Accelerate Your Engineering Career?
            </h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto">
              Join thousands of developers leveling up with NEC Pro One. Start with the Yearly Pass today.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => handleOpenPayment('yearly')}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-extrabold text-base text-slate-950 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300 hover:from-amber-300 hover:to-orange-300 shadow-2xl shadow-amber-500/30 hover:shadow-amber-500/50 transition-all duration-200 transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Crown className="w-5 h-5 fill-current" />
              <span>Get Yearly Pass for ₹4,999 (Save 80%)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-400 font-mono">
            Instant Access • 7-Day Money Back Guarantee • Cancel Anytime
          </p>
        </div>
      </section>

      {/* Pro One Checkout Modal */}
      <ProOnePaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        initialPlanId={selectedPlanId}
      />
    </div>
  );
};
