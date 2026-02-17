import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TransformResponseInterceptor } from './interceptors/transform-response.interceptor';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { EmailService } from './services/email.service';
import { AppLoggerService } from './logging/logger.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    TransformResponseInterceptor,
    HttpExceptionFilter,
    EmailService,
    AppLoggerService,
  ],
  exports: [
    TransformResponseInterceptor,
    HttpExceptionFilter,
    EmailService,
    AppLoggerService,
  ],
})
export class CommonModule {}
