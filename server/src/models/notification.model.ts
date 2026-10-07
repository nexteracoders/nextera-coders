import mongoose, { Document, Schema, Types } from 'mongoose';

export type NotificationType =
  | 'COURSE'
  | 'QUIZ'
  | 'ACHIEVEMENT'
  | 'CERTIFICATE'
  | 'ANNOUNCEMENT'
  | 'SYSTEM'
  | 'LEARNING'
  | 'PAYMENT'
  | 'WELCOME'
  | 'CAREER';

export interface INotification extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  referenceType?: string;
  referenceId?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['COURSE', 'QUIZ', 'ACHIEVEMENT', 'CERTIFICATE', 'ANNOUNCEMENT', 'SYSTEM', 'LEARNING', 'PAYMENT', 'WELCOME', 'CAREER'],
      default: 'SYSTEM',
      required: true,
    },
    link: {
      type: String,
      trim: true,
    },
    referenceType: {
      type: String,
      trim: true,
    },
    referenceId: {
      type: String,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, referenceType: 1, referenceId: 1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
