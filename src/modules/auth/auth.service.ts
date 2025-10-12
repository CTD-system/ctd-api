import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  // Aquí puedes agregar métodos para autenticación, login, registro, etc.
  login(userData: any): string {
    // Lógica de autenticación
    return 'Usuario autenticado';
  }

  register(userData: any): string {
    // Lógica de registro
    return 'Usuario registrado';
  }
}
