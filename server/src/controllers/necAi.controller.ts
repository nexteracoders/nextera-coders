import { Request, Response } from 'express';
import { z } from 'zod';
import necAiService from '../services/necAi.service';

const debugSchema = z.object({
  problemTitle: z.string().min(1, 'Problem title is required'),
  problemDescription: z.string().optional(),
  code: z.string().min(1, 'Code is required'),
  language: z.string().default('javascript'),
  verdict: z.string().default('Wrong Answer'),
  failedTestCase: z
    .object({
      input: z.string().optional(),
      expectedOutput: z.string().optional(),
      actualOutput: z.string().optional(),
    })
    .optional(),
  errorMessage: z.string().optional(),
  userMessage: z.string().optional(),
});

const hintSchema = z.object({
  problemTitle: z.string().min(1, 'Problem title is required'),
  problemDescription: z.string().optional(),
  hintLevel: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  code: z.string().optional(),
  language: z.string().optional(),
});

const chatSchema = z.object({
  problemTitle: z.string().min(1, 'Problem title is required'),
  problemDescription: z.string().optional(),
  code: z.string().optional(),
  language: z.string().optional(),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'model', 'assistant']),
        text: z.string(),
      })
    )
    .optional(),
  message: z.string().min(1, 'Message is required'),
});

const fixCompilerSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  language: z.string().default('javascript'),
  errorMessage: z.string().min(1, 'Error message is required'),
  fileName: z.string().optional(),
});

const generateTestCasesSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  language: z.string().default('javascript'),
  fileName: z.string().optional(),
});

/**
 * Socratic AI Debugger endpoint
 * POST /api/v1/nec-ai/debug
 */
export const debugCode = async (req: Request, res: Response) => {
  try {
    const parseResult = debugSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid debug request payload',
        errors: parseResult.error.flatten(),
      });
    }

    const result = await necAiService.debugStudentCode(parseResult.data);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[necAi.controller] Error in debugCode:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process AI debugging request',
      error: error.message,
    });
  }
};

/**
 * Progressive Hints endpoint (Hint 1: Approach, Hint 2: Data Structure, Hint 3: Pseudocode)
 * POST /api/v1/nec-ai/hints
 */
export const getProgressiveHint = async (req: Request, res: Response) => {
  try {
    const parseResult = hintSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid hint request payload',
        errors: parseResult.error.flatten(),
      });
    }

    const result = await necAiService.getProgressiveHint(parseResult.data);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[necAi.controller] Error in getProgressiveHint:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate progressive hint',
      error: error.message,
    });
  }
};

/**
 * Socratic Chat with NEC AI
 * POST /api/v1/nec-ai/chat
 */
export const chatWithMentor = async (req: Request, res: Response) => {
  try {
    const parseResult = chatSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid chat request payload',
        errors: parseResult.error.flatten(),
      });
    }

    const result = await necAiService.chatWithMentor(parseResult.data);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[necAi.controller] Error in chatWithMentor:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process AI chat query',
      error: error.message,
    });
  }
};

/**
 * Fix with AI: Diagnoses compiler/runtime error and auto-corrects code
 * POST /api/v1/nec-ai/compiler-fix
 */
export const fixCompilerError = async (req: Request, res: Response) => {
  try {
    const parseResult = fixCompilerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid compiler fix request payload',
        errors: parseResult.error.flatten(),
      });
    }

    const result = await necAiService.fixCompilerError(parseResult.data);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[necAi.controller] Error in fixCompilerError:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process AI compiler fix',
      error: error.message,
    });
  }
};

/**
 * Generate Test Cases: Auto-generates 5 diverse edge cases tailored to active code
 * POST /api/v1/nec-ai/generate-testcases
 */
export const generateCompilerTestCases = async (req: Request, res: Response) => {
  try {
    const parseResult = generateTestCasesSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid test cases request payload',
        errors: parseResult.error.flatten(),
      });
    }

    const result = await necAiService.generateCompilerTestCases(parseResult.data);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[necAi.controller] Error in generateCompilerTestCases:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate edge test cases',
      error: error.message,
    });
  }
};

/**
 * Health check & configuration status
 * GET /api/v1/nec-ai/status
 */
export const getAiStatus = async (_req: Request, res: Response) => {
  return res.json({
    success: true,
    data: {
      name: 'NEC AI Mentor & Socratic Copilot',
      isGeminiConfigured: necAiService.isGeminiConfigured(),
      model: process.env.GEMINI_MODEL?.trim() || 'gemini-3.5-flash',
      availableFeatures: [
        'Socratic Debugger',
        'Progressive Hints (Hint 1: Approach, Hint 2: Data Structure, Hint 3: Pseudocode)',
        'Conversational Mentor',
        'Fix with AI (Compiler Doctor & Auto-Fix)',
        'Generate Test Cases (Custom Input Edge Generator)',
      ],
    },
  });
};
