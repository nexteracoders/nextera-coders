import { z } from 'zod';

export const runCodeSchema = z.object({
  language: z.string().trim().min(1, 'Language is required'),
  code: z.string().min(1, 'Code payload is required').max(50000, 'Code cannot exceed 50,000 characters'),
  input: z.string().max(10000, 'Input cannot exceed 10,000 characters').optional().default(''),
});

export const submitCodeSchema = z.object({
  problemId: z.string().trim().min(1, 'Problem ID is required'),
  language: z.string().trim().min(1, 'Language is required'),
  code: z.string().min(1, 'Code payload is required').max(50000, 'Code cannot exceed 50,000 characters'),
});
