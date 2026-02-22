// tests/setup.js
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const path = require('path');

let mongoServer;

// This runs once before all tests
beforeAll(async () => {
  console.log('\n' + '='.repeat(60));
  console.log('🔧 SETUP: Starting MongoDB Memory Server');
  console.log('='.repeat(60));
  
  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  console.log(`📦 MongoDB URI: ${mongoUri}`);
  
  // Connect to test database
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to test database');
  
  // Load schemas directly (no need for loadSchema function)
  console.log('\n📚 Loading schemas...');
  
  const userSchema = require('../managers/entities/auth/auth.mongoModel');
  const schoolSchema = require('../managers/entities/school/school.mongoModel');
  const classroomSchema = require('../managers/entities/classroom/classroom.mongoModel');
  const studentSchema = require('../managers/entities/student/student.mongoModel');
  
  console.log('   ✅ User schema loaded');
  console.log('   ✅ School schema loaded');
  console.log('   ✅ Classroom schema loaded');
  console.log('   ✅ Student schema loaded');
  
  // Register models
  console.log('\n🏗️ Registering models...');

  mongoose.model('User', userSchema);  // Add this for auth.manager.js
  console.log('   ✅ Registered User');
  
  mongoose.model('Auth', userSchema);
  console.log('   ✅ Registered Auth');
  
  mongoose.model('School', schoolSchema);
  console.log('   ✅ Registered School');
  
  mongoose.model('Classroom', classroomSchema);
  console.log('   ✅ Registered Classroom');
  
  mongoose.model('Student', studentSchema);
  console.log('   ✅ Registered Student');
  
  console.log('\n✅ All models registered:', Object.keys(mongoose.models).join(', '));
  console.log('='.repeat(60) + '\n');
});

// tests/setup.js - Update the afterEach section

// tests/setup.js - Alternative approach using model names

afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    // Get all registered model names
    const modelNames = Object.keys(mongoose.models);
    
    console.log('📋 Registered models:', modelNames);
    
    for (const modelName of modelNames) {
      try {
        const Model = mongoose.models[modelName];
        await Model.deleteMany({});
        console.log(`   🧹 Cleared ${modelName} collection`);
      } catch (error) {
        console.log(`   ⚠️ Could not clear ${modelName}:`, error.message);
      }
    }
    console.log('✅ All model collections cleared');
  }
});

afterAll(async () => {
  console.log('\n' + '='.repeat(60));
  console.log('🔧 TEARDOWN');
  console.log('='.repeat(60));
  
  await mongoose.disconnect();
  await mongoServer.stop();
  
  console.log('✅ Test database disconnected');
  console.log('='.repeat(60) + '\n');
});

// Helper to get models
const getModel = (modelName) => {
  if (!mongoose.models[modelName]) {
    throw new Error(`Model ${modelName} not registered. Available: ${Object.keys(mongoose.models).join(', ')}`);
  }
  return mongoose.models[modelName];
};

module.exports = { getModel };