import {
  Body,
  Controller,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { CognitoJwtGuard } from '../cognito-auth/guards/cognito-jwt.guard';
import { CurrentUser } from '../cognito-auth/decorators/current-user.decorator';
import type { CognitoUser } from '../cognito-auth/interfaces/cognito-user.interface';

@Controller('tenants')
@UseGuards(CognitoJwtGuard)
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }),
)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  async create(@Body() dto: CreateTenantDto, @CurrentUser() user: CognitoUser) {
    const tenant = await this.tenantsService.create(dto, user.sub);

    return {
      code: 201,
      message: 'Tenant created successfully',
      data: {
        id: tenant.id,
        name: tenant.name,
        domain: tenant.domain,
        createdAt: tenant.createdAt,
      },
    };
  }
}
