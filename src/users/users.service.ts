import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CognitoPostConfirmationDto } from './dto/cognito-post-confirmation.dto';
import { DynamoService } from './dynamo.service';
import { CognitoAdminService } from './cognito-admin.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly dynamoService: DynamoService,
    private readonly cognitoAdminService: CognitoAdminService,
  ) {}

  async upsertFromCognitoConfirmation(
    dto: CognitoPostConfirmationDto,
  ): Promise<User> {
    const attrs = dto.request.userAttributes;
    const sub = attrs['sub'];
    const email = attrs['email'];
    const firstName = attrs['given_name'] ?? null;
    const lastName = attrs['family_name'] ?? null;
    const now = new Date();

    this.logger.log(
      `Post confirmation for sub=${sub} email=${email} source=${dto.triggerSource}`,
    );

    // const existing = await this.usersRepository.findOne({ where: { email } });

    // if (existing) {
    //   this.logger.log(
    //     `User email=${email} found (id=${existing.id}), updating sub`,
    //   );

    //   existing.sub = sub;
    //   existing.firstName = firstName;
    //   existing.lastName = lastName;
    //   existing.isActive = true;
    //   existing.updatedAt = now;

    //   const updated = await this.usersRepository.save(existing);

    //   await Promise.all([
    //     this.dynamoService.putUser({
    //       sub,
    //       email: updated.email,
    //       firstName: updated.firstName,
    //       lastName: updated.lastName,
    //       isActive: updated.isActive,
    //       id: updated.id,
    //       tenants: [],
    //       updatedAt: now.toISOString(),
    //     }),
    //     this.cognitoAdminService.setDbId(sub, updated.id),
    //   ]);

    //   return updated;
    // }

    this.logger.log(`Creating new user sub=${sub}`);
    const user = this.usersRepository.create({
      sub,
      email,
      firstName,
      lastName,
      isActive: true,
    });
    const saved = await this.usersRepository.save(user);

    await Promise.all([
      this.dynamoService.putUser({
        sub,
        email: saved.email,
        firstName: saved.firstName,
        lastName: saved.lastName,
        isActive: saved.isActive,
        id: saved.id,
        tenants: [],
        updatedAt: now.toISOString(),
      }),
      this.cognitoAdminService.setDbId(sub, saved.id),
    ]);

    return saved;
  }
}
