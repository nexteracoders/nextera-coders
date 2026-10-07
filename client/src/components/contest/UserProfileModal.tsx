import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CoderProfile } from '../../services/contest.service';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import {
  Trophy,
  Flame,
  Star,
  GraduationCap,
  MapPin,
  CheckCircle2,
  Code2,
  TrendingUp,
  ExternalLink,
  Github,
  Linkedin,
  FileText,
  User,
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: CoderProfile | null;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
}) => {
  const navigate = useNavigate();

  if (!profile) return null;

  const totalSolvedCount =
    profile.totalSolved.easy + profile.totalSolved.medium + profile.totalSolved.hard;

  const handleNavigateFullProfile = () => {
    onClose();
    navigate(`/profile/${profile.userId || profile.username}`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Coder Profile"
      maxWidth="md"
    >
      <div className="space-y-6 text-slate-200">
        
        {/* Top Header Card - Clickable to open full profile */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-amber-500/30 flex items-start gap-4">
          <div
            onClick={handleNavigateFullProfile}
            className="relative shrink-0 cursor-pointer group"
            title="Click to view full profile"
          >
            <img
              src={profile.avatar}
              alt={profile.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500/60 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform"
            />
            <div className="absolute -bottom-2 -right-1 px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-mono font-black text-[10px] shadow">
              #{profile.rank}
            </div>
          </div>

          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3
                onClick={handleNavigateFullProfile}
                className="text-base sm:text-lg font-bold text-white truncate cursor-pointer hover:text-amber-400 transition-colors flex items-center gap-1.5"
              >
                <span>{profile.name}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-60 hover:opacity-100" />
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/30 shrink-0">
                {profile.badge}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <p className="text-xs text-brand-400 font-mono">@{profile.username}</p>
              
              {/* GitHub & LinkedIn Social Badges */}
              <div className="flex items-center gap-1.5">
                <a
                  href={profile.github || `https://github.com/${profile.username}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  title="GitHub Profile"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Github className="w-3 h-3" />
                </a>
                <a
                  href={profile.linkedin || `https://linkedin.com/in/${profile.username}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 rounded-md bg-sky-950/60 hover:bg-sky-900/80 text-sky-400 hover:text-sky-300 border border-sky-800/40 transition-colors"
                  title="LinkedIn Profile"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Linkedin className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400 pt-0.5">
              <span className="flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate">{profile.college}</span>
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{profile.country}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-100 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            "{profile.bio}"
          </p>
        )}

        {/* 4 Stats Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-center">
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase flex items-center justify-center gap-1">
              <TrendingUp className="w-3 h-3 text-amber-500" /> Contest Rating
            </div>
            <div className="text-lg font-black text-amber-500 dark:text-amber-400 mt-0.5">
              {profile.globalRating}
            </div>
            <div className="text-[9px] text-slate-400">Global #{profile.globalRank}</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Solved
            </div>
            <div className="text-lg font-black text-emerald-500 dark:text-emerald-400 mt-0.5">
              {totalSolvedCount}
            </div>
            <div className="text-[9px] text-slate-400">Problems</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase flex items-center justify-center gap-1">
              <Flame className="w-3 h-3 text-orange-500 fill-orange-500" /> Streak
            </div>
            <div className="text-lg font-black text-orange-500 dark:text-orange-400 mt-0.5">
              {profile.streak}d
            </div>
            <div className="text-[9px] text-slate-400">Active Days</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase flex items-center justify-center gap-1">
              <Trophy className="w-3 h-3 text-yellow-500" /> Prize Won
            </div>
            <div className="text-lg font-black text-yellow-500 dark:text-yellow-400 mt-0.5">
              +{profile.coinsWon}🪙
            </div>
            <div className="text-[9px] text-slate-400">NEC Coins</div>
          </div>
        </div>

        {/* Problem Solving Breakdown Bars */}
        <div className="space-y-2.5 p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs">
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-bold">
            <span className="flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-brand-500" /> Difficulty Distribution
            </span>
            <span>{totalSolvedCount} Total Solved</span>
          </div>

          {/* Easy */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-emerald-500">Easy ({profile.totalSolved.easy})</span>
              <span className="text-slate-400">
                {Math.round((profile.totalSolved.easy / totalSolvedCount) * 100)}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-300 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${(profile.totalSolved.easy / totalSolvedCount) * 100}%` }}
              />
            </div>
          </div>

          {/* Medium */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-amber-500">Medium ({profile.totalSolved.medium})</span>
              <span className="text-slate-400">
                {Math.round((profile.totalSolved.medium / totalSolvedCount) * 100)}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-300 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${(profile.totalSolved.medium / totalSolvedCount) * 100}%` }}
              />
            </div>
          </div>

          {/* Hard */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-rose-500">Hard ({profile.totalSolved.hard})</span>
              <span className="text-slate-400">
                {Math.round((profile.totalSolved.hard / totalSolvedCount) * 100)}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-300 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded-full"
                style={{ width: `${(profile.totalSolved.hard / totalSolvedCount) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Skill Badges & Articles */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="space-y-1.5 flex-1">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-mono">
              <Star className="w-3.5 h-3.5 text-amber-500" /> Coder Skill Highlights
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(Array.isArray(profile.skills)
                ? profile.skills
                : typeof profile.skills === 'string' && (profile.skills as string).trim()
                ? (profile.skills as string).split(',').map((s) => s.trim()).filter(Boolean)
                : []
              ).map((skill) => (
                <span
                  key={skill}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-mono"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {typeof profile.articlesPublished === 'number' && profile.articlesPublished > 0 && (
            <div className="px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center gap-2 text-xs font-mono text-slate-300 shrink-0">
              <FileText className="w-4 h-4 text-brand-400" />
              <span><strong>{profile.articlesPublished}</strong> Articles</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <a
              href={profile.github || `https://github.com/${profile.username}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-mono flex items-center gap-1.5 transition-colors"
            >
              <Github className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </a>
            <a
              href={profile.linkedin || `https://linkedin.com/in/${profile.username}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-sky-950/70 hover:bg-sky-900/90 text-sky-300 hover:text-sky-200 border border-sky-800/50 text-xs font-mono flex items-center gap-1.5 transition-colors"
            >
              <Linkedin className="w-3.5 h-3.5 text-sky-400" />
              <span>LinkedIn</span>
            </a>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
            >
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleNavigateFullProfile}
              className="bg-brand-600 hover:bg-brand-500 text-white font-bold flex items-center gap-1.5 text-xs shadow-md shadow-brand-600/30"
            >
              <User className="w-3.5 h-3.5" />
              <span>View Full Profile ↗</span>
            </Button>
          </div>
        </div>

      </div>
    </Modal>
  );
};
