import { ICourse, ILessonResource } from './course.types';

export interface ILearningLesson {
  id: string;
  courseId: string;
  moduleId: string;
  title: string;
  description: string;
  videoUrl?: string;
  thumbnail?: string;
  duration: string;
  order: number;
  notes?: string;
  resources?: ILessonResource[];
  isFree: boolean;
  isCompleted: boolean;
}

export interface ILearningModule {
  id: string;
  title: string;
  description?: string;
  order: number;
  lessons: {
    id: string;
    title: string;
    description: string;
    duration: string;
    isFree: boolean;
    order: number;
    hasVideo: boolean;
    isCompleted: boolean;
    thumbnail?: string;
    videoUrl?: string;
  }[];
}

export interface ILearningNavigation {
  prevLesson: { id: string; title: string; duration: string; isFree: boolean } | null;
  nextLesson: { id: string; title: string; duration: string; isFree: boolean } | null;
  currentLessonIndex: number;
  totalLessons: number;
}

export interface ILearningCourseData {
  course: {
    id: string;
    title: string;
    slug: string;
    category: string;
    level: string;
    duration: string;
    originalPrice?: number;
    proPrice?: number;
    freePrice?: number;
    instructor: {
      name: string;
      role: string;
      avatar?: string;
      bio?: string;
    };
  };
  enrollment: {
    id: string;
    tier?: 'free' | 'pro';
    progress: number;
    completedLessons: string[];
    lastAccessedLesson?: string;
    isCompleted: boolean;
    completedAt?: string;
  } | null;
  curriculum: ILearningModule[];
  activeLessonId: string | null;
  totalLessons: number;
  completedCount: number;
}

export interface ILessonDetailsResponse {
  lesson: ILearningLesson;
  module: { id: string; title: string; order: number } | null;
  course: { id: string; title: string; slug: string; category: string };
  navigation: ILearningNavigation;
}

export interface IEnrollmentProgress {
  courseId: string;
  progress: number;
  completedLessons: string[];
  lastAccessedLesson?: string;
  totalLessons: number;
  completedLessonCount: number;
  isCompleted: boolean;
  completedAt?: string;
}

export interface IEnrolledCourseCard {
  enrollmentId: string;
  progress: number;
  completedLessonsCount: number;
  totalLessons: number;
  isCompleted: boolean;
  enrolledAt: string;
  completedAt?: string;
  lastAccessedLesson?: {
    id: string;
    title: string;
    duration: string;
  } | null;
  course: ICourse;
}

export interface IStudentDashboardSummary {
  enrolledCourses: number;
  inProgressCourses: number;
  completedCourses: number;
  completedLessons: number;
}

export interface IContinueLearningItem {
  enrollmentId: string;
  courseId: string;
  title: string;
  slug: string;
  category: string;
  level: string;
  progress: number;
  completedLessonsCount: number;
  totalLessons: number;
  lastAccessedLesson?: {
    id: string;
    title: string;
    duration: string;
  } | null;
}

export interface IRecentLessonItem {
  id: string;
  title: string;
  duration: string;
  courseTitle: string;
  courseSlug: string;
  accessedAt: string;
}

export interface ICompletedCourseItem {
  enrollmentId: string;
  courseId: string;
  title: string;
  slug: string;
  category: string;
  completedAt: string;
}

export interface ILearningActivityItem {
  type: 'ENROLLED' | 'COMPLETED_COURSE';
  description: string;
  timestamp: string;
}

export interface IStudentDashboardData {
  summary: IStudentDashboardSummary;
  continueLearning: IContinueLearningItem[];
  recentLessons: IRecentLessonItem[];
  completedCourses: ICompletedCourseItem[];
  activity: ILearningActivityItem[];
}
