// Contests Hub Service with All Contests, Past Archive, Global Rating System & Admin Controls

export interface ContestItem {
  id: string;
  contestNumber?: number;
  title: string;
  slug: string;
  type: 'Weekly' | 'Biweekly' | 'Collegiate' | 'Special Arena';
  status: 'live' | 'upcoming' | 'concluded';
  startTime: string; // ISO String
  durationMinutes: number; // e.g. 90 mins
  prizeCoins: number; // e.g. 100
  registeredCount: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Hard' | 'Open to All';
  description: string;
  rules: string[];
  bannerUrl?: string;
  targetRoute?: string;
  problemCount: number;
  winnerName?: string;
  winnerCollege?: string;
  editorialUrl?: string;
}

export interface ContestWinnerArchive {
  contestId: string;
  contestTitle: string;
  date: string;
  totalParticipants: number;
  winners: {
    rank: number;
    name: string;
    username: string;
    avatar: string;
    college: string;
    finishTime: string;
    coinsAwarded: number;
    score: number;
  }[];
  problemSlugs: { title: string; slug: string; difficulty: string }[];
}

export interface ContestsHubConfig {
  contests: ContestItem[];
  archives: ContestWinnerArchive[];
  updatedAt: string;
}

const STORAGE_KEY_CONTESTS_HUB = 'nextera_contests_hub_config_v2';
const STORAGE_KEY_USER_REGISTERED = 'nextera_contests_registered_ids_v2';

const DEFAULT_CONTESTS: ContestItem[] = [
  {
    id: 'contest-sunday-weekly',
    contestNumber: 42,
    title: 'NextEra Sunday Grand Championship #42',
    slug: 'weekly-contest-42',
    type: 'Weekly',
    status: 'live',
    startTime: '2026-09-06T00:00:00.000Z',
    durationMinutes: 90,
    prizeCoins: 100,
    registeredCount: 3420,
    difficulty: 'Open to All',
    description: 'The premier weekly algorithmic challenge on NextEra. Solve 2 problems, pass 100% test cases, and claim guaranteed 100 pure NEC Coins!',
    rules: [
      'Contest is live throughout every Sunday until 11:59 PM.',
      'Pass 100% test cases on both questions to unlock the 100 NEC coins bounty.',
      'Instant ranking updates & live compilation in browser.',
    ],
    targetRoute: '/contest',
    problemCount: 2,
  },
  {
    id: 'contest-biweekly-21',
    contestNumber: 21,
    title: 'Biweekly Saturday Speed Sprint #21',
    slug: 'biweekly-saturday-sprint-21',
    type: 'Biweekly',
    status: 'upcoming',
    startTime: '2026-09-12T19:30:00.000Z',
    durationMinutes: 60,
    prizeCoins: 50,
    registeredCount: 1840,
    difficulty: 'Intermediate',
    description: 'A rapid 60-minute coding sprint designed for high-speed algorithmic thinking, array mastery, and data structure speedruns.',
    rules: [
      '3 algorithmic problems (1 Easy, 2 Medium).',
      'Penalty of 5 minutes for every incorrect test run.',
      'Top 10 finishers receive exclusive Speedster badges.',
    ],
    targetRoute: '/contest',
    problemCount: 3,
  },
  {
    id: 'contest-collegiate-2026',
    contestNumber: 1,
    title: 'All-India Inter-Collegiate Coding Cup 2026',
    slug: 'all-india-collegiate-cup-2026',
    type: 'Collegiate',
    status: 'upcoming',
    startTime: '2026-09-20T10:00:00.000Z',
    durationMinutes: 120,
    prizeCoins: 500,
    registeredCount: 5210,
    difficulty: 'Hard',
    description: 'Represent your college on the national stage! Compete against students from IITs, NITs, IIITs, and top engineering colleges across India.',
    rules: [
      'College email / verification required for leaderboard college tag.',
      '4 challenging DSA problems.',
      'Top 3 colleges win campus swag boxes + 500 NEC coins per winner.',
    ],
    targetRoute: '/practice/monthly-contest',
    problemCount: 4,
  },
  {
    id: 'contest-monthly-grand',
    contestNumber: 1,
    title: 'NEC Grand Coding Championship (Monthly)',
    slug: 'nec-grand-coding-championship',
    type: 'Special Arena',
    status: 'live',
    startTime: '2026-09-01T00:00:00.000Z',
    durationMinutes: 4320, // 72 hours
    prizeCoins: 3300,
    registeredCount: 8420,
    difficulty: 'Open to All',
    description: 'The premier monthly coding championship of NextEra Coders. 18 curated challenges across 4 stages, 72-hour on-demand sprint, and 3,300+ NEC Coins prize pool.',
    rules: [
      '18 problems across 4 progressive stages (5 Easy, 10 Medium, 3 Hard).',
      '🥇 1st: 1,800 Coins, 🥈 2nd: 1,000 Coins, 🥉 3rd: 500 Coins.',
      'Verified submission hashes and real-time anti-cheat proctoring.',
    ],
    targetRoute: '/practice/monthly-contest',
    problemCount: 18,
  },
];

