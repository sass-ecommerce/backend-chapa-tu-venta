import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'otp_verifications', schema: 'b2b' })
export class OtpVerification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('bigint', { name: 'user_id' })
  userId: string;

  @Column('varchar', { name: 'otp_hash' })
  otpHash: string;

  @Column('timestamptz', { name: 'expires_at' })
  expiresAt: Date;

  @Column('int', { default: 0 })
  attempts: number;

  @Column('boolean', { name: 'is_verified', default: false })
  isVerified: boolean;

  @Column('boolean', { name: 'is_used', default: false })
  isUsed: boolean;

  @Column('varchar', { name: 'purpose', default: 'email_verification' })
  purpose: 'email_verification' | 'password_reset';

  @Column('varchar', { name: 'ip_address', nullable: true })
  ipAddress: string;

  @Column('text', { name: 'user_agent', nullable: true })
  userAgent: string;

  @Column('timestamptz', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @Column('timestamptz', { name: 'verified_at', nullable: true })
  verifiedAt: Date;

  // Relations
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
