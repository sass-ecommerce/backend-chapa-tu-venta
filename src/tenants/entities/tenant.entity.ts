import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { TenantUser } from './tenant-user.entity';

@Entity({ name: 'tenants', schema: 'public' })
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 255, nullable: false })
  name: string;

  @Column('varchar', { length: 255, nullable: false })
  domain: string;

  @Column('timestamptz', { name: 'created_at', default: () => 'NOW()' })
  createdAt: Date;

  @Column('timestamptz', { name: 'updated_at', nullable: true })
  updatedAt: Date | null;

  @Column('timestamptz', { name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => TenantUser, (tu) => tu.tenant)
  tenantUsers: TenantUser[];
}
