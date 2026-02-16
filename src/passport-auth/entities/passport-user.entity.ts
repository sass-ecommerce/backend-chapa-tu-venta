import {
  Column,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AuthCredential } from './auth-credential.entity';
import { RefreshToken } from './refresh-token.entity';

@Entity({ name: 'passport_users', schema: 'b2b' })
export class PassportUser {
  @PrimaryGeneratedColumn('identity', { type: 'bigint' })
  id: string;

  @Column('uuid', { unique: true, default: () => 'gen_random_uuid()' })
  slug: string;

  @Column('varchar', { name: 'first_name' })
  firstName: string;

  @Column('varchar', { name: 'last_name' })
  lastName: string;

  @Column('varchar', { unique: true })
  email: string;

  @Column('text', { name: 'image_url', nullable: true })
  imageUrl: string;

  @Column('boolean', { name: 'is_active', default: true })
  isActive: boolean;

  @Column('varchar', { default: 'user' })
  role: string;

  @Column('timestamptz', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @Column('timestamptz', { name: 'updated_at', nullable: true })
  updatedAt: Date;

  // Relations
  @OneToOne(() => AuthCredential, (credential) => credential.user)
  credential: AuthCredential;

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens: RefreshToken[];
}
