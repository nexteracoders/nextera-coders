import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IEnrollment extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  tier: 'free' | 'pro';
  paymentId?: string;
  paymentAmount?: number;
  paymentMethod?: string;
  progress: number;
  completedLessons: Types.ObjectId[];
  lastAccessedLesson?: Types.ObjectId;
  enrolledAt: Date;
  upgradedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EnrollmentSchema = new Schema<IEnrollment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required'],
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'courseId is required'],
      index: true,
    },
    tier: {
      type: String,
      enum: ['free', 'pro'],
      default: 'free',
      index: true,
    },
    paymentId: {
      type: String,
      default: '',
    },
    paymentAmount: {
      type: Number,
      default: 0,
    },
    paymentMethod: {
      type: String,
      default: '',
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    completedLessons: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Lesson',
      },
    ],
    lastAccessedLesson: {
      type: Schema.Types.ObjectId,
      ref: 'Lesson',
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    upgradedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

EnrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });
EnrollmentSchema.index({ userId: 1, progress: 1 });
EnrollmentSchema.index({ userId: 1, updatedAt: -1 });
EnrollmentSchema.index({ courseId: 1, tier: 1 });
EnrollmentSchema.index({ courseId: 1, createdAt: -1 });
EnrollmentSchema.index({ createdAt: 1, completedAt: 1 });

export const Enrollment = mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);
