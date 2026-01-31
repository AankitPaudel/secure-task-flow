import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async findAll(user: User): Promise<AuditLog[]> {
    // Only Owner and Admin can view audit logs
    if (user.role.name === 'Viewer') {
      return [];
    }

    // Owner can see logs from their org and child orgs
    // Admin can see logs from their org only
    const logs = await this.auditLogRepository.find({
      relations: ['user', 'user.organization'],
      order: { timestamp: 'DESC' },
      take: 100, // Limit to last 100 logs
    });

    // Filter based on organization
    return logs.filter((log) => {
      if (user.role.name === 'Owner') {
        // Owner can see their org and child orgs
        return log.user.organizationId === user.organizationId || 
               log.user.organization?.parentOrganizationId === user.organizationId;
      }
      // Admin sees only their org
      return log.user.organizationId === user.organizationId;
    });
  }
}