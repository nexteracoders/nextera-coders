import { Schema, model, Document, Types } from 'mongoose';

export type AnnouncementType = 'GENERAL' | 'COURSE' | 'IMPORTANT' | 'MAINTENANCE' | 'EVENT' | 'SYSTEM';

export interface IAnnouncement {
  title: string;
  message: string;
  type: AnnouncementType;
  link?: string;
  isPublished: boolean;
  publishedAt?: Date;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAnnouncementDocument extends IAnnouncement, Document {
  _id: Types.ObjectId;
}

const AnnouncementSchema = new Schema<IAnnouncementDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['GENERAL', 'COURSE', 'IMPORTANT', 'MAINTENANCE', 'EVENT', 'SYSTEM'],
      default: 'GENERAL',
      index: true,
    },
    link: {
      type: String,
      trim: true,
      default: '',
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

AnnouncementSchema.index({ isPublished: 1, publishedAt: -1 });

export const Announcement = model<IAnnouncementDocument>('Announcement', AnnouncementSchema);
