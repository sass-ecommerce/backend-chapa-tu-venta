import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductVariantImage } from './entities/product-variant-image.entity';
import { RegisterProductImageDto } from './dto/register-product-image.dto';
import {
  ProductVariantImageKeyMismatchException,
  ProductVariantImageNotFoundException,
  ProductVariantNotFoundException,
} from './exceptions/product.exceptions';
import { S3Service } from '../storage/s3.service';
import { StorageFolder } from '../storage/dto/presigned-upload.dto';
import {
  applyImageOrder,
  IMAGE_ORDER,
  isKeyInFolder,
  isUniqueViolation,
  resolveImagePosition,
} from './utils/image-ordering';

// Same rules as product images (one cover, explicit order, idempotent per
// s3Key), scoped to a variant. Not projected to the read model yet.
@Injectable()
export class ProductVariantImagesService {
  private readonly logger = new Logger(ProductVariantImagesService.name);

  constructor(
    @InjectRepository(ProductVariant)
    private readonly variantRepository: Repository<ProductVariant>,
    @InjectRepository(ProductVariantImage)
    private readonly imageRepository: Repository<ProductVariantImage>,
    private readonly s3Service: S3Service,
  ) {}

  async addImage(
    productId: string,
    variantId: string,
    tenantId: string,
    dto: RegisterProductImageDto,
  ): Promise<ProductVariantImage> {
    await this.findActiveVariant(productId, variantId, tenantId);

    const folder = `${tenantId}/${StorageFolder.PRODUCTS}/${productId}/${StorageFolder.VARIANTS}/${variantId}/`;
    if (!isKeyInFolder(dto.s3Key, folder)) {
      throw new ProductVariantImageKeyMismatchException(dto.s3Key);
    }

    const existing = await this.findActiveImageByKey(dto.s3Key);
    if (existing) return existing;

    try {
      const saved = await this.imageRepository.manager.transaction(
        async (manager) => {
          const images = await manager.find(ProductVariantImage, {
            where: { variantId, deletedAt: IsNull() },
          });
          const { isPrimary, sortOrder } = resolveImagePosition(images, dto);

          if (isPrimary) {
            await manager
              .createQueryBuilder()
              .update(ProductVariantImage)
              .set({ isPrimary: false, updatedAt: new Date() })
              .where(
                'variant_id = :variantId AND deleted_at IS NULL AND is_primary = true',
                { variantId },
              )
              .execute();
          }

          return manager.save(
            manager.create(ProductVariantImage, {
              tenantId,
              productId,
              variantId,
              s3Key: dto.s3Key,
              url: this.s3Service.buildViewUrl(dto.s3Key),
              isPrimary,
              sortOrder,
            }),
          );
        },
      );
      this.logger.log(`Variant image added: ${saved.id}`);
      return saved;
    } catch (error) {
      // Lost the race against a concurrent registration of the same key.
      if (isUniqueViolation(error)) {
        const duplicate = await this.findActiveImageByKey(dto.s3Key);
        if (duplicate) return duplicate;
      }
      throw error;
    }
  }

  async removeImage(imageId: string, tenantId: string): Promise<void> {
    const image = await this.imageRepository.findOne({
      where: { id: imageId, tenantId, deletedAt: IsNull() },
    });
    if (!image) throw new ProductVariantImageNotFoundException(imageId);

    await this.imageRepository.manager.transaction(async (manager) => {
      const now = new Date();
      image.deletedAt = now;
      image.updatedAt = now;
      await manager.save(image);

      // Removing the cover promotes the next image so the variant keeps one.
      if (image.isPrimary) {
        const next = await manager.findOne(ProductVariantImage, {
          where: { variantId: image.variantId, deletedAt: IsNull() },
          order: { sortOrder: 'ASC', createdAt: 'ASC' },
        });
        if (next) {
          next.isPrimary = true;
          next.updatedAt = now;
          await manager.save(next);
        }
      }
    });

    this.logger.log(`Variant image soft-deleted: ${imageId}`);
  }

  async reorderImages(
    productId: string,
    variantId: string,
    imageIds: string[],
    tenantId: string,
  ): Promise<ProductVariantImage[]> {
    await this.findActiveVariant(productId, variantId, tenantId);

    const images = await this.imageRepository.find({
      where: { variantId, deletedAt: IsNull() },
      order: IMAGE_ORDER,
    });
    const ordered = applyImageOrder(
      images,
      imageIds,
      (id) => new ProductVariantImageNotFoundException(id),
    );
    await this.imageRepository.save(ordered);

    this.logger.log(`Images reordered for variant: ${variantId}`);
    return ordered;
  }

  async findImagesByVariant(
    productId: string,
    variantId: string,
    tenantId: string,
  ): Promise<ProductVariantImage[]> {
    await this.findActiveVariant(productId, variantId, tenantId);

    return this.imageRepository.find({
      where: { variantId, deletedAt: IsNull() },
      order: IMAGE_ORDER,
    });
  }

  // product_variants has no tenant_id: the tenant is checked through the
  // product, which must also be active.
  private async findActiveVariant(
    productId: string,
    variantId: string,
    tenantId: string,
  ): Promise<ProductVariant> {
    const variant = await this.variantRepository.findOne({
      where: {
        id: variantId,
        productId,
        deletedAt: IsNull(),
        product: { tenantId, deletedAt: IsNull() },
      },
      relations: { product: true },
    });
    if (!variant) throw new ProductVariantNotFoundException(variantId);
    return variant;
  }

  private findActiveImageByKey(
    s3Key: string,
  ): Promise<ProductVariantImage | null> {
    return this.imageRepository.findOne({
      where: { s3Key, deletedAt: IsNull() },
    });
  }
}
