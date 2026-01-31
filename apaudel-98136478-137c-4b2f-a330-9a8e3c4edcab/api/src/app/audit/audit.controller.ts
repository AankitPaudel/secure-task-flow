import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../guards/roles.decorator';
import { Permission, UserRole } from '@apaudel-98136478-137c-4b2f-a330-9a8e3c4edcab/data';
import { Permissions } from '../guards/permissions.decorator';
import { PermissionsGuard } from '../guards/permissions.guard';

@Controller('audit-log')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Permissions(Permission.VIEW_AUDIT)
  findAll(@Request() req) {
    return this.auditService.findAll(req.user);
  }
}
