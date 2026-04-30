import { Permission, UserRole } from '@secure-task-flow/data';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.OWNER]: [
    Permission.CREATE,
    Permission.READ,
    Permission.UPDATE,
    Permission.DELETE,
    Permission.MANAGE_USERS,
    Permission.VIEW_AUDIT,
  ],
  [UserRole.ADMIN]: [
    Permission.CREATE,
    Permission.READ,
    Permission.UPDATE,
    Permission.DELETE,
    Permission.VIEW_AUDIT,
  ],
  [UserRole.VIEWER]: [Permission.READ],
};

export function getRolePermissions(role: UserRole | string | undefined): Permission[] {
  if (!role || !(role in ROLE_PERMISSIONS)) {
    return [];
  }

  return ROLE_PERMISSIONS[role as UserRole];
}

export function hasPermission(role: UserRole | string | undefined, permission: Permission): boolean {
  return getRolePermissions(role).includes(permission);
}

export function canMutateTasks(role: UserRole | string | undefined): boolean {
  return hasPermission(role, Permission.CREATE) && hasPermission(role, Permission.UPDATE);
}

export function canViewAuditLog(role: UserRole | string | undefined): boolean {
  return hasPermission(role, Permission.VIEW_AUDIT);
}
