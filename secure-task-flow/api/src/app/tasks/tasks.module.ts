import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task } from '../entities/task.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { Organization } from '../entities/organization.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Task, AuditLog, Organization])],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}