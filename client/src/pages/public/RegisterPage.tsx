import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/ui/Toast';
import { signInWithGoogle } from '../../config/googleAuth';
import { signInWithGitHub } from '../../config/githubAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ROUTES } from '../../constants/routes';
import {
  Terminal,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Code2,
  Trophy,
  Cpu,
  Layers,
  Award,
  Play,
  Check,
  Gift,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Zap,
  Flame,
  Star,
  Activity,
  Server,
  Database,
  Bot,
  CheckCircle2,
  MessageSquare,
  Monitor,
  GraduationCap,
} from 'lucide-react';
import { cn } from '../../utils/cn';

// ============================================================================
// 3-LAYER CLEAN COSMIC ORBITAL BACKGROUND (Icons Only, Perfectly Upright)
// ============================================================================
interface OrbitIconItem {
  icon: React.ReactNode;
  positionAngle: number;
  glow: string;
}

interface OrbitLayer {
  layer: number;
  size: number;
  duration: number;
  direction: 'clockwise' | 'counter';
  borderStyle: 'dashed' | 'solid';
  color: string;
  icons: OrbitIconItem[];
}

const ORBIT_LAYERS: OrbitLayer[] = [
  {
    layer: 1,
    size: 400,
    duration: 36,
    direction: 'clockwise',
    borderStyle: 'dashed',
    color: 'border-slate-300/40 dark:border-slate-700/35',
    icons: [
      {
        icon: <Zap className="w-4 h-4 text-amber-500/70 dark:text-amber-400/70" />,
        positionAngle: 0,
        glow: 'border-amber-500/20 shadow-none',
      },
      {
        icon: <MessageSquare className="w-4 h-4 text-emerald-500/70 dark:text-emerald-400/70" />,
        positionAngle: 120,
        glow: 'border-emerald-500/20 shadow-none',
      },
      {
        icon: <Monitor className="w-4 h-4 text-cyan-500/70 dark:text-cyan-400/70" />,
        positionAngle: 240,
        glow: 'border-cyan-500/20 shadow-none',
      },
    ],
  },
  {
    layer: 2,
    size: 720,
    duration: 52,
    direction: 'counter',
    borderStyle: 'dashed',
    color: 'border-slate-300/35 dark:border-slate-800/40',
    icons: [
      {
        icon: <Bot className="w-4 h-4 text-purple-500/70 dark:text-purple-400/70" />,
        positionAngle: 45,
        glow: 'border-purple-500/20 shadow-none',
      },
      {
        icon: <Code2 className="w-4 h-4 text-teal-500/70 dark:text-teal-400/70" />,
        positionAngle: 135,
        glow: 'border-teal-500/20 shadow-none',
      },
      {
        icon: <GraduationCap className="w-4 h-4 text-indigo-500/70 dark:text-indigo-400/70" />,
        positionAngle: 225,
        glow: 'border-indigo-500/20 shadow-none',
      },
      {
        icon: <span className="text-base select-none leading-none opacity-70">⚛️</span>,
        positionAngle: 315,
        glow: 'border-cyan-500/20 shadow-none',
      },
    ],
  },
  {
    layer: 3,
    size: 1040,
    duration: 68,
    direction: 'clockwise',
    borderStyle: 'dashed',
    color: 'border-slate-300/30 dark:border-slate-800/30',
    icons: [
      {
        icon: <Trophy className="w-4 h-4 text-amber-500/70 dark:text-yellow-400/70" />,
        positionAngle: 0,
        glow: 'border-amber-500/20 shadow-none',
      },
      {
        icon: <Terminal className="w-4 h-4 text-emerald-500/70 dark:text-emerald-400/70" />,
        positionAngle: 90,
        glow: 'border-emerald-500/20 shadow-none',
      },
      {
        icon: <Sparkles className="w-4 h-4 text-pink-500/70 dark:text-pink-400/70" />,
        positionAngle: 180,
        glow: 'border-pink-500/20 shadow-none',
      },
      {
        icon: <Flame className="w-4 h-4 text-rose-500/70 dark:text-rose-400/70" />,
        positionAngle: 270,
        glow: 'border-rose-500/20 shadow-none',
      },
    ],
  },
];

// ============================================================================
// INTERACTIVE SLIDING SHOWCASE DATA (4 Dynamic Feature Stories)
// ============================================================================
interface SlideData {
  id: string;
  tabTitle: string;
  tag: string;
  icon: React.ReactNode;
  badge: string;
  headline: string;
  description: string;
  themeColor: string;
  glowColor: string;
  accentBorder: string;
}

const SPOTLIGHT_SLIDES: SlideData[] = [
  {
    id: 'compiler',
    tabTitle: 'Cloud IDE',
    tag: 'Interactive Sandbox',
    icon: <Code2 className="w-4 h-4" />,
    badge: '⚡ ZERO-LAG COMPILER',
    headline: 'Multi-Language Cloud Compiler',
    description: 'Write, compile and execute Python, C++, Java 21, and JavaScript with instant output and zero setup directly in your browser.',
    themeColor: 'from-emerald-500 to-teal-500',
    glowColor: 'bg-emerald-500/20',
    accentBorder: 'border-emerald-500/40',
  },
  {
    id: 'dsa',
    tabTitle: '150 DSA',
    tag: 'Interview Accelerator',
    icon: <Cpu className="w-4 h-4" />,
    badge: '🧠 150 INTERVIEW PATTERNS',
    headline: 'Pattern-Based DSA Mastery',
    description: 'Master 150 essential coding interview patterns with real-time dynamic visualizers engineered for FAANG & top tech roles.',
    themeColor: 'from-cyan-500 to-blue-500',
    glowColor: 'bg-cyan-500/20',
    accentBorder: 'border-cyan-500/40',
  },
  {
    id: 'rewards',
    tabTitle: 'XP Swags',
    tag: 'Arena Battles',
    icon: <Trophy className="w-4 h-4" />,
    badge: '🎁 COINS & REAL MERCH',
    headline: 'Earn Coins, Swag & Merch',
    description: 'Solve daily challenges, maintain coding streaks, climb leaderboards, and redeem earned coins for real hoodies, stickers & certs.',
    themeColor: 'from-amber-500 to-orange-500',
    glowColor: 'bg-amber-500/20',
    accentBorder: 'border-amber-500/40',
  },
  {
    id: 'fullstack',
    tabTitle: 'Full-Stack AI',
    tag: 'Production Systems',
    icon: <Layers className="w-4 h-4" />,
    badge: '🚀 PRODUCTION APPS',
    headline: 'Full-Stack & GenAI Ecosystem',
    description: 'Architect modern full-stack systems with React 19, TypeScript, PostgreSQL, Docker microservices, and live GenAI LLM agents.',
    themeColor: 'from-purple-500 to-indigo-500',
    glowColor: 'bg-purple-500/20',
    accentBorder: 'border-purple-500/40',
  },
];

