import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { UserLog } from './schema/user-log.schema';
import { Model } from 'mongoose';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    @InjectModel(UserLog.name) private userLogModel: Model<UserLog>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { data, instance_id, type } = createUserDto;

    const log = await this.userLogModel.findOneAndUpdate(
      { clerkId: data.id, eventType: type },
      {
        rawJson: createUserDto,
        externalAuthId: instance_id,
        statusProcess: 1,
        $inc: { retryCount: 1 },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true, new: true },
    );

    try {
      const externalAcount = data.external_accounts?.[0];
      const emailAddress =
        data.email_addresses.find(
          (email) => email.id === data.primary_email_address_id,
        )?.email_address || '';

      const userData = {
        clerkId: data.id,
        email: emailAddress.toLowerCase().trim(),
        firstName: data?.first_name || '',
        lastName: data?.last_name || '',
        imageUrl: data?.image_url || '',
        externalAuthId: instance_id,
        authMethod: externalAcount?.provider || 'email_password',
        providerUserId: externalAcount?.provider_user_id || '',
      };

      await this.usersRepository.upsert(userData, ['clerkId']);

      await log.updateOne({ statusProcess: 2, errorMessage: '' }); // Mark as Completed

      return { ok: true };
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      await log.updateOne({ statusProcess: 3, errorMessage: error.message });

      console.error(`[Webhook Error] User: id: ${data.id} - error: ${error}`);

      throw new InternalServerErrorException('Check server logs for details');
    }
  }
}
