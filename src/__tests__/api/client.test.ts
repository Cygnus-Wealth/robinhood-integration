import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import axios from 'axios';
import { RobinhoodClient } from '../../api/client';
import { RobinhoodConfig } from '../../types';
import { mockCredentials, mockCredentialsWithMFA, mockAuthTokens } from '../mock-data';
import { createMockAxiosResponse, createAxiosError } from '../test-utils';

vi.mock('axios');

describe('RobinhoodClient', () => {
  let client: RobinhoodClient;
  let mockAxiosCreate: any;
  let mockAxiosInstance: any;

  beforeEach(() => {
    mockAxiosInstance = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: {
          use: vi.fn(),
        },
        response: {
          use: vi.fn(),
        },
      },
    };

    mockAxiosCreate = vi.fn().mockReturnValue(mockAxiosInstance);
    (axios.create as any) = mockAxiosCreate;
    (axios.isAxiosError as any) = vi.fn((error: any) => error.isAxiosError);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create client with default config', () => {
      client = new RobinhoodClient();

      expect(mockAxiosCreate).toHaveBeenCalledWith({
        baseURL: 'https://api.robinhood.com',
        timeout: 30000,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
    });

    it('should create client with custom config', () => {
      const customConfig: RobinhoodConfig = {
        baseUrl: 'https://custom.api.com',
        timeout: 60000,
        retryAttempts: 5,
        retryDelay: 2000,
      };

      client = new RobinhoodClient(customConfig);

      expect(mockAxiosCreate).toHaveBeenCalledWith({
        baseURL: 'https://custom.api.com',
        timeout: 60000,
        headers: expect.any(Object),
      });
    });

    it('should set auth token if provided in config', () => {
      const config: RobinhoodConfig = {
        accessToken: 'initial-token',
      };

      client = new RobinhoodClient(config);
      expect(client.isAuthenticated()).toBe(true);
    });

    it('should setup interceptors', () => {
      client = new RobinhoodClient();

      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('authenticate', () => {
    beforeEach(() => {
      client = new RobinhoodClient();
    });

    it('should authenticate successfully', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce(
        createMockAxiosResponse(mockAuthTokens)
      );

      const result = await client.authenticate(mockCredentials);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api-token-auth/',
        expect.objectContaining({
          username: mockCredentials.username,
          password: mockCredentials.password,
          device_token: mockCredentials.deviceToken,
          expires_in: 86400,
          scope: 'internal',
          challenge_type: 'sms',
          mfa_code: undefined,
        })
      );
      expect(result).toEqual(mockAuthTokens);
      expect(client.isAuthenticated()).toBe(true);
    });

    it('should authenticate with MFA code', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce(
        createMockAxiosResponse(mockAuthTokens)
      );

      const result = await client.authenticate(mockCredentialsWithMFA);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api-token-auth/',
        expect.objectContaining({
          mfa_code: '123456',
        })
      );
      expect(result).toEqual(mockAuthTokens);
    });

    it('should generate device token if not provided', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce(
        createMockAxiosResponse(mockAuthTokens)
      );

      const credentialsWithoutDevice = {
        username: 'test@example.com',
        password: 'password',
      };

      await client.authenticate(credentialsWithoutDevice);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api-token-auth/',
        expect.objectContaining({
          device_token: expect.stringMatching(/^[a-z0-9]{40}$/),
        })
      );
    });

    it('should throw MFA_REQUIRED error when MFA is needed', async () => {
      const error = createAxiosError('Bad Request', 400, { mfa_required: true });
      mockAxiosInstance.post.mockRejectedValueOnce(error);
      (axios.isAxiosError as any).mockReturnValue(true);

      await expect(client.authenticate(mockCredentials)).rejects.toThrow('MFA_REQUIRED');
    });

    it('should throw generic error for other failures', async () => {
      const error = new Error('Network error');
      mockAxiosInstance.post.mockRejectedValueOnce(error);

      await expect(client.authenticate(mockCredentials)).rejects.toThrow('Network error');
    });
  });

  describe('refreshAccessToken', () => {
    beforeEach(() => {
      client = new RobinhoodClient();
    });

    it('should refresh token successfully', async () => {
      // First authenticate to set tokens
      mockAxiosInstance.post.mockResolvedValueOnce(
        createMockAxiosResponse(mockAuthTokens)
      );
      await client.authenticate(mockCredentials);

      // Mock refresh response
      const newTokens = { ...mockAuthTokens, accessToken: 'new-access-token' };
      mockAxiosInstance.post.mockResolvedValueOnce(
        createMockAxiosResponse(newTokens)
      );

      const result = await client.refreshAccessToken();

      expect(mockAxiosInstance.post).toHaveBeenLastCalledWith(
        '/oauth/token/',
        expect.objectContaining({
          grant_type: 'refresh_token',
          refresh_token: mockAuthTokens.refreshToken,
          scope: 'internal',
          client_id: 'c82SH0WZOsabOXGP2sxqcj34FxkvfnWRZBKlBjFS',
        })
      );
      expect(result).toEqual(newTokens);
    });

    it('should throw error if no refresh token available', async () => {
      await expect(client.refreshAccessToken()).rejects.toThrow('No refresh token available');
    });

    it('should use custom client ID if provided', async () => {
      const customClient = new RobinhoodClient({ clientId: 'custom-client-id' });
      
      // Set auth tokens manually
      customClient.setAuthToken('access-token');
      const tokens = customClient.getAuthTokens();
      if (tokens) {
        tokens.refreshToken = 'refresh-token';
      }

      mockAxiosInstance.post.mockResolvedValueOnce(
        createMockAxiosResponse(mockAuthTokens)
      );

      await customClient.refreshAccessToken();

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/oauth/token/',
        expect.objectContaining({
          client_id: 'custom-client-id',
        })
      );
    });
  });

  describe('interceptors', () => {
    let requestInterceptor: any;
    let responseInterceptor: any;

    beforeEach(() => {
      mockAxiosInstance.interceptors.request.use.mockImplementation((fn) => {
        requestInterceptor = fn;
      });
      mockAxiosInstance.interceptors.response.use.mockImplementation((success, error) => {
        responseInterceptor = { success, error };
      });

      client = new RobinhoodClient();
    });

    describe('request interceptor', () => {
      it('should add authorization header when authenticated', async () => {
        mockAxiosInstance.post.mockResolvedValueOnce(
          createMockAxiosResponse(mockAuthTokens)
        );
        await client.authenticate(mockCredentials);

        const config = { headers: {} };
        const result = requestInterceptor(config);

        expect(result.headers.Authorization).toBe(`Bearer ${mockAuthTokens.accessToken}`);
      });

      it('should not add authorization header when not authenticated', () => {
        const config = { headers: {} };
        const result = requestInterceptor(config);

        expect(result.headers.Authorization).toBeUndefined();
      });
    });

    describe('response interceptor', () => {
      it('should pass through successful responses', async () => {
        const response = { data: 'success' };
        const result = await responseInterceptor.success(response);
        expect(result).toBe(response);
      });

      it('should retry request on 401 with refresh token', async () => {
        // Setup authenticated client
        mockAxiosInstance.post.mockResolvedValueOnce(
          createMockAxiosResponse(mockAuthTokens)
        );
        await client.authenticate(mockCredentials);

        // Mock refresh token success
        const newTokens = { ...mockAuthTokens, accessToken: 'new-token' };
        mockAxiosInstance.post.mockResolvedValueOnce(
          createMockAxiosResponse(newTokens)
        );

        // Mock retry success
        const retryResponse = { data: 'retry-success' };
        // mockAxiosInstance is a function that should be called by the interceptor
        (mockAxiosInstance as any) = vi.fn().mockResolvedValueOnce(retryResponse);

        const error = {
          response: { status: 401 },
          config: { _retry: false },
        };

        const result = await responseInterceptor.error(error);
        expect(result).toBe(retryResponse);
      });

      it('should not retry if request already retried', async () => {
        const error = {
          response: { status: 401 },
          config: { _retry: true },
        };

        await expect(responseInterceptor.error(error)).rejects.toEqual(error);
      });

      it('should clear auth tokens if refresh fails', async () => {
        // Setup authenticated client
        mockAxiosInstance.post.mockResolvedValueOnce(
          createMockAxiosResponse(mockAuthTokens)
        );
        await client.authenticate(mockCredentials);

        // Mock refresh token failure
        mockAxiosInstance.post.mockRejectedValueOnce(new Error('Refresh failed'));

        const error = {
          response: { status: 401 },
          config: { _retry: false },
        };

        await expect(responseInterceptor.error(error)).rejects.toThrow('Refresh failed');
        expect(client.isAuthenticated()).toBe(false);
      });

      it('should reject non-401 errors', async () => {
        const error = {
          response: { status: 500 },
          config: {},
        };

        await expect(responseInterceptor.error(error)).rejects.toEqual(error);
      });
    });
  });

  describe('HTTP methods', () => {
    beforeEach(() => {
      client = new RobinhoodClient();
    });

    it('should perform GET request', async () => {
      const mockData = { result: 'data' };
      mockAxiosInstance.get.mockResolvedValueOnce(
        createMockAxiosResponse(mockData)
      );

      const result = await client.get('/test-endpoint');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test-endpoint', undefined);
      expect(result).toEqual(mockData);
    });

    it('should perform POST request', async () => {
      const mockData = { result: 'created' };
      const postData = { name: 'test' };
      mockAxiosInstance.post.mockResolvedValueOnce(
        createMockAxiosResponse(mockData)
      );

      const result = await client.post('/test-endpoint', postData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test-endpoint', postData, undefined);
      expect(result).toEqual(mockData);
    });

    it('should perform PUT request', async () => {
      const mockData = { result: 'updated' };
      const putData = { name: 'updated' };
      mockAxiosInstance.put.mockResolvedValueOnce(
        createMockAxiosResponse(mockData)
      );

      const result = await client.put('/test-endpoint', putData);

      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/test-endpoint', putData, undefined);
      expect(result).toEqual(mockData);
    });

    it('should perform DELETE request', async () => {
      const mockData = { result: 'deleted' };
      mockAxiosInstance.delete.mockResolvedValueOnce(
        createMockAxiosResponse(mockData)
      );

      const result = await client.delete('/test-endpoint');

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/test-endpoint', undefined);
      expect(result).toEqual(mockData);
    });
  });

  describe('paginate', () => {
    beforeEach(() => {
      client = new RobinhoodClient();
    });

    it('should paginate through results with next links', async () => {
      const page1 = {
        results: [{ id: 1 }, { id: 2 }],
        next: '/endpoint?page=2',
      };
      const page2 = {
        results: [{ id: 3 }, { id: 4 }],
        next: '/endpoint?page=3',
      };
      const page3 = {
        results: [{ id: 5 }],
        next: null,
      };

      mockAxiosInstance.get
        .mockResolvedValueOnce(createMockAxiosResponse(page1))
        .mockResolvedValueOnce(createMockAxiosResponse(page2))
        .mockResolvedValueOnce(createMockAxiosResponse(page3));

      const result = await client.paginate('/endpoint');

      expect(result).toEqual([
        { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }
      ]);
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(3);
    });

    it('should handle array responses', async () => {
      const arrayResponse = [{ id: 1 }, { id: 2 }];
      mockAxiosInstance.get.mockResolvedValueOnce(
        createMockAxiosResponse(arrayResponse)
      );

      const result = await client.paginate('/endpoint');

      expect(result).toEqual(arrayResponse);
    });

    it('should handle single object responses', async () => {
      const singleObject = { id: 1, name: 'test' };
      mockAxiosInstance.get.mockResolvedValueOnce(
        createMockAxiosResponse(singleObject)
      );

      const result = await client.paginate('/endpoint');

      expect(result).toEqual([singleObject]);
    });
  });

  describe('utility methods', () => {
    beforeEach(() => {
      client = new RobinhoodClient();
    });

    it('should set auth token', () => {
      client.setAuthToken('test-token');

      expect(client.isAuthenticated()).toBe(true);
      expect(client.getAuthTokens()).toEqual({
        accessToken: 'test-token',
        refreshToken: '',
        expiresIn: 86400,
        tokenType: 'Bearer',
        scope: 'internal',
      });
    });

    it('should check authentication status', () => {
      expect(client.isAuthenticated()).toBe(false);

      client.setAuthToken('token');
      expect(client.isAuthenticated()).toBe(true);
    });

    it('should get auth tokens', async () => {
      expect(client.getAuthTokens()).toBeUndefined();

      mockAxiosInstance.post.mockResolvedValueOnce(
        createMockAxiosResponse(mockAuthTokens)
      );
      await client.authenticate(mockCredentials);

      expect(client.getAuthTokens()).toEqual(mockAuthTokens);
    });
  });
});