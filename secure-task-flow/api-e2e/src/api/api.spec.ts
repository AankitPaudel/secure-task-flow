import axios from 'axios';
import { TaskCategory, TaskStatus } from '@secure-task-flow/data';

describe('GET /api', () => {
  it('should return a message', async () => {
    const res = await axios.get(`/api`);

    expect(res.status).toBe(200);
    expect(res.data).toEqual({ message: 'Hello API' });
  });
});

describe('Auth + Tasks flow', () => {
  it('should login and fetch tasks', async () => {
    const loginRes = await axios.post(`/api/auth/login`, {
      email: 'owner@acme.com',
      password: 'password123',
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.data.access_token).toBeTruthy();

    const token = loginRes.data.access_token;
    const tasksRes = await axios.get(`/api/tasks`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(tasksRes.status).toBe(200);
    expect(Array.isArray(tasksRes.data)).toBe(true);
  });

  it('should allow an owner to create, update, audit, and delete a task', async () => {
    const loginRes = await axios.post(`/api/auth/login`, {
      email: 'owner@acme.com',
      password: 'password123',
    });

    const token = loginRes.data.access_token;
    const title = `E2E Portfolio Task ${Date.now()}`;

    const createRes = await axios.post(
      `/api/tasks`,
      {
        title,
        description: 'Created by API e2e coverage',
        status: TaskStatus.TODO,
        category: TaskCategory.WORK,
        organizationId: loginRes.data.user.organizationId,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    expect(createRes.status).toBe(201);
    expect(createRes.data.title).toBe(title);

    const taskId = createRes.data.id;
    const updateRes = await axios.put(
      `/api/tasks/${taskId}`,
      {
        status: TaskStatus.DONE,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    expect(updateRes.status).toBe(200);
    expect(updateRes.data.status).toBe(TaskStatus.DONE);

    const auditRes = await axios.get(`/api/audit-log`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(auditRes.status).toBe(200);
    expect(Array.isArray(auditRes.data)).toBe(true);
    expect(auditRes.data.some((log) => log.resource === 'Task')).toBe(true);

    const deleteRes = await axios.delete(`/api/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(deleteRes.status).toBe(200);
  });

  it('should prevent a viewer from mutating tasks', async () => {
    const loginRes = await axios.post(`/api/auth/login`, {
      email: 'viewer@acme.com',
      password: 'password123',
    });

    const token = loginRes.data.access_token;

    await expect(
      axios.post(
        `/api/tasks`,
        {
          title: 'Viewer should not create this',
          status: TaskStatus.TODO,
          category: TaskCategory.PERSONAL,
          organizationId: loginRes.data.user.organizationId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      ),
    ).rejects.toMatchObject({
      response: {
        status: 403,
      },
    });
  });
});
