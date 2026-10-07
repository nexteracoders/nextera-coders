import { z } from 'zod';

export const createProjectSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(150),
  slug: z.string().trim().optional(),
  description: z.string().trim().min(10, 'Description must be at least 10 characters'),
  thumbnail: z.string().optional().default(''),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']).default('Intermediate'),
  category: z.string().trim().min(2, 'Category is required'),
  technologies: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  features: z.array(z.string()).default([]),
  learningOutcomes: z.array(z.string()).default([]),
  githubUrl: z.string().optional().default(''),
  demoUrl: z.string().optional().default(''),
  isPublished: z.boolean().default(true),
  order: z.number().default(0),
});

export const updateProjectSchema = createProjectSchema.partial();
