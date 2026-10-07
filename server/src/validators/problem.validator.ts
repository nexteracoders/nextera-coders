import { z } from 'zod';

export const createProblemSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(150),
  slug: z.string().trim().optional(),
  description: z.string().trim().min(10, 'Description must be at least 10 characters'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  category: z.string().trim().min(2, 'Category is required'),
  constraints: z.array(z.string()).default([]),
  examples: z
    .array(
      z.object({
        input: z.string(),
        output: z.string(),
        explanation: z.string().optional(),
      })
    )
    .min(1, 'At least one example is required'),
  hints: z.array(z.string()).default([]),
  testCases: z
    .array(
      z.object({
        input: z.string(),
        expectedOutput: z.string(),
        hidden: z.boolean().default(false),
      })
    )
    .min(1, 'At least one test case is required'),
  starterCode: z
    .object({
      javascript: z.string().optional(),
      python: z.string().optional(),
      java: z.string().optional(),
      cpp: z.string().optional(),
      c: z.string().optional(),
    })
    .default({}),
  solution: z.string().optional(),
  supportedLanguages: z.array(z.string()).default(['javascript', 'python', 'java', 'cpp', 'c']),
  expectedComplexity: z
    .object({
      time: z.string().optional(),
      space: z.string().optional(),
    })
    .default({ time: 'O(n)', space: 'O(1)' }),
  order: z.coerce.number().int().positive().optional(),
  isPublished: z.boolean().default(true),
});

export const updateProblemSchema = createProblemSchema.partial();
