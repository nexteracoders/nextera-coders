import mongoose, { Document, Schema, Types } from 'mongoose';

export type SubmissionStatus =
  | 'Queued'
  | 'Processing'
  | 'Accepted'
  | 'Wrong Answer'
  | 'Runtime Error'
  | 'Compilation Error'
  | 'Time Limit Exceeded'
  | 'Memory Limit Exceeded'
  | 'Internal Error';

export interface ISubmission extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  problemId: Types.ObjectId;
  language: string;
  code: string;
  status: SubmissionStatus;
  executionTime: number; // ms
  memory: number; // KB
  testCasesPassed: number;
  totalTestCases: number;
  errorMessage?: string;
  details?: Array<{
    passed: boolean;
    input: string;
    expectedOutput: string;
    actualOutput: string;
    error?: string;
    executionTime: number;
    hidden: boolean;
  }>;
  antiCheat?: {
    tabSwitchesCount?: number;
    pasteCount?: number;
    timeTakenSeconds?: number;
    status?: 'Clean' | 'Suspicious' | 'Flagged';
    reason?: string;
  };
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SubmissionSchema = new Schema<ISubmission>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required'],
    },
    problemId: {
      type: Schema.Types.ObjectId,
      ref: 'CodingProblem',
      required: [true, 'problemId is required'],
    },
    language: {
      type: String,
      required: [true, 'Language is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Code payload is required'],
    },
    status: {
      type: String,
      enum: [
        'Queued',
        'Processing',
        'Accepted',
        'Wrong Answer',
        'Runtime Error',
        'Compilation Error',
        'Time Limit Exceeded',
        'Memory Limit Exceeded',
        'Internal Error',
      ],
      default: 'Queued',
      required: true,
    },
    executionTime: {
      type: Number,
      default: 0,
    },
    memory: {
      type: Number,
      default: 0,
    },
    testCasesPassed: {
      type: Number,
      default: 0,
    },
    totalTestCases: {
      type: Number,
      default: 0,
    },
    errorMessage: {
      type: String,
      default: '',
    },
    details: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    antiCheat: {
      tabSwitchesCount: { type: Number, default: 0 },
      pasteCount: { type: Number, default: 0 },
      timeTakenSeconds: { type: Number, default: 0 },
      status: { type: String, enum: ['Clean', 'Suspicious', 'Flagged'], default: 'Clean' },
      reason: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
  }
);

// High-performance compound indexes for scale (100k+ to millions of records)
// 1. User problem verification & status checking (Covered query optimization)
SubmissionSchema.index({ userId: 1, problemId: 1, status: 1 });
SubmissionSchema.index({ userId: 1, problemId: 1, submittedAt: -1 });

// 2. User submissions timeline, pagination & status filtering
SubmissionSchema.index({ userId: 1, submittedAt: -1 });
SubmissionSchema.index({ userId: 1, createdAt: -1 });
SubmissionSchema.index({ userId: 1, status: 1, submittedAt: -1 });

// 3. Problem submission feed & acceptance statistics
SubmissionSchema.index({ problemId: 1, createdAt: -1 });
SubmissionSchema.index({ problemId: 1, submittedAt: -1 });
SubmissionSchema.index({ problemId: 1, status: 1 });

// 4. Global streams, admin dashboard & time-series analytics
SubmissionSchema.index({ createdAt: -1 });
SubmissionSchema.index({ createdAt: 1, status: 1 });
SubmissionSchema.index({ status: 1, submittedAt: -1 });

export const Submission = mongoose.model<ISubmission>('Submission', SubmissionSchema);
