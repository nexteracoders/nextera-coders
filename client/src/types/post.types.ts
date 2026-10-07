export type PostCategory = 'review' | 'problem' | 'project' | 'general';

export interface PostComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
  rawCreatedAt?: string;
  isCurrentUser?: boolean;
}

export interface PostReport {
  id: string;
  userId: string;
  userName: string;
  reason: string;
  details?: string;
  createdAt: string;
}

export interface PostItem {
  id: string;
  authorId: string;
  authorName: string;
  authorEmail?: string;
  authorAvatar?: string;
  authorCollege?: string;
  title: string;
  content: string;
  category: PostCategory;
  rating?: number;
  images: string[];
  likesCount: number;
  hasLiked: boolean;
  isCurrentUser: boolean;
  isPinned: boolean;
  reportsCount?: number;
  isFlagged?: boolean;
  hasReported?: boolean;
  reports?: PostReport[];
  commentsCount: number;
  comments: PostComment[];
  createdAt: string;
  rawCreatedAt?: string;
}

export interface CreatePostInput {
  title: string;
  content: string;
  category: PostCategory;
  rating?: number;
  images?: string[];
}

export interface UpdatePostInput {
  title?: string;
  content?: string;
  category?: PostCategory;
  rating?: number;
  images?: string[];
  isPinned?: boolean;
}

