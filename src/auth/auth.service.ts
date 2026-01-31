import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClerkClient } from '@clerk/backend';
import { UserPublicMetadata } from './interfaces/clerk-user.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly clerkClient;

  constructor(private configService: ConfigService) {
    // Inicializar Clerk Client
    this.clerkClient = createClerkClient({
      secretKey: this.configService.get<string>('CLERK_SECRET_KEY'),
      publishableKey: this.configService.get<string>('CLERK_PUBLISHABLE_KEY'),
    });
  }

  /**
   * Obtiene la información completa de un usuario por su ID
   *
   * @param userId - ID del usuario en Clerk (ej: "user_2abc123xyz")
   * @returns Objeto User completo de Clerk
   *
   * @example
   * ```typescript
   * const user = await this.authService.getUserById('user_2abc123xyz');
   * console.log(user.publicMetadata);
   * ```
   */
  async getUserById(userId: string) {
    try {
      const user = await this.clerkClient.users.getUser(userId);
      return user;
    } catch (error) {
      this.logger.error(`Error fetching user ${userId}:`, error);
      throw new InternalServerErrorException('Failed to fetch user data');
    }
  }

  /**
   * Actualiza el publicMetadata de un usuario
   *
   * @param userId - ID del usuario en Clerk
   * @param metadata - Objeto con los datos a actualizar (merge parcial)
   * @returns Usuario actualizado
   *
   * @example
   * ```typescript
   * await this.authService.updatePublicMetadata('user_2abc123xyz', {
   *   storeSlug: 'mi-tienda',
   *   plan: 'premium',
   *   onboardingCompleted: true,
   * });
   * ```
   */
  async updatePublicMetadata(
    userId: string,
    metadata: Partial<UserPublicMetadata>,
  ) {
    try {
      const updatedUser = await this.clerkClient.users.updateUserMetadata(
        userId,
        {
          publicMetadata: metadata,
        },
      );

      this.logger.log(`Updated publicMetadata for user ${userId}`);
      return updatedUser;
    } catch (error) {
      this.logger.error(`Error updating metadata for user ${userId}:`, error);
      throw new InternalServerErrorException('Failed to update user metadata');
    }
  }

  /**
   * Actualiza el privateMetadata de un usuario (solo backend)
   *
   * @param userId - ID del usuario en Clerk
   * @param metadata - Objeto con los datos privados a actualizar
   * @returns Usuario actualizado
   *
   * @example
   * ```typescript
   * await this.authService.updatePrivateMetadata('user_2abc123xyz', {
   *   stripeCustomerId: 'cus_abc123',
   *   internalNotes: 'VIP customer',
   * });
   * ```
   */
  async updatePrivateMetadata(userId: string, metadata: Record<string, any>) {
    try {
      const updatedUser = await this.clerkClient.users.updateUserMetadata(
        userId,
        {
          privateMetadata: metadata,
        },
      );

      this.logger.log(`Updated privateMetadata for user ${userId}`);
      return updatedUser;
    } catch (error) {
      this.logger.error(
        `Error updating private metadata for user ${userId}:`,
        error,
      );
      throw new InternalServerErrorException('Failed to update user metadata');
    }
  }

  /**
   * Actualiza ambos metadatos a la vez
   *
   * @param userId - ID del usuario en Clerk
   * @param publicMetadata - Datos públicos a actualizar
   * @param privateMetadata - Datos privados a actualizar
   * @returns Usuario actualizado
   */
  async updateAllMetadata(
    userId: string,
    publicMetadata?: Partial<UserPublicMetadata>,
    privateMetadata?: Record<string, any>,
  ) {
    try {
      const updatedUser = await this.clerkClient.users.updateUserMetadata(
        userId,
        {
          ...(publicMetadata && { publicMetadata }),
          ...(privateMetadata && { privateMetadata }),
        },
      );

      this.logger.log(`Updated metadata for user ${userId}`);
      return updatedUser;
    } catch (error) {
      this.logger.error(
        `Error updating all metadata for user ${userId}:`,
        error,
      );
      throw new InternalServerErrorException('Failed to update user metadata');
    }
  }
}
