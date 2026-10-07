import { z } from 'zod';

export const createTutorialSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(200),
  slug: z.string().trim().optional(),
  excerpt: z.string().trim().min(5, 'Excerpt is required').max(500),
  content: z.string().min(5, 'Content must be at least 5 characters'),
  thumbnail: z.string().optional().default(''),
  diagramImageUrl: z.string().optional().default(''),
  track: z.string().optional().default('python'),
  sectionTitle: z.string().optional().default('Fundamentals'),
  quickFacts: z.string().optional().default(''),
  keyPoints: z.array(z.string()).optional().default([]),
  codeSnippet: z
    .object({
      language: z.string().optional().default('python'),
      filename: z.string().optional().default(''),
      code: z.string().optional().default(''),
      output: z.string().optional().default(''),
    })
    .optional(),
  quiz: z
    .object({
      question: z.string().optional().default(''),
      options: z.array(z.string()).optional().default([]),
      correctIndex: z.number().optional().default(0),
      explanation: z.string().optional().default(''),
    })
    .optional(),
  practiceProblemLink: z.string().optional().default(''),
  videoUrl: z.string().optional().default(''),
  videoDuration: z.string().optional().default(''),
  videoSource: z.string().optional().default('YouTube'),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced', 'All Levels']).optional().default('All Levels'),
  type: z.enum(['video', 'article', 'both']).optional().default('article'),
  category: z.string().trim().min(2, 'Category is required'),
  tags: z.array(z.string()).default([]),
  isPublished: z.boolean().default(true),
});

export const updateTutorialSchema = createTutorialSchema.partial();
