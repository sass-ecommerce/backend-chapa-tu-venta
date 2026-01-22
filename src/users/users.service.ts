import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    if (createUserDto.type !== 'user.created') {
      throw new BadRequestException('Unsupported event type');
    }
    try {
      const userData = {
        clerkId: createUserDto.data.id,
        email: createUserDto.data.email_addresses.find(
          (email) => email.id === createUserDto.data.primary_email_address_id,
        )?.email_address,
        firstName: createUserDto.data.first_name,
        lastName: createUserDto.data.last_name || '',
        imageUrl: createUserDto.data.image_url,
      };

      const newUser = this.usersRepository.create(userData);
      await this.usersRepository.save(newUser);
      return { ok: true };
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error.code === '23505') {
        throw new BadRequestException(
          'User with this email or clerk ID already exists',
        );
      }
    }
  }
}
