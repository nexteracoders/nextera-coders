import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { Section } from '../../../components/ui/Section';
import { Button } from '../../../components/ui/Button';
import {
  Play,
  CheckCircle2,
  ArrowRight,
  Trophy,
  ShoppingBag,
  Coins,
  Zap,
} from 'lucide-react';

interface PracticeProblemDemo {
  id: string;
  title: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  difficultyColor: string;
  timeComplexity: string;
  spaceComplexity: string;
  code: string;
  coloredLines: React.ReactNode[];
  tests: { input: string; expected: string; latency: string }[];
}

const DEMO_PROBLEMS: PracticeProblemDemo[] = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    topic: 'Hash Map • Arrays',
    difficulty: 'Easy',
    difficultyColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    code: `function twoSum(nums: number[], target: number): number[] {
  const map = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) return [map.get(complement)!, i];
    map.set(nums[i], i);
  }
  return [];
}`,
    coloredLines: [
      <span key="1"><span className="text-purple-400 font-bold">function</span> <span className="text-sky-300 font-bold">twoSum</span>(<span className="text-slate-200">nums</span>: <span className="text-amber-400">number</span>[], <span className="text-slate-200">target</span>: <span className="text-amber-400">number</span>): <span className="text-amber-400">number</span>[] &#123;</span>,
      <span key="2" className="pl-4 block"><span className="text-purple-400 font-bold">const</span> <span className="text-slate-200">map</span> = <span className="text-purple-400 font-bold">new</span> <span className="text-teal-300">Map</span>&lt;<span className="text-amber-400">number</span>, <span className="text-amber-400">number</span>&gt;();</span>,
      <span key="3" className="pl-4 block"><span className="text-purple-400 font-bold">for</span> (<span className="text-purple-400 font-bold">let</span> <span className="text-slate-200">i</span> = <span className="text-amber-300 font-bold">0</span>; <span className="text-slate-200">i</span> &lt; <span className="text-slate-200">nums</span>.<span className="text-slate-300">length</span>; <span className="text-slate-200">i</span>++) &#123;</span>,
      <span key="4" className="pl-8 block"><span className="text-purple-400 font-bold">const</span> <span className="text-slate-200">comp</span> = <span className="text-slate-200">target</span> - <span className="text-slate-200">nums</span>[<span className="text-slate-200">i</span>];</span>,
      <span key="5" className="pl-8 block"><span className="text-purple-400 font-bold">if</span> (<span className="text-slate-200">map</span>.<span className="text-sky-300 font-bold">has</span>(<span className="text-slate-200">comp</span>)) <span className="text-purple-400 font-bold">return</span> [<span className="text-slate-200">map</span>.<span className="text-sky-300 font-bold">get</span>(<span className="text-slate-200">comp</span>)!, <span className="text-slate-200">i</span>];</span>,
      <span key="6" className="pl-8 block"><span className="text-slate-200">map</span>.<span className="text-sky-300 font-bold">set</span>(<span className="text-slate-200">nums</span>[<span className="text-slate-200">i</span>], <span className="text-slate-200">i</span>);</span>,
      <span key="7" className="pl-4 block">&#125;</span>,
      <span key="8" className="pl-4 block"><span className="text-purple-400 font-bold">return</span> [];</span>,
      <span key="9" className="block">&#125;</span>,
    ],
    tests: [
      { input: 'nums=[2,7,11,15], target=9', expected: '[0, 1]', latency: '12ms' },
      { input: 'nums=[3,2,4], target=6', expected: '[1, 2]', latency: '8ms' },
      { input: 'nums=[3,3], target=6', expected: '[0, 1]', latency: '6ms' },
    ],
  },
  {
    id: 'valid-palindrome',
    title: 'Valid Palindrome',
    topic: 'Two Pointers • Strings',
    difficulty: 'Easy',
    difficultyColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    code: `function isPalindrome(s: string): boolean {
  const clean = s.toLowerCase().replace(/[^a-z0-9]/g, '');
  let left = 0, right = clean.length - 1;
  while (left < right) {
    if (clean[left] !== clean[right]) return false;
    left++; right--;
  }
  return true;
}`,
    coloredLines: [
      <span key="1"><span className="text-purple-400 font-bold">function</span> <span className="text-sky-300 font-bold">isPalindrome</span>(<span className="text-slate-200">s</span>: <span className="text-amber-400">string</span>): <span className="text-amber-400">boolean</span> &#123;</span>,
      <span key="2" className="pl-4 block"><span className="text-purple-400 font-bold">const</span> <span className="text-slate-200">clean</span> = <span className="text-slate-200">s</span>.<span className="text-sky-300 font-bold">toLowerCase</span>().<span className="text-sky-300 font-bold">replace</span>(<span className="text-emerald-400">/[^a-z0-9]/g</span>, <span className="text-emerald-400">''</span>);</span>,
      <span key="3" className="pl-4 block"><span className="text-purple-400 font-bold">let</span> <span className="text-slate-200">left</span> = <span className="text-amber-300 font-bold">0</span>, <span className="text-slate-200">right</span> = <span className="text-slate-200">clean</span>.<span className="text-slate-300">length</span> - <span className="text-amber-300 font-bold">1</span>;</span>,
      <span key="4" className="pl-4 block"><span className="text-purple-400 font-bold">while</span> (<span className="text-slate-200">left</span> &lt; <span className="text-slate-200">right</span>) &#123;</span>,
      <span key="5" className="pl-8 block"><span className="text-purple-400 font-bold">if</span> (<span className="text-slate-200">clean</span>[<span className="text-slate-200">left</span>] !== <span className="text-slate-200">clean</span>[<span className="text-slate-200">right</span>]) <span className="text-purple-400 font-bold">return</span> <span className="text-rose-400 font-bold">false</span>;</span>,
      <span key="6" className="pl-8 block"><span className="text-slate-200">left</span>++; <span className="text-slate-200">right</span>--;</span>,
      <span key="7" className="pl-4 block">&#125;</span>,
      <span key="8" className="pl-4 block"><span className="text-purple-400 font-bold">return</span> <span className="text-emerald-400 font-bold">true</span>;</span>,
      <span key="9" className="block">&#125;</span>,
    ],
    tests: [
      { input: 's="A man, a plan, a canal: Panama"', expected: 'true', latency: '14ms' },
      { input: 's="race a car"', expected: 'false', latency: '9ms' },
      { input: 's=" "', expected: 'true', latency: '4ms' },
    ],
  },
  {
    id: 'max-subarray',
    title: 'Maximum Subarray (Kadane)',
    topic: 'Dynamic Programming',
    difficulty: 'Medium',
    difficultyColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    code: `function maxSubArray(nums: number[]): number {
  let maxCurrent = nums[0], maxGlobal = nums[0];
  for (let i = 1; i < nums.length; i++) {
    maxCurrent = Math.max(nums[i], maxCurrent + nums[i]);
    maxGlobal = Math.max(maxGlobal, maxCurrent);
  }
  return maxGlobal;
}`,
    coloredLines: [
      <span key="1"><span className="text-purple-400 font-bold">function</span> <span className="text-sky-300 font-bold">maxSubArray</span>(<span className="text-slate-200">nums</span>: <span className="text-amber-400">number</span>[]): <span className="text-amber-400">number</span> &#123;</span>,
      <span key="2" className="pl-4 block"><span className="text-purple-400 font-bold">let</span> <span className="text-slate-200">cur</span> = <span className="text-slate-200">nums</span>[<span className="text-amber-300 font-bold">0</span>], <span className="text-slate-200">maxSum</span> = <span className="text-slate-200">nums</span>[<span className="text-amber-300 font-bold">0</span>];</span>,
      <span key="3" className="pl-4 block"><span className="text-purple-400 font-bold">for</span> (<span className="text-purple-400 font-bold">let</span> <span className="text-slate-200">i</span> = <span className="text-amber-300 font-bold">1</span>; <span className="text-slate-200">i</span> &lt; <span className="text-slate-200">nums</span>.<span className="text-slate-300">length</span>; <span className="text-slate-200">i</span>++) &#123;</span>,
      <span key="4" className="pl-8 block"><span className="text-slate-200">cur</span> = <span className="text-teal-300 font-bold">Math</span>.<span className="text-sky-300 font-bold">max</span>(<span className="text-slate-200">nums</span>[<span className="text-slate-200">i</span>], <span className="text-slate-200">cur</span> + <span className="text-slate-200">nums</span>[<span className="text-slate-200">i</span>]);</span>,
      <span key="5" className="pl-8 block"><span className="text-slate-200">maxSum</span> = <span className="text-teal-300 font-bold">Math</span>.<span className="text-sky-300 font-bold">max</span>(<span className="text-slate-200">maxSum</span>, <span className="text-slate-200">cur</span>);</span>,
      <span key="6" className="pl-4 block">&#125;</span>,
      <span key="7" className="pl-4 block"><span className="text-purple-400 font-bold">return</span> <span className="text-slate-200">maxSum</span>;</span>,
      <span key="8" className="pl-4 block">&#125;</span>,
      <span key="9" className="block text-slate-500 font-mono italic">// Kadane algorithm optimal O(N)</span>,
    ],
    tests: [
      { input: 'nums=[-2,1,-3,4,-1,2,1,-5,4]', expected: '6', latency: '16ms' },
      { input: 'nums=[1]', expected: '1', latency: '5ms' },
      { input: 'nums=[5,4,-1,7,8]', expected: '23', latency: '11ms' },
    ],
  },
];

