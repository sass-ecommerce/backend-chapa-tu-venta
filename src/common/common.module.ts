import { Module } from '@nestjs/common';
import { TransformResponseInterceptor } from './interceptors/transform-response.interceptor';
import { HttpExceptionFilter } from './filters/http-exception.filter';

@Module({
  providers: [TransformResponseInterceptor, HttpExceptionFilter],
  exports: [TransformResponseInterceptor, HttpExceptionFilter],
})
export class CommonModule {}
