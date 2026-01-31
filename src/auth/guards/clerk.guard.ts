import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { ClekService } from '../clerk.service';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(private readonly clerkService: ClekService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid token format');
    }
    const token = authHeader.split(' ')[1];

    try {
      const decodedToken = await this.clerkService.verifyToken(token);
      request['user'] = decodedToken;
      return true;
    } catch (error) {
      console.log('error:' + error);
      throw new UnauthorizedException('Invalid Clerk token');
    }
  }
}
