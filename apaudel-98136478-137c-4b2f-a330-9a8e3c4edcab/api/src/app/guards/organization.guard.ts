import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Task } from '../entities/task.entity';
import { Organization } from '../entities/organization.entity';

@Injectable()
export class OrganizationGuard implements CanActivate {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as User;
    const taskId = request.params.id;

    if (!taskId) {
      // For POST requests (creating tasks), check body
      const organizationId = request.body?.organizationId;
      if (organizationId) {
        return this.checkOrganizationAccess(user, organizationId);
      }
      return true;
    }

    // For GET, PUT, DELETE requests, check if user can access the task
    const task = await this.taskRepository.findOne({
      where: { id: parseInt(taskId) },
      relations: ['organization'],
    });

    if (!task) {
      throw new ForbiddenException('Task not found');
    }

    return this.checkOrganizationAccess(user, task.organizationId);
  }

  private async checkOrganizationAccess(user: User, targetOrgId: number): Promise<boolean> {
    // Owner can access everything in their org and child orgs
    if (user.role.name === 'Owner') {
      const userOrg = await this.organizationRepository.findOne({
        where: { id: user.organizationId },
      });

      // Check if targetOrg is same as user's org or a child org
      const targetOrg = await this.organizationRepository.findOne({
        where: { id: targetOrgId },
      });

      if (!targetOrg) {
        throw new ForbiddenException('Organization not found');
      }

      // Allow if same org or if target org's parent is user's org
      if (
        targetOrgId === user.organizationId ||
        targetOrg.parentOrganizationId === user.organizationId
      ) {
        return true;
      }

      throw new ForbiddenException('Access denied to this organization');
    }

    // Admin and Viewer can only access their own organization
    if (targetOrgId !== user.organizationId) {
      throw new ForbiddenException('Access denied to this organization');
    }

    return true;
  }
}