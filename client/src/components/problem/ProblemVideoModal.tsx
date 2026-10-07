import React from 'react';
import { Link } from 'react-router-dom';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { getYouTubeEmbedUrl, getYouTubeWatchUrl } from '../../utils/youtube';
import { ExternalLink, Code2, Youtube, Sparkles } from 'lucide-react';
import { IProblemListItem, IProblemDetail } from '../../types/problem.types';

interface ProblemVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  problem: IProblemListItem | IProblemDetail | null;
}

export const ProblemVideoModal: React.FC<ProblemVideoModalProps> = ({
  isOpen,
  onClose,
  problem,
}) => {
  if (!problem) return null;

  const embedUrl = getYouTubeEmbedUrl(problem.youtubeUrl);
  const watchUrl = getYouTubeWatchUrl(problem.youtubeUrl) || problem.youtubeUrl;

  const diffBadgeVariant =
    problem.difficulty === 'Easy'
      ? 'success'
      : problem.difficulty === 'Medium'
      ? 'warning'
      : 'danger';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      maxWidth="xl"
      className="p-0 overflow-hidden bg-slate-950 border border-slate-800 text-white rounded-3xl"
    >
      <div className="flex flex-col">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-900/90 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-red-600/20 text-red-500 border border-red-500/30 shrink-0">
              <Youtube className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={diffBadgeVariant} size="sm">
                  {problem.difficulty}
                </Badge>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {problem.category}
                </span>
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1 font-semibold">
                  <Sparkles className="w-3 h-3" /> Step-by-Step Editorial
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white truncate mt-1">
                {problem.title} — Video Solution & Logic Breakdown
              </h3>
            </div>
          </div>
        </div>

        {/* Video Player Container */}
        <div className="relative aspect-video w-full bg-black">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={`${problem.title} Video Tutorial`}
              className="absolute inset-0 w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-400">
              <Youtube className="w-12 h-12 text-red-500/50 mb-3" />
              <p className="text-sm font-semibold text-white">Video Link Unavailable</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                The video editorial tutorial for this problem has not been configured yet.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-900/90 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 font-mono text-center sm:text-left">
            💡 Watch the intuition, time complexity derivation, and dry run before coding.
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {watchUrl && (
              <a
                href={watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-semibold"
                  leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                >
                  Open in YouTube
                </Button>
              </a>
            )}

            <Link
              to={`/dsa/${problem.slug}`}
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              <Button
                variant="primary"
                size="sm"
                className="w-full bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20"
                leftIcon={<Code2 className="w-3.5 h-3.5" />}
              >
                Solve Challenge Now
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Modal>
  );
};
