import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CategoryTreeDto } from './dto/category-tree.dto';
import { CategoryType } from './enums/category-type.enum';
import {
  CategoryHasChildrenException,
  CategoryNotFoundException,
  CategoryParentNotFoundException,
  CategorySlugAlreadyExistsException,
} from './exceptions/category.exceptions';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(dto: CreateCategoryDto, tenantId: string): Promise<Category> {
    const slugExists = await this.categoryRepository.findOne({
      where: { tenantId, slug: dto.slug, deletedAt: IsNull() },
    });
    if (slugExists) throw new CategorySlugAlreadyExistsException(dto.slug);

    if (dto.parentId) {
      const parent = await this.categoryRepository.findOne({
        where: { id: dto.parentId, tenantId, deletedAt: IsNull() },
      });
      if (!parent) throw new CategoryParentNotFoundException(dto.parentId);
    }

    const category = this.categoryRepository.create({
      tenantId,
      parentId: dto.parentId ?? null,
      type: dto.parentId ? CategoryType.CHILDREN : CategoryType.BASE,
      name: dto.name,
      slug: dto.slug,
    });

    const saved = await this.categoryRepository.save(category);
    this.logger.log(`Category created: ${saved.id}`);
    return saved;
  }

  async findAllByTenant(tenantId: string): Promise<CategoryTreeDto[]> {
    return this.categoryRepository
      .createQueryBuilder('c')
      .select(['c.id AS id', 'c.name AS name', 'c.slug AS slug'])
      .addSelect(
        `(SELECT COUNT(*)::int FROM categories ch WHERE ch.parent_id = c.id AND ch.tenant_id = :tenantId AND ch.deleted_at IS NULL)`,
        'childrenCount',
      )
      .where('c.tenant_id = :tenantId', { tenantId })
      .andWhere('c.type = :type', { type: CategoryType.BASE })
      .andWhere('c.deleted_at IS NULL')
      .orderBy('c.created_at', 'ASC')
      .getRawMany<CategoryTreeDto>();
  }

  async findOne(id: string, tenantId: string): Promise<CategoryTreeDto[]> {
    return this.categoryRepository
      .createQueryBuilder('c')
      .select(['c.id AS id', 'c.name AS name', 'c.slug AS slug'])
      .addSelect(
        `(SELECT COUNT(*)::int FROM categories ch WHERE ch.parent_id = c.id AND ch.tenant_id = :tenantId AND ch.deleted_at IS NULL)`,
        'childrenCount',
      )
      .where('c.parent_id = :id', { id })
      .andWhere('c.tenant_id = :tenantId', { tenantId })
      .andWhere('c.deleted_at IS NULL')
      .getRawMany<CategoryTreeDto>();
  }

  async softDelete(id: string, tenantId: string): Promise<void> {
    const category = await this.categoryRepository.findOne({
      where: { id, tenantId, deletedAt: IsNull() },
    });
    if (!category) throw new CategoryNotFoundException(id);

    const childCount = await this.categoryRepository.count({
      where: { parentId: id, tenantId, deletedAt: IsNull() },
    });
    if (childCount > 0) throw new CategoryHasChildrenException(id);

    category.deletedAt = new Date();
    category.updatedAt = new Date();
    await this.categoryRepository.save(category);
    this.logger.log(`Category soft-deleted: ${id}`);
  }
}
