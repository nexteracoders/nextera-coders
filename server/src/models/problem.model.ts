import mongoose, { Document, Schema, Types } from 'mongoose';

export type ProblemDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface IProblemExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface ITestCase {
  input: string;
  expectedOutput: string;
  hidden: boolean;
}

export interface IStarterCode {
  javascript?: string;
  typescript?: string;
  python?: string;
  java?: string;
  cpp?: string;
  c?: string;
  csharp?: string;
}

export interface IExpectedComplexity {
  time?: string;
  space?: string;
}

export interface ICodingProblem extends Document {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  difficulty: ProblemDifficulty;
  category: string;
  youtubeUrl?: string;
  constraints: string[];
  examples: IProblemExample[];
  hints: string[];
  testCases: ITestCase[];
  starterCode: IStarterCode;
  solution?: string;
  supportedLanguages: string[];
  expectedComplexity: IExpectedComplexity;
  isPublished: boolean;
  order: number;
  acceptanceRate?: number;
  totalSubmissions?: number;
  totalAccepted?: number;
  companies?: string[];
  submissionsCount?: string;
  accuracy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CodingProblemSchema = new Schema<ICodingProblem>(
  {
    title: {
      type: String,
      required: [true, 'Problem title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Problem description is required'],
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium',
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Problem category is required'],
      trim: true,
      index: true,
    },
    youtubeUrl: {
      type: String,
      default: '',
      trim: true,
    },
    constraints: {
      type: [String],
      default: [],
    },
    examples: [
      {
        input: { type: String, required: true },
        output: { type: String, required: true },
        explanation: { type: String, default: '' },
      },
    ],
    hints: {
      type: [String],
      default: [],
    },
    testCases: [
      {
        input: { type: String, required: true },
        expectedOutput: { type: String, required: true },
        hidden: { type: Boolean, default: false },
      },
    ],
    starterCode: {
      javascript: { type: String, default: '' },
      typescript: { type: String, default: '' },
      python: { type: String, default: '' },
      java: { type: String, default: '' },
      cpp: { type: String, default: '' },
      c: { type: String, default: '' },
      csharp: { type: String, default: '' },
    },
    solution: {
      type: String,
      default: '',
    },
    supportedLanguages: {
      type: [String],
      default: ['javascript', 'python', 'java', 'cpp', 'c'],
    },
    expectedComplexity: {
      time: { type: String, default: 'O(n)' },
      space: { type: String, default: 'O(1)' },
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    order: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    acceptanceRate: {
      type: Number,
      default: 0,
    },
    totalSubmissions: {
      type: Number,
      default: 0,
    },
    totalAccepted: {
      type: Number,
      default: 0,
    },
    companies: {
      type: [String],
      default: [],
    },
    submissionsCount: {
      type: String,
      default: '',
    },
    accuracy: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save slug generator
CodingProblemSchema.pre<ICodingProblem>('validate', function (next) {
  if (this.isModified('title') && (!this.slug || this.slug.trim() === '')) {
    this.slug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

// Compound & text search indexes
CodingProblemSchema.index({ isPublished: 1, order: 1, createdAt: -1 });
CodingProblemSchema.index({ isPublished: 1, category: 1, difficulty: 1 });
CodingProblemSchema.index({ isPublished: 1, difficulty: 1, category: 1 });
CodingProblemSchema.index({ isPublished: 1, totalSubmissions: -1 });
CodingProblemSchema.index({ isPublished: 1, acceptanceRate: -1 });
CodingProblemSchema.index({ title: 'text', description: 'text' });

export const CodingProblem = mongoose.model<ICodingProblem>('CodingProblem', CodingProblemSchema);
