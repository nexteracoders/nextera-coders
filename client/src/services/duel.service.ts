import { api } from './api';

export interface IPrimeWinner {
  userId: string;
  name: string;
  rank: number;
  percentage: number;
  coinsAwarded: number;
}

export interface IDuelAntiCheatLog {
  timestamp: string;
  eventType: 'tab_hidden' | 'tab_visible' | 'window_blur' | 'window_focus' | 'paste' | 'fullscreen_exit' | 'submit';
  details: string;
}

export interface IDuelAntiCheat {
  tabSwitchesCount: number;
  pasteCount: number;
  timeTakenSeconds: number;
  status: 'clean' | 'suspicious' | 'flagged' | 'disqualified';
  reason?: string;
  logs?: IDuelAntiCheatLog[];
  adminOverridden?: boolean;
}

export interface IDuelPlayer {
  userId: string;
  name: string;
  profileImage?: string;
  college?: string;
  status: 'joined' | 'ready' | 'coding' | 'submitted' | 'forfeited';
  testCasesPassed: number;
  totalTestCases: number;
  submittedCode?: string;
  submittedLanguage?: string;
  submittedAt?: string;
  executionTime?: number;
  isAi?: boolean;
  coinsPaid?: number;
  leftAt?: string;
  antiCheat?: IDuelAntiCheat;
}

export interface IDuelProblem {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category?: string;
  constraints?: string[];
  examples?: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  hints?: string[];
  starterCode?: Record<string, string>;
  solution?: string;
  supportedLanguages?: string[];
  sampleTestCases?: Array<{
    input: string;
    expectedOutput: string;
  }>;
}

export interface ICodeDuel {
  _id?: string;
  roomCode: string;
  problemId: string;
  problemTitle: string;
  problemSlug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  players: IDuelPlayer[];
  maxParticipants?: number;
  status: 'waiting' | 'in-progress' | 'completed' | 'timed-out' | 'cancelled';
  winnerId?: string | null;
  winningReason?: 'solved_first' | 'most_test_cases' | 'opponent_forfeit' | 'draw';
  coinsReward: number;
  durationSeconds: number;
  startedAt?: string;
  expiresAt?: string;
  isPrivate?: boolean;
  duelType?: 'standard' | 'prime';
  entryFee?: number;
  totalPot?: number;
  platformFeePercent?: number;
  platformFeeCollected?: number;
  netPrizePool?: number;
  primeWinners?: IPrimeWinner[];
}

export interface IDuelDetailsResponse {
  duel: ICodeDuel;
  timeRemainingSeconds: number;
  problem: IDuelProblem | null;
}

export interface IDuelSubmissionResult {
  evaluation: {
    status: 'Accepted' | 'Wrong Answer' | 'Runtime Error' | 'Compilation Error' | 'Time Limit Exceeded';
    testCasesPassed: number;
    totalTestCases: number;
    executionTime: number;
    memory: number;
    errorMessage?: string;
    details?: Array<{
      input: string;
      expectedOutput: string;
      actualOutput?: string;
      passed?: boolean;
      status?: string;
      executionTime?: number;
      error?: string;
    }>;
  };
  allPassed: boolean;
  duelStatus: 'in-progress' | 'completed' | 'timed-out';
  winnerId?: string | null;
  isWinner: boolean;
  coinsAwarded: number;
}

export interface IDuelUserStats {
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  totalCoinsWon: number;
  maxParticipantsPerRoom?: number;
  recentDuels: Array<{
    id: string;
    roomCode: string;
    problemTitle: string;
    difficulty: string;
    isWinner: boolean;
    opponentName: string;
    opponentAvatar?: string;
    coinsAwarded: number;
    date: string;
    status: string;
  }>;
}

class DuelService {
  /**
   * Create a new 1vs1 or Group Code Duel Room
   */
  public async createDuel(data?: { difficulty?: string; isPrivate?: boolean; maxParticipants?: number; problemId?: string }): Promise<{
    roomCode: string;
    problemTitle: string;
    problemSlug: string;
    difficulty: string;
    status: string;
    coinsReward: number;
    durationSeconds: number;
    maxParticipants?: number;
  }> {
    const res = await api.post('/duels/create', data || {});
    return res.data?.data || res.data;
  }

