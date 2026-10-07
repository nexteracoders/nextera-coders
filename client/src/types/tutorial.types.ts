import { CoursePagination } from './course.types';

export interface ITutorialCodeSnippet {
  language: string;
  filename?: string;
  code: string;
  output?: string;
}

export interface ITutorialQuiz {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ITutorialSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  thumbnail: string;
  diagramImageUrl?: string;
  track?: string;
  sectionTitle?: string;
  quickFacts?: string;
  keyPoints?: string[];
  codeSnippet?: ITutorialCodeSnippet;
  quiz?: ITutorialQuiz;
  practiceProblemLink?: string;
  videoUrl?: string;
  videoDuration?: string;
  videoSource?: string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  type?: 'video' | 'article' | 'both';
  category: string;
  tags: string[];
  author: {
    id?: string;
    name: string;
    profileImage?: string;
  };
  readingTime: number;
  isPublished: boolean;
  publishedAt: string;
  createdAt: string;
}

export interface ITutorialDetail {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  thumbnail: string;
  diagramImageUrl?: string;
  track?: string;
  sectionTitle?: string;
  quickFacts?: string;
  keyPoints?: string[];
  codeSnippet?: ITutorialCodeSnippet;
  quiz?: ITutorialQuiz;
  practiceProblemLink?: string;
  videoUrl?: string;
  videoDuration?: string;
  videoSource?: string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  type?: 'video' | 'article' | 'both';
  category: string;
  tags: string[];
  author: {
    id?: string;
    name: string;
    bio?: string;
    role?: string;
    profileImage?: string;
  };
  readingTime: number;
  views: number;
  isPublished: boolean;
  publishedAt: string;
  createdAt: string;
}

export interface ITutorialListResponse {
  tutorials: ITutorialSummary[];
  pagination: CoursePagination;
}

export interface ITutorialCategory {
  category: string;
  count: number;
}
