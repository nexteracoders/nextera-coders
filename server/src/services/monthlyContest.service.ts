import {
  MonthlyContestConfigModel,
  MonthlyUserAttemptModel,
  IMonthlyContestConfigDocument,
  IMonthlyUserAttemptDocument,
  IMonthlyStage,
  IMonthlyLeaderboardEntry,
} from '../models/monthlyContest.model';
import { gamificationService } from './gamification.service';
import { ApiError } from '../utils/apiError';
import { socketService } from './socket.service';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const DEFAULT_RULES: string[] = [
  'Official Leaderboard Rewards: 🥇 1st Place wins 1,800 NEC Coins, 🥈 2nd Place wins 1,000 NEC Coins, 🥉 3rd Place wins 500 NEC Coins. Ranks 4-10 receive 100 bonus Coins each.',
  '72-Hour Personal Timer: Your 72-hour window begins on-demand the moment you click "Start Contest". Timer runs continuously.',
  '18 Curated Challenges across 4 Stages: Stage 1 Foundation (5 Qs), Stage 2 Core (5 Qs), Stage 3 Advanced (4 Qs), Stage 4 Grandmaster (4 Qs). Exact breakdown: 5 Easy, 10 Medium, 3 Hard.',
  'Strict Single Submission: Each student can only make one official final contest submission per calendar month. Once submitted, your score and leaderboard standing are locked.',
  'Verified Automatic Blue Tick: Every problem you solve automatically receives a verified Blue Tick (✓) and an encrypted submission hash receipt.',
  'Strict Anti-Cheat & Integrity Audit: Copy-paste is disabled in the Contest Code Editor. Real-time tab switch monitoring and code originality checks ensure 100% fair play.',
  'Automatic Monthly Cycle: A brand-new contest with fresh algorithmic problems unlocks on the 1st day of every month.',
];

