import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('stores')
export class Store {
  @PrimaryGeneratedColumn('identity', { type: 'bigint' })
  id: number;

  @Column({ type: 'varchar' })
  name: string;

  @Index('stores_slug_key', { unique: true })
  @Column({
    type: 'uuid',
    nullable: true,
    default: () => 'gen_random_uuid()',
  })
  slug: string;

  @Column({ type: 'varchar', name: 'owner_email', nullable: true })
  ownerEmail: string;

  @Column({ type: 'varchar', nullable: true })
  plan: string;

  @Column({ type: 'jsonb', nullable: true })
  settings: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'bigint', name: 'category_id' })
  categoryId: number;

  @Column({ type: 'boolean', nullable: true, default: () => 'true' })
  status: boolean;
}
