import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { AuditAction } from '@secure-task-flow/data';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({
    type: 'text',
  })
  action: AuditAction;

  @Column()
  resource: string;

  @Column()
  resourceId: number;

  @CreateDateColumn()
  timestamp: Date;

  @ManyToOne(() => User, (user) => user.auditLogs)
  user: User;
}