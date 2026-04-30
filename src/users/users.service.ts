import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CognitoPostConfirmationDto } from './dto/cognito-post-confirmation.dto';
import { DuplicateUserException } from './exceptions/user.exceptions';
import { DynamoService } from './dynamo.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly dynamoService: DynamoService,
  ) {}

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

    const existing = await this.usersRepository.findOne({
      where: [{ id }, { email }],
    });

    if (existing) {
      if (existing.id === id) {
        throw new DuplicateUserException('sub', id);
      }
      throw new DuplicateUserException('email', email);
    }

    const user = this.usersRepository.create({
      id,
      email,
      firstName,
      lastName,
      isActive: true,
    });

    this.logger.log(`Creating new user id=${id}`);
    const saved = await this.usersRepository.save(user);

    await this.dynamoService.putUser({
      sub: saved.id,
      email: saved.email,
      firstName: saved.firstName,
      lastName: saved.lastName,
      isActive: saved.isActive,
      pgUserId: saved.id,
      tenants: [],
      updatedAt: new Date().toISOString(),
    });

    return saved;
  }
}
