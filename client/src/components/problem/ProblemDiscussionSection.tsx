import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Heart,
  ExternalLink,
  Trash2,
  Filter,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { CommentEditor } from './CommentEditor';
import { CommentMarkdownRenderer } from './CommentMarkdownRenderer';

export interface IProblemComment {
  id: string;
  userId?: string;
  author: string;
  avatar?: string;
  text: string;
  createdAt: string;
  likes: number;
  hasLiked?: boolean;
  isCurrentUser?: boolean;
}

interface ProblemDiscussionSectionProps {
  comments: IProblemComment[];
  onPostComment: (text: string) => void;
  onLikeComment: (commentId: string) => void;
  onDeleteComment?: (commentId: string) => void;
  user: { id?: string; name?: string; profileImage?: string } | null;
  slug?: string;
  defaultExpanded?: boolean;
}

export const ProblemDiscussionSection: React.FC<ProblemDiscussionSectionProps> = ({
  comments,
  onPostComment,
  onLikeComment,
  onDeleteComment,
  user,
  defaultExpanded = true,
}) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [commentText, setCommentText] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'top'>('top');
  const [searchQuery, setSearchQuery] = useState('');

  // Handle post
  const handlePost = () => {
    if (!commentText.trim()) return;
    onPostComment(commentText.trim());
    setCommentText('');
  };

  // Reply to specific student
  const handleReply = (authorName: string) => {
    setIsExpanded(true);
    const mention = `@${authorName} `;
    setCommentText((prev) => (prev.startsWith(mention) ? prev : `${mention}${prev}`));
  };

  // Filter & sort comments
  const processedComments = useMemo(() => {
    let list = [...comments];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.text.toLowerCase().includes(q) ||
          c.author.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'top') {
      list.sort((a, b) => b.likes - a.likes);
    } else {
      // Newest first (reverse order)
      list.reverse();
    }

    return list;
  }, [comments, searchQuery, sortBy]);

  return (
    <div className="border-t border-slate-200 dark:border-neutral-800 pt-3">
      {/* Header Accordion Toggle */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between py-2 text-left font-bold text-sm text-slate-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-cyan-400 transition-colors group/header"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 dark:bg-cyan-500/10 text-blue-600 dark:text-cyan-400 flex items-center justify-center border border-blue-500/20 dark:border-cyan-500/20">
            <MessageSquare className="w-4 h-4" />
          </div>
          <span className="font-brand-sans">Comments & Discussion</span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 dark:bg-cyan-500/10 text-blue-600 dark:text-cyan-400 font-semibold border border-blue-500/20 dark:border-cyan-500/20">
            {comments.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400 dark:text-neutral-500 group-hover/header:text-blue-500 dark:group-hover/header:text-cyan-400 transition-colors">
            {isExpanded ? 'Collapse' : 'Expand'}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="py-2.5 space-y-4 animate-in fade-in duration-200">
          {/* Rich Comment Editor */}
          <CommentEditor
            value={commentText}
            onChange={setCommentText}
            onSubmit={handlePost}
            authorName={user?.name || 'Student'}
            placeholder="Share your approach, write code snippets, format headings, or ask peer questions..."
          />

          {/* Filter Bar & Feed Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[160px] max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search approaches, code..."
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg bg-slate-100/80 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Sort Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-neutral-900 p-0.5 rounded-lg border border-slate-200 dark:border-neutral-800 text-[11px] font-mono">
              <Filter className="w-3 h-3 text-slate-400 ml-1.5 mr-0.5" />
              <button
                type="button"
                onClick={() => setSortBy('top')}
                className={cn(
                  'px-2 py-1 rounded-md transition-all cursor-pointer',
                  sortBy === 'top'
                    ? 'bg-white dark:bg-neutral-800 text-blue-600 dark:text-cyan-400 font-bold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                Top Liked
              </button>
              <button
                type="button"
                onClick={() => setSortBy('newest')}
                className={cn(
                  'px-2 py-1 rounded-md transition-all cursor-pointer',
                  sortBy === 'newest'
                    ? 'bg-white dark:bg-neutral-800 text-blue-600 dark:text-cyan-400 font-bold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                Newest
              </button>
            </div>
          </div>

          {/* Comments Feed */}
          <div className="space-y-3 pt-1 max-h-[600px] overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-neutral-700 hover:scrollbar-thumb-brand-500 overscroll-y-auto transition-colors">
            {processedComments.length === 0 ? (
              <div className="text-center py-8 rounded-xl border border-dashed border-slate-200 dark:border-neutral-800/80 p-6 space-y-2">
                <MessageSquare className="w-8 h-8 text-slate-300 dark:text-neutral-600 mx-auto" />
                <p className="text-slate-500 dark:text-neutral-400 text-xs font-mono">
                  {searchQuery ? 'No matching discussion found.' : 'No comments yet. Be the first to share your solution!'}
                </p>
              </div>
            ) : (
              processedComments.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-xl bg-slate-50/90 dark:bg-[#1b1c28] border border-slate-200/80 dark:border-neutral-800/80 space-y-2.5 text-xs transition-colors hover:border-slate-300 dark:hover:border-neutral-700"
                >
                  {/* Author Row */}
                  <div className="flex items-center justify-between gap-2">
                    <div
                      onClick={() => navigate(c.userId ? `/profile/${c.userId}` : '/profile/me')}
                      className="flex items-center gap-2 cursor-pointer group/user select-none"
                      title={`View ${c.author}'s student profile`}
                    >
                      {/* Avatar */}
                      <div
                        className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 text-white font-bold flex items-center justify-center text-[11px] shrink-0 shadow-xs overflow-hidden border border-slate-200 dark:border-neutral-700 group-hover/user:ring-2 group-hover/user:ring-blue-500/60 transition-all cursor-pointer"
                      >
                        {c.avatar ? (
                          <img
                            src={c.avatar}
                            alt={c.author}
                            className="w-full h-full rounded-full object-cover group-hover/user:scale-110 transition-transform duration-200"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          c.author.slice(0, 1).toUpperCase()
                        )}
                      </div>

                      {/* Name & Badges */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-slate-900 dark:text-neutral-200 group-hover/user:text-blue-600 dark:group-hover/user:text-cyan-400 group-hover/user:underline transition-colors flex items-center gap-1">
                          <span>{c.author}</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover/user:opacity-100 transition-opacity text-blue-500 dark:text-cyan-400" />
                        </span>

                        {c.isCurrentUser && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono font-bold">
                            You
                          </span>
                        )}

                        {c.likes >= 10 && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono font-bold flex items-center gap-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>Top Solution</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="text-[10.5px] font-mono text-slate-400 dark:text-neutral-500">
                      {c.createdAt}
                    </span>
                  </div>

                  {/* Rich Rendered Content (Headings, Code Blocks with syntax highlight, Lists, Quotes) */}
                  <div className="pt-0.5">
                    <CommentMarkdownRenderer content={c.text} />
                  </div>

                  {/* Comment Footer: Likes, Reply, Delete */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-neutral-800/60 text-[11px] text-slate-500 dark:text-neutral-400">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => onLikeComment(c.id)}
                        className={cn(
                          'flex items-center gap-1.5 transition-colors cursor-pointer px-2 py-0.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30',
                          c.hasLiked ? 'text-rose-500 font-bold' : 'hover:text-rose-500'
                        )}
                      >
                        <Heart className={cn('w-3.5 h-3.5', c.hasLiked && 'fill-rose-500 text-rose-500')} />
                        <span className="font-mono">{c.likes}</span>
                      </button>

                      <span>&bull;</span>

                      <button
                        type="button"
                        onClick={() => handleReply(c.author)}
                        className="hover:text-blue-500 dark:hover:text-cyan-400 transition-colors cursor-pointer"
                      >
                        Reply
                      </button>
                    </div>

                    {c.isCurrentUser && onDeleteComment && (
                      <button
                        type="button"
                        onClick={() => onDeleteComment(c.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30"
                        title="Delete your comment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
