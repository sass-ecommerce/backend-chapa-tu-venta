import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { FindByDomainDto } from './dto/find-by-domain.dto';
import { CognitoJwtGuard } from '../auth/guards/cognito-jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CognitoUser } from '../auth/interfaces/cognito-user.interface';
import { Public } from '../auth/decorators/public.decorator';

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

  @Public()
  @Get('by-domain')
  async findByDomain(@Query() query: FindByDomainDto) {
    const tenant = await this.tenantsService.findByDomain(query.domain);

    return {
      code: 200,
      message: 'Tenant retrieved successfully',
      data: {
        tenantId: tenant.id,
      },
    };
  }

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
