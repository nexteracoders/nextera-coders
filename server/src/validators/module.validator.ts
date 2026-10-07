import { z } from 'zod';

export const createModuleSchema = z.object({
  courseId: z.string().trim().min(1, 'Course ID is required'),
  title: z.string().trim().min(2, 'Module title must be at least 2 characters').max(150),
  description: z.string().trim().optional().default(''),
  order: z.number().int().min(1).optional(),
});

export const updateModuleSchema = z.object({
  title: z.string().trim().min(2).max(150).optional(),
  description: z.string().trim().optional(),
  order: z.number().int().min(1).optional(),
});
