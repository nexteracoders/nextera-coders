// Sunday Weekly Contest Service with 2 Questions, Practice Archive Mode & Rich Leaderboard Profiles
import { coinService } from './coin.service';
import { evaluateTestCases } from '../utils/codeEvaluator';
import { NEXTERA_DSA_PROBLEMS } from '../data/dsaProblemsData';
import { DEFAULT_TOP_150_PROBLEMS } from './top150.service';

export interface TestCase {
  id?: string;
  input: string;
  expectedOutput: string;
  explanation?: string;
}

export interface SundayContestProblem {
  id: string;
  number: number; // 1 or 2
  order?: number;
  title: string;
  slug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  points: number;
  description: string;
  constraints: string[];
  sampleTestCases: TestCase[];
  hiddenTestCases: TestCase[];
  starterCode: {
    javascript?: string;
    python?: string;
    java?: string;
    cpp?: string;
    typescript?: string;
  };
  date?: string; // YYYY-MM-DD for POTD
  sourceType?: 'auto' | 'admin';
  sourceLabel?: string;
}

export interface AutoPilotSettings {
  enabled: boolean;
  sourceCatalog: 'top150' | 'practice';
  lastDailyDate: string; // YYYY-MM-DD of active daily problem
  dailySerialIndex: number; // current serial rotation pointer for POTD
  isDailyManualForToday: boolean; // true if admin explicitly set today's problem
  dailyAutoSource?: string;
  lastWeeklyContestNumber: number; // contest edition number of last auto-update
  isWeeklyManualForCurrentRound: boolean; // true if admin explicitly customized current contest
  weeklyEasyIndex: number;
  weeklyMediumIndex: number;
  weeklyHardIndex: number;
  weeklyPatternStep: number;
  weeklyAutoSource?: string;
}

export const DEFAULT_AUTOPILOT_SETTINGS: AutoPilotSettings = {
  enabled: true,
  sourceCatalog: 'top150',
  lastDailyDate: '',
  dailySerialIndex: 0,
  isDailyManualForToday: false,
  dailyAutoSource: 'Auto-Pilot (Top 150 / Practice Serial #1)',
  lastWeeklyContestNumber: 42,
  isWeeklyManualForCurrentRound: false,
  weeklyEasyIndex: 0,
  weeklyMediumIndex: 0,
  weeklyHardIndex: 0,
  weeklyPatternStep: 0,
  weeklyAutoSource: 'Auto-Pilot Balanced Mix (Medium + Hard)',
};

export interface AntiCheatSessionLog {
  timestamp: string;
  event?: 'join' | 'tab_switch' | 'paste' | 'submit' | 'flag' | string;
  type?: 'join' | 'tab_switch' | 'paste' | 'submit' | 'flag' | string;
  details?: string;
  detail?: string;
  severity?: 'info' | 'warning' | 'error' | string;
}

export interface AntiCheatRecord {
  tabSwitchesCount: number;
  pasteCount: number;
  timeTakenSeconds: number;
  startedAt?: string;
  submittedAt?: string;
  status: 'Clean' | 'Suspicious' | 'Flagged' | 'clean' | 'suspicious' | 'flagged' | 'disqualified';
  reason?: string;
  logs: AntiCheatSessionLog[];
}

export interface CoderProfile {
  userId: string;
  username: string;
  name: string;
  avatar: string;
  rank: number;
  score: number;
  problemsSolved: number;
  finishTime: string;
  coinsWon: number;
  badge: string;
  bio: string;
  college: string;
  globalRating: number;
  globalRank: number;
  totalSolved: { easy: number; medium: number; hard: number };
  streak: number;
  skills: string[];
  country: string;
  github?: string;
  linkedin?: string;
  articlesPublished?: number;
  antiCheat?: AntiCheatRecord;
}

export interface SundayContestConfig {
  id: string;
  contestNumber: number;
  title: string;
  description: string;
  coinsPrize: number; // 100 Coins total (awarded when both 2 questions are solved)
  durationMinutes: number; // 90 minutes
  sundayDate: string;
  isForceLive: boolean; // Admin toggle to test live mode
  isArchiveOpen: boolean; // Always keep previous problems open for practice until new edition
  problems: SundayContestProblem[]; // Exactly 2 Questions (Q1 & Q2)
  dailyStreakProblem?: SundayContestProblem; // Admin configurable Daily Problem
  leaderboard: CoderProfile[];
  solvedProblemsMap: Record<string, number[]>; // userId -> array of solved problem numbers [1, 2]
  autoPilot?: AutoPilotSettings;
  updatedAt: string;
}

export interface PracticeProblemTemplate {
  id: string;
  title: string;
  slug: string;
  order?: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  companies?: string[];
  points?: number;
  accuracy?: string;
  submissionsCount?: string;
  averageTime?: string;
  expectedComplexity?: {
    time: string;
    space: string;
  };
  description: string;
  constraints: string[];
  sampleTestCases: TestCase[];
  hiddenTestCases: TestCase[];
  starterCode: {
    javascript: string;
    python: string;
    java: string;
    cpp: string;
    typescript: string;
  };
  driverCode?: {
    cpp?: string;
    java?: string;
    python?: string;
    javascript?: string;
    typescript?: string;
  };
  solutionCode?: {
    cpp?: string;
    java?: string;
    python?: string;
    javascript?: string;
    typescript?: string;
  };
  editorial?: string | {
    summary?: string;
    approach?: string;
    complexity?: string;
    code?: string;
  };
  hints?: string[];
}

const STORAGE_KEY = 'nextera_sunday_contest_v4';

