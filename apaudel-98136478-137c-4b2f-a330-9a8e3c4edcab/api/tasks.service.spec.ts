import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TasksService } from './src/app/tasks/tasks.service';
import { Task } from './src/app/entities/task.entity';
import { AuditLog } from './src/app/entities/audit-log.entity';
import { Organization } from './src/app/entities/organization.entity';
import { User } from './src/app/entities/user.entity';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AuditAction } from '@apaudel-98136478-137c-4b2f-a330-9a8e3c4edcab/data';

type MockRepo<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

function createRepositoryMock<T>(): MockRepo<T> {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
}

describe('TasksService', () => {
  let service: TasksService;
  let taskRepository: MockRepo<Task>;
  let auditRepository: MockRepo<AuditLog>;
  let orgRepository: MockRepo<Organization>;

  const ownerUser: Partial<User> = {
    id: 1,
    organizationId: 1,
    role: { name: 'Owner' } as any,
  };

  const viewerUser: Partial<User> = {
    id: 2,
    organizationId: 1,
    role: { name: 'Viewer' } as any,
  };

  beforeEach(async () => {
    taskRepository = createRepositoryMock<Task>();
    auditRepository = createRepositoryMock<AuditLog>();
    orgRepository = createRepositoryMock<Organization>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getRepositoryToken(Task), useValue: taskRepository },
        { provide: getRepositoryToken(AuditLog), useValue: auditRepository },
        { provide: getRepositoryToken(Organization), useValue: orgRepository },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  describe('findAll', () => {
    it('should include tasks from child orgs for Owner', async () => {
      // owner org = 1, child org = 2
      (orgRepository.find as jest.Mock).mockResolvedValue([{ id: 2, parentOrganizationId: 1 }]);

      const qb: any = {
        where: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ id: 1, organizationId: 1 }, { id: 2, organizationId: 2 }]),
      };

      (taskRepository.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      const result = await service.findAll(ownerUser as User);

      expect(orgRepository.find).toHaveBeenCalledWith({
        where: { parentOrganizationId: 1 },
      });
      expect(taskRepository.createQueryBuilder).toHaveBeenCalledWith('task');
      // We expect two tasks back, one from parent and one from child org
      expect(result).toHaveLength(2);
      expect(auditRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: ownerUser.id,
          action: AuditAction.VIEW,
          resource: 'Task',
        }),
      );
    });

    it('should restrict Admin/Viewer to their own org', async () => {
      (taskRepository.find as jest.Mock).mockResolvedValue([{ id: 3, organizationId: 1 }]);

      const adminUser: Partial<User> = {
        id: 3,
        organizationId: 1,
        role: { name: 'Admin' } as any,
      };

      const result = await service.findAll(adminUser as User);

      expect(taskRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: 1 },
        }),
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('create', () => {
    it('should forbid Viewer from creating tasks', async () => {
      await expect(
        service.create(
          { title: 'x', status: 'todo', category: 'Work', organizationId: 1 },
          viewerUser as User,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should throw NotFoundException when task does not exist', async () => {
      (taskRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.update(999, { title: 'x' }, ownerUser as User)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should forbid Viewer from updating', async () => {
      (taskRepository.findOne as jest.Mock).mockResolvedValue({ id: 1 });

      await expect(service.update(1, { title: 'x' }, viewerUser as User)).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException when task does not exist', async () => {
      (taskRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.remove(999, ownerUser as User)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should forbid Viewer from deleting', async () => {
      (taskRepository.findOne as jest.Mock).mockResolvedValue({ id: 1 });

      await expect(service.remove(1, viewerUser as User)).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
}
