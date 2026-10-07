import mongoose, { Document, Schema, Types } from 'mongoose';

export type PointTransactionType =
  | 'LESSON_COMPLETE'
  | 'QUIZ_COMPLETE'
  | 'PROBLEM_SOLVED'
  | 'COURSE_COMPLETE'
  | 'ACHIEVEMENT_UNLOCKED'
  | 'STREAK_BONUS'
  | 'CONTEST_REWARD'
  | 'SWAG_REDEEM'
  | 'ADMIN_ADJUSTMENT'
  | 'DUEL_WIN'
  | 'PRIME_DUEL_ENTRY'
  | 'PRIME_DUEL_WIN'
  | 'PRIME_DUEL_REFUND'
  | 'JOINING_BONUS';

export interface IPointTransaction extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  amount: number;
  type: PointTransactionType;
  referenceType?: string;
  referenceId?: string;
  description: string;
  createdAt: Date;
}

const PointTransactionSchema = new Schema<IPointTransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Point amount is required'],
    },
    type: {
      type: String,
      enum: [
        'LESSON_COMPLETE',
        'QUIZ_COMPLETE',
        'PROBLEM_SOLVED',
        'COURSE_COMPLETE',
        'ACHIEVEMENT_UNLOCKED',
        'STREAK_BONUS',
        'CONTEST_REWARD',
        'SWAG_REDEEM',
        'ADMIN_ADJUSTMENT',
        'DUEL_WIN',
        'PRIME_DUEL_ENTRY',
        'PRIME_DUEL_WIN',
        'PRIME_DUEL_REFUND',
        'JOINING_BONUS',
      ],
      required: true,
    },
    referenceType: {
      type: String,
      trim: true,
    },
    referenceId: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

PointTransactionSchema.index({ userId: 1, createdAt: -1 });
PointTransactionSchema.index({ userId: 1, referenceType: 1, referenceId: 1 });

export const PointTransaction = mongoose.model<IPointTransaction>(
  'PointTransaction',
  PointTransactionSchema
);