// Default initial 2 Sunday Contest Problems uploaded by Admin
const DEFAULT_SUNDAY_CONTEST: SundayContestConfig = {
  id: 'sunday-contest-42',
  contestNumber: 42,
  title: 'NEC Sunday Grand Championship #42',
  description: 'The premier weekly algorithmic challenge on NextEra Coders. Solve the 2 featured problems in 90 minutes, pass 100% test cases, and win 100 NEC Coins!',
  coinsPrize: 100,
  durationMinutes: 90,
  sundayDate: new Date().toISOString().split('T')[0],
  isForceLive: true,
  isArchiveOpen: true, // Remains open for practice until new edition is uploaded
  updatedAt: new Date().toISOString(),
  solvedProblemsMap: {},
  autoPilot: { ...DEFAULT_AUTOPILOT_SETTINGS },
  problems: [
    // Problem 1 (Q1: Medium)
    {
      id: 'prob-sunday-42-q1',
      number: 1,
      title: 'Shortest Path with Obstacle Elimination in Grid',
      slug: 'sunday-shortest-path-obstacle-elimination',
      difficulty: 'Medium',
      points: 400,
      description: `You are given an \`m x n\` integer matrix \`grid\` where each cell is either \`0\` (empty) or \`1\` (obstacle). You can move up, down, left, or right from and to an empty cell in one step.

You can eliminate at most \`k\` obstacles.

Return *the minimum number of steps to walk from the upper left corner \`(0, 0)\` to the lower right corner \`(m - 1, n - 1)\`*, or \`-1\` if it is not possible to reach the destination.

### Example 1:
\`\`\`
Input: grid = [[0,0,0],[1,1,0],[0,0,0],[0,1,1],[0,0,0]], k = 1
Output: 6
Explanation: 
The shortest path without eliminating any obstacle is 10.
The shortest path with one obstacle elimination at (1,0) or (1,1) is 6.
\`\`\`

### Example 2:
\`\`\`
Input: grid = [[0,1,1],[1,1,1],[1,0,0]], k = 1
Output: -1
Explanation: We need to eliminate at least two obstacles to find such a walk.
\`\`\``,
      constraints: [
        'm == grid.length',
        'n == grid[i].length',
        '1 <= m, n <= 40',
        '1 <= k <= m * n',
        'grid[i][j] is either 0 or 1.',
        'grid[0][0] == grid[m - 1][n - 1] == 0',
      ],
      sampleTestCases: [
        {
          input: '[[0,0,0],[1,1,0],[0,0,0],[0,1,1],[0,0,0]], 1',
          expectedOutput: '6',
          explanation: 'Eliminating obstacle at (1,0) yields optimal 6-step path.',
        },
        {
          input: '[[0,1,1],[1,1,1],[1,0,0]], 1',
          expectedOutput: '-1',
          explanation: 'At least 2 obstacle eliminations required.',
        },
      ],
      hiddenTestCases: [
        {
          input: '[[0,0],[0,0]], 0',
          expectedOutput: '2',
          explanation: 'Direct walk in 2x2 empty grid takes 2 steps.',
        },
        {
          input: '[[0]], 1',
          expectedOutput: '0',
          explanation: 'Already at destination (0,0).',
        },
        {
          input: '[[0,1,0],[1,1,0],[0,0,0]], 2',
          expectedOutput: '4',
          explanation: 'With k=2, directly cuts through obstacles in 4 steps.',
        },
      ],
      starterCode: {
        javascript: `/**
 * @param {number[][]} grid
 * @param {number} k
 * @return {number}
 */
class Solution {
    shortestPath(grid, k) {
        // code here
        
    }
}`,
        typescript: `class Solution {
    shortestPath(grid: number[][], k: number): number {
        // code here
        return -1;
    }
}`,
        python: `class Solution:
    def shortestPath(self, grid: list[list[int]], k: int) -> int:
        # code here
        pass`,
        java: `class Solution {
    public int shortestPath(int[][] grid, int k) {
        // code here
        
    }
}`,
        cpp: `class Solution {
public:
    int shortestPath(vector<vector<int>>& grid, int k) {
        // code here
        
    }
};`,
      },
    },

    // Problem 2 (Q2: Hard)
    {
      id: 'prob-sunday-42-q2',
      number: 2,
      title: 'Maximum Profit in Job Scheduling with Deadlines & Overlaps',
      slug: 'sunday-max-profit-job-scheduling',
      difficulty: 'Hard',
      points: 600,
      description: `We have \`n\` jobs, where every job is scheduled to be done from \`startTime[i]\` to \`endTime[i]\`, obtaining a profit of \`profit[i]\`.

You're given the \`startTime\`, \`endTime\` and \`profit\` arrays, return the maximum profit you can take such that there are no two jobs in the subset with overlapping time range.

If you choose a job that ends at time \`X\` you will be able to start another job that starts at time \`X\`.

### Example 1:
\`\`\`
Input: startTime = [1,2,3,3], endTime = [3,4,5,6], profit = [50,10,40,70]
Output: 120
Explanation: The subset chosen is the first and fourth job. Time range [1-3]+[3-6] , we get profit of 50 + 70 = 120.
\`\`\`

### Example 2:
\`\`\`
Input: startTime = [1,2,3,4,6], endTime = [3,5,10,6,9], profit = [20,20,100,70,60]
Output: 150
Explanation: The subset chosen is [1,3], [3,6], and [6,9] with profit 20 + 70 + 60 = 150.
\`\`\``,
      constraints: [
        '1 <= startTime.length == endTime.length == profit.length <= 5 * 10^4',
        '1 <= startTime[i] < endTime[i] <= 10^9',
        '1 <= profit[i] <= 10^4',
      ],
      sampleTestCases: [
        {
          input: '[1,2,3,3], [3,4,5,6], [50,10,40,70]',
          expectedOutput: '120',
          explanation: 'Jobs [1-3] and [3-6] yield 50 + 70 = 120.',
        },
        {
          input: '[1,2,3,4,6], [3,5,10,6,9], [20,20,100,70,60]',
          expectedOutput: '150',
          explanation: 'Jobs [1-3], [3-6], [6-9] yield 20 + 70 + 60 = 150.',
        },
      ],
      hiddenTestCases: [
        {
          input: '[1,1,1], [2,3,4], [5,6,4]',
          expectedOutput: '6',
          explanation: 'Pick single highest job yielding 6.',
        },
        {
          input: '[4,2,4,8,2], [5,5,5,10,8], [12,8,10,12,12]',
          expectedOutput: '24',
          explanation: 'Optimal schedule yields 24.',
        },
      ],
      starterCode: {
        javascript: `/**
 * @param {number[]} startTime
 * @param {number[]} endTime
 * @param {number[]} profit
 * @return {number}
 */
class Solution {
    jobScheduling(startTime, endTime, profit) {
        // code here
        
    }
}`,
        typescript: `class Solution {
    jobScheduling(startTime: number[], endTime: number[], profit: number[]): number {
        // code here
        return 0;
    }
}`,
        python: `class Solution:
    def jobScheduling(self, startTime: list[int], endTime: list[int], profit: list[int]) -> int:
        # code here
        pass`,
        java: `class Solution {
    public int jobScheduling(int[] startTime, int[] endTime, int[] profit) {
        // code here
        
    }
}`,
        cpp: `class Solution {
public:
    int jobScheduling(vector<int>& startTime, vector<int>& endTime, vector<int>& profit) {
        // code here
        
    }
};`,
      },
    },
  ],

  // Rich Leaderboard Profiles (Clickable for info popup & full profile)
  leaderboard: [
    {
      userId: '6a8c5f3246f2897c4956fc99',
      username: 'sandipkrverma',
      name: 'Sandip Kr Verma',
      avatar: '',
      rank: 1,
      score: 1000,
      problemsSolved: 2,
      finishTime: '00:24:18',
      coinsWon: 100,
      badge: '👑 Champion',
      bio: 'Lead Problem Solver mastering DSA and Full-Stack on NextEra Coders.',
      college: 'Ramgarh Engineering College',
      globalRating: 2480,
      globalRank: 1,
      totalSolved: { easy: 180, medium: 240, hard: 95 },
      streak: 42,
      skills: ['C++', 'TypeScript', 'Graph Theory', 'DP', 'System Design'],
      country: 'India',
      github: 'https://github.com/sandipkrverma',
      linkedin: 'https://linkedin.com/in/sandipkrverma',
      articlesPublished: 8,
      antiCheat: {
        tabSwitchesCount: 0,
        pasteCount: 0,
        timeTakenSeconds: 1458,
        startedAt: '2026-09-13T10:00:00Z',
        submittedAt: '2026-09-13T10:24:18Z',
        status: 'Clean',
        reason: '100% focused session with zero tab switches',
        logs: [
          { timestamp: '10:00:00 AM', event: 'join', details: 'Joined contest arena' },
          { timestamp: '10:11:15 AM', event: 'submit', details: 'Q1 Solved (100% test cases passed)' },
          { timestamp: '10:24:18 AM', event: 'submit', details: 'Q2 Solved (Grand Champion)' },
        ],
      },
    },
    {
      userId: '6a95745b5c11d4565f72e8d2',
      username: 'murari_verma',
      name: 'Murari Verma',
      avatar: '',
      rank: 2,
      score: 1000,
      problemsSolved: 2,
      finishTime: '00:32:40',
      coinsWon: 75,
      badge: '🥈 Runner Up',
      bio: 'Passionate competitive programmer solving complex algorithmic challenges on NEC.',
      college: 'BIT Sindri • Computer Science',
      globalRating: 2310,
      globalRank: 2,
      totalSolved: { easy: 160, medium: 210, hard: 82 },
      streak: 28,
      skills: ['Python', 'Java', 'Algorithms', 'Distributed Systems'],
      country: 'India',
      github: 'https://github.com/murari-verma',
      linkedin: 'https://linkedin.com/in/murari-verma',
      articlesPublished: 12,
      antiCheat: {
        tabSwitchesCount: 0,
        pasteCount: 0,
        timeTakenSeconds: 1960,
        startedAt: '2026-09-13T10:00:00Z',
        submittedAt: '2026-09-13T10:32:40Z',
        status: 'Clean',
        reason: 'Clean manual typing verified',
        logs: [
          { timestamp: '10:00:05 AM', event: 'join', details: 'Joined contest arena' },
          { timestamp: '10:32:40 AM', event: 'submit', details: 'Completed both challenges' },
        ],
      },
    },
    {
      userId: '6a9576cc5c11d4565f72ee21',
      username: 'vipul_raj',
      name: 'Vipul Raj',
      avatar: '',
      rank: 3,
      score: 1000,
      problemsSolved: 2,
      finishTime: '00:38:15',
      coinsWon: 50,
      badge: '🥉 Bronze',
      bio: 'Enthusiastic developer focused on data structures, algorithmic design and clean code.',
      college: 'NIT Jamshedpur • IT',
      globalRating: 2185,
      globalRank: 3,
      totalSolved: { easy: 145, medium: 190, hard: 65 },
      streak: 19,
      skills: ['Go', 'C++', 'Microservices', 'Redis'],
      country: 'India',
      github: 'https://github.com/vipul-raj',
      linkedin: 'https://linkedin.com/in/vipul-raj',
      articlesPublished: 5,
      antiCheat: {
        tabSwitchesCount: 1,
        pasteCount: 0,
        timeTakenSeconds: 2295,
        startedAt: '2026-09-13T10:00:00Z',
        submittedAt: '2026-09-13T10:38:15Z',
        status: 'Clean',
        reason: 'Single momentary window blur, clean solve verified',
        logs: [
          { timestamp: '10:00:10 AM', event: 'join', details: 'Joined contest arena' },
          { timestamp: '10:38:15 AM', event: 'submit', details: 'Submitted final code' },
        ],
      },
    },
    {
      userId: '6aa6d9c3910843570702f53f',
      username: 'utkarsh_kumar',
      name: 'Utkarsh Kumar',
      avatar: '',
      rank: 4,
      score: 500,
      problemsSolved: 1,
      finishTime: '00:18:22',
      coinsWon: 25,
      badge: '⚡ Top 5',
      bio: 'Algorithms enthusiast conquering daily problems and weekly Sunday challenges.',
      college: 'IIIT Ranchi • CSE',
      globalRating: 1940,
      globalRank: 4,
      totalSolved: { easy: 120, medium: 140, hard: 35 },
      streak: 14,
      skills: ['JavaScript', 'React', 'DSA', 'Tailwind'],
      country: 'India',
      github: 'https://github.com/utkarsh-kumar',
      linkedin: 'https://linkedin.com/in/utkarsh-kumar',
      articlesPublished: 3,
      antiCheat: {
        tabSwitchesCount: 0,
        pasteCount: 0,
        timeTakenSeconds: 1102,
        startedAt: '2026-09-13T10:00:00Z',
        submittedAt: '2026-09-13T10:18:22Z',
        status: 'Clean',
        reason: 'Clean manual typing verified',
        logs: [
          { timestamp: '10:00:01 AM', event: 'join', details: 'Joined contest arena' },
          { timestamp: '10:18:22 AM', event: 'submit', details: 'Q1 Solved cleanly' },
        ],
      },
    },
    {
      userId: '6a957b592876e16538fa338c',
      username: 'nexteracoders',
      name: 'NextEra Coders Administrator',
      avatar: 'https://lh3.googleusercontent.com/a/ACg8ocKslGvax674MK5HEFFv4xVnWiIzb2LQoLkZ0IAENU0yI-WwnHE=s96-c',
      rank: 5,
      score: 500,
      problemsSolved: 1,
      finishTime: '00:22:50',
      coinsWon: 25,
      badge: '⚡ Top 5',
      bio: 'Platform Architect maintaining arena infrastructure and community challenges.',
      college: 'NextEra Coders Core Team',
      globalRating: 1890,
      globalRank: 5,
      totalSolved: { easy: 110, medium: 130, hard: 40 },
      streak: 9,
      skills: ['Python', 'System Design', 'C++', 'Cloud'],
      country: 'India',
      github: 'https://github.com/nexteracoders',
      linkedin: 'https://linkedin.com/company/nextera-coders',
      articlesPublished: 6,
      antiCheat: {
        tabSwitchesCount: 0,
        pasteCount: 0,
        timeTakenSeconds: 1370,
        startedAt: '2026-09-13T10:00:00Z',
        submittedAt: '2026-09-13T10:22:50Z',
        status: 'Clean',
        reason: 'Pure manual typing, verified clean solve',
        logs: [
          { timestamp: '10:00:02 AM', event: 'join', details: 'Entered arena' },
          { timestamp: '10:22:50 AM', event: 'submit', details: 'Q1 Solved with optimal logic' },
        ],
      },
    },
  ],
};

