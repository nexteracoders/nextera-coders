import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Heart,
  Send,
  Trash2,
  Reply,
  Code2,
  Bold,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../hooks/useAuth';
import { ITutorialChapter } from '../../data/tutorialDocumentation';

export interface ITutorialComment {
  id: string;
  author: string;
  avatar?: string;
  role?: string;
  content: string;
  createdAt: string;
  likes: number;
  hasLiked?: boolean;
  isCurrentUser?: boolean;
}

interface TutorialDiscussionSectionProps {
  chapter: ITutorialChapter;
  trackId?: string;
}

function getDefaultCommentsForChapter(chapter: ITutorialChapter): ITutorialComment[] {
  const title = chapter.title.toLowerCase();

  if (title.includes('sliding') || title.includes('two pointer') || title.includes('pointer')) {
    return [
      {
        id: 'tc-1',
        author: 'Aarav Sharma',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces',
        role: 'Pro Student',
        content: `Whenever you face variable-sized sliding window problems, remember:\n- Expand \`right\` pointer until condition is invalid.\n- Shrink \`left\` pointer until condition is valid again.\nThis guarantees each element enters and leaves the window at most once, maintaining O(N) time!`,
        createdAt: '3 hours ago',
        likes: 18,
        hasLiked: false,
      },
      {
        id: 'tc-2',
        author: 'Priya Patel',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces',
        role: 'Student',
        content: `Great explanation on two pointers! In interviews, always remember edge cases like empty arrays, duplicates, or negative numbers.`,
        createdAt: '1 day ago',
        likes: 12,
        hasLiked: false,
      },
    ];
  }

  return [
    {
      id: 'tc-default-1',
      author: 'Vikram Mehta',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces',
      role: 'Student',
      content: `The code snippets and visual diagrams in this chapter make the concepts super intuitive. Excellent documentation!`,
      createdAt: '4 hours ago',
      likes: 14,
      hasLiked: false,
    },
    {
      id: 'tc-default-2',
      author: 'Ananya Sen',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces',
      role: 'Student',
      content: `Make sure to test edge cases and benchmark time complexities in production. Great read.`,
      createdAt: '1 day ago',
      likes: 11,
      hasLiked: false,
    },
  ];
}

