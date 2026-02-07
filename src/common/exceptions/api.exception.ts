import { HttpException, HttpStatus } from '@nestjs/common';
import {
  ApiErrorResponse,
  ApiResponseCode,
  ValidationErrorDetail,
} from '../dto/api-response.dto';

/**
 * Excepción personalizada que permite lanzar errores
 * con el formato estándar y detalles personalizados
 */
export class ApiException extends HttpException {
  constructor(
    code: ApiResponseCode,
    message: string,
    details?: ValidationErrorDetail[],
    httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    const errorResponse = new ApiErrorResponse(code, message, details);
    super(errorResponse, httpStatus);
  }

  /**
   * Crea una excepción de validación personalizada
   */
  static validation(
    message: string,
    details: ValidationErrorDetail[],
  ): ApiException {
    return new ApiException(
      ApiResponseCode.VALIDATION_ERROR,
      message,
      details,
      HttpStatus.BAD_REQUEST,
    );
  }

  /**
   * Crea una excepción de recurso no encontrado
   */
  static notFound(message: string = 'Resource not found'): ApiException {
    return new ApiException(
      ApiResponseCode.NOT_FOUND,
      message,
      undefined,
      HttpStatus.NOT_FOUND,
    );
  }

  /**
   * Crea una excepción de no autorizado
   */
  static unauthorized(message: string = 'Unauthorized'): ApiException {
    return new ApiException(
      ApiResponseCode.UNAUTHORIZED,
      message,
      undefined,
      HttpStatus.UNAUTHORIZED,
    );
  }

  /**
   * Crea una excepción de error interno
   */
  static internal(message: string = 'Internal server error'): ApiException {
    return new ApiException(
      ApiResponseCode.INTERNAL_ERROR,
      message,
      undefined,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