// Interactive IDE Snippets with Syntax Highlighted Tokens
interface CodeToken {
  text: string;
  type: 'keyword' | 'fn' | 'str' | 'num' | 'comment' | 'plain' | 'var';
}

interface IDELang {
  id: string;
  name: string;
  icon: string;
  ext: string;
  tokens: CodeToken[][];
  output: string;
  execTime: string;
  memory: string;
}

const IDE_LANGUAGES: IDELang[] = [
  {
    id: 'py',
    name: 'Python 3.12',
    icon: '🐍',
    ext: 'main.py',
    tokens: [
      [
        { text: 'def ', type: 'keyword' },
        { text: 'two_sum', type: 'fn' },
        { text: '(nums, target):', type: 'plain' },
      ],
      [
        { text: '    lookup = {}', type: 'plain' },
      ],
      [
        { text: '    for ', type: 'keyword' },
        { text: 'i, num ', type: 'var' },
        { text: 'in ', type: 'keyword' },
        { text: 'enumerate', type: 'fn' },
        { text: '(nums):', type: 'plain' },
      ],
      [
        { text: '        diff = target - num', type: 'plain' },
      ],
      [
        { text: '        if ', type: 'keyword' },
        { text: 'diff ', type: 'var' },
        { text: 'in ', type: 'keyword' },
        { text: 'lookup:', type: 'plain' },
      ],
      [
        { text: '            return ', type: 'keyword' },
        { text: '[lookup[diff], i]', type: 'var' },
      ],
      [
        { text: '        lookup[num] = i', type: 'plain' },
      ],
      [
        { text: 'print', type: 'fn' },
        { text: '(two_sum([', type: 'plain' },
        { text: '2, 7, 11, 15', type: 'num' },
        { text: '], ', type: 'plain' },
        { text: '9', type: 'num' },
        { text: '))  ', type: 'plain' },
        { text: '# O(N) Optimal', type: 'comment' },
      ],
    ],
    output: '✓ [0, 1] • Target 9 Matched at indices [0, 1]',
    execTime: '12ms',
    memory: '3.2 MB',
  },
  {
    id: 'cpp',
    name: 'C++ 20',
    icon: '⚡',
    ext: 'solution.cpp',
    tokens: [
      [
        { text: '#include ', type: 'keyword' },
        { text: '<vector>', type: 'str' },
      ],
      [
        { text: 'int ', type: 'keyword' },
        { text: 'maxProfit', type: 'fn' },
        { text: '(std::vector<int>& prices) {', type: 'plain' },
      ],
      [
        { text: '    int ', type: 'keyword' },
        { text: 'minP = INT_MAX, maxP = 0;', type: 'var' },
      ],
      [
        { text: '    for ', type: 'keyword' },
        { text: '(int p : prices) {', type: 'plain' },
      ],
      [
        { text: '        minP = std::min(minP, p);', type: 'plain' },
      ],
      [
        { text: '        maxP = std::max(maxP, p - minP);', type: 'plain' },
      ],
      [
        { text: '    }', type: 'plain' },
      ],
      [
        { text: '    return ', type: 'keyword' },
        { text: 'maxP; ', type: 'var' },
        { text: '// GCC 14 Built (O(N) Kadane)', type: 'comment' },
      ],
      [
        { text: '}', type: 'plain' },
      ],
    ],
    output: '✓ Max Profit: $140 • Kadane Linear Pass Passed',
    execTime: '4ms',
    memory: '1.8 MB',
  },
  {
    id: 'java',
    name: 'Java 21',
    icon: '☕',
    ext: 'Main.java',
    tokens: [
      [
        { text: 'public class ', type: 'keyword' },
        { text: 'Main ', type: 'fn' },
        { text: '{', type: 'plain' },
      ],
      [
        { text: '    public static void ', type: 'keyword' },
        { text: 'main', type: 'fn' },
        { text: '(String[] args) {', type: 'plain' },
      ],
      [
        { text: '        var ', type: 'keyword' },
        { text: 'student = ', type: 'plain' },
        { text: '"NextEra Engineer";', type: 'str' },
      ],
      [
        { text: '        System.out.println', type: 'fn' },
        { text: '(', type: 'plain' },
        { text: '"🚀 Ready: " ', type: 'str' },
        { text: '+ student);', type: 'plain' },
      ],
      [
        { text: '    }', type: 'plain' },
      ],
      [
        { text: '}', type: 'plain' },
      ],
    ],
    output: '✓ 🚀 Ready: NextEra Engineer (JDK 21 LTS)',
    execTime: '18ms',
    memory: '14.5 MB',
  },
  {
    id: 'js',
    name: 'JavaScript',
    icon: '🌐',
    ext: 'app.js',
    tokens: [
      [
        { text: 'const ', type: 'keyword' },
        { text: 'coder = {', type: 'plain' },
      ],
      [
        { text: '  role: ', type: 'plain' },
        { text: '"Full-Stack AI Engineer",', type: 'str' },
      ],
      [
        { text: '  streak: ', type: 'plain' },
        { text: '24,', type: 'num' },
        { text: '  coins: ', type: 'plain' },
        { text: '500', type: 'num' },
      ],
      [
        { text: '};', type: 'plain' },
      ],
      [
        { text: 'console.log', type: 'fn' },
        { text: '(`🔥 Level \${coder.streak} Unlocked!`);', type: 'str' },
      ],
    ],
    output: '✓ 🔥 Level 24 Unlocked! • Node 22 V8 JIT Passed',
    execTime: '8ms',
    memory: '4.1 MB',
  },
];

