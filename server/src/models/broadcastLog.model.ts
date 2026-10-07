import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IBroadcastLog extends Document {
  title: string;
  message: string;
  channels: ('email' | 'whatsapp' | 'in_app')[];
  targetAudience: 'all' | 'inactive_10_days' | 'single';
  recipientCount: number;
  emailSuccessCount: number;
  whatsAppLinksGenerated: number;
  inAppCount: number;
  triggeredBy: Types.ObjectId;
  triggeredByName: string;
  presetKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BroadcastLogSchema = new Schema<IBroadcastLog>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    channels: {
      type: [String],
      enum: ['email', 'whatsapp', 'in_app'],
      default: ['email', 'in_app'],
    },
    targetAudience: {
      type: String,
      enum: ['all', 'inactive_10_days', 'single'],
      default: 'all',
    },
    recipientCount: {
      type: Number,
      default: 0,
    },
    emailSuccessCount: {
      type: Number,
      default: 0,
    },
    whatsAppLinksGenerated: {
      type: Number,
      default: 0,
    },
    inAppCount: {
      type: Number,
      default: 0,
    },
    triggeredBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    triggeredByName: {
      type: String,
      default: 'Admin',
    },
    presetKey: {
      type: String,
      default: 'custom',
    },
  },
  {
    timestamps: true,
  }
);

BroadcastLogSchema.index({ createdAt: -1 });

export const BroadcastLog = mongoose.model<IBroadcastLog>('BroadcastLog', BroadcastLogSchema);
