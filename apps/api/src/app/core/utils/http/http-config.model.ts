import { AxiosRequestConfig } from 'axios';

export interface HttpConfig extends AxiosRequestConfig {
  readonly retries?: number;
  readonly retryDelay?: number;
  readonly enableLogging?: boolean;
}

export interface ApiEndpoints {
  readonly api: string;
  readonly auth: string;
  readonly upload: string;
}

export interface EnvironmentConfig {
  readonly baseUrl: string;
  readonly timeout: number;
  readonly enableRetries: boolean;
  readonly logLevel: 'none' | 'basic' | 'detailed';
}

export const defaultHttpConfig: HttpConfig = {
  timeout: 10000,
  retries: 3,
  retryDelay: 1000,
  enableLogging: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  validateStatus: (status: number) => status >= 200 && status < 300,
  maxRedirects: 5
} as const;