  /**
   * Join an existing Code Duel room by 6-char code (Supports Rejoin & Group Battles)
   */
  public async joinDuel(roomCode: string): Promise<{ duel: ICodeDuel; problem: IDuelProblem | null; rejoined?: boolean; started?: boolean }> {
    const res = await api.post('/duels/join', { roomCode });
    return res.data?.data || res.data;
  }

  /**
   * Start battle early if host decides not to wait for full squad (min 2 players)
   */
  public async startDuelNow(roomCode: string): Promise<{
    duel: ICodeDuel;
    problem?: IDuelProblem;
    timeRemainingSeconds?: number;
  }> {
    const res = await api.post(`/duels/${roomCode}/start-now`);
    return res.data?.data || res.data;
  }

  /**
   * Request NEC AI (Grandmaster Bot) to enter the battle room immediately
   */
  public async joinAiDuel(roomCode: string): Promise<{
    duel: ICodeDuel;
    problem: IDuelProblem;
    timeRemainingSeconds?: number;
  }> {
    const res = await api.post(`/duels/${roomCode}/join-ai`);
    return res.data?.data || res.data;
  }

  /**
   * Check if current user has an ongoing active duel session within the 2-minute rejoin window
   */
  public async getMyActiveDuel(): Promise<{ activeDuel: ICodeDuel | null; rejoinSecondsRemaining?: number }> {
    const res = await api.get('/duels/my-active');
    return res.data?.data || res.data;
  }

  /**
   * Explicitly record player leave from an active duel room (initiates 2-minute rejoin window)
   */
  public async leaveDuel(roomCode: string): Promise<{ success: boolean }> {
    const res = await api.post(`/duels/${roomCode}/leave`);
    return res.data?.data || res.data;
  }

  /**
   * Quick Match: match an opponent instantly or queue up
   */
  public async quickMatch(difficulty?: string): Promise<{
    roomCode: string;
    status: string;
    started?: boolean;
    duel?: ICodeDuel;
    problem?: IDuelProblem;
  }> {
    const res = await api.post('/duels/quick-match', { difficulty });
    return res.data?.data || res.data;
  }

  /**
   * Get live status and problem details for a room
   */
  public async getDuelDetails(roomCode: string): Promise<IDuelDetailsResponse> {
    const res = await api.get(`/duels/${roomCode}`);
    return res.data?.data || res.data;
  }

  /**
   * Submit solution for immediate duel evaluation
   */
  public async submitSolution(
    roomCode: string,
    code: string,
    language: string,
    antiCheat?: IDuelAntiCheat
  ): Promise<IDuelSubmissionResult> {
    const res = await api.post(`/duels/${roomCode}/submit`, { code, language, antiCheat });
    return res.data?.data || res.data;
  }

  /**
   * Run code against sample test cases (Safe test runner, does NOT mark complete)
   */
  public async runTests(
    roomCode: string,
    code: string,
    language: string
  ): Promise<{
    evaluation: {
      status: string;
      testCasesPassed: number;
      totalTestCases: number;
      executionTime: number;
      memory: number;
      errorMessage?: string;
      details?: Array<{
        input: string;
        expectedOutput: string;
        actualOutput?: string;
        passed?: boolean;
        status?: string;
        executionTime?: number;
        error?: string;
      }>;
    };
    allPassed: boolean;
    roomCode: string;
  }> {
    const res = await api.post(`/duels/${roomCode}/run-tests`, { code, language });
    return res.data?.data || res.data;
  }

  /**
   * Notify server when AI challenger finishes problem first
   */
  public async notifyAiWin(roomCode: string): Promise<any> {
    const res = await api.post(`/duels/${roomCode}/ai-win`);
    return res.data?.data || res.data;
  }