export const PracticeSection: React.FC = () => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showRewardToast, setShowRewardToast] = useState(false);

  const problem = DEMO_PROBLEMS[selectedIdx];

  const handleTestExecution = () => {
    setIsExecuting(true);
    setShowRewardToast(false);

    setTimeout(() => {
      setIsExecuting(false);
      setShowRewardToast(true);
    }, 600);
  };

  return (
    <Section variant="default" className="pt-6 sm:pt-8 pb-8 sm:pb-12 overflow-hidden relative">
      {/* Ambient background blob */}
      <div className="absolute top-1/3 -left-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center max-w-7xl mx-auto">
        {/* Left Column: Interactive Live Code Execution Sandbox */}
        <div className="lg:col-span-6 order-2 lg:order-1">
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-white p-5 font-mono text-xs shadow-2xl space-y-4 ring-1 ring-white/10 relative overflow-hidden">
            
            {/* Header Tabs: Select Problem */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl">
                {DEMO_PROBLEMS.map((p, idx) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedIdx(idx);
                      setShowRewardToast(false);
                    }}
                    className={`px-3 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                      selectedIdx === idx
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {p.title.split(' ')[0]}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${problem.difficultyColor}`}>
                  {problem.difficulty}
                </span>
                <span className="text-[10px] text-slate-400 hidden sm:inline font-mono">
                  {problem.timeComplexity}
                </span>
              </div>
            </div>

            {/* Code Display with Syntax Colors, Line Numbers & Fixed Height Container */}
            <div className="h-[200px] flex text-[11px] leading-relaxed bg-black/60 rounded-2xl border border-slate-800/80 p-3.5 overflow-x-auto select-text font-mono">
              {/* Line numbers gutter */}
              <div className="select-none pr-3.5 text-right text-slate-600 font-mono text-[11px] space-y-0.5 border-r border-slate-800/80">
                {problem.coloredLines.map((_, i) => (
                  <div key={i} className="h-5 leading-5">{i + 1}</div>
                ))}
              </div>

              {/* Code lines */}
              <div className="pl-3.5 space-y-0.5 whitespace-pre flex-1 font-mono text-[11px]">
                {problem.coloredLines.map((line, i) => (
                  <div key={i} className="h-5 leading-5">{line}</div>
                ))}
              </div>
            </div>

            {/* Simulated Test Runner Tray */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-bold flex items-center gap-1.5">
                  <Play className="w-3 h-3 text-emerald-400" /> Automated Test Suite:
                </span>

                <button
                  onClick={handleTestExecution}
                  disabled={isExecuting}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[11px] font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <Zap className={`w-3 h-3 ${isExecuting ? 'animate-spin' : ''}`} />
                  <span>{isExecuting ? 'Running Test Suite...' : 'Run Test Cases'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {problem.tests.map((test, tIdx) => (
                  <div
                    key={tIdx}
                    className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[10px] space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-bold">Case {tIdx + 1}</span>
                      <span className="text-emerald-400 font-bold">{test.latency}</span>
                    </div>
                    <p className="text-slate-300 truncate">{test.input}</p>
                    <div className="flex items-center gap-1 text-emerald-400 font-bold pt-0.5">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{test.expected} (Pass)</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Instant Coin Earn Reward Notification */}
              {showRewardToast && (
                <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-between animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-2 text-xs font-bold font-mono">
                    <Coins className="w-4 h-4 text-amber-400 animate-bounce" />
                    <span>+20 NextEra Coins earned for 100% test pass!</span>
                  </div>
                  <Link
                    to={ROUTES.REWARDS}
                    className="text-[10px] underline font-mono text-amber-400 hover:text-amber-300"
                  >
                    View Store
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Problem Ladder Value Proposition */}
        <div className="lg:col-span-6 space-y-5 order-1 lg:order-2 text-center lg:text-left">
          <div className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
            <span>Interactive Algorithmic Practice</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Solve, Benchmark & <br />
            <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-amber-500 bg-clip-text text-transparent">
              Earn Real Rewards.
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            Sharpen your intuition with over 250+ curated DSA challenges. Execute unit tests in the cloud, benchmark time and space complexity, and build verified coding streaks.
          </p>

          {/* Languages supported */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-1">
            {['TypeScript', 'JavaScript', 'Python 3', 'Java 21', 'C++ 20'].map((lang) => (
              <span
                key={lang}
                className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-900 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
              >
                {lang}
              </span>
            ))}
          </div>

          {/* CTAs */}
          <div className="pt-3 flex flex-wrap items-center justify-center lg:justify-start gap-2.5 sm:gap-3.5">
            <Link to={ROUTES.PRACTICE}>
              <Button
                variant="primary"
                size="sm"
                className="sm:text-sm text-xs px-3.5 sm:px-5 py-2 sm:py-2.5 font-bold"
                rightIcon={<ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              >
                Start Practicing Free
              </Button>
            </Link>

            <Link to={ROUTES.CONTEST}>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />}
                className="border-amber-500/40 text-amber-600 dark:text-amber-300 hover:bg-amber-500/10 font-bold sm:text-sm text-xs px-3.5 sm:px-5 py-2 sm:py-2.5"
              >
                Sunday Contest (100🪙)
              </Button>
            </Link>

            <Link to={ROUTES.REWARDS}>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />}
                className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 font-semibold font-mono text-xs px-3 sm:px-4 py-2"
              >
                Rewards Store
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Section>
  );
};

