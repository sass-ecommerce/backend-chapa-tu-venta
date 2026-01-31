import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'products' })
export class Product {
  @PrimaryGeneratedColumn('identity', { type: 'bigint', name: 'id' })
  id: string;

  @Column({ type: 'uuid', default: () => 'gen_random_uuid()' })
  slug: string;

  @Column('bigint', { name: 'store_id', nullable: true })
  storeId: number;

  @Column('varchar', { name: 'category_id', nullable: true })
  categoryId: string;

  @Column('varchar', { nullable: true })
  sku: string;

  @Column('varchar', { nullable: true })
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('double precision', { nullable: true })
  price: number;

  @Column('bigint', { name: 'stock_quantity', nullable: true })
  stockQuantity: number;

  @Column('boolean', { name: 'is_active', default: true })
  isActive: boolean;

  @Column('timestamptz', { name: 'created_at', default: () => 'now()' })
  createdAt: Date;

  @Column('double precision', { name: 'price_list', nullable: true })
  priceList: number;

  @Column('text', { name: 'image_uri', nullable: true })
  imageUri: string;

  @Column('boolean', { default: false })
  trending: boolean;

  @Column('real', { nullable: true })
  rating: number;

  //   @ManyToOne(() => Store, { nullable: true, onDelete: 'SET NULL' })
  // @JoinColumn({ name: 'store_id', referencedColumnName: 'id' })
  // store: Store;
}
