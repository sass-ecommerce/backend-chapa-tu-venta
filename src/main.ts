import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AppLoggerService } from './common/logging/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  // Get logger service instance from DI container
  const loggerService = app.get(AppLoggerService);
  loggerService.setContext('Bootstrap');

  // Register global exception filter with logger
  app.useGlobalFilters(new HttpExceptionFilter(loggerService));

  // Register global interceptor for transforming success responses
  app.useGlobalInterceptors(new TransformResponseInterceptor());

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  Logger.log(`🚀 Application is running on: http://localhost:${port}/api`);
}

// Manejar promesas correctamente para evitar floating promises
bootstrap().catch((error) => {
  Logger.error('❌ Error during application startup', error);
  process.exit(1);
});
