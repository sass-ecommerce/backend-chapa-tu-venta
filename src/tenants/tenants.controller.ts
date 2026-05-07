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
import { CognitoJwtGuard } from '../auth/guards/cognito-jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CognitoUser } from '../auth/interfaces/cognito-user.interface';

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
    const status = await this.tenantsService.getOnboardingStatus(user.id!);

    return {
      code: 200,
      message: 'Onboarding status retrieved successfully',
      data: status,
    };
  }

  @Post()
  async create(@Body() dto: CreateTenantDto, @CurrentUser() user: CognitoUser) {
    console.log('from user:', user);
    const tenant = await this.tenantsService.create(dto, user.id!);

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
