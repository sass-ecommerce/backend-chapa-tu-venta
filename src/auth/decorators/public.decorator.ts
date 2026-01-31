import { SetMetadata } from '@nestjs/common';

/**
 * Constante para identificar rutas públicas
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator para marcar endpoints como públicos (sin autenticación)
 *
 * @example
 * ```typescript
 * @Get('health')
 * @Public()
 * checkHealth() {
 *   return { status: 'ok' };
 * }
 * ```
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
