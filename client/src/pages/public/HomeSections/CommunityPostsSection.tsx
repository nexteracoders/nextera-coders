import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Section } from '../../../components/ui/Section';
import { SectionHeading } from '../../../components/ui/SectionHeading';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { ROUTES } from '../../../constants/routes';
import { postService } from '../../../services/post.service';
import { PostItem } from '../../../types/post.types';
import {
  MessageSquare,
  Star,
  HelpCircle,
  Rocket,
  ArrowRight,
  Heart,
  MessageCircle,
  CheckCircle2,
} from 'lucide-react';

const FALLBACK_POSTS: PostItem[] = [
  {
    id: 'f1',
    authorId: 'u1',
    authorName: 'Sandip Kumar Verma',
    authorCollege: 'Ramgarh Engineering College',
    title: 'Transformative DSA & Full-Stack Learning Journey on NextEra Coders',
    content:
      'The structured problem progression from Easy to Hard and the integrated IDE makes concept visualization effortless. Solved 120+ problems and cracked my core tech interview!',
    category: 'review',
    rating: 5,
    images: [],
    likesCount: 28,
    hasLiked: false,
    isCurrentUser: false,
    isPinned: true,
    commentsCount: 6,
    comments: [],
    createdAt: '2 days ago',
  },
  {
    id: 'f2',
    authorId: 'u2',
    authorName: 'Aarav Sharma',
    authorCollege: 'IIT Kharagpur',
    title: 'Built a Real-Time Multiplayer Code Battle Arena with WebSockets',
    content:
      'Just completed my capstone project using React 18, Node.js, and Monaco Editor. Shared source code and architecture diagrams for peer review!',
    category: 'project',
    images: [],
    likesCount: 42,
    hasLiked: false,
    isCurrentUser: false,
    isPinned: false,
    commentsCount: 9,
    comments: [],
    createdAt: '4 days ago',
  },
  {
    id: 'f3',
    authorId: 'u3',
    authorName: 'Priya Patel',
    authorCollege: 'NIT Trichy',
    title: 'Optimal Approach: Cycle Detection in Directed Graphs with DFS Colors',
    content:
      'Wanted to clarify why three-state DFS (WHITE, GRAY, BLACK) avoids recursion overhead in deep graphs compared to standard visited boolean sets.',
    category: 'problem',
    images: [],
    likesCount: 19,
    hasLiked: false,
    isCurrentUser: false,
    isPinned: false,
    commentsCount: 4,
    comments: [],
    createdAt: '1 week ago',
  },
];

const getInitials = (name?: string) => {
  if (!name) return 'U';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
};

export const CommunityPostsSection: React.FC = () => {
  const [posts, setPosts] = useState<PostItem[]>(FALLBACK_POSTS);

  useEffect(() => {
    postService
      .getPosts({ sortBy: 'popular' })
      .then((res) => {
        if (res.posts && res.posts.length > 0) {
          setPosts(res.posts.slice(0, 3));
        }
      })
      .catch((err) => {
        console.warn('Failed to load community preview posts on home page:', err);
      });
  }, []);

  return (
    <Section variant="default" className="py-8 sm:py-12 relative overflow-hidden">
      {/* Glow background accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-brand-500/10 dark:bg-brand-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-6 sm:space-y-7">
        <SectionHeading
          badge="Community & Student Reviews"
          title="See What Coders Are Building & Saying"
          subtitle="Explore honest student reviews, coding doubt resolutions with screenshots, and project showcases on our community hub."
          highlightText="Building & Saying"
          className="mb-0"
        />

        {/* 4-Item Compact Low-Height Posts Preview Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {posts.slice(0, 4).map((post) => {
            const isReview = post.category === 'review';
            const isProblem = post.category === 'problem';
            const isProject = post.category === 'project';

            return (
              <div
                key={post.id}
                className="rounded-2xl bg-white dark:bg-dark-900 border border-slate-200/90 dark:border-dark-800 p-4 shadow-xs hover:shadow-lg hover:border-brand-500/40 transition-all flex flex-col justify-between space-y-2.5 group"
              >
                <div className="space-y-2">
                  {/* Author Header */}
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      {post.authorAvatar ? (
                        <img
                          src={post.authorAvatar}
                          alt={post.authorName}
                          className="w-7 h-7 rounded-lg object-cover border border-slate-200 dark:border-dark-700 shrink-0"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement?.querySelector('.initials-badge')?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div
                        className={`initials-badge w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 ${
                          post.authorAvatar ? 'hidden' : ''
                        }`}
                      >
                        {getInitials(post.authorName)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1 font-bold text-[11px] text-slate-900 dark:text-white truncate">
                          <span className="truncate">{post.authorName}</span>
                          <CheckCircle2 className="w-3 h-3 text-brand-500 shrink-0" />
                        </div>
                        <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono block truncate">
                          {post.authorCollege || 'NextEra Student'}
                        </span>
                      </div>
                    </div>

                    {/* Category Badge */}
                    <div className="shrink-0">
                      {isReview && (
                        <Badge variant="warning" className="text-[9px] font-bold gap-0.5 py-0 px-1.5">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          Review
                        </Badge>
                      )}
                      {isProblem && (
                        <Badge variant="danger" className="text-[9px] font-bold gap-0.5 py-0 px-1.5">
                          <HelpCircle className="w-2.5 h-2.5" />
                          Problem
                        </Badge>
                      )}
                      {isProject && (
                        <Badge variant="info" className="text-[9px] font-bold gap-0.5 py-0 px-1.5">
                          <Rocket className="w-2.5 h-2.5" />
                          Project
                        </Badge>
                      )}
                      {post.category === 'general' && (
                        <Badge variant="default" className="text-[9px] font-bold gap-0.5 py-0 px-1.5">
                          <MessageSquare className="w-2.5 h-2.5" />
                          General
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Rating Stars (If review) */}
                  {isReview && post.rating && (
                    <div className="flex items-center gap-1 text-amber-500">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3 h-3 ${
                            star <= post.rating! ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-dark-700'
                          }`}
                        />
                      ))}
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 ml-0.5 font-mono">
                        {post.rating}.0
                      </span>
                    </div>
                  )}

                  {/* Post Title */}
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug line-clamp-1 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {post.title}
                  </h4>

                  {/* Post Snippet */}
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {post.content}
                  </p>
                </div>

                {/* Footer Metrics & Link */}
                <div className="pt-2 border-t border-slate-100 dark:border-dark-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2.5">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3 text-rose-500" />
                      {post.likesCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3 text-brand-500" />
                      {post.commentsCount}
                    </span>
                  </div>

                  <Link
                    to={`${ROUTES.COMMUNITY}#post-${post.id}`}
                    className="inline-flex items-center gap-0.5 text-brand-600 dark:text-brand-400 font-bold hover:underline"
                  >
                    <span>Read</span>
                    <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA Bar - Compact Height */}
        <div className="rounded-2xl p-[1px] bg-gradient-to-r from-brand-500/30 via-purple-500/20 to-amber-500/30 shadow-md">
          <div className="rounded-[15px] bg-white/95 dark:bg-dark-900/95 backdrop-blur-xl px-4 py-3 sm:px-6 sm:py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="space-y-0.5 text-center sm:text-left">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Join 1,000+ Students in our Discussion & Review Hub
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Post your questions with code screenshots, browse detailed project reviews, and get feedback.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link to={ROUTES.COMMUNITY}>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  className="rounded-xl font-bold shadow-xs text-xs py-1.5"
                >
                  Explore All
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};
