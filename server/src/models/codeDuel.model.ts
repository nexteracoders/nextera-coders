import mongoose, { Document, Schema, Types } from 'mongoose';

export type DuelPlayerStatus = 'joined' | 'ready' | 'coding' | 'submitted' | 'forfeited';
export type DuelStatus = 'waiting' | 'in-progress' | 'completed' | 'timed-out' | 'cancelled';
export type DuelWinningReason = 'solved_first' | 'most_test_cases' | 'opponent_forfeit' | 'draw';

export interface IPrimeWinner {
  userId: Types.ObjectId;
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
  userId: Types.ObjectId;
  name: string;
  profileImage?: string;
  college?: string;
  socketId?: string;
  status: DuelPlayerStatus;
  testCasesPassed: number;
  totalTestCases: number;
  submittedCode?: string;
  submittedLanguage?: string;
  submittedAt?: Date;
  executionTime?: number;
  isAi?: boolean;
  coinsPaid?: number;
  leftAt?: Date;
  antiCheat?: IDuelAntiCheat;
}

export interface ICodeDuel extends Document {
  _id: Types.ObjectId;
  roomCode: string;
  duelType: 'standard' | 'prime';
  problemId: Types.ObjectId;
  problemTitle: string;
  problemSlug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  players: IDuelPlayer[];
  maxParticipants: number;
  status: DuelStatus;
  winnerId?: Types.ObjectId | null;
  winningReason?: DuelWinningReason;
  coinsReward: number;
  entryFee: number;
  totalPot: number;
  platformFeePercent: number;
  platformFeeCollected: number;
  netPrizePool: number;
  primeWinners?: IPrimeWinner[];
  durationSeconds: number; // default: 900 (15 mins)
  startedAt?: Date;
  expiresAt?: Date;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DuelPlayerSchema = new Schema<IDuelPlayer>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    profileImage: {
      type: String,
      default: '',
    },
    college: {
      type: String,
      default: '',
    },
    socketId: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['joined', 'ready', 'coding', 'submitted', 'forfeited'],
      default: 'joined',
    },
    testCasesPassed: {
      type: Number,
      default: 0,
    },
    totalTestCases: {
      type: Number,
      default: 0,
    },
    submittedCode: {
      type: String,
      default: '',
    },
    submittedLanguage: {
      type: String,
      default: '',
    },
    submittedAt: {
      type: Date,
    },
    executionTime: {
      type: Number,
      default: 0,
    },
    isAi: {
      type: Boolean,
      default: false,
    },
    coinsPaid: {
      type: Number,
      default: 0,
    },
    leftAt: {
      type: Date,
    },
    antiCheat: {
      tabSwitchesCount: { type: Number, default: 0 },
      pasteCount: { type: Number, default: 0 },
      timeTakenSeconds: { type: Number, default: 0 },
      status: {
        type: String,
        enum: ['clean', 'suspicious', 'flagged', 'disqualified'],
        default: 'clean',
      },
      reason: { type: String, default: '' },
      logs: [
        {
          timestamp: { type: String, default: '' },
          eventType: { type: String, default: '' },
          details: { type: String, default: '' },
          _id: false,
        },
      ],
      adminOverridden: { type: Boolean, default: false },
    },
  },
  { _id: false }
);

const CodeDuelSchema = new Schema<ICodeDuel>(
  {
    roomCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    duelType: {
      type: String,
      enum: ['standard', 'prime'],
      default: 'standard',
      index: true,
    },
    problemId: {
      type: Schema.Types.ObjectId,
      ref: 'CodingProblem',
      required: true,
    },
    problemTitle: {
      type: String,
      required: true,
    },
    problemSlug: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Easy',
    },
    players: [DuelPlayerSchema],
    maxParticipants: {
      type: Number,
      default: 2,
      min: 2,
      max: 10,
    },
    status: {
      type: String,
      enum: ['waiting', 'in-progress', 'completed', 'timed-out', 'cancelled'],
      default: 'waiting',
      index: true,
    },
    winnerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    winningReason: {
      type: String,
      enum: ['solved_first', 'most_test_cases', 'opponent_forfeit', 'draw'],
    },
    coinsReward: {
      type: Number,
      default: 50,
    },
    entryFee: {
      type: Number,
      default: 0,
    },
    totalPot: {
      type: Number,
      default: 0,
    },
    platformFeePercent: {
      type: Number,
      default: 10,
    },
    platformFeeCollected: {
      type: Number,
      default: 0,
    },
    netPrizePool: {
      type: Number,
      default: 0,
    },
    primeWinners: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        name: {
          type: String,
        },
        rank: {
          type: Number,
        },
        percentage: {
          type: Number,
        },
        coinsAwarded: {
          type: Number,
        },
      },
    ],
    durationSeconds: {
      type: Number,
      default: 900, // 15 minutes
    },
    startedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
      index: true,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
CodeDuelSchema.index({ status: 1, createdAt: -1 });
CodeDuelSchema.index({ 'players.userId': 1, status: 1 });

export const CodeDuel = mongoose.model<ICodeDuel>('CodeDuel', CodeDuelSchema);
