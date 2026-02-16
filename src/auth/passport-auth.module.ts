import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { authConfig } from '../config/configuration';
import { AuthCredential } from './entities/auth-credential.entity';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { UserMetadata } from './entities/user-metadata.entity';
import { OtpVerification } from './entities/otp-verification.entity';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PassportAuthController } from './passport-auth.controller';
import { PassportAuthService } from './passport-auth.service';
import { OtpVerificationService } from './otp-verification.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

@Global()
@Module({
  imports: [
    ConfigModule.forFeature(authConfig),
    TypeOrmModule.forFeature([
      User,
      AuthCredential,
      RefreshToken,
      UserMetadata,
      OtpVerification,
    ]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        const secret = configService.get<string>('auth.jwt.secret');
        if (!secret) {
          throw new Error('JWT_SECRET is not defined in environment variables');
        }

        const expiresIn = configService.get<string>(
          'auth.jwt.accessTokenExpiration',
          '15m',
        );

        return {
          secret,
          signOptions: {
            expiresIn: expiresIn as any,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [PassportAuthController],
  providers: [
    PassportAuthService,
    OtpVerificationService,
    LocalStrategy,
    JwtStrategy,
    JwtAuthGuard,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [
    PassportAuthService,
    OtpVerificationService,
    JwtAuthGuard,
    TypeOrmModule,
  ],
})
export class PassportAuthModule {}