// Interactive Swag Items
const SWAG_ITEMS = [
  {
    id: 'hoodie',
    title: 'NEC Engineer Hoodie',
    coins: '500 Coins',
    tag: 'Premium Merch',
    icon: '👕',
    detail: 'Heavyweight cotton hoodie with embroidered NextEra Coders logo.',
    color: 'from-purple-500/20 to-indigo-500/20 border-purple-500/40 text-purple-400',
  },
  {
    id: 'stickers',
    title: 'Holographic Dev Stickers',
    coins: '100 Coins',
    tag: 'Free Swag',
    icon: '⭐',
    detail: 'Matte waterproof vinyl stickers for your laptop & gear.',
    color: 'from-amber-500/20 to-yellow-500/20 border-amber-500/40 text-amber-400',
  },
  {
    id: 'cert',
    title: 'Verified ISO Certificate',
    coins: 'Free with Track',
    tag: 'Career Credential',
    icon: '📜',
    detail: 'QR-verifiable certificate with unique tamper-proof ID.',
    color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-400',
  },
  {
    id: 'discord',
    title: 'Pro Discord VIP Badge',
    coins: 'Instant Unlock',
    tag: 'Community Perk',
    icon: '🚀',
    detail: 'Exclusive access to mentor channels, live AMAs & job referrals.',
    color: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/40 text-cyan-400',
  },
];

// Community Live Ticker Events
const LIVE_EVENTS = [
  { user: 'Aarav S.', action: 'solved "Sliding Window Maximum" in C++', time: '3s ago', icon: '⚡' },
  { user: 'Sneha P.', action: 'claimed +100 Starter XP Coins', time: '8s ago', icon: '🪙' },
  { user: 'Vikram M.', action: 'ran Python 3.12 Cloud Compiler', time: '14s ago', icon: '🐍' },
  { user: 'Priya K.', action: 'unlocked "Dynamic Programming Mastery"', time: '21s ago', icon: '🧠' },
  { user: 'Rahul D.', action: 'redeemed NEC Engineer Hoodie with 500 Coins', time: '35s ago', icon: '👕' },
];

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~])/;

