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
  ApiSuccessResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiSuccessResponse<T>> {
    return next.handle().pipe(
      //se ejecuta después de que el controlador maneja la solicitud

      map((data) => {
        // Si la respuesta ya tiene el formato estándar, la retorna tal cual
        if (
          data &&
          typeof data === 'object' &&
          'code' in data &&
          'data' in data
        ) {
          return data;
        }

        // Si no hay datos, retorna array vacío con mensaje
        if (data === null || data === undefined) {
          return new ApiSuccessResponse([], 'No data found');
        }

        // Transforma la respuesta al formato estándar
        // Asegura que data siempre sea un array
        const dataArray = Array.isArray(data) ? data : [data];

        return new ApiSuccessResponse(dataArray, 'Results');
      }),
    );
  }
}
