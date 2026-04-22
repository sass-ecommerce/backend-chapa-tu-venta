import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity';
import { Role } from './entities/role.entity';
import { TenantUser } from './entities/tenant-user.entity';
import { User } from '../users/entities/user.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import {
  TenantAdminRoleNotFoundException,
  TenantDomainAlreadyExistsException,
  TenantOwnerNotFoundException,
} from './exceptions/tenant.exceptions';

export interface OnboardingStatus {
  createTenant: {
    completed: boolean;
    tenant: Pick<Tenant, 'id' | 'name' | 'domain' | 'createdAt'> | null;
  };
}

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(TenantUser)
    private readonly tenantUserRepository: Repository<TenantUser>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(dto: CreateTenantDto, cognitoSub: string): Promise<Tenant> {
    const existing = await this.tenantRepository.findOne({
      where: { domain: dto.domain, deletedAt: IsNull() },
    });
    if (existing) throw new TenantDomainAlreadyExistsException(dto.domain);

    const user = await this.userRepository.findOne({
      where: { id: cognitoSub },
    });
    if (!user) throw new TenantOwnerNotFoundException(cognitoSub);

    const adminRole = await this.roleRepository.findOne({
      where: { name: 'ADMINISTRADOR', deletedAt: IsNull() },
    });
    if (!adminRole) throw new TenantAdminRoleNotFoundException();

    const tenant = await this.tenantRepository.save(
      this.tenantRepository.create(dto),
    );

    await this.tenantUserRepository.save(
      this.tenantUserRepository.create({
        tenantId: tenant.id,
        userId: user.id,
        roleId: adminRole.id,
      }),
    );

    this.logger.log(`Tenant created: ${tenant.id} by user: ${user.id}`);
    return tenant;
  }

  async getOnboardingStatus(cognitoSub: string): Promise<OnboardingStatus> {
    const tenantUser = await this.tenantUserRepository.findOne({
      where: { userId: cognitoSub, deletedAt: IsNull() },
      relations: ['tenant'],
    });

    const tenant = tenantUser?.tenant ?? null;

    return {
      createTenant: {
        completed: !!tenant,
        tenant: tenant
          ? {
              id: tenant.id,
              name: tenant.name,
              domain: tenant.domain,
              createdAt: tenant.createdAt,
            }
          : null,
      },
    };
  }
}
