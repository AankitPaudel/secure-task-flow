import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../entities/task.entity';
import { User } from '../entities/user.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { Organization } from '../entities/organization.entity';
import { CreateTaskDto, UpdateTaskDto, AuditAction } from '@secure-task-flow/data';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
  ) {}

  async create(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
    if (user.role.name === 'Viewer') {
      throw new ForbiddenException('Viewers cannot create tasks');
    }

    const task = this.taskRepository.create({
      ...createTaskDto,
      createdById: user.id,
    });

    const savedTask = await this.taskRepository.save(task);

    // Log the action
    await this.logAction(user.id, AuditAction.CREATE, 'Task', savedTask.id);

    return savedTask;
  }

  async findAll(user: User): Promise<Task[]> {
    const tasks =
      user.role.name === 'Owner'
        ? await this.findTasksForOwner(user)
        : await this.findTasksForSingleOrg(user.organizationId);

    // Log view action
    await this.logAction(user.id, AuditAction.VIEW, 'Task', 0);

    return tasks;
  }

  /**
   * Owners can see tasks from their own organization and any direct child organizations.
   * This keeps the hierarchy simple (2 levels) but still shows how you could extend it later.
   */
  private async findTasksForOwner(user: User): Promise<Task[]> {
    const childOrgs = await this.organizationRepository.find({
      where: { parentOrganizationId: user.organizationId },
    });

    const orgIds = [user.organizationId, ...childOrgs.map((org) => org.id)];

    return this.taskRepository
      .createQueryBuilder('task')
      .where('task.organizationId IN (:...orgIds)', { orgIds })
      .leftJoinAndSelect('task.createdBy', 'createdBy')
      .leftJoinAndSelect('task.organization', 'organization')
      .orderBy('task.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Admins and Viewers are limited to a single organization.
   */
  private async findTasksForSingleOrg(organizationId: number): Promise<Task[]> {
    return this.taskRepository.find({
      where: { organizationId },
      relations: ['createdBy', 'organization'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number, user: User): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['createdBy', 'organization'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    // Log view action
    await this.logAction(user.id, AuditAction.VIEW, 'Task', id);

    return task;
  }

  async update(id: number, updateTaskDto: UpdateTaskDto, user: User): Promise<Task> {
    const task = await this.taskRepository.findOne({ where: { id } });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    // Viewers cannot update
    if (user.role.name === 'Viewer') {
      throw new ForbiddenException('Viewers cannot update tasks');
    }

    Object.assign(task, updateTaskDto);
    const updatedTask = await this.taskRepository.save(task);

    // Log the action
    await this.logAction(user.id, AuditAction.UPDATE, 'Task', id);

    return updatedTask;
  }

  async remove(id: number, user: User): Promise<void> {
    const task = await this.taskRepository.findOne({ where: { id } });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    // Viewers cannot delete
    if (user.role.name === 'Viewer') {
      throw new ForbiddenException('Viewers cannot delete tasks');
    }

    await this.taskRepository.remove(task);

    // Log the action
    await this.logAction(user.id, AuditAction.DELETE, 'Task', id);
  }

  private async logAction(userId: number, action: AuditAction, resource: string, resourceId: number) {
    const log = this.auditLogRepository.create({
      userId,
      action,
      resource,
      resourceId,
    });

    await this.auditLogRepository.save(log);
    console.log(`[AUDIT] User ${userId} performed ${action} on ${resource} ${resourceId}`);
  }
}
