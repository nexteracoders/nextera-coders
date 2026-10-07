import { apiClient } from './api';
import { HealthCheckResponse } from '../types';

export const healthService = {
  checkHealth: async (): Promise<HealthCheckResponse> => {
    const response = await apiClient.get<HealthCheckResponse>('/health');
    return response.data;
  },
};
