import {
  Body,
  Controller,
  Get,
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

  @Get('onboarding')
  async getOnboarding(@CurrentUser() user: CognitoUser) {
    const status = await this.tenantsService.getOnboardingStatus(user.sub);

    return {
      code: 200,
      message: 'Onboarding status retrieved successfully',
      data: status,
    };
  }

  @Post()
  async create(@Body() dto: CreateTenantDto, @CurrentUser() user: CognitoUser) {
    const tenant = await this.tenantsService.create(dto, user.sub);

    return {
      code: 201,
      message: 'Tenant created successfully',
      data: {
        tenantId: tenant.id,
        name: tenant.name,
      },
    };
  }
}
