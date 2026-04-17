import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { cognitoConfig } from '../config/configuration';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [ConfigModule.forFeature(cognitoConfig)],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
