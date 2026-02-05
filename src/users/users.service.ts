import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { UserLog } from './schema/user-log.schema';
import { Model } from 'mongoose';
import { StatusProcess } from './interface/status-process.interface';
import { AuthService } from 'src/auth/auth.service';
import { DeleteUserDto } from './dto/delete-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    @InjectModel(UserLog.name) private userLogModel: Model<UserLog>,
    private authService: AuthService,
  ) {}

  /**
   * Crea o actualiza el log de auditoría
   */
  private async createOrUpdateLog(
    clerkId: string,
    eventType: string,
    webhookData: CreateUserDto | DeleteUserDto,
    instance_id: string,
  ) {
    return await this.userLogModel.findOneAndUpdate(
      { clerkId, eventType },
      {
        rawJson: webhookData,
        externalAuthId: instance_id,
        statusProcess: StatusProcess.Pending,
        $inc: { retryCount: 1 },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true, new: true },
    );
  }

  /**
   * Maneja errores y lanza excepción
   */
  private handleError(error: any, clerkId: string, method: string) {
    this.logger.error(
      `[UsersController][${method}] User: id: ${clerkId} - error: ${error}`,
    );
    throw new InternalServerErrorException('Check server logs for details');
  }

  async create(createUserDto: CreateUserDto) {
    const { data, instance_id, type } = createUserDto;

    const log = await this.createOrUpdateLog(
      data.id,
      type,
      createUserDto,
      instance_id,
    );

    try {
      const externalAcount = data.external_accounts?.[0];
      const emailAddress = data.email_addresses?.find(
        (email) => email.id === data.primary_email_address_id,
      )?.email_address;

      const userData = {
        clerkId: data.id,
        email: emailAddress?.toLowerCase().trim(),
        firstName: data?.first_name,
        lastName: data?.last_name,
        imageUrl: data?.image_url,
        externalAuthId: instance_id,
        authMethod: externalAcount?.provider || 'email_password',
        providerUserId: externalAcount?.provider_user_id,
      };
      console.log('userData ', userData);

      await this.usersRepository.upsert(userData, ['clerkId']);
      const result = await this.usersRepository.findOneBy({ clerkId: data.id });

      await log.updateOne({
        statusProcess: StatusProcess.Completed,
        errorMessage: '',
      });

      if (result?.slug) {
        // Actualización de metadata no-bloqueante (async)
        this.authService
          .updatePublicMetadata(userData.clerkId, {
            user: { slug: result.slug },
          })
          .catch((error) => {
            this.logger.warn(
              `[create] Failed to update Clerk metadata for user ${userData.clerkId}: ${error.message}`,
            );
          });
      }

      this.logger.log(
        `[create] User created successfully - clerkId: ${data.id}, email: ${userData.email}`,
      );

      return { completed: true };
    } catch (error) {
      await log.updateOne({
        statusProcess: StatusProcess.Error,
        errorMessage: error.message,
      });

      this.handleError(error, data.id, 'create');

      throw new InternalServerErrorException('Check server logs for details');
    }
  }

  async update(updateUserDto: CreateUserDto) {
    const { data, instance_id, type } = updateUserDto;

    const log = await this.createOrUpdateLog(
      data.id,
      type,
      updateUserDto,
      instance_id,
    );

    // Validacion email uniqueness
    const emailAddress = data.email_addresses?.find(
      (email) => email.id === data.primary_email_address_id,
    )?.email_address;

    const newEmail = emailAddress?.toLowerCase().trim();

    if (newEmail) {
      const existingUser = await this.usersRepository.findOne({
        where: { email: newEmail },
      });

      // Si existe y NO es el mismo usuario, lanzar ConflictException
      if (existingUser && existingUser.clerkId !== data.id) {
        await log.updateOne({
          statusProcess: StatusProcess.Error,
          errorMessage: `Email ${newEmail} already exists for another user`,
        });

        this.logger.warn(
          `[update] Email conflict: ${newEmail} is already used by another user`,
        );

        throw new ConflictException(
          `Email ${newEmail} is already registered to another user`,
        );
      }
    }

    try {
      const updateData = {
        firstName: data?.first_name,
        lastName: data?.last_name,
        imageUrl: data?.image_url,
        email: newEmail,
      };

      await this.usersRepository.update({ clerkId: data.id }, updateData);

      await log.updateOne({
        statusProcess: StatusProcess.Completed,
        errorMessage: '',
      });

      this.logger.log(
        `User updated successfully - clerkId: ${data.id}, fields: ${Object.keys(updateData).join(', ')}`,
      );

      return { completed: true };
    } catch (error) {
      await log.updateOne({
        statusProcess: StatusProcess.Error,
        errorMessage: error.message,
      });

      this.handleError(error, data.id, 'update');
    }
  }

  async delete(deleteUserDto: DeleteUserDto) {
    const { data, instance_id, type } = deleteUserDto;

    const log = await this.createOrUpdateLog(
      data.id,
      type,
      deleteUserDto,
      instance_id,
    );

    try {
      const user = await this.usersRepository.findOneBy({ clerkId: data.id });

      if (!user) {
        await log.updateOne({
          statusProcess: StatusProcess.Error,
          errorMessage: `User with clerkId ${data.id} not found`,
        });
        this.logger.warn(`[delete] User not found - clerkId: ${data.id}`);
        throw new NotFoundException(`User with clerkId ${data.id} not found`);
      }

      await this.usersRepository.update(
        { clerkId: data.id },
        { isActive: false },
      );

      await log.updateOne({
        statusProcess: StatusProcess.Completed,
        errorMessage: '',
      });

      this.logger.log(`[delete] User soft deleted - clerkId: ${data.id}`);
      return { completed: true };
    } catch (error) {
      await log.updateOne({
        statusProcess: StatusProcess.Error,
        errorMessage: error.message,
      });
      this.handleError(error, data.id, 'delete');
    }
  }
}
