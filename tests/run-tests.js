// tests/run-tests.js
const { exec } = require('child_process');
const path = require('path');

console.log('🧪 Running School Management System Tests');
console.log('========================================\n');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_ISSUER = 'test-issuer';
process.env.JWT_AUDIENCE = 'test-audience';

// Run Jest
const jestProcess = exec('npx jest --runInBand --detectOpenHandles', {
  cwd: path.join(__dirname, '..')
});

jestProcess.stdout.on('data', (data) => {
  console.log(data);
});

jestProcess.stderr.on('data', (data) => {
  console.error(data);
});

jestProcess.on('close', (code) => {
  console.log(`\n📊 Test process exited with code ${code}`);
});