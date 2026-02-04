import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataSource } from 'typeorm';

import { Store } from './entities/store.entity';
import { CreateStoreDto } from './dto/create-store.dto';
import { User } from 'src/users/entities/user.entity';
import type { AuthenticatedUser } from 'src/auth/interfaces/clerk-user.interface';
import { AuthService } from '../auth/auth.service';
import { RoleUser } from 'src/users/interface/role-user.interface';

@Injectable()
export class StoresService {
  private readonly logger = new Logger('StoresService');
  // Constantes de tipos de operación
  private readonly STORE_CREATED = 1;
  private readonly STORE_UPDATED = 2;

  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly authService: AuthService,
  ) {}

  async upsert(createStoreDto: CreateStoreDto, user: AuthenticatedUser) {
    //validaciones
    const userEntity = await this.userRepository.findOneBy({
      clerkId: user.userId,
    });

    if (!userEntity)
      throw new NotFoundException(`User with id ${user.userId} not found`);

    if (userEntity.email !== createStoreDto.ownerEmail.toLowerCase())
      throw new ConflictException(`Owner email does not match with user email`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    //operation
    try {
      const storeRepo = queryRunner.manager.getRepository(Store);
      const userRepo = queryRunner.manager.getRepository(User);

      let store: Store | null = null;
      let type = 0; // 1: created, 2: updated

      if (userEntity.storeId) {
        //UPDATE
        store = await storeRepo.findOneBy({ id: userEntity.storeId });
        if (!store)
          throw new NotFoundException(
            `Store with id ${userEntity.storeId} not found`,
          );
        storeRepo.merge(store, createStoreDto);
        await storeRepo.save(store);

        type = this.STORE_UPDATED;
        this.logger.log(
          `[upsert] Store updated with id ${store.id} by user ${user.userId}`,
        );
      } else {
        //CREATE
        store = await storeRepo.save(storeRepo.create(createStoreDto));
        type = this.STORE_CREATED;

        await userRepo.update(userEntity.id, {
          role: RoleUser.Admin,
          storeId: store.id,
        });

        this.logger.log(
          `[upsert] Store created with id ${store.id} by user ${user.userId}`,
        );
      }

      await queryRunner.commitTransaction();

      if (type === this.STORE_CREATED) {
        await this.authService.updatePublicMetadata(user.userId, {
          store: { slug: store?.slug },
        });
      }
      return { name: store.name, slug: store.slug, createdAt: store.createdAt };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `[upsert] Error upserting store: ${error.message}`,
        error.stack,
      );
      this.handleDBExceptions(error);
    } finally {
      await queryRunner.release();
    }
  }

  // async findAll(paginationDto: PaginationDto) {
  //   const { limit = 10, offset = 0 } = paginationDto;

  //   const stores = await this.storeRepository.find({
  //     order: { createdAt: 'DESC' },
  //     take: limit,
  //     skip: offset,
  //     where: { status: true },
  //   });

  //   return stores;
  // }

  async findOne(id: string) {
    const store = await this.storeRepository.findOne({
      where: { slug: id, status: true },
      relations: ['products', 'users'],
    });

    if (!store) {
      throw new NotFoundException(`Store with id ${id} not found`);
    }

    return store;
  }

  // async remove(id: string) {
  //   const store = await this.findOne(slug);
  //   store.status = false;
  //   await this.storeRepository.save(store);
  //   return { message: `Store ${slug} deactivated successfully` };
  // }

  private handleDBExceptions(error: any): never {
    if (error?.code === '23505') {
      throw new ConflictException(error.detail);
    }
    // console.error(error);
    throw new InternalServerErrorException(
      'Unexpected error, check server logs',
    );
  }
}
