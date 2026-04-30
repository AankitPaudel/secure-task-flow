import { Reflector } from '@nestjs/core';
import { ForbiddenException } from '@nestjs/common';
import { PermissionsGuard } from './src/app/guards/permissions.guard';
import { Permission } from '@secure-task-flow/data';

describe('PermissionsGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;

  const guard = new PermissionsGuard(reflector);

  const createExecutionContext = (user: any = null) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any);

  it('should allow access when no permissions metadata is defined', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);

    const canActivate = guard.canActivate(createExecutionContext());

    expect(canActivate).toBe(true);
  });

  it('should throw ForbiddenException when user has no role', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([Permission.CREATE]);

    expect(() => guard.canActivate(createExecutionContext({ id: 1 }))).toThrow(ForbiddenException);
  });

  it('should allow access when user has required permission', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([Permission.READ]);

    const canActivate = guard.canActivate(
      createExecutionContext({
        id: 1,
        role: { name: 'Viewer', permissions: [Permission.READ] },
      }),
    );

    expect(canActivate).toBe(true);
  });

  it('should throw ForbiddenException when user lacks required permission', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([Permission.DELETE]);

    expect(() =>
      guard.canActivate(
        createExecutionContext({
          id: 1,
          role: { name: 'Viewer', permissions: [Permission.READ] },
        }),
      ),
    ).toThrow(ForbiddenException);
  });
});
