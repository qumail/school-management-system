// tests/jest.setup.js
// This file runs FIRST, before any tests or imports
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';

console.log('\n🔧 JEST SETUP: Environment configured');