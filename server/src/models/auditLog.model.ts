import { Schema, model, Document, Types } from 'mongoose';

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'PUBLISH'
  | 'UNPUBLISH'
  | 'ACTIVATE'
  | 'DEACTIVATE'
  | 'BROADCAST';

export type AuditResourceType =
  | 'COURSE'
  | 'MODULE'
  | 'LESSON'
  | 'QUIZ'
  | 'PROBLEM'
  | 'PROJECT'
  | 'TUTORIAL'
  | 'ANNOUNCEMENT'
  | 'FAQ'
  | 'TESTIMONIAL'
  | 'MENTOR'
  | 'STUDENT'
  | 'ACHIEVEMENT'
  | 'SETTINGS'
  | 'REWARD';

export interface IAuditLog {
  adminId: Types.ObjectId;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId?: string;
  resourceTitle?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  createdAt: Date;
}

export interface IAuditLogDocument extends IAuditLog, Document {
  _id: Types.ObjectId;
}

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    resourceType: {
      type: String,
      required: true,
      index: true,
    },
    resourceId: {
      type: String,
      trim: true,
    },
    resourceTitle: {
      type: String,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

AuditLogSchema.index({ createdAt: -1 });

export const AuditLog = model<IAuditLogDocument>('AuditLog', AuditLogSchema);
