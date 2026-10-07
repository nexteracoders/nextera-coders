import mongoose, { Document, Schema, Types } from 'mongoose';

export type AttemptStatus = 'STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED';

export interface IUserAnswer {
  questionIndex: number;
  selectedAnswer: string;
  isCorrect?: boolean;
  marksEarned?: number;
}

export interface IQuizAttempt extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  quizId: Types.ObjectId;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  status: AttemptStatus;
  answers: IUserAnswer[];
  startedAt: Date;
  completedAt?: Date;
  timeTaken: number; // seconds
  createdAt: Date;
  updatedAt: Date;
}

const QuizAttemptSchema = new Schema<IQuizAttempt>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    quizId: {
      type: Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
      index: true,
    },
    score: {
      type: Number,
      default: 0,
    },
    totalMarks: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    passed: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: ['STARTED', 'IN_PROGRESS', 'SUBMITTED', 'EXPIRED'],
      default: 'STARTED',
      index: true,
    },
    answers: [
      {
        questionIndex: { type: Number, required: true },
        selectedAnswer: { type: String, default: '' },
        isCorrect: { type: Boolean, default: false },
        marksEarned: { type: Number, default: 0 },
      },
    ],
    startedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    completedAt: {
      type: Date,
    },
    timeTaken: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

QuizAttemptSchema.index({ userId: 1, quizId: 1, createdAt: -1 });
QuizAttemptSchema.index({ status: 1, completedAt: -1 });
QuizAttemptSchema.index({ status: 1, createdAt: 1, passed: 1 });

export const QuizAttempt = mongoose.model<IQuizAttempt>('QuizAttempt', QuizAttemptSchema);
