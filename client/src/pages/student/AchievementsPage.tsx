import React, { useState, useEffect } from 'react';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { achievementService } from '../../services/achievement.service';
import { IAchievementItem, IAchievementStats } from '../../types/achievement.types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import {
  Trophy,
  Flame,
  Zap,
  Award,
  GraduationCap,
  Code,
  Compass,
  Crown,
  CheckCircle,
  CheckCheck,
  Sparkles,
  Calendar,
  Target,
  Lock,
} from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  Trophy: <Trophy className="w-6 h-6" />,
  Flame: <Flame className="w-6 h-6" />,
  Zap: <Zap className="w-6 h-6" />,
  Award: <Award className="w-6 h-6" />,
  GraduationCap: <GraduationCap className="w-6 h-6" />,
  Code: <Code className="w-6 h-6" />,
  Compass: <Compass className="w-6 h-6" />,
  Crown: <Crown className="w-6 h-6" />,
  CheckCircle: <CheckCircle className="w-6 h-6" />,
  CheckCheck: <CheckCheck className="w-6 h-6" />,
  Sparkles: <Sparkles className="w-6 h-6" />,
  Calendar: <Calendar className="w-6 h-6" />,
  Target: <Target className="w-6 h-6" />,
};

export const AchievementsPage: React.FC = () => {
  useDocumentTitle('Student Achievements & Gamification — NextEra Coders');

  const [achievements, setAchievements] = useState<IAchievementItem[]>([]);
  const [stats, setStats] = useState<IAchievementStats | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await achievementService.getAchievements();
      setAchievements(data.achievements);
      setStats(data.stats);
    } catch (err: any) {
      setError(err.message || 'Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  const categories = ['All', 'Courses', 'DSA', 'Quizzes', 'Consistency', 'Learning'];

  const filteredAchievements = achievements.filter(
    (a) => selectedCategory === 'All' || a.category === selectedCategory
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header & Stats Banner */}
      <div className="space-y-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-mono font-medium mb-2">
            <Trophy className="w-3.5 h-3.5" />
            <span>Gamification & Milestones</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Badges & Achievements
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Unlock trophies, level up your coding streak, and earn experience points (XP) for every milestone.
          </p>
        </div>

        {/* Stats Strip */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card variant="elevated" className="p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Total Points</span>
                <p className="text-xl font-black text-slate-900 dark:text-white">{stats.totalPoints} XP</p>
              </div>
            </Card>

            <Card variant="elevated" className="p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Daily Streak</span>
                <p className="text-xl font-black text-slate-900 dark:text-white">{stats.currentStreak} Days</p>
              </div>
            </Card>

            <Card variant="elevated" className="p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Badges Unlocked</span>
                <p className="text-xl font-black text-slate-900 dark:text-white">{stats.unlockedCount} / {stats.totalAchievements}</p>
              </div>
            </Card>

            <Card variant="elevated" className="p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Completion</span>
                <p className="text-xl font-black text-slate-900 dark:text-white">
                  {stats.totalAchievements > 0 ? Math.round((stats.unlockedCount / stats.totalAchievements) * 100) : 0}%
                </p>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all ${
              selectedCategory === cat
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-dark-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-850'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} variant="elevated" className="h-48 flex flex-col justify-between">
              <CardHeader>
                <Skeleton className="h-10 w-10 rounded-xl mb-2" />
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-3 w-full" />
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <ErrorState title="Error Loading Achievements" message={error} onRetry={fetchAchievements} />
      )}

      {/* Achievements Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAchievements.map((ach) => (
            <Card
              key={ach.id}
              variant="elevated"
              className={`flex flex-col justify-between transition-all duration-200 relative overflow-hidden ${
                ach.isUnlocked
                  ? 'border-amber-500/30 dark:border-amber-500/30 bg-gradient-to-br from-white via-white to-amber-500/5 dark:from-dark-900 dark:via-dark-900 dark:to-amber-950/10 shadow-sm'
                  : 'border-slate-200/70 dark:border-dark-800 bg-white/60 dark:bg-dark-900/60 opacity-80'
              }`}
            >
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
                      ach.isUnlocked
                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        : 'bg-slate-100 dark:bg-dark-800 text-slate-400'
                    }`}
                  >
                    {iconMap[ach.icon] || <Award className="w-6 h-6" />}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      +{ach.points} XP
                    </span>
                    {ach.isUnlocked ? (
                      <Badge variant="success" size="sm" className="font-mono">
                        Unlocked
                      </Badge>
                    ) : (
                      <span className="p-1 rounded-md bg-slate-100 dark:bg-dark-800 text-slate-400">
                        <Lock className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400">
                    {ach.category}
                  </span>
                  <CardTitle className={`text-base font-bold mt-0.5 ${ach.isUnlocked ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                    {ach.name}
                  </CardTitle>
                  <CardDescription className="text-xs mt-1 leading-relaxed">
                    {ach.description}
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {ach.isUnlocked ? (
                  <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-dark-800">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Unlocked on {new Date(ach.unlockedAt!).toLocaleDateString()}</span>
                  </div>
                ) : (
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-dark-800">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>Progress</span>
                      <span>
                        {ach.currentProgress} / {ach.targetProgress}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-dark-800 overflow-hidden">
                      <div
                        className="h-full bg-brand-500 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.round((ach.currentProgress / ach.targetProgress) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
