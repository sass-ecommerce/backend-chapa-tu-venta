import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { Category } from '../categories/entities/category.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductVariantsDto } from './dto/create-product-variants.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import { QueryProductDto } from './dto/query-product.dto';
import {
  ProductNotFoundException,
  ProductVariantNotFoundException,
  ProductSkuAlreadyExistsException,
  ProductCategoryMismatchException,
} from './exceptions/product.exceptions';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly variantRepository: Repository<ProductVariant>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
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

  async create(dto: CreateProductDto): Promise<{ id: string }> {
    await this.validateCategory(dto.categoryId, dto.tenantId);

    const product = this.productRepository.create({
      tenantId: dto.tenantId,
      categoryId: dto.categoryId,
      name: dto.name,
      description: dto.description ?? null,
      basePrice: dto.basePrice,
      isActive: dto.isActive ?? true,
    });
    const saved = await this.productRepository.save(product);
    this.logger.log(`Product created: ${saved.id}`);

    return { id: saved.id };
  }

  async findAll(
    query: QueryProductDto,
  ): Promise<{ data: object[]; meta: object }> {
    const {
      tenantId,
      categoryId,
      name,
      isActive,
      page = 1,
      limit = 10,
    } = query;

    const conditions: string[] = ['p.deleted_at IS NULL'];
    const params: unknown[] = [];

    if (tenantId) {
      params.push(tenantId);
      conditions.push(`p.tenant_id = $${params.length}`);
    }
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

  async update(id: string, dto: UpdateProductDto): Promise<{ id: string }> {
    const product = await this.productRepository.findOne({
      where: { id, deletedAt: IsNull() },
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
  ): Promise<ProductVariant[]> {
    const product = await this.productRepository.findOne({
      where: { id: productId, deletedAt: IsNull() },
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

  async findVariantsByProduct(productId: string): Promise<ProductVariant[]> {
    const product = await this.productRepository.findOne({
      where: { id: productId, deletedAt: IsNull() },
    });
    if (!product) throw new ProductNotFoundException(productId);

    return this.variantRepository.find({
      where: { productId, deletedAt: IsNull() },
      order: { createdAt: 'ASC' },
    });
  }

  async softDelete(id: string): Promise<void> {
    const product = await this.productRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!product) throw new ProductNotFoundException(id);

    product.deletedAt = new Date();
    await this.productRepository.save(product);
    this.logger.log(`Product soft-deleted: ${id}`);
  }

  async updateVariant(
    variantId: string,
    dto: UpdateProductVariantDto,
  ): Promise<{ id: string }> {
    const variant = await this.variantRepository.findOne({
      where: { id: variantId, deletedAt: IsNull() },
      relations: ['product'],
    });
    if (!variant) throw new ProductVariantNotFoundException(variantId);

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
