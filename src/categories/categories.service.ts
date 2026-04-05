import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
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

  async findAllByTenant(tenantId: string): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { tenantId, deletedAt: IsNull() },
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['parent', 'children'],
    });
    if (!category) throw new CategoryNotFoundException(id);
    return category;
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
