import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { cognitoConfig } from '../config/configuration';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CognitoJwtStrategy } from './strategies/cognito-jwt.strategy';
import { CognitoJwtGuard } from './guards/cognito-jwt.guard';
import { CognitoAdminService } from './cognito-admin.service';

@Global()
@Module({
  imports: [PassportModule, ConfigModule.forFeature(cognitoConfig)],
  controllers: [AuthController],
  providers: [
    AuthService,
    CognitoJwtStrategy,
    CognitoJwtGuard,
    CognitoAdminService,
    { provide: APP_GUARD, useClass: CognitoJwtGuard },
  ],
  exports: [CognitoJwtGuard, CognitoAdminService],
})
export class AuthModule {}
