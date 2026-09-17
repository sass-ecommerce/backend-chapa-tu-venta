import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Collection } from './entities/collection.entity';
import { CollectionProduct } from './entities/collection-product.entity';
import { CollectionsService } from './collections.service';
import { CollectionsController } from './collections.controller';
import { ProductsModule } from '../products/products.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Collection, CollectionProduct]),
    ProductsModule,
    StorageModule,
  ],
  controllers: [CollectionsController],
  providers: [CollectionsService],
  exports: [CollectionsService, TypeOrmModule],
})
export class CollectionsModule {}
