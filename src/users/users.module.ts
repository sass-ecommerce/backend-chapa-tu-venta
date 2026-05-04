import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { DynamoService } from './dynamo.service';
import { CognitoAdminService } from './cognito-admin.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService, DynamoService, CognitoAdminService],
  exports: [UsersService, DynamoService, TypeOrmModule],
})
export class UsersModule {}
