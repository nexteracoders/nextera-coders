import { Schema, model, Document, Types } from 'mongoose';

export interface IInterviewDetails {
  interviewDate: string;
  interviewTime: string;
  interviewMode: string;
  meetingLink: string;
  panelists: string;
  roundType: string;
  duration?: string;
  agendaOrNotes?: string;
  scheduledAt?: Date;
}

export interface ICareerApplication {
  jobId: string;
  jobTitle: string;
  department: string;
  roleType: string;
  fullName: string;
  email: string;
  phone: string;
  linkedin?: string;
  github?: string;
  experienceYears: string;
  coverNote?: string;
  resumeFileName: string;
  resumeFileSize?: string;
  resumeBase64OrUrl: string;
  status: 'Under Review' | 'Shortlisted' | 'Interview Scheduled' | 'Offered' | 'Hired' | 'Rejected';
  adminRating?: number;
  adminNotes?: string;
  interviewDetails?: IInterviewDetails;
  appliedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICareerApplicationDocument extends ICareerApplication, Document {
  _id: Types.ObjectId;
}

const CareerApplicationSchema = new Schema<ICareerApplicationDocument>(
  {
    jobId: {
      type: String,
      required: true,
      index: true,
    },
    jobTitle: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
      default: 'Engineering',
    },
    roleType: {
      type: String,
      required: true,
      trim: true,
      default: 'Job',
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    linkedin: {
      type: String,
      trim: true,
      default: '',
    },
    github: {
      type: String,
      trim: true,
      default: '',
    },
    experienceYears: {
      type: String,
      trim: true,
      default: 'Fresher / 1+ Years',
    },
    coverNote: {
      type: String,
      trim: true,
      default: '',
    },
    resumeFileName: {
      type: String,
      required: true,
      trim: true,
    },
    resumeFileSize: {
      type: String,
      trim: true,
      default: '',
    },
    resumeBase64OrUrl: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Under Review', 'Shortlisted', 'Interview Scheduled', 'Offered', 'Hired', 'Rejected'],
      default: 'Under Review',
      index: true,
    },
    adminRating: {
      type: Number,
      default: 0,
    },
    adminNotes: {
      type: String,
      trim: true,
      default: '',
    },
    interviewDetails: {
      interviewDate: { type: String, default: '' },
      interviewTime: { type: String, default: '' },
      interviewMode: { type: String, default: 'Google Meet' },
      meetingLink: { type: String, default: '' },
      panelists: { type: String, default: '' },
      roundType: { type: String, default: 'Technical Round 1' },
      duration: { type: String, default: '45 Minutes' },
      agendaOrNotes: { type: String, default: '' },
      scheduledAt: { type: Date },
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

CareerApplicationSchema.index({ status: 1, createdAt: -1 });

export const CareerApplication = model<ICareerApplicationDocument>('CareerApplication', CareerApplicationSchema);
