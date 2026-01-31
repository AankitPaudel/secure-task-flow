import { Test, TestingModule } from '@nestjs/testing';
import { AuditController } from './src/app/audit/audit.controller';
import { AuditService } from './src/app/audit/audit.service';

describe('AuditController', () => {
  let controller: AuditController;
  let service: AuditService;

  const auditServiceMock = {
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [{ provide: AuditService, useValue: auditServiceMock }],
    }).compile();

    controller = module.get<AuditController>(AuditController);
    service = module.get<AuditService>(AuditService);
  });

  it('should call findAll on service', async () => {
    auditServiceMock.findAll.mockResolvedValue([{ id: 1 }]);

    const result = await controller.findAll({ user: { id: 1 } } as any);

    expect(service.findAll).toHaveBeenCalledWith({ id: 1 });
    expect(result).toEqual([{ id: 1 }]);
  });
});
