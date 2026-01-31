import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../interfaces/clerk-user.interface';

/**
 * Decorator para obtener el usuario autenticado del request
 *
 * @example
 * ```typescript
 * @Get('profile')
 * getProfile(@CurrentUser() user: AuthenticatedUser) {
 *   return { userId: user.userId, email: user.email };
 * }
 *
 * // Obtener solo una propiedad específica
 * @Get('profile')
 * getProfile(@CurrentUser('userId') userId: string) {
 *   return { userId };
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;

    // Si se especifica una propiedad, retornar solo esa propiedad
    return data ? user?.[data] : user;
  },
);
