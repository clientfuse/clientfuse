import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import { defaultHttpConfig, EnvironmentConfig, HttpConfig } from './http-config.model';

export class HttpClientFactory {
  private static instances = new Map<string, AxiosInstance>();

  static create(config?: Partial<HttpConfig>, instanceKey = 'default'): AxiosInstance {
    if (this.instances.has(instanceKey)) {
      return this.instances.get(instanceKey)!;
    }

    const finalConfig: HttpConfig = {
      ...defaultHttpConfig,
      ...config,
      headers: {
        ...defaultHttpConfig.headers,
        ...(config?.headers || {})
      }
    };

    const instance = axios.create(finalConfig);

    this.setupInterceptors(instance, finalConfig);
    this.instances.set(instanceKey, instance);

    return instance;
  }

  static createFromEnv(instanceKey = 'default'): AxiosInstance {
    const envConfig: EnvironmentConfig = {
      baseUrl: process.env.HTTP_BASE_URL || 'http://localhost:3000',
      timeout: Number(process.env.HTTP_TIMEOUT) || defaultHttpConfig.timeout!,
      enableRetries: process.env.HTTP_ENABLE_RETRIES !== 'false',
      logLevel: (process.env.HTTP_LOG_LEVEL as any) || 'basic'
    };

    const config: HttpConfig = {
      ...defaultHttpConfig,
      baseURL: envConfig.baseUrl,
      timeout: envConfig.timeout,
      headers: { ...defaultHttpConfig.headers },
      retries: envConfig.enableRetries ? defaultHttpConfig.retries : 0,
      enableLogging: envConfig.logLevel !== 'none'
    };

    return this.create(config, instanceKey);
  }

  private static setupInterceptors(instance: AxiosInstance, config: HttpConfig): void {
    if (config.enableLogging) {
      instance.interceptors.request.use(
        (request) => {
          console.log(`🔄 HTTP Request: ${request.method?.toUpperCase()} ${request.url}`);
          return request;
        },
        (error) => {
          console.error('❌ Request Error:', error);
          return Promise.reject(error);
        }
      );
    }

    instance.interceptors.response.use(
      (response: AxiosResponse) => {
        if (config.enableLogging) {
          console.log(`✅ HTTP Response: ${response.status} ${response.config.url}`);
        }
        return response;
      },
      async (error: AxiosError) => {
        if (config.enableLogging) {
          console.error(`❌ HTTP Error: ${error.response?.status} ${error.config?.url}`);
        }

        if (this.shouldRetry(error) && config.retries && config.retries > 0) {
          const retryCount = (error.config as any).__retryCount || 0;

          if (retryCount < config.retries) {
            (error.config as any).__retryCount = retryCount + 1;

            await this.delay(config.retryDelay || 1000);
            return instance(error.config!);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private static shouldRetry(error: AxiosError): boolean {
    return (
      !error.response ||
      error.response.status >= 500 ||
      error.response.status === 429 ||
      error.code === 'ECONNRESET' ||
      error.code === 'ETIMEDOUT'
    );
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static getInstance(key = 'default'): AxiosInstance | undefined {
    return this.instances.get(key);
  }

  static clearInstances(): void {
    this.instances.clear();
  }
}

export const facebookHttpClient = HttpClientFactory.create({ baseURL: 'https://graph.facebook.com/v19.0' });
