import { Schema, model, Document, Types } from 'mongoose';

export interface ICoupon {
  code: string;
  description?: string;
  discountType: 'percent' | 'flat';
  discountValue: number;
  minOrderValue: number;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  expiresAt?: Date;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICouponDocument extends ICoupon, Document {
  _id: Types.ObjectId;
}

const CouponSchema = new Schema<ICouponDocument>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    discountType: {
      type: String,
      enum: ['percent', 'flat'],
      default: 'percent',
    },
    discountValue: {
      type: Number,
      required: true,
      min: 1,
    },
    minOrderValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxUses: {
      type: Number,
      default: 1000,
      min: 1,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    expiresAt: {
      type: Date,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export const Coupon = model<ICouponDocument>('Coupon', CouponSchema);
