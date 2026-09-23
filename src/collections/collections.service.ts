import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { Collection } from './entities/collection.entity';
import { CollectionProduct } from './entities/collection-product.entity';
import { Product } from '../products/entities/product.entity';
import { ProductImage } from '../products/entities/product-image.entity';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { QueryCollectionProductsDto } from './dto/query-collection-products.dto';
import { AddProductsToCollectionDto } from './dto/add-products-to-collection.dto';
import { RemoveProductsFromCollectionDto } from './dto/remove-products-from-collection.dto';
import {
  CollectionInvalidProductsException,
  CollectionNotFoundException,
  CollectionsNotFoundException,
} from './exceptions/collection.exceptions';
import { EventBridgeService } from '../events/eventbridge.service';
import { CacheService } from '../common/helpers/cache.service';
import { S3Service } from '../storage/s3.service';

const COLLECTION_EVENT_SOURCE = 'ctv.collections';
export const COLLECTIONS_CACHE_RESOURCE = 'collections';
const COLLECTIONS_LIST_CACHE_TTL_MS = 60_000;
const COLLECTION_DETAIL_CACHE_TTL_MS = 60_000;
const PREVIEW_IMAGES_PER_COLLECTION = 4;

@Injectable()
export class CollectionsService {
  private readonly logger = new Logger(CollectionsService.name);

  constructor(
    @InjectRepository(Collection)
    private readonly collectionRepository: Repository<Collection>,
    @InjectRepository(CollectionProduct)
    private readonly collectionProductRepository: Repository<CollectionProduct>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly imageRepository: Repository<ProductImage>,
    private readonly eventBridgeService: EventBridgeService,
    private readonly cacheService: CacheService,
    private readonly s3Service: S3Service,
  ) {}

  private async ensureCollectionExists(
    id: string,
    tenantId: string,
  ): Promise<Collection> {
    const collection = await this.collectionRepository.findOne({
      where: { id, tenantId, deletedAt: IsNull() },
    });
    if (!collection) throw new CollectionNotFoundException(id);
    return collection;
  }

  private async invalidateCollectionCache(
    id: string,
    tenantId: string,
  ): Promise<void> {
    await Promise.all([
      this.cacheService.deleteListByScope(COLLECTIONS_CACHE_RESOURCE, tenantId),
      this.cacheService.delete(
        `${COLLECTIONS_CACHE_RESOURCE}:detail:${tenantId}:${id}`,
      ),
    ]);
  }

  /**
   * Resuelve hasta 4 imágenes "representativas" por colección en un solo
   * viaje a la base de datos (CTE + ROW_NUMBER particionado por colección),
   * evitando N+1 al listar/ver colecciones sin portada manual.
   */
  private async resolvePreviewImages(
    collectionIds: string[],
  ): Promise<Map<string, string[]>> {
    const result = new Map<string, string[]>();
    if (!collectionIds.length) return result;

    const rows = await this.collectionProductRepository.query<
      { collectionId: string; url: string | null }[]
    >(
      `
      WITH ranked AS (
        SELECT cp.collection_id, pi.url,
               ROW_NUMBER() OVER (
                 PARTITION BY cp.collection_id
                 ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.created_at ASC, p.created_at ASC
               ) AS rn
        FROM collection_products cp
        INNER JOIN products p ON p.id = cp.product_id AND p.deleted_at IS NULL
        INNER JOIN product_images pi ON pi.product_id = p.id AND pi.deleted_at IS NULL
        WHERE cp.collection_id = ANY($1::uuid[])
      )
      SELECT collection_id AS "collectionId", url
      FROM ranked
      WHERE rn <= $2
      ORDER BY collection_id
      `,
      [collectionIds, PREVIEW_IMAGES_PER_COLLECTION],
    );

    for (const row of rows) {
      if (!row.url) continue;
      const collectionId = row.collectionId as string;
      const list = result.get(collectionId) ?? [];
      list.push(row.url);
      result.set(collectionId, list);
    }
    return result;
  }

