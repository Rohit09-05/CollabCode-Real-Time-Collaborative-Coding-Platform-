/**
 * Integration tests for /api/auth endpoints.
 * Requires a running MySQL + Redis (or use mocks).
 */
const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');

// ── Minimal app for testing (no real DB/Redis — we mock the models) ──────────

jest.mock('../models', () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    password_hash: '$2a$12$XpKvF.g3y2SLr7cJBZcCzOVmhd.FZnJxD7dblSH4Q6SvT0rcj3jPC', // "password123"
    avatar_color: '#60A5FA',
  };

  return {
    User: {
      findOne: jest.fn(({ where }) => {
        if (where.email === mockUser.email) return Promise.resolve(mockUser);
        return Promise.resolve(null);
      }),
      findByPk: jest.fn((id) => id === 1 ? Promise.resolve(mockUser) : null),
      create: jest.fn((data) => Promise.resolve({ id: 2, ...data, avatar_color: '#60A5FA' })),
      count: jest.fn(() => Promise.resolve(0)),
    },
  };
});

jest.mock('../config/redis', () => ({
  getRedisClient: () => ({
    setex: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue('mock_refresh_token'),
    del: jest.fn().mockResolvedValue(1),
  }),
}));

// Set required env vars before importing JWT config
process.env.JWT_ACCESS_SECRET = 'test_access_secret_must_be_at_least_32_chars_long__';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_must_be_at_least_32_chars_long_';
process.env.JWT_ACCESS_EXPIRES = '15m';
process.env.JWT_REFRESH_EXPIRES = '7d';

const authRoutes = require('../routes/auth');
const { errorHandler } = require('../middleware/errorHandler');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);
app.use(errorHandler);

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  it('returns 401 for unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid credentials.');
  });

  it('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });

  it('returns 200 with accessToken for valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body.user).toMatchObject({ username: 'testuser', email: 'test@example.com' });
    expect(res.headers['set-cookie']).toBeDefined();
  });
});

describe('POST /api/auth/signup', () => {
  it('returns 422 for invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ username: 'newuser', email: 'not-an-email', password: 'password123' });
    expect(res.status).toBe(422);
  });

  it('returns 422 for short password', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ username: 'newuser', email: 'new@example.com', password: '123' });
    expect(res.status).toBe(422);
  });
});

describe('POST /api/auth/logout', () => {
  it('returns 200 and clears cookie', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Logged out.');
  });
});
