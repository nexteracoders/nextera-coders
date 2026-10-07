import { z } from 'zod';

export const createLessonSchema = z.object({
  courseId: z.string().trim().min(1, 'Course ID is required'),
  moduleId: z.string().trim().min(1, 'Module ID is required'),
  title: z.string().trim().min(2, 'Lesson title must be at least 2 characters').max(150),
  description: z.string().trim().optional().default(''),
  videoUrl: z.string().trim().optional().default(''),
  thumbnail: z.string().trim().optional().default(''),
  duration: z.string().trim().optional().default('5 mins'),
  order: z.number().int().min(1).optional(),
  notes: z.string().optional().default(''),
  resources: z
    .array(
      z.object({
        title: z.string().trim().min(1, 'Resource title is required'),
        url: z.string().trim().min(1, 'Resource URL is required'),
        type: z.enum(['PDF', 'Link', 'Code', 'File', 'Other']).default('Link'),
      })
    )
    .optional()
    .default([]),
  isFree: z.boolean().optional().default(false),
  isPublished: z.boolean().optional().default(true),
});

export const updateLessonSchema = createLessonSchema.partial();
