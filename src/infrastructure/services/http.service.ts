/**
 * HTTP Client Service
 * Configures axios with interceptors for authentication and error handling
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG, STORAGE_KEYS } from '../config/api.config';
import { storageService } from './storage.service';

class HttpClient {
  private client: AxiosInstance;

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
          // Handle specific HTTP status codes
          switch (error.response.status) {
            case 401:
              // Unauthorized - Clear token and redirect to login
              await storageService.remove(STORAGE_KEYS.AUTH_TOKEN);
              await storageService.remove(STORAGE_KEYS.USER_DATA);
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
  async get<T>(url: string) {
    return this.client.get<T>(url);
  }

  /**
   * POST request
   */
  async post<T, D = any>(url: string, data?: D) {
    return this.client.post<T>(url, data);
  }

  /**
   * PUT request
   */
  async put<T, D = any>(url: string, data?: D) {
    return this.client.put<T>(url, data);
  }

  /**
   * DELETE request
   */
  async delete<T>(url: string) {
    return this.client.delete<T>(url);
  }
}

export const httpClient = new HttpClient();
export const httpService = httpClient;

