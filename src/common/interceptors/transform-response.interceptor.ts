import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiSuccessResponse } from '../dto/api-response.dto';

/**
 * Interceptor que transforma todas las respuestas exitosas
 * al formato estándar: { code: 1, message: "Results", data: [...] }
 */
@Injectable()
export class TransformResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiSuccessResponse
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiSuccessResponse> {
    return next.handle().pipe(
      //se ejecuta después de que el controlador maneja la solicitud

      map((data) => {
        const {
          code = 1,
          message = 'Results',
          data: dataValue = null,
        } = data as {
          code?: number;
          message?: string;
          data?: Record<string, any> | Record<string, any>[] | null;
        };

        return new ApiSuccessResponse(code, dataValue, message);
      }),
    );
  }
}
