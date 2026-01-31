// User Roles
export enum UserRole {
  OWNER = 'Owner',
  ADMIN = 'Admin',
  VIEWER = 'Viewer',
}

// Permissions
export enum Permission {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE_USERS = 'manage_users',
  VIEW_AUDIT = 'view_audit',
}

// Task Status
export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in-progress',
  DONE = 'done',
}

// Task Category
export enum TaskCategory {
  WORK = 'Work',
  PERSONAL = 'Personal',
}

// Audit Action
export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  VIEW = 'VIEW',
}

// DTOs
export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  roleId: number;
  organizationId: number;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  status: TaskStatus;
  category: TaskCategory;
  organizationId: number;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  category?: TaskCategory;
}

export interface JwtPayload {
  sub: number;
  email: string;
  roleId: number;
  organizationId: number;
}
