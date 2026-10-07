import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IUserAchievement extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  achievementId: Types.ObjectId;
  unlockedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserAchievementSchema = new Schema<IUserAchievement>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required'],
      index: true,
    },
    achievementId: {
      type: Schema.Types.ObjectId,
      ref: 'Achievement',
      required: [true, 'achievementId is required'],
      index: true,
    },
    unlockedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

UserAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });
UserAchievementSchema.index({ userId: 1, unlockedAt: -1 });

export const UserAchievement = mongoose.model<IUserAchievement>(
  'UserAchievement',
  UserAchievementSchema
);
