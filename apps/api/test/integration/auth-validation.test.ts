import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';

const app = createApp();

describe('POST /api/v1/auth/login validation', () => {
  it('rejects a missing password with a 400 validation error', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'someone@atyantik.com' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects a malformed email with a 400 validation error', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'not-an-email', password: 'whatever' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('protected routes without a token', () => {
  it('returns 401 for GET /api/v1/employees', async () => {
    const res = await request(app).get('/api/v1/employees');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 for GET /api/v1/auth/me', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });
});