const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60, 'Name cannot exceed 60 characters'),
    email: z.string().trim().min(1, 'Email is required').email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        PASSWORD_REGEX,
        'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special symbol (@, #, $, etc.)'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGitHubLoading, setIsGitHubLoading] = useState(false);
  const { register: registerAuth, socialLogin, isLoading, error, clearError } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  // ==========================================================================
  // SLIDING SHOWCASE INTERACTIVE STATES & ANIMATIONS
  // ==========================================================================
  const [activeSlide, setActiveSlide] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [activeEventIdx, setActiveEventIdx] = useState(0);

  // Slide 0: Code Sandbox States
  const [selectedLangIdx, setSelectedLangIdx] = useState(0);
  const [isSandboxRunning, setIsSandboxRunning] = useState(false);
  const [sandboxPassed, setSandboxPassed] = useState(false);

  // Slide 1: DSA Pattern States (Sliding Window & Two Pointers step animations)
  const [selectedPatternIdx, setSelectedPatternIdx] = useState(0);
  const [slidingWindowStep, setSlidingWindowStep] = useState(0);
  const [isSimulatingPattern, setIsSimulatingPattern] = useState(false);
  const [patternPassed, setPatternPassed] = useState(false);

  // Slide 2: Swag & Rewards States
  const [selectedSwagIdx, setSelectedSwagIdx] = useState(0);
  const [hasClaimedPerk, setHasClaimedPerk] = useState(false);
  const [xpCoinCount, setXpCoinCount] = useState(100);

  // Slide 3: Full-Stack Architecture States
  const [isCheckingSystem, setIsCheckingSystem] = useState(false);
  const [systemHealthy, setSystemHealthy] = useState(true);
  const [pingCount, setPingCount] = useState(14);

  // Auto-slide every 5.5 seconds (paused on hover)
  useEffect(() => {
    if (!isAutoPlay) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SPOTLIGHT_SLIDES.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [isAutoPlay]);

  // Live Community Ticker Rotation every 3.2s
  useEffect(() => {
    const tickerInterval = setInterval(() => {
      setActiveEventIdx((prev) => (prev + 1) % LIVE_EVENTS.length);
    }, 3200);
    return () => clearInterval(tickerInterval);
  }, []);

  // Sliding Window Animated Loop for DSA Visualizer
  useEffect(() => {
    if (activeSlide !== 1) return;
    const windowInterval = setInterval(() => {
      setSlidingWindowStep((prev) => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(windowInterval);
  }, [activeSlide]);

  // Run Sandbox code simulation
  const handleRunCode = () => {
    if (isSandboxRunning) return;
    setIsSandboxRunning(true);
    setSandboxPassed(false);
    setTimeout(() => {
      setIsSandboxRunning(false);
      setSandboxPassed(true);
    }, 600);
  };

  // Simulate pattern test
  const handleTestPattern = () => {
    if (isSimulatingPattern) return;
    setIsSimulatingPattern(true);
    setPatternPassed(false);
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setSlidingWindowStep(step % 4);
      if (step >= 4) {
        clearInterval(interval);
        setIsSimulatingPattern(false);
        setPatternPassed(true);
        setTimeout(() => setPatternPassed(false), 3500);
      }
    }, 450);
  };

  // Claim Starter XP
  const handleClaimStarterBonus = () => {
    if (hasClaimedPerk) return;
    setHasClaimedPerk(true);
    setXpCoinCount(200);
    success('🎉 +100 Starter XP Coins Credited! Complete registration to save to your profile.', 'Starter Perk Unlocked');
  };

  // Ping System Health
  const handlePingSystem = () => {
    if (isCheckingSystem) return;
    setIsCheckingSystem(true);
    setSystemHealthy(false);
    setTimeout(() => {
      setIsCheckingSystem(false);
      setSystemHealthy(true);
      setPingCount(Math.floor(Math.random() * 6) + 10);
    }, 450);
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      clearError();
      const user = await registerAuth({
        name: data.name,
        email: data.email,
        password: data.password,
      });
      success(`Welcome to NextEra Coders, ${user.name}! 🚀 Your account is active.`, 'Account Created');
      navigate(ROUTES.DASHBOARD);
    } catch {
      // Error handled by redux slice
    }
  };

  // Google Cloud Console Real Google Sign Up Handler
  const handleGoogleSignUp = async () => {
    try {
      setIsGoogleLoading(true);
      clearError();
      const googleUser = await signInWithGoogle();
      if (!googleUser || !googleUser.email) {
        throw new Error('Google authentication did not return a valid email.');
      }

      const user = await socialLogin({
        provider: 'google',
        email: googleUser.email,
        name: googleUser.name || 'Google Developer',
        avatar: googleUser.avatar || undefined,
      });

      success(`Welcome to NextEra Coders, ${user.name}! 🚀 Account created with Google.`, 'Account Active');
      navigate(ROUTES.DASHBOARD);
    } catch (err: any) {
      if (
        err.message?.includes('closed') ||
        err.message?.includes('cancelled') ||
        err.message?.includes('popup_closed')
      ) {
        // User closed popup intentionally
        return;
      }
      if (err.message?.includes('blocked') || err.message?.includes('popup_blocked')) {
        toastError('Please allow browser popups to sign up with Google.', 'Popup Blocked');
        return;
      }
      toastError(err.message || 'Could not complete Google Sign-Up.', 'Google Sign-Up Failed');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGitHubLoginWithCode = async (code: string) => {
    try {
      setIsGitHubLoading(true);
      clearError();
      const user = await socialLogin({
        provider: 'github',
        code,
      });

      success(`Welcome to NextEra Coders, ${user.name}! 🚀 Account created with GitHub.`, 'Account Active');
      navigate(ROUTES.DASHBOARD);
    } catch (err: any) {
      toastError(err.message || 'Could not complete GitHub Sign-Up.', 'GitHub Sign-Up Failed');
    } finally {
      setIsGitHubLoading(false);
    }
  };

  // Direct redirect fallback listener (if user redirected back directly to register)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const githubCode = params.get('github_code');
    if (githubCode) {
      handleGitHubLoginWithCode(githubCode);
    }
  }, []);

  // GitHub Real OAuth Sign Up Handler
  const handleGitHubSignUp = async () => {
    try {
      setIsGitHubLoading(true);
      clearError();
      const { code } = await signInWithGitHub();
      if (!code) {
        throw new Error('No authorization code returned from GitHub.');
      }
      await handleGitHubLoginWithCode(code);
    } catch (err: any) {
      if (
        err.message?.includes('closed') ||
        err.message?.includes('cancelled') ||
        err.message?.includes('popup_closed')
      ) {
        // User closed popup intentionally
        return;
      }
      if (err.message?.includes('blocked') || err.message?.includes('popup_blocked')) {
        toastError('Please allow browser popups to sign up with GitHub.', 'Popup Blocked');
        return;
      }
      toastError(err.message || 'Could not complete GitHub Sign-Up.', 'GitHub Sign-Up Failed');
    } finally {
      setIsGitHubLoading(false);
    }
  };

  const currentSlide = SPOTLIGHT_SLIDES[activeSlide];
  const currentLang = IDE_LANGUAGES[selectedLangIdx];
  const currentSwag = SWAG_ITEMS[selectedSwagIdx];
  const currentEvent = LIVE_EVENTS[activeEventIdx];

  // Helper for rendering syntax tokens with rich code styling
  const renderSyntaxToken = (token: CodeToken, idx: number) => {
    switch (token.type) {
      case 'keyword':
        return <span key={idx} className="text-purple-400 font-bold">{token.text}</span>;
      case 'fn':
        return <span key={idx} className="text-cyan-300 font-semibold">{token.text}</span>;
      case 'str':
        return <span key={idx} className="text-emerald-400">{token.text}</span>;
      case 'num':
        return <span key={idx} className="text-amber-400 font-bold">{token.text}</span>;
      case 'comment':
        return <span key={idx} className="text-slate-500 italic">{token.text}</span>;
      case 'var':
        return <span key={idx} className="text-rose-300">{token.text}</span>;
      default:
        return <span key={idx} className="text-slate-200">{token.text}</span>;
    }
  };

  // Sliding Window Sample Data
  const sampleArray = [2, 7, 11, 15, 8, 3];
  const windowSize = 3;
  const currentWindowStart = slidingWindowStep;
  const currentWindowSum = sampleArray.slice(currentWindowStart, currentWindowStart + windowSize).reduce((a, b) => a + b, 0);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-10 font-sans bg-slate-50 dark:bg-dark-950 text-slate-900 dark:text-slate-100 overflow-hidden">
      
      {/* ========================================================================= */}
      {/* 3-LAYER SUBTLE COSMIC ORBITAL BACKGROUND SYSTEM (Low Brightness)           */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 flex items-center justify-center select-none opacity-40 dark:opacity-35">
        {/* Central Core Ambient Glow */}
        <div className="absolute w-80 h-80 rounded-full bg-gradient-to-tr from-emerald-500/5 via-cyan-500/5 to-purple-500/5 blur-3xl opacity-50" />

        {/* 3 Concentric Orbital Rings */}
        {ORBIT_LAYERS.map((orbit) => (
          <div
            key={orbit.layer}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: `${orbit.size}px`,
              height: `${orbit.size}px`,
            }}
          >
            {/* Orbital Track Ring Line */}
            <div
              className={cn(
                'absolute inset-0 rounded-full border transition-colors duration-700',
                orbit.borderStyle === 'dashed' ? 'border-dashed' : 'border-solid',
                orbit.color
              )}
            />

            {/* Revolving Orbit Container */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                animation: `${orbit.direction === 'clockwise' ? 'orbitSpin' : 'orbitCounterSpin'} ${orbit.duration}s linear infinite`,
              }}
            >
              {orbit.icons.map((iconItem, iIdx) => (
                <div
                  key={iIdx}
                  className="absolute inset-0"
                  style={{
                    transform: `rotate(${iconItem.positionAngle}deg)`,
                  }}
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                    {/* Counter-spin cancels orbit container rotation */}
                    <div
                      style={{
                        animation: `${orbit.direction === 'clockwise' ? 'orbitCounterSpin' : 'orbitSpin'} ${orbit.duration}s linear infinite`,
                      }}
                    >
                      {/* Counter-angle cancels position angle -> Icons stay 100% perfectly upright / straight */}
                      <div
                        style={{
                          transform: `rotate(-${iconItem.positionAngle}deg)`,
                        }}
                        className={cn(
                          'w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center',
                          'bg-white/50 dark:bg-dark-900/60 backdrop-blur-[2px]',
                          'border border-slate-200/50 dark:border-dark-800/60',
                          'shadow-sm',
                          iconItem.glow
                        )}
                      >
                        {iconItem.icon}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Main Foreground Container Grid */}
      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* LEFT COLUMN: Registration Form */}
        <div className="lg:col-span-6 xl:col-span-5 w-full max-w-md mx-auto space-y-3.5">
          {/* Compact Header */}
          <div className="flex items-center gap-2.5">
            <Link to={ROUTES.HOME} className="w-[52px] h-8 rounded-lg overflow-hidden bg-slate-950 border border-brand-500/30 flex items-center justify-center shadow-sm hover:scale-105 transition-transform shrink-0" title="Home">
              <video
                src="/favicon-video.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            </Link>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Create account
            </h1>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-2.5">
            <Input
              label="Full Name"
              type="text"
              placeholder="e.g. Alex Johnson"
              leftIcon={<User className="w-4 h-4 text-slate-400" />}
              error={errors.name?.message}
              {...register('name')}
              className="rounded-xl"
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="name@example.com"
              leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
              error={errors.email?.message}
              {...register('email')}
              className="rounded-xl"
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="pointer-events-auto text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              error={errors.password?.message}
              {...register('password')}
              className="rounded-xl"
            />

            <Input
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="pointer-events-auto text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
              className="rounded-xl"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-sm sm:text-base shadow-md shadow-emerald-500/25 transition-all cursor-pointer h-11"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Create Account
            </Button>
          </form>

          {/* Social Logins Divider */}
          <div className="relative flex items-center justify-center my-2">
            <div className="border-t border-slate-200 dark:border-dark-800 w-full" />
            <span className="bg-slate-50 dark:bg-dark-950 px-3 text-xs text-slate-400 font-mono uppercase whitespace-nowrap">
              Or
            </span>
            <div className="border-t border-slate-200 dark:border-dark-800 w-full" />
          </div>

          {/* Social Sign-Up Buttons (Google & GitHub OAuth) */}
          <div className="space-y-2">
            {/* Google Sign-Up */}
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={isGoogleLoading || isGitHubLoading || isLoading}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-900 hover:bg-slate-50 dark:hover:bg-dark-850 text-slate-800 dark:text-slate-100 text-sm sm:text-base font-semibold flex items-center justify-center gap-3 transition-all shadow-xs hover:shadow-sm cursor-pointer group disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isGoogleLoading ? (
                <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin shrink-0" />
              ) : (
                <svg className="w-5 h-5 group-hover:scale-105 transition-transform shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{isGoogleLoading ? 'Connecting Google Account...' : 'Continue with Google'}</span>
            </button>

            {/* GitHub Sign-Up */}
            <button
              type="button"
              onClick={handleGitHubSignUp}
              disabled={isGoogleLoading || isGitHubLoading || isLoading}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-900 hover:bg-slate-50 dark:hover:bg-dark-850 text-slate-800 dark:text-slate-100 text-sm sm:text-base font-semibold flex items-center justify-center gap-3 transition-all shadow-xs hover:shadow-sm cursor-pointer group disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isGitHubLoading ? (
                <div className="w-5 h-5 border-2 border-slate-700 dark:border-slate-200 border-t-transparent rounded-full animate-spin shrink-0" />
              ) : (
                <svg className="w-5 h-5 fill-current group-hover:scale-105 transition-transform shrink-0" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  />
                </svg>
              )}
              <span>{isGitHubLoading ? 'Connecting GitHub Account...' : 'Continue with GitHub'}</span>
            </button>
          </div>

          <div className="text-center text-xs sm:text-sm text-slate-600 dark:text-slate-400 pt-0.5">
            <span>Already have an account?</span>{' '}
            <Link
              to={ROUTES.LOGIN}
              className="text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 font-bold hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: Ultra-Dynamic Animated Showcase Experience                 */}
        {/* ========================================================================= */}
        <div
          className="lg:col-span-6 xl:col-span-7 hidden lg:block"
          onMouseEnter={() => setIsAutoPlay(false)}
          onMouseLeave={() => setIsAutoPlay(true)}
        >
          {/* Main Glassmorphism Showcase Card with Animated Gradient Mesh & Glow */}
          <div className="relative rounded-3xl bg-white/95 dark:bg-dark-900/90 backdrop-blur-xl border border-slate-200/90 dark:border-dark-800 p-5 sm:p-6 shadow-2xl space-y-3.5 overflow-hidden transition-all duration-500 hover:shadow-emerald-500/10">
            
            {/* Dynamic Animated Ambient Glow Spheres */}
            <div className={cn('absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-all duration-1000 animate-pulse-glow', currentSlide.glowColor)} />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-cyan-500/15 dark:bg-cyan-500/15 rounded-full blur-3xl pointer-events-none animate-pulse-glow" style={{ animationDelay: '2s' }} />

            {/* Top Live Ticker Ribbon: Real-Time Community Activity Stream */}
            <div className="relative z-10 flex items-center justify-between gap-2 p-1.5 px-3 rounded-xl bg-slate-100/80 dark:bg-dark-950/80 border border-slate-200/80 dark:border-dark-800 text-xs shadow-inner">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                  10,480+ ACTIVE:
                </span>
                <div className="text-[11px] font-mono text-slate-700 dark:text-slate-300 truncate flex items-center gap-1.5 transition-all duration-300">
                  <span>{currentEvent.icon}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{currentEvent.user}</span>
                  <span className="text-slate-500 dark:text-slate-400">{currentEvent.action}</span>
                </div>
              </div>

              <span className="text-[10px] font-mono text-slate-400 shrink-0 hidden sm:inline-block">
                {currentEvent.time}
              </span>
            </div>

            {/* Top Interactive Carousel Slider Navigation Tabs - Clean Grid, No Arrows */}
            <div className="relative z-10 border-b border-slate-200/70 dark:border-dark-800 pb-2.5">
              <div className="grid grid-cols-4 gap-1.5 w-full">
                {SPOTLIGHT_SLIDES.map((slide, idx) => {
                  const isSelected = activeSlide === idx;
                  return (
                    <button
                      key={slide.id}
                      type="button"
                      onClick={() => setActiveSlide(idx)}
                      className={cn(
                        'relative flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer whitespace-nowrap group',
                        isSelected
                          ? 'bg-white dark:bg-dark-850 text-slate-900 dark:text-white shadow-md border border-slate-200/90 dark:border-dark-700 scale-[1.02]'
                          : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-dark-800/60'
                      )}
                    >
                      <span className={cn('transition-transform duration-300 group-hover:scale-110', isSelected ? 'text-emerald-500' : '')}>
                        {slide.icon}
                      </span>
                      <span className="font-semibold">{slide.tabTitle}</span>

                      {/* Active Slide Timer Progress Bar */}
                      {isSelected && isAutoPlay && (
                        <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full animate-progress-timer" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Slide Header & Info - Beautiful, Crisp & Compact */}
            <div className="relative z-10 space-y-1 min-h-[72px] flex flex-col justify-center transition-all duration-300">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-500" />
                  {currentSlide.badge}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {currentSlide.tag}
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                {currentSlide.headline}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-normal line-clamp-2">
                {currentSlide.description}
              </p>
            </div>

            {/* ================================================================= */}
            {/* DYNAMIC INTERACTIVE SLIDE PANELS (Compact 230px Height)           */}
            {/* ================================================================= */}
            <div className="relative z-10 h-[230px] min-h-[230px] max-h-[230px] overflow-hidden">
              
              {/* =============================================================== */}
              {/* SLIDE 0: Interactive Zero-Lag Multi-Language Cloud IDE Sandbox   */}
              {/* =============================================================== */}
              {activeSlide === 0 && (
                <div className="h-full rounded-2xl bg-slate-950 border border-slate-800/90 p-3.5 shadow-2xl flex flex-col justify-between font-mono text-left relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  
                  {/* Subtle Scanline laser beam when code is executed */}
                  {isSandboxRunning && (
                    <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-scan-line z-30 pointer-events-none opacity-80" />
                  )}

                  {/* Window Bar: macOS style dots + Language Switcher + Run Action */}
                  <div className="flex items-center justify-between border-b border-slate-800/90 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 pr-2 border-r border-slate-800">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                      </div>

                      <div className="flex items-center gap-1">
                        {IDE_LANGUAGES.map((lang, idx) => {
                          const isLangSelected = selectedLangIdx === idx;
                          return (
                            <button
                              key={lang.id}
                              type="button"
                              onClick={() => {
                                setSelectedLangIdx(idx);
                                setSandboxPassed(false);
                              }}
                              className={cn(
                                'px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1',
                                isLangSelected
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs scale-105'
                                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                              )}
                            >
                              <span>{lang.icon}</span>
                              <span className="hidden sm:inline">{lang.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRunCode}
                      disabled={isSandboxRunning}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-80',
                        sandboxPassed
                          ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                          : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20 hover:scale-105'
                      )}
                    >
                      {isSandboxRunning ? (
                        <>
                          <RotateCcw className="w-3 h-3 animate-spin text-white" />
                          <span>Executing...</span>
                        </>
                      ) : sandboxPassed ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span>Passed! ⚡</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-current text-white" />
                          <span>Run Code</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Code Box with Syntax Highlighting & Blinking Cursor */}
                  <div className="text-xs leading-relaxed overflow-hidden py-1 font-mono select-none space-y-0.5 flex-1">
                    {currentLang.tokens.slice(0, 4).map((line, lIdx) => (
                      <div key={lIdx} className="flex items-center gap-3">
                        <span className="text-[10px] text-slate-600 select-none w-3 text-right">{lIdx + 1}</span>
                        <div className="whitespace-pre">
                          {line.map((token, tIdx) => renderSyntaxToken(token, tIdx))}
                          {lIdx === 3 && (
                            <span className="inline-block w-1.5 h-3.5 bg-cyan-400 ml-1 animate-blink align-middle" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Execution Metrics & Output Console Bar */}
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] flex items-center justify-between gap-2 text-slate-300">
                    <div className="flex items-center gap-2 truncate">
                      <span className={cn('w-2 h-2 rounded-full shrink-0', sandboxPassed ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-400')} />
                      <span className={cn('truncate', sandboxPassed ? 'text-emerald-300 font-semibold' : 'text-slate-300')}>
                        {sandboxPassed ? currentLang.output : `Ready: ${currentLang.name} Sandbox Container`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono shrink-0">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400">⚡ {currentLang.execTime}</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-purple-400">💾 {currentLang.memory}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* =============================================================== */}
              {/* SLIDE 1: Dynamic 150 DSA Animated Array & Pattern Visualizer     */}
              {/* =============================================================== */}
              {activeSlide === 1 && (
                <div className="h-full rounded-2xl bg-white/90 dark:bg-dark-850/90 border border-slate-200/80 dark:border-dark-800 p-3.5 shadow-2xl flex flex-col justify-between text-left animate-in fade-in zoom-in-95 duration-200">
                  
                  {/* Top Patterns Switcher Tabs */}
                  <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-dark-750 pb-2">
                    <div className="flex items-center gap-1.5">
                      {['Sliding Window', 'Two Pointers', 'Graph BFS', 'Dynamic Prog'].map((title, idx) => {
                        const isPatternSelected = selectedPatternIdx === idx;
                        return (
                          <button
                            key={title}
                            type="button"
                            onClick={() => {
                              setSelectedPatternIdx(idx);
                              setPatternPassed(false);
                            }}
                            className={cn(
                              'px-2.5 py-0.5 rounded-xl text-xs font-bold transition-all cursor-pointer font-mono truncate',
                              isPatternSelected
                                ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/40 shadow-xs scale-105'
                                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                            )}
                          >
                            {title}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={handleTestPattern}
                      disabled={isSimulatingPattern}
                      className="px-2.5 py-0.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-[11px] font-bold transition-all cursor-pointer shadow-sm active:scale-95 flex items-center gap-1"
                    >
                      <Zap className="w-3 h-3 text-cyan-200 fill-current" />
                      <span>{isSimulatingPattern ? 'Simulating...' : patternPassed ? 'Verified! ✨' : 'Animate Step'}</span>
                    </button>
                  </div>

                  {/* Interactive Visual Animated Array Box */}
                  <div className="p-3 rounded-xl bg-slate-950 text-white border border-slate-800 space-y-2 flex-1 flex flex-col justify-between my-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400 text-[11px]">
                        Visualizing: <strong className="text-cyan-300">Max Subarray (K = 3)</strong>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 text-[10px]">
                          Sum: {currentWindowSum}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30 text-[10px]">
                          O(N)
                        </span>
                      </div>
                    </div>

                    {/* Visual Array Elements with Sliding Window Highlight */}
                    <div className="flex items-center justify-center gap-2 py-1 overflow-x-auto">
                      {sampleArray.map((num, idx) => {
                        const isInWindow = idx >= currentWindowStart && idx < currentWindowStart + windowSize;
                        const isWindowLeft = idx === currentWindowStart;
                        const isWindowRight = idx === currentWindowStart + windowSize - 1;

                        return (
                          <div key={idx} className="flex flex-col items-center gap-0.5">
                            <span className="text-[9px] font-mono text-slate-500">i={idx}</span>
                            <div
                              className={cn(
                                'w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-mono font-extrabold text-sm transition-all duration-300',
                                isInWindow
                                  ? 'bg-gradient-to-tr from-cyan-500 to-emerald-400 text-dark-950 shadow-lg shadow-cyan-500/30 scale-110 border-2 border-white'
                                  : 'bg-slate-900 border border-slate-800 text-slate-400'
                              )}
                            >
                              {num}
                            </div>
                            <span className="text-[9px] font-mono font-bold h-2.5">
                              {isWindowLeft ? 'L 👆' : isWindowRight ? 'R 👆' : ''}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Company Mentions */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] font-mono text-slate-400">
                      <span>Asked at Top Tech:</span>
                      <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                        <span>Google</span> • <span>Meta</span> • <span>Uber</span> • <span>Amazon</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* =============================================================== */}
              {/* SLIDE 2: Interactive 3D Holographic Merch & XP Rewards Vault     */}
              {/* =============================================================== */}
              {activeSlide === 2 && (
                <div className="h-full rounded-2xl bg-white/90 dark:bg-dark-850/90 border border-slate-200/80 dark:border-dark-800 p-3.5 shadow-2xl flex flex-col justify-between text-left animate-in fade-in zoom-in-95 duration-200">
                  
                  {/* Top Stats Banner with 3D Coin & Streak Counter */}
                  <div className="flex items-center justify-between p-2 px-3 rounded-xl bg-slate-950 text-white border border-slate-800 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-dark-950 font-black text-xs flex items-center justify-center animate-coin-3d shadow-md shadow-amber-500/30">
                        🪙
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block font-mono leading-none">REWARDS WALLET</span>
                        <span className="font-extrabold text-amber-400 font-mono text-xs">{xpCoinCount} XP Coins</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-orange-400 font-mono font-bold text-xs bg-orange-500/10 px-2 py-0.5 rounded-lg border border-orange-500/20">
                      <Flame className="w-3 h-3 animate-pulse" />
                      <span>24-Day Streak</span>
                    </div>
                  </div>

                  {/* 4 Swag Cards Grid */}
                  <div className="grid grid-cols-4 gap-2 my-1">
                    {SWAG_ITEMS.map((item, idx) => {
                      const isItemChosen = selectedSwagIdx === idx;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedSwagIdx(idx)}
                          className={cn(
                            'p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 group',
                            isItemChosen
                              ? 'bg-amber-500/15 border-amber-500/50 shadow-md shadow-amber-500/15 scale-105'
                              : 'bg-white/60 dark:bg-dark-900/60 border-slate-200/80 dark:border-dark-800 hover:border-amber-400/40'
                          )}
                        >
                          <span className="text-xl group-hover:scale-125 transition-transform">{item.icon}</span>
                          <span className="text-[11px] font-bold text-slate-900 dark:text-white truncate w-full">{item.title}</span>
                          <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400">{item.coins}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Swag Claim Banner */}
                  <div className="p-2.5 rounded-xl bg-slate-950 text-white border border-slate-800 flex items-center justify-between gap-2">
                    <div className="space-y-0.5 truncate pr-1">
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-amber-400 font-bold">{currentSwag.tag}:</span>
                        <span className="text-white font-semibold truncate">{currentSwag.title}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">{currentSwag.detail}</p>
                    </div>

                    <button
                      type="button"
                      onClick={handleClaimStarterBonus}
                      className={cn(
                        'px-3 py-1.5 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 transition-all cursor-pointer shadow-md shrink-0',
                        hasClaimedPerk
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:scale-105 active:scale-95'
                      )}
                    >
                      {hasClaimedPerk ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-amber-300" />
                          <span>+100 Coins!</span>
                        </>
                      ) : (
                        <>
                          <Gift className="w-3.5 h-3.5 animate-bounce" />
                          <span>Claim +100 XP</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* =============================================================== */}
              {/* SLIDE 3: Interactive Full-Stack & GenAI System Network Mesh     */}
              {/* =============================================================== */}
              {activeSlide === 3 && (
                <div className="h-full rounded-2xl bg-slate-950 text-white border border-slate-800 p-3.5 shadow-2xl flex flex-col justify-between font-mono text-left animate-in fade-in zoom-in-95 duration-200">
                  
                  {/* System Health Top Monitor */}
                  <div className="flex items-center justify-between border-b border-slate-800/90 pb-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="font-bold text-purple-300">Microservices Mesh (Live)</span>
                    </div>

                    <button
                      type="button"
                      onClick={handlePingSystem}
                      disabled={isCheckingSystem}
                      className="px-2.5 py-0.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-75 flex items-center gap-1"
                    >
                      <Activity className="w-3 h-3 text-purple-200" />
                      <span>{isCheckingSystem ? 'Pinging...' : `${pingCount}ms Ping`}</span>
                    </button>
                  </div>

                  {/* 4 Interactive Connected Architecture Nodes */}
                  <div className="grid grid-cols-4 gap-2 text-center text-[11px] relative py-1 my-1">
                    <div className="p-2 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-0.5 hover:border-emerald-400 transition-colors group">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Layers className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-slate-400 block text-[9px]">Frontend</span>
                      <span className="font-bold text-emerald-400 text-[10px]">React 19</span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-900 border border-cyan-500/30 space-y-0.5 hover:border-cyan-400 transition-colors group">
                      <div className="w-6 h-6 rounded-lg bg-cyan-500/10 text-cyan-400 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Server className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-slate-400 block text-[9px]">API Engine</span>
                      <span className="font-bold text-cyan-400 text-[10px]">Node / TS</span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-900 border border-amber-500/30 space-y-0.5 hover:border-amber-400 transition-colors group">
                      <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Database className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-slate-400 block text-[9px]">Database</span>
                      <span className="font-bold text-amber-400 text-[10px]">PostgreSQL</span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-900 border border-purple-500/30 space-y-0.5 hover:border-purple-400 transition-colors group">
                      <div className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-400 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-slate-400 block text-[9px]">AI Agent</span>
                      <span className="font-bold text-purple-400 text-[10px]">Gemini 2.0</span>
                    </div>
                  </div>

                  {/* Architecture Bottom Guarantee */}
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{systemHealthy ? 'All services live • 99.99% uptime' : 'Reconnecting...'}</span>
                    </span>
                    <span className="text-purple-400 font-bold">100% Free</span>
                  </div>
                </div>
              )}
            </div>

            {/* Carousel Pagination Dots & Trust Badges */}
            <div className="relative z-10 flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5">
                {SPOTLIGHT_SLIDES.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveSlide(idx)}
                    className={cn(
                      'h-2 rounded-full transition-all duration-300 cursor-pointer',
                      activeSlide === idx
                        ? 'w-7 bg-emerald-600 dark:bg-emerald-400'
                        : 'w-2 bg-slate-300 dark:bg-dark-700 hover:bg-slate-400'
                    )}
                    title={`Slide ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Bottom Guarantee Trust Badges */}
              <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1 hover:text-emerald-500 transition-colors">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Free Open Access
                </span>
                <span className="flex items-center gap-1 hover:text-cyan-500 transition-colors">
                  <Award className="w-3.5 h-3.5 text-cyan-500" /> ISO Certified
                </span>
                <span className="hidden sm:flex items-center gap-1 text-amber-500 font-bold">
                  <Star className="w-3.5 h-3.5 fill-current" /> 4.9/5 Rating
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
