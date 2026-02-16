import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { authConfig } from '../config/configuration';
import { AuthCredential } from './entities/auth-credential.entity';
import { PassportUser } from './entities/passport-user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PassportAuthController } from './passport-auth.controller';
import { PassportAuthService } from './passport-auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

@Module({
  imports: [
    ConfigModule.forFeature(authConfig),
    TypeOrmModule.forFeature([PassportUser, AuthCredential, RefreshToken]),
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
  providers: [PassportAuthService, LocalStrategy, JwtStrategy, JwtAuthGuard],
  exports: [PassportAuthService, JwtAuthGuard],
})
export class PassportAuthModule {}
