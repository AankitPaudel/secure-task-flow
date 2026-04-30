import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { TaskCategory, TaskStatus, UserRole } from '@secure-task-flow/data';
import { DashboardComponent } from './dashboard.component';
import { AuthService } from '../services/auth.service';
import { TaskService, Task } from '../services/task.service';
import { AuditService } from '../services/audit.service';

describe('DashboardComponent', () => {
  let authService: AuthService;
  let taskService: TaskService;

  const mockTasks: Task[] = [
    {
      id: 1,
      title: 'Work task',
      description: 'Important work task',
      status: TaskStatus.TODO,
      category: TaskCategory.WORK,
      createdById: 1,
      organizationId: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 2,
      title: 'Personal task',
      description: 'Relax',
      status: TaskStatus.DONE,
      category: TaskCategory.PERSONAL,
      createdById: 1,
      organizationId: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  beforeEach(async () => {
    const authServiceMock = {
      getCurrentUser: vi.fn(),
      logout: vi.fn(),
    } as Partial<AuthService> as AuthService;
    const taskServiceMock = {
      getTasks: vi.fn(),
      createTask: vi.fn(),
      updateTask: vi.fn(),
      deleteTask: vi.fn(),
    } as Partial<TaskService> as TaskService;
    const auditServiceMock = {
      getAuditLogs: vi.fn(),
    } as Partial<AuditService> as AuditService;

    (authServiceMock.getCurrentUser as any).mockReturnValue({
      id: 1,
      email: 'owner@acme.com',
      name: 'John Owner',
      role: UserRole.OWNER,
      organizationId: 1,
    } as any);

    (taskServiceMock.getTasks as any).mockReturnValue(of(mockTasks));
    (auditServiceMock.getAuditLogs as any).mockReturnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: TaskService, useValue: taskServiceMock },
        { provide: AuditService, useValue: auditServiceMock },
      ],
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    taskService = TestBed.inject(TaskService);
  });

  it('should load and organize tasks on init', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;

    component.ngOnInit();

    expect(taskService.getTasks).toHaveBeenCalled();
    expect(component.todoTasks.length).toBe(1);
    expect(component.doneTasks.length).toBe(1);
  });

  it('should filter tasks by category', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;

    component.ngOnInit();
    component.filterCategory = TaskCategory.WORK;
    component.organizeTasks(mockTasks);

    expect(component.todoTasks.length).toBe(1);
    expect(component.todoTasks[0].category).toBe(TaskCategory.WORK);
    expect(component.doneTasks.length).toBe(0);
  });

  it('should filter tasks by search query', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;

    component.ngOnInit();
    component.searchQuery = 'relax';
    component.organizeTasks(mockTasks);

    expect(component.doneTasks.length).toBe(1);
    expect(component.doneTasks[0].title).toBe('Personal task');
  });
});