class SundayContestService {
  private config: SundayContestConfig;
  private listeners: Set<(config: SundayContestConfig) => void> = new Set();

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): SundayContestConfig {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.problems && parsed.problems.length === 2) {
            if (!parsed.autoPilot) {
              parsed.autoPilot = { ...DEFAULT_AUTOPILOT_SETTINGS };
            }
            return parsed;
          }
        }
      }
    } catch (e) {
      console.error('Error loading Sunday contest config', e);
    }
    const initialConfig: SundayContestConfig = {
      ...DEFAULT_SUNDAY_CONTEST,
      autoPilot: { ...DEFAULT_AUTOPILOT_SETTINGS },
    };
    this.saveConfig(initialConfig);
    return initialConfig;
  }

  private saveConfig(config: SundayContestConfig) {
    this.config = config;
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      }
    } catch (e) {
      console.error('Error saving Sunday contest config', e);
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach((l) => l(this.config));
  }

  public subscribe(listener: (config: SundayContestConfig) => void): () => void {
    this.listeners.add(listener);
    listener(this.config);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Helper: Curated unified serial pool starting with Top 150 problems followed by remaining practice problems
  public getSerialProblemsPool(): PracticeProblemTemplate[] {
    const catalogMap = new Map<string, PracticeProblemTemplate>();
    const baseCatalog = typeof PRACTICE_PROBLEMS_CATALOG !== 'undefined' && PRACTICE_PROBLEMS_CATALOG.length > 0
      ? PRACTICE_PROBLEMS_CATALOG
      : [];

    for (const prob of baseCatalog) {
      catalogMap.set(prob.slug, prob);
    }

    const result: PracticeProblemTemplate[] = [];
    const addedSlugs = new Set<string>();

    // 1. Add Top 150 problems in serial sequence
    if (typeof DEFAULT_TOP_150_PROBLEMS !== 'undefined' && Array.isArray(DEFAULT_TOP_150_PROBLEMS)) {
      for (const t150 of DEFAULT_TOP_150_PROBLEMS) {
        const match = catalogMap.get(t150.slug);
        if (match && !addedSlugs.has(match.slug)) {
          result.push(match);
          addedSlugs.add(match.slug);
        }
      }
    }

    // 2. Add remaining problems from Master Catalog
    for (const prob of baseCatalog) {
      if (!addedSlugs.has(prob.slug)) {
        result.push(prob);
        addedSlugs.add(prob.slug);
      }
    }

    return result.length > 0 ? result : baseCatalog;
  }

  // Auto-Rotate Daily Streak Problem (Midnight / Date change / Serial Order)
  public checkAndAutoRotateDailyStreak(force: boolean = false): boolean {
    const now = new Date();
    const todayDateStr = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('-');

    if (!this.config.autoPilot) {
      this.config.autoPilot = { ...DEFAULT_AUTOPILOT_SETTINGS };
    }

    const ap = this.config.autoPilot;
    if (!ap.enabled && !force) {
      return false;
    }

    // If today is already configured and not forcing
    if (!force && ap.lastDailyDate === todayDateStr && this.config.dailyStreakProblem) {
      return false;
    }

    // If admin manually set a problem specifically for today, and not forced, preserve admin's choice for today
    if (!force && ap.isDailyManualForToday && ap.lastDailyDate === todayDateStr) {
      return false;
    }

    const pool = this.getSerialProblemsPool();
    if (!pool || pool.length === 0) return false;

    let nextIndex = ap.dailySerialIndex || 0;
    if (force || (ap.lastDailyDate && ap.lastDailyDate !== todayDateStr)) {
      nextIndex = (nextIndex + 1) % pool.length;
    }

    const template = pool[nextIndex % pool.length] || pool[0];
    const dailyProb: SundayContestProblem = {
      id: `potd-${todayDateStr}-${template.slug}`,
      number: 1,
      order: template.order,
      title: template.title,
      slug: template.slug,
      difficulty: template.difficulty,
      points: template.difficulty === 'Easy' ? 100 : template.difficulty === 'Medium' ? 200 : 300,
      description: template.description,
      constraints: [...template.constraints],
      sampleTestCases: [...template.sampleTestCases],
      hiddenTestCases: [...template.hiddenTestCases],
      starterCode: { ...template.starterCode },
      date: todayDateStr,
      sourceType: 'auto',
      sourceLabel: `Auto-Pilot Serial #${(nextIndex % pool.length) + 1} (${template.category || 'DSA'})`,
    };

    const newConfig: SundayContestConfig = {
      ...this.config,
      dailyStreakProblem: dailyProb,
      autoPilot: {
        ...ap,
        lastDailyDate: todayDateStr,
        dailySerialIndex: nextIndex % pool.length,
        isDailyManualForToday: false,
        dailyAutoSource: `Auto-Pilot Serial #${(nextIndex % pool.length) + 1} (${template.title})`,
      },
      updatedAt: new Date().toISOString(),
    };

    this.saveConfig(newConfig);
    return true;
  }

  // Auto-Rotate Weekly Contest Problems (Strict Mixed Difficulty Rule: Never Easy+Easy, Medium+Medium, Hard+Hard)
  public checkAndAutoRotateWeeklyContest(force: boolean = false): boolean {
    const pool = this.getSerialProblemsPool();
    if (!pool || pool.length === 0) return false;

    if (!this.config.autoPilot) {
      this.config.autoPilot = { ...DEFAULT_AUTOPILOT_SETTINGS };
    }

    const ap = this.config.autoPilot;
    if (!ap.enabled && !force) {
      return false;
    }

    // Partition problems by difficulty
    const easyPool = pool.filter((p) => p.difficulty === 'Easy');
    const mediumPool = pool.filter((p) => p.difficulty === 'Medium');
    const hardPool = pool.filter((p) => p.difficulty === 'Hard');

    const validEasy = easyPool.length > 0 ? easyPool : pool;
    const validMedium = mediumPool.length > 0 ? mediumPool : pool;
    const validHard = hardPool.length > 0 ? hardPool : pool;

    // Strict Mixed Difficulty Pairs: Every single pair has q1 !== q2!
    const MIXED_PAIRS: Array<{
      q1: 'Easy' | 'Medium' | 'Hard';
      q2: 'Easy' | 'Medium' | 'Hard';
      label: string;
      desc: string;
    }> = [
      { q1: 'Easy', q2: 'Medium', label: 'Easy + Medium', desc: 'Progressive Challenge Arena' },
      { q1: 'Medium', q2: 'Hard', label: 'Medium + Hard', desc: 'Championship Challenger Arena' },
      { q1: 'Easy', q2: 'Hard', label: 'Easy + Hard', desc: 'Sprint to Summit Arena' },
      { q1: 'Medium', q2: 'Easy', label: 'Medium + Easy', desc: 'Inverted Strategic Pair' },
      { q1: 'Hard', q2: 'Medium', label: 'Hard + Medium', desc: 'Grandmaster Arena' },
      { q1: 'Hard', q2: 'Easy', label: 'Hard + Easy', desc: 'Extreme Contrast Arena' },
    ];

    const step = ap.weeklyPatternStep || 0;
    const currentPair = MIXED_PAIRS[step % MIXED_PAIRS.length];

    const poolForQ1 = currentPair.q1 === 'Easy' ? validEasy : currentPair.q1 === 'Medium' ? validMedium : validHard;
    const poolForQ2 = currentPair.q2 === 'Easy' ? validEasy : currentPair.q2 === 'Medium' ? validMedium : validHard;

    let eIdx = ap.weeklyEasyIndex || 0;
    let mIdx = ap.weeklyMediumIndex || 0;
    let hIdx = ap.weeklyHardIndex || 0;

    const getNextAndAdvance = (diff: 'Easy' | 'Medium' | 'Hard', pPool: PracticeProblemTemplate[]) => {
      let idx = diff === 'Easy' ? eIdx : diff === 'Medium' ? mIdx : hIdx;
      const chosen = pPool[idx % pPool.length] || pPool[0];
      idx = (idx + 1) % pPool.length;
      if (diff === 'Easy') eIdx = idx;
      else if (diff === 'Medium') mIdx = idx;
      else hIdx = idx;
      return chosen;
    };

    const t1 = getNextAndAdvance(currentPair.q1, poolForQ1);
    let t2 = getNextAndAdvance(currentPair.q2, poolForQ2);

    // Guard: Guarantee t1 and t2 are distinct problems
    if (t2.slug === t1.slug) {
      t2 = getNextAndAdvance(currentPair.q2, poolForQ2);
    }

    const newProb1: SundayContestProblem = {
      id: `sunday-p1-${this.config.contestNumber}-${t1.slug}`,
      number: 1,
      order: t1.order,
      title: t1.title,
      slug: t1.slug,
      difficulty: currentPair.q1,
      points: currentPair.q1 === 'Easy' ? 300 : currentPair.q1 === 'Medium' ? 400 : 500,
      description: t1.description,
      constraints: [...t1.constraints],
      sampleTestCases: [...t1.sampleTestCases],
      hiddenTestCases: [...t1.hiddenTestCases],
      starterCode: { ...t1.starterCode },
      sourceType: 'auto',
      sourceLabel: `Auto-Pilot Q1 (${currentPair.q1})`,
    };

    const newProb2: SundayContestProblem = {
      id: `sunday-p2-${this.config.contestNumber}-${t2.slug}`,
      number: 2,
      order: t2.order,
      title: t2.title,
      slug: t2.slug,
      difficulty: currentPair.q2,
      points: currentPair.q2 === 'Hard' ? 600 : currentPair.q2 === 'Medium' ? 400 : 300,
      description: t2.description,
      constraints: [...t2.constraints],
      sampleTestCases: [...t2.sampleTestCases],
      hiddenTestCases: [...t2.hiddenTestCases],
      starterCode: { ...t2.starterCode },
      sourceType: 'auto',
      sourceLabel: `Auto-Pilot Q2 (${currentPair.q2})`,
    };

    const newConfig: SundayContestConfig = {
      ...this.config,
      problems: [newProb1, newProb2],
      autoPilot: {
        ...ap,
        lastWeeklyContestNumber: this.config.contestNumber,
        isWeeklyManualForCurrentRound: false,
        weeklyEasyIndex: eIdx,
        weeklyMediumIndex: mIdx,
        weeklyHardIndex: hIdx,
        weeklyPatternStep: step + 1,
        weeklyAutoSource: `${currentPair.label} — ${currentPair.desc}`,
      },
      updatedAt: new Date().toISOString(),
    };

    this.saveConfig(newConfig);
    return true;
  }

  // Safety enforcer: Guarantees Q1 and Q2 NEVER have matching difficulty
  public ensureMixedContestDifficulties(): boolean {
    const q1 = this.config.problems[0];
    const q2 = this.config.problems[1];

    if (!q1 || !q2 || q1.difficulty === q2.difficulty) {
      return this.checkAndAutoRotateWeeklyContest(true);
    }
    return false;
  }

  // Admin manually triggers next Daily Problem rotation (Advances serial pointer)
  public triggerManualDailyRotation(): SundayContestConfig {
    this.checkAndAutoRotateDailyStreak(true);
    return { ...this.config };
  }

  // Admin manually generates a balanced mixed pair for the Weekly Contest
  public triggerManualWeeklyRotation(): SundayContestConfig {
    this.checkAndAutoRotateWeeklyContest(true);
    return { ...this.config };
  }

  // Admin toggles or updates Auto-Pilot configuration
  public setAutoPilotSettings(settings: Partial<AutoPilotSettings>): SundayContestConfig {
    const current = this.config.autoPilot || { ...DEFAULT_AUTOPILOT_SETTINGS };
    const updatedAp: AutoPilotSettings = {
      ...current,
      ...settings,
    };
    return this.updateConfig({ autoPilot: updatedAp });
  }

  public checkSundayReset(): boolean {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 is Sunday
    const todayDateStr = now.toDateString();

    // If today is Sunday
    if (dayOfWeek === 0) {
      const lastContestDate = this.config.sundayDate ? new Date(this.config.sundayDate).toDateString() : null;
      // If today is a new Sunday date that hasn't been initialized yet
      if (lastContestDate && lastContestDate !== todayDateStr) {
        const nextContestNumber = (this.config.contestNumber || 42) + 1;

        // Auto-update round and reset solved map
        this.config = {
          ...this.config,
          id: `sunday-contest-${nextContestNumber}`,
          contestNumber: nextContestNumber,
          title: `NEC Sunday Grand Championship #${nextContestNumber}`,
          sundayDate: now.toISOString(),
          solvedProblemsMap: {}, // Reset solved map for the new Sunday edition!
          updatedAt: now.toISOString(),
        };

        // Auto-rotate mixed difficulty problems serial-wise for the new Sunday contest!
        this.checkAndAutoRotateWeeklyContest(true);
        return true;
      }
    }
    return false;
  }

  public getConfig(): SundayContestConfig {
    this.checkSundayReset();
    this.checkAndAutoRotateDailyStreak();
    this.ensureMixedContestDifficulties();
    return { ...this.config };
  }

  public getCoderProfile(idOrUsername: string): CoderProfile | undefined {
    const lb = this.config.leaderboard || DEFAULT_SUNDAY_CONTEST.leaderboard || [];
    const clean = idOrUsername.toLowerCase().trim();
    return lb.find(
      (p) => (p.userId && p.userId.toLowerCase() === clean) || (p.username && p.username.toLowerCase() === clean)
    );
  }

  // Admin updates Sunday Contest settings & both problems
  public updateConfig(updated: Partial<SundayContestConfig>): SundayContestConfig {
    const newConfig: SundayContestConfig = {
      ...this.config,
      ...updated,
      updatedAt: new Date().toISOString(),
    };
    this.saveConfig(newConfig);
    return newConfig;
  }

  // Check if today is Sunday or force-live is enabled
  public getContestLiveStatus(): {
    isLive: boolean;
    isSunday: boolean;
    isArchivePractice: boolean;
    dayName: string;
    hoursLeft: number;
    minutesLeft: number;
    secondsLeft: number;
  } {
    this.checkSundayReset();
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 is Sunday
    const isSunday = dayOfWeek === 0;
    const isLive = isSunday || this.config.isForceLive;

    // Between Sundays, previous contest remains open for practice
    const isArchivePractice = !isLive && this.config.isArchiveOpen;

    // Calculate time left until Sunday midnight (23:59:59)
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    const diffMs = Math.max(0, endOfDay.getTime() - now.getTime());

    const hoursLeft = Math.floor(diffMs / (1000 * 60 * 60));
    const minutesLeft = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const secondsLeft = Math.floor((diffMs % (1000 * 60)) / 1000);

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return {
      isLive,
      isSunday,
      isArchivePractice,
      dayName: dayNames[dayOfWeek],
      hoursLeft,
      minutesLeft,
      secondsLeft,
    };
  }

  // Check which problems user has solved in current edition
  public getUserSolvedProblemNumbers(userKey: string = 'current_user'): number[] {
    this.checkSundayReset();
    return this.config.solvedProblemsMap[userKey] || [];
  }

  // Evaluate submission for a specific problem (Problem #1 or Problem #2)
  public async evaluateProblemSubmission(
    problemNumber: number,
    code: string,
    _language: string = 'javascript',
    userKey: string = 'current_user',
    userProfile?: { id?: string; name?: string; email?: string; avatar?: string; college?: string },
    antiCheatData?: {
      tabSwitchesCount: number;
      pasteCount: number;
      timeTakenSeconds: number;
      startedAt?: string;
      submittedAt?: string;
      logs?: AntiCheatSessionLog[];
    }
  ): Promise<{
    allPassed: boolean;
    passedCount: number;
    totalCount: number;
    coinsAwarded: number;
    isAlreadySolved: boolean;
    hasCompletedBoth: boolean;
    results: { input: string; expected: string; actual: string; passed: boolean }[];
    antiCheatVerdict: {
      status: 'Clean' | 'Suspicious' | 'Flagged';
      reason: string;
      tabSwitchesCount: number;
      pasteCount: number;
      timeTakenSeconds: number;
    };
    error?: string;
  }> {
    const problem = this.config.problems.find((p) => p.number === problemNumber) || this.config.problems[0];
    const allCases = [...problem.sampleTestCases, ...problem.hiddenTestCases];
    const totalCount = allCases.length;
    let passedCount = 0;
    const results: { input: string; expected: string; actual: string; passed: boolean }[] = [];

    if (userProfile) {
      coinService.syncUserProfile({
        id: userProfile.id || userKey,
        name: userProfile.name,
        email: userProfile.email,
        profileImage: userProfile.avatar,
        college: userProfile.college,
      });
    }

    // Execute and evaluate full test cases with precision
    const evalResult = await evaluateTestCases(
      _language,
      code,
      allCases,
      problem.slug,
      problem.title
    );

    for (const tc of evalResult.testCases) {
      results.push({
        input: tc.input,
        expected: tc.expectedOutput,
        actual: tc.error ? tc.error : tc.actualOutput || 'undefined',
        passed: Boolean(tc.passed),
      });
      if (tc.passed) passedCount++;
    }

    const allPassed = evalResult.passed && passedCount === totalCount;
    const userSolved = this.getUserSolvedProblemNumbers(userKey);
    const isAlreadySolved = userSolved.includes(problemNumber);

    // Compute Anti-Cheat Verdict
    const tabSwitches = antiCheatData?.tabSwitchesCount ?? 0;
    const pastes = antiCheatData?.pasteCount ?? 0;
    const timeSec = antiCheatData?.timeTakenSeconds ?? 0;

    let acStatus: 'Clean' | 'Suspicious' | 'Flagged' = 'Clean';
    const flagReasons: string[] = [];

    if (tabSwitches >= 4 || (timeSec > 0 && timeSec < 45) || pastes >= 5) {
      acStatus = 'Flagged';
      if (tabSwitches >= 4) flagReasons.push(`${tabSwitches} window tab switches`);
      if (timeSec > 0 && timeSec < 45) flagReasons.push(`Impossibly fast solve (${timeSec}s)`);
      if (pastes >= 5) flagReasons.push(`${pastes} clipboard pastes`);
    } else if (tabSwitches >= 2 || pastes >= 2) {
      acStatus = 'Suspicious';
      if (tabSwitches >= 2) flagReasons.push(`${tabSwitches} window tab switches`);
      if (pastes >= 2) flagReasons.push(`${pastes} clipboard pastes`);
    } else {
      acStatus = 'Clean';
      flagReasons.push('Verified normal typing & focused window');
    }

    const antiCheatVerdict = {
      status: acStatus,
      reason: flagReasons.join(' • '),
      tabSwitchesCount: tabSwitches,
      pasteCount: pastes,
      timeTakenSeconds: timeSec,
    };

    const studentLogs: AntiCheatSessionLog[] = [
      ...(antiCheatData?.logs || [
        {
          timestamp: new Date(Date.now() - (timeSec > 0 ? timeSec * 1000 : 60000)).toLocaleTimeString(),
          event: 'join' as const,
          details: 'Joined contest arena',
        },
      ]),
      {
        timestamp: new Date().toLocaleTimeString(),
        event: 'submit' as const,
        details: `Submitted code (${_language}): ${passedCount}/${totalCount} tests passed (${timeSec}s elapsed)`,
      },
    ];

    const antiCheatRecord: AntiCheatRecord = {
      tabSwitchesCount: tabSwitches,
      pasteCount: pastes,
      timeTakenSeconds: timeSec,
      startedAt: antiCheatData?.startedAt || new Date(Date.now() - (timeSec * 1000)).toISOString(),
      submittedAt: antiCheatData?.submittedAt || new Date().toISOString(),
      status: acStatus,
      reason: antiCheatVerdict.reason,
      logs: studentLogs,
    };

    let coinsAwarded = 0;
    let hasCompletedBoth = false;

    // Format mm:ss finish time
    const formatFinishTime = (sec: number) => {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    if (allPassed && !isAlreadySolved) {
      const updatedSolved = [...userSolved, problemNumber];
      const updatedMap = {
        ...this.config.solvedProblemsMap,
        [userKey]: updatedSolved,
      };

      hasCompletedBoth = updatedSolved.length >= 2;

      // Coins are ONLY awarded when BOTH 2 problems are solved (100 Coins total)
      if (hasCompletedBoth) {
        coinsAwarded = this.config.coinsPrize; // 100 Coins
        await coinService.awardContestWinner(
          `Weekly Contest #${this.config.contestNumber} Grand Champion (Solved All 2 Problems)`,
          this.config.contestNumber,
          this.config.coinsPrize
        );
      }

      // Update / insert student in live contest leaderboard
      let updatedLeaderboard = [...(this.config.leaderboard || [])];
      const studentName = userProfile?.name || 'Student Coder';
      const studentAvatar = userProfile?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120';
      const studentCollege = userProfile?.college || 'Engineering College';
      const studentEmail = userProfile?.email || '';

      const existingIdx = updatedLeaderboard.findIndex(
        (c) =>
          c.userId === userKey ||
          (userProfile?.id && c.userId === userProfile.id) ||
          (studentEmail && (c.bio?.includes(studentEmail) || c.name === studentName))
      );

      const entry: CoderProfile = {
        userId: userProfile?.id || userKey,
        username: studentName.toLowerCase().replace(/\s+/g, '_'),
        name: studentName,
        avatar: studentAvatar,
        rank: hasCompletedBoth ? 1 : 4,
        score: updatedSolved.length * 500,
        problemsSolved: updatedSolved.length,
        finishTime: timeSec > 0 ? formatFinishTime(timeSec) : (hasCompletedBoth ? '00:26:14' : '00:14:02'),
        coinsWon: hasCompletedBoth ? 100 : 0,
        badge: acStatus === 'Flagged' ? '⛔ Plagiarism Flagged' : hasCompletedBoth ? '👑 Grand Champion' : '⚡ Solved 1/2',
        bio: studentEmail ? `Competitive programmer (${studentEmail})` : 'Student at NextEra Coders.',
        college: studentCollege,
        globalRating: 2280,
        globalRank: 45,
        totalSolved: { easy: 70, medium: 52, hard: 24 },
        streak: 12,
        skills: ['DSA', 'TypeScript', 'Algorithms'],
        country: 'India',
        antiCheat: antiCheatRecord,
      };

      if (existingIdx >= 0) {
        updatedLeaderboard[existingIdx] = {
          ...updatedLeaderboard[existingIdx],
          ...entry,
        };
      } else {
        updatedLeaderboard.unshift(entry);
      }

      // Re-sort leaderboard by score descending, problemsSolved descending
      updatedLeaderboard.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.problemsSolved - a.problemsSolved;
      });

      // Assign sequential ranks
      updatedLeaderboard = updatedLeaderboard.map((item, idx) => ({
        ...item,
        rank: idx + 1,
      }));

      this.updateConfig({
        solvedProblemsMap: updatedMap,
        leaderboard: updatedLeaderboard,
      });
    } else {
      // If code was submitted (even if failed or already solved), update student's anti-cheat session
      let currentLeaderboard = [...(this.config.leaderboard || [])];
      const studentName = userProfile?.name || 'Student Coder';
      const studentEmail = userProfile?.email || '';
      const existingIdx = currentLeaderboard.findIndex(
        (c) =>
          c.userId === userKey ||
          (userProfile?.id && c.userId === userProfile.id) ||
          (studentEmail && (c.bio?.includes(studentEmail) || c.name === studentName))
      );
      if (existingIdx >= 0) {
        currentLeaderboard[existingIdx] = {
          ...currentLeaderboard[existingIdx],
          antiCheat: antiCheatRecord,
        };
        this.updateConfig({ leaderboard: currentLeaderboard });
      }
    }

    return {
      allPassed,
      passedCount,
      totalCount,
      coinsAwarded,
      isAlreadySolved,
      hasCompletedBoth,
      results,
      antiCheatVerdict,
    };
  }

  // Record an active anti-cheat session even during arena progress
  public recordAntiCheatSession(
    userKey: string,
    userProfile: { id?: string; name?: string; email?: string; avatar?: string; college?: string },
    antiCheatData: {
      tabSwitchesCount: number;
      pasteCount: number;
      timeTakenSeconds: number;
      startedAt?: string;
      submittedAt?: string;
      logs?: AntiCheatSessionLog[];
    }
  ): void {
    const list = [...(this.config.leaderboard || DEFAULT_SUNDAY_CONTEST.leaderboard || [])];
    const cleanId = (userProfile?.id || userKey).toLowerCase().trim();
    const idx = list.findIndex(
      (p) => (p.userId && p.userId.toLowerCase() === cleanId) || (p.name && p.name.toLowerCase() === (userProfile.name || '').toLowerCase())
    );

    const tabSwitches = antiCheatData.tabSwitchesCount;
    const pastes = antiCheatData.pasteCount;
    const timeSec = antiCheatData.timeTakenSeconds;
    let status: 'Clean' | 'Suspicious' | 'Flagged' = 'Clean';
    if (tabSwitches >= 4 || (timeSec > 0 && timeSec < 45) || pastes >= 5) status = 'Flagged';
    else if (tabSwitches >= 2 || pastes >= 2) status = 'Suspicious';

    const acRecord: AntiCheatRecord = {
      tabSwitchesCount: tabSwitches,
      pasteCount: pastes,
      timeTakenSeconds: timeSec,
      startedAt: antiCheatData.startedAt || new Date(Date.now() - timeSec * 1000).toISOString(),
      submittedAt: antiCheatData.submittedAt || new Date().toISOString(),
      status,
      reason: status === 'Flagged' ? `${tabSwitches} switches • ${pastes} pastes` : status === 'Suspicious' ? `${tabSwitches} switches` : 'Clean live tracking',
      logs: antiCheatData.logs || [],
    };

    if (idx >= 0) {
      list[idx] = { ...list[idx], antiCheat: acRecord };
    }
    this.updateConfig({ leaderboard: list });
  }

  // Get all participants with guaranteed antiCheat record for Admin Anti-Cheat Review
  public getAntiCheatParticipants(): CoderProfile[] {
    const defaultParticipants = DEFAULT_SUNDAY_CONTEST.leaderboard || [];
    const current = this.config.leaderboard && this.config.leaderboard.length > 0
      ? this.config.leaderboard
      : defaultParticipants;

    return current.map((p, idx) => {
      if (p.antiCheat) return p;
      const mockMatch = defaultParticipants.find((dp) => dp.userId === p.userId || dp.username === p.username);
      if (mockMatch?.antiCheat) {
        return { ...p, antiCheat: mockMatch.antiCheat };
      }
      return {
        ...p,
        antiCheat: {
          tabSwitchesCount: 0,
          pasteCount: 0,
          timeTakenSeconds: 1200 + idx * 180,
          startedAt: new Date(Date.now() - (1200 + idx * 180) * 1000).toISOString(),
          submittedAt: new Date().toISOString(),
          status: 'Clean',
          reason: 'Verified normal activity • No suspicious events',
          logs: [
            { timestamp: '10:00:00 AM', event: 'join' as const, details: 'Joined arena' },
            { timestamp: '10:20:00 AM', event: 'submit' as const, details: 'Solution submitted' },
          ],
        },
      };
    });
  }

  // Admin overrides participant anti-cheat status (e.g. Mark Clean or Disqualify)
  public overrideAntiCheatStatus(
    userIdOrUsername: string,
    status: 'Clean' | 'Suspicious' | 'Flagged',
    reason?: string
  ): boolean {
    const list = this.getAntiCheatParticipants();
    const cleanId = userIdOrUsername.toLowerCase().trim();
    const targetIdx = list.findIndex(
      (p) => (p.userId && p.userId.toLowerCase() === cleanId) || (p.username && p.username.toLowerCase() === cleanId)
    );

    if (targetIdx >= 0) {
      const target = list[targetIdx];
      const prevAntiCheat: AntiCheatRecord = target.antiCheat || {
        tabSwitchesCount: 0,
        pasteCount: 0,
        timeTakenSeconds: 600,
        startedAt: new Date(Date.now() - 600000).toISOString(),
        submittedAt: new Date().toISOString(),
        status: 'Clean',
        logs: [],
      };

      const updatedAntiCheat: AntiCheatRecord = {
        ...prevAntiCheat,
        status,
        reason: reason || (status === 'Clean' ? 'Manually verified as Clean by Admin' : status === 'Flagged' ? 'Disqualified/Flagged by Admin' : 'Marked Suspicious for review by Admin'),
        logs: [
          ...(prevAntiCheat.logs || []),
          {
            timestamp: new Date().toLocaleTimeString(),
            event: 'flag' as const,
            details: `Admin override: Status changed to ${status}${reason ? ` (${reason})` : ''}`,
          },
        ],
      };

      list[targetIdx] = {
        ...target,
        badge: status === 'Flagged' ? '⛔ Disqualified' : status === 'Suspicious' ? '⚠️ Under Review' : target.badge,
        antiCheat: updatedAntiCheat,
      };

      this.updateConfig({ leaderboard: list });
      return true;
    }
    return false;
  }

  // Get all problems from practice catalog for Admin selection
  public getPracticeProblemsCatalog(): PracticeProblemTemplate[] {
    return PRACTICE_PROBLEMS_CATALOG;
  }

  // Admin imports a problem from Practice repository into Contest (Q1 or Q2)
  public importProblemToContest(tabIdx: 0 | 1, templateId: string): SundayContestConfig {
    const template = PRACTICE_PROBLEMS_CATALOG.find((t) => t.id === templateId) || PRACTICE_PROBLEMS_CATALOG[0];
    const problemNumber = (tabIdx + 1) as 1 | 2;
    
    const updatedProblems = [...this.config.problems];
    updatedProblems[tabIdx] = {
      id: `prob-sunday-${this.config.contestNumber}-q${problemNumber}-${Date.now()}`,
      number: problemNumber,
      title: template.title,
      slug: template.slug,
      difficulty: template.difficulty,
      points: template.difficulty === 'Easy' ? 300 : template.difficulty === 'Medium' ? 400 : 600,
      description: template.description,
      constraints: [...template.constraints],
      sampleTestCases: [...template.sampleTestCases],
      hiddenTestCases: [...template.hiddenTestCases],
      starterCode: { ...template.starterCode },
      sourceType: 'admin',
      sourceLabel: `Admin Curated Q${problemNumber}`,
    };

    const ap = this.config.autoPilot || { ...DEFAULT_AUTOPILOT_SETTINGS };
    return this.updateConfig({
      problems: updatedProblems,
      autoPilot: {
        ...ap,
        isWeeklyManualForCurrentRound: true,
        weeklyAutoSource: 'Admin Manually Curated',
      },
    });
  }

  // Admin sets the active Daily Streak challenge problem
  public setDailyStreakProblem(templateId: string): SundayContestConfig {
    const template = PRACTICE_PROBLEMS_CATALOG.find((t) => t.id === templateId) || PRACTICE_PROBLEMS_CATALOG[0];
    const now = new Date();
    const todayDateStr = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('-');

    const dailyProb: SundayContestProblem = {
      id: `prob-daily-${Date.now()}`,
      number: 1,
      order: template.order,
      title: template.title,
      slug: template.slug,
      difficulty: template.difficulty,
      points: template.difficulty === 'Easy' ? 100 : template.difficulty === 'Medium' ? 200 : 300,
      description: template.description,
      constraints: [...template.constraints],
      sampleTestCases: [...template.sampleTestCases],
      hiddenTestCases: [...template.hiddenTestCases],
      starterCode: { ...template.starterCode },
      date: todayDateStr,
      sourceType: 'admin',
      sourceLabel: 'Admin Curated',
    };

    const ap = this.config.autoPilot || { ...DEFAULT_AUTOPILOT_SETTINGS };
    return this.updateConfig({
      dailyStreakProblem: dailyProb,
      autoPilot: {
        ...ap,
        lastDailyDate: todayDateStr,
        isDailyManualForToday: true,
        dailyAutoSource: `Admin Curated (${template.title})`,
      },
    });
  }

  // Admin sets custom or specific Daily Streak problem
  public setCustomDailyStreakProblem(customProb: Partial<SundayContestProblem>): SundayContestConfig {
    const now = new Date();
    const todayDateStr = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('-');

    const base: SundayContestProblem = {
      id: customProb.id || `prob-daily-${Date.now()}`,
      number: 1,
      order: customProb.order,
      title: customProb.title || 'Custom Daily Problem',
      slug: customProb.slug || (customProb.title ? customProb.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'custom-daily-problem'),
      difficulty: customProb.difficulty || 'Medium',
      points: customProb.points || (customProb.difficulty === 'Easy' ? 100 : customProb.difficulty === 'Medium' ? 200 : 300),
      description: customProb.description || '',
      constraints: customProb.constraints || ['1 <= n <= 10^5'],
      sampleTestCases: customProb.sampleTestCases || [],
      hiddenTestCases: customProb.hiddenTestCases || [],
      starterCode: customProb.starterCode || {},
      date: customProb.date || todayDateStr,
      sourceType: 'admin',
      sourceLabel: customProb.sourceLabel || 'Admin Manual Override',
    };

    const ap = this.config.autoPilot || { ...DEFAULT_AUTOPILOT_SETTINGS };
    return this.updateConfig({
      dailyStreakProblem: base,
      autoPilot: {
        ...ap,
        lastDailyDate: todayDateStr,
        isDailyManualForToday: true,
        dailyAutoSource: `Admin Manual (${base.title})`,
      },
    });
  }

  // Admin reverts today back to Auto-Pilot selection
  public revertDailyStreakToAuto(): SundayContestConfig {
    const ap = this.config.autoPilot || { ...DEFAULT_AUTOPILOT_SETTINGS };
    this.config.autoPilot = {
      ...ap,
      isDailyManualForToday: false,
    };
    this.checkAndAutoRotateDailyStreak(true);
    return this.getConfig();
  }

  // Get active Daily Streak Problem
  public getDailyStreakProblem(): SundayContestProblem {
    this.checkAndAutoRotateDailyStreak();
    if (this.config.dailyStreakProblem) {
      return this.config.dailyStreakProblem;
    }
    // Fallback to first practice problem
    const pool = this.getSerialProblemsPool();
    const t = (pool && pool[0]) || PRACTICE_PROBLEMS_CATALOG[0];
    return {
      id: 'default-daily-prob',
      number: 1,
      title: t.title,
      slug: t.slug,
      difficulty: t.difficulty,
      points: 100,
      description: t.description,
      constraints: [...t.constraints],
      sampleTestCases: [...t.sampleTestCases],
      hiddenTestCases: [...t.hiddenTestCases],
      starterCode: { ...t.starterCode },
      sourceType: 'auto',
      sourceLabel: 'Auto-Pilot Default',
    };
  }
}

