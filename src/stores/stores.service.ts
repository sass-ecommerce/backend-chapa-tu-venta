import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataSource } from 'typeorm';

import { Store } from './entities/store.entity';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { User } from 'src/users/entities/user.entity';
import type { AuthenticatedUser } from 'src/auth/interfaces/clerk-user.interface';
import { AuthService } from '../auth/auth.service';
import { RoleUser } from 'src/users/interface/role-user.interface';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly authService: AuthService,
  ) {}

  async create(createStoreDto: CreateStoreDto, user: AuthenticatedUser) {
    const userEntity = await this.userRepository.findOneBy({
      clerkId: user.userId,
    });

    if (!userEntity)
      throw new NotFoundException(`User with id ${user.userId} not found`);

    if (userEntity.email != createStoreDto.ownerEmail) {
      throw new ConflictException(`Owner email does not match with user email`);
    }

    if (userEntity.storeId) {
      throw new BadRequestException(`User already has a store assigned`);
    }
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const storeRepo = queryRunner.manager.getRepository(Store);
      const userRepo = queryRunner.manager.getRepository(User);

      const store = await storeRepo.save(storeRepo.create(createStoreDto));

      await userRepo.update(userEntity.id, {
        role: RoleUser.Admin,
        storeId: store.id,
      });

      await queryRunner.commitTransaction();

      await this.authService.updatePublicMetadata(user.userId, {
        store: { slug: store?.slug },
      });
      return store;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.handleDBExceptions(error);
    } finally {
      await queryRunner.release();
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
      throw new ConflictException(error.detail);
    }
    console.error(error);
    throw new InternalServerErrorException(
      'Unexpected error, check server logs',
    );
  }
}
