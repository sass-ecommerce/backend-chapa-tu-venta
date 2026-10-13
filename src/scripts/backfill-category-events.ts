// One-off: replays `category.created` for every non-deleted category so the
// DynamoDB read model (ctv-tbl-categories) gets the categories that existed
// before categories started publishing events. Safe to re-run: the consumer
// lambda does a PutItem keyed by tenantId + categoryId.
//
// Usage (same env as the API): npm run build && npm run backfill:categories

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { AppModule } from '../app.module';
import { Category } from '../categories/entities/category.entity';
import { CategoriesService } from '../categories/categories.service';

async function main(): Promise<void> {
  const logger = new Logger('BackfillCategoryEvents');
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const repository = app.get<Repository<Category>>(
      getRepositoryToken(Category),
    );
    const categoriesService = app.get(CategoriesService);

    const categories = await repository.find({
      where: { deletedAt: IsNull() },
      order: { createdAt: 'ASC' },
    });
    logger.log(`Publishing ${categories.length} category.created events`);

    for (const category of categories) {
      await categoriesService.publishCreated(category);
    }

    logger.log('Backfill finished');
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  new Logger('BackfillCategoryEvents').error('Backfill failed', error);
  process.exit(1);
});