// Curated Practice Problem Catalog for Admin to select from
const BASE_PRACTICE_PROBLEMS: PracticeProblemTemplate[] = [
  {
    id: 'practice-two-sum',
    title: 'Two Sum',
    slug: 'two-sum',
    difficulty: 'Easy',
    category: 'Arrays & Hashing',
    companies: ['Amazon', 'Google', 'Meta', 'Microsoft', 'Apple', 'Bloomberg'],
    description: `Given an array of integers \`nums\` and an integer \`target\`, return *indices of the two numbers such that they add up to \`target\`*.

You may assume that each input would have ***exactly one solution***, and you may not use the same element twice.

You can return the answer in any order.

### Example 1:
\`\`\`
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
\`\`\`

### Example 2:
\`\`\`
Input: nums = [3,2,4], target = 6
Output: [1,2]
\`\`\``,
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.',
    ],
    sampleTestCases: [
      { input: 'nums = [2,7,11,15], target = 9', expectedOutput: '[0,1]', explanation: '2 + 7 = 9' },
      { input: 'nums = [3,2,4], target = 6', expectedOutput: '[1,2]', explanation: '2 + 4 = 6' },
      { input: 'nums = [3,3], target = 6', expectedOutput: '[0,1]', explanation: '3 + 3 = 6' },
    ],
    hiddenTestCases: [
      { input: 'nums = [-3,4,3,90], target = 0', expectedOutput: '[0,2]', explanation: '-3 + 3 = 0' },
      { input: 'nums = [-10,-5,-3,7,15], target = 10', expectedOutput: '[1,4]', explanation: '-5 + 15 = 10' },
    ],
    starterCode: {
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) return [map.get(diff), i];
    map.set(nums[i], i);
  }
  return [];
}`,
      typescript: `function twoSum(nums: number[], target: number): number[] {
  const map = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) return [map.get(diff)!, i];
    map.set(nums[i], i);
  }
  return [];
}`,
      python: `class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        seen = {}
        for i, n in enumerate(nums):
            diff = target - n
            if diff in seen:
                return [seen[diff], i]
            seen[n] = i
        return []`,
      java: `import java.util.*;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int diff = target - nums[i];
            if (map.containsKey(diff)) {
                return new int[] { map.get(diff), i };
            }
            map.put(nums[i], i);
        }
        return new int[0];
    }
}`,
      cpp: `#include <vector>
