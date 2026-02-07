import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiErrorResponse,
  ApiResponseCode,
  ValidationErrorDetail,
} from '../dto/api-response.dto';

/**
 * Filter global para manejar todas las excepciones
 * y retornarlas en el formato estándar
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const { status, errorResponse } = this.buildErrorResponse(exception);

    response.status(status).json(errorResponse);
  }

  /**
   * Construye la respuesta de error basada en el tipo de excepción
   */
  private buildErrorResponse(exception: unknown): {
    status: number;
    errorResponse: ApiErrorResponse;
  } {
    if (exception instanceof HttpException) {
      return this.handleHttpException(exception);
    }

    // Errores no HTTP (errores inesperados)
    console.error('Unexpected error:', exception);
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      errorResponse: new ApiErrorResponse(
        ApiResponseCode.INTERNAL_ERROR,
        'Internal server error',
      ),
    };
  }

  /**
   * Maneja excepciones HTTP
   */
  private handleHttpException(exception: HttpException): {
    status: number;
    errorResponse: ApiErrorResponse;
  } {
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // ✅ OPTIMIZACIÓN: Si ya es ApiErrorResponse, úsalo directamente
    if (exceptionResponse instanceof ApiErrorResponse) {
      return {
        status,
        errorResponse: exceptionResponse,
      };
    }

    // Maneja errores de validación (class-validator)
    if (
      exception instanceof BadRequestException &&
      typeof exceptionResponse === 'object' &&
      'message' in exceptionResponse
    ) {
      const validationErrors = this.parseValidationErrors(
        exceptionResponse as any,
      );

      return {
        status,
        errorResponse: new ApiErrorResponse(
          ApiResponseCode.VALIDATION_ERROR,
          'Validation error',
          validationErrors,
        ),
      };
    }

    // Otros errores HTTP
    const code = this.getErrorCode(status);
    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message || 'Error';

    return {
      status,
      errorResponse: new ApiErrorResponse(
        code,
        typeof message === 'string' ? message : String(message),
      ),
    };
  }

  /**
   * Convierte los mensajes de class-validator al formato de detalles
   */
  private parseValidationErrors(
    exceptionResponse: any,
  ): ValidationErrorDetail[] {
    const messages = Array.isArray(exceptionResponse.message)
      ? exceptionResponse.message
      : [exceptionResponse.message];

    return messages.map((msg: string) => {
      // Intenta extraer el campo del mensaje
      // Ej: "email must be an email" -> path: ["email"]
      const fieldMatch = msg.match(/^(\w+)\s/);
      const field = fieldMatch ? fieldMatch[1] : 'unknown';

      return {
        code: 'validation_error',
        path: [field],
        message: msg,
      };
    });
  }

  /**
   * Mapea HTTP status codes a códigos de respuesta personalizados
   */
  private getErrorCode(status: number): ApiResponseCode {
    switch (status) {
      case 404:
        return ApiResponseCode.NOT_FOUND;
      case 409:
        return ApiResponseCode.CONFLICT;
      case 401:
      case 403:
        return ApiResponseCode.UNAUTHORIZED;
      case 400:
        return ApiResponseCode.BAD_REQUEST;
      default:
        return ApiResponseCode.INTERNAL_ERROR;
    }
  }
}
