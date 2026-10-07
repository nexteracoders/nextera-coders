import api from './api';
import {
  IRunCodeResult,
  ISubmissionResult,
  ISubmissionHistoryItem,
} from '../types/problem.types';
import { CoursePagination } from '../types/course.types';

export const submissionService = {
  // Run code against test input
  runCode: async (language: string, code: string, input?: string): Promise<IRunCodeResult> => {
    const response = await api.post('/code/run', { language, code, input });
    return response.data.data;
  },

  // Submit solution against full test suite
  submitSolution: async (
    problemId: string,
    language: string,
    code: string
  ): Promise<ISubmissionResult> => {
    const response = await api.post('/submissions', { problemId, language, code });
    return response.data.data;
  },

  // Get current user's submissions
  getMySubmissions: async (
    page: number = 1,
    limit: number = 20
  ): Promise<{ submissions: ISubmissionHistoryItem[]; pagination: CoursePagination }> => {
    const response = await api.get('/submissions/my', { params: { page, limit } });
    return response.data.data;
  },

  // Get submissions for a specific problem
  getProblemSubmissions: async (problemId: string): Promise<any[]> => {
    const response = await api.get(`/submissions/problem/${problemId}`);
    return response.data.data.submissions;
  },

  // Get/poll status of a queued submission
  getSubmissionStatus: async (submissionId: string): Promise<ISubmissionResult> => {
    const response = await api.get(`/submissions/${submissionId}/status`);
    return response.data.data;
  },
};
