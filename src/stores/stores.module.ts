import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { StoresService } from './stores.service';
import { StoresController } from './stores.controller';
import { Store } from './entities/store.entity';
import { UsersModule } from 'src/users/users.module';
import { UserMetadata } from 'src/auth/entities/user-metadata.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Store, UserMetadata]), UsersModule],
  controllers: [StoresController],
  providers: [StoresService],
  exports: [StoresService, TypeOrmModule],
})
export class StoresModule {}
