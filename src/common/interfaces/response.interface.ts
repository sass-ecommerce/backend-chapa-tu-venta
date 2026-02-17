export interface ApiSuccessResponse<T = any> {
  code: number;
  message: string;
  data: T | T[] | null;
}

export interface ApiErrorResponse<T = any> {
  code: number;
  message: string;
  errors: T[] | null;
}
