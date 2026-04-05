import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'users', schema: 'public' })
export class User {
  // The primary key is the Cognito sub (UUID provided by AWS, not auto-generated)
  @PrimaryColumn('uuid')
  id: string;

  // Uniqueness enforced by partial index in migration: WHERE deleted_at IS NULL
  @Column('varchar', { length: 255, nullable: false })
  email: string;

  @Column('varchar', { name: 'first_name', length: 100, nullable: true })
  firstName: string | null;

  @Column('varchar', { name: 'last_name', length: 100, nullable: true })
  lastName: string | null;

  @Column('boolean', { name: 'is_active', default: true })
  isActive: boolean;

  @Column('timestamptz', { name: 'created_at', default: () => 'NOW()' })
  createdAt: Date;

  @Column('timestamptz', { name: 'updated_at', default: () => 'NOW()' })
  updatedAt: Date;

  @Column('timestamptz', { name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}
