export * from './auth.types';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  code?: string;
}

export interface HealthCheckResponse {
  success: boolean;
  message: string;
  data?: {
    status: string;
    uptime: number;
    timestamp: string;
    environment: string;
    database: string;
  };
}

export interface NavItem {
  label: string;
  path: string;
  icon?: string;
  badge?: string;
  description?: string;
  children?: NavItem[];
  isExternal?: boolean;
}

export interface ToastMessage {
  id: string;
  title?: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}
