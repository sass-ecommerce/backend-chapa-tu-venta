import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'auth_credentials', schema: 'b2b' })
export class AuthCredential {
  @PrimaryGeneratedColumn('identity', { type: 'bigint' })
  id: string;

  @Column('bigint', { name: 'user_id', unique: true })
  userId: string;

  @Column('varchar', { unique: true })
  email: string;

  @Column('varchar', { name: 'password_hash' })
  passwordHash: string;

  @Column('boolean', { name: 'is_verified', default: false })
  isVerified: boolean;

  @Column('varchar', { name: 'verification_token', nullable: true })
  verificationToken: string;

  @Column('timestamptz', { name: 'last_login', nullable: true })
  lastLogin: Date;

  @Column('timestamptz', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @Column('timestamptz', { name: 'updated_at', nullable: true })
  updatedAt: Date;

  // Relations
  @OneToOne(() => User, (user) => user.credential)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
