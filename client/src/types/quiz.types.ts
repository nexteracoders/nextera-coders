import { CoursePagination } from './course.types';

export interface IQuizSummary {
  id: string;
  title: string;
  slug: string;
  description: string;
  course?: { id: string; title: string; slug: string } | null;
  totalQuestions: number;
  passingScore: number;
  timeLimit: number;
  totalAttempts?: number;
  userAttempt?: {
    passed: boolean;
    score: number;
    percentage: number;
  } | null;
  createdAt: string;
}

export interface IQuizDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  course?: { id: string; title: string; slug: string } | null;
  lesson?: { id: string; title: string } | null;
  totalQuestions: number;
  passingScore: number;
  timeLimit: number;
  totalAttempts: number;
  previousAttempts?: IQuizAttemptSummary[];
}

export interface IQuizQuestionPlayer {
  index: number;
  question: string;
  options: string[];
  marks: number;
  order: number;
}

export interface IQuizStartResponse {
  attemptId: string;
  quiz: {
    id: string;
    title: string;
    timeLimit: number;
    passingScore: number;
    totalQuestions: number;
    questions: IQuizQuestionPlayer[];
  };
  startedAt: string;
}

export interface IQuizSubmitPayload {
  attemptId?: string;
  answers: {
    questionIndex: number;
    selectedAnswer: string;
  }[];
  timeTaken: number;
}

export interface IQuizQuestionReview {
  questionIndex: number;
  question: string;
  options: string[];
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
  marks: number;
  marksEarned: number;
}

export interface IQuizResultResponse {
  attemptId: string;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  passingScore: number;
  timeTaken: number;
  completedAt: string;
  review: IQuizQuestionReview[];
}

export interface IQuizAttemptSummary {
  id: string;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  timeTaken: number;
  completedAt: string;
}

export interface IAdminQuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  marks: number;
  order: number;
}

export interface IAdminQuiz {
  id: string;
  title: string;
  slug: string;
  courseId?: string;
  courseTitle?: string;
  lessonId?: string;
  description: string;
  questions: IAdminQuizQuestion[];
  passingScore: number;
  timeLimit: number;
  isPublished: boolean;
  totalQuestions?: number;
  createdAt: string;
  updatedAt: string;
}

export interface IQuizListResponse {
  quizzes: IQuizSummary[];
  pagination: CoursePagination;
}
