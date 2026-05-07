import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { CognitoUser } from '../interfaces/cognito-user.interface';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CognitoUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
