export type ProblemDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface IProblemExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface IProblemTestCase {
  input: string;
  expectedOutput: string;
  hidden?: boolean;
}

export interface IStarterCode {
  [key: string]: string | undefined;
  javascript?: string;
  python?: string;
  java?: string;
  cpp?: string;
  c?: string;
}

export interface IExpectedComplexity {
  time?: string;
  space?: string;
}

export interface IProblemListItem {
  id: string;
  title: string;
  slug: string;
  order?: number;
  difficulty: ProblemDifficulty;
  category: string;
  youtubeUrl?: string;
  supportedLanguages: string[];
  expectedComplexity: IExpectedComplexity;
  acceptanceRate: number;
  totalSubmissions: number;
  status: 'Solved' | 'Attempted' | 'Unsolved';
  createdAt: string;
}

export interface IProblemDetail {
  id: string;
  title: string;
  slug: string;
  order?: number;
  description: string;
  difficulty: ProblemDifficulty;
  category: string;
  youtubeUrl?: string;
  constraints: string[];
  examples: IProblemExample[];
  hints: string[];
  starterCode: IStarterCode;
  supportedLanguages: string[];
  expectedComplexity: IExpectedComplexity;
  sampleTestCases: { input: string; expectedOutput: string; explanation?: string }[];
  hiddenTestCases?: { input: string; expectedOutput: string; explanation?: string; hidden?: boolean }[];
  acceptanceRate: number;
  totalSubmissions: number;
  companies?: string[];
  points?: number;
  accuracy?: string;
  averageTime?: string;
  submissionsCount?: string;
  isSolved: boolean;
  isAttempted: boolean;
  createdAt: string;
}

export interface IProblemCategoryStat {
  category: string;
  totalProblems: number;
  easyCount: number;
  mediumCount: number;
  hardCount: number;
}

export interface IDSAStats {
  totalProblems: number;
  difficulty: {
    easy: { total: number; solved: number };
    medium: { total: number; solved: number };
    hard: { total: number; solved: number };
  };
  userProgress: {
    solved: number;
    attempted: number;
    unsolved: number;
  };
  categories: { name: string; count: number }[];
}

export interface ITestCaseResult {
  passed: boolean;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  error?: string;
  executionTime: number;
  hidden: boolean;
}

export interface IRunCodeResult {
  output: string;
  error?: string;
  executionTime: number;
  memory: number;
  passed?: boolean;
  status: string;
}

export interface ISubmissionResult {
  submission: {
    id: string;
    problemId: string;
    status: 'Queued' | 'Processing' | 'Accepted' | 'Wrong Answer' | 'Runtime Error' | 'Compilation Error' | 'Time Limit Exceeded' | 'Memory Limit Exceeded' | 'Internal Error';
    executionTime: number;
    memory: number;
    testCasesPassed: number;
    totalTestCases: number;
    errorMessage?: string;
    submittedAt: string;
    details: ITestCaseResult[];
  };
}

export interface ISubmissionHistoryItem {
  id: string;
  problem: {
    id: string;
    title: string;
    slug: string;
    difficulty: ProblemDifficulty;
    category: string;
  };
  language: string;
  code: string;
  status: string;
  executionTime: number;
  memory: number;
  testCasesPassed: number;
  totalTestCases: number;
  submittedAt: string;
}
