import React, { useState, useEffect } from 'react';
import { Trophy, Plus, Edit2 } from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { AchievementItem } from '../../types/achievement.types';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminDataTable, Column } from '../../components/admin/AdminDataTable';
import { AdminStatusBadge } from '../../components/admin/AdminStatusBadge';
import { Button } from '../../components/ui/Button';

export const AdminAchievementsListPage: React.FC = () => {
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Create / Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<AchievementItem | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Trophy');
  const [category, setCategory] = useState<'Courses' | 'DSA' | 'Quizzes' | 'Consistency' | 'Learning'>('Learning');
  const [requirementType, setRequirementType] = useState('POINTS_EARNED');
  const [requirementValue, setRequirementValue] = useState(100);
  const [points, setPoints] = useState(50);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const res = await adminService.getAchievements();
      setAchievements(res.achievements || []);
    } catch (err) {
      console.error('Failed to load achievements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingAchievement(null);
    setName('');
    setSlug('');
    setDescription('');
    setIcon('Trophy');
    setCategory('Learning');
    setRequirementType('POINTS_EARNED');
    setRequirementValue(100);
    setPoints(50);
    setIsActive(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (ach: AchievementItem) => {
    setEditingAchievement(ach);
    setName(ach.name);
    setSlug(ach.slug);
    setDescription(ach.description);
    setIcon(ach.icon);
    setCategory(ach.category as any);
    setRequirementType(ach.requirementType);
    setRequirementValue(ach.requirementValue);
    setPoints(ach.points);
    setIsActive(ach.isActive !== undefined ? ach.isActive : true);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    try {
      setSaving(true);
      const payload = {
        name,
        slug,
        description,
        icon,
        category,
        requirementType,
        requirementValue: Number(requirementValue),
        points: Number(points),
        isActive,
      };

      if (editingAchievement) {
        await adminService.updateAchievement(editingAchievement.id, payload);
      } else {
        await adminService.createAchievement(payload);
      }
      setModalOpen(false);
      fetchAchievements();
    } catch (err) {
      console.error('Failed to save achievement:', err);
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<AchievementItem>[] = [
    {
      header: 'Badge & Name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{row.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{row.description}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Category',
      accessor: 'category',
      render: (row) => (
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          {row.category}
        </span>
      ),
    },
    {
      header: 'Requirement',
      render: (row) => (
        <span className="text-xs font-mono text-slate-600 dark:text-slate-300">
          {row.requirementType} ({row.requirementValue})
        </span>
      ),
    },
    {
      header: 'Reward',
      render: (row) => (
        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono">+{row.points} XP</span>
      ),
    },
    {
      header: 'Status',
      render: (row) => <AdminStatusBadge status={row.isActive ? 'ACTIVE' : 'INACTIVE'} />,
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Edit Achievement"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <AdminPageHeader
        title="Achievement & Gamification Catalog"
        description="Configure unlockable milestone badges, requirement thresholds, and XP reward economics."
        breadcrumbs={[{ label: 'Achievements' }]}
        action={
          <Button
            onClick={handleOpenCreate}
            leftIcon={<Plus className="w-4 h-4 stroke-[2.5]" />}
            className="w-full sm:w-auto shrink-0 shadow-md shadow-amber-500/20"
          >
            Create Achievement
          </Button>
        }
      />

      <AdminDataTable
        columns={columns}
        data={achievements}
        loading={loading}
        emptyTitle="No achievements found"
        emptyDescription="Create unlockable gamification badges for your students."
        emptyAction={
          <Button onClick={handleOpenCreate} size="md" className="shadow-md shadow-amber-500/20">
            <Plus className="w-4 h-4 stroke-[2.5] mr-1.5" />
            <span>Create Achievement</span>
          </Button>
        }
      />

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {editingAchievement ? 'Edit Achievement' : 'Create New Achievement'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Badge Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!editingAchievement) {
                        setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                      }
                    }}
                    required
                    placeholder="e.g., DSA Veteran"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Slug ID *
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    required
                    placeholder="dsa-veteran"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={2}
                  placeholder="Solve 50 Data Structures & Algorithms challenges."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Courses">Courses</option>
                    <option value="DSA">DSA</option>
                    <option value="Quizzes">Quizzes</option>
                    <option value="Consistency">Consistency</option>
                    <option value="Learning">Learning</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Requirement Type
                  </label>
                  <select
                    value={requirementType}
                    onChange={(e) => setRequirementType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="PROBLEMS_SOLVED">PROBLEMS_SOLVED</option>
                    <option value="COURSE_COMPLETED">COURSE_COMPLETED</option>
                    <option value="FIRST_COURSE">FIRST_COURSE</option>
                    <option value="FIRST_PROBLEM">FIRST_PROBLEM</option>
                    <option value="FIRST_QUIZ">FIRST_QUIZ</option>
                    <option value="PERFECT_SCORE">PERFECT_SCORE</option>
                    <option value="STREAK_DAYS">STREAK_DAYS</option>
                    <option value="POINTS_EARNED">POINTS_EARNED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Requirement Target Value
                  </label>
                  <input
                    type="number"
                    value={requirementValue}
                    onChange={(e) => setRequirementValue(Number(e.target.value))}
                    min={1}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    XP Points Reward
                  </label>
                  <input
                    type="number"
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                    min={0}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="ach-active"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
                />
                <label htmlFor="ach-active" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  Badge active and unlockable by student triggers
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : editingAchievement ? 'Save Changes' : 'Create Achievement'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
