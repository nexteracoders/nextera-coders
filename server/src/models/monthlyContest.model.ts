import { Schema, model, Document, Types } from 'mongoose';

export interface IMonthlyChallenge {
  id: string;
  stageId: number;
  stageName: string;
  order: number;
  title: string;
  slug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  xpPoints: number;
  coinsBounty: number;
  description: string;
  solvedCount: number;
}

export interface IMonthlyStage {
  id: number;
  name: string;
  subtitle: string;
  icon: string;
  badge: string;
  color: string;
  accentGradient: string;
  challenges: IMonthlyChallenge[];
}

export interface IMonthlyLeaderboardEntry {
  userId: string;
  username: string;
  name: string;
  avatar: string;
  rank: number;
  score: number;
  problemsSolved: number;
  finishTime: string;
  coinsWon: number;
  college: string;
  country: string;
  badge: string;
  globalRating: number;
  globalRank: number;
  integrityScore: number;
  verifiedSubmissionHash: string;
  bio?: string;
  skills?: string[];
  github?: string;
  linkedin?: string;
}

export interface IMonthlyContestConfigDocument extends Document {
  monthKey: string; // e.g. "2026-09"
  monthName: string; // e.g. "September 2026"
  title: string;
  tagline: string;
  durationHours: number;
  totalPrizeCoins: number;
  prizePool: {
    first: number; // 1800
    second: number; // 1000
    third: number; // 500
    top10: number; // 100
  };
  totalQuestions: number;
  breakdown: {
    easy: number;
    medium: number;
    hard: number;
  };
  stages: IMonthlyStage[];
  leaderboard: IMonthlyLeaderboardEntry[];
  rules: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMonthlyUserAttemptDocument extends Document {
  userId: string;
  userRef?: Types.ObjectId;
  monthKey: string;
  status: 'not_started' | 'in_progress' | 'submitted' | 'expired';
  startedAt?: Date;
  expiresAt?: Date;
  submittedAt?: Date;
  solvedProblemSlugs: string[];
  totalScore: number;
  coinsAwarded: boolean;
  integrityScore: number;
  tabSwitchWarnings: number;
  submissionHashes: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

const MonthlyContestConfigSchema = new Schema<IMonthlyContestConfigDocument>(
  {
    monthKey: { type: String, required: true, unique: true, index: true },
    monthName: { type: String, required: true },
    title: { type: String, default: 'NextEra Monthly Grand Contest' },
    tagline: { type: String, default: '72-Hour Personal Sprint • 18 Challenges • 3,300+ NEC Coins Prize Pool' },
    durationHours: { type: Number, default: 72 },
    totalPrizeCoins: { type: Number, default: 3300 },
    prizePool: {
      first: { type: Number, default: 1800 },
      second: { type: Number, default: 1000 },
      third: { type: Number, default: 500 },
      top10: { type: Number, default: 100 },
    },
    totalQuestions: { type: Number, default: 18 },
    breakdown: {
      easy: { type: Number, default: 5 },
      medium: { type: Number, default: 10 },
      hard: { type: Number, default: 3 },
    },
    stages: { type: Schema.Types.Mixed, default: [] },
    leaderboard: { type: Schema.Types.Mixed, default: [] },
    rules: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const MonthlyUserAttemptSchema = new Schema<IMonthlyUserAttemptDocument>(
  {
    userId: { type: String, required: true },
    userRef: { type: Schema.Types.ObjectId, ref: 'User' },
    monthKey: { type: String, required: true },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'submitted', 'expired'],
      default: 'not_started',
    },
    startedAt: { type: Date },
    expiresAt: { type: Date },
    submittedAt: { type: Date },
    solvedProblemSlugs: { type: [String], default: [] },
    totalScore: { type: Number, default: 0 },
    coinsAwarded: { type: Boolean, default: false },
    integrityScore: { type: Number, default: 100 },
    tabSwitchWarnings: { type: Number, default: 0 },
    submissionHashes: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// High-performance compound indexes for contest attempts & real-time leaderboard
MonthlyUserAttemptSchema.index({ userId: 1, monthKey: 1 }, { unique: true });
MonthlyUserAttemptSchema.index({ monthKey: 1, status: 1, totalScore: -1, submittedAt: 1 });
MonthlyUserAttemptSchema.index({ monthKey: 1, totalScore: -1 });

export const MonthlyContestConfigModel = model<IMonthlyContestConfigDocument>(
  'MonthlyContestConfig',
  MonthlyContestConfigSchema
);

export const MonthlyUserAttemptModel = model<IMonthlyUserAttemptDocument>(
  'MonthlyUserAttempt',
  MonthlyUserAttemptSchema
);
