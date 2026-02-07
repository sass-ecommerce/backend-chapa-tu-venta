/**
 * Detalle de error de validación
 */
export class ValidationErrorDetail {
  code: string;
  path: string[];
  message: string;
}

/**
 * Respuesta estándar de éxito
 */
export class ApiSuccessResponse<T> {
  code: number;
  message: string;
  data: T[];

  constructor(data: T[], message: string = 'Results') {
    this.code = 1;
    this.message = message;
    this.data = Array.isArray(data) ? data : [data];
  }
}

/**
 * Respuesta estándar de error
 */
export class ApiErrorResponse {
  code: number;
  message: string;
  details?: ValidationErrorDetail[];
  data: [];

  constructor(
    code: number,
    message: string,
    details?: ValidationErrorDetail[],
  ) {
    this.code = code;
    this.message = message;
    this.details = details;
    this.data = [];
  }
}

/**
 * Códigos de respuesta estándar
 */
export enum ApiResponseCode {
  SUCCESS = 1,
  CREATED = 2,
  UPDATED = 3,
  DELETED = 4,
  NOT_FOUND = 10,
  UNAUTHORIZED = 11,
  VALIDATION_ERROR = 12,
  INTERNAL_ERROR = 13,
  BAD_REQUEST = 14,
  CONFLICT = 15,
}
