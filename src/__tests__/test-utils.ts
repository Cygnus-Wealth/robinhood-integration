import { vi } from 'vitest';
import { AxiosResponse, AxiosError } from 'axios';

export function createMockAxiosResponse<T = any>(data: T, status = 200): AxiosResponse<T> {
  return {
    data,
    status,
    statusText: 'OK',
    headers: {},
    config: {} as any,
  };
}

export function createAxiosError(
  message: string,
  status?: number,
  data?: any
): AxiosError {
  const error = new Error(message) as AxiosError;
  error.isAxiosError = true;
  error.response = status ? {
    data,
    status,
    statusText: '',
    headers: {},
    config: {} as any,
  } : undefined;
  return error;
}

export function mockAxiosInstance() {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    create: vi.fn(),
    interceptors: {
      request: {
        use: vi.fn(),
      },
      response: {
        use: vi.fn(),
      },
    },
  };
}