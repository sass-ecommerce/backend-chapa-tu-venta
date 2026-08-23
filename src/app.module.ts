import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';
import { CommonModule } from './common/common.module';
import { ValidationSchema } from './config/joi.validation';
import {
  awsConfig,
  cognitoConfig,
  databaseConfig,
  dynamoConfig,
  redisConfig,
  s3Config,
} from './config/configuration';
import { ProductsModule } from './products/products.module';
import { TenantsModule } from './tenants/tenants.module';
import { CategoriesModule } from './categories/categories.module';
import { AuthModule } from './auth/auth.module';
import { StorageModule } from './storage/storage.module';
import { EventsModule } from './events/events.module';

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
      load: [
        databaseConfig,
        awsConfig,
        cognitoConfig,
        s3Config,
        dynamoConfig,
        redisConfig,
      ],
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: (configService: ConfigService) => ({
        stores: [createKeyv(configService.getOrThrow<string>('redis.url'))],
        ttl: configService.get<number>('redis.ttl'),
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('database.postgres.url'),
        autoLoadEntities: true,
        logger: 'advanced-console',
        synchronize: true,
        logging: ['error'],
        // logging: ['error', 'warn', 'query'],
      }),
    }),
    AuthModule,
    TenantsModule,
    UsersModule,
    CommonModule,
    CategoriesModule,
    ProductsModule,
    StorageModule,
    EventsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
