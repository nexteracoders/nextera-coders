import { Schema, model, Document, Types } from 'mongoose';

export interface IPaymentRequest {
  userId?: Types.ObjectId;
  userEmail: string;
  userName: string;
  type: 'course' | 'pro_one';
  courseId?: string;
  courseTitle?: string;
  planId?: 'monthly' | 'yearly' | 'lifetime';
  amount: number;
  paymentMethod: string;
  transactionId: string; // UTR or Ref number
  payerUpiId?: string;
  screenshotUrl?: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPaymentRequestDocument extends IPaymentRequest, Document {
  _id: Types.ObjectId;
}

const PaymentRequestSchema = new Schema<IPaymentRequestDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    userEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['course', 'pro_one'],
      required: true,
      index: true,
    },
    courseId: {
      type: String,
      trim: true,
    },
    courseTitle: {
      type: String,
      trim: true,
    },
    planId: {
      type: String,
      enum: ['monthly', 'yearly', 'lifetime'],
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      default: 'UPI_QR',
      trim: true,
    },
    transactionId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    payerUpiId: {
      type: String,
      trim: true,
    },
    screenshotUrl: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const PaymentRequest = model<IPaymentRequestDocument>(
  'PaymentRequest',
  PaymentRequestSchema
);
