import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonModule } from './common/common.module';
import { ValidationSchema } from './config/joi.validation';
import {
  authConfig,
  awsConfig,
  databaseConfig,
  otpConfig,
} from './config/configuration';
import { ProductsModule } from './products/products.module';
import { StoresModule } from './stores/stores.module';
import { PassportAuthModule } from './auth/passport-auth.module';

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
      load: [databaseConfig, authConfig, awsConfig, otpConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.postgres.host'),
        port: configService.get<number>('database.postgres.port'),
        username: configService.get<string>('database.postgres.username'),
        password: configService.get<string>('database.postgres.password'),
        database: configService.get<string>('database.postgres.database'),
        schema: configService.get<string>('database.postgres.schema'),
        autoLoadEntities: true,
        logger: 'advanced-console',
        synchronize: false,
        logging: ['error', 'warn', 'query'],
      }),
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('database.mongodb.uri'),
      }),
    }),
    PassportAuthModule,
    StoresModule,
    UsersModule,
    CommonModule,
    ProductsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule /*implements NestModule */ {
  // configure(consumer: MiddlewareConsumer) {
  //   consumer.apply(RequestIdMiddleware).forRoutes('*');
  // }
}
