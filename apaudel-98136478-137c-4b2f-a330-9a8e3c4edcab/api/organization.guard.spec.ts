import { ForbiddenException } from '@nestjs/common';
import { OrganizationGuard } from './src/app/guards/organization.guard';

describe('OrganizationGuard', () => {
  const taskRepository = {
    findOne: jest.fn(),
  };

  const organizationRepository = {
    findOne: jest.fn(),
  };

  const guard = new OrganizationGuard(taskRepository as any, organizationRepository as any);

  const createExecutionContext = (user: any, params: any = {}, body: any = {}) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user, params, body }),
      }),
    } as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should allow Owner to access child organization on create', async () => {
    organizationRepository.findOne.mockImplementation(async ({ where: { id } }: any) => {
      if (id === 1) return { id: 1, parentOrganizationId: null };
      if (id === 2) return { id: 2, parentOrganizationId: 1 };
      return null;
    });

    const canActivate = await guard.canActivate(
      createExecutionContext(
        { id: 1, organizationId: 1, role: { name: 'Owner' } },
        {},
        { organizationId: 2 },
      ),
    );

    expect(canActivate).toBe(true);
  });

  it('should deny Admin access to another organization', async () => {
    await expect(
      guard.canActivate(
        createExecutionContext(
          { id: 2, organizationId: 1, role: { name: 'Admin' } },
          {},
          { organizationId: 2 },
        ),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('should deny access when task is not found', async () => {
    taskRepository.findOne.mockResolvedValue(null);

    await expect(
      guard.canActivate(
        createExecutionContext({ id: 1, organizationId: 1, role: { name: 'Owner' } }, { id: '99' }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
