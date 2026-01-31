import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Organization } from './organization.entity';
import { TaskStatus, TaskCategory } from '@apaudel-98136478-137c-4b2f-a330-9a8e3c4edcab/data';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'text',
    default: TaskStatus.TODO,
  })
  status: TaskStatus;

  @Column({
    type: 'text',
    default: TaskCategory.PERSONAL,
  })
  category: TaskCategory;

  @Column()
  createdById: number;

  @Column()
  organizationId: number;

  @ManyToOne(() => User, (user) => user.tasks)
  createdBy: User;

  @ManyToOne(() => Organization, (org) => org.tasks)
  organization: Organization;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}