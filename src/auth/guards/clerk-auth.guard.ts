import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { createClerkClient } from '@clerk/backend';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import {
  AuthenticatedUser,
  ClerkJwtPayload,
} from '../interfaces/clerk-user.interface';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(ClerkAuthGuard.name);
  private readonly clerkClient;
  private readonly allowedOrigins: string[];

  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
  ) {
    // Inicializar Clerk Client
    this.clerkClient = createClerkClient({
      secretKey: this.configService.get<string>('CLERK_SECRET_KEY'),
      publishableKey: this.configService.get<string>('CLERK_PUBLISHABLE_KEY'),
    });

    // Obtener orígenes permitidos para validación
    const origins = this.configService.get<string>('ALLOWED_ORIGINS', '');
    this.allowedOrigins = origins.split(',').map((origin) => origin.trim());
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Verificar si el endpoint es público
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // 2. Extraer el request
    const request = context.switchToHttp().getRequest<Request>();

    // 3. Extraer el token del header Authorization
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      this.logger.warn('No token provided in Authorization header');
      throw new UnauthorizedException('Authentication token is required');
    }

    try {
      // 4. Autenticar el request con Clerk
      const requestState = await this.clerkClient.authenticateRequest(request, {
        authorizedParties: this.allowedOrigins,
      });

      // 5. Verificar si está autenticado
      if (!requestState.isAuthenticated) {
        this.logger.warn(`Authentication failed: ${requestState.reason}`);
        throw new UnauthorizedException(
          requestState.message || 'Invalid or expired token',
        );
      }

      // 6. Obtener los claims del token
      const auth = requestState.toAuth();
      const sessionClaims = auth.sessionClaims as ClerkJwtPayload;

      if (!sessionClaims) {
        throw new UnauthorizedException('Unable to extract session claims');
      }

      // 7. Construir el objeto usuario autenticado
      const authenticatedUser: AuthenticatedUser = {
        userId: auth.userId!,
        sessionId: auth.sessionId!,
        email: sessionClaims.email,
        firstName: sessionClaims.first_name,
        lastName: sessionClaims.last_name,
        imageUrl: sessionClaims.image_url,
        metadata: sessionClaims.metadata || sessionClaims.publicMetadata,
        orgId: auth.orgId || sessionClaims.org_id,
        orgSlug: auth.orgSlug || sessionClaims.org_slug,
        orgRole: auth.orgRole || sessionClaims.org_role,
      };

      // 8. Adjuntar usuario al request para uso posterior
      request['user'] = authenticatedUser;

      this.logger.log(`User authenticated: ${authenticatedUser.userId}`);
      return true;
    } catch (error) {
      this.logger.error('Authentication error:', error);

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Authentication failed');
    }
  }

  /**
   * Extrae el token JWT del header Authorization
   * Formato esperado: "Bearer <token>"
   */
  private extractTokenFromHeader(request: Request): string | null {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return null;
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      return null;
    }

    return token;
  }
}
