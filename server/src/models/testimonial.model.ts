import { Schema, model, Document, Types } from 'mongoose';

export interface ITestimonial {
  name: string;
  role: string;
  company?: string;
  avatar?: string;
  content: string;
  rating: number;
  isPublished: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITestimonialDocument extends ITestimonial, Document {
  _id: Types.ObjectId;
}

const TestimonialSchema = new Schema<ITestimonialDocument>(
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
    company: {
      type: String,
      trim: true,
      default: '',
    },
    avatar: {
      type: String,
      trim: true,
      default: '',
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      default: 5,
      min: 1,
      max: 5,
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

TestimonialSchema.index({ isPublished: 1, order: 1 });

export const Testimonial = model<ITestimonialDocument>('Testimonial', TestimonialSchema);
