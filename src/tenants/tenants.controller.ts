import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { FindByDomainDto } from './dto/find-by-domain.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { Tenant } from './entities/tenant.entity';
import { TenantNotAssignedException } from './exceptions/tenant.exceptions';
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
        name: tenant.name,
        logoUrl: tenant.logoUrl ?? null,
      },
    };
  }

  @Get('me')
  async findMine(@CurrentUser() user: CognitoUser) {
    const tenant = await this.tenantsService.findMine(this.requireTenant(user));

    return {
      code: 200,
      message: 'Tenant retrieved successfully',
      data: this.toMyTenant(tenant),
    };
  }

  @Patch('me')
  async updateMine(
    @Body() dto: UpdateTenantDto,
    @CurrentUser() user: CognitoUser,
  ) {
    const tenant = await this.tenantsService.update(
      this.requireTenant(user),
      dto,
    );

    return {
      code: 200,
      message: 'Tenant updated successfully',
      data: this.toMyTenant(tenant),
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

  private requireTenant(user: CognitoUser): string {
    if (!user.tenantId) throw new TenantNotAssignedException();
    return user.tenantId;
  }

  private toMyTenant(tenant: Tenant) {
    return {
      id: tenant.id,
      name: tenant.name,
      domain: tenant.domain,
      logoUrl: tenant.logoUrl,
    };
  }
}
