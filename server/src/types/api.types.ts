export interface ApiResponseSuccess<T = unknown> {
  success: true;
  message: string;
  data?: T;
}

export interface ApiResponseError {
  success: false;
  message: string;
  code: string;
}

export type ApiResponse<T = unknown> = ApiResponseSuccess<T> | ApiResponseError;

export interface HealthCheckData {
  status: 'online' | 'degraded';
  uptime: number;
  timestamp: string;
  environment: string;
  database: 'connected' | 'disconnected' | 'connecting';
}
