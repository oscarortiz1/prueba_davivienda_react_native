import { AuthRepository } from '../../core/domain/repositories/AuthRepository';
import { User } from '../../core/domain/entities/User';
import { authRemoteDataSource } from '../datasources/auth.datasource';
import { storageService } from '../../infrastructure/services/storage.service';
import { STORAGE_KEYS } from '../../infrastructure/config/api.config';

export class AuthRepositoryImpl implements AuthRepository {
  /**
   * Login user and store authentication data
   */
  async login(email: string, password: string): Promise<User> {
    try {
      const response = await authRemoteDataSource.login({ email, password });
      
      // Store token and user data
      await storageService.set(STORAGE_KEYS.AUTH_TOKEN, response.token);
      await storageService.set(STORAGE_KEYS.USER_DATA, JSON.stringify(response));
      
      // Map AuthResponse to User entity
      const user: User = {
        id: response.userId,
        name: response.name,
        email: response.email,
        createdAt: new Date(),
      };
      
      return user;
    } catch (error: any) {
      throw new Error(error.message || 'Error al iniciar sesión');
    }
  }

  /**
   * Register new user and store authentication data
   */
  async register(name: string, email: string, password: string): Promise<User> {
    try {
      const response = await authRemoteDataSource.register({ name, email, password });
      
      // Store token and user data
      await storageService.set(STORAGE_KEYS.AUTH_TOKEN, response.token);
      await storageService.set(STORAGE_KEYS.USER_DATA, JSON.stringify(response));
      
      // Map AuthResponse to User entity
      const user: User = {
        id: response.userId,
        name: response.name,
        email: response.email,
        createdAt: new Date(),
      };
      
      return user;
    } catch (error: any) {
      throw new Error(error.message || 'Error al registrar usuario');
    }
  }

  /**
   * Logout user and clear authentication data
   */
  async logout(): Promise<void> {
    try {
      await storageService.remove(STORAGE_KEYS.AUTH_TOKEN);
      await storageService.remove(STORAGE_KEYS.USER_DATA);
    } catch (error: any) {
      throw new Error('Error al cerrar sesión');
    }
  }

  /**
   * Get current authenticated user from storage or API
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const token = await storageService.get(STORAGE_KEYS.AUTH_TOKEN);
      
      if (!token) {
        return null;
      }

      const userData = await storageService.get(STORAGE_KEYS.USER_DATA);
      
      if (userData) {
        const authResponse = JSON.parse(userData);
        return {
          id: authResponse.userId,
          name: authResponse.name,
          email: authResponse.email,
          createdAt: new Date(),
        };
      }

      // If no cached data, fetch from API
      const response = await authRemoteDataSource.getCurrentUser();
      
      // Update cached data
      await storageService.set(STORAGE_KEYS.USER_DATA, JSON.stringify(response));
      
      return {
        id: response.userId,
        name: response.name,
        email: response.email,
        createdAt: new Date(),
      };
    } catch (error) {
      // If token is invalid, clear storage
      await storageService.remove(STORAGE_KEYS.AUTH_TOKEN);
      await storageService.remove(STORAGE_KEYS.USER_DATA);
      return null;
    }
  }
}

