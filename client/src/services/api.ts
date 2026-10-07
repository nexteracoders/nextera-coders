import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse } from '../types';

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || '/api';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true, // Enables cookie sending & receiving across all requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse>) => {
    const formattedError: ApiResponse = {
      success: false,
      message: error.response?.data?.message || error.message || 'An unexpected error occurred',
      code: error.response?.data?.code || 'NETWORK_ERROR',
    };
    return Promise.reject(formattedError);
  }
);

export const api = apiClient;
export default apiClient;
