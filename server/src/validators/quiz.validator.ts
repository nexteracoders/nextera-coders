import { z } from 'zod';

export const createQuizSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(150),
  slug: z.string().trim().optional(),
  courseId: z.string().trim().optional(),
  lessonId: z.string().trim().optional(),
  description: z.string().trim().min(5, 'Description is required'),
  passingScore: z.number().min(1).max(100).default(70),
  timeLimit: z.number().min(0).default(15),
  isPublished: z.boolean().default(true),
  questions: z
    .array(
      z.object({
        question: z.string().trim().min(3, 'Question text is required'),
        options: z.array(z.string().trim().min(1)).min(2, 'At least 2 options are required'),
        correctAnswer: z.string().trim().min(1, 'Correct answer is required'),
        explanation: z.string().optional(),
        marks: z.number().min(1).default(1),
        order: z.number().default(1),
      })
    )
    .min(1, 'Quiz must have at least 1 question'),
});

export const updateQuizSchema = createQuizSchema.partial();

export const submitQuizSchema = z.object({
  attemptId: z.string().trim().optional(),
  answers: z.array(
    z.object({
      questionIndex: z.number().min(0),
      selectedAnswer: z.string().trim(),
    })
  ),
  timeTaken: z.number().min(0).default(0), // in seconds
});
