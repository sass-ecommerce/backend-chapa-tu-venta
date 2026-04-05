import { Global, Module } from '@nestjs/common';
import { TransformResponseInterceptor } from './interceptors/transform-response.interceptor';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { AppLoggerService } from './logging/logger.service';

@Global()
@Module({
  providers: [
    TransformResponseInterceptor,
    HttpExceptionFilter,
    AppLoggerService,
  ],
  exports: [
    TransformResponseInterceptor,
    HttpExceptionFilter,
    AppLoggerService,
  ],
})
export class CommonModule {}
