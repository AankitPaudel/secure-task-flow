import { Reflector } from '@nestjs/core';
import { ForbiddenException } from '@nestjs/common';
import { RolesGuard } from './src/app/guards/roles.guard';
import { UserRole } from '@secure-task-flow/data';

describe('RolesGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;

  const guard = new RolesGuard(reflector);

  const createExecutionContext = (user: any = null) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any);

  it('should allow access when no roles metadata is defined', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);

    const canActivate = guard.canActivate(createExecutionContext());

    expect(canActivate).toBe(true);
  });

  it('should throw ForbiddenException when user has no role', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([UserRole.OWNER]);

    expect(() => guard.canActivate(createExecutionContext({ id: 1 }))).toThrow(ForbiddenException);
  });

  it('should allow access when user has required role', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([UserRole.OWNER, UserRole.ADMIN]);

    const canActivate = guard.canActivate(
      createExecutionContext({
        id: 1,
        role: { name: UserRole.ADMIN },
      }),
    );

    expect(canActivate).toBe(true);
  });

  it('should allow access when user has higher role (inheritance)', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([UserRole.VIEWER]);

    const canActivate = guard.canActivate(
      createExecutionContext({
        id: 1,
        role: { name: UserRole.ADMIN },
      }),
    );

    expect(canActivate).toBe(true);
  });

  it('should throw ForbiddenException when user lacks required role', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([UserRole.OWNER]);

    expect(() =>
      guard.canActivate(
        createExecutionContext({
          id: 1,
          role: { name: UserRole.VIEWER },
        }),
      ),
    ).toThrow(ForbiddenException);
  });
});
