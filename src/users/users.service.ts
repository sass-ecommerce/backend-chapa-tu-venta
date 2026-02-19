import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { UserLog } from './schema/user-log.schema';
import { Model } from 'mongoose';
import { UpdateUserBasicDto } from './dto/update-user-basic.dto';
import {
  UserNotFoundBySlugException,
  UnauthorizedUserUpdateException,
} from './exceptions/user.exceptions';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    @InjectModel(UserLog.name) private userLogModel: Model<UserLog>,
  ) {}

  // User creation is now handled by PassportAuthService via register()
  // This service is kept for potential future user management operations

  /**
   * Buscar usuario por slug (UUID)
   * @param slug - Slug del usuario (UUID público)
   * @returns Usuario encontrado
   * @throws UserNotFoundBySlugException si el usuario no existe
   */
  async findBySlug(slug: string): Promise<User> {
    this.logger.debug(`Finding user by slug: ${slug}`);

    const user = await this.usersRepository.findOne({
      where: { slug },
      select: [
        'id',
        'slug',
        'firstName',
        'lastName',
        'email',
        'imageUrl',
        'role',
        'createdAt',
      ],
    });

    if (!user) {
      this.logger.warn(`User not found with slug: ${slug}`);
      throw new UserNotFoundBySlugException(slug);
    }

    this.logger.debug(`User found: ${user.email}`);
    return user;
  }

  /**
   * Actualizar información básica del usuario
   * Solo permite actualizar firstName, lastName, imageUrl
   * Valida que el usuario autenticado sea el propietario del perfil
   *
   * @param slug - Slug del usuario a actualizar
   * @param updateData - Datos a actualizar (firstName, lastName, imageUrl)
   * @param currentUserId - ID del usuario autenticado (para validación de propiedad)
   * @returns Usuario actualizado
   * @throws UserNotFoundBySlugException si el usuario no existe
   * @throws UnauthorizedUserUpdateException si intenta actualizar perfil ajeno
   */
  async updateBasicInfo(
    slug: string,
    updateData: UpdateUserBasicDto,
    currentUserId: string,
  ): Promise<User> {
    this.logger.debug(`Updating user with slug: ${slug}`);

    // Buscar usuario por slug
    const user = await this.findBySlug(slug);

    // Validar que el usuario autenticado es el dueño del perfil
    if (user.id !== currentUserId) {
      this.logger.warn(
        `Unauthorized update attempt. User ${currentUserId} tried to update user ${user.id}`,
      );
      throw new UnauthorizedUserUpdateException();
    }

    // Actualizar campos permitidos
    Object.assign(user, updateData);
    user.updatedAt = new Date();

    const updatedUser = await this.usersRepository.save(user);

    this.logger.log(
      `User ${slug} updated successfully. Fields: ${Object.keys(updateData).join(', ')}`,
    );

    // Log en MongoDB para auditoría
    await this.userLogModel.create({
      clerkId: user.id,
      eventType: 'user.updated_basic_info',
      externalAuthId: 'local',
      rawJson: {
        updatedFields: Object.keys(updateData),
        slug: user.slug,
        timestamp: new Date(),
      },
      statusProcess: 2, // Completed
    });

    return updatedUser;
  }

  /**
   * Obtener public_metadata del usuario por slug
   * @param slug - Slug del usuario (UUID público)
   * @returns public_metadata del usuario (objeto vacío si no existe metadata)
   * @throws UserNotFoundBySlugException si el usuario no existe
   */
  async findPublicMetadataBySlug(slug: string): Promise<Record<string, any>> {
    this.logger.debug(`Finding public metadata for user with slug: ${slug}`);

    // Buscar usuario con su metadata
    const user = await this.usersRepository.findOne({
      where: { slug },
      relations: ['metadata'],
    });
    console.log('User with metadata:', user);
    if (!user) {
      this.logger.warn(`User not found with slug: ${slug}`);
      throw new UserNotFoundBySlugException(slug);
    }

    // Si no tiene metadata, retornar objeto vacío
    if (!user.metadata) {
      this.logger.debug(`User ${slug} has no metadata, returning empty object`);
      return {};
    }

    this.logger.debug(`Public metadata found for user: ${user.email}`);
    return user.metadata.publicMetadata || {};
  }
}
