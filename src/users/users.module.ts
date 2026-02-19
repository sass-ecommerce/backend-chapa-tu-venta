import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserMetadata } from '../auth/entities/user-metadata.entity';
import { UserLog, UserLogSchema } from './schema/user-log.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserMetadata]),
    MongooseModule.forFeature([{ name: UserLog.name, schema: UserLogSchema }]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
