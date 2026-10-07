export type ExecutionStatus =
  | 'Success'
  | 'Wrong Answer'
  | 'Runtime Error'
  | 'Compilation Error'
  | 'Time Limit Exceeded'
  | 'Memory Limit Exceeded'
  | 'Internal Error';

export interface SingleExecutionResult {
  output: string;
  error?: string;
  executionTime: number; // ms
  memory: number; // KB
  status: ExecutionStatus;
}

export interface TestCaseInput {
  input: string;
  expectedOutput: string;
  hidden?: boolean;
}

export interface TestCaseResult {
  passed: boolean;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  error?: string;
  executionTime: number;
  hidden: boolean;
}

export interface SubmissionEvaluationResult {
  status: 'Accepted' | 'Wrong Answer' | 'Runtime Error' | 'Compilation Error' | 'Time Limit Exceeded' | 'Memory Limit Exceeded' | 'Internal Error';
  executionTime: number;
  memory: number;
  testCasesPassed: number;
  totalTestCases: number;
  errorMessage?: string;
  details: TestCaseResult[];
}

export interface CodeExecutionProvider {
  runCode(language: string, code: string, input?: string): Promise<SingleExecutionResult>;
  evaluateSubmission(
    language: string,
    code: string,
    testCases: TestCaseInput[]
  ): Promise<SubmissionEvaluationResult>;
}
