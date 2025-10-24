import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard de autenticación basado en JWT.
 * Utiliza el Passport JWT Strategy para verificar el token y extraer el usuario.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
