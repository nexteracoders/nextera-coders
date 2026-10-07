import api from './api';
import { IAchievementListResponse } from '../types/achievement.types';
import { IGamificationSummary } from '../types/gamification.types';

export const achievementService = {
  // Get all achievements with student progress
  async getAchievements(): Promise<IAchievementListResponse> {
    const res = await api.get('/achievements');
    return res.data.data;
  },

  // Get student gamification overview (streak, points, recent badges)
  async getGamificationSummary(): Promise<IGamificationSummary> {
    const res = await api.get('/gamification/summary');
    return res.data.data.summary;
  },

  // Get points transaction history
  async getPointHistory(page: number = 1, limit: number = 20) {
    const res = await api.get(`/gamification/points?page=${page}&limit=${limit}`);
    return res.data.data;
  },
};
