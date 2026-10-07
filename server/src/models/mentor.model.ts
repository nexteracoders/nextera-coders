import { Schema, model, Document, Types } from 'mongoose';

export interface IMentor {
  name: string;
  role: string;
  exCompanies: string[];
  image: string;
  quoteTitle: string;
  quoteBody: string;
  signature: string;
  experience: string;
  studentsMentored: string;
  placements: string;
  rating: string;
  email?: string;
  phone?: string;
  bio?: string;
  skills?: string[];
  courses?: string[];
  followers?: Types.ObjectId[];
  userId?: Types.ObjectId;
  password?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    x?: string;
    facebook?: string;
    github?: string;
    youtube?: string;
  };
  isPublished: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMentorDocument extends IMentor, Document {
  _id: Types.ObjectId;
}

const MentorSchema = new Schema<IMentorDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    exCompanies: {
      type: [String],
      default: [],
    },
    image: {
      type: String,
      trim: true,
      default: '',
    },
    quoteTitle: {
      type: String,
      required: true,
      trim: true,
    },
    quoteBody: {
      type: String,
      required: true,
      trim: true,
    },
    signature: {
      type: String,
      trim: true,
      default: '',
    },
    experience: {
      type: String,
      trim: true,
      default: '5+ Yrs',
    },
    studentsMentored: {
      type: String,
      trim: true,
      default: '100k+ Learners',
    },
    placements: {
      type: String,
      trim: true,
      default: 'Top Offers',
    },
    rating: {
      type: String,
      trim: true,
      default: '4.95 / 5.0',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    bio: {
      type: String,
      trim: true,
      default: '',
    },
    skills: {
      type: [String],
      default: [],
    },
    courses: {
      type: [String],
      default: [],
    },
    followers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    password: {
      type: String,
      default: '',
    },
    socialLinks: {
      linkedin: { type: String, trim: true, default: '' },
      twitter: { type: String, trim: true, default: '' },
      x: { type: String, trim: true, default: '' },
      facebook: { type: String, trim: true, default: '' },
      github: { type: String, trim: true, default: '' },
      youtube: { type: String, trim: true, default: '' },
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

MentorSchema.index({ isPublished: 1, order: 1 });

export const Mentor = model<IMentorDocument>('Mentor', MentorSchema);
