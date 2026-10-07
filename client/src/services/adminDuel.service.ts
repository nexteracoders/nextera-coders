import { api } from './api';
import { IDuelAntiCheat, IDuelAntiCheatLog } from './duel.service';

export type { IDuelAntiCheat, IDuelAntiCheatLog };

export interface AdminPrimeWinner {
  userId: string;
  name: string;
  rank: number;
  percentage: number;
  coinsAwarded: number;
}

export interface AdminDuelPlayer {
  userId: {
    _id?: string;
    id?: string;
    name: string;
    email?: string;
    profileImage?: string;
    college?: string;
    points?: number;
  } | string;
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
  coinsPaid?: number;
  antiCheat?: IDuelAntiCheat;
}

export interface AdminDuelProblem {
  _id: string;
  title: string;
  slug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category?: string;
  description?: string;
  constraints?: string[];
  examples?: Array<{ input: string; output: string; explanation?: string }>;
}

export interface AdminDuelItem {
  _id: string;
  roomCode: string;
  problemId: AdminDuelProblem | string;
  problemTitle: string;
  problemSlug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  players: AdminDuelPlayer[];
  status: 'waiting' | 'in-progress' | 'completed' | 'timed-out' | 'cancelled';
  winnerId?: {
    _id?: string;
    name: string;
    email?: string;
    profileImage?: string;
    college?: string;
  } | string | null;
  winningReason?: 'solved_first' | 'most_test_cases' | 'opponent_forfeit' | 'draw';
  coinsReward: number;
  durationSeconds: number;
  maxParticipants?: number;
  startedAt?: string;
  expiresAt?: string;
  isPrivate: boolean;
  duelType?: 'standard' | 'prime';
  entryFee?: number;
  totalPot?: number;
  platformFeePercent?: number;
  platformFeeCollected?: number;
  netPrizePool?: number;
  primeWinners?: AdminPrimeWinner[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminDuelMetrics {
  totalDuels: number;
  inProgressDuels: number;
  waitingDuels: number;
  completedDuels: number;
  timedOutDuels: number;
  cancelledDuels: number;
  totalCoinsAwarded: number;
}

export interface AdminPrimeDuelMetrics {
  totalDuels: number;
  inProgressDuels: number;
  waitingDuels: number;
  completedDuels: number;
  timedOutDuels: number;
  cancelledDuels: number;
  totalGrossStaked: number;
  totalPlatformRevenue: number;
  totalPrizeDistributed: number;
}

export interface AdminDuelListResponse {
  duels: AdminDuelItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  metrics: AdminDuelMetrics;
}

export interface AdminPrimeDuelListResponse {
  duels: AdminDuelItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  metrics: AdminPrimeDuelMetrics;
}

export interface AdminDuelSettings {
  coinsReward: number;
  durationSeconds: number;
  isEnabled: boolean;
  maxParticipantsPerRoom?: number;
}

export interface AdminPrimeDuelSettings {
  minStake: number;
  maxStake: number;
  platformFeePercent: number;
  durationSeconds: number;
  isEnabled: boolean;
  maxParticipantsPerRoom: number;
  twoPlayerPercentages: {
    first: number;
  };
  squadPercentages: {
    first: number;
    second: number;
  };
  grandRoyalePercentages: {
    first: number;
    second: number;
    third: number;
  };
}

class AdminDuelService {
  /**
   * Fetch all duels with metrics, filters, search & pagination
   */
  public async getDuels(params?: {
    page?: number;
    limit?: number;
    status?: string;
    difficulty?: string;
    search?: string;
  }): Promise<AdminDuelListResponse> {
    const res = await api.get('/admin/duels', { params });
    return res.data?.data || res.data;
  }

  /**
   * Get single duel details including submitted code
   */
  public async getDuelById(id: string): Promise<{ duel: AdminDuelItem }> {
    const res = await api.get(`/admin/duels/${id}`);
    return res.data?.data || res.data;
  }

  /**
   * Force cancel an active or waiting duel
   */
  public async cancelDuel(id: string, reason?: string): Promise<{ duel: AdminDuelItem }> {
    const res = await api.post(`/admin/duels/${id}/cancel`, { reason });
    return res.data?.data || res.data;
  }

  /**
   * Permanently delete a duel battle record
   */
  public async deleteDuel(id: string): Promise<void> {
    await api.delete(`/admin/duels/${id}`);
  }

  /**
   * Get global Code Duel configuration
   */
  public async getSettings(): Promise<AdminDuelSettings> {
    const res = await api.get('/admin/duels/settings');
    return res.data?.data?.settings || res.data?.settings;
  }

  /**
   * Update global Code Duel configuration
   */
  public async updateSettings(data: Partial<AdminDuelSettings>): Promise<AdminDuelSettings> {
    const res = await api.put('/admin/duels/settings', data);
    return res.data?.data?.settings || res.data?.settings;
  }

  /**
   * Fetch all NEC Prime Duels with metrics, coin gross staked, 10% platform revenue, prize pools & pagination
   */
  public async getPrimeDuels(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<AdminPrimeDuelListResponse> {
    const res = await api.get('/admin/duels/prime', { params });
    return res.data?.data || res.data;
  }

  /**
   * Force cancel and 100% refund all players of an active or waiting Prime Battle
   */
  public async cancelAndRefundPrimeDuel(id: string, reason?: string): Promise<{
    duel: AdminDuelItem;
    totalRefunded: number;
    refundedCount: number;
  }> {
    const res = await api.post(`/admin/duels/prime/${id}/cancel-refund`, { reason });
    return res.data?.data || res.data;
  }

  /**
   * Get global NEC Prime Battle configuration & rules
   */
  public async getPrimeSettings(): Promise<AdminPrimeDuelSettings> {
    const res = await api.get('/admin/duels/prime/settings');
    return res.data?.data?.settings || res.data?.settings;
  }

  /**
   * Update global NEC Prime Battle configuration & rules
   */
  public async updatePrimeSettings(data: Partial<AdminPrimeDuelSettings>): Promise<AdminPrimeDuelSettings> {
    const res = await api.put('/admin/duels/prime/settings', data);
    return res.data?.data?.settings || res.data?.settings;
  }

  /**
   * Override a player's anti-cheat status in a standard or prime battle
   */
  public async overridePlayerAntiCheat(
    duelId: string,
    playerId: string,
    status: 'clean' | 'suspicious' | 'flagged' | 'disqualified',
    reason?: string
  ): Promise<{ duel: AdminDuelItem; player: AdminDuelPlayer }> {
    const res = await api.post(`/admin/duels/${duelId}/players/${playerId}/anticheat`, { status, reason });
    return res.data?.data || res.data;
  }
}

export const adminDuelService = new AdminDuelService();
