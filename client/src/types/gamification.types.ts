export interface IPointTransactionItem {
  id: string;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
}

export interface IGamificationSummary {
  points: number;
  totalPoints: number;
  learningStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  unlockedCount: number;
  totalAchievements: number;
  recentAchievements: {
    id: string;
    name: string;
    slug: string;
    description: string;
    icon: string;
    category: string;
    points: number;
    unlockedAt: string;
  }[];
  recentTransactions: IPointTransactionItem[];
}
