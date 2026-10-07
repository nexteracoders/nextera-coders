import { z } from 'zod';

export const createCourseSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(150, 'Title cannot exceed 150 characters'),
  slug: z.string().trim().optional(),
  description: z.string().trim().min(10, 'Description must be at least 10 characters'),
  shortDescription: z.string().trim().min(5, 'Short description must be at least 5 characters').max(300, 'Cannot exceed 300 characters'),
  thumbnail: z.string().trim().optional().default(''),
  category: z.string().trim().min(2, 'Category is required'),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced', 'All Levels']).default('All Levels'),
  instructor: z.object({
    name: z.string().trim().min(2, 'Instructor name is required'),
    role: z.string().trim().min(2, 'Instructor role is required'),
    avatar: z.string().trim().optional().default(''),
    bio: z.string().trim().optional().default(''),
  }),
  duration: z.string().trim().optional().default('0 Hours'),
  tags: z.array(z.string().trim()).optional().default([]),
  requirements: z.array(z.string().trim()).optional().default([]),
  whatYouWillLearn: z.array(z.string().trim()).optional().default([]),
  originalPrice: z.number().optional().default(9999),
  proPrice: z.number().optional().default(1999),
  isProAvailable: z.boolean().optional().default(true),
  isIncludedInMembership: z.boolean().optional().default(true),
  includedInProPlans: z.array(z.enum(['monthly', 'yearly', 'lifetime'])).optional().default(['monthly', 'yearly', 'lifetime']),
  isFeatured: z.boolean().optional().default(false),
  isPublished: z.boolean().optional().default(false),
});

export const updateCourseSchema = createCourseSchema.partial();
