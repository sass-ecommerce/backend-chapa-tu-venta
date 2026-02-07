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

      const storeResult: { data: Store | null; type: number } = {
        data: null,
        type: 0, // 1: created, 2: updated
      };
      if (userEntity.storeId) {
        //UPDATE
        storeResult.data = await storeRepo.findOneBy({
          id: userEntity.storeId,
        });
        if (!storeResult.data)
          throw new NotFoundException(
            `Store with id ${userEntity.storeId} not found`,
          );
        storeRepo.merge(storeResult.data, createStoreDto);
        await storeRepo.save(storeResult.data);

        storeResult.type = this.STORE_UPDATED;
        this.logger.log(
          `[StoreService] [upsert] Store updated with id ${storeResult.data.id} by user ${user.userId}`,
        );
      } else {
        //CREATE
        storeResult.data = await storeRepo.save(
          storeRepo.create(createStoreDto),
        );
        storeResult.type = this.STORE_CREATED;

        await userRepo.update(userEntity.id, {
          role: RoleUser.Admin,
          storeId: storeResult.data.id,
        });

        this.logger.log(
          `[StoreService] [upsert] Store created with id ${storeResult.data.id} by user ${user.userId}`,
        );
      }

      await queryRunner.commitTransaction();

      if (storeResult.type === this.STORE_CREATED) {
        await this.authService.updatePublicMetadata(user.userId, {
          store: { slug: storeResult.data.slug },
        });
      }
      return { slug: storeResult.data.slug };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `[StoreService] [upsert] Error upserting store: ${error.message}`,
        error.stack,
      );
      this.handleDBExceptions(error);
    } finally {
      await queryRunner.release();
    }
  }

  async findOne(slug: string) {
    const store = await this.storeRepository.findOne({
      where: { slug: slug, status: true },
      relations: ['products', 'users'],
    });

    if (!store) {
      throw new NotFoundException(`Store with slug ${slug} not found`);
    }

    return store;
  }

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
