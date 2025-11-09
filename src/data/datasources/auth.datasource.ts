/**
 * Auth Remote DataSource
 * Handles all authentication-related HTTP requests
 */

import { httpClient } from '../../infrastructure/services/http.service';
import { API_CONFIG } from '../../infrastructure/config/api.config';
import { LoginRequest, RegisterRequest, AuthResponse } from '../models/auth.dto';

export interface AuthRemoteDataSource {
  login(request: LoginRequest): Promise<AuthResponse>;
  register(request: RegisterRequest): Promise<AuthResponse>;
  getCurrentUser(): Promise<AuthResponse>;
}

export class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  /**
   * Login user
   */
  async login(request: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await httpClient.post<AuthResponse>(
        API_CONFIG.ENDPOINTS.AUTH.LOGIN,
        request
      );
      return response;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Credenciales inválidas. Verifica tu email y contraseña.');
      }
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw new Error('Error al iniciar sesión. Por favor, intente de nuevo.');
    }
  }

  /**
   * Register new user
   */
  async register(request: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await httpClient.post<AuthResponse>(
        API_CONFIG.ENDPOINTS.AUTH.REGISTER,
        request
      );
      return response;
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw new Error(error.response?.data?.message || 'Datos de registro inválidos.');
      }
      
      if (error.response?.status === 409) {
        throw new Error('El email ya está registrado. Intenta con otro email.');
      }
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw new Error('Error al registrar usuario. Por favor, intente de nuevo.');
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<AuthResponse> {
    try {
      const response = await httpClient.get<AuthResponse>(
        API_CONFIG.ENDPOINTS.AUTH.ME
      );
      return response;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Error al obtener usuario actual.');
    }
  }
}

export const authRemoteDataSource = new AuthRemoteDataSourceImpl();
