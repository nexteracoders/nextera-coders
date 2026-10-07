export type AchievementCategory =
  | 'Learning'
  | 'Courses'
  | 'Quizzes'
  | 'DSA'
  | 'Coding'
  | 'Projects'
  | 'Consistency';

export interface IAchievementItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  points: number;
  requirementType: string;
  requirementValue: number;
  isUnlocked: boolean;
  unlockedAt: string | null;
  currentProgress: number;
  targetProgress: number;
}

export interface IAchievementStats {
  totalAchievements: number;
  unlockedCount: number;
  lockedCount: number;
  totalPoints: number;
  currentStreak: number;
}

export interface IAchievementListResponse {
  achievements: IAchievementItem[];
  stats: IAchievementStats;
}

export type AchievementItem = IAchievementItem & { isActive?: boolean };
