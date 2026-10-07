export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';

export interface ICourseInstructor {
  name: string;
  role: string;
  avatar?: string;
  bio?: string;
}

export interface ICourse {
  id: string;
  _id?: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  thumbnail: string;
  category: string;
  level: CourseLevel;
  instructor: ICourseInstructor;
  duration: string;
  tags: string[];
  requirements: string[];
  whatYouWillLearn: string[];
  originalPrice?: number;
  proPrice?: number;
  freePrice?: number;
  isProAvailable?: boolean;
  isIncludedInMembership?: boolean;
  includedInProPlans?: ('monthly' | 'yearly' | 'lifetime')[];
  isFeatured: boolean;
  isPublished: boolean;
  modulesCount?: number;
  lessonsCount?: number;
  enrollmentsCount?: number;
  curriculum?: IModuleWithLessons[];
  totalModules?: number;
  totalLessons?: number;
  isEnrolled?: boolean;
  enrollmentTier?: 'free' | 'pro';
  createdAt: string;
  updatedAt: string;
}

export interface ILessonResource {
  title: string;
  url: string;
  type: 'PDF' | 'Link' | 'Code' | 'File' | 'Other';
}

export interface ILesson {
  id: string;
  _id?: string;
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
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IModule {
  id: string;
  _id?: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface IModuleWithLessons extends IModule {
  lessons: ILesson[];
}

export interface CoursePagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
}

export interface CourseListResponse {
  courses: ICourse[];
  pagination: CoursePagination;
  stats?: {
    total: number;
    pro?: number;
    free?: number;
    published?: number;
    drafts?: number;
  };
}

export interface EnrolledCourseItem {
  enrollmentId: string;
  tier?: 'free' | 'pro';
  progress: number;
  enrolledAt: string;
  upgradedAt?: string;
  course: ICourse;
}
