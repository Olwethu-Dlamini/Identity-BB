const request = require('supertest');
const app = require('../server');
const { db } = require('../src/config/database');

describe('Enhanced Auth Endpoints', () => {
  beforeAll(async () => {
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  afterAll(async () => {
    await db.close();
  });

  describe('POST /api/auth/register', () => {
    test('should register a new user with strong password', async () => {
      const userData = {
        nationalId: '199012345679',
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'StrongPass123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.nationalId).toBe(userData.nationalId);
      expect(response.body.data.accessToken).toBeDefined();
    });

    test('should reject weak password', async () => {
      const userData = {
        nationalId: '199012345680',
        name: 'Bob Smith',
        email: 'bob@example.com',
        password: 'weak'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should reject invalid national ID', async () => {
      const userData = {
        nationalId: '1234', // Too short
        name: 'Invalid User',
        email: 'invalid@example.com',
        password: 'StrongPass123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    test('should login with valid credentials', async () => {
      const loginData = {
        nationalId: '199012345678',
        password: 'Test123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.user.nationalId).toBe(loginData.nationalId);
    });

    test('should fail with invalid credentials', async () => {
      const loginData = {
        nationalId: '199012345678',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should fail with non-existent user', async () => {
      const loginData = {
        nationalId: '999999999999',
        password: 'Test123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/users/profile', () => {
    let accessToken;

    beforeAll(async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          nationalId: '199012345678',
          password: 'Test123!'
        });

      accessToken = loginResponse.body.data.accessToken;
    });

    test('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.nationalId).toBe('199012345678');
    });

    test('should fail without token', async () => {
      const response = await request(app)
        .get('/api/users/profile');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('GET /health', () => {
    test('should return healthy status', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
    });
  });
});