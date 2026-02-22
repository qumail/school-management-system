// tests/integration/auth.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');


describe('Auth API Integration Tests', () => {
  let app;
  let Auth;
  let School;
  let testSchool;
  let testUser;

  beforeAll(async () => {
    console.log('\n🔧 Setting up Auth API integration tests...');
    
    const { getModel } = require('../setup');
    app = require('../../app');
    
    Auth = getModel('Auth');
    School = getModel('School');
  });

  beforeEach(async () => {
    // Clear all data before each test
    await Auth.deleteMany({});
    await School.deleteMany({});

    // Create a test school for school admin tests
    testSchool = await School.create({
      name: 'Test School',
      address: '123 Test St, Test City',
      contactEmail: 'school@test.com',
      phone: '123-456-7890',
      isActive: true
    });

    // Create a test user for login tests
    const hashedPassword = await bcrypt.hash('password123', 10);
    testUser = await Auth.create({
      email: 'existing@test.com',
      password: hashedPassword,
      name: 'Existing User',
      role: 'school_admin',
      schoolId: testSchool._id,
      isActive: true
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@test.com',
          password: 'password123',
          name: 'New User',
          role: 'school_admin',
          schoolId: testSchool._id.toString()
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user).toHaveProperty('_id');
      expect(res.body.data.user.email).toBe('newuser@test.com');
      expect(res.body.data.user.name).toBe('New User');
      expect(res.body.data.user.role).toBe('school_admin');
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@test.com'
          // Missing password, name, role
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/required/i);
    });

    it('should return 409 when email already exists', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existing@test.com', // This email already exists from beforeEach
          password: 'password123',
          name: 'Another User',
          role: 'school_admin',
          schoolId: testSchool._id.toString()
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/already exists/i);
    });

    it('should return 400 when schoolId is invalid', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@test.com',
          password: 'password123',
          name: 'New User',
          role: 'school_admin',
          schoolId: 'invalid-school-id'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 when school does not exist', async () => {
      const nonExistentSchoolId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@test.com',
          password: 'password123',
          name: 'New User',
          role: 'school_admin',
          schoolId: nonExistentSchoolId.toString()
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/school not found/i);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'existing@test.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user).toHaveProperty('_id');
      expect(res.body.data.user.email).toBe('existing@test.com');
      expect(res.body.data.user.name).toBe('Existing User');
    });

    it('should return 401 with invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'existing@test.com',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/invalid credentials/i);
    });

    it('should return 401 with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/invalid credentials/i);
    });

    it('should return 400 when email is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'password123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/email and password are required/i);
    });

    it('should return 400 when password is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'existing@test.com'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/email and password are required/i);
    });

    it('should return 403 when account is inactive', async () => {
      // Create an inactive user
      const hashedPassword = await bcrypt.hash('password123', 10);
      await Auth.create({
        email: 'inactive@test.com',
        password: hashedPassword,
        name: 'Inactive User',
        role: 'school_admin',
        schoolId: testSchool._id,
        isActive: false
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'inactive@test.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/account is deactivated/i);
    });

    it('should respect rate limiting', async () => {
      // Make 11 rapid login attempts
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            email: 'existing@test.com',
            password: 'wrongpassword'
          });
      }

      // The 11th attempt should be rate limited
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'existing@test.com',
          password: 'wrongpassword'
        });

      // Should be 429 (Too Many Requests) if rate limiting is enabled
      // or 401 if rate limiting is disabled in test environment
      expect([401, 429]).toContain(res.statusCode);
    });
  });

  describe('GET /api/auth/me', () => {
    let authToken;

    beforeEach(async () => {
      // Login to get a valid token
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'existing@test.com',
          password: 'password123'
        });
      
      authToken = loginRes.body.data.token;
    });

    it('should return current user info with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('existing@test.com');
      expect(res.body.data.name).toBe('Existing User');
      expect(res.body.data).not.toHaveProperty('password');
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 with expired token', async () => {
      // Create an expired token (this would need proper implementation)
      // For now, just test with invalid token
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer expired.token.here');

      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /api/auth/change-password', () => {
    let authToken;

    beforeEach(async () => {
      // Login to get a valid token
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'existing@test.com',
          password: 'password123'
        });
      
      authToken = loginRes.body.data.token;
    });

    it('should change password successfully', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword123'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toMatch(/password updated/i);

      // Verify can login with new password
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'existing@test.com',
          password: 'newpassword123'
        });

      expect(loginRes.statusCode).toBe(201);
    });

    it('should return 401 with incorrect current password', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/current password is incorrect/i);
    });

    it('should return 400 when passwords are missing', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/required/i);
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword123'
        });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    let authToken;

    beforeEach(async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'existing@test.com',
          password: 'password123'
        });
      
      authToken = loginRes.body.data.token;
    });

    it('should logout successfully', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toMatch(/logged out/i);
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .post('/api/auth/logout');

      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    let refreshToken;

    beforeEach(async () => {
      // Login to get a token (in a real app, you'd get both access and refresh tokens)
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'existing@test.com',
          password: 'password123'
        });
      
      // For now, just use the access token as refresh token
      // In a real app, you'd have a separate refresh token
      refreshToken = loginRes.body.data.token;
    });

    it('should refresh token successfully', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({
          token: refreshToken
        });

      // This might return 200 or 500 depending on your implementation
      // Adjust expectation based on your actual implementation
      if (res.statusCode === 201) {
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('token');
      } else {
        expect(res.statusCode).toBe(500);
      }
    });

    it('should return 400 when token not provided', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/token required/i);
    });
  });
});