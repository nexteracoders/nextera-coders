import mongoose, { Document, Schema, Types } from 'mongoose';

export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';

export interface ICourseInstructor {
  name: string;
  role: string;
  avatar?: string;
  bio?: string;
}

export interface ICourse extends Document {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  thumbnail: string;
  category: string;
  level: CourseLevel;
  instructor: ICourseInstructor;
  duration: string;
  tags: string[];
  requirements: string[];
  whatYouWillLearn: string[];
  originalPrice: number;
  proPrice: number;
  freePrice: number;
  isProAvailable: boolean;
  isIncludedInMembership: boolean;
  includedInProPlans: ('monthly' | 'yearly' | 'lifetime')[];
  isFeatured: boolean;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

const CourseSchema = new Schema<ICourse>(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    slug: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Course description is required'],
      trim: true,
    },
    shortDescription: {
      type: String,
      required: [true, 'Short description is required'],
      trim: true,
      maxlength: [300, 'Short description cannot exceed 300 characters'],
    },
    thumbnail: {
      type: String,
      default: '',
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true,
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'],
      default: 'All Levels',
      index: true,
    },
    instructor: {
      name: { type: String, required: true, trim: true },
      role: { type: String, required: true, trim: true },
      avatar: { type: String, default: '' },
      bio: { type: String, default: '' },
    },
    duration: {
      type: String,
      default: '0 Hours',
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    requirements: {
      type: [String],
      default: [],
    },
    whatYouWillLearn: {
      type: [String],
      default: [],
    },
    originalPrice: {
      type: Number,
      default: 9999,
    },
    proPrice: {
      type: Number,
      default: 1999,
      min: [0, 'Pro price cannot be less than 0'],
      max: [99999, 'Pro price cannot exceed 99999'],
    },
    freePrice: {
      type: Number,
      default: 0,
    },
    isProAvailable: {
      type: Boolean,
      default: true,
    },
    isIncludedInMembership: {
      type: Boolean,
      default: true,
      index: true,
    },
    includedInProPlans: {
      type: [String],
      enum: ['monthly', 'yearly', 'lifetime'],
      default: ['monthly', 'yearly', 'lifetime'],
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save slug generator
CourseSchema.pre<ICourse>('save', async function (next) {
  if (!this.slug || this.isModified('title')) {
    let baseSlug = slugify(this.title);
    let candidateSlug = baseSlug;
    let count = 1;

    // Ensure uniqueness
    const CourseModel = mongoose.models.Course as mongoose.Model<ICourse>;
    if (CourseModel) {
      while (await CourseModel.findOne({ slug: candidateSlug, _id: { $ne: this._id } })) {
        candidateSlug = `${baseSlug}-${count}`;
        count++;
      }
    }
    this.slug = candidateSlug;
  }
  next();
});

// Search & compound indexes
CourseSchema.index({ title: 'text', shortDescription: 'text', tags: 'text' });
CourseSchema.index({ isPublished: 1, isFeatured: 1, createdAt: -1 });

export const Course = mongoose.model<ICourse>('Course', CourseSchema);
