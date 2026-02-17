import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataSource } from 'typeorm';

import { Store } from './entities/store.entity';
import { CreateStoreDto } from './dto/create-store.dto';
import { User } from 'src/users/entities/user.entity';
import type { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';
import { UserMetadata } from 'src/auth/entities/user-metadata.entity';
import { RoleUser } from 'src/users/interface/role-user.interface';
import {
  StoreNotFoundException,
  UserNotFoundException,
  OwnerEmailMismatchException,
} from './exceptions/store.exceptions';

@Injectable()
export class StoresService {
  protected readonly logger = new Logger(StoresService.name);
  // Constantes de tipos de operación
  private readonly STORE_CREATED = 1;
  private readonly STORE_UPDATED = 2;

  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserMetadata)
    private readonly metadataRepository: Repository<UserMetadata>,
    private readonly dataSource: DataSource,
  ) {}

  async upsert(createStoreDto: CreateStoreDto, user: AuthenticatedUser) {
    //validaciones
    const userEntity = await this.userRepository.findOneBy({
      id: user.userId,
    });

    if (!userEntity) throw new UserNotFoundException(user.userId);

    if (userEntity.email !== createStoreDto.ownerEmail.toLowerCase())
      throw new OwnerEmailMismatchException();

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    //operation
    try {
      const storeRepo = queryRunner.manager.getRepository(Store);
      const userRepo = queryRunner.manager.getRepository(User);
      // const metadataRepo = queryRunner.manager.getRepository(UserMetadata);

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
          throw new StoreNotFoundException(String(userEntity.storeId));
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

      // Actualizar metadata local si se creó una tienda nueva
      if (storeResult.type === this.STORE_CREATED) {
        await this.updateUserMetadata(user.userId, {
          storeSlug: storeResult.data.slug,
        });
      }

      return { slug: storeResult.data.slug };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `[StoreService] [upsert] Error upserting store: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Actualiza el metadata público del usuario en la BD local
   */
  private async updateUserMetadata(
    userId: string,
    publicMetadata: Record<string, any>,
  ) {
    try {
      // Buscar metadata existente
      const metadata = await this.metadataRepository.findOne({
        where: { userId },
      });

      if (metadata) {
        // Merge con metadata existente
        metadata.publicMetadata = {
          ...metadata.publicMetadata,
          ...publicMetadata,
        };
        metadata.updatedAt = new Date();
        await this.metadataRepository.save(metadata);
      } else {
        // Crear nuevo registro de metadata
        const newMetadata = this.metadataRepository.create({
          userId,
          publicMetadata,
        });
        await this.metadataRepository.save(newMetadata);
      }

      this.logger.log(`Updated metadata for user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Error updating metadata for user ${userId}:`,
        error.message,
      );
      // No lanzar error, solo loguear
    }
  }

  async findOne(slug: string) {
    const store = await this.storeRepository.findOne({
      where: { slug: slug, status: true },
      relations: ['products', 'users'],
    });

    if (!store) {
      throw new StoreNotFoundException(slug);
    }

    return store;
  }
}
