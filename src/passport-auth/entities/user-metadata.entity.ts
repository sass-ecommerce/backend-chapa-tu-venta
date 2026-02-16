import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'user_metadata', schema: 'b2b' })
export class UserMetadata {
  @PrimaryGeneratedColumn('identity', { type: 'bigint' })
  id: string;

  @Column('bigint', { name: 'user_id', unique: true })
  userId: string;

  @Column('jsonb', { name: 'public_metadata', default: {} })
  publicMetadata: Record<string, any>;

  @Column('jsonb', { name: 'private_metadata', default: {} })
  privateMetadata: Record<string, any>;

  @Column('jsonb', { name: 'unsafe_metadata', default: {} })
  unsafeMetadata: Record<string, any>;

  @Column('timestamptz', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @Column('timestamptz', { name: 'updated_at', nullable: true })
  updatedAt: Date;

  // Relations
  @OneToOne(() => User, (user) => user.metadata)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
