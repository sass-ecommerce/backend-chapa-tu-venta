import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity';
import { Role } from './entities/role.entity';
import { TenantUser } from './entities/tenant-user.entity';
import { User } from '../users/entities/user.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import {
  TenantAdminRoleNotFoundException,
  TenantDomainAlreadyExistsException,
  TenantInvalidLogoKeyException,
  TenantNotFoundException,
  TenantOwnerNotFoundException,
} from './exceptions/tenant.exceptions';
import { DynamoService } from '../users/dynamo.service';
import { CognitoAdminService } from '../auth/cognito-admin.service';
import { CacheService } from '../common/helpers/cache.service';
import { S3Service } from '../storage/s3.service';
import { StorageFolder } from '../storage/dto/presigned-upload.dto';

export interface OnboardingStatus {
  createTenant: {
    completed: boolean;
    tenant: Pick<Tenant, 'id' | 'name' | 'domain' | 'createdAt'> | null;
  };
}

const TENANTS_CACHE_RESOURCE = 'tenants';
const TENANT_BY_DOMAIN_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

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
    private readonly dynamoService: DynamoService,
    private readonly cognitoAdminService: CognitoAdminService,
    private readonly cacheService: CacheService,
    private readonly s3Service: S3Service,
  ) {}

  async create(dto: CreateTenantDto, userId: string): Promise<Tenant> {
    console.log('Creating tenant with data:', dto, 'for user:', userId);

    const existing = await this.tenantRepository.findOne({
      where: { domain: dto.domain, deletedAt: IsNull() },
    });
    if (existing) throw new TenantDomainAlreadyExistsException(dto.domain);

    const user = await this.userRepository.findOne({
      where: { id: userId, deletedAt: IsNull() },
    });
    if (!user) throw new TenantOwnerNotFoundException(userId);

    const adminRole = await this.roleRepository.findOne({
      where: { name: 'ADMINISTRADOR', deletedAt: IsNull() },
    });
    if (!adminRole) throw new TenantAdminRoleNotFoundException();

    const tenant = await this.tenantRepository.save(
      this.tenantRepository.create(dto),
    );

    const tenantUser = await this.tenantUserRepository.save(
      this.tenantUserRepository.create({
        tenantId: tenant.id,
        userId: user.id,
        roleId: adminRole.id,
      }),
    );

    await this.dynamoService.addTenantToUser(userId, user.sub!, {
      tenantId: tenant.id,
      tenantName: tenant.name,
      tenantDomain: tenant.domain,
      role: adminRole.name,
      isActive: true,
      pgTenantUserId: tenantUser.id,
    });

    await this.cognitoAdminService.setTenantId(user.sub!, tenant.id);

    this.logger.log(`Tenant created: ${tenant.id} by user: ${user.id}`);
    return tenant;
  }

  async findMine(tenantId: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId, deletedAt: IsNull() },
    });
    if (!tenant) throw new TenantNotFoundException(tenantId);
    return tenant;
  }

  async update(tenantId: string, dto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.findMine(tenantId);

    if ('logoKey' in dto) {
      const logoKey = dto.logoKey ?? null;
      // La key debe venir de un presigned-upload de esta misma tienda; si no,
      // se podría apuntar el logo a un archivo de otro tenant.
      if (
        logoKey &&
        !logoKey.startsWith(`${tenantId}/${StorageFolder.STORES}/`)
      ) {
        throw new TenantInvalidLogoKeyException(logoKey);
      }
      tenant.logoKey = logoKey;
      tenant.logoUrl = logoKey ? this.s3Service.buildViewUrl(logoKey) : null;
    }

    tenant.updatedAt = new Date();
    const saved = await this.tenantRepository.save(tenant);

    // findByDomain cachea la entidad 24h: sin esto el logo nuevo no se ve.
    await this.cacheService.delete(this.byDomainCacheKey(saved.domain));

    this.logger.log(`Tenant updated: ${tenantId}`);
    return saved;
  }

  private byDomainCacheKey(domain: string): string {
    return `${TENANTS_CACHE_RESOURCE}:by-domain:${domain}`;
  }

  async findByDomain(domain: string): Promise<Tenant> {
    const cacheKey = this.byDomainCacheKey(domain);
    const cached = await this.cacheService.get<Tenant>(cacheKey);
    if (cached) return cached;

    const tenant = await this.tenantRepository.findOne({
      where: { domain, deletedAt: IsNull() },
    });
    if (!tenant) throw new TenantNotFoundException(domain);

    await this.cacheService.set(
      cacheKey,
      tenant,
      TENANT_BY_DOMAIN_CACHE_TTL_MS,
    );
    return tenant;
  }

  async getOnboardingStatus(userId: string): Promise<OnboardingStatus> {
    const tenantUser = await this.tenantUserRepository.findOne({
      where: { userId: userId, deletedAt: IsNull() },
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
