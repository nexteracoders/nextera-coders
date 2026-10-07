import { Schema, model, Document, Types } from 'mongoose';

export interface IReward {
  id: string; // unique slug e.g. coupon-10, swag-hoodie, course-dsa
  title: string;
  category: 'coupon' | 'course' | 'swag' | 'perk';
  coinsCost: number;
  description: string;
  image: string; // URL, Base64 data URL, asset path, or Emoji
  tag?: string;
  couponCode?: string;
  discountPercent?: number;
  courseSlug?: string;
  inStock: boolean;
  stockCount?: number;
  isFeatured: boolean;
  originalValue?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type IRewardDocument = Document<Types.ObjectId> & Omit<IReward, 'id'> & {
  id: string;
  _id: Types.ObjectId;
};

const RewardSchema = new Schema<IRewardDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['coupon', 'course', 'swag', 'perk'],
      required: true,
      index: true,
    },
    coinsCost: {
      type: Number,
      required: true,
      min: 0,
      default: 100,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    image: {
      type: String,
      required: true,
      default: '🎁',
    },
    tag: {
      type: String,
      trim: true,
    },
    couponCode: {
      type: String,
      trim: true,
    },
    discountPercent: {
      type: Number,
    },
    courseSlug: {
      type: String,
      trim: true,
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    stockCount: {
      type: Number,
      default: 100,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    originalValue: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

RewardSchema.index({ category: 1, isFeatured: -1, coinsCost: 1 });

export const Reward = model<IRewardDocument>('Reward', RewardSchema);
