import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Store } from './entities/store.entity';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
  ) {}

  async create(createStoreDto: CreateStoreDto) {
    try {
      const store = this.storeRepository.create(createStoreDto);
      await this.storeRepository.save(store);
      return store;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;

    const stores = await this.storeRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
      where: { status: true },
    });

    return stores;
  }

  async findOne(slug: string) {
    const store = await this.storeRepository.findOne({
      where: { slug },
      relations: ['products', 'users'],
    });

    if (!store) {
      throw new NotFoundException(`Store with slug ${slug} not found`);
    }

    return store;
  }

  async update(slug: string, updateStoreDto: UpdateStoreDto) {
    const store = await this.findOne(slug);

    try {
      Object.assign(store, updateStoreDto);
      store.updatedAt = new Date();
      await this.storeRepository.save(store);
      return store;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async remove(slug: string) {
    const store = await this.findOne(slug);
    store.status = false;
    await this.storeRepository.save(store);
    return { message: `Store ${slug} deactivated successfully` };
  }

  private handleDBExceptions(error: any): never {
    if (error?.code === '23505') {
      throw new BadRequestException(error.detail);
    }
    console.error(error);
    throw new InternalServerErrorException(
      'Unexpected error, check server logs',
    );
  }
}
