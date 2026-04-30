import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TaskCategory, TaskStatus } from '@secure-task-flow/data';
import { TasksController } from './src/app/tasks/tasks.controller';
import { TasksService } from './src/app/tasks/tasks.service';
import { Task } from './src/app/entities/task.entity';
import { Organization } from './src/app/entities/organization.entity';

describe('TasksController', () => {
  let controller: TasksController;
  let service: TasksService;

  const tasksServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        { provide: TasksService, useValue: tasksServiceMock },
        { provide: getRepositoryToken(Task), useValue: {} },
        { provide: getRepositoryToken(Organization), useValue: {} },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
    service = module.get<TasksService>(TasksService);
  });

  it('should call create on service', async () => {
    tasksServiceMock.create.mockResolvedValue({ id: 1 });

    const result = await controller.create(
      { title: 'Test', status: TaskStatus.TODO, category: TaskCategory.WORK, organizationId: 1 },
      { user: { id: 1 } } as any,
    );

    expect(service.create).toHaveBeenCalled();
    expect(result).toEqual({ id: 1 });
  });

  it('should call findAll on service', async () => {
    tasksServiceMock.findAll.mockResolvedValue([]);

    const result = await controller.findAll({ user: { id: 1 } } as any);

    expect(service.findAll).toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it('should call update on service', async () => {
    tasksServiceMock.update.mockResolvedValue({ id: 1, title: 'Updated' });

    const result = await controller.update(
      '1',
      { title: 'Updated' },
      { user: { id: 1 } } as any,
    );

    expect(service.update).toHaveBeenCalledWith(1, { title: 'Updated' }, { id: 1 });
    expect(result).toEqual({ id: 1, title: 'Updated' });
  });

  it('should call remove on service', async () => {
    tasksServiceMock.remove.mockResolvedValue(undefined);

    const result = await controller.remove('1', { user: { id: 1 } } as any);

    expect(service.remove).toHaveBeenCalledWith(1, { id: 1 });
    expect(result).toBeUndefined();
  });
});
