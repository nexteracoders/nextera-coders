import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { ROUTES } from '../../constants/routes';
import { postService } from '../../services/post.service';
import { PostItem, PostCategory } from '../../types/post.types';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import {
  MessageSquare,
  Star,
  Heart,
  Share2,
  PlusCircle,
  Image as ImageIcon,
  X,
  Trash2,
  Sparkles,
  Search,
  HelpCircle,
  Rocket,
  MessageCircle,
  CheckCircle2,
  Send,
  Loader2,
  LogIn,
  Bookmark,
  TrendingUp,
  Award,
  ShieldCheck,
  ArrowRight,
  Pencil,
  Pin,
  ShieldAlert,
  Flag,
  ChevronRight,
} from 'lucide-react';

// Fast client-side image compression for device photo uploads
const compressImageFile = (file: File, maxDim = 1000, quality = 0.85): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Failed to parse image file'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
};

const getInitials = (name?: string) => {
  if (!name) return 'U';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
};

const CATEGORIES: { id: 'all' | PostCategory; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'all', label: 'All Discussions', icon: Sparkles },
  { id: 'review', label: 'Reviews & Ratings', icon: Star },
  { id: 'problem', label: 'Doubts & Problems', icon: HelpCircle },
  { id: 'project', label: 'Project Builds', icon: Rocket },
  { id: 'general', label: 'Tips & Career', icon: MessageSquare },
];

const POPULAR_TAGS = [
  '#DSA',
  '#DynamicProgramming',
  '#WebDev',
  '#Python',
  '#React19',
  '#InterviewTips',
  '#SystemDesign',
  '#PlatformReview',
  '#NextEraCompiler',
];

const TOP_CONTRIBUTORS = [
  { name: 'Sandip Kr verma', college: 'Ramgarh Engineering College', badge: 'Top Reviewer', role: 'Full-Stack Developer', pts: 480 },
  { name: 'Utkarsh Kumar', college: 'NextEra Engineering', badge: 'Algorithm Master', role: 'DSA Solver', pts: 360 },
  { name: 'Murari Verma', college: 'NextEra Member', badge: 'Active Contributor', role: 'Student Coder', pts: 290 },
  { name: 'Vipul Raj', college: 'NextEra Member', badge: 'Problem Solver', role: 'Competitive Coder', pts: 240 },
];

