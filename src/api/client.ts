import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { RobinhoodConfig, AuthTokens, RobinhoodCredentials } from '../types';

export class RobinhoodClient {
  private axios: AxiosInstance;
  private config: RobinhoodConfig;
  private authTokens?: AuthTokens;

  constructor(config: RobinhoodConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || 'https://api.robinhood.com',
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
      ...config,
    };

    this.axios = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (config.accessToken) {
      this.setAuthToken(config.accessToken);
    }

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.axios.interceptors.request.use(
      (config) => {
        if (this.authTokens?.accessToken) {
          config.headers.Authorization = `Bearer ${this.authTokens.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          if (this.authTokens?.refreshToken) {
            try {
              await this.refreshAccessToken();
              return this.axios(originalRequest);
            } catch (refreshError) {
              this.authTokens = undefined;
              throw refreshError;
            }
          }
        }

        return Promise.reject(error);
      }
    );
  }

  public async authenticate(credentials: RobinhoodCredentials): Promise<AuthTokens> {
    try {
      const response = await this.axios.post<AuthTokens>('/api-token-auth/', {
        username: credentials.username,
        password: credentials.password,
        device_token: credentials.deviceToken || this.generateDeviceToken(),
        expires_in: 86400,
        scope: 'internal',
        challenge_type: 'sms',
        mfa_code: credentials.mfaCode,
      });

      this.authTokens = response.data;
      return this.authTokens;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        const data = error.response.data;
        if (data.mfa_required) {
          throw new Error('MFA_REQUIRED');
        }
      }
      throw error;
    }
  }

  public async refreshAccessToken(): Promise<AuthTokens> {
    if (!this.authTokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.axios.post<AuthTokens>('/oauth/token/', {
      grant_type: 'refresh_token',
      refresh_token: this.authTokens.refreshToken,
      scope: 'internal',
      client_id: this.config.clientId || 'c82SH0WZOsabOXGP2sxqcj34FxkvfnWRZBKlBjFS',
    });

    this.authTokens = response.data;
    return this.authTokens;
  }

  public setAuthToken(accessToken: string): void {
    this.authTokens = {
      accessToken,
      refreshToken: '',
      expiresIn: 86400,
      tokenType: 'Bearer',
      scope: 'internal',
    };
  }

  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.get<T>(url, config);
    return response.data;
  }

  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.post<T>(url, data, config);
    return response.data;
  }

  public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.put<T>(url, data, config);
    return response.data;
  }

  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.delete<T>(url, config);
    return response.data;
  }

  public async paginate<T = any>(url: string): Promise<T[]> {
    const results: T[] = [];
    let nextUrl: string | null = url;

    while (nextUrl) {
      const response: any = await this.get<any>(nextUrl);
      
      if (response.results) {
        results.push(...response.results);
      } else if (Array.isArray(response)) {
        results.push(...response);
      } else {
        results.push(response);
      }

      nextUrl = response.next || null;
    }

    return results;
  }

  private generateDeviceToken(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 40; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  public isAuthenticated(): boolean {
    return !!this.authTokens?.accessToken;
  }

  public getAuthTokens(): AuthTokens | undefined {
    return this.authTokens;
  }
}