import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { UserLog } from './schema/user-log.schema';
import { Model } from 'mongoose';
import { StatusProcess } from './interface/status-process.interface';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    @InjectModel(UserLog.name) private userLogModel: Model<UserLog>,
  ) {}

  /**
   * Extrae y formatea los datos del usuario desde el DTO de Clerk
   */
  private extractUserData(createUserDto: CreateUserDto) {
    const { data, instance_id } = createUserDto;
    const externalAccount = data.external_accounts?.[0];
    const emailAddress = data.email_addresses?.find(
      (email) => email.id === data.primary_email_address_id,
    )?.email_address;

    return {
      clerkId: data.id,
      email: emailAddress?.toLowerCase().trim(),
      firstName: data?.first_name,
      lastName: data?.last_name,
      imageUrl: data?.image_url,
      externalAuthId: instance_id,
      authMethod: externalAccount?.provider || 'email_password',
      providerUserId: externalAccount?.provider_user_id,
    };
  }

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
   * Marca el log como completado o con error
   */
  private async updateLogStatus(
    log: UserLog,
    statusProcess: StatusProcess,
    errorMessage: string = '',
  ) {
    await log.updateOne({
      statusProcess,
      errorMessage,
    });
  }

  /**
   * Maneja errores y lanza excepción
   */
  private handleError(error: any, clerkId: string) {
    console.error(`[Webhook Error] User: id: ${clerkId} - error: ${error}`);
    throw new InternalServerErrorException('Check server logs for details');
  }

  /**
   * Crea o actualiza un usuario (upsert)
   */
  async upsert(createUserDto: CreateUserDto) {
    const { data, instance_id, type } = createUserDto;

    const log = await this.createOrUpdateLog(
      data.id,
      type,
      createUserDto,
      instance_id,
    );

    try {
      const userData = this.extractUserData(createUserDto);
      await this.usersRepository.upsert(userData, ['clerkId']);
      await this.updateLogStatus(log, StatusProcess.Completed);

      return { completed: true };
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await this.updateLogStatus(log, StatusProcess.Error, error.message);
      this.handleError(error, data.id);
    }
  }

  /**
   * Crea un nuevo usuario
   */
  async create(createUserDto: CreateUserDto) {
    const { data, instance_id, type } = createUserDto;

    const log = await this.createOrUpdateLog(
      data.id,
      type,
      createUserDto,
      instance_id,
    );

    try {
      const userData = this.extractUserData(createUserDto);
      const newUser = this.usersRepository.create(userData);
      await this.usersRepository.save(newUser);
      await this.updateLogStatus(log, StatusProcess.Completed);

      return { completed: true };
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await this.updateLogStatus(log, StatusProcess.Error, error.message);
      if (error.code === '23505') {
        console.log(
          `[UsersService][create] Duplicate user detected: ${error.detail}`,
        );
        throw new BadRequestException(
          `Duplicate user: A user with the same unique field already exists.`,
        );
      }
      this.handleError(error, data.id);
    }
  }

  /**
   * Actualiza un usuario existente
   */
  async update(createUserDto: CreateUserDto) {
    const { data, instance_id, type } = createUserDto;

    const log = await this.createOrUpdateLog(
      data.id,
      type,
      createUserDto,
      instance_id,
    );

    try {
      const userData = this.extractUserData(createUserDto);
      await this.usersRepository.update({ clerkId: data.id }, userData);
      await this.updateLogStatus(log, StatusProcess.Completed);

      return { completed: true };
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await this.updateLogStatus(log, StatusProcess.Error, error.message);
      this.handleError(error, data.id);
    }
  }
}