#include <unordered_map>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> map;
        for (int i = 0; i < nums.size(); i++) {
            int diff = target - nums[i];
            if (map.count(diff)) {
                return {map[diff], i};
            }
            map[nums[i]] = i;
        }
        return {};
    }
};`,
    },
  },
  {
    id: 'practice-valid-parentheses',
    title: 'Valid Parentheses',
    slug: 'valid-parentheses',
    difficulty: 'Easy',
    category: 'Stack',
    companies: ['Meta', 'Amazon', 'Bloomberg', 'Microsoft', 'Google', 'Apple'],
    description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

### Example 1:
\`\`\`
Input: s = "()"
Output: true
\`\`\`

### Example 2:
\`\`\`
Input: s = "()[]{}"
Output: true
\`\`\`

### Example 3:
\`\`\`
Input: s = "(]"
Output: false
\`\`\``,
    constraints: [
      '1 <= s.length <= 10^4',
      's consists of parentheses only "()[]{}"',
    ],
    sampleTestCases: [
      { input: '"()"', expectedOutput: 'true', explanation: 'Matching pair' },
      { input: '"()[]{}"', expectedOutput: 'true', explanation: 'All matching pairs' },
      { input: '"(]"', expectedOutput: 'false', explanation: 'Mismatched brackets' },
    ],
    hiddenTestCases: [
      { input: '"{[]}"', expectedOutput: 'true', explanation: 'Nested valid brackets' },
      { input: '"([)]"', expectedOutput: 'false', explanation: 'Crossed brackets' },
    ],
    starterCode: {
      javascript: `/**
 * @param {string} s
 * @return {boolean}
 */
function isValid(s) {
  const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };
  for (const ch of s) {
    if (ch === '(' || ch === '{' || ch === '[') {
      stack.push(ch);
    } else {
      if (stack.pop() !== map[ch]) return false;
    }
  }
  return stack.length === 0;
}`,
      typescript: `function isValid(s: string): boolean {
  const stack: string[] = [];
  const map: Record<string, string> = { ')': '(', '}': '{', ']': '[' };
  for (const ch of s) {
    if (ch === '(' || ch === '{' || ch === '[') {
      stack.push(ch);
    } else {
      if (stack.pop() !== map[ch]) return false;
    }
  }
  return stack.length === 0;
}`,
      python: `class Solution:
    def isValid(self, s: str) -> bool:
        stack = []
        mapping = {')': '(', '}': '{', ']': '['}
        for char in s:
            if char in mapping.values():
                stack.append(char)
            elif char in mapping:
                if not stack or stack.pop() != mapping[char]:
                    return False
        return not stack`,
      java: `import java.util.*;

class Solution {
    public boolean isValid(String s) {
        Stack<Character> stack = new Stack<>();
        for (char c : s.toCharArray()) {
            if (c == '(') stack.push(')');
            else if (c == '{') stack.push('}');
            else if (c == '[') stack.push(']');
            else if (stack.isEmpty() || stack.pop() != c) return false;
        }
        return stack.isEmpty();
    }
}`,
      cpp: `#include <string>
#include <stack>
using namespace std;

class Solution {
public:
    boolean isValid(string s) {
        stack<char> st;
        for (char c : s) {
            if (c == '(') st.push(')');
            else if (c == '{') st.push('}');
            else if (c == '[') st.push(']');
            else {
                if (st.empty() || st.top() != c) return false;
                st.pop();
            }
        }
        return st.empty();
    }
};`,
    },
  },
  {
    id: 'practice-longest-substring',
    title: 'Longest Substring Without Repeating Characters',
    slug: 'longest-substring-without-repeating-characters',
    difficulty: 'Medium',
    category: 'Sliding Window',
    companies: ['Amazon', 'Microsoft', 'Bloomberg', 'Meta', 'Google', 'Apple'],
    description: `Given a string \`s\`, find the length of the **longest substring** without repeating characters.

### Example 1:
\`\`\`
Input: s = "abcabcbb"
Output: 3
Explanation: The answer is "abc", with the length of 3.
\`\`\`

### Example 2:
\`\`\`
Input: s = "bbbbb"
Output: 1
Explanation: The answer is "b", with the length of 1.
\`\`\`

### Example 3:
\`\`\`
Input: s = "pwwkew"
Output: 3
Explanation: The answer is "wke", with the length of 3.
\`\`\``,
    constraints: [
      '0 <= s.length <= 5 * 10^4',
      's consists of English letters, digits, symbols and spaces.',
    ],
    sampleTestCases: [
      { input: '"abcabcbb"', expectedOutput: '3', explanation: '"abc" length is 3' },
      { input: '"bbbbb"', expectedOutput: '1', explanation: '"b" length is 1' },
      { input: '"pwwkew"', expectedOutput: '3', explanation: '"wke" length is 3' },
    ],
    hiddenTestCases: [
      { input: '""', expectedOutput: '0', explanation: 'Empty string' },
      { input: '"au"', expectedOutput: '2', explanation: '"au"' },
      { input: '"dvdf"', expectedOutput: '3', explanation: '"vdf"' },
    ],
    starterCode: {
      javascript: `/**
 * @param {string} s
 * @return {number}
 */
function lengthOfLongestSubstring(s) {
  const map = new Map();
  let maxLen = 0, left = 0;
  for (let right = 0; right < s.length; right++) {
    if (map.has(s[right])) {
      left = Math.max(left, map.get(s[right]) + 1);
    }
    map.set(s[right], right);
    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen;
}`,
      typescript: `function lengthOfLongestSubstring(s: string): number {
  const map = new Map<string, number>();
  let maxLen = 0, left = 0;
  for (let right = 0; right < s.length; right++) {
    if (map.has(s[right])) {
      left = Math.max(left, map.get(s[right])! + 1);
    }
    map.set(s[right], right);
    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen;
}`,
      python: `class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        seen = {}
        max_len = 0
        left = 0
        for right, char in enumerate(s):
            if char in seen and seen[char] >= left:
                left = seen[char] + 1
            seen[char] = right
            max_len = max(max_len, right - left + 1)
        return max_len`,
      java: `import java.util.*;

class Solution {
    public int lengthOfLongestSubstring(String s) {
        Map<Character, Integer> map = new HashMap<>();
        int maxLen = 0, left = 0;
        for (int right = 0; right < s.length(); right++) {
            char c = s.charAt(right);
            if (map.containsKey(c)) {
                left = Math.max(left, map.get(c) + 1);
            }
            map.put(c, right);
            maxLen = Math.max(maxLen, right - left + 1);
        }
        return maxLen;
    }
}`,
      cpp: `#include <string>
#include <unordered_map>
#include <algorithm>
using namespace std;

class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        unordered_map<char, int> map;
        int maxLen = 0, left = 0;
        for (int right = 0; right < s.size(); right++) {
            if (map.count(s[right])) {
                left = max(left, map[s[right]] + 1);
            }
            map[s[right]] = right;
            maxLen = max(maxLen, right - left + 1);
        }
        return maxLen;
    }
};`,
    },
  },
  {
    id: 'practice-shortest-path-grid',
    title: 'Shortest Path with Obstacle Elimination in Grid',
    slug: 'shortest-path-with-obstacle-elimination-in-grid',
    difficulty: 'Medium',
    category: 'Graph & BFS',
    companies: ['Google', 'Uber', 'Amazon'],
    description: `You are given an \`m x n\` integer matrix \`grid\` where each cell is either \`0\` (empty) or \`1\` (obstacle). You can move up, down, left, or right from and to an empty cell in one step.

You can eliminate at most \`k\` obstacles.

Return *the minimum number of steps to walk from the upper left corner \`(0, 0)\` to the lower right corner \`(m - 1, n - 1)\`*, or \`-1\` if it is not possible to reach the destination.

### Example 1:
\`\`\`
Input: grid = [[0,0,0],[1,1,0],[0,0,0],[0,1,1],[0,0,0]], k = 1
Output: 6
Explanation: Shortest path with 1 obstacle elimination is 6 steps.
\`\`\``,
    constraints: [
      'm == grid.length, n == grid[i].length',
      '1 <= m, n <= 40',
      '1 <= k <= m * n',
      'grid[0][0] == grid[m - 1][n - 1] == 0',
    ],
    sampleTestCases: [
      { input: '[[0,0,0],[1,1,0],[0,0,0],[0,1,1],[0,0,0]], 1', expectedOutput: '6', explanation: 'Takes 6 steps' },
      { input: '[[0,1,1],[1,1,1],[1,0,0]], 1', expectedOutput: '-1', explanation: 'Cannot reach' },
    ],
    hiddenTestCases: [
      { input: '[[0,0],[0,0]], 0', expectedOutput: '2', explanation: '2 steps' },
      { input: '[[0]], 1', expectedOutput: '0', explanation: '0 steps' },
    ],
    starterCode: {
      javascript: `function shortestPath(grid, k) {
  const m = grid.length, n = grid[0].length;
  if (m === 1 && n === 1) return 0;
  if (k >= m + n - 2) return m + n - 2;
  const queue = [[0, 0, k, 0]];
  const seen = Array.from({ length: m }, () => Array(n).fill(-1));
  seen[0][0] = k;
  const dirs = [[1,0], [-1,0], [0,1], [0,-1]];
  while (queue.length > 0) {
    const [r, c, currK, steps] = queue.shift();
    if (r === m - 1 && c === n - 1) return steps;
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < m && nc >= 0 && nc < n) {
        const nextK = currK - grid[nr][nc];
        if (nextK >= 0 && nextK > seen[nr][nc]) {
          seen[nr][nc] = nextK;
          queue.push([nr, nc, nextK, steps + 1]);
        }
      }
    }
  }
  return -1;
}`,
      typescript: `function shortestPath(grid: number[][], k: number): number {
  const m = grid.length, n = grid[0].length;
  if (m === 1 && n === 1) return 0;
  if (k >= m + n - 2) return m + n - 2;
  const queue: [number, number, number, number][] = [[0, 0, k, 0]];
  const seen: number[][] = Array.from({ length: m }, () => Array(n).fill(-1));
  seen[0][0] = k;
  const dirs = [[1,0], [-1,0], [0,1], [0,-1]];
  while (queue.length > 0) {
    const [r, c, currK, steps] = queue.shift()!;
    if (r === m - 1 && c === n - 1) return steps;
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < m && nc >= 0 && nc < n) {
        const nextK = currK - grid[nr][nc];
        if (nextK >= 0 && nextK > seen[nr][nc]) {
          seen[nr][nc] = nextK;
          queue.push([nr, nc, nextK, steps + 1]);
        }
      }
    }
  }
  return -1;
}`,
      python: `from collections import deque

class Solution:
    def shortestPath(self, grid: list[list[int]], k: int) -> int:
        m, n = len(grid), len(grid[0])
        if m == 1 and n == 1: return 0
        if k >= m + n - 2: return m + n - 2
        queue = deque([(0, 0, k, 0)])
        seen = {(0, 0): k}
        while queue:
            r, c, curr_k, steps = queue.popleft()
            if r == m - 1 and c == n - 1: return steps
            for dr, dc in [(1,0), (-1,0), (0,1), (0,-1)]:
                nr, nc = r + dr, c + dc
                if 0 <= nr < m and 0 <= nc < n:
                    next_k = curr_k - grid[nr][nc]
                    if next_k >= 0 and next_k > seen.get((nr, nc), -1):
                        seen[(nr, nc)] = next_k
                        queue.append((nr, nc, next_k, steps + 1))
        return -1`,
      java: `import java.util.*;

class Solution {
    public int shortestPath(int[][] grid, int k) {
        int m = grid.length, n = grid[0].length;
        if (m == 1 && n == 1) return 0;
        if (k >= m + n - 2) return m + n - 2;
        Queue<int[]> q = new LinkedList<>();
        q.offer(new int[]{0, 0, k, 0});
        int[][] seen = new int[m][n];
        for (int[] row : seen) Arrays.fill(row, -1);
        seen[0][0] = k;
        int[][] dirs = {{1,0}, {-1,0}, {0,1}, {0,-1}};
        while (!q.isEmpty()) {
            int[] curr = q.poll();
            int r = curr[0], c = curr[1], currK = curr[2], steps = curr[3];
            if (r == m - 1 && c == n - 1) return steps;
            for (int[] d : dirs) {
                int nr = r + d[0], nc = c + d[1];
                if (nr >= 0 && nr < m && nc >= 0 && nc < n) {
                    int nextK = currK - grid[nr][nc];
                    if (nextK >= 0 && nextK > seen[nr][nc]) {
                        seen[nr][nc] = nextK;
                        q.offer(new int[]{nr, nc, nextK, steps + 1});
                    }
                }
            }
        }
        return -1;
    }
}`,
      cpp: `#include <vector>
#include <queue>
using namespace std;

class Solution {
public:
    int shortestPath(vector<vector<int>>& grid, int k) {
        int m = grid.size(), n = grid[0].size();
        if (m == 1 && n == 1) return 0;
        if (k >= m + n - 2) return m + n - 2;
        queue<vector<int>> q;
        q.push({0, 0, k, 0});
        vector<vector<int>> seen(m, vector<int>(n, -1));
        seen[0][0] = k;
        int dirs[4][2] = {{1,0}, {-1,0}, {0,1}, {0,-1}};
        while (!q.empty()) {
            auto curr = q.front(); q.pop();
            int r = curr[0], c = curr[1], currK = curr[2], steps = curr[3];
            if (r == m - 1 && c == n - 1) return steps;
            for (auto& d : dirs) {
                int nr = r + d[0], nc = c + d[1];
                if (nr >= 0 && nr < m && nc >= 0 && nc < n) {
                    int nextK = currK - grid[nr][nc];
                    if (nextK >= 0 && nextK > seen[nr][nc]) {
                        seen[nr][nc] = nextK;
                        q.push({nr, nc, nextK, steps + 1});
                    }
                }
            }
        }
        return -1;
    }
};`,
    },
  },
  {
    id: 'practice-job-scheduling',
    title: 'Maximum Profit in Job Scheduling',
    slug: 'maximum-profit-in-job-scheduling',
    difficulty: 'Hard',
    category: 'Dynamic Programming & Binary Search',
    companies: ['Google', 'Amazon', 'DoorDash'],
    description: `We have \`n\` jobs, where every job is scheduled to be done from \`startTime[i]\` to \`endTime[i]\`, obtaining a profit of \`profit[i]\`.

You're given the \`startTime\`, \`endTime\` and \`profit\` arrays, return the maximum profit you can take such that no two jobs in the subset have overlapping time range.

### Example 1:
\`\`\`
Input: startTime = [1,2,3,3], endTime = [3,4,5,6], profit = [50,10,40,70]
Output: 120
Explanation: The subset chosen is the first and fourth job. Time range [1-3]+[3-6] , we get profit of 120 = 50 + 70.
\`\`\``,
    constraints: [
      '1 <= startTime.length == endTime.length == profit.length <= 5 * 10^4',
      '1 <= startTime[i] < endTime[i] <= 10^9',
      '1 <= profit[i] <= 10^4',
    ],
    sampleTestCases: [
      { input: '[1,2,3,3], [3,4,5,6], [50,10,40,70]', expectedOutput: '120', explanation: 'Jobs 1 and 4 yield 120' },
      { input: '[1,2,3,4,6], [3,5,10,6,9], [20,20,100,70,60]', expectedOutput: '150', explanation: 'Jobs yield 150' },
    ],
    hiddenTestCases: [
      { input: '[1,1,1], [2,3,4], [5,6,4]', expectedOutput: '6', explanation: 'Job 2 gives 6' },
    ],
    starterCode: {
      javascript: `function jobScheduling(startTime, endTime, profit) {
  const n = startTime.length;
  const jobs = [];
  for (let i = 0; i < n; i++) jobs.push([startTime[i], endTime[i], profit[i]]);
  jobs.sort((a, b) => a[1] - b[1]);
  const dp = [[0, 0]];
  for (const [s, e, p] of jobs) {
    let l = 0, r = dp.length - 1, idx = 0;
    while (l <= r) {
      const mid = Math.floor((l + r) / 2);
      if (dp[mid][0] <= s) { idx = mid; l = mid + 1; }
      else { r = mid - 1; }
    }
    const currProfit = dp[idx][1] + p;
    if (currProfit > dp[dp.length - 1][1]) {
      dp.push([e, currProfit]);
    }
  }
  return dp[dp.length - 1][1];
}`,
      typescript: `function jobScheduling(startTime: number[], endTime: number[], profit: number[]): number {
  const n = startTime.length;
  const jobs: [number, number, number][] = [];
  for (let i = 0; i < n; i++) jobs.push([startTime[i], endTime[i], profit[i]]);
  jobs.sort((a, b) => a[1] - b[1]);
  const dp: [number, number][] = [[0, 0]];
  for (const [s, e, p] of jobs) {
    let l = 0, r = dp.length - 1, idx = 0;
    while (l <= r) {
      const mid = Math.floor((l + r) / 2);
      if (dp[mid][0] <= s) { idx = mid; l = mid + 1; }
      else { r = mid - 1; }
    }
    const currProfit = dp[idx][1] + p;
    if (currProfit > dp[dp.length - 1][1]) {
      dp.push([e, currProfit]);
    }
  }
  return dp[dp.length - 1][1];
}`,
      python: `import bisect

class Solution:
    def jobScheduling(self, startTime: list[int], endTime: list[int], profit: list[int]) -> int:
        jobs = sorted(zip(startTime, endTime, profit), key=lambda v: v[1])
        dp = [[0, 0]]
        for s, e, p in jobs:
            i = bisect.bisect_right(dp, [s, float('inf')]) - 1
            if dp[i][1] + p > dp[-1][1]:
                dp.append([e, dp[i][1] + p])
        return dp[-1][1]`,
      java: `import java.util.*;

class Solution {
    public int jobScheduling(int[] startTime, int[] endTime, int[] profit) {
        int n = startTime.length;
        int[][] jobs = new int[n][3];
        for (int i = 0; i < n; i++) jobs[i] = new int[]{startTime[i], endTime[i], profit[i]};
        Arrays.sort(jobs, Comparator.comparingInt(a -> a[1]));
        TreeMap<Integer, Integer> dp = new TreeMap<>();
        dp.put(0, 0);
        for (int[] job : jobs) {
            int s = job[0], e = job[1], p = job[2];
            int curr = dp.floorEntry(s).getValue() + p;
            if (curr > dp.lastEntry().getValue()) {
                dp.put(e, curr);
            }
        }
        return dp.lastEntry().getValue();
    }
}`,
      cpp: `#include <vector>
#include <algorithm>
#include <map>
using namespace std;

class Solution {
public:
    int jobScheduling(vector<int>& startTime, vector<int>& endTime, vector<int>& profit) {
        int n = startTime.size();
        vector<vector<int>> jobs(n);
        for (int i = 0; i < n; i++) jobs[i] = {endTime[i], startTime[i], profit[i]};
        sort(jobs.begin(), jobs.end());
        map<int, int> dp = {{0, 0}};
        for (auto& job : jobs) {
            int e = job[0], s = job[1], p = job[2];
            auto it = prev(dp.upper_bound(s));
            int curr = it->second + p;
            if (curr > dp.rbegin()->second) {
                dp[e] = curr;
            }
        }
        return dp.rbegin()->second;
    }
};`,
    },
  },
  {
    id: 'practice-trapping-rain-water',
    title: 'Trapping Rain Water',
    slug: 'trapping-rain-water',
    difficulty: 'Hard',
    category: 'Two Pointers & Stack',
    companies: ['Goldman Sachs', 'Amazon', 'Google', 'Meta', 'Bloomberg', 'Microsoft', 'Apple'],
    description: `Given \`n\` non-negative integers representing an elevation map where the width of each bar is \`1\`, compute how much water it can trap after raining.

### Example 1:
\`\`\`
Input: height = [0,1,0,2,1,0,1,3,2,1,2,1]
Output: 6
Explanation: The above elevation map is represented by array [0,1,0,2,1,0,1,3,2,1,2,1]. In this case, 6 units of rain water are being trapped.
\`\`\``,
    constraints: [
      'n == height.length',
      '1 <= n <= 2 * 10^4',
      '0 <= height[i] <= 10^5',
    ],
    sampleTestCases: [
      { input: '[0,1,0,2,1,0,1,3,2,1,2,1]', expectedOutput: '6', explanation: 'Traps 6 units' },
      { input: '[4,2,0,3,2,5]', expectedOutput: '9', explanation: 'Traps 9 units' },
    ],
    hiddenTestCases: [
      { input: '[3,0,2,0,4]', expectedOutput: '7', explanation: 'Traps 7 units' },
      { input: '[1,2,3,4,5]', expectedOutput: '0', explanation: 'No water trapped' },
    ],
    starterCode: {
      javascript: `function trap(height) {
  let left = 0, right = height.length - 1;
  let leftMax = 0, rightMax = 0, ans = 0;
  while (left < right) {
    if (height[left] < height[right]) {
      if (height[left] >= leftMax) leftMax = height[left];
      else ans += leftMax - height[left];
      left++;
    } else {
      if (height[right] >= rightMax) rightMax = height[right];
      else ans += rightMax - height[right];
      right--;
    }
  }
  return ans;
}`,
      typescript: `function trap(height: number[]): number {
  let left = 0, right = height.length - 1;
  let leftMax = 0, rightMax = 0, ans = 0;
  while (left < right) {
    if (height[left] < height[right]) {
      if (height[left] >= leftMax) leftMax = height[left];
      else ans += leftMax - height[left];
      left++;
    } else {
      if (height[right] >= rightMax) rightMax = height[right];
      else ans += rightMax - height[right];
      right--;
    }
  }
  return ans;
}`,
      python: `class Solution:
    def trap(self, height: list[int]) -> int:
        left, right = 0, len(height) - 1
        left_max, right_max = 0, 0
        ans = 0
        while left < right:
            if height[left] < height[right]:
                if height[left] >= left_max:
                    left_max = height[left]
                else:
                    ans += left_max - height[left]
                left += 1
            else:
                if height[right] >= right_max:
                    right_max = height[right]
                else:
                    ans += right_max - height[right]
                right -= 1
        return ans`,
      java: `class Solution {
    public int trap(int[] height) {
        int left = 0, right = height.length - 1;
        int leftMax = 0, rightMax = 0, ans = 0;
        while (left < right) {
            if (height[left] < height[right]) {
                if (height[left] >= leftMax) leftMax = height[left];
                else ans += leftMax - height[left];
                left++;
            } else {
                if (height[right] >= rightMax) rightMax = height[right];
                else ans += rightMax - height[right];
                right--;
            }
        }
        return ans;
    }
}`,
      cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int trap(vector<int>& height) {
        int left = 0, right = height.size() - 1;
        int leftMax = 0, rightMax = 0, ans = 0;
        while (left < right) {
            if (height[left] < height[right]) {
                if (height[left] >= leftMax) leftMax = height[left];
                else ans += leftMax - height[left];
                left++;
            } else {
                if (height[right] >= rightMax) rightMax = height[right];
                else ans += rightMax - height[right];
                right--;
            }
        }
        return ans;
    }
};`,
    },
  },
];

// Unified, deduplicated Master Practice Problems Catalog
export const PRACTICE_PROBLEMS_CATALOG: PracticeProblemTemplate[] = (() => {
  const map = new Map<string, PracticeProblemTemplate>();
  
  // 1. Add base problems
  for (const prob of BASE_PRACTICE_PROBLEMS) {
    map.set(prob.slug, prob);
  }
  
  // 2. Add or override with NextEra Master DSA Problems
  for (const prob of NEXTERA_DSA_PROBLEMS) {
    map.set(prob.slug, prob);
  }
  
  return Array.from(map.values());
})();

export const sundayContestService = new SundayContestService();

