import { AuthRepository } from '../../core/domain/repositories/AuthRepository';
import { User } from '../../core/domain/entities/User';

export class AuthRepositoryImpl implements AuthRepository {
  async login(email: string, password: string): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      id: '1',
      name: 'Usuario Demo',
      email: email,
      createdAt: new Date(),
    };
  }

  async register(name: string, email: string, password: string): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      id: '1',
      name: name,
      email: email,
      createdAt: new Date(),
    };
  }

  async logout(): Promise<void> {
  }

  async getCurrentUser(): Promise<User | null> {
    return null;
  }
}
