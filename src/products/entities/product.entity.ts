import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Store } from '../../stores/entities/store.entity';

@Entity({ name: 'products', schema: 'b2b' })
export class Product {
  @PrimaryGeneratedColumn('identity', { type: 'bigint' })
  id: string;

  @Column('uuid', {
    nullable: true,
    default: () => 'gen_random_uuid()',
  })
  slug: string;

  @Column('bigint', { name: 'store_id', nullable: true })
  storeId: number;

  @Column('varchar', { nullable: true, unique: true })
  sku: string;

  @Column('varchar', { nullable: true })
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('double precision', { nullable: true })
  price: number;

  @Column('bigint', { name: 'stock_quantity', nullable: true })
  stockQuantity: number;

  @Column('boolean', { name: 'is_active', nullable: true, default: true })
  isActive: boolean;

  @Column('double precision', { name: 'price_list', nullable: true })
  priceList: number;

  @Column('text', { name: 'image_uri', nullable: true })
  imageUri: string;

  @Column('boolean', { nullable: true, default: false })
  trending: boolean;

  @Column('boolean', { nullable: true, default: true })
  status: boolean;

  @Column('timestamptz', { name: 'created_at', default: () => 'now()' })
  createdAt: Date;

  @Column('timestamptz', { name: 'updated_at', nullable: true })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Store, (store) => store.products, { nullable: true })
  @JoinColumn({ name: 'store_id' })
  store: Store;
}
