import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from './product.entity';

// Uniqueness on (product_id, sku) WHERE deleted_at IS NULL is enforced
// by the partial index in the migration, not by a TypeORM @Unique decorator.
@Entity({ name: 'product_variants', schema: 'public' })
export class ProductVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'product_id', nullable: false })
  productId: string;

  @Column('varchar', { length: 100, nullable: false })
  sku: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: false })
  price: number;

  @Column('int', { default: 0 })
  stock: number;

  @Column('jsonb', { nullable: false, default: '{}' })
  attributes: Record<string, any>;

  @Column('timestamptz', { name: 'created_at', default: () => 'NOW()' })
  createdAt: Date;

  @Column('timestamptz', { name: 'updated_at', nullable: true })
  updatedAt: Date | null;

  @Column('timestamptz', { name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => Product, (product) => product.variants, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
