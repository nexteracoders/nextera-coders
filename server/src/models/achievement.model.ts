import mongoose, { Document, Schema, Types } from 'mongoose';

export type AchievementCategory =
  | 'Learning'
  | 'Courses'
  | 'Quizzes'
  | 'DSA'
  | 'Coding'
  | 'Projects'
  | 'Consistency';

export type AchievementRequirementType =
  | 'PROBLEMS_SOLVED'
  | 'FIRST_COURSE'
  | 'FIRST_QUIZ'
  | 'FIRST_PROBLEM'
  | 'COURSE_COMPLETED'
  | 'PERFECT_SCORE'
  | 'STREAK_DAYS'
  | 'PROJECT_VIEW'
  | 'POINTS_EARNED';

export interface IAchievement extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  requirementType: AchievementRequirementType;
  requirementValue: number;
  points: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AchievementSchema = new Schema<IAchievement>(
  {
    name: {
      type: String,
      required: [true, 'Achievement name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Achievement slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    icon: {
      type: String,
      default: 'Award',
      trim: true,
    },
    category: {
      type: String,
      enum: ['Learning', 'Courses', 'Quizzes', 'DSA', 'Coding', 'Projects', 'Consistency'],
      default: 'Learning',
      required: true,
      index: true,
    },
    requirementType: {
      type: String,
      enum: [
        'PROBLEMS_SOLVED',
        'FIRST_COURSE',
        'FIRST_QUIZ',
        'FIRST_PROBLEM',
        'COURSE_COMPLETED',
        'PERFECT_SCORE',
        'STREAK_DAYS',
        'PROJECT_VIEW',
        'POINTS_EARNED',
      ],
      required: true,
      index: true,
    },
    requirementValue: {
      type: Number,
      default: 1,
      min: 1,
    },
    points: {
      type: Number,
      default: 50,
      min: 0,
    },
    isActive: {
      type: booleanType(),
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

function booleanType() {
  return Boolean;
}

AchievementSchema.index({ category: 1, isActive: 1 });
AchievementSchema.index({ requirementType: 1, isActive: 1 });

export const Achievement = mongoose.model<IAchievement>('Achievement', AchievementSchema);
