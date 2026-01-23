import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid', { name: 'id_internal' })
  idInternal: string;

  @Column('varchar', { unique: true, name: 'clerk_id', nullable: false })
  clerkId: string;

  @Column('varchar', { name: 'first_name', nullable: true })
  firstName: string;

  @Column('varchar', { name: 'last_name', nullable: true })
  lastName: string;

  @Column('varchar', { unique: true, nullable: false })
  email: string;

  @Column('text', { name: 'image_url', nullable: true, default: '' })
  imageUrl: string;

  @Column('boolean', { default: true })
  isActive: boolean;

  @Column('varchar', { default: 'user' })
  role: string;

  @Column('timestamp', {
    default: () => 'CURRENT_TIMESTAMP',
    name: 'create_at',
  })
  createAt: Date;

  @Column('timestamp', {
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
    name: 'update_at',
  })
  updateAt: Date;
}
