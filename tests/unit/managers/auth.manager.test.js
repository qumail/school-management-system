// tests/unit/managers/auth.manager.test.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Mock dependencies
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('Auth Manager Unit Tests', () => {
  let authManager;
  let mockUserModel;
  let mockInjectables;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock User model
    mockUserModel = {
      findOne: jest.fn(),
      create: jest.fn(),
      findById: jest.fn()
    };

    mockInjectables = {
      mongomodels: { User: mockUserModel },
      config: { dotEnv: { JWT_SECRET: 'test-secret' } }
    };

    // Import the manager (you'll need to adjust the path)
    authManager = require('../../managers/entities/auth/Auth.manager')(mockInjectables);
  });

  describe('login', () => {
    it('should return token and user on successful login', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        password: 'hashedPassword',
        role: 'school_admin',
        schoolId: 'school123',
        isActive: true,
        save: jest.fn()
      };

      mockUserModel.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('generated-token');

      const result = await authManager.login({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(result).toHaveProperty('token', 'generated-token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('test@example.com');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should throw error for invalid credentials', async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      await expect(authManager.login({
        email: 'wrong@example.com',
        password: 'password123'
      })).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for wrong password', async () => {
      const mockUser = {
        email: 'test@example.com',
        password: 'hashedPassword'
      };

      mockUserModel.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      await expect(authManager.login({
        email: 'test@example.com',
        password: 'wrongpassword'
      })).rejects.toThrow('Invalid credentials');
    });
  });

  describe('register', () => {
    it('should create new user and return token', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashedPassword');
      
      const mockCreatedUser = {
        _id: 'user123',
        email: 'new@example.com',
       // firstName: 'New',
        name: 'User',
        role: 'school_admin',
        schoolId: 'school123'
      };
      
      mockUserModel.create.mockResolvedValue(mockCreatedUser);
      jwt.sign.mockReturnValue('generated-token');

      const result = await authManager.register({
        email: 'new@example.com',
        password: 'password123',
      //  firstName: 'New',
        name: 'User',
        role: 'school_admin',
        schoolId: 'school123'
      });

      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe('new@example.com');
      expect(mockUserModel.create).toHaveBeenCalled();
    });

    it('should throw error if email exists', async () => {
      mockUserModel.findOne.mockResolvedValue({ email: 'existing@example.com' });

      await expect(authManager.register({
        email: 'existing@example.com',
        password: 'password123'
      })).rejects.toThrow('already exists');
    });
  });
});