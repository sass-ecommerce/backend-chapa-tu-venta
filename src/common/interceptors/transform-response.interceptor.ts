import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiSuccessResponse } from '../interfaces/response.interface';

@Injectable()
export class TransformResponseInterceptor implements NestInterceptor<
  any,
  ApiSuccessResponse
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiSuccessResponse> {
    return next.handle().pipe(
      map((data) => {
        const {
          code = 1,
          message = 'Results',
          data: dataValue = null,
        } = data as ApiSuccessResponse;

        return { code, message, data: dataValue };
      }),
    );
  }
}
