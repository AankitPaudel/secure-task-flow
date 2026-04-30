import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Role } from './role.entity';
import { Organization } from './organization.entity';
import { Task } from './task.entity';
import { AuditLog } from './audit-log.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column()
  roleId: number;

  @Column()
  organizationId: number;

  @ManyToOne(() => Role, (role) => role.users)
  role: Role;

  @ManyToOne(() => Organization, (org) => org.users)
  organization: Organization;

  @OneToMany(() => Task, (task) => task.createdBy)
  tasks: Task[];

  @OneToMany(() => AuditLog, (log) => log.user)
  auditLogs: AuditLog[];
}