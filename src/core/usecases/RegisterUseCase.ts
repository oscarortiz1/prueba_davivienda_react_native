import { AuthRepository } from '../domain/repositories/AuthRepository';
import { User } from '../domain/entities/User';

export class RegisterUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(name: string, email: string, password: string): Promise<User> {
    if (!name || !email || !password) {
      throw new Error('Todos los campos son requeridos');
    }
    
    if (password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Email inválido');
    }

    return await this.authRepository.register(name, email, password);
  }
}
