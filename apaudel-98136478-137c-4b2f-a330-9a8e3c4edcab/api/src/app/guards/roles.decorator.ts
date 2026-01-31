import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@apaudel-98136478-137c-4b2f-a330-9a8e3c4edcab/data';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);