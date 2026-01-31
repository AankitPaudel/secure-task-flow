import axios from 'axios';

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
});
