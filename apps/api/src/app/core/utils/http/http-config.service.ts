import axiosRetry, { IAxiosRetryConfig } from 'axios-retry';


export function createRetryConfig(): IAxiosRetryConfig {
  return {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay,
    shouldResetTimeout: true,
    retryCondition: (error) => {
      const status = error.response?.status;

      if (!status) return true;

      return status >= 500 || status === 429;
    },
    onRetry: (retryCount, error, requestConfig) => {
      const url = requestConfig.url;
      const method = requestConfig.method?.toUpperCase();
      const status = error.response?.status || 'Network Error';

      console.log(
        `[HTTP Retry] Attempt ${retryCount} for ${method} ${url} - Status: ${status}`
      );
    },
    onMaxRetryTimesExceeded: (error, retryCount) => {
      const url = error.config?.url;
      const method = error.config?.method?.toUpperCase();
      const status = error.response?.status || 'Network Error';

      console.error(
        `[HTTP Retry] Max retries (${retryCount}) exceeded for ${method} ${url} - Final Status: ${status}`
      );
    }
  };
}

