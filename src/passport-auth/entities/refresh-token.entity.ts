import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PassportUser } from './passport-user.entity';

@Entity({ name: 'refresh_tokens', schema: 'b2b' })
export class RefreshToken {
  @PrimaryGeneratedColumn('identity', { type: 'bigint' })
  id: string;

  @Column('varchar', { name: 'token_hash', unique: true })
  tokenHash: string;

  @Column('bigint', { name: 'user_id' })
  userId: string;

  @Column('timestamptz', { name: 'expires_at' })
  expiresAt: Date;

  @Column('boolean', { name: 'is_revoked', default: false })
  isRevoked: boolean;

  @Column('varchar', { name: 'revocation_reason', nullable: true })
  revocationReason: string;

  @Column('timestamptz', { name: 'revoked_at', nullable: true })
  revokedAt: Date;

  @Column('uuid', { name: 'token_family', default: () => 'gen_random_uuid()' })
  tokenFamily: string;

  @Column('varchar', { name: 'replaced_by_token', nullable: true })
  replacedByToken: string;

  @Column('varchar', { name: 'ip_address', nullable: true })
  ipAddress: string;

  @Column('varchar', { name: 'user_agent', nullable: true })
  userAgent: string;

  @Column('varchar', { name: 'device_fingerprint', nullable: true })
  deviceFingerprint: string;

  @Column('timestamptz', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  // Relations
  @ManyToOne(() => PassportUser, (user) => user.refreshTokens)
  @JoinColumn({ name: 'user_id' })
  user: PassportUser;
}
