import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { verifyToken } from '@clerk/backend';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import {
  AuthenticatedUser,
  ClerkJwtPayload,
} from '../interfaces/clerk-user.interface';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(ClerkAuthGuard.name);

  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
  ) {
    this.logger.log('🔐 ClerkAuthGuard initialized - JWT token validation');
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
      // 4. Verificar y decodificar el token JWT usando verifyToken de Clerk
      const payload = await verifyToken(token, {
        secretKey: this.configService.get<string>('CLERK_SECRET_KEY'),
      });

      if (!payload) {
        this.logger.warn('Token verification failed - invalid token');
        throw new UnauthorizedException('Invalid or expired token');
      }

      // 5. Extraer claims del payload
      const sessionClaims = payload as unknown as ClerkJwtPayload;

      if (!sessionClaims.sub) {
        throw new UnauthorizedException('Invalid token payload');
      }

      // 6. Construir el objeto usuario autenticado
      const authenticatedUser: AuthenticatedUser = {
        userId: sessionClaims.sub,
        sessionId: sessionClaims.sid,
        email: sessionClaims.email,
        firstName: sessionClaims.first_name,
        lastName: sessionClaims.last_name,
        imageUrl: sessionClaims.image_url,
        metadata: sessionClaims.metadata || sessionClaims.publicMetadata || {},
        orgId: sessionClaims.org_id,
        orgSlug: sessionClaims.org_slug,
        orgRole: sessionClaims.org_role,
      };

      // 7. Adjuntar usuario al request para uso posterior
      request['user'] = authenticatedUser;

      this.logger.log(`User authenticated: ${authenticatedUser.userId}`);
      return true;
    } catch (error) {
      this.logger.error('Authentication error:', error);

      // Errores específicos de Clerk
      if (error?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired');
      }

      if (error?.name === 'TokenVerificationError') {
        throw new UnauthorizedException('Invalid token signature');
      }

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
