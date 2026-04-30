import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from './common/common.module';
import { ValidationSchema } from './config/joi.validation';
import {
  awsConfig,
  cognitoConfig,
  databaseConfig,
  dynamoConfig,
  s3Config,
} from './config/configuration';
import { ProductsModule } from './products/products.module';
import { TenantsModule } from './tenants/tenants.module';
import { CategoriesModule } from './categories/categories.module';
import { CognitoAuthModule } from './cognito-auth/cognito-auth.module';
import { AuthModule } from './auth/auth.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env`,
      validationSchema: ValidationSchema,
      validationOptions: {
        abortEarly: true,
        allowUnknown: true,
      },
      load: [databaseConfig, awsConfig, cognitoConfig, s3Config, dynamoConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('database.postgres.url'),
        autoLoadEntities: true,
        logger: 'advanced-console',
        synchronize: false,
        logging: ['error', 'warn', 'query'],
      }),
    }),
    CognitoAuthModule,
    AuthModule,
    TenantsModule,
    UsersModule,
    CommonModule,
    CategoriesModule,
    ProductsModule,
    StorageModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule /*implements NestModule */ {
  // configure(consumer: MiddlewareConsumer) {
  //   consumer.apply(RequestIdMiddleware).forRoutes('*');
  // }
}
