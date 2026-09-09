import { Global, Module } from '@nestjs/common';
import { TransformResponseInterceptor } from './interceptors/transform-response.interceptor';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { AppLoggerService } from './logging/logger.service';
import { CacheService } from './helpers/cache.service';

@Global()
@Module({
  providers: [
    TransformResponseInterceptor,
    HttpExceptionFilter,
    AppLoggerService,
    CacheService,
  ],
  exports: [
    TransformResponseInterceptor,
    HttpExceptionFilter,
    AppLoggerService,
    CacheService,
  ],
})
export class CommonModule {}
