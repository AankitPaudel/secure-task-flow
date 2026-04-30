import { Permission, UserRole } from '@secure-task-flow/data';
import { canMutateTasks, canViewAuditLog, getRolePermissions, hasPermission } from './auth';

describe('auth', () => {
  it('maps role permissions for task and audit access', () => {
    expect(getRolePermissions(UserRole.OWNER)).toContain(Permission.MANAGE_USERS);
    expect(canMutateTasks(UserRole.ADMIN)).toBe(true);
    expect(canMutateTasks(UserRole.VIEWER)).toBe(false);
    expect(canViewAuditLog(UserRole.ADMIN)).toBe(true);
    expect(hasPermission(UserRole.VIEWER, Permission.DELETE)).toBe(false);
  });
});
