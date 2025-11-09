/**
 * HTTP Client Service
 * Configures axios with interceptors for authentication and error handling
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG, STORAGE_KEYS } from '../config/api.config';
import { storageService } from './storage.service';

class HttpClient {
  private client: AxiosInstance;
  private authStore: any = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Set auth store for clearing user state on auth errors
   */
  setAuthStore(store: any) {
    this.authStore = store;
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor - Add JWT token to headers
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const token = await storageService.get(STORAGE_KEYS.AUTH_TOKEN);
        
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - Handle common errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response) {
          const isAuthEndpoint = error.config?.url?.includes('/auth/');
          
          // Handle specific HTTP status codes
          switch (error.response.status) {
            case 401:
            case 403:
              // Don't clear auth on login/register endpoints
              if (!isAuthEndpoint) {
                // Unauthorized/Forbidden - Clear token and user state
                await storageService.remove(STORAGE_KEYS.AUTH_TOKEN);
                await storageService.remove(STORAGE_KEYS.USER_DATA);
                
                // Clear user from store if available
                if (this.authStore) {
                  this.authStore.getState().logout();
                }
              }
              break;
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * GET request
   */
  async get<T>(url: string): Promise<T> {
    const response = await this.client.get<T>(url);
    return response.data;
  }

  /**
   * POST request
   */
  async post<T, D = any>(url: string, data?: D): Promise<T> {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }

  /**
   * PUT request
   */
  async put<T, D = any>(url: string, data?: D): Promise<T> {
    const response = await this.client.put<T>(url, data);
    return response.data;
  }

  /**
   * DELETE request
   */
  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<T>(url);
    return response.data;
  }
}

export const httpClient = new HttpClient();
export const httpService = httpClient;

