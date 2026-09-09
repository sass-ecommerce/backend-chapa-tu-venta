import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DevOnlyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(_ctx: ExecutionContext): boolean {
    const env = this.configService.get<string>('NODE_ENV');
    if (env !== 'development') {
      throw new ForbiddenException(
        'This endpoint is only available in development',
      );
    }
    return true;
  }
}
