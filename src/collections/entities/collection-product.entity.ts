import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Collection } from './collection.entity';
import { Product } from '../../products/entities/product.entity';

/**
 * Fila de asociación colección↔producto. Sin `updatedAt`/`deletedAt`: la
 * fila representa la asociación en sí (existe o no existe), no una entidad
 * de negocio con historial — quitar un producto de una colección la borra.
 */
@Entity({ name: 'collection_products', schema: 'public' })
export class CollectionProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'tenant_id', nullable: false })
  tenantId: string;

  @Column('uuid', { name: 'collection_id', nullable: false })
  collectionId: string;

  @Column('uuid', { name: 'product_id', nullable: false })
  productId: string;

  @Column('timestamptz', { name: 'created_at', default: () => 'NOW()' })
  createdAt: Date;

  @ManyToOne(() => Collection, (collection) => collection.collectionProducts)
  @JoinColumn({ name: 'collection_id' })
  collection: Collection;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
