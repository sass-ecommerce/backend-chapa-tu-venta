import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CategoryType } from '../enums/category-type.enum';

@Entity({ name: 'categories', schema: 'public' })
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'tenant_id', nullable: false })
  tenantId: string;

  @Column('uuid', { name: 'parent_id', nullable: true })
  parentId: string | null;

  @Column({ type: 'varchar', length: 20, nullable: false, default: 'BASE' })
  type: CategoryType;

  @Column('varchar', { length: 255, nullable: false })
  name: string;

  @Column('varchar', { length: 255, nullable: false })
  slug: string;

  @Column('timestamptz', { name: 'created_at', default: () => 'NOW()' })
  createdAt: Date;

  @Column('timestamptz', { name: 'updated_at', nullable: true })
  updatedAt: Date | null;

  @Column('timestamptz', { name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => Category, (category) => category.children, {
    nullable: true,
  })
  @JoinColumn({ name: 'parent_id' })
  parent: Category | null;

  @OneToMany(() => Category, (category) => category.parent)
  children: Category[];
}
