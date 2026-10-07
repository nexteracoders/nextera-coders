import apiClient from './api';

export interface IDebugRequestPayload {
  problemTitle: string;
  problemDescription?: string;
  code: string;
  language: string;
  verdict: 'Wrong Answer' | 'Runtime Error' | 'Time Limit Exceeded' | 'Compilation Error' | string;
  failedTestCase?: {
    input?: string;
    expectedOutput?: string;
    actualOutput?: string;
  };
  errorMessage?: string;
  userMessage?: string;
}

export interface IHintRequestPayload {
  problemTitle: string;
  problemDescription?: string;
  hintLevel: 1 | 2 | 3;
  code?: string;
  language?: string;
}

export interface IChatRequestPayload {
  problemTitle: string;
  problemDescription?: string;
  code?: string;
  language?: string;
  history?: Array<{ role: 'user' | 'model' | 'assistant'; text: string }>;
  message: string;
}

export interface IDebugResponse {
  message: string;
  source: 'gemini' | 'heuristic';
  model?: string;
}

export interface IHintResponse {
  hintLevel: 1 | 2 | 3;
  title: string;
  content: string;
  source: 'gemini' | 'heuristic';
}

export interface IChatResponse {
  message: string;
  source: 'gemini' | 'heuristic';
}

export interface IAiStatusResponse {
  name: string;
  isGeminiConfigured: boolean;
  model: string;
  availableFeatures: string[];
}

export interface IFixCompilerErrorPayload {
  code: string;
  language: string;
  errorMessage: string;
  fileName?: string;
}

export interface IFixCompilerErrorResponse {
  explanation: string;
  fixedCode: string;
  diffSummary: string;
  lineSuggestion?: number;
  source: 'gemini' | 'heuristic';
  model?: string;
}

export interface ITestCaseItem {
  id: string;
  title: string;
  input: string;
  category: 'zero_empty' | 'negative' | 'typical' | 'large_scale' | 'edge_boundary';
  explanation: string;
}

export interface IGenerateTestCasesPayload {
  code: string;
  language: string;
  fileName?: string;
}

export interface IGenerateTestCasesResponse {
  testCases: ITestCaseItem[];
  combinedStdin: string;
  source: 'gemini' | 'heuristic';
}

export const necAiService = {
  /**
   * Request Socratic AI debugging for student's failed code submission
   */
  async debugCode(payload: IDebugRequestPayload): Promise<IDebugResponse> {
    const res = await apiClient.post('/nec-ai/debug', payload);
    return res.data?.data;
  },

  /**
   * Fetch progressive hint (Level 1: Intuition, Level 2: Data Structure, Level 3: Pseudocode)
   */
  async getProgressiveHint(payload: IHintRequestPayload): Promise<IHintResponse> {
    const res = await apiClient.post('/nec-ai/hints', payload);
    return res.data?.data;
  },

  /**
   * Chat directly with NEC AI Mentor
   */
  async chatWithMentor(payload: IChatRequestPayload): Promise<IChatResponse> {
    const res = await apiClient.post('/nec-ai/chat', payload);
    return res.data?.data;
  },

  /**
   * Fix with AI: Diagnose error, explain root cause in Hinglish/English, and auto-correct code
   */
  async fixCompilerError(payload: IFixCompilerErrorPayload): Promise<IFixCompilerErrorResponse> {
    const res = await apiClient.post('/nec-ai/compiler-fix', payload);
    return res.data?.data;
  },

  /**
   * Generate Test Cases: Auto-generate 5 diverse edge cases tailored to the student's code
   */
  async generateTestCases(payload: IGenerateTestCasesPayload): Promise<IGenerateTestCasesResponse> {
    const res = await apiClient.post('/nec-ai/generate-testcases', payload);
    return res.data?.data;
  },

  /**
   * Fetch NEC AI configuration & health status
   */
  async getAiStatus(): Promise<IAiStatusResponse> {
    const res = await apiClient.get('/nec-ai/status');
    return res.data?.data;
  },
};

export default necAiService;
