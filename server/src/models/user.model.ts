import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'student' | 'admin' | 'sub_admin' | 'mentor';

export interface IUserSubscription {
  plan: 'monthly' | 'yearly' | 'lifetime';
  status: 'active' | 'expired' | 'cancelled';
  startDate: Date;
  endDate?: Date;
  paymentId?: string;
  amount?: number;
}

export interface IUserClaimedCoupon {
  code: string;
  discount: number;
  title: string;
  unlockedAt: Date;
}

export interface IUserSwagOrder {
  id: string;
  rewardId: string;
  rewardTitle: string;
  coinsCost: number;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  status: 'Processing' | 'Shipped' | 'Delivered';
  orderedAt: Date;
  trackingNumber: string;
}

export interface ISubAdminCredential {
  plainPassword?: string;
  appointedAt?: Date;
  appointedBy?: string;
  lastPasswordChangedAt?: Date;
  initialRoleSource?: 'student' | 'mentor' | 'direct';
}

export interface IUser {
  name: string;
  email: string;
  password?: string;
  profileImage: string;
  profileImages?: string[];
  autoFlipAvatar?: boolean;
  role: UserRole;
  mentorProfileId?: mongoose.Types.ObjectId;
  college?: string;
  bio: string;
  skills: string[];
  github: string;
  linkedin: string;
  phone?: string;
  followers: mongoose.Types.ObjectId[];
  following: mongoose.Types.ObjectId[];
  enrolledCourses: mongoose.Types.ObjectId[];
  completedCourses: mongoose.Types.ObjectId[];
  isPro: boolean;
  subscription?: IUserSubscription;
  learningStreak: number;
  longestStreak: number;
  lastActivityDate?: Date;
  lastPotdClaimDate?: Date;
  solvedPotdDates?: string[];
  lastRetentionNotificationSentAt?: Date;
  totalLearningTime: number;
  points: number;
  totalPoints: number;
  badges: string[];
  unlockedCoupons: IUserClaimedCoupon[];
  unlockedCourses: string[];
  swagOrders: IUserSwagOrder[];
  isActive: boolean;
  subAdminCredential?: ISubAdminCredential;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  passwordResetOtp?: string;
  passwordResetOtpExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SanitizedUser {
  id: string;
  name: string;
  email: string;
  profileImage: string;
  profileImages?: string[];
  autoFlipAvatar?: boolean;
  role: UserRole;
  isSubAdmin?: boolean;
  mentorProfileId?: string;
  college?: string;
  bio: string;
  skills: string[];
  github: string;
  linkedin: string;
  phone?: string;
  followersCount: number;
  followingCount: number;
  isPro: boolean;
  subscription?: IUserSubscription;
  learningStreak: number;
  longestStreak: number;
  lastActivityDate?: Date;
  lastPotdClaimDate?: Date;
  solvedPotdDates?: string[];
  lastRetentionNotificationSentAt?: Date;
  totalLearningTime: number;
  points: number;
  totalPoints: number;
  badges: string[];
  unlockedCoupons: IUserClaimedCoupon[];
  unlockedCourses: string[];
  swagOrders: IUserSwagOrder[];
  isActive: boolean;
  subAdminCredential?: ISubAdminCredential;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends IUser, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
  toSanitizedUser(): SanitizedUser;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    profileImage: {
      type: String,
      default: '',
    },
    profileImages: {
      type: [String],
      default: [],
    },
    autoFlipAvatar: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: {
        values: ['student', 'admin', 'sub_admin', 'mentor'],
        message: '{VALUE} is not a valid role',
      },
      default: 'student',
      index: true,
    },
    mentorProfileId: {
      type: Schema.Types.ObjectId,
      ref: 'Mentor',
    },
    college: {
      type: String,
      default: '',
      trim: true,
    },
    bio: {
      type: String,
      default: '',
      maxlength: [500, 'Bio cannot exceed 500 characters'],
    },
    skills: {
      type: [String],
      default: [],
    },
    github: {
      type: String,
      default: '',
      trim: true,
    },
    linkedin: {
      type: String,
      default: '',
      trim: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    followers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    following: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    enrolledCourses: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Course',
      },
    ],
    completedCourses: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Course',
      },
    ],
    isPro: {
      type: Boolean,
      default: false,
      index: true,
    },
    subscription: {
      plan: {
        type: String,
        enum: ['monthly', 'yearly', 'lifetime', 'standard', 'pro', 'elite'],
      },
      startDate: Date,
      endDate: Date,
      paymentId: String,
      amount: Number,
      status: {
        type: String,
        enum: ['active', 'expired', 'cancelled'],
        default: 'active',
      },
    },
    learningStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastActivityDate: {
      type: Date,
    },
    lastPotdClaimDate: {
      type: Date,
    },
    solvedPotdDates: {
      type: [String],
      default: [],
    },
    lastRetentionNotificationSentAt: {
      type: Date,
    },
    totalLearningTime: {
      type: Number,
      default: 0,
      min: 0,
    },
    points: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    badges: {
      type: [String],
      default: [],
    },
    unlockedCoupons: [
      {
        code: { type: String, required: true },
        discount: { type: Number, required: true },
        title: { type: String, required: true },
        unlockedAt: { type: Date, default: Date.now },
      },
    ],
    unlockedCourses: {
      type: [String],
      default: [],
    },
    swagOrders: [
      {
        id: { type: String, required: true },
        rewardId: { type: String, default: 'swag-item' },
        rewardTitle: { type: String, default: 'NEC Merchandise' },
        coinsCost: { type: Number, default: 0 },
        fullName: { type: String, default: 'Student' },
        phone: { type: String, default: '' },
        address: { type: String, default: '' },
        city: { type: String, default: '' },
        pincode: { type: String, default: '' },
        status: { type: String, enum: ['Processing', 'Shipped', 'Delivered'], default: 'Processing' },
        orderedAt: { type: Date, default: Date.now },
        trackingNumber: { type: String, default: '' },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    subAdminCredential: {
      plainPassword: { type: String, default: '' },
      appointedAt: { type: Date },
      appointedBy: { type: String, default: 'NextEra Coders' },
      lastPasswordChangedAt: { type: Date },
      initialRoleSource: { type: String, default: 'student' },
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    passwordResetOtp: {
      type: String,
      select: false,
    },
    passwordResetOtpExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// High-performance compound indexes for leaderboards, user search & analytics
UserSchema.index({ college: 1, points: -1, learningStreak: -1 });
UserSchema.index({ points: -1, learningStreak: -1 });
UserSchema.index({ role: 1, createdAt: -1 });
UserSchema.index({ role: 1, lastActivityDate: -1 });

// Hash password before saving if modified
UserSchema.pre<IUserDocument>('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Return sanitized user representation
UserSchema.methods.toSanitizedUser = function (): SanitizedUser {
  const isSubscriptionActive = Boolean(
    this.subscription &&
    this.subscription.plan &&
    this.subscription.status === 'active' &&
    this.subscription.startDate &&
    (!this.subscription.endDate || new Date(this.subscription.endDate) > new Date())
  );

  const isProUser = Boolean(
    this.role === 'admin' ||
    (this.isPro && isSubscriptionActive)
  );

  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    profileImage: this.profileImage || '',
    profileImages: this.profileImages || [],
    autoFlipAvatar: Boolean(this.autoFlipAvatar),
    role: this.role,
    isSubAdmin: this.role === 'sub_admin',
    mentorProfileId: this.mentorProfileId?.toString(),
    college: this.college || '',
    bio: this.bio || '',
    skills: this.skills || [],
    github: this.github || '',
    linkedin: this.linkedin || '',
    phone: this.phone || '',
    followersCount: this.followers?.length || 0,
    followingCount: this.following?.length || 0,
    isPro: isProUser,
    subscription: isSubscriptionActive ? this.subscription : undefined,
    learningStreak: this.learningStreak || 0,
    longestStreak: this.longestStreak || 0,
    lastActivityDate: this.lastActivityDate,
    totalLearningTime: this.totalLearningTime || 0,
    points: this.points || 0,
    totalPoints: this.totalPoints || 0,
    badges: this.badges || [],
    unlockedCoupons: this.unlockedCoupons || [],
    unlockedCourses: this.unlockedCourses || [],
    swagOrders: this.swagOrders || [],
    isActive: this.isActive !== undefined ? this.isActive : true,
    subAdminCredential: this.role === 'sub_admin' ? this.subAdminCredential : undefined,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const User: Model<IUserDocument> = mongoose.model<IUserDocument>('User', UserSchema);
