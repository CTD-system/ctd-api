import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorador personalizado que extrae el usuario autenticado del request.
 * Se puede utilizar en los controladores para obtener el usuario desde el token JWT.
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    
    const request = ctx.switchToHttp().getRequest();
    console.log(request.user)
    return request.user;  // Se asume que el middleware de autenticación ha añadido el usuario al request
  },
);
