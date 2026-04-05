import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { cognitoConfig } from '../config/configuration';
import { CognitoJwtStrategy } from './strategies/cognito-jwt.strategy';
import { CognitoJwtGuard } from './guards/cognito-jwt.guard';

@Global()
@Module({
  imports: [PassportModule, ConfigModule.forFeature(cognitoConfig)],
  providers: [
    CognitoJwtStrategy,
    CognitoJwtGuard,
    { provide: APP_GUARD, useClass: CognitoJwtGuard },
  ],
  exports: [CognitoJwtGuard],
})
export class CognitoAuthModule {}
