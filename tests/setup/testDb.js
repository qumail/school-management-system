// tests/setup/testDb.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Lazy model getters - they only try to get the model when called
// const getModel = (modelName) => {
//   try {
//     return mongoose.model(modelName);
//   } catch (error) {
//     console.error(`❌ Model ${modelName} not available yet. Available models:`, mongoose.modelNames());
//     throw new Error(`Model ${modelName} not registered. Make sure setup.js runs first.`);
//   }
// };
// Import getModel from the main setup file
const { getModel } = require('../setup');

// Test data factories - these will be exported as functions that use the models
const createTestUser = async (overrides = {}) => {
  const User = getModel('Auth');
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const defaultUser = {
    email: 'test@example.com',
    password: hashedPassword,
    name: 'User',
    role: 'school_admin',
    schoolId: new mongoose.Types.ObjectId(),
    isActive: true
  };

  return await User.create({ ...defaultUser, ...overrides });
};

const createTestSchool = async (overrides = {}) => {
  const School = getModel('School');
  
  const defaultSchool = {
    name: 'Test School',
    address: 'Test Address',
    contactEmail: 'school@test.com',
    phone: '123-456-7890',
    isActive: true
  };

  return await School.create({ ...defaultSchool, ...overrides });
};

const createTestClassroom = async (schoolId, overrides = {}) => {
  const Classroom = getModel('Classroom');
  
  const defaultClassroom = {
    name: 'Test Classroom',
    capacity: 30,
    grade: '10',
    section: 'A',
    resources: ['projector', 'smartboard'],
    school: schoolId,
    isActive: true
  };

  return await Classroom.create({ ...defaultClassroom, ...overrides });
};

const createTestStudent = async (schoolId, classroomId = null, overrides = {}) => {
  const Student = getModel('Student');
  
  const defaultStudent = {
    name: 'John',
    email: 'john.doe@example.com',
    dateOfBirth: new Date('2010-01-01'),
    gender: 'male',
    school: schoolId,
    classroom: classroomId,
    isActive: true
  };

  return await Student.create({ ...defaultStudent, ...overrides });
};

const generateTestToken = (user) => {
  return jwt.sign(
    { 
      userId: user._id, 
      email: user.email, 
      role: user.role,
      schoolId: user.schoolId 
    },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

// Export the factory functions
module.exports = {
  createTestUser,
  createTestSchool,
  createTestClassroom,
  createTestStudent,
  generateTestToken
};