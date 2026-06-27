import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { AddProductImageDto } from './dto/add-product-image.dto';
import {
  ProductNotFoundException,
  ProductImageNotFoundException,
} from './exceptions/product.exceptions';
import { EventBridgeService } from '../events/eventbridge.service';

const PRODUCT_EVENT_SOURCE = 'ctv.products';

@Injectable()
export class ProductImagesService {
  private readonly logger = new Logger(ProductImagesService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly imageRepository: Repository<ProductImage>,
    private readonly eventBridgeService: EventBridgeService,
  ) {}

  async addImage(dto: AddProductImageDto): Promise<ProductImage> {
    const product = await this.productRepository.findOne({
      where: { id: dto.productId, tenantId: dto.tenantId, deletedAt: IsNull() },
    });
    if (!product) throw new ProductNotFoundException(dto.productId);

    if (dto.isPrimary) {
      await this.imageRepository
        .createQueryBuilder()
        .update(ProductImage)
        .set({ isPrimary: false, updatedAt: new Date() })
        .where(
          'product_id = :productId AND deleted_at IS NULL AND is_primary = true',
          { productId: dto.productId },
        )
        .execute();
    }

    const image = this.imageRepository.create({
      tenantId: dto.tenantId,
      productId: dto.productId,
      s3Key: dto.s3Key,
      isPrimary: dto.isPrimary ?? false,
      sortOrder: dto.sortOrder ?? 0,
    });

    const saved = await this.imageRepository.save(image);
    this.logger.log(`Image added: ${saved.id}`);

    await this.eventBridgeService.publish(
      PRODUCT_EVENT_SOURCE,
      'product.image.added',
      {
        id: saved.id,
        tenantId: saved.tenantId,
        productId: saved.productId,
        s3Key: saved.s3Key,
        isPrimary: saved.isPrimary,
        sortOrder: saved.sortOrder,
      },
    );

    return saved;
  }

  async removeImage(imageId: string, tenantId: string): Promise<void> {
    const image = await this.imageRepository.findOne({
      where: { id: imageId, tenantId, deletedAt: IsNull() },
    });
    if (!image) throw new ProductImageNotFoundException(imageId);

    image.deletedAt = new Date();
    await this.imageRepository.save(image);
    this.logger.log(`Image soft-deleted: ${imageId}`);
  }

  async findImagesByProduct(
    productId: string,
    tenantId: string,
  ): Promise<ProductImage[]> {
    const product = await this.productRepository.findOne({
      where: { id: productId, tenantId, deletedAt: IsNull() },
    });
    if (!product) throw new ProductNotFoundException(productId);

    return this.imageRepository.find({
      where: { productId, deletedAt: IsNull() },
      order: { isPrimary: 'DESC', sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }
}
