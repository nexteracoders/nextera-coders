import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { ROUTES } from '../../../constants/routes';
import { Section } from '../../../components/ui/Section';
import {
  Sparkles,
  ArrowRight,
  Play,
  Terminal,
  Copy,
  Check,
  Zap,
  MessageSquare,
  Monitor,
  Bot,
  Code2,
  GraduationCap,
  Trophy,
  Flame,
  BookOpen,
  Layers,
  Star,
} from 'lucide-react';
import { cn } from '../../../utils/cn';

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

const HERO_ORBIT_LAYERS: OrbitLayer[] = [
  {
    layer: 1,
    size: 640,
    duration: 38,
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
    size: 980,
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
    size: 1340,
    duration: 70,
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

interface HeroSnippet {
  title: string;
  lang: string;
  badge: string;
  rawCode: string;
  coloredLines: React.ReactNode[];
  output: string;
  latency: string;
}

const HERO_SNIPPETS: HeroSnippet[] = [
  {
    title: 'welcome.py',
    lang: 'Python',
    badge: 'Python 3.12',
    rawCode: `# 1. Welcome to NextEra Coders
student = "Future Software Engineer"
coins = 100

def greet(user):
    return f"👋 Welcome {user}! +{coins}🪙 credited."

print(greet(student))`,
    coloredLines: [
      <span key="1" className="text-slate-500 italic"># 1. Welcome to NextEra Coders</span>,
      <span key="2"><span className="text-sky-400">student</span> <span className="text-slate-400">=</span> <span className="text-emerald-300">"Future Software Engineer"</span></span>,
      <span key="3"><span className="text-sky-400">coins</span> <span className="text-slate-400">=</span> <span className="text-amber-300">100</span></span>,
      <span key="4"><span className="text-purple-400 font-semibold">def</span> <span className="text-blue-400">greet</span>(<span className="text-orange-300">user</span>): <span className="text-purple-400 font-semibold">return</span> <span className="text-emerald-300">f"👋 Welcome &#123;user&#125;! +&#123;coins&#125;🪙 credited."</span></span>,
      <span key="5"><span className="text-yellow-400">print</span>(<span className="text-blue-400">greet</span>(<span className="text-sky-400">student</span>))</span>,
    ],
    output: `👋 Welcome Future Software Engineer! +100🪙 credited.
✓ Execution Complete • Target: Dream Tech Career`,
    latency: '14ms',
  },
  {
    title: 'streak.js',
    lang: 'JavaScript',
    badge: 'Node.js 22',
    rawCode: `// 1. NextEra Coders Student Growth
const learner = { name: "Developer", streak: 14 };

function getStatus(user) {
  return \`🔥 \${user.name} is on a \${user.streak}-day streak!\`;
}
console.log(getStatus(learner));`,
    coloredLines: [
      <span key="1" className="text-slate-500 italic">// 1. NextEra Coders Student Growth</span>,
      <span key="2"><span className="text-purple-400 font-semibold">const</span> <span className="text-sky-400">learner</span> <span className="text-slate-400">=</span> &#123; <span className="text-orange-300">name</span>: <span className="text-emerald-300">"Developer"</span>, <span className="text-orange-300">streak</span>: <span className="text-amber-300">14</span> &#125;;</span>,
      <span key="3"><span className="text-purple-400 font-semibold">function</span> <span className="text-blue-400">getStatus</span>(<span className="text-orange-300">user</span>) &#123;</span>,
      <span key="4">&nbsp;&nbsp;<span className="text-purple-400 font-semibold">return</span> <span className="text-emerald-300">{`\`🔥 \${user.name} is on a \${user.streak}-day streak!\``}</span>;</span>,
      <span key="5">&#125; <span className="text-yellow-400">console</span>.<span className="text-blue-400">log</span>(<span className="text-blue-400">getStatus</span>(<span className="text-sky-400">learner</span>));</span>,
    ],
    output: `🔥 Developer is on a 14-day streak!
✓ Status: Placement Ready • 0 Runtime Errors`,
    latency: '12ms',
  },
  {
    title: 'Main.java',
    lang: 'Java',
    badge: 'Java 21 (OpenJDK)',
    rawCode: `// 1. NextEra Coders Java Arena
public class NextEraCoder {
  public static void main(String[] args) {
    String coder = "Student";
    System.out.println("👋 Hello " + coder + "! Master DSA & Crack Jobs 🚀");
  }
}`,
    coloredLines: [
      <span key="1" className="text-slate-500 italic">// 1. NextEra Coders Java Arena</span>,
      <span key="2"><span className="text-purple-400 font-semibold">public class</span> <span className="text-yellow-300">NextEraCoder</span> &#123;</span>,
      <span key="3">&nbsp;&nbsp;<span className="text-purple-400 font-semibold">public static void</span> <span className="text-blue-400">main</span>(<span className="text-cyan-300">String</span>[] <span className="text-orange-300">args</span>) &#123;</span>,
      <span key="4">&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-cyan-300">String</span> <span className="text-sky-400">coder</span> <span className="text-slate-400">=</span> <span className="text-emerald-300">"Student"</span>;</span>,
      <span key="5">&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-yellow-400">System</span>.<span className="text-sky-300">out</span>.<span className="text-blue-400">println</span>(<span className="text-emerald-300">"👋 Hello "</span> + <span className="text-sky-400">coder</span> + <span className="text-emerald-300">"! Master DSA & Crack Jobs 🚀"</span>); &#125;&#125;</span>,
    ],
    output: `👋 Hello Student! Master DSA & Crack Jobs 🚀
[✓] JDK 21 Build Succeeded (0 Errors)`,
    latency: '18ms',
  },
];

export const HeroSection: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showOutput, setShowOutput] = useState(true);
  const [copied, setCopied] = useState(false);

  const snippet = HERO_SNIPPETS[activeTab];

  const handleRunDemo = () => {
    setIsRunning(true);
    setShowOutput(false);
    setTimeout(() => {
      setIsRunning(false);
      setShowOutput(true);
    }, 400);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(snippet.rawCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Section variant="default" className="pt-5 sm:pt-7 pb-12 sm:pb-16 overflow-hidden relative">
      {/* Ambient Background Lighting */}
      <div className="absolute -top-24 left-1/3 w-[520px] h-[520px] bg-gradient-to-tr from-amber-500/10 via-indigo-500/10 to-orange-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* ========================================================================= */}
      {/* HALF-MOON COSMIC ORBITAL DOME (Spanning Left, Top & Right, Arching Down)  */}
      {/* ========================================================================= */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 pointer-events-none z-0 select-none opacity-40 dark:opacity-35">
        {/* Central Core Ambient Glow */}
        <div className="absolute -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gradient-to-tr from-amber-500/10 via-emerald-500/5 to-cyan-500/10 blur-3xl opacity-50" />

        {/* 3 Concentric Orbital Rings */}
        {HERO_ORBIT_LAYERS.map((orbit) => (
          <div
            key={orbit.layer}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
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
                      {/* Counter-angle cancels position angle -> Icons stay 100% perfectly upright */}
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

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
        {/* Left Column: Relatable & Inspiring Value Proposition */}
        <div className="lg:col-span-6 space-y-7 sm:space-y-8 text-center lg:text-left">
          
          {/* Badge: Master Full-Stack Engineering & DSA */}
          <div className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-indigo-50/90 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs font-mono font-bold text-indigo-700 dark:text-indigo-300 shadow-xs">
            <span>Master Full-Stack Engineering & DSA</span>
          </div>

          {/* Bold Display Sans + Elegant Editorial Serif Headline (Matches Reference) */}
          <h1 className="tracking-tight leading-[1.12]">
            <span className="font-brand-sans font-extrabold block text-3xl sm:text-4.5xl lg:text-5.5xl xl:text-6xl text-slate-950 dark:text-white tracking-tight">
              Crack Top Tech Roles
            </span>
            <span className="font-brand-serif font-normal block text-3.5xl sm:text-5xl lg:text-6xl xl:text-6.5xl tracking-normal bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 bg-clip-text text-transparent mt-1 sm:mt-1.5">
              with NEC Pro One
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
            A hands-on learning platform for engineers. Master pattern-based DSA, architect full-stack projects, and practice in live sandboxes built for real results.
          </p>

          {/* Action CTAs: Free Access + NEC Pro One */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2 sm:pt-2.5">
            <Link to={isAuthenticated ? ROUTES.DASHBOARD : ROUTES.LOGIN}>
              <button className="group relative overflow-hidden px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:via-indigo-500 hover:to-purple-500 shadow-md shadow-brand-500/30 hover:shadow-lg hover:shadow-brand-500/45 active:scale-95 transition-all duration-300 cursor-pointer">
                <span className="relative z-10 flex items-center gap-1.5">
                  {isAuthenticated ? (
                    'Go to Dashboard'
                  ) : (
                    <span>Free Access</span>
                  )}
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover-arrow-nudge transition-transform duration-200" />
                </span>
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/35 to-transparent ease-in-out pointer-events-none" />
              </button>
            </Link>

            <Link to={ROUTES.PRO_ONE}>
              <button className="group relative overflow-hidden inline-flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-extrabold text-xs sm:text-sm text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-500 hover:via-amber-400 hover:to-yellow-500 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/45 active:scale-95 transition-all duration-300 cursor-pointer">
                <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                  <span>NEC Pro One</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] sm:text-[10px] font-mono font-extrabold bg-slate-950 text-amber-300 uppercase tracking-wider">
                    PRO
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-950 group-hover-arrow-nudge transition-transform duration-200" />
                </span>
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent ease-in-out pointer-events-none" />
              </button>
            </Link>
          </div>

          {/* Key Value Propositions & Metrics (Matches Reference Design) */}
          <div className="pt-2.5 sm:pt-3 space-y-3">
            {/* Row 1: 4 Feature Highlights with Sky Blue Icons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2.5 text-xs sm:text-[13px] font-semibold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-sky-500 shrink-0" />
                <span>Free Core Courses</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-sky-500 shrink-0" />
                <span>250+ Pattern DSA</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Monitor className="w-4 h-4 text-sky-500 shrink-0" />
                <span>Live In-Browser IDE</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-sky-500 shrink-0" />
                <span>Real Projects</span>
              </span>
            </div>

            {/* Row 2: 4 Stats with Vertical Sky-Blue Marker Lines */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5 pt-1">
              {/* Stat 1: 250+ Courses & Tutorials */}
              <div className="flex items-start gap-2 text-left">
                <div className="w-[2.5px] h-8 bg-sky-500 rounded-full shrink-0 mt-0.5" />
                <div>
                  <div className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white leading-none tracking-tight font-sans">
                    250+
                  </div>
                  <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 leading-tight">
                    Courses & Tutorials
                  </div>
                </div>
              </div>

              {/* Stat 2: 100+ Projects & Tasks */}
              <div className="flex items-start gap-2 text-left">
                <div className="w-[2.5px] h-8 bg-sky-500 rounded-full shrink-0 mt-0.5" />
                <div>
                  <div className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white leading-none tracking-tight font-sans">
                    100+
                  </div>
                  <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 leading-tight">
                    Projects & Tasks
                  </div>
                </div>
              </div>

              {/* Stat 3: 50K+ Active Learners */}
              <div className="flex items-start gap-2 text-left">
                <div className="w-[2.5px] h-8 bg-sky-500 rounded-full shrink-0 mt-0.5" />
                <div>
                  <div className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white leading-none tracking-tight font-sans">
                    50K+
                  </div>
                  <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 leading-tight">
                    Active Learners
                  </div>
                </div>
              </div>

              {/* Stat 4: 4.9 ★ Learner Rating */}
              <div className="flex items-start gap-2 text-left">
                <div className="w-[2.5px] h-8 bg-sky-500 rounded-full shrink-0 mt-0.5" />
                <div>
                  <div className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white leading-none tracking-tight font-sans flex items-center gap-1">
                    <span>4.9</span>
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                  </div>
                  <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 leading-tight">
                    Learner Rating
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Runnable Code Sandbox (Fixed Dimensions, Color Syntax) */}
        <div className="lg:col-span-6 w-full">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-[#0d1117] text-slate-100 shadow-2xl overflow-hidden font-mono text-xs ring-1 ring-white/5 transition-all duration-300 hover:shadow-[12px_-12px_35px_rgba(99,102,241,0.32),22px_-22px_60px_rgba(147,51,234,0.18)] hover:border-indigo-500/40">
            
            {/* Top Bar with Window Controls & 3 Clean Tabs */}
            <div className="px-4 py-2.5 bg-[#161b22] border-b border-slate-800 flex items-center justify-between gap-2 h-11">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500/90 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/90 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/90 inline-block"></span>
                <span className="ml-2 text-[10px] text-slate-400 font-mono hidden sm:inline">
                  {snippet.title}
                </span>
              </div>

              {/* 3 Clean Language Tabs: Python, JavaScript, Java */}
              <div className="flex items-center gap-1 bg-slate-900/90 p-0.5 rounded-lg border border-slate-800">
                {HERO_SNIPPETS.map((item, idx) => (
                  <button
                    key={item.lang}
                    onClick={() => {
                      setActiveTab(idx);
                      setShowOutput(true);
                    }}
                    className={cn(
                      'px-3 py-1 rounded-md text-[11px] font-mono font-medium transition-all cursor-pointer',
                      activeTab === idx
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    )}
                  >
                    {item.lang}
                  </button>
                ))}
              </div>

              {/* Actions: Copy & Run */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopyCode}
                  className="p-1 rounded text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  title="Copy code"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={handleRunDemo}
                  disabled={isRunning}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[11px] font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Play className={`w-3 h-3 fill-current ${isRunning ? 'animate-spin' : ''}`} />
                  <span>{isRunning ? 'Running...' : 'Run'}</span>
                </button>
              </div>
            </div>

            {/* Code Editor Body - Fixed Height to prevent size shifting */}
            <div className="p-4 bg-[#0d1117] h-[135px] overflow-hidden">
              <div className="flex gap-3 text-[11.5px] font-mono leading-relaxed h-full">
                <div className="text-slate-600 select-none text-right pr-2 border-r border-slate-800 space-y-0.5">
                  {snippet.coloredLines.map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>
                <div className="flex-1 overflow-x-auto space-y-0.5 font-mono">
                  {snippet.coloredLines.map((line, i) => (
                    <div key={i} className="truncate">
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Terminal Live Output Tray - Fixed Height */}
            <div className="px-4 py-3 bg-[#161b22] border-t border-slate-800 font-mono text-[11px]">
              <div className="flex items-center justify-between text-slate-400 mb-1 text-[10px]">
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <Terminal className="w-3.5 h-3.5" /> Interactive Output:
                </span>
                <span className="text-amber-400 font-bold">{snippet.badge}</span>
              </div>

              <div className="text-emerald-400 bg-black/50 p-2.5 rounded-lg border border-slate-800 whitespace-pre-wrap h-[58px] flex items-center">
                {isRunning ? (
                  <span className="text-amber-400 animate-pulse flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    Executing {snippet.lang} runtime in sandbox...
                  </span>
                ) : showOutput ? (
                  <span className="leading-relaxed">{snippet.output}</span>
                ) : (
                  <span className="text-slate-500">Press "Run" to test execution.</span>
                )}
              </div>
            </div>

            {/* Bottom Status Bar */}
            <div className="px-4 py-2 bg-[#0d1117] border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono h-9">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Runtime: V8/JVM Sandbox ({snippet.latency})</span>
              </span>

              <Link
                to={ROUTES.COMPILER}
                className="text-amber-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Full In-Browser IDE</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};




