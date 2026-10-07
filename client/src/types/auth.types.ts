export type UserRole = 'student' | 'admin' | 'sub_admin' | 'mentor';

export interface IUserSubscription {
  plan: 'monthly' | 'yearly' | 'lifetime';
  status: 'active' | 'expired' | 'cancelled';
  startDate: string;
  endDate?: string;
  paymentId?: string;
  amount?: number;
}

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  mentorProfileId?: string;
  role: UserRole;
  profileImage: string;
  profileImages?: string[];
  autoFlipAvatar?: boolean;
  college?: string;
  bio: string;
  skills: string[];
  github: string;
  linkedin: string;
  followersCount?: number;
  followingCount?: number;
  isPro?: boolean;
  subscription?: IUserSubscription;
  learningStreak: number;
  longestStreak?: number;
  totalLearningTime: number;
  points: number;
  badges: string[];
  stats?: {
    enrolledCourses: number;
    completedCourses: number;
    proCoursesCount?: number;
  };
  subAdminCredential?: {
    plainPassword?: string;
    appointedAt?: string;
    appointedBy?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CodingProfileStats {
  codingScore: number;
  totalProblemsSolved: number;
  difficultyBreakdown: {
    school: number;
    basic: number;
    easy: number;
    medium: number;
    hard: number;
  };
  necDailyStreak: number;
  longestNecStreak: number;
  necProblemsSolved: number;
  instituteRank: number;
  articlesPublished: number;
  submissionDateMap: Record<string, number>;
  totalSubmissionsInYear: number;
  recentSolvedProblems: Array<{
    id: string;
    title: string;
    slug: string;
    difficulty: string;
    status: string;
    timeAgo: string;
  }>;
}

export interface PublicUserProfile extends User {
  isFollowing?: boolean;
  isSelf?: boolean;
}

export interface PublicProfileResponse {
  user: PublicUserProfile;
  codingStats: CodingProfileStats;
}

export interface FollowerItem {
  id: string;
  name: string;
  email: string;
  profileImage: string;
  college: string;
  points: number;
  role: UserRole;
  isPro?: boolean;
}

export interface LeaderboardStudent {
  rank: number;
  id: string;
  name: string;
  email: string;
  profileImage: string;
  college: string;
  points: number;
  learningStreak: number;
  isCurrentUser: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface ChangePasswordData {
  currentPassword?: string;
  newPassword: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
}

export interface UpdateProfileData {
  name?: string;
  profileImage?: string;
  profileImages?: string[];
  autoFlipAvatar?: boolean;
  college?: string;
  bio?: string;
  skills?: string[];
  github?: string;
  linkedin?: string;
}
