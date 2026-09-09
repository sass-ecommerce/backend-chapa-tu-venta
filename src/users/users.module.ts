import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { DynamoService } from './dynamo.service';
import { DevOnlyGuard } from '../common/guards/dev-only.guard';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService, DynamoService, DevOnlyGuard],
  exports: [UsersService, DynamoService, TypeOrmModule],
})
export class UsersModule {}