export const CommunityPage: React.FC = () => {
  useDocumentTitle('Student Reviews & Community Hub — NextEra Coders');
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'sub_admin';
  const { success, error: toastError } = useToast();

  const toast = {
    success: (msg: string) => success(msg),
    error: (msg: string) => toastError(msg),
  };

  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<'all' | PostCategory | 'saved' | 'reported'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'top'>('newest');

  // Local saved / bookmarked posts
  const [savedPostIds, setSavedPostIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('nextera_saved_community_posts') || '[]');
    } catch {
      return [];
    }
  });

  // Create Post Modal / Inline Studio State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<PostCategory>('review');
  const [newRating, setNewRating] = useState(5);
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [compressing, setCompressing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Comments State
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [commentSubmitting, setCommentSubmitting] = useState<Record<string, boolean>>({});

  // Lightbox Modal
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  // 🛡️ Edit / Moderation Post Modal State (Author or Admin)
  const [editingPost, setEditingPost] = useState<PostItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState<PostCategory>('general');
  const [editRating, setEditRating] = useState(5);
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editIsPinned, setEditIsPinned] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editCompressing, setEditCompressing] = useState(false);

  // 🚩 Report Post Modal State
  const [reportingPost, setReportingPost] = useState<PostItem | null>(null);
  const [reportReason, setReportReason] = useState('18+ Adult Content / Inappropriate');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const editFileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const categoryParam = activeCategory === 'saved' || activeCategory === 'all' || activeCategory === 'reported' ? undefined : activeCategory;
      const res = await postService.getPosts({
        category: categoryParam,
        search: searchQuery || (selectedTag ? selectedTag.replace('#', '') : undefined),
        sortBy,
        reportedOnly: activeCategory === 'reported' ? true : undefined,
      });
      setPosts(res.posts || []);
    } catch (err) {
      console.error('Failed to load posts:', err);
      toast.error('Failed to load community posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [activeCategory, sortBy, selectedTag]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSelectedTag(null);
    fetchPosts();
  };

  // Quick Open Modal with pre-selected category
  const openComposerWithCategory = (cat: PostCategory) => {
    if (!user) {
      toast.error('Please log in to publish a post or review');
      return;
    }
    setNewCategory(cat);
    if (cat === 'review') setNewRating(5);
    setIsModalOpen(true);
  };

  // Image Upload handler from PC
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (attachedImages.length + files.length > 4) {
      toast.error('You can attach a maximum of 4 photos per post');
      return;
    }

    try {
      setCompressing(true);
      const compressedList: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image file`);
          continue;
        }
        const compressed = await compressImageFile(file, 1000, 0.85);
        compressedList.push(compressed);
      }
      setAttachedImages((prev) => [...prev, ...compressedList]);
      toast.success(`${compressedList.length} image(s) ready to post!`);
    } catch (err) {
      console.error('Image compression error:', err);
      toast.error('Could not process selected image(s)');
    } finally {
      setCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachedImage = (index: number) => {
    setAttachedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Create Post Submit
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please log in to publish a post or review');
      return;
    }

    if (!newTitle.trim()) {
      toast.error('Please provide a descriptive title');
      return;
    }

    if (!newContent.trim()) {
      toast.error('Please provide details in the content field');
      return;
    }

    try {
      setSubmitting(true);
      const res = await postService.createPost({
        title: newTitle.trim(),
        content: newContent.trim(),
        category: newCategory,
        rating: newCategory === 'review' ? newRating : undefined,
        images: attachedImages,
      });

      toast.success('Post published successfully!');
      setPosts((prev) => [res.post, ...prev]);
      setNewTitle('');
      setNewContent('');
      setNewCategory('review');
      setNewRating(5);
      setAttachedImages([]);
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Failed to create post:', err);
      toast.error(err.response?.data?.message || 'Failed to publish post');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Like with soundless micro-bounce
  const handleToggleLike = async (postId: string) => {
    if (!user) {
      toast.error('Please log in to like posts');
      return;
    }

    try {
      const res = await postService.toggleLike(postId);
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              hasLiked: res.liked,
              likesCount: res.likesCount,
            };
          }
          return p;
        })
      );
    } catch (err) {
      console.error('Failed to toggle like:', err);
      toast.error('Could not register like');
    }
  };

  // Toggle Bookmark / Save Post
  const handleToggleBookmark = (postId: string) => {
    setSavedPostIds((prev) => {
      let updated: string[];
      if (prev.includes(postId)) {
        updated = prev.filter((id) => id !== postId);
        toast.success('Post removed from saved list');
      } else {
        updated = [...prev, postId];
        toast.success('Post saved to your bookmarks!');
      }
      try {
        localStorage.setItem('nextera_saved_community_posts', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Toggle Comments view
  const toggleComments = (postId: string) => {
    setExpandedComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  // Submit Comment
  const handleAddComment = async (postId: string) => {
    if (!user) {
      toast.error('Please log in to comment');
      return;
    }

    const text = commentInputs[postId]?.trim();
    if (!text) return;

    try {
      setCommentSubmitting((prev) => ({ ...prev, [postId]: true }));
      const res = await postService.addComment(postId, text);
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              commentsCount: res.commentsCount,
              comments: [...p.comments, res.comment],
            };
          }
          return p;
        })
      );
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
      toast.success('Comment added!');
    } catch (err) {
      console.error('Failed to add comment:', err);
      toast.error('Could not send comment');
    } finally {
      setCommentSubmitting((prev) => ({ ...prev, [postId]: false }));
    }
  };

  // Delete Post (Author or Admin)
  const handleDeletePost = async (postId: string) => {
    const confirmMsg = isAdmin
      ? '🛡️ Moderator Action: Are you sure you want to permanently delete this post and its discussions?'
      : 'Are you sure you want to permanently delete your post?';
    if (!window.confirm(confirmMsg)) return;

    try {
      await postService.deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      toast.success(isAdmin ? 'Post permanently removed by Moderator' : 'Post removed successfully');
    } catch (err) {
      console.error('Failed to delete post:', err);
      toast.error('Could not delete post');
    }
  };

  // 🛡️ Open Edit / Moderation Modal
  const handleOpenEditModal = (post: PostItem) => {
    setEditingPost(post);
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditCategory(post.category);
    setEditRating(post.rating || 5);
    setEditImages([...(post.images || [])]);
    setEditIsPinned(Boolean(post.isPinned));
  };

  // 🛡️ Save Edited Post (Author or Admin)
  const handleSaveEditPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;

    if (!editTitle.trim()) {
      toast.error('Post title cannot be empty');
      return;
    }

    if (!editContent.trim()) {
      toast.error('Post description / content cannot be empty');
      return;
    }

    try {
      setEditSaving(true);
      const res = await postService.updatePost(editingPost.id, {
        title: editTitle.trim(),
        content: editContent.trim(),
        category: editCategory,
        rating: editCategory === 'review' ? editRating : undefined,
        images: editImages,
        isPinned: user?.role === 'admin' ? editIsPinned : undefined,
      });

      setPosts((prev) => prev.map((p) => (p.id === editingPost.id ? res.post : p)));
      setEditingPost(null);
      toast.success(isAdmin && !editingPost.isCurrentUser ? 'Post sanitized & updated by Moderator!' : 'Post updated successfully!');
    } catch (err: any) {
      console.error('Failed to update post:', err);
      toast.error(err.response?.data?.message || 'Failed to update post');
    } finally {
      setEditSaving(false);
    }
  };

  // 🚩 Open Report Post Modal
  const handleOpenReportModal = (post: PostItem) => {
    if (!user) {
      toast.error('Please log in to report a post');
      return;
    }
    setReportingPost(post);
    setReportReason('18+ Adult Content / Inappropriate');
    setReportDetails('');
  };

  // 🚩 Submit Report for Adult/Inappropriate Post
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingPost) return;

    try {
      setReportSubmitting(true);
      const res = await postService.reportPost(reportingPost.id, {
        reason: reportReason,
        details: reportDetails,
      });

      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === reportingPost.id) {
            return {
              ...p,
              reportsCount: res.reportsCount,
              isFlagged: res.isFlagged,
              hasReported: true,
            };
          }
          return p;
        })
      );

      if (res.isFlagged && !isAdmin) {
        // If it got auto-hidden and current user is student, filter it out
        setPosts((prev) => prev.filter((p) => p.id !== reportingPost.id));
        toast.success('Report submitted. This post has reached the report threshold and has been auto-hidden from community feed.');
      } else {
        toast.success('Thank you for reporting. Our moderation team has logged your report.');
      }
      setReportingPost(null);
    } catch (err: any) {
      console.error('Failed to submit report:', err);
      toast.error(err?.response?.data?.message || 'Could not submit report');
    } finally {
      setReportSubmitting(false);
    }
  };

  // 🛡️ Admin Dismiss Reports & Restore Post
  const handleDismissReports = async (postId: string) => {
    if (!window.confirm('🛡️ Admin Action: Dismiss all reports and restore this post to the public community feed?')) {
      return;
    }

    try {
      await postService.dismissReports(postId);
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              reportsCount: 0,
              isFlagged: false,
              reports: [],
            };
          }
          return p;
        })
      );
      toast.success('Reports dismissed. Post restored to public feed.');
    } catch (err) {
      console.error('Failed to dismiss reports:', err);
      toast.error('Could not dismiss reports');
    }
  };

  // 🛡️ Admin Toggle Pin to Top
  const handleTogglePin = async (postId: string) => {
    try {
      const res = await postService.togglePin(postId);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, isPinned: res.isPinned } : p))
      );
      toast.success(res.isPinned ? '📌 Post pinned to top by Admin' : 'Post unpinned by Admin');
    } catch (err: any) {
      console.error('Failed to toggle pin:', err);
      toast.error(err.response?.data?.message || 'Failed to pin/unpin post');
    }
  };

  // 🛡️ Delete Comment (Author or Admin)
  const handleDeleteComment = async (postId: string, commentId: string) => {
    const isAdmin = user?.role === 'admin';
    const confirmMsg = isAdmin
      ? '🛡️ Admin Action: Delete this comment permanently?'
      : 'Delete your comment?';
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await postService.deleteComment(postId, commentId);
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          return {
            ...p,
            commentsCount: res.commentsCount,
            comments: p.comments.filter((c) => c.id !== commentId),
          };
        })
      );
      toast.success(isAdmin ? 'Comment removed by Admin' : 'Comment deleted');
    } catch (err: any) {
      console.error('Failed to delete comment:', err);
      toast.error(err.response?.data?.message || 'Failed to delete comment');
    }
  };

  // Edit image upload from device
  const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (editImages.length + files.length > 4) {
      toast.error('Maximum 4 photos allowed per post');
      return;
    }

    try {
      setEditCompressing(true);
      const compressedList: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const compressed = await compressImageFile(files[i]);
        compressedList.push(compressed);
      }
      setEditImages((prev) => [...prev, ...compressedList].slice(0, 4));
      toast.success(`${compressedList.length} photo(s) added!`);
    } catch (err) {
      console.error('Failed to process image:', err);
      toast.error('Could not process image file');
    } finally {
      setEditCompressing(false);
      if (editFileInputRef.current) editFileInputRef.current.value = '';
    }
  };

  const removeEditImage = (indexToRemove: number) => {
    setEditImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleShare = (post: PostItem) => {
    navigator.clipboard.writeText(`${window.location.origin}/community#post-${post.id}`);
    toast.success('Link copied to clipboard!');
  };

  // Filter posts if activeCategory === 'saved' or 'reported'
  const displayedPosts = useMemo(() => {
    if (activeCategory === 'saved') {
      return posts.filter((p) => savedPostIds.includes(p.id));
    }
    if (activeCategory === 'reported') {
      return posts.filter((p) => p.isFlagged || (p.reportsCount && p.reportsCount > 0));
    }
    return posts;
  }, [posts, activeCategory, savedPostIds]);

  const reportedPostsCount = useMemo(() => {
    return posts.filter((p) => p.isFlagged || (p.reportsCount && p.reportsCount > 0)).length;
  }, [posts]);

  // Overall platform rating calculation
  const reviewPosts = useMemo(() => posts.filter((p) => p.category === 'review' && p.rating), [posts]);
  const avgRating = useMemo(() => {
    if (reviewPosts.length === 0) return 5.0;
    const sum = reviewPosts.reduce((acc, p) => acc + (p.rating || 5), 0);
    return (sum / reviewPosts.length).toFixed(1);
  }, [reviewPosts]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* ========================================================================= */}
        {/* 🌟 SLEEK HERO CONTAINER: NextEra Community Hub (About Page Style) */}
        {/* ========================================================================= */}
        <div className="relative rounded-3xl p-[1.5px] bg-gradient-to-r from-brand-500/40 via-purple-500/30 to-emerald-500/40 shadow-xl shadow-brand-500/5 dark:shadow-black/40">
          <div className="relative rounded-[22px] bg-white/95 dark:bg-dark-900/95 backdrop-blur-2xl p-5 sm:p-7 lg:p-8 overflow-hidden">
            {/* Top Accent Strip in RGB Gradient */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-500 via-purple-500 to-emerald-500" />

            {/* Ambient Background Glows */}
            <div className="absolute -top-24 -left-24 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Breadcrumbs */}
            <nav className="relative z-10 flex items-center gap-1.5 text-xs font-mono text-slate-500 dark:text-slate-400 mb-3 sm:mb-4">
              <Link to={ROUTES.HOME} className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                Home
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-900 dark:text-slate-100 font-bold">Community</span>
            </nav>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
              {/* Left Column: Heading & Feature Tags */}
              <div className="lg:col-span-7 space-y-3 sm:space-y-3.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold font-mono bg-slate-100 dark:bg-dark-800 border border-slate-200/90 dark:border-dark-700 text-slate-800 dark:text-slate-200 shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-brand-500 animate-pulse" />
                  <span>Developer Community & Review Hub</span>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                  Connect, Ask Doubts & <span className="bg-gradient-to-r from-brand-600 via-purple-600 to-emerald-500 dark:from-brand-400 dark:via-purple-400 dark:to-emerald-400 bg-clip-text text-transparent">Authentic Reviews</span>
                </h1>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-normal leading-relaxed max-w-xl">
                  Join 1,000+ passionate student engineers. Share code doubts with screenshots, review courses, showcase completed apps, and get real feedback from peers.
                </p>

                {/* Interactive Feature Badges */}
                <div className="pt-1 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-slate-50 dark:bg-dark-800/80 border border-slate-200/80 dark:border-dark-700 text-slate-700 dark:text-slate-300 shadow-2xs hover:border-brand-500/40 hover:text-brand-600 dark:hover:text-brand-400 transition-all cursor-default">
                    <MessageSquare className="w-3 h-3 text-brand-500" />
                    Peer Code Discussions
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-slate-50 dark:bg-dark-800/80 border border-slate-200/80 dark:border-dark-700 text-slate-700 dark:text-slate-300 shadow-2xs hover:border-amber-500/40 hover:text-amber-600 dark:hover:text-amber-400 transition-all cursor-default">
                    <Star className="w-3 h-3 text-amber-500" />
                    Verified Reviews
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-slate-50 dark:bg-dark-800/80 border border-slate-200/80 dark:border-dark-700 text-slate-700 dark:text-slate-300 shadow-2xs hover:border-emerald-500/40 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all cursor-default">
                    <Rocket className="w-3 h-3 text-emerald-500" />
                    Project Showcases
                  </span>
                </div>
              </div>

              {/* Right Column: Compact 2x2 Telemetry Cards & Action Buttons */}
              <div className="lg:col-span-5 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-slate-50/90 dark:bg-dark-850/80 border border-slate-200/80 dark:border-dark-750 backdrop-blur-md shadow-2xs hover:border-amber-500/40 hover:-translate-y-0.5 transition-all group/stat">
                    <div className="flex items-center gap-1 text-amber-500 font-mono text-lg sm:text-xl font-black">
                      <Star className="w-4 h-4 fill-current" />
                      <span>{avgRating}</span>
                      <span className="text-[10px] text-slate-400 font-normal">/ 5.0</span>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">Satisfaction</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50/90 dark:bg-dark-850/80 border border-slate-200/80 dark:border-dark-750 backdrop-blur-md shadow-2xs hover:border-brand-500/40 hover:-translate-y-0.5 transition-all group/stat">
                    <p className="text-lg sm:text-xl font-black text-brand-600 dark:text-brand-400 font-mono">
                      {posts.filter((p) => p.category === 'review').length}
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">Verified Reviews</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50/90 dark:bg-dark-850/80 border border-slate-200/80 dark:border-dark-750 backdrop-blur-md shadow-2xs hover:border-rose-500/40 hover:-translate-y-0.5 transition-all group/stat">
                    <p className="text-lg sm:text-xl font-black text-rose-500 font-mono">
                      {posts.filter((p) => p.category === 'problem').length}
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">Doubts & Solved</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50/90 dark:bg-dark-850/80 border border-slate-200/80 dark:border-dark-750 backdrop-blur-md shadow-2xs hover:border-purple-500/40 hover:-translate-y-0.5 transition-all group/stat">
                    <p className="text-lg sm:text-xl font-black text-purple-500 font-mono">
                      {posts.filter((p) => p.category === 'project').length}
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">Showcased</p>
                  </div>
                </div>

                {/* CTAs matching About page style */}
                <div className="flex items-center gap-2.5 pt-0.5">
                  {user ? (
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(true)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 shadow-md shadow-brand-500/20 hover:shadow-brand-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Create Post / Review</span>
                    </button>
                  ) : (
                    <Link
                      to={ROUTES.LOGIN}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 shadow-md shadow-brand-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Login to Share</span>
                    </Link>
                  )}

                  <Link
                    to={ROUTES.PRACTICE}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-slate-50 dark:bg-dark-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-dark-700 hover:border-brand-500/40 shadow-2xs hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0"
                  >
                    <span>Solve Problems</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 💬 POPULAR TRENDING TOPICS TAG CLOUD */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1 font-mono">
            <TrendingUp className="w-3.5 h-3.5 text-brand-500" />
            Trending:
          </span>
          {POPULAR_TAGS.map((tag) => {
            const isSelected = selectedTag === tag;
            return (
              <button
                key={tag}
                onClick={() => {
                  if (isSelected) {
                    setSelectedTag(null);
                  } else {
                    setSelectedTag(tag);
                    setSearchQuery(tag.replace('#', ''));
                  }
                }}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-dark-800 text-slate-600 dark:text-slate-400 hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-300'
                }`}
              >
                {tag}
              </button>
            );
          })}
          {selectedTag && (
            <button
              onClick={() => {
                setSelectedTag(null);
                setSearchQuery('');
              }}
              className="text-xs text-rose-500 font-bold hover:underline shrink-0 ml-1"
            >
              Clear tag &times;
            </button>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 2-COLUMN MODERN WORKSPACE (MAIN FEED 8 COLS + RIGHT WIDGETS 4 COLS) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ======================================================================= */}
          {/* 📰 LEFT 8 COLS: COMPOSER, FILTERS, FEED */}
          {/* ======================================================================= */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* 🛡️ ADMIN MODERATION ACTIVE BANNER */}
            {user?.role === 'admin' && (
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-brand-500/10 border border-amber-500/30 flex items-center justify-between flex-wrap gap-3 shadow-xs animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/70 px-2.5 py-0.5 rounded-full border border-amber-300/60 dark:border-amber-800">
                        Admin Moderation Active
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Community Safe Guard</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">
                      You have full moderator rights: Edit titles & descriptions, delete inappropriate posts/comments, remove abusive photos, or pin important updates to the top.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="px-3 py-1 rounded-xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 font-bold text-slate-700 dark:text-slate-200">
                    Total Posts: <span className="text-brand-600 dark:text-brand-400">{posts.length}</span>
                  </span>
                </div>
              </div>
            )}

            {/* Quick Composer Box */}
            <div className="rounded-2xl bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-dark-800 p-3 sm:p-3.5 shadow-xs">
              <div className="flex items-center gap-3">
                {user?.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-dark-700 shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-300 font-semibold text-xs flex items-center justify-center shrink-0">
                    {getInitials(user?.name)}
                  </div>
                )}

                <button
                  onClick={() => (user ? setIsModalOpen(true) : toast.error('Please log in to share or review'))}
                  className="flex-1 text-left px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-dark-850 dark:hover:bg-dark-800 border border-slate-200/70 dark:border-dark-750 text-xs sm:text-sm text-slate-400 dark:text-slate-500 transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span>Share a course review, ask a coding doubt, or showcase your build...</span>
                  <PlusCircle className="w-4 h-4 text-brand-500 shrink-0 hidden sm:inline" />
                </button>
              </div>
            </div>

            {/* 🔍 FILTER & SEARCH CONTROLS */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        isActive
                          ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                          : 'bg-white dark:bg-dark-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-dark-800'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}

                {/* Saved Posts Filter */}
                {savedPostIds.length > 0 && (
                  <button
                    onClick={() => setActiveCategory('saved')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      activeCategory === 'saved'
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'bg-white dark:bg-dark-900 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5 fill-current" />
                    <span>Saved ({savedPostIds.length})</span>
                  </button>
                )}

                {/* 🛡️ Admin Reported / Flagged Posts Filter */}
                {isAdmin && (
                  <button
                    onClick={() => setActiveCategory('reported')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      activeCategory === 'reported'
                        ? 'bg-red-600 text-white shadow-md shadow-red-500/20'
                        : 'bg-white dark:bg-dark-900 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/20'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Reported {reportedPostsCount > 0 ? `(${reportedPostsCount})` : ''}</span>
                  </button>
                )}
              </div>

              {/* Search & Sort Dropdown */}
              <div className="flex items-center gap-2">
                <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-56">
                  <input
                    type="text"
                    placeholder="Search posts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl text-xs bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </form>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-2.5 py-2 rounded-xl text-xs bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer font-medium shrink-0"
                >
                  <option value="newest">Newest First</option>
                  <option value="popular">Most Liked</option>
                  <option value="top">Top Rated</option>
                </select>
              </div>
            </div>

            {/* 📝 POSTS FEED */}
            {loading ? (
              <div className="p-12 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-brand-500 animate-spin mx-auto" />
                <p className="text-sm text-slate-500 dark:text-slate-400">Loading community posts & reviews...</p>
              </div>
            ) : displayedPosts.length === 0 ? (
              <div className="p-12 rounded-3xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 text-center space-y-4 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-500 flex items-center justify-center mx-auto">
                  <MessageSquare className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {activeCategory === 'saved' ? 'No saved posts yet' : 'No posts found'}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  {activeCategory === 'saved'
                    ? 'Click the bookmark icon on any post to save it for quick revision!'
                    : searchQuery
                    ? `No posts matched "${searchQuery}". Try clearing search or choosing another category.`
                    : 'Be the first student to publish a review, doubt, or showcase your coding build!'}
                </p>
                {user && (
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<PlusCircle className="w-4 h-4" />}
                    onClick={() => setIsModalOpen(true)}
                    className="rounded-xl font-bold mt-2"
                  >
                    Create Post
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {displayedPosts.map((post) => {
                  const isReview = post.category === 'review';
                  const isProblem = post.category === 'problem';
                  const isProject = post.category === 'project';
                  const isSaved = savedPostIds.includes(post.id);

                  return (
                    <div
                      key={post.id}
                      id={`post-${post.id}`}
                      className={`rounded-2xl bg-white dark:bg-dark-900 border transition-all p-4 sm:p-5 space-y-3 ${
                        post.isPinned
                          ? 'border-amber-300/80 dark:border-amber-700/60 bg-amber-50/5'
                          : 'border-slate-200/80 dark:border-dark-800 shadow-xs hover:border-slate-300 dark:hover:border-dark-700'
                      }`}
                    >
                      {/* Pinned to Top Indicator */}
                      {post.isPinned && (
                        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-900/40 text-amber-700 dark:text-amber-300 text-[11px] font-semibold w-fit">
                          <Pin className="w-3 h-3 fill-amber-500 text-amber-500 rotate-45" />
                          <span>Pinned by Admin</span>
                        </div>
                      )}

                      {/* Flagged / Under Review Moderation Alert Banner */}
                      {Boolean(post.isFlagged || (post.reportsCount && post.reportsCount > 0)) && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 text-xs animate-fade-in">
                          <div className="flex items-center gap-2 text-red-700 dark:text-red-300 font-semibold">
                            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                            <span>
                              {post.isFlagged
                                ? `Auto-Flagged (Hidden): ${post.reportsCount || 8}+ Reports`
                                : `Reported: ${post.reportsCount} User Report(s)`}
                            </span>
                          </div>
                          {isAdmin && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleDismissReports(post.id)}
                                className="px-2 py-0.5 rounded-md bg-white dark:bg-dark-900 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 font-semibold text-[11px] cursor-pointer"
                              >
                                Dismiss
                              </button>
                              <button
                                onClick={() => handleDeletePost(post.id)}
                                className="px-2 py-0.5 rounded-md bg-red-600 text-white font-semibold text-[11px] cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Top Bar: Author, Badges & Options */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {post.authorAvatar ? (
                            <img
                              src={post.authorAvatar}
                              alt={post.authorName}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-dark-700 shrink-0"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement?.querySelector('.initials-fallback')?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div
                            className={`initials-fallback w-8 h-8 rounded-full bg-slate-200 dark:bg-dark-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center shrink-0 ${
                              post.authorAvatar ? 'hidden' : ''
                            }`}
                          >
                            {getInitials(post.authorName)}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                                {post.authorName}
                              </span>
                              <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-medium border border-emerald-200/60 dark:border-emerald-800/40">
                                <ShieldCheck className="w-2.5 h-2.5" />
                                Verified
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 leading-none mt-0.5">
                              {post.authorCollege && <span className="truncate max-w-[220px]">{post.authorCollege}</span>}
                              {post.authorCollege && <span>•</span>}
                              <span>{post.createdAt}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Category Badge */}
                          {isReview && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-900/30">
                              Review
                            </span>
                          )}
                          {isProblem && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/50 dark:border-rose-900/30">
                              Doubt
                            </span>
                          )}
                          {isProject && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-900/30">
                              Project
                            </span>
                          )}
                          {post.category === 'general' && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-dark-700">
                              General
                            </span>
                          )}

                          {/* Report */}
                          {!post.isCurrentUser && (
                            <button
                              onClick={() => handleOpenReportModal(post)}
                              disabled={post.hasReported}
                              title={post.hasReported ? 'Reported' : 'Report'}
                              className={`p-1 rounded transition-colors cursor-pointer ${
                                post.hasReported
                                  ? 'text-red-500 cursor-not-allowed'
                                  : 'text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-dark-800'
                              }`}
                            >
                              <Flag className={`w-3.5 h-3.5 ${post.hasReported ? 'fill-current' : ''}`} />
                            </button>
                          )}

                          {/* Bookmark */}
                          <button
                            onClick={() => handleToggleBookmark(post.id)}
                            title={isSaved ? 'Remove Bookmark' : 'Bookmark Post'}
                            className={`p-1 rounded transition-colors cursor-pointer ${
                              isSaved
                                ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                                : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-dark-800'
                            }`}
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                          </button>

                          {/* Admin Pin */}
                          {user?.role === 'admin' && (
                            <button
                              onClick={() => handleTogglePin(post.id)}
                              title={post.isPinned ? 'Unpin' : 'Pin to Top'}
                              className={`p-1 rounded transition-colors cursor-pointer ${
                                post.isPinned
                                  ? 'text-amber-600 bg-amber-100 dark:bg-amber-950/80 dark:text-amber-300'
                                  : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-dark-800'
                              }`}
                            >
                              <Pin className={`w-3.5 h-3.5 ${post.isPinned ? 'fill-current rotate-45' : ''}`} />
                            </button>
                          )}

                          {/* Edit */}
                          {(post.isCurrentUser || isAdmin) && (
                            <button
                              onClick={() => handleOpenEditModal(post)}
                              title="Edit Post"
                              className="p-1 text-slate-400 hover:text-brand-500 dark:hover:text-brand-400 transition-colors rounded hover:bg-slate-100 dark:hover:bg-dark-800 cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete */}
                          {(post.isCurrentUser || isAdmin) && (
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              title="Delete Post"
                              className="p-1 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded hover:bg-slate-100 dark:hover:bg-dark-800 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white leading-snug">
                        {post.title}
                      </h3>

                      {/* Content Body */}
                      <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                        {post.content}
                      </div>

                      {/* Attached Images Grid */}
                      {post.images && post.images.length > 0 && (
                        <div
                          className={`grid gap-2 pt-1 ${
                            post.images.length === 1
                              ? 'grid-cols-1'
                              : post.images.length === 2
                              ? 'grid-cols-2'
                              : 'grid-cols-2 sm:grid-cols-3'
                          }`}
                        >
                          {post.images.map((img, idx) => (
                            <div
                              key={idx}
                              onClick={() => setLightboxImg(img)}
                              className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-dark-800 bg-slate-100 dark:bg-dark-950 aspect-video cursor-zoom-in group shadow-xs"
                            >
                              <img
                                src={img}
                                alt={`Attachment ${idx + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold backdrop-blur-xs">
                                Click to enlarge
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Footer Actions: Single clean row */}
                      <div className="pt-2.5 border-t border-slate-100 dark:border-dark-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          {/* Helpful Reaction */}
                          <button
                            onClick={() => handleToggleLike(post.id)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                              post.hasLiked
                                ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-dark-850'
                            }`}
                          >
                            <Heart className={`w-3.5 h-3.5 ${post.hasLiked ? 'fill-current text-rose-500' : ''}`} />
                            <span>{post.likesCount || 0} Helpful</span>
                          </button>

                          {/* Comments Toggle */}
                          <button
                            onClick={() => toggleComments(post.id)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-dark-850 transition-colors cursor-pointer"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>{post.commentsCount || 0} Comments</span>
                          </button>
                        </div>

                        {/* Share Button */}
                        <button
                          onClick={() => handleShare(post)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer font-medium"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Share</span>
                        </button>
                      </div>

                      {/* Comments Accordion */}
                      {expandedComments[post.id] && (
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-dark-800 space-y-4 animate-fade-in">
                          {/* Add Comment Input */}
                          {user ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="Write a constructive comment or answer..."
                                value={commentInputs[post.id] || ''}
                                onChange={(e) =>
                                  setCommentInputs((prev) => ({
                                    ...prev,
                                    [post.id]: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleAddComment(post.id);
                                }}
                                className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-2xl bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                              />
                              <Button
                                variant="primary"
                                size="sm"
                                disabled={commentSubmitting[post.id]}
                                onClick={() => handleAddComment(post.id)}
                                className="rounded-xl font-bold px-4"
                              >
                                {commentSubmitting[post.id] ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Send className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          ) : (
                            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-dark-950 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                              <span>Sign in to participate in the conversation</span>
                              <Link to={ROUTES.LOGIN} className="text-brand-600 dark:text-brand-400 font-bold hover:underline">
                                Login
                              </Link>
                            </div>
                          )}

                          {/* Comments List */}
                          {post.comments && post.comments.length > 0 ? (
                            <div className="space-y-2 pt-1">
                              {post.comments.length > 2 && (
                                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 dark:text-slate-500 px-1 pb-1 border-b border-slate-100 dark:border-dark-800">
                                  <span>{post.comments.length} Comments</span>
                                  <span className="text-[10px] text-slate-400">Scroll to view all</span>
                                </div>
                              )}
                              <div className="space-y-3 max-h-80 sm:max-h-96 overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-dark-700 hover:scrollbar-thumb-brand-500 overscroll-y-auto transition-colors">
                                {post.comments.map((comment) => {
                                  const isPostAuthor = comment.authorId === post.authorId;
                                  return (
                                    <div
                                      key={comment.id}
                                      className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-dark-950/80 border border-slate-100 dark:border-dark-800 space-y-1.5"
                                    >
                                      <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                                          {comment.authorAvatar ? (
                                            <img
                                              src={comment.authorAvatar}
                                              alt={comment.authorName}
                                              className="w-5 h-5 rounded-full object-cover"
                                            />
                                          ) : (
                                            <span className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px]">
                                              {getInitials(comment.authorName)}
                                            </span>
                                          )}
                                          <span>{comment.authorName}</span>
                                          {isPostAuthor && (
                                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-mono">
                                              Author
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-[10px] text-slate-400 font-mono">{comment.createdAt}</span>
                                          {(comment.isCurrentUser || user?.role === 'admin' || user?.role === 'sub_admin') && (
                                            <button
                                              type="button"
                                              onClick={() => handleDeleteComment(post.id, comment.id)}
                                              title="Delete Comment"
                                              className="text-slate-400 hover:text-red-500 p-0.5 rounded transition-colors cursor-pointer"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                      <p className="text-xs text-slate-700 dark:text-slate-300 pl-7 leading-relaxed">
                                        {comment.content}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 text-center py-2">
                              No comments yet. Be the first to share thoughts!
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ======================================================================= */}
          {/* 📊 RIGHT 4 COLS: RATING BREAKDOWN, TOP CONTRIBUTORS, GUIDELINES */}
          {/* ======================================================================= */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* 🌟 OVERALL PLATFORM RATING & REVIEWS SUMMARY CARD */}
            <div className="rounded-3xl bg-white dark:bg-dark-900 border border-slate-200/90 dark:border-dark-800 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-500 fill-current" />
                  <span>Platform Rating</span>
                </h3>
                <span className="text-[11px] font-mono text-slate-400">Verified Coders</span>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
                <div className="text-center shrink-0">
                  <span className="text-3xl font-black text-amber-600 dark:text-amber-400 font-mono block">
                    {avgRating}
                  </span>
                  <div className="flex items-center justify-center gap-0.5 text-amber-400 text-xs mt-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block mt-1">
                    {reviewPosts.length} Reviews
                  </span>
                </div>

                <div className="space-y-1.5 flex-1 text-[11px] font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 w-4">5★</span>
                    <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-dark-800 overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full w-[92%]" />
                    </div>
                    <span className="text-slate-400 text-[10px]">92%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 w-4">4★</span>
                    <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-dark-800 overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full w-[8%]" />
                    </div>
                    <span className="text-slate-400 text-[10px]">8%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 w-4">3★</span>
                    <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-dark-800 overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full w-[0%]" />
                    </div>
                    <span className="text-slate-400 text-[10px]">0%</span>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => openComposerWithCategory('review')}
                className="w-full rounded-xl font-bold border-amber-300 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40"
              >
                Write an Honest Review
              </Button>
            </div>

            {/* 🏆 TOP COMMUNITY CONTRIBUTORS */}
            <div className="rounded-3xl bg-white dark:bg-dark-900 border border-slate-200/90 dark:border-dark-800 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-brand-500" />
                  <span>Top Contributors</span>
                </h3>
                <span className="text-[11px] font-mono text-slate-400">Weekly Karma</span>
              </div>

              <div className="space-y-3">
                {TOP_CONTRIBUTORS.map((c, idx) => (
                  <div
                    key={c.name}
                    className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-dark-850 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-[11px] font-mono font-bold text-slate-400 w-4 text-center shrink-0">
                        #{idx + 1}
                      </span>
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {getInitials(c.name)}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                          {c.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block truncate">
                          {c.college}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-bold text-brand-600 dark:text-brand-400 block">
                        +{c.pts} pts
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                        {c.badge}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 📌 COMMUNITY GUIDELINES & TIPS */}
            <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-dark-900 text-white p-6 shadow-xl space-y-3.5 border border-slate-800">
              <div className="flex items-center gap-2 text-brand-400 font-bold text-xs font-mono uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-brand-400" />
                <span>Community Guidelines</span>
              </div>
              <h4 className="text-base font-bold">How to get fast answers & reviews</h4>
              <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-brand-400 font-bold">•</span>
                  <span>Attach clear IDE screenshots or code snippets for error debugging.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>Mention Time & Space complexity for algorithmic discussions.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>Give authentic, constructive feedback on courses and features.</span>
                </li>
              </ul>
              <div className="pt-2">
                <Link
                  to={ROUTES.ABOUT}
                  className="inline-flex items-center gap-1 text-xs font-bold text-brand-400 hover:text-brand-300 hover:underline font-mono"
                >
                  <span>Learn about NextEra Philosophy</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ➕ CREATE POST FULL STUDIO MODAL */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 p-6 sm:p-8 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-500 flex items-center justify-center">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Community Post Studio</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Share your doubt, build, or course review</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-dark-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              {/* Category Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Select Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'review', label: 'Review & Rating', icon: Star },
                    { id: 'problem', label: 'Doubt / Problem', icon: HelpCircle },
                    { id: 'project', label: 'Project Showcase', icon: Rocket },
                    { id: 'general', label: 'General / Tip', icon: MessageSquare },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isSelected = newCategory === item.id;
                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => setNewCategory(item.id as PostCategory)}
                        className={`flex items-center gap-1.5 p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-500 text-brand-600 dark:text-brand-300 shadow-xs'
                            : 'bg-slate-50 dark:bg-dark-850 border-slate-200 dark:border-dark-750 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Star Rating Selector (If Review) */}
              {newCategory === 'review' && (
                <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 space-y-1.5 animate-fade-in">
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300 block">
                    Your Platform / Course Rating
                  </span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setNewRating(star)}
                        className="p-1 cursor-pointer transition-transform hover:scale-125"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= newRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-dark-700'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400 ml-2 font-mono">
                      {newRating}.0 / 5.0 Rating
                    </span>
                  </div>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Post Title
                </label>
                <input
                  type="text"
                  placeholder={
                    newCategory === 'review'
                      ? 'e.g. My experience learning DSA & Web Development on NextEra Coders'
                      : newCategory === 'problem'
                      ? 'e.g. Getting TLE in Kadane Algorithm problem on large test cases'
                      : newCategory === 'project'
                      ? 'e.g. Built a Real-Time Collaborative Canvas App with WebSockets'
                      : 'e.g. Best roadmap to master Graph algorithms in 30 days'
                  }
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  maxLength={200}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-dark-850 border border-slate-200 dark:border-dark-750 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Content / Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Code Details
                </label>
                <textarea
                  rows={4}
                  placeholder="Provide detailed explanation, test cases, or full review points..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-dark-850 border border-slate-200 dark:border-dark-750 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-y"
                />
              </div>

              {/* Upload Images from PC */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Attach Screenshots / Photos from PC or Device (Max 4)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    disabled={compressing || attachedImages.length >= 4}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-750 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-dark-700 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {compressing ? (
                      <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-brand-500" />
                    )}
                    <span>{compressing ? 'Compressing...' : 'Upload from PC / Device'}</span>
                  </button>

                  <span className="text-[11px] text-slate-400 font-mono">
                    {attachedImages.length}/4 photos attached
                  </span>
                </div>

                {/* Attached Preview Thumbnails */}
                {attachedImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-2.5 mt-3">
                    {attachedImages.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-dark-700 aspect-square group shadow-xs"
                      >
                        <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeAttachedImage(idx)}
                          className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-md shadow-md opacity-90 hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-dark-800 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submitting || compressing}
                  leftIcon={submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  className="rounded-xl font-bold px-5"
                >
                  {submitting ? 'Publishing...' : 'Publish Post'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🛡️ EDIT / MODERATE POST MODAL */}
      {/* ========================================================================= */}
      {editingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {user?.role === 'admin' || user?.role === 'sub_admin'
                      ? 'Moderate / Edit Post'
                      : 'Edit Your Post'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Update content, category, screenshots, or pinned status
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingPost(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditPost} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as PostCategory)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-dark-850 border border-slate-200 dark:border-dark-750 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="general">💬 General Discussion</option>
                  <option value="review">⭐ Platform Review / Feedback</option>
                  <option value="problem">🧩 Coding Doubt / Problem Solution</option>
                  <option value="project">🚀 Project Showcase</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  maxLength={200}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-dark-850 border border-slate-200 dark:border-dark-750 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Content
                </label>
                <textarea
                  rows={4}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-dark-850 border border-slate-200 dark:border-dark-750 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 resize-y"
                />
              </div>

              {/* Upload Images from Device */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Screenshots / Photos ({editImages.length}/4)
                </label>
                <input
                  ref={editFileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleEditImageUpload}
                  className="hidden"
                />

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    disabled={editCompressing || editImages.length >= 4}
                    onClick={() => editFileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-750 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-dark-700 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {editCompressing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ImageIcon className="w-3.5 h-3.5 text-brand-500" />
                    )}
                    <span>{editCompressing ? 'Compressing...' : 'Add Photos'}</span>
                  </button>
                </div>

                {editImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 pt-2.5">
                    {editImages.map((img, idx) => (
                      <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-dark-700 group">
                        <img src={img} alt={`Attached ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeEditImage(idx)}
                          className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full transition-opacity cursor-pointer shadow-md"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {(user?.role === 'admin' || user?.role === 'sub_admin') && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/40">
                  <input
                    type="checkbox"
                    id="editIsPinned"
                    checked={editIsPinned}
                    onChange={(e) => setEditIsPinned(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                  />
                  <label htmlFor="editIsPinned" className="text-xs font-bold text-amber-800 dark:text-amber-300 cursor-pointer">
                    Pin post to the top of the community feed (Moderator action)
                  </label>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 dark:border-dark-800 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingPost(null)}
                  className="rounded-xl font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={editSaving || editCompressing}
                  leftIcon={editSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  className="rounded-xl font-bold px-5"
                >
                  {editSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🚩 REPORT POST MODAL */}
      {/* ========================================================================= */}
      {reportingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shadow-2xl overflow-hidden p-6 sm:p-7 space-y-5 animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Report Inappropriate Post
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Help keep NextEra Community safe for student coders
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReportingPost(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Post Snippet */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-950 border border-slate-100 dark:border-dark-800 text-xs space-y-1">
              <p className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                "{reportingPost.title}"
              </p>
              <p className="text-slate-500 dark:text-slate-400 line-clamp-2">
                {reportingPost.content}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Select Violation Reason <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {[
                    { id: '18+ Adult Content / Inappropriate', label: '🔞 18+ Adult / Explicit / Inappropriate Content', desc: 'Sexually explicit material, NSFW images or adult text' },
                    { id: 'Spam, Scam, or Commercial Promotion', label: '🛑 Spam, Scam or Fraudulent Promotion', desc: 'Commercial products, affiliate spam or phishing links' },
                    { id: 'Harassment, Hate Speech, or Abuse', label: '⚠️ Harassment or Abusive Behavior', desc: 'Attacking users, hate speech or violent language' },
                    { id: 'Malicious Code or Dangerous Links', label: '🚫 Malicious Code or Security Threat', desc: 'Dangerous script execution or harmful links' },
                    { id: 'Other Guideline Violation', label: '📝 Other Community Guidelines Violation', desc: 'Any other violation of our learning platform rules' },
                  ].map((option) => (
                    <label
                      key={option.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                        reportReason === option.id
                          ? 'border-red-500 bg-red-50/50 dark:bg-red-950/30'
                          : 'border-slate-200 dark:border-dark-800 hover:bg-slate-50 dark:hover:bg-dark-800'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reportReason"
                        value={option.id}
                        checked={reportReason === option.id}
                        onChange={(e) => setReportReason(e.target.value)}
                        className="mt-0.5 text-red-600 focus:ring-red-500 cursor-pointer"
                      />
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-900 dark:text-white">{option.label}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{option.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Optional Details */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Additional Details (Optional)
                </label>
                <textarea
                  rows={2}
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Explain why this post is inappropriate..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Security info note */}
              <div className="p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300">
                🛡️ Posts receiving 8+ reports are automatically removed from public view and escalated to administrators for immediate review.
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReportingPost(null)}
                  className="rounded-xl font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={reportSubmitting}
                  className="rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white border-none px-5"
                >
                  {reportSubmitting ? 'Submitting...' : 'Submit Report'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🖼️ IMAGE LIGHTBOX MODAL */}
      {/* ========================================================================= */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in cursor-zoom-out"
          onClick={() => setLightboxImg(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={lightboxImg}
              alt="Enlarged Attachment"
              className="w-full h-full object-contain rounded-2xl shadow-2xl border border-white/10"
            />
            <button
              onClick={() => setLightboxImg(null)}
              className="absolute -top-3 -right-3 p-2 bg-white dark:bg-dark-800 text-slate-800 dark:text-white rounded-full shadow-lg border border-slate-200 dark:border-dark-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityPage;
