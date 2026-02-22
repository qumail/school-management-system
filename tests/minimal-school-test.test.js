// tests/minimal-school-test.js
const request = require('supertest');
const mongoose = require('mongoose');

// Silence all console logs temporarily
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Only show errors and our specific markers
console.log = (...args) => {
  if (args[0]?.includes('🔍') || args[0]?.includes('✅') || args[0]?.includes('❌')) {
    originalConsoleLog(...args);
  }
};
console.warn = () => {};
// Keep errors visible
// console.error = () => {};

describe('🔍 MINIMAL SCHOOL TEST', () => {
  let app;
  let School;
  let Auth;
  let token;

  beforeAll(async () => {
    console.log('\n🔍 TEST SETUP STARTING...');
    
    // Get models after setup
    const { getModel } = require('./setup');
    School = getModel('School');
    Auth = getModel('Auth');
    
    console.log('✅ Models retrieved:', { 
      School: !!School, 
      Auth: !!Auth,
      schoolFind: typeof School?.find
    });

    // Force reload app
    const appPath = require.resolve('../app');
    delete require.cache[appPath];
    app = require('../app');
    
    console.log('✅ App reloaded');

    // Create a test user
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const user = await Auth.create({
      email: 'test@test.com',
      password: hashedPassword,
      name: 'Test User',
      role: 'superadmin',
      isActive: true
    });
    
    const jwt = require('jsonwebtoken');
    token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'test-secret'
    );

    // Create a test school
    await School.create({
      name: 'Test School',
      address: '123 Test St',
      contactEmail: 'test@school.com',
      isActive: true
    });

    console.log('✅ Test data created');
  });

  it('should list schools', async () => {
    console.log('\n📡 Making request to /api/schools...');
    
    const res = await request(app)
      .get('/api/schools')
      .set('Authorization', `Bearer ${token}`);

    console.log('Response status:', res.statusCode);
    console.log('Response body:', JSON.stringify(res.body, null, 2));

    expect(res.statusCode).toBe(200);
  });

  afterAll(() => {
    // Restore console functions
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  });
});