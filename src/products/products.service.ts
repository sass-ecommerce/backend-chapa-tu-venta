import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductImage } from './entities/product-image.entity';
import { Category } from '../categories/entities/category.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductVariantsDto } from './dto/create-product-variants.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { AddProductImageDto } from './dto/add-product-image.dto';
import {
  ProductNotFoundException,
  ProductVariantNotFoundException,
  ProductSkuAlreadyExistsException,
  ProductCategoryMismatchException,
  ProductImageNotFoundException,
} from './exceptions/product.exceptions';
import { EventBridgeService } from '../events/eventbridge.service';

const PRODUCT_EVENT_SOURCE = 'ctv.products';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly variantRepository: Repository<ProductVariant>,
    @InjectRepository(ProductImage)
    private readonly imageRepository: Repository<ProductImage>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly eventBridgeService: EventBridgeService,
  ) {}

  /**
   * Verifica si un SKU ya existe dentro del tenant, buscando a través de la
   * relación product_variants → products (ya que product_variants no tiene tenant_id).
   * Excluye variantes con soft delete.
   */
  private async skuExistsInTenant(
    tenantId: string,
    sku: string,
    excludeVariantId?: string,
  ): Promise<boolean> {
    const qb = this.variantRepository
      .createQueryBuilder('pv')
      .innerJoin('pv.product', 'p')
      .where('p.tenant_id = :tenantId', { tenantId })
      .andWhere('pv.sku = :sku', { sku })
      .andWhere('pv.deleted_at IS NULL')
      .andWhere('p.deleted_at IS NULL');

    if (excludeVariantId) {
      qb.andWhere('pv.id != :excludeVariantId', { excludeVariantId });
    }

    const count = await qb.getCount();
    return count > 0;
  }

  private async validateCategory(
    categoryId: string,
    tenantId: string,
  ): Promise<void> {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId, tenantId, deletedAt: IsNull() },
    });
    if (!category) throw new ProductCategoryMismatchException(categoryId);
  }

  async create(
    dto: CreateProductDto,
    tenantId: string,
  ): Promise<{ id: string }> {
    await this.validateCategory(dto.categoryId, tenantId);

    const product = this.productRepository.create({
      tenantId,
      categoryId: dto.categoryId,
      name: dto.name,
      description: dto.description ?? null,
      basePrice: dto.basePrice,
      isActive: dto.isActive ?? true,
    });
    const saved = await this.productRepository.save(product);
    this.logger.log(`Product created: ${saved.id}`);

    await this.eventBridgeService.publish(
      PRODUCT_EVENT_SOURCE,
      'product.created',
      {
        id: saved.id,
        tenantId: saved.tenantId,
        categoryId: saved.categoryId,
        name: saved.name,
        basePrice: saved.basePrice,
        isActive: saved.isActive,
      },
    );

    return { id: saved.id };
  }

  async findAll(
    query: QueryProductDto,
    tenantId: string,
  ): Promise<{ data: object[]; meta: object }> {
    const { categoryId, name, isActive, page = 1, limit = 10 } = query;

    const conditions: string[] = ['p.deleted_at IS NULL'];
    const params: unknown[] = [];

    params.push(tenantId);
    conditions.push(`p.tenant_id = $${params.length}`);

    if (categoryId) {
      params.push(categoryId);
      conditions.push(`p.category_id = $${params.length}`);
    }
    if (name) {
      params.push(`%${name}%`);
      conditions.push(`p.name ILIKE $${params.length}`);
    }
    if (isActive !== undefined) {
      params.push(isActive);
      conditions.push(`p.is_active = $${params.length}`);
    }

    const where = conditions.join(' AND ');

    const [{ count }, rows] = await Promise.all([
      this.productRepository
        .query(
          `SELECT COUNT(*) AS count FROM products p WHERE ${where}`,
          params,
        )
        .then((r) => r[0]),
      this.productRepository.query(
        `
        SELECT
          p.id,
          p.tenant_id    AS "tenantId",
          p.category_id  AS "categoryId",
          p.name,
          p.description,
          p.base_price   AS "basePrice",
          p.is_active    AS "isActive",
          c.id           AS "cat_id",
          c.parent_id    AS "cat_parentId",
          c.name         AS "cat_name",
          c.slug         AS "cat_slug"
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id AND c.deleted_at IS NULL
        WHERE ${where}
        ORDER BY p.created_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `,
        [...params, limit, (page - 1) * limit],
      ),
    ]);

    const data = rows.map((r) => ({
      id: r.id,
      tenantId: r.tenantId,
      categoryId: r.categoryId,
      name: r.name,
      description: r.description,
      basePrice: r.basePrice,
      isActive: r.isActive,
      category: r.cat_id
        ? {
            id: r.cat_id,
            parentId: r.cat_parentId,
            name: r.cat_name,
            slug: r.cat_slug,
          }
        : null,
    }));

    const total = parseInt(count as string, 10);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, tenantId: string): Promise<object> {
    const rows = await this.productRepository.query(
      `
      SELECT
        p.id,
        p.tenant_id    AS "tenantId",
        p.category_id  AS "categoryId",
        p.name,
        p.description,
        p.base_price   AS "basePrice",
        p.is_active    AS "isActive",
        c.id           AS "cat_id",
        c.parent_id    AS "cat_parentId",
        c.name         AS "cat_name",
        c.slug         AS "cat_slug"
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id AND c.deleted_at IS NULL
      WHERE p.id = $1 AND p.tenant_id = $2 AND p.deleted_at IS NULL
      `,
      [id, tenantId],
    );

    if (!rows.length) throw new ProductNotFoundException(id);

    const r = rows[0];
    return {
      id: r.id,
      tenantId: r.tenantId,
      categoryId: r.categoryId,
      name: r.name,
      description: r.description,
      basePrice: r.basePrice,
      isActive: r.isActive,
      category: r.cat_id
        ? {
            id: r.cat_id,
            parentId: r.cat_parentId,
            name: r.cat_name,
            slug: r.cat_slug,
          }
        : null,
    };
  }

  async update(
    id: string,
    dto: UpdateProductDto,
    tenantId: string,
  ): Promise<{ id: string }> {
    const product = await this.productRepository.findOne({
      where: { id, tenantId, deletedAt: IsNull() },
    });
    if (!product) throw new ProductNotFoundException(id);

    if (dto.categoryId && dto.categoryId !== product.categoryId) {
      await this.validateCategory(dto.categoryId, product.tenantId);
    }

    Object.assign(product, dto);
    product.updatedAt = new Date();
    await this.productRepository.save(product);

    this.logger.log(`Product updated: ${id}`);
    return { id };
  }

  async createVariants(
    productId: string,
    dto: CreateProductVariantsDto,
    tenantId: string,
  ): Promise<ProductVariant[]> {
    const product = await this.productRepository.findOne({
      where: { id: productId, tenantId, deletedAt: IsNull() },
    });
    if (!product) throw new ProductNotFoundException(productId);

    for (const v of dto.variants) {
      const exists = await this.skuExistsInTenant(product.tenantId, v.sku);
      if (exists) throw new ProductSkuAlreadyExistsException(v.sku);
    }

    const variants = dto.variants.map((v) =>
      this.variantRepository.create({
        productId,
        sku: v.sku,
        price: v.price,
        stock: v.stock ?? 0,
        attributes: v.attributes,
      }),
    );

    const saved = await this.variantRepository.save(variants);
    this.logger.log(
      `${saved.length} variant(s) added to product: ${productId}`,
    );
    return saved;
  }

  async findVariantsByProduct(
    productId: string,
    tenantId: string,
  ): Promise<ProductVariant[]> {
    const product = await this.productRepository.findOne({
      where: { id: productId, tenantId, deletedAt: IsNull() },
    });
    if (!product) throw new ProductNotFoundException(productId);

    return this.variantRepository.find({
      where: { productId, deletedAt: IsNull() },
      order: { createdAt: 'ASC' },
    });
  }

  async softDelete(id: string, tenantId: string): Promise<void> {
    const product = await this.productRepository.findOne({
      where: { id, tenantId, deletedAt: IsNull() },
    });
    if (!product) throw new ProductNotFoundException(id);

    product.deletedAt = new Date();
    await this.productRepository.save(product);
    this.logger.log(`Product soft-deleted: ${id}`);
  }

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

  async updateVariant(
    variantId: string,
    dto: UpdateProductVariantDto,
    tenantId: string,
  ): Promise<{ id: string }> {
    const variant = await this.variantRepository.findOne({
      where: { id: variantId, deletedAt: IsNull() },
      relations: ['product'],
    });

    if (!variant || variant.product.tenantId !== tenantId)
      throw new ProductVariantNotFoundException(variantId);

    if (dto.sku && dto.sku !== variant.sku) {
      const exists = await this.skuExistsInTenant(
        variant.product.tenantId,
        dto.sku,
        variantId,
      );
      if (exists) throw new ProductSkuAlreadyExistsException(dto.sku);
    }

    Object.assign(variant, dto);
    variant.updatedAt = new Date();
    await this.variantRepository.save(variant);

    this.logger.log(`Variant updated: ${variantId}`);
    return { id: variantId };
  }
}
