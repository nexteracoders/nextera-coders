import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICertificate extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  certificateId: string;
  studentName: string;
  courseName: string;
  courseCategory?: string;
  trackType: 'free' | 'pro';
  grade?: string;
  issueDate: Date;
  verificationUrl: string;
  certificateUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const CertificateSchema = new Schema<ICertificate>(
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
    certificateId: {
      type: String,
      required: [true, 'certificateId is required'],
      unique: true,
      trim: true,
    },
    studentName: {
      type: String,
      required: [true, 'studentName is required'],
      trim: true,
    },
    courseName: {
      type: String,
      required: [true, 'courseName is required'],
      trim: true,
    },
    courseCategory: {
      type: String,
      trim: true,
    },
    trackType: {
      type: String,
      enum: ['free', 'pro'],
      default: 'free',
      index: true,
    },
    grade: {
      type: String,
      default: 'Grade A+ (Honors)',
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    verificationUrl: {
      type: String,
      required: true,
    },
    certificateUrl: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

CertificateSchema.index({ userId: 1, courseId: 1 }, { unique: true });
CertificateSchema.index({ createdAt: -1 });

export const Certificate = mongoose.model<ICertificate>('Certificate', CertificateSchema);
