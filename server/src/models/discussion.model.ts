import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IDiscussionReply {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  authorName: string;
  authorAvatar?: string;
  text: string;
  createdAt: Date;
}

export interface IProblemDiscussion extends Document {
  _id: Types.ObjectId;
  problemId?: Types.ObjectId;
  problemSlug: string;
  userId: Types.ObjectId;
  authorName: string;
  authorAvatar?: string;
  text: string;
  likes: Types.ObjectId[];
  replies: IDiscussionReply[];
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DiscussionReplySchema = new Schema<IDiscussionReply>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    authorName: {
      type: String,
      required: true,
      trim: true,
    },
    authorAvatar: {
      type: String,
      default: '',
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const ProblemDiscussionSchema = new Schema<IProblemDiscussion>(
  {
    problemId: {
      type: Schema.Types.ObjectId,
      ref: 'CodingProblem',
      index: true,
    },
    problemSlug: {
      type: String,
      required: [true, 'Problem slug is required'],
      trim: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    authorName: {
      type: String,
      required: [true, 'Author name is required'],
      trim: true,
    },
    authorAvatar: {
      type: String,
      default: '',
    },
    text: {
      type: String,
      required: [true, 'Discussion comment text is required'],
      trim: true,
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    replies: [DiscussionReplySchema],
    isPinned: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// High-performance compound indexes for finding discussions sorted by votes or recency
ProblemDiscussionSchema.index({ problemSlug: 1, isPinned: -1, createdAt: -1 });

export const ProblemDiscussion = mongoose.model<IProblemDiscussion>(
  'ProblemDiscussion',
  ProblemDiscussionSchema
);