export const TutorialDiscussionSection: React.FC<TutorialDiscussionSectionProps> = ({
  chapter,
}) => {
  const { user } = useAuth();
  const storageKey = `nec_tutorial_comments_${chapter.id}`;

  // Collapsed by default - only shown when student clicks
  const [isExpanded, setIsExpanded] = useState(false);

  // Load comments from localStorage
  const [comments, setComments] = useState<ITutorialComment[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return getDefaultCommentsForChapter(chapter);
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setComments(JSON.parse(saved));
      } else {
        setComments(getDefaultCommentsForChapter(chapter));
      }
    } catch {
      setComments(getDefaultCommentsForChapter(chapter));
    }
  }, [chapter.id, storageKey]);

  const saveComments = (newComments: ITutorialComment[]) => {
    setComments(newComments);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newComments));
    } catch {
      // ignore
    }
  };

  const [inputText, setInputText] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false);

  // Toggle Like: Only Heart Icon and Count
  const handleToggleLike = (commentId: string) => {
    const updated = comments.map((c) => {
      if (c.id === commentId) {
        const currentlyLiked = !!c.hasLiked;
        return {
          ...c,
          hasLiked: !currentlyLiked,
          likes: currentlyLiked ? Math.max(0, c.likes - 1) : c.likes + 1,
        };
      }
      return c;
    });
    saveComments(updated);
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsPosting(true);

    const newComment: ITutorialComment = {
      id: `tc-user-${Date.now()}`,
      author: user?.name || 'Sandip Kr Verma',
      avatar: user?.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
      role: 'Student',
      content: inputText.trim(),
      createdAt: 'Just now',
      likes: 0,
      hasLiked: false,
      isCurrentUser: true,
    };

    const updated = [newComment, ...comments];
    saveComments(updated);
    setInputText('');
    setIsPosting(false);
    setPostSuccess(true);
    setTimeout(() => setPostSuccess(false), 2000);
  };

  const handleReply = (authorName: string) => {
    setIsExpanded(true);
    const mention = `@${authorName} `;
    setInputText((prev) => (prev.startsWith(mention) ? prev : `${mention}${prev}`));
    const textarea = document.getElementById('tutorial-comment-input');
    if (textarea) {
      textarea.focus();
    }
  };

  const handleDeleteComment = (commentId: string) => {
    const updated = comments.filter((c) => c.id !== commentId);
    saveComments(updated);
  };

  const insertFormatting = (prefix: string, suffix = '') => {
    setInputText((prev) => `${prev}${prefix}${suffix}`);
    const textarea = document.getElementById('tutorial-comment-input') as HTMLTextAreaElement;
    if (textarea) textarea.focus();
  };

  return (
    <section
      aria-label="Tutorial Comments"
      className="rounded-2xl bg-white dark:bg-dark-900 border border-slate-200/90 dark:border-dark-800 p-5 sm:p-6 shadow-sm transition-all"
    >
      {/* 1. Clean Header / Expand Toggle Bar */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between py-1 text-left cursor-pointer group"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              Comments ({comments.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isExpanded ? 'Click to hide comments' : 'Click to view & post comments'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
          <span>{isExpanded ? 'Hide' : 'Show'}</span>
          <ChevronDown
            className={cn('w-4 h-4 transition-transform duration-200', isExpanded && 'rotate-180')}
          />
        </div>
      </button>

      {/* 2. Collapsible Comments Content (Shown only on click) */}
      {isExpanded && (
        <div className="pt-5 mt-4 border-t border-slate-100 dark:border-dark-800 space-y-5 animate-in fade-in duration-200">
          {/* Write Comment Box */}
          <form onSubmit={handlePostComment} className="space-y-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 space-y-2 focus-within:border-emerald-500 transition-colors">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-dark-800 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => insertFormatting('**bold text**')}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-dark-800 transition-colors"
                    title="Bold"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('`code`')}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-dark-800 transition-colors"
                    title="Inline Code"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="text-[11px] text-slate-400">Share your thoughts</span>
              </div>

              <textarea
                id="tutorial-comment-input"
                rows={3}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Write your comment or question here..."
                className="w-full bg-transparent resize-none text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
              />

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-dark-800">
                <div className="flex items-center gap-2">
                  <img
                    src={
                      user?.profileImage ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces'
                    }
                    alt={user?.name || 'User'}
                    className="w-6 h-6 rounded-full object-cover border border-slate-200 dark:border-dark-700"
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {user?.name || 'Sandip Kr Verma'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {postSuccess && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Posted!
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isPosting}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Post Comment</span>
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Comment List */}
          <div className="space-y-3 pt-1 max-h-[600px] overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-dark-700 hover:scrollbar-thumb-brand-500 overscroll-y-auto transition-colors">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="p-3.5 sm:p-4 rounded-xl bg-slate-50/80 dark:bg-dark-950/60 border border-slate-200/80 dark:border-dark-800 space-y-2"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={
                        comment.avatar ||
                        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces'
                      }
                      alt={comment.author}
                      className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-dark-700"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {comment.author}
                        </span>
                        {comment.role && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200/70 dark:bg-dark-800 text-slate-600 dark:text-slate-400">
                            {comment.role}
                          </span>
                        )}
                        {comment.isCurrentUser && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                            You
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">{comment.createdAt}</span>
                    </div>
                  </div>

                  {comment.isCurrentUser && (
                    <button
                      type="button"
                      onClick={() => handleDeleteComment(comment.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Content */}
                <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed pl-9">
                  {comment.content}
                </div>

                {/* Actions: ONLY LIKE ICON & COUNT */}
                <div className="flex items-center gap-3 pl-9 pt-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => handleToggleLike(comment.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all duration-150 cursor-pointer text-xs font-semibold',
                      comment.hasLiked
                        ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400'
                        : 'bg-white dark:bg-dark-900 border-slate-200 dark:border-dark-800 text-slate-600 dark:text-slate-400 hover:text-rose-600'
                    )}
                    title={comment.hasLiked ? 'Unlike' : 'Like'}
                  >
                    <Heart
                      className={cn(
                        'w-3.5 h-3.5 transition-transform duration-150',
                        comment.hasLiked ? 'fill-rose-500 text-rose-500' : ''
                      )}
                    />
                    <span>{comment.likes}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleReply(comment.author)}
                    className="flex items-center gap-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-medium transition-colors cursor-pointer"
                  >
                    <Reply className="w-3.5 h-3.5" />
                    <span>Reply</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
