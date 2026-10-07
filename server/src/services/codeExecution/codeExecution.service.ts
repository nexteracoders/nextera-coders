import { CodeExecutionProvider, SingleExecutionResult, SubmissionEvaluationResult, TestCaseInput } from './types';
import { LocalSandboxExecutionProvider } from './sandboxProvider';

class CodeExecutionService {
  private provider: CodeExecutionProvider;

  constructor(provider?: CodeExecutionProvider) {
    this.provider = provider || new LocalSandboxExecutionProvider();
  }

  // Set an alternative provider (e.g. Docker, Judge0, Remote Sandbox)
  public setProvider(provider: CodeExecutionProvider): void {
    this.provider = provider;
  }

  // Execute single run
  public async runCode(language: string, code: string, input?: string): Promise<SingleExecutionResult> {
    return this.provider.runCode(language, code, input);
  }

  // Evaluate full problem test cases
  public async evaluateSubmission(
    language: string,
    code: string,
    testCases: TestCaseInput[]
  ): Promise<SubmissionEvaluationResult> {
    return this.provider.evaluateSubmission(language, code, testCases);
  }
}

export const codeExecutionService = new CodeExecutionService();
