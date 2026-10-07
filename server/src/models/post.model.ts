import mongoose, { Schema, Document, Types } from 'mongoose';

export type PostCategory = 'review' | 'problem' | 'project' | 'general';

export interface IPostComment {
  _id: Types.ObjectId;
  author: Types.ObjectId;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: Date;
}

export interface IPostReport {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  userName: string;
  reason: string;
  details?: string;
  createdAt: Date;
}

export interface IPost extends Document {
  _id: Types.ObjectId;
  author: Types.ObjectId;
  authorName: string;
  authorEmail: string;
  authorAvatar?: string;
  authorCollege?: string;
  title: string;
  content: string;
  category: PostCategory;
  rating?: number; // 1 to 5, primarily for 'review'
  images: string[]; // Base64 data URLs or links
  likes: Types.ObjectId[];
  comments: IPostComment[];
  isPinned: boolean;
  reports: IPostReport[];
  reportsCount: number;
  isFlagged: boolean;
  autoHiddenAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PostCommentSchema = new Schema<IPostComment>(
  {
    author: {
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
    content: {
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

const PostReportSchema = new Schema<IPostReport>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    details: {
      type: String,
      trim: true,
      default: '',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const PostSchema = new Schema<IPost>(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author user ID is required'],
      index: true,
    },
    authorName: {
      type: String,
      required: [true, 'Author name is required'],
      trim: true,
    },
    authorEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    authorAvatar: {
      type: String,
      default: '',
    },
    authorCollege: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      required: [true, 'Post title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    content: {
      type: String,
      required: [true, 'Post content is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['review', 'problem', 'project', 'general'],
      default: 'general',
      index: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: undefined,
    },
    images: {
      type: [String],
      default: [],
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    comments: [PostCommentSchema],
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },
    reports: [PostReportSchema],
    reportsCount: {
      type: Number,
      default: 0,
      index: true,
    },
    isFlagged: {
      type: Boolean,
      default: false,
      index: true,
    },
    autoHiddenAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// High-speed sorting & filtering indexes
PostSchema.index({ createdAt: -1 });
PostSchema.index({ category: 1, createdAt: -1 });
PostSchema.index({ author: 1, createdAt: -1 });
PostSchema.index({ isFlagged: 1, reportsCount: -1 });

export const Post = mongoose.model<IPost>('Post', PostSchema);
