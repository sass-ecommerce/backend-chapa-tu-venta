import { Store } from 'src/stores/entities/store.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('identity', { type: 'bigint' })
  id: number;

  @Index('users_slug_key', { unique: true })
  @Column({
    type: 'uuid',
    nullable: true,
    default: () => 'gen_random_uuid()',
  })
  slug: string;

  @Column('varchar', { name: 'external_auth_id', nullable: true })
  externalAuthId: string;

  @Column('varchar', { unique: true, name: 'clerk_id', nullable: false })
  clerkId: string;

  @Column('varchar', { name: 'first_name', nullable: true })
  firstName: string;

  @Column('varchar', { name: 'last_name', nullable: true })
  lastName: string;

  @Column('varchar', { unique: true, nullable: false })
  email: string;

  @Column('text', { name: 'image_url', nullable: true })
  imageUrl: string;

  @Column('boolean', { name: 'is_active', default: true })
  isActive: boolean;

  @Column('varchar', { default: 'user' })
  role: string;

  @Column('varchar', { name: 'auth_method', nullable: true })
  authMethod: string; // oauth_google, oauth_tiktok, password, etc.

  @Column('varchar', { name: 'provider_user_id', nullable: true })
  providerUserId: string; // El ID real de Google o TikTok (ej: 113325539...)

  @Column('bigint', { name: 'store_id', nullable: true })
  storeId: number;

  @Column('timestamp', {
    default: () => 'CURRENT_TIMESTAMP',
    name: 'created_at',
  })
  createdAt: Date;

  @Column('timestamp', {
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
    name: 'updated_at',
  })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Store, { nullable: true })
  @JoinColumn({ name: 'store_id', referencedColumnName: 'id' })
  store: Store;
}