  /**
   * Get personal duel statistics & recent match record
   */
  public async getMyStats(): Promise<IDuelUserStats> {
    const res = await api.get('/duels/user/stats');
    return res.data?.data || res.data;
  }

  /**
   * Create a new NEC Prime Battle Room with coin stake
   */
  public async createPrimeDuel(data: {
    entryFee: number;
    maxParticipants?: number;
    difficulty?: string;
    problemId?: string;
    isPrivate?: boolean;
  }): Promise<{
    roomCode: string;
    duel: ICodeDuel;
    problem: IDuelProblem;
    poolInfo: {
      entryFee: number;
      participantCount: number;
      totalPot: number;
      platformFee: number;
      netPool: number;
      winnersCount: number;
      breakdown: Array<{ rank: number; percent: number; coins: number }>;
    };
    remainingCoins: number;
  }> {
    const res = await api.post('/duels/prime/create', data);
    return res.data?.data || res.data;
  }

  /**
   * Join an existing NEC Prime Battle Room by code and stake entry fee
   */
  public async joinPrimeDuel(roomCode: string): Promise<{
    roomCode: string;
    duel: ICodeDuel;
    problem: IDuelProblem;
    poolInfo: {
      entryFee: number;
      participantCount: number;
      totalPot: number;
      platformFee: number;
      netPool: number;
      winnersCount: number;
      breakdown: Array<{ rank: number; percent: number; coins: number }>;
    };
    started: boolean;
    remainingCoins: number;
  }> {
    const res = await api.post('/duels/prime/join', { roomCode });
    return res.data?.data || res.data;
  }

  /**
   * Quick Match for Prime Battles
   */
  public async quickMatchPrime(data: {
    entryFee: number;
    difficulty?: string;
    maxParticipants?: number;
  }): Promise<{
    roomCode: string;
    status: string;
    started?: boolean;
    duel: ICodeDuel;
    problem: IDuelProblem;
    remainingCoins: number;
  }> {
    const res = await api.post('/duels/prime/quick-match', data);
    return res.data?.data || res.data;
  }

  /**
   * Cancel a waiting Prime Battle Room and receive 100% refund
   */
  public async cancelPrimeDuel(roomCode: string): Promise<{
    roomCode: string;
    status: string;
    refundedCoins: number;
    newBalance: number;
  }> {
    const res = await api.post(`/duels/prime/${roomCode}/cancel`);
    return res.data?.data || res.data;
  }

  /**
   * Get user Prime duel stats
   */
  public async getMyPrimeStats(): Promise<{
    totalMatches: number;
    wins: number;
    losses: number;
    winRate: number;
    totalCoinsWon: number;
    recentDuels: Array<{
      id: string;
      roomCode: string;
      problemTitle: string;
      difficulty: string;
      entryFee: number;
      totalPot: number;
      netPrizePool: number;
      isWinner: boolean;
      coinsAwarded: number;
      date: string;
      status: string;
    }>;
  }> {
    const res = await api.get('/duels/prime/user/stats');
    return res.data?.data || res.data;
  }

  /**
   * Request / trigger a rematch in a finished duel room
   */
  public async rematchDuel(roomCode: string): Promise<{
    duel: ICodeDuel;
    problem: IDuelProblem;
    timeRemainingSeconds: number;
  }> {
    const res = await api.post(`/duels/${roomCode}/rematch`);
    return res.data?.data || res.data;
  }

  /**
   * Cancel a waiting standard duel room
   */
  public async cancelDuel(roomCode: string): Promise<{ success: boolean; message: string }> {
    const res = await api.post(`/duels/${roomCode}/cancel`);
    return res.data?.data || res.data;
  }

  /**
   * Explicitly settle timeout on backend when battle timer reaches 0
   */
  public async timeoutDuel(roomCode: string): Promise<{ duel: ICodeDuel }> {
    const res = await api.post(`/duels/${roomCode}/timeout`);
    return res.data?.data || res.data;
  }
}

export const duelService = new DuelService();
