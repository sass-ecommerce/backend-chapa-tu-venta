import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  // Registrar el interceptor global para transformar respuestas
  app.useGlobalInterceptors(new TransformResponseInterceptor());

  // Registrar el filter global para manejar excepciones
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  Logger.log(`🚀 Application is running on: http://localhost:${port}/api`);
}

// Manejar promesas correctamente para evitar floating promises
bootstrap().catch((error) => {
  Logger.error('❌ Error during application startup', error);
  process.exit(1);
});
