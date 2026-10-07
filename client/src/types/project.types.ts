import { CoursePagination } from './course.types';

export type ProjectDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface IProject {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
  difficulty: ProjectDifficulty;
  category: string;
  technologies: string[];
  requirements: string[];
  features: string[];
  learningOutcomes: string[];
  githubUrl?: string;
  demoUrl?: string;
  isPublished: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface IProjectListResponse {
  projects: IProject[];
  pagination: CoursePagination;
}

export interface IProjectCategory {
  category: string;
  count: number;
}