const DEFAULT_ARCHIVES: ContestWinnerArchive[] = [
  {
    contestId: 'contest-weekly-41',
    contestTitle: 'NextEra Sunday Grand Championship #41',
    date: 'Aug 30, 2026',
    totalParticipants: 3890,
    winners: [
      {
        rank: 1,
        name: 'Arjun Nambiar',
        username: 'arjun_algoking',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120',
        college: 'IIT Madras',
        finishTime: '24m 12s',
        coinsAwarded: 100,
        score: 1000,
      },
      {
        rank: 2,
        name: 'Ananya Deshmukh',
        username: 'ananya_dev',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
        college: 'BITS Goa',
        finishTime: '31m 45s',
        coinsAwarded: 100,
        score: 1000,
      },
      {
        rank: 3,
        name: 'Harshvardhan Rao',
        username: 'harsh_cpp',
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=120',
        college: 'IIIT Allahabad',
        finishTime: '38m 04s',
        coinsAwarded: 100,
        score: 1000,
      },
    ],
    problemSlugs: [
      { title: 'Maximum Subarray (Kadane)', slug: 'maximum-subarray', difficulty: 'Medium' },
      { title: 'Course Schedule II', slug: 'course-schedule-ii', difficulty: 'Hard' },
    ],
  },
  {
    contestId: 'contest-weekly-40',
    contestTitle: 'NextEra Sunday Grand Championship #40',
    date: 'Aug 23, 2026',
    totalParticipants: 3410,
    winners: [
      {
        rank: 1,
        name: 'Tanvi Iyer',
        username: 'tanvi_dsa',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
        college: 'NIT Surathkal',
        finishTime: '28m 50s',
        coinsAwarded: 100,
        score: 1000,
      },
      {
        rank: 2,
        name: 'Karan Joshi',
        username: 'karan_j',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
        college: 'DTU Delhi',
        finishTime: '35m 19s',
        coinsAwarded: 100,
        score: 1000,
      },
    ],
    problemSlugs: [
      { title: 'LRU Cache Design', slug: 'lru-cache', difficulty: 'Medium' },
      { title: 'Word Ladder', slug: 'word-ladder', difficulty: 'Hard' },
    ],
  },
];

class ContestsHubService {
  private config: ContestsHubConfig;
  private registeredContestIds: Set<string> = new Set();
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.config = this.loadConfig();
    this.loadRegistered();
  }

  private loadConfig(): ContestsHubConfig {
    try {
      const cached = localStorage.getItem(STORAGE_KEY_CONTESTS_HUB);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.error('Failed to load contests hub config', e);
    }
    const defaultCfg: ContestsHubConfig = {
      contests: DEFAULT_CONTESTS,
      archives: DEFAULT_ARCHIVES,
      updatedAt: new Date().toISOString(),
    };
    this.saveConfig(defaultCfg);
    return defaultCfg;
  }

  private saveConfig(config: ContestsHubConfig) {
    this.config = config;
    try {
      localStorage.setItem(STORAGE_KEY_CONTESTS_HUB, JSON.stringify(config));
    } catch (e) {
      console.error('Failed to save contests hub config', e);
    }
    this.notify();
  }

  private loadRegistered() {
    try {
      const cached = localStorage.getItem(STORAGE_KEY_USER_REGISTERED);
      if (cached) {
        this.registeredContestIds = new Set(JSON.parse(cached));
      } else {
        this.registeredContestIds = new Set(['contest-sunday-weekly']);
      }
    } catch (e) {
      console.error('Failed to load registered contests', e);
    }
  }

  private saveRegistered() {
    try {
      localStorage.setItem(STORAGE_KEY_USER_REGISTERED, JSON.stringify(Array.from(this.registeredContestIds)));
    } catch (e) {
      console.error('Failed to save registered contests', e);
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public getContests(): ContestItem[] {
    return [...this.config.contests];
  }

  public getArchives(): ContestWinnerArchive[] {
    return [...this.config.archives];
  }

  public getRegisteredIds(): Set<string> {
    return new Set(this.registeredContestIds);
  }

  public toggleRegistration(contestId: string): boolean {
    const contest = this.config.contests.find((c) => c.id === contestId);
    if (this.registeredContestIds.has(contestId)) {
      this.registeredContestIds.delete(contestId);
      if (contest) contest.registeredCount = Math.max(0, contest.registeredCount - 1);
    } else {
      this.registeredContestIds.add(contestId);
      if (contest) contest.registeredCount += 1;
    }
    this.saveRegistered();
    this.saveConfig({ ...this.config });
    return this.registeredContestIds.has(contestId);
  }

  // ADMIN CONTROLS: Create Contest
  public createContest(contest: Omit<ContestItem, 'id' | 'registeredCount'>): ContestItem {
    const newContest: ContestItem = {
      ...contest,
      id: `contest-${Date.now()}`,
      registeredCount: 0,
    };
    this.config.contests.push(newContest);
    this.saveConfig({ ...this.config, updatedAt: new Date().toISOString() });
    return newContest;
  }

  // ADMIN CONTROLS: Update Contest
  public updateContest(id: string, updates: Partial<ContestItem>): boolean {
    const idx = this.config.contests.findIndex((c) => c.id === id);
    if (idx !== -1) {
      this.config.contests[idx] = { ...this.config.contests[idx], ...updates };
      this.saveConfig({ ...this.config, updatedAt: new Date().toISOString() });
      return true;
    }
    return false;
  }

  // ADMIN CONTROLS: Delete Contest
  public deleteContest(id: string): boolean {
    const initialLen = this.config.contests.length;
    this.config.contests = this.config.contests.filter((c) => c.id !== id);
    if (this.config.contests.length !== initialLen) {
      this.registeredContestIds.delete(id);
      this.saveRegistered();
      this.saveConfig({ ...this.config, updatedAt: new Date().toISOString() });
      return true;
    }
    return false;
  }

  // ADMIN CONTROLS: Reset to default
  public resetToDefault() {
    const defaultCfg: ContestsHubConfig = {
      contests: DEFAULT_CONTESTS,
      archives: DEFAULT_ARCHIVES,
      updatedAt: new Date().toISOString(),
    };
    this.saveConfig(defaultCfg);
  }
}

export const contestsHubService = new ContestsHubService();
