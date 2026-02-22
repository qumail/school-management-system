// tests/debug-model-exports.js
process.env.NODE_ENV = 'test';
console.log('NODE_ENV =', process.env.NODE_ENV);

const path = require('path');

const models = [
  { name: 'User', folder: 'auth', file: 'auth.mongoModel.js' },
  { name: 'School', folder: 'school', file: 'school.mongoModel.js' },
  { name: 'Classroom', folder: 'classroom', file: 'classroom.mongoModel.js' },
  { name: 'Student', folder: 'student', file: 'student.mongoModel.js' }
];

console.log('\n🔍 Debugging Model Exports');
console.log('==========================\n');

models.forEach(({ name, folder, file }) => {
  try {
    const modelPath = path.join(__dirname, '..', 'managers', 'entities', folder, file);
    console.log(`📁 ${name}:`);
    console.log(`   Path: ${modelPath}`);
    
    const exported = require(modelPath);
    
    console.log(`   Type: ${typeof exported}`);
    console.log(`   Constructor: ${exported?.constructor?.name || 'N/A'}`);
    console.log(`   Has obj property: ${!!exported?.obj}`);
    console.log(`   Has schema property: ${!!exported?.schema}`);
    console.log(`   Is Mongoose Schema: ${exported instanceof require('mongoose').Schema}`);
    
    // Show keys if it's an object
    if (typeof exported === 'object' && exported !== null) {
      console.log(`   Keys: ${Object.keys(exported).join(', ')}`);
    }
  } catch (error) {
    console.log(`   ❌ Error:`, error.message);
  }
  console.log();
});