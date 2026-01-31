import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TaskService } from './task.service';

describe('TaskService', () => {
  let service: TaskService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TaskService],
    });

    service = TestBed.inject(TaskService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch tasks', () => {
    service.getTasks().subscribe((tasks) => {
      expect(tasks.length).toBe(1);
    });

    const req = httpMock.expectOne('http://localhost:3000/api/tasks');
    expect(req.request.method).toBe('GET');
    req.flush([
      {
        id: 1,
        title: 'Task',
        status: 'todo',
        category: 'Work',
        createdById: 1,
        organizationId: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
  });

  it('should update task via PUT', () => {
    service.updateTask(1, { status: 'done' }).subscribe((task) => {
      expect(task.status).toBe('done');
    });

    const req = httpMock.expectOne('http://localhost:3000/api/tasks/1');
    expect(req.request.method).toBe('PUT');
    req.flush({
      id: 1,
      title: 'Task',
      status: 'done',
      category: 'Work',
      createdById: 1,
      organizationId: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });
});
