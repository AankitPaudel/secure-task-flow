import { SetMetadata } from '@nestjs/common';
import { Permission } from '@apaudel-98136478-137c-4b2f-a330-9a8e3c4edcab/data';

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
