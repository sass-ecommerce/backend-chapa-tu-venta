import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CategoryTreeDto } from './dto/category-tree.dto';
import {
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

  async create(dto: CreateCategoryDto): Promise<Category> {
    const slugExists = await this.categoryRepository.findOne({
      where: { tenantId: dto.tenantId, slug: dto.slug, deletedAt: IsNull() },
    });
    if (slugExists) throw new CategorySlugAlreadyExistsException(dto.slug);

    if (dto.parentId) {
      const parent = await this.categoryRepository.findOne({
        where: {
          id: dto.parentId,
          tenantId: dto.tenantId,
          deletedAt: IsNull(),
        },
      });
      if (!parent) throw new CategoryParentNotFoundException(dto.parentId);
    }

    const category = this.categoryRepository.create({
      tenantId: dto.tenantId,
      parentId: dto.parentId ?? null,
      name: dto.name,
      slug: dto.slug,
    });

    const saved = await this.categoryRepository.save(category);
    this.logger.log(`Category created: ${saved.id}`);
    return saved;
  }

  async findAllByTenant(tenantId: string): Promise<CategoryTreeDto[]> {
    const flat = await this.categoryRepository.find({
      select: ['id', 'parentId', 'name', 'slug'],
      where: { tenantId, deletedAt: IsNull() },
      order: { createdAt: 'ASC' },
    });
    return this.buildTree(flat);
  }

  async findOne(id: string): Promise<CategoryTreeDto> {
    const found = await this.categoryRepository.findOne({
      select: { id: true, tenantId: true },
      where: { id, deletedAt: IsNull() },
    });
    if (!found) throw new CategoryNotFoundException(id);

    const flat = await this.categoryRepository.find({
      select: ['id', 'parentId', 'name', 'slug'],
      where: { tenantId: found.tenantId, deletedAt: IsNull() },
      order: { createdAt: 'ASC' },
    });

    const map = this.buildMap(flat);
    return map.get(id)!;
  }

  private buildMap(flat: Category[]): Map<string, CategoryTreeDto> {
    const map = new Map<string, CategoryTreeDto>();
    flat.forEach((c) => {
      map.set(c.id, {
        id: c.id,
        parentId: c.parentId,
        name: c.name,
        slug: c.slug,
        children: [],
      });
    });
    flat.forEach((c) => {
      if (c.parentId && map.has(c.parentId)) {
        map.get(c.parentId)!.children.push(map.get(c.id)!);
      }
    });
    return map;
  }

  private buildTree(flat: Category[]): CategoryTreeDto[] {
    const map = this.buildMap(flat);
    const roots: CategoryTreeDto[] = [];
    flat.forEach((c) => {
      if (!c.parentId || !map.has(c.parentId)) roots.push(map.get(c.id)!);
    });
    return roots;
  }

  async softDelete(id: string): Promise<void> {
    const category = await this.categoryRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!category) throw new CategoryNotFoundException(id);

    category.deletedAt = new Date();
    category.updatedAt = new Date();
    await this.categoryRepository.save(category);
    this.logger.log(`Category soft-deleted: ${id}`);
  }
}
