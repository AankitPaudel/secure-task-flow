import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@apaudel-98136478-137c-4b2f-a330-9a8e3c4edcab/data';
import { ROLES_KEY } from './roles.decorator';
import { User } from '../entities/user.entity';

const ROLE_RANK: Record<UserRole, number> = {
  [UserRole.VIEWER]: 1,
  [UserRole.ADMIN]: 2,
  [UserRole.OWNER]: 3,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as User;

    if (!user || !user.role) {
      throw new ForbiddenException('User role not found');
    }

    const userRole = user.role.name as UserRole;
    const userRank = ROLE_RANK[userRole] ?? 0;
    const hasRole = requiredRoles.some((role) => userRank >= (ROLE_RANK[role] ?? 0));

    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
