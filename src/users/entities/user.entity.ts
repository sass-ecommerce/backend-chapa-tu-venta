import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Store } from '../../stores/entities/store.entity';
import { UserMetadata } from '../../auth/entities/user-metadata.entity';
import { AuthCredential } from 'src/auth/entities/auth-credential.entity';
import { RefreshToken } from 'src/auth/entities/refresh-token.entity';
@Entity({ name: 'users', schema: 'b2b' })
export class User {
  @PrimaryGeneratedColumn('identity', { type: 'bigint' })
  id: string;

  @Column('uuid', { unique: true, default: () => 'gen_random_uuid()' })
  slug: string;

  @Column('varchar', { name: 'first_name', nullable: true })
  firstName: string;

  @Column('varchar', { name: 'last_name', nullable: true })
  lastName: string;

  @Column('varchar', { unique: true, nullable: false })
  email: string;

  @Column('text', { name: 'image_url', nullable: true })
  imageUrl: string;

  @Column('boolean', { name: 'is_active', nullable: true, default: true })
  isActive: boolean;

  @Column('varchar', { nullable: true })
  role: string;

  @Column('varchar', { name: 'auth_method', nullable: true })
  authMethod: string;

  @Column('varchar', {
    name: 'auth_provider',
    nullable: true,
    default: 'local',
  })
  authProvider: string;

  @Column('bigint', { name: 'store_id', nullable: true })
  storeId: number;

  @Column('timestamptz', {
    name: 'created_at',
    nullable: true,
    default: () => 'now()',
  })
  createdAt: Date;

  @Column('timestamptz', { name: 'updated_at', nullable: true })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Store, (store) => store.users, { nullable: true })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @OneToOne(() => UserMetadata, (metadata: any) => metadata.user, {
    nullable: true,
  })
  metadata: any;

  @OneToOne(() => AuthCredential, (credential: any) => credential.user, {
    nullable: true,
  })
  credential: any;

  @OneToMany(() => RefreshToken, (token: any) => token.user)
  refreshTokens: any[];
}
