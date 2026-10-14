import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductVariantImage } from './entities/product-variant-image.entity';
import { Category } from '../categories/entities/category.entity';
import { ProductsService } from './products.service';
import { ProductImagesService } from './product-images.service';
import { ProductVariantImagesService } from './product-variant-images.service';
import { ProductsController } from './products.controller';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductVariant,
      ProductImage,
      ProductVariantImage,
      Category,
    ]),
    StorageModule,
  ],
  controllers: [ProductsController],
  providers: [
    ProductsService,
    ProductImagesService,
    ProductVariantImagesService,
  ],
  exports: [
    ProductsService,
    ProductImagesService,
    ProductVariantImagesService,
    TypeOrmModule,
  ],
})
export class ProductsModule {}
