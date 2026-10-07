import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ITutorial extends Document {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  thumbnail: string;
  diagramImageUrl?: string;
  track?: string;
  sectionTitle?: string;
  quickFacts?: string;
  keyPoints?: string[];
  codeSnippet?: {
    language: string;
    filename?: string;
    code: string;
    output?: string;
  };
  quiz?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
  practiceProblemLink?: string;
  videoUrl?: string;
  videoDuration?: string;
  videoSource?: string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  type?: 'video' | 'article' | 'both';
  category: string;
  tags: string[];
  author: Types.ObjectId;
  readingTime: number; // minutes
  order?: number;
  isPublished: boolean;
  publishedAt?: Date;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

const TutorialSchema = new Schema<ITutorial>(
  {
    title: {
      type: String,
      required: [true, 'Tutorial title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    excerpt: {
      type: String,
      required: [true, 'Excerpt is required'],
      trim: true,
      maxlength: [500, 'Excerpt cannot exceed 500 characters'],
    },
    content: {
      type: String,
      required: [true, 'Tutorial content is required'],
    },
    thumbnail: {
      type: String,
      default: '',
    },
    diagramImageUrl: {
      type: String,
      default: '',
      trim: true,
    },
    track: {
      type: String,
      default: 'python',
      index: true,
    },
    sectionTitle: {
      type: String,
      default: 'Fundamentals',
      trim: true,
    },
    quickFacts: {
      type: String,
      default: '',
      trim: true,
      maxlength: [1500, 'Quick facts cannot exceed 1500 characters'],
    },
    keyPoints: {
      type: [String],
      default: [],
    },
    codeSnippet: {
      language: { type: String, default: 'python' },
      filename: { type: String, default: '' },
      code: { type: String, default: '' },
      output: { type: String, default: '' },
    },
    quiz: {
      question: { type: String, default: '' },
      options: { type: [String], default: [] },
      correctIndex: { type: Number, default: 0 },
      explanation: { type: String, default: '' },
    },
    practiceProblemLink: {
      type: String,
      default: '',
      trim: true,
    },
    videoUrl: {
      type: String,
      default: '',
      trim: true,
    },
    videoDuration: {
      type: String,
      default: '',
      trim: true,
    },
    videoSource: {
      type: String,
      default: 'YouTube',
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'],
      default: 'All Levels',
    },
    type: {
      type: String,
      enum: ['video', 'article', 'both'],
      default: 'article',
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    readingTime: {
      type: Number,
      default: 5,
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save slug generator, reading time calculator and auto-thumbnail
TutorialSchema.pre<ITutorial>('validate', function (next) {
  if (this.isModified('title') && (!this.slug || this.slug.trim() === '')) {
    this.slug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Calculate approx reading time if content is modified (approx 200 words per minute)
  if (this.isModified('content') && this.content) {
    const wordCount = this.content.trim().split(/\s+/).length;
    this.readingTime = Math.max(1, Math.ceil(wordCount / 200));
  }

  next();
});

TutorialSchema.index({ isPublished: 1, category: 1, publishedAt: -1 });
TutorialSchema.index({ isPublished: 1, track: 1 });
TutorialSchema.index({ title: 'text', excerpt: 'text', content: 'text', tags: 'text' });

export const Tutorial = mongoose.model<ITutorial>('Tutorial', TutorialSchema);
