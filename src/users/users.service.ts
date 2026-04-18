import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateUserBasicDto } from './dto/update-user-basic.dto';
import { CognitoPostConfirmationDto } from './dto/cognito-post-confirmation.dto';
import {
  UserNotFoundException,
  UnauthorizedUserUpdateException,
} from './exceptions/user.exceptions';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      this.logger.warn(`User not found with id: ${id}`);
      throw new UserNotFoundException(id);
    }

    return user;
  }

  async updateBasicInfo(
    id: string,
    updateData: UpdateUserBasicDto,
    cognitoSub: string,
  ): Promise<User> {
    const user = await this.findById(id);

    // id IS the Cognito sub, so this check prevents updating another user's profile
    if (user.id !== cognitoSub) {
      throw new UnauthorizedUserUpdateException();
    }

    Object.assign(user, updateData);
    user.updatedAt = new Date();

    return this.usersRepository.save(user);
  }

  async upsertFromCognitoConfirmation(
    dto: CognitoPostConfirmationDto,
  ): Promise<User> {
    const attrs = dto.request.userAttributes;

    // Cognito sub becomes the user's primary key
    const id = attrs['sub'];
    const email = attrs['email'];
    const firstName = attrs['given_name'] ?? null;
    const lastName = attrs['family_name'] ?? null;

    this.logger.log(
      `Post confirmation for id=${id} email=${email} source=${dto.triggerSource}`,
    );

    const existing = await this.usersRepository.findOne({ where: { id } });

    if (existing) {
      existing.email = email;
      if (firstName) existing.firstName = firstName;
      if (lastName) existing.lastName = lastName;
      existing.updatedAt = new Date();

      this.logger.log(`Updating existing user id=${id}`);
      return this.usersRepository.save(existing);
    }

    const user = this.usersRepository.create({
      id,
      email,
      firstName,
      lastName,
      isActive: true,
    });

    this.logger.log(`Creating new user id=${id}`);
    return this.usersRepository.save(user);
  }
}
