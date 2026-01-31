import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { JwtPayload } from '@clerk/types';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request['user'] as JwtPayload;

    if (!user) {
      throw new Error('User not found in request');
    }

    return user;
  },
);
