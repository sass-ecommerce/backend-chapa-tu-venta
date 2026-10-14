import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from './product.entity';
import { ProductVariant } from './product-variant.entity';

@Entity({ name: 'product_variant_images', schema: 'public' })
@Index('uq_product_variant_images_s3_key_active', ['s3Key'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
export class ProductVariantImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'tenant_id', nullable: false })
  tenantId: string;

  @Column('uuid', { name: 'product_id', nullable: false })
  productId: string;

  @Column('uuid', { name: 'variant_id', nullable: false })
  variantId: string;

  @Column('varchar', { name: 's3_key', length: 500, nullable: false })
  s3Key: string;

  @Column('varchar', { name: 'url', length: 1000, nullable: true })
  url: string | null;

  @Column('boolean', { name: 'is_primary', default: false })
  isPrimary: boolean;

  @Column('int', { name: 'sort_order', default: 0 })
  sortOrder: number;

  @Column('timestamptz', { name: 'created_at', default: () => 'NOW()' })
  createdAt: Date;

  @Column('timestamptz', { name: 'updated_at', nullable: true })
  updatedAt: Date | null;

  @Column('timestamptz', { name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => ProductVariant, (variant) => variant.images)
  @JoinColumn({ name: 'variant_id' })
  variant: ProductVariant;
}
