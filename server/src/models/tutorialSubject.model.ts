import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ITutorialSubject extends Document {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  shortTitle?: string;
  category: string;
  iconName: string;
  description: string;
  order: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TutorialSubjectSchema = new Schema<ITutorialSubject>(
  {
    title: {
      type: String,
      required: [true, 'Subject title is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    shortTitle: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      required: [true, 'Subject category is required'],
      trim: true,
      default: 'Core Computer Science',
      index: true,
    },
    iconName: {
      type: String,
      default: 'BookOpen',
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-validate slug formatting
TutorialSubjectSchema.pre<ITutorialSubject>('validate', function (next) {
  if (this.isModified('title') && (!this.slug || this.slug.trim() === '')) {
    this.slug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  if (!this.shortTitle) {
    this.shortTitle = this.title;
  }
  next();
});

export const TutorialSubject = mongoose.model<ITutorialSubject>(
  'TutorialSubject',
  TutorialSubjectSchema
);