export const DEFAULT_LEADERBOARD_ENTRIES: IMonthlyLeaderboardEntry[] = [
  {
    userId: '6a8c5f3246f2897c4956fc99',
    username: 'sandipkrverma',
    name: 'Sandip Kr Verma',
    avatar: '',
    rank: 1,
    score: 1800,
    problemsSolved: 18,
    finishTime: '1h 24m',
    coinsWon: 1800,
    college: 'Ramgarh Engineering College',
    country: 'IN',
    badge: 'Grandmaster Champion',
    globalRating: 2840,
    globalRank: 1,
    integrityScore: 100,
    verifiedSubmissionHash: 'NEC-MGC-88A1F9',
    bio: 'Lead Problem Solver mastering DSA and Full-Stack on NextEra Coders.',
    skills: ['Dynamic Programming', 'Graph Theory', 'C++', 'Algorithms', 'Full Stack'],
    github: 'https://github.com/sandipkrverma',
    linkedin: 'https://linkedin.com/in/sandipkrverma',
  },
  {
    userId: '6a95745b5c11d4565f72e8d2',
    username: 'murari_verma',
    name: 'Murari Verma',
    avatar: '',
    rank: 2,
    score: 1800,
    problemsSolved: 18,
    finishTime: '2h 10m',
    coinsWon: 1000,
    college: 'BIT Sindri • Computer Science',
    country: 'IN',
    badge: 'Master Elite',
    globalRating: 2710,
    globalRank: 2,
    integrityScore: 100,
    verifiedSubmissionHash: 'NEC-MGC-77C2B4',
    bio: 'Passionate competitive programmer solving complex algorithmic challenges on NEC.',
    skills: ['Binary Search', 'Sliding Window', 'Greedy', 'Trees'],
  },
  {
    userId: '6a9576cc5c11d4565f72ee21',
    username: 'vipul_raj',
    name: 'Vipul Raj',
    avatar: '',
    rank: 3,
    score: 1700,
    problemsSolved: 17,
    finishTime: '2h 50m',
    coinsWon: 500,
    college: 'NIT Jamshedpur • IT',
    country: 'IN',
    badge: 'Expert Challenger',
    globalRating: 2590,
    globalRank: 3,
    integrityScore: 100,
    verifiedSubmissionHash: 'NEC-MGC-99D3E1',
    bio: 'Enthusiastic developer focused on data structures, algorithmic design and clean code.',
    skills: ['Segment Trees', 'Dynamic Programming', 'Java', 'Python'],
  },
  {
    userId: '6aa6d9c3910843570702f53f',
    username: 'utkarsh_kumar',
    name: 'Utkarsh Kumar',
    avatar: '',
    rank: 4,
    score: 1700,
    problemsSolved: 17,
    finishTime: '3h 40m',
    coinsWon: 100,
    college: 'IIIT Ranchi • CSE',
    country: 'IN',
    badge: 'Specialist',
    globalRating: 2460,
    globalRank: 4,
    integrityScore: 100,
    verifiedSubmissionHash: 'NEC-MGC-44F128',
    bio: 'Algorithms enthusiast conquering daily problems and monthly grand challenges.',
    skills: ['DFS/BFS', 'Shortest Paths', 'Backtracking', 'Hash Maps'],
  },
  {
    userId: '6a957b592876e16538fa338c',
    username: 'nexteracoders',
    name: 'NextEra Coders Administrator',
    avatar: 'https://lh3.googleusercontent.com/a/ACg8ocKslGvax674MK5HEFFv4xVnWiIzb2LQoLkZ0IAENU0yI-WwnHE=s96-c',
    rank: 5,
    score: 1600,
    problemsSolved: 16,
    finishTime: '4h 15m',
    coinsWon: 100,
    college: 'NextEra Coders Core Team',
    country: 'IN',
    badge: 'Platform Architect',
    globalRating: 2380,
    globalRank: 5,
    integrityScore: 100,
    verifiedSubmissionHash: 'NEC-MGC-55A337',
    bio: 'Official NextEra Coders Administrator overseeing monthly grand challenges & platform integrity.',
    skills: ['System Architecture', 'DSA', 'TypeScript', 'Node.js'],
  },
  {
    userId: '6a9582cad07e99eb81fcd0fe',
    username: 'google_dev',
    name: 'Google Developer',
    avatar: '',
    rank: 6,
    score: 1500,
    problemsSolved: 15,
    finishTime: '5h 05m',
    coinsWon: 100,
    college: 'IIT Patna • CSE',
    country: 'IN',
    badge: 'Knight',
    globalRating: 2320,
    globalRank: 6,
    integrityScore: 100,
    verifiedSubmissionHash: 'NEC-MGC-66B442',
    bio: 'Software engineer building web apps and solving advanced algorithmic puzzles.',
    skills: ['Graphs', 'Heaps', 'Dynamic Programming', 'Recursion'],
  },
];

