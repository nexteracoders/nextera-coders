import { Schema, model, Document, Types } from 'mongoose';

export interface IFooterLink {
  column: string; // 'company' | 'explore' | 'tutorials' | 'courses' | custom column
  columnTitle: string; // 'Company' | 'Explore' | 'Tutorials' | 'Courses' | custom title
  title: string;
  url: string;
  badge?: string;
  badgeType?: 'hot' | 'live' | 'free' | 'vip' | 'amber' | 'emerald' | 'cyan' | 'purple' | 'rose' | 'default';
  order: number;
  isActive: boolean;
  isExternal: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFooterLinkDocument extends IFooterLink, Document {
  _id: Types.ObjectId;
}

const FooterLinkSchema = new Schema<IFooterLinkDocument>(
  {
    column: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    columnTitle: {
      type: String,
      required: true,
      trim: true,
      default: 'General',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    badge: {
      type: String,
      trim: true,
      default: '',
    },
    badgeType: {
      type: String,
      enum: ['hot', 'live', 'free', 'vip', 'amber', 'emerald', 'cyan', 'purple', 'rose', 'default'],
      default: 'default',
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isExternal: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const FooterLink = model<IFooterLinkDocument>('FooterLink', FooterLinkSchema);
