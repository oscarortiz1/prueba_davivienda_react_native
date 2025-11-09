/**
 * Authentication Hook
 * Provides easy access to auth state and actions
 */

import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { LoginUseCase } from '../../core/usecases/LoginUseCase';
import { RegisterUseCase } from '../../core/usecases/RegisterUseCase';
import { AuthRepositoryImpl } from '../../data/repositories/AuthRepositoryImpl';

const authRepository = new AuthRepositoryImpl();
const loginUseCase = new LoginUseCase(authRepository);
const registerUseCase = new RegisterUseCase(authRepository);

export const useAuth = () => {
  const { user, isLoading, error, setUser, setLoading, setError, logout: clearUser } = useAuthStore();
  const toast = useToastStore();

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const user = await loginUseCase.execute(email, password);
      setUser(user);
      toast.success(`¡Bienvenido, ${user.name}!`);
      return user;
    } catch (err: any) {
      const errorMessage = err.message || 'Error al iniciar sesión';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const user = await registerUseCase.execute(name, email, password);
      setUser(user);
      toast.success(`¡Cuenta creada exitosamente! Bienvenido, ${user.name}!`);
      return user;
    } catch (err: any) {
      const errorMessage = err.message || 'Error al registrar usuario';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authRepository.logout();
      clearUser();
      toast.info('Sesión cerrada correctamente');
    } catch (err: any) {
      clearUser();
      toast.info('Sesión cerrada');
    }
  };

  const checkAuthStatus = async () => {
    setLoading(true);
    try {
      const currentUser = await authRepository.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
    } catch (err: any) {
      // Silent fail - user will need to login
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    isLoading,
    error,
    login,
    register,
    logout,
    checkAuthStatus,
    isAuthenticated: !!user,
  };
};