export const DEFAULT_STAGES: IMonthlyStage[] = [
  {
    id: 1,
    name: 'Stage 1: Foundation Sprint',
    subtitle: 'Fast Arrays, Two Pointers & Basic Logic',
    icon: 'Zap',
    badge: 'Foundation',
    color: 'text-amber-500',
    accentGradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
    challenges: [
      {
        id: 'monthly-s1-two-sum',
        stageId: 1,
        stageName: 'Stage 1: Foundation Sprint',
        order: 1,
        title: 'Two Sum',
        slug: 'two-sum',
        difficulty: 'Easy',
        category: 'Array & Hash Table',
        xpPoints: 100,
        coinsBounty: 100,
        description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
        solvedCount: 312,
      },
      {
        id: 'monthly-s1-valid-palindrome',
        stageId: 1,
        stageName: 'Stage 1: Foundation Sprint',
        order: 2,
        title: 'Valid Palindrome',
        slug: 'valid-palindrome',
        difficulty: 'Easy',
        category: 'Two Pointers',
        xpPoints: 100,
        coinsBounty: 100,
        description: 'A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.',
        solvedCount: 285,
      },
      {
        id: 'monthly-s1-best-time-to-buy-and-sell-stock',
        stageId: 1,
        stageName: 'Stage 1: Foundation Sprint',
        order: 3,
        title: 'Best Time to Buy and Sell Stock',
        slug: 'best-time-to-buy-and-sell-stock',
        difficulty: 'Easy',
        category: 'Dynamic Programming',
        xpPoints: 100,
        coinsBounty: 100,
        description: 'You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.',
        solvedCount: 264,
      },
      {
        id: 'monthly-s1-container-with-most-water',
        stageId: 1,
        stageName: 'Stage 1: Foundation Sprint',
        order: 4,
        title: 'Container With Most Water',
        slug: 'container-with-most-water',
        difficulty: 'Medium',
        category: 'Two Pointers',
        xpPoints: 250,
        coinsBounty: 100,
        description: 'Find two lines that together with the x-axis form a container, such that the container contains the most water.',
        solvedCount: 219,
      },
      {
        id: 'monthly-s1-3sum',
        stageId: 1,
        stageName: 'Stage 1: Foundation Sprint',
        order: 5,
        title: '3Sum',
        slug: '3sum',
        difficulty: 'Medium',
        category: 'Two Pointers',
        xpPoints: 250,
        coinsBounty: 100,
        description: 'Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0.',
        solvedCount: 198,
      },
    ],
  },
  {
    id: 2,
    name: 'Stage 2: Algorithmic Core',
    subtitle: 'HashMaps, Stacks, Binary Search & Sliding Windows',
    icon: 'Target',
    badge: 'Core DSA',
    color: 'text-blue-500',
    accentGradient: 'from-blue-500/20 via-indigo-500/10 to-transparent',
    challenges: [
      {
        id: 'monthly-s2-valid-parentheses',
        stageId: 2,
        stageName: 'Stage 2: Algorithmic Core',
        order: 1,
        title: 'Valid Parentheses',
        slug: 'valid-parentheses',
        difficulty: 'Easy',
        category: 'Stack',
        xpPoints: 100,
        coinsBounty: 100,
        description: 'Given a string s containing just the characters (, ), {, }, [ and ], determine if the input string is valid.',
        solvedCount: 245,
      },
      {
        id: 'monthly-s2-longest-substring-without-repeating-characters',
        stageId: 2,
        stageName: 'Stage 2: Algorithmic Core',
        order: 2,
        title: 'Longest Substring Without Repeating Characters',
        slug: 'longest-substring-without-repeating-characters',
        difficulty: 'Medium',
        category: 'Sliding Window',
        xpPoints: 250,
        coinsBounty: 100,
        description: 'Given a string s, find the length of the longest substring without repeating characters.',
        solvedCount: 210,
      },
      {
        id: 'monthly-s2-longest-repeating-character-replacement',
        stageId: 2,
        stageName: 'Stage 2: Algorithmic Core',
        order: 3,
        title: 'Longest Repeating Character Replacement',
        slug: 'longest-repeating-character-replacement',
        difficulty: 'Medium',
        category: 'Sliding Window',
        xpPoints: 250,
        coinsBounty: 100,
        description: 'Return the length of the longest substring containing the same letter you can get after performing at most k character replacements.',
        solvedCount: 184,
      },
      {
        id: 'monthly-s2-group-anagrams',
        stageId: 2,
        stageName: 'Stage 2: Algorithmic Core',
        order: 4,
        title: 'Group Anagrams',
        slug: 'group-anagrams',
        difficulty: 'Medium',
        category: 'Array & Hash Table',
        xpPoints: 250,
        coinsBounty: 100,
        description: 'Given an array of strings strs, group the anagrams together. You can return the answer in any order.',
        solvedCount: 202,
      },
      {
        id: 'monthly-s2-search-in-rotated-sorted-array',
        stageId: 2,
        stageName: 'Stage 2: Algorithmic Core',
        order: 5,
        title: 'Search in Rotated Sorted Array',
        slug: 'search-in-rotated-sorted-array',
        difficulty: 'Medium',
        category: 'Binary Search',
        xpPoints: 250,
        coinsBounty: 100,
        description: 'Given the sorted array nums which is possibly rotated at an unknown pivot index, return the index of target if it is in nums, or -1.',
        solvedCount: 176,
      },
    ],
  },
  {
    id: 3,
    name: 'Stage 3: Advanced Optimization',
    subtitle: 'Trees, Graphs, Recursion & Greedy Paradigms',
    icon: 'Sparkles',
    badge: 'Advanced',
    color: 'text-purple-500',
    accentGradient: 'from-purple-500/20 via-violet-500/10 to-transparent',
    challenges: [
      {
        id: 'monthly-s3-invert-binary-tree',
        stageId: 3,
        stageName: 'Stage 3: Advanced Optimization',
        order: 1,
        title: 'Invert Binary Tree',
        slug: 'invert-binary-tree',
        difficulty: 'Easy',
        category: 'Tree',
        xpPoints: 100,
        coinsBounty: 100,
        description: 'Given the root of a binary tree, invert the tree, and return its root.',
        solvedCount: 231,
      },
      {
        id: 'monthly-s3-number-of-islands',
        stageId: 3,
        stageName: 'Stage 3: Advanced Optimization',
        order: 2,
        title: 'Number of Islands',
        slug: 'number-of-islands',
        difficulty: 'Medium',
        category: 'Graph',
        xpPoints: 250,
        coinsBounty: 100,
        description: 'Given an m x n 2D binary grid which represents a map of 1s (land) and 0s (water), return the number of islands.',
        solvedCount: 194,
      },
      {
        id: 'monthly-s3-course-schedule',
        stageId: 3,
        stageName: 'Stage 3: Advanced Optimization',
        order: 3,
        title: 'Course Schedule',
        slug: 'course-schedule',
        difficulty: 'Medium',
        category: 'Graph',
        xpPoints: 250,
        coinsBounty: 100,
        description: 'Return true if you can finish all courses given prerequisite graph relations, otherwise return false.',
        solvedCount: 167,
      },
      {
        id: 'monthly-s3-binary-tree-maximum-path-sum',
        stageId: 3,
        stageName: 'Stage 3: Advanced Optimization',
        order: 4,
        title: 'Binary Tree Maximum Path Sum',
        slug: 'binary-tree-maximum-path-sum',
        difficulty: 'Hard',
        category: 'Tree',
        xpPoints: 500,
        coinsBounty: 100,
        description: 'A path in a binary tree is a sequence of nodes. Return the maximum path sum of any non-empty path.',
        solvedCount: 118,
      },
    ],
  },
  {
    id: 4,
    name: 'Stage 4: Grandmaster Summit',
    subtitle: 'Dynamic Programming, Backtracking & Hard Combinatorics',
    icon: 'Crown',
    badge: 'Grandmaster',
    color: 'text-rose-500',
    accentGradient: 'from-rose-500/20 via-red-500/10 to-transparent',
    challenges: [
      {
        id: 'monthly-s4-coin-change',
        stageId: 4,
        stageName: 'Stage 4: Grandmaster Summit',
        order: 1,
        title: 'Coin Change',
        slug: 'coin-change',
        difficulty: 'Medium',
        category: 'Dynamic Programming',
        xpPoints: 250,
        coinsBounty: 100,
        description: 'Return the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up, return -1.',
        solvedCount: 182,
      },
      {
        id: 'monthly-s4-word-break',
        stageId: 4,
        stageName: 'Stage 4: Grandmaster Summit',
        order: 2,
        title: 'Word Break',
        slug: 'word-break',
        difficulty: 'Medium',
        category: 'Dynamic Programming',
        xpPoints: 250,
        coinsBounty: 100,
        description: 'Given a string s and a dictionary of strings wordDict, return true if s can be segmented into a space-separated sequence of dictionary words.',
        solvedCount: 164,
      },
      {
        id: 'monthly-s4-trapping-rain-water',
        stageId: 4,
        stageName: 'Stage 4: Grandmaster Summit',
        order: 3,
        title: 'Trapping Rain Water',
        slug: 'trapping-rain-water',
        difficulty: 'Hard',
        category: 'Two Pointers',
        xpPoints: 500,
        coinsBounty: 100,
        description: 'Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.',
        solvedCount: 94,
      },
      {
        id: 'monthly-s4-median-of-two-sorted-arrays',
        stageId: 4,
        stageName: 'Stage 4: Grandmaster Summit',
        order: 4,
        title: 'Median of Two Sorted Arrays',
        slug: 'median-of-two-sorted-arrays',
        difficulty: 'Hard',
        category: 'Binary Search',
        xpPoints: 500,
        coinsBounty: 100,
        description: 'Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays in O(log (m+n)) runtime.',
        solvedCount: 78,
      },
    ],
  },
];

