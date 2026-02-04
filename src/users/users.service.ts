import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
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
    createUserDto: CreateUserDto,
    instance_id: string,
  ) {
    return await this.userLogModel.findOneAndUpdate(
      { clerkId, eventType },
      {
        rawJson: createUserDto,
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

      await this.usersRepository.upsert(userData, ['clerkId']);
      const result = await this.usersRepository.findOneBy({ clerkId: data.id });

      await log.updateOne({
        statusProcess: StatusProcess.Completed,
        errorMessage: '',
      });

      if (result?.slug) {
        await this.authService.updatePublicMetadata(userData.clerkId, {
          user: { slug: result.slug },
        });
      }

      this.logger.log(
        `User created successfully - clerkId: ${data.id}, email: ${userData.email}`,
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
          `[UsersService][update] Email conflict: ${newEmail} is already used by another user`,
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
}
