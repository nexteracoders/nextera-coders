import { Schema, model, Document, Types } from 'mongoose';

export interface IFAQ {
  question: string;
  answer: string;
  category: string;
  order: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFAQDocument extends IFAQ, Document {
  _id: Types.ObjectId;
}

const FAQSchema = new Schema<IFAQDocument>(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      default: 'General',
      index: true,
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

FAQSchema.index({ isPublished: 1, order: 1 });

export const FAQ = model<IFAQDocument>('FAQ', FAQSchema);