  async findAll(tenantId: string): Promise<object[]> {
    const cacheParams = {};
    const cached = await this.cacheService.getList<object[]>(
      COLLECTIONS_CACHE_RESOURCE,
      tenantId,
      cacheParams,
    );
    if (cached) return cached;

    const rows = await this.collectionRepository.query(
      `
      SELECT
        c.id,
        c.tenant_id        AS "tenantId",
        c.name,
        c.cover_image_key  AS "coverImageKey",
        c.cover_image_url  AS "coverImageUrl",
        c.created_at       AS "createdAt",
        c.updated_at       AS "updatedAt",
        COUNT(cp.id)::int  AS "productsCount"
      FROM collections c
      LEFT JOIN collection_products cp ON cp.collection_id = c.id
      WHERE c.tenant_id = $1 AND c.deleted_at IS NULL
      GROUP BY c.id
      ORDER BY c.created_at DESC
      `,
      [tenantId],
    );

    const previewImagesByCollection = await this.resolvePreviewImages(
      rows.map((r) => r.id as string),
    );

    const data = rows.map((r) => ({
      id: r.id,
      tenantId: r.tenantId,
      name: r.name,
      coverImageKey: r.coverImageKey,
      coverImageUrl: r.coverImageUrl,
      previewImageUrls: previewImagesByCollection.get(r.id as string) ?? [],
      productsCount: r.productsCount,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    await this.cacheService.setList(
      COLLECTIONS_CACHE_RESOURCE,
      tenantId,
      cacheParams,
      data,
      COLLECTIONS_LIST_CACHE_TTL_MS,
    );
    return data;
  }

  async findOne(id: string, tenantId: string): Promise<object> {
    const cacheKey = `${COLLECTIONS_CACHE_RESOURCE}:detail:${tenantId}:${id}`;
    const cached = await this.cacheService.get<object>(cacheKey);
    if (cached) return cached;

    const rows = await this.collectionRepository.query(
      `
      SELECT
        c.id,
        c.tenant_id        AS "tenantId",
        c.name,
        c.cover_image_key  AS "coverImageKey",
        c.cover_image_url  AS "coverImageUrl",
        c.created_at       AS "createdAt",
        c.updated_at       AS "updatedAt",
        COUNT(cp.id)::int  AS "productsCount"
      FROM collections c
      LEFT JOIN collection_products cp ON cp.collection_id = c.id
      WHERE c.id = $1 AND c.tenant_id = $2 AND c.deleted_at IS NULL
      GROUP BY c.id
      `,
      [id, tenantId],
    );
    if (!rows.length) throw new CollectionNotFoundException(id);
    const r = rows[0];

    const previewImagesByCollection = await this.resolvePreviewImages([id]);

    const result = {
      id: r.id,
      tenantId: r.tenantId,
      name: r.name,
      coverImageKey: r.coverImageKey,
      coverImageUrl: r.coverImageUrl,
      previewImageUrls: previewImagesByCollection.get(id) ?? [],
      productsCount: r.productsCount,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };

    await this.cacheService.set(
      cacheKey,
      result,
      COLLECTION_DETAIL_CACHE_TTL_MS,
    );
    return result;
  }

  async findProducts(
    collectionId: string,
    query: QueryCollectionProductsDto,
    tenantId: string,
  ): Promise<{ products: object[]; meta: object }> {
    await this.ensureCollectionExists(collectionId, tenantId);

    const { page = 1, limit = 10 } = query;

    const [{ count }, rows] = await Promise.all([
      this.collectionProductRepository
        .query(
          `
          SELECT COUNT(*) AS count
          FROM collection_products cp
          INNER JOIN products p ON p.id = cp.product_id AND p.deleted_at IS NULL
          WHERE cp.collection_id = $1 AND p.tenant_id = $2
          `,
          [collectionId, tenantId],
        )
        .then((r) => r[0]),
      this.collectionProductRepository.query(
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
        FROM collection_products cp
        INNER JOIN products p ON p.id = cp.product_id AND p.deleted_at IS NULL
        LEFT JOIN categories c ON c.id = p.category_id AND c.deleted_at IS NULL
        WHERE cp.collection_id = $1 AND p.tenant_id = $2
        ORDER BY cp.created_at DESC
        LIMIT $3 OFFSET $4
        `,
        [collectionId, tenantId, limit, (page - 1) * limit],
      ),
    ]);

    const productIds = rows.map((r) => r.id as string);
    const images = productIds.length
      ? await this.imageRepository.find({
          where: { productId: In(productIds), deletedAt: IsNull() },
          order: { isPrimary: 'DESC', sortOrder: 'ASC', createdAt: 'ASC' },
        })
      : [];

    const imagesByProductId = new Map<string, ProductImage[]>();
    for (const image of images) {
      const list = imagesByProductId.get(image.productId) ?? [];
      list.push(image);
      imagesByProductId.set(image.productId, list);
    }

    const products = rows.map((r) => ({
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
      images: imagesByProductId.get(r.id as string) ?? [],
    }));

    const total = parseInt(count as string, 10);
    return {
      products,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async create(dto: CreateCollectionDto, tenantId: string): Promise<object> {
    const collection = this.collectionRepository.create({
      tenantId,
      name: dto.name,
      coverImageKey: null,
      coverImageUrl: null,
    });
    const saved = await this.collectionRepository.save(collection);
    this.logger.log(`Collection created: ${saved.id}`);

    await this.invalidateCollectionCache(saved.id, tenantId);

    await this.eventBridgeService.publish(
      COLLECTION_EVENT_SOURCE,
      'collection.created',
      {
        collectionId: saved.id,
        tenantId: saved.tenantId,
        name: saved.name,
      },
    );

    return this.findOne(saved.id, tenantId);
  }

  async update(
    id: string,
    dto: UpdateCollectionDto,
    tenantId: string,
  ): Promise<object> {
    const collection = await this.ensureCollectionExists(id, tenantId);

    if (dto.name !== undefined) collection.name = dto.name;
    if ('coverImageKey' in dto) {
      collection.coverImageKey = dto.coverImageKey ?? null;
      collection.coverImageUrl = collection.coverImageKey
        ? this.s3Service.buildViewUrl(collection.coverImageKey)
        : null;
    }

    collection.updatedAt = new Date();
    await this.collectionRepository.save(collection);

    await this.invalidateCollectionCache(id, tenantId);

    await this.eventBridgeService.publish(
      COLLECTION_EVENT_SOURCE,
      'collection.updated',
      {
        collectionId: collection.id,
        tenantId: collection.tenantId,
        name: collection.name,
        coverImageKey: collection.coverImageKey,
        coverImageUrl: collection.coverImageUrl,
        updatedAt: collection.updatedAt,
      },
    );

    this.logger.log(`Collection updated: ${id}`);
    return this.findOne(id, tenantId);
  }

  async softDelete(id: string, tenantId: string): Promise<void> {
    const collection = await this.ensureCollectionExists(id, tenantId);

    collection.deletedAt = new Date();
    await this.collectionRepository.save(collection);

    await this.invalidateCollectionCache(id, tenantId);

    await this.eventBridgeService.publish(
      COLLECTION_EVENT_SOURCE,
      'collection.deleted',
      {
        collectionId: collection.id,
        tenantId: collection.tenantId,
        deletedAt: collection.deletedAt,
      },
    );

    this.logger.log(`Collection soft-deleted: ${id}`);
  }

  async softDeleteMany(
    ids: string[],
    tenantId: string,
  ): Promise<{ deleted: number }> {
    const uniqueIds = [...new Set(ids)];

    const collections = await this.collectionRepository.find({
      where: { id: In(uniqueIds), tenantId, deletedAt: IsNull() },
      select: ['id'],
    });
    const existingIds = new Set(collections.map((c) => c.id));
    const missingIds = uniqueIds.filter((id) => !existingIds.has(id));
    if (missingIds.length) {
      throw new CollectionsNotFoundException(missingIds);
    }

    const deletedAt = new Date();
    await this.collectionRepository.update(
      { id: In(uniqueIds), tenantId },
      { deletedAt },
    );

    await Promise.all(
      uniqueIds.map((id) => this.invalidateCollectionCache(id, tenantId)),
    );

    await this.eventBridgeService.publish(
      COLLECTION_EVENT_SOURCE,
      'collection.deleted',
      {
        collectionIds: uniqueIds,
        tenantId,
        deletedAt,
      },
    );

    this.logger.log(
      `${uniqueIds.length} collection(s) soft-deleted: ${uniqueIds.join(', ')}`,
    );
    return { deleted: uniqueIds.length };
  }

  async addProducts(
    collectionId: string,
    dto: AddProductsToCollectionDto,
    tenantId: string,
  ): Promise<{ added: number }> {
    await this.ensureCollectionExists(collectionId, tenantId);

    const uniqueProductIds = [...new Set(dto.productIds)];

    const existingProducts = await this.productRepository.find({
      where: { id: In(uniqueProductIds), tenantId, deletedAt: IsNull() },
      select: ['id'],
    });
    const existingIds = new Set(existingProducts.map((p) => p.id));
    const invalidIds = uniqueProductIds.filter((id) => !existingIds.has(id));
    if (invalidIds.length) {
      throw new CollectionInvalidProductsException(invalidIds);
    }

    const inserted = await this.collectionProductRepository.query(
      `
      INSERT INTO collection_products (tenant_id, collection_id, product_id)
      SELECT $1, $2, unnest($3::uuid[])
      ON CONFLICT (collection_id, product_id) DO NOTHING
      RETURNING id, product_id AS "productId"
      `,
      [tenantId, collectionId, uniqueProductIds],
    );

    await this.invalidateCollectionCache(collectionId, tenantId);

    const added = inserted.length;
    if (added > 0) {
      await this.eventBridgeService.publish(
        COLLECTION_EVENT_SOURCE,
        'collection.products.added',
        {
          collectionId,
          tenantId,
          productIds: inserted.map((r) => r.productId as string),
          added,
        },
      );
    }

    this.logger.log(`${added} product(s) added to collection: ${collectionId}`);
    return { added };
  }

  async removeProducts(
    collectionId: string,
    dto: RemoveProductsFromCollectionDto,
    tenantId: string,
  ): Promise<{ removed: number }> {
    await this.ensureCollectionExists(collectionId, tenantId);

    const uniqueProductIds = [...new Set(dto.productIds)];

    const removedRows = await this.collectionProductRepository.query(
      `
      DELETE FROM collection_products
      WHERE collection_id = $1 AND product_id = ANY($2::uuid[])
      RETURNING id, product_id AS "productId"
      `,
      [collectionId, uniqueProductIds],
    );

    await this.invalidateCollectionCache(collectionId, tenantId);

    const removed = removedRows.length;
    if (removed > 0) {
      await this.eventBridgeService.publish(
        COLLECTION_EVENT_SOURCE,
        'collection.products.removed',
        {
          collectionId,
          tenantId,
          productIds: removedRows.map((r) => r.productId as string),
          removed,
        },
      );
    }

    this.logger.log(
      `${removed} product(s) removed from collection: ${collectionId}`,
    );
    return { removed };
  }
}
