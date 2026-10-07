import mongoose, { Document, Schema, Types } from 'mongoose';

export type ProblemListType = 'favorites' | 'revise_later' | 'hard_questions' | 'custom';

export interface IProblemListItemEntry {
  problemSlug: string;
  problemTitle: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  category?: string;
  addedAt: Date;
  notes?: string;
}

export interface IProblemList extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  isDefault: boolean;
  listType: ProblemListType;
  problems: IProblemListItemEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const ProblemListItemEntrySchema = new Schema<IProblemListItemEntry>(
  {
    problemSlug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    problemTitle: {
      type: String,
      required: true,
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium',
    },
    category: {
      type: String,
      default: 'Algorithms',
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: false }
);

const ProblemListSchema = new Schema<IProblemList>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
    icon: {
      type: String,
      default: 'Bookmark',
    },
    color: {
      type: String,
      default: '#3b82f6',
    },
    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },
    listType: {
      type: String,
      enum: ['favorites', 'revise_later', 'hard_questions', 'custom'],
      default: 'custom',
      index: true,
    },
    problems: [ProblemListItemEntrySchema],
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate list names per user
ProblemListSchema.index({ userId: 1, name: 1 }, { unique: true });
ProblemListSchema.index({ userId: 1, 'problems.problemSlug': 1 });

export const ProblemList = mongoose.model<IProblemList>('ProblemList', ProblemListSchema);
