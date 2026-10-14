import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, IsNull, Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductImageRefDto } from './dto/product-image-ref.dto';
import {
  ProductNotFoundException,
  ProductImageKeyMismatchException,
  ProductImageListInvalidException,
  ProductImageNotFoundException,
} from './exceptions/product.exceptions';
import { S3Service } from '../storage/s3.service';
import { StorageFolder } from '../storage/dto/presigned-upload.dto';
import { IMAGE_ORDER, isKeyInFolder } from './utils/image-ordering';

@Injectable()
export class ProductImagesService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly imageRepository: Repository<ProductImage>,
    private readonly s3Service: S3Service,
  ) {}

  /**
   * Makes the product's active images exactly `refs`, in that order (the first
   * one becomes the cover): new keys are registered and images left out are
   * soft-deleted. Runs inside the caller's transaction.
   *
   * A key that is already registered counts as that image, so retrying a
   * request whose response was lost doesn't duplicate anything.
   */
  async replaceImages(
    manager: EntityManager,
    product: Pick<Product, 'id' | 'tenantId'>,
    refs: ProductImageRefDto[],
  ): Promise<void> {
    const current = await manager.find(ProductImage, {
      where: { productId: product.id, deletedAt: IsNull() },
    });
    const byId = new Map(current.map((img) => [img.id, img]));
    const byKey = new Map(current.map((img) => [img.s3Key, img]));
    // Only files directly in the product's folder: variant photos live in
    // subfolders and belong to product_variant_images.
    const folder = `${product.tenantId}/${StorageFolder.PRODUCTS}/${product.id}/`;

    const final: ProductImage[] = [];
    for (const ref of refs) {
      if (ref.id !== undefined && ref.s3Key !== undefined) {
        throw new ProductImageListInvalidException(
          'each image needs either an id or an s3Key, not both',
        );
      }

      let image: ProductImage | undefined;
      if (ref.id !== undefined) {
        image = byId.get(ref.id);
        if (!image) throw new ProductImageNotFoundException(ref.id);
      } else {
        const s3Key = ref.s3Key!;
        if (!isKeyInFolder(s3Key, folder)) {
          throw new ProductImageKeyMismatchException(s3Key);
        }
        image =
          byKey.get(s3Key) ??
          manager.create(ProductImage, {
            tenantId: product.tenantId,
            productId: product.id,
            s3Key,
            url: this.s3Service.buildViewUrl(s3Key),
          });
      }

      if (final.includes(image)) {
        throw new ProductImageListInvalidException(
          `image '${ref.id ?? ref.s3Key}' is listed twice`,
        );
      }
      final.push(image);
    }

    const now = new Date();
    const removed = current.filter((img) => !final.includes(img));
    removed.forEach((img) => {
      img.deletedAt = now;
      img.updatedAt = now;
    });
    final.forEach((img, index) => {
      img.sortOrder = index;
      img.isPrimary = index === 0;
      img.updatedAt = now;
    });

    await manager.save([...removed, ...final]);
  }

  findActiveImages(productId: string): Promise<ProductImage[]> {
    return this.imageRepository.find({
      where: { productId, deletedAt: IsNull() },
      order: IMAGE_ORDER,
    });
  }

  async findImagesByProduct(
    productId: string,
    tenantId: string,
  ): Promise<ProductImage[]> {
    const product = await this.productRepository.findOne({
      where: { id: productId, tenantId, deletedAt: IsNull() },
    });
    if (!product) throw new ProductNotFoundException(productId);

    return this.findActiveImages(productId);
  }
}