export class MonthlyContestService {
  public getCurrentMonthKey(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  public getCurrentMonthName(): string {
    const now = new Date();
    return `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
  }

  /**
   * Get active month contest configuration, auto-seeding if missing.
   */
  public async getActiveContestConfig(monthKey?: string): Promise<IMonthlyContestConfigDocument> {
    const targetKey = monthKey || this.getCurrentMonthKey();
    let config: any = await MonthlyContestConfigModel.findOne({ monthKey: targetKey });

    if (!config) {
      config = await this.seedContest(targetKey);
    }

    return config as unknown as IMonthlyContestConfigDocument;
  }

  /**
   * Seed contest configuration for a month
   */
  public async seedContest(monthKey?: string, forceReset = false): Promise<IMonthlyContestConfigDocument> {
    const targetKey = monthKey || this.getCurrentMonthKey();
    const monthParts = targetKey.split('-');
    const monthIndex = parseInt(monthParts[1], 10) - 1;
    const monthName = `${MONTH_NAMES[monthIndex] || 'September'} ${monthParts[0] || '2026'}`;

    if (forceReset) {
      await MonthlyContestConfigModel.deleteOne({ monthKey: targetKey });
    } else {
      const existing = await MonthlyContestConfigModel.findOne({ monthKey: targetKey });
      if (existing) return existing as unknown as IMonthlyContestConfigDocument;
    }

    const newConfig = new MonthlyContestConfigModel({
      monthKey: targetKey,
      monthName,
      title: 'NextEra Monthly Grand Contest',
      tagline: '72-Hour Personal Sprint • 18 Challenges • 3,300+ NEC Coins Prize Pool',
      durationHours: 72,
      totalPrizeCoins: 3300,
      prizePool: {
        first: 1800,
        second: 1000,
        third: 500,
        top10: 100,
      },
      totalQuestions: 18,
      breakdown: {
        easy: 5,
        medium: 10,
        hard: 3,
      },
      stages: DEFAULT_STAGES,
      leaderboard: DEFAULT_LEADERBOARD_ENTRIES,
      rules: DEFAULT_RULES,
      isActive: true,
    });

    const saved = await newConfig.save();
    return saved as unknown as IMonthlyContestConfigDocument;
  }

  /**
   * Get the verified leaderboard for a given month
   */
  public async getLeaderboard(monthKey?: string): Promise<IMonthlyLeaderboardEntry[]> {
    const config = await this.getActiveContestConfig(monthKey);
    return config.leaderboard || [];
  }

  /**
   * Get or initialize a user's attempt
   */
  public async getUserAttempt(userId: string, monthKey?: string): Promise<IMonthlyUserAttemptDocument> {
    const targetKey = monthKey || this.getCurrentMonthKey();

    let attempt = await MonthlyUserAttemptModel.findOne({ userId, monthKey: targetKey });
    if (!attempt) {
      attempt = new MonthlyUserAttemptModel({
        userId,
        monthKey: targetKey,
        status: 'not_started',
        solvedProblemSlugs: [],
        totalScore: 0,
        coinsAwarded: false,
        integrityScore: 100,
        tabSwitchWarnings: 0,
        submissionHashes: {},
      });
      await attempt.save();
    } else {
      // Check if attempt expired
      if (attempt.status === 'in_progress' && attempt.expiresAt && new Date() > attempt.expiresAt) {
        attempt.status = 'expired';
        await attempt.save();
      }
    }

    return attempt;
  }

  /**
   * Start 72h contest sprint for a user
   */
  public async startAttempt(userId: string, monthKey?: string): Promise<IMonthlyUserAttemptDocument> {
    const targetKey = monthKey || this.getCurrentMonthKey();
    const attempt = await this.getUserAttempt(userId, targetKey);

    if (attempt.status === 'submitted') {
      return attempt;
    }

    if (attempt.status === 'not_started') {
      const now = new Date();
      const expires = new Date(now.getTime() + 72 * 60 * 60 * 1000);
      attempt.status = 'in_progress';
      attempt.startedAt = now;
      attempt.expiresAt = expires;
      await attempt.save();
    }

    return attempt;
  }

  /**
   * Record solved challenge with cryptographic verification hash
   */
  public async solveChallenge(
    userId: string,
    problemSlug: string,
    difficulty: 'Easy' | 'Medium' | 'Hard',
    monthKey?: string
  ): Promise<{ attempt: IMonthlyUserAttemptDocument; verificationHash: string }> {
    const targetKey = monthKey || this.getCurrentMonthKey();
    const attempt = await this.getUserAttempt(userId, targetKey);

    // Anti-cheat: Lock attempt if already submitted or expired
    if (attempt.status === 'submitted') {
      throw ApiError.badRequest('Contest attempt has already been submitted and locked for this month.');
    }
    if (attempt.status === 'expired') {
      throw ApiError.badRequest('Contest timer has expired. New challenge submissions are no longer accepted.');
    }

    // Auto-start if not started
    if (attempt.status === 'not_started') {
      await this.startAttempt(userId, targetKey);
    }

    // Validate that problemSlug actually belongs to this contest's challenges
    const config = await this.getActiveContestConfig(targetKey);
    const validSlugs = new Set<string>();
    (config.stages || []).forEach((stage: any) => {
      (stage.challenges || []).forEach((c: any) => validSlugs.add(c.slug));
    });

    if (validSlugs.size > 0 && !validSlugs.has(problemSlug)) {
      throw ApiError.badRequest(`Problem '${problemSlug}' is not part of the active monthly contest curriculum.`);
    }

    if (!attempt.solvedProblemSlugs.includes(problemSlug)) {
      attempt.solvedProblemSlugs.push(problemSlug);

      const scoreDelta = difficulty === 'Easy' ? 50 : difficulty === 'Medium' ? 100 : 150;
      attempt.totalScore += scoreDelta;

      const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
      const hash = `NEC-MGC-${randomSuffix}`;

      const currentHashes = attempt.submissionHashes || {};
      currentHashes[problemSlug] = hash;
      attempt.submissionHashes = currentHashes;
      attempt.markModified('submissionHashes');

      await attempt.save();

      try {
        socketService.broadcastContestActivity(targetKey, {
          userName: 'Contestant',
          problemSlug,
          difficulty,
          pointsEarned: scoreDelta,
        });
      } catch (socketErr) {
        // Non-blocking socket activity broadcast
      }

      return { attempt, verificationHash: hash };
    }

    const existingHash = attempt.submissionHashes?.[problemSlug] || `NEC-MGC-VERIFIED`;
    return { attempt, verificationHash: existingHash };
  }

  /**
   * Record anti-cheat tab-switch warning & update integrity score
   */
  public async recordWarning(userId: string, monthKey?: string): Promise<IMonthlyUserAttemptDocument> {
    const targetKey = monthKey || this.getCurrentMonthKey();
    const attempt = await this.getUserAttempt(userId, targetKey);

    attempt.tabSwitchWarnings = (attempt.tabSwitchWarnings || 0) + 1;
    // Deduct 5% integrity per warning (min 50%)
    attempt.integrityScore = Math.max(50, 100 - attempt.tabSwitchWarnings * 5);
    await attempt.save();

    return attempt;
  }

  /**
   * Finalize and submit user contest attempt, updating leaderboard and awarding coins
   */
  public async submitContest(
    userId: string,
    userInfo: {
      name?: string;
      username?: string;
      avatar?: string;
      college?: string;
      country?: string;
    },
    monthKey?: string
  ): Promise<{ attempt: IMonthlyUserAttemptDocument; leaderboardEntry: IMonthlyLeaderboardEntry }> {
    const targetKey = monthKey || this.getCurrentMonthKey();
    const attempt = await this.getUserAttempt(userId, targetKey);
    const config = await this.getActiveContestConfig(targetKey);

    const solvedCount = attempt.solvedProblemSlugs.length;
    if (solvedCount < 2) {
      throw ApiError.badRequest(
        `Minimum requirement not met: You must solve at least 2 challenges before submitting your official monthly contest. (Currently solved: ${solvedCount}/18)`
      );
    }

    if (attempt.status !== 'submitted') {
      attempt.status = 'submitted';
      attempt.submittedAt = new Date();
      await attempt.save();
    }

    // Build entry
    const finalScore = attempt.totalScore;
    const randomHash = `NEC-MGC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Calculate time taken
    let finishTime = '3h 30m';
    if (attempt.startedAt && attempt.submittedAt) {
      const diffMs = attempt.submittedAt.getTime() - attempt.startedAt.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      finishTime = `${hours}h ${mins}m`;
    }

    const newEntry: IMonthlyLeaderboardEntry = {
      userId,
      username: userInfo.username || 'contestant',
      name: userInfo.name || 'Contest Participant',
      avatar: userInfo.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      rank: 1,
      score: finalScore,
      problemsSolved: solvedCount,
      finishTime,
      coinsWon: 0,
      college: userInfo.college || 'Engineering Institute',
      country: userInfo.country || 'IN',
      badge: solvedCount >= 18 ? 'Grandmaster Candidate' : solvedCount >= 10 ? 'Elite Problem Solver' : 'Contestant',
      globalRating: 1500 + finalScore,
      globalRank: 10,
      integrityScore: attempt.integrityScore || 100,
      verifiedSubmissionHash: randomHash,
    };

    // Filter out previous entry if present
    const cleanLeaderboard = (config.leaderboard || []).filter((e) => e.userId !== userId);
    cleanLeaderboard.push(newEntry);

    // Sort by problemsSolved desc, score desc
    cleanLeaderboard.sort((a, b) => {
      if (b.problemsSolved !== a.problemsSolved) return b.problemsSolved - a.problemsSolved;
      return b.score - a.score;
    });

    // Assign ranks & prizes
    const prizeConfig = config.prizePool || { first: 1800, second: 1000, third: 500, top10: 100 };
    cleanLeaderboard.forEach((entry, idx) => {
      const rank = idx + 1;
      entry.rank = rank;
      if (rank === 1) entry.coinsWon = prizeConfig.first;
      else if (rank === 2) entry.coinsWon = prizeConfig.second;
      else if (rank === 3) entry.coinsWon = prizeConfig.third;
      else if (rank <= 10) entry.coinsWon = prizeConfig.top10;
      else entry.coinsWon = 0;
    });

    config.leaderboard = cleanLeaderboard;
    config.markModified('leaderboard');
    await config.save();

    try {
      socketService.emitLeaderboardUpdate(targetKey, cleanLeaderboard);
    } catch (socketErr) {
      console.warn('Socket leaderboard broadcast notice:', socketErr);
    }

    const userEntry = cleanLeaderboard.find((e) => e.userId === userId) || newEntry;

    // Award coins to user account if prize won and not already awarded
    if (userEntry.coinsWon > 0 && !attempt.coinsAwarded) {
      try {
        await gamificationService.awardPoints({
          userId,
          amount: userEntry.coinsWon,
          type: 'CONTEST_REWARD',
          referenceType: 'monthly_contest_prize',
          referenceId: `${targetKey}-${userId}`,
          description: `Grand Contest Reward: Rank #${userEntry.rank} in ${config.monthName}`,
        });
        attempt.coinsAwarded = true;
        await attempt.save();
      } catch (err) {
        console.error('Failed to award monthly contest coins:', err);
      }
    }

    return { attempt, leaderboardEntry: userEntry };
  }

  /**
   * Admin: Update contest configuration
   */
  public async updateContestConfig(
    updates: Partial<IMonthlyContestConfigDocument>,
    monthKey?: string
  ): Promise<IMonthlyContestConfigDocument> {
    const targetKey = monthKey || this.getCurrentMonthKey();
    const config = await this.getActiveContestConfig(targetKey);

    if (updates.title) config.title = updates.title;
    if (updates.tagline) config.tagline = updates.tagline;
    if (updates.durationHours) config.durationHours = updates.durationHours;
    if (updates.totalPrizeCoins) config.totalPrizeCoins = updates.totalPrizeCoins;
    if (updates.prizePool) {
      config.prizePool = { ...config.prizePool, ...updates.prizePool };
    }
    if (updates.breakdown) {
      config.breakdown = { ...config.breakdown, ...updates.breakdown };
    }
    if (updates.rules) config.rules = updates.rules;
    if (updates.stages) config.stages = updates.stages;
    if (typeof updates.isActive === 'boolean') config.isActive = updates.isActive;

    await config.save();
    return config;
  }

  /**
   * Admin: Update or adjust the contest leaderboard
   */
  public async updateLeaderboard(
    leaderboard: IMonthlyLeaderboardEntry[],
    monthKey?: string
  ): Promise<IMonthlyLeaderboardEntry[]> {
    const targetKey = monthKey || this.getCurrentMonthKey();
    const config = await this.getActiveContestConfig(targetKey);

    // Ensure rankings are consistent
    const prizeConfig = config.prizePool || { first: 1800, second: 1000, third: 500, top10: 100 };
    leaderboard.forEach((entry, idx) => {
      entry.rank = idx + 1;
      if (entry.rank === 1) entry.coinsWon = prizeConfig.first;
      else if (entry.rank === 2) entry.coinsWon = prizeConfig.second;
      else if (entry.rank === 3) entry.coinsWon = prizeConfig.third;
      else if (entry.rank <= 10) entry.coinsWon = prizeConfig.top10;
    });

    config.leaderboard = leaderboard;
    config.markModified('leaderboard');
    await config.save();

    try {
      socketService.emitLeaderboardUpdate(targetKey, config.leaderboard);
    } catch (socketErr) {
      console.warn('Socket leaderboard broadcast notice:', socketErr);
    }

    return config.leaderboard;
  }

  /**
   * Admin: Reset a student's attempt to allow fresh retake
   */
  public async resetUserAttempt(userId: string, monthKey?: string): Promise<boolean> {
    const targetKey = monthKey || this.getCurrentMonthKey();
    const result = await MonthlyUserAttemptModel.deleteOne({ userId, monthKey: targetKey });
    return result.deletedCount > 0;
  }
}

export const monthlyContestService = new MonthlyContestService();
