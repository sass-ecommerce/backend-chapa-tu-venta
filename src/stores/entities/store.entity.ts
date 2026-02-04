import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'stores', schema: 'b2b' })
export class Store {
  @PrimaryGeneratedColumn('identity', { type: 'bigint' })
  id: number;

  @Column('varchar', { nullable: false })
  name: string;

  @Column('uuid', {
    nullable: true,
    default: () => 'gen_random_uuid()',
    unique: true,
  })
  slug: string;

  @Column('varchar', { name: 'owner_email', nullable: true })
  ownerEmail: string;

  @Column('varchar', { nullable: true })
  plan: string;

  @Column('jsonb', { nullable: true })
  settings: Record<string, any>;

  @Column('boolean', { nullable: true, default: true })
  status: boolean;

  @Column('bigint', { nullable: true })
  ruc: number;

  @Column('timestamptz', { name: 'created_at', default: () => 'now()' })
  createdAt: Date;

  @Column('timestamptz', {
    name: 'updated_at',
    nullable: true,
    default: () => 'now()',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  // Relations
  @OneToMany(() => Product, (product) => product.store)
  products: Product[];

  @OneToMany(() => User, (user) => user.store)
  users: User[];
}
