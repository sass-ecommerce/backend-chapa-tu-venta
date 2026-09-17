import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CollectionProduct } from './collection-product.entity';

@Entity({ name: 'collections', schema: 'public' })
export class Collection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'tenant_id', nullable: false })
  tenantId: string;

  @Column('varchar', { length: 255, nullable: false })
  name: string;

  @Column('varchar', { name: 'cover_image_key', length: 500, nullable: true })
  coverImageKey: string | null;

  @Column('timestamptz', { name: 'created_at', default: () => 'NOW()' })
  createdAt: Date;

  @Column('timestamptz', { name: 'updated_at', nullable: true })
  updatedAt: Date | null;

  @Column('timestamptz', { name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => CollectionProduct, (cp) => cp.collection)
  collectionProducts: CollectionProduct[];
}
